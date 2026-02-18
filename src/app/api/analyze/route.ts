import { client } from '@/lib/claude';
import { createClient } from '@/lib/supabase/server';
import { V2_SYSTEM_PROMPT, buildV2Messages } from '@/lib/prompts-v1';
import type { ClarificationQuestion, ConsultationPolicy, PolicyChallenge, PolicyRule, Reflection, V2AnalysisResponse } from '@/lib/types';

export const dynamic = 'force-dynamic';

interface RequestBody {
    agentId: string;
    userMessage: string;
    currentPolicy: ConsultationPolicy | null;
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
    isOnboarding: boolean;
}

function stripCodeFence(text: string): string {
    const trimmed = text.trim();
    if (!trimmed.startsWith('```')) return trimmed;
    return trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
}

function extractFirstJsonObject(text: string): string | null {
    const start = text.indexOf('{');
    if (start === -1) return null;

    let depth = 0;
    let inString = false;
    let escaped = false;

    for (let i = start; i < text.length; i++) {
        const ch = text[i]!;

        if (inString) {
            if (escaped) {
                escaped = false;
                continue;
            }
            if (ch === '\\') {
                escaped = true;
                continue;
            }
            if (ch === '"') {
                inString = false;
            }
            continue;
        }

        if (ch === '"') {
            inString = true;
            continue;
        }

        if (ch === '{') {
            depth += 1;
        } else if (ch === '}') {
            depth -= 1;
            if (depth === 0) {
                return text.slice(start, i + 1);
            }
        }
    }

    return null;
}

function parseStructuredResponse(text: string): V2AnalysisResponse | null {
    const trimmed = text.trim();
    if (!trimmed) return null;

    const directCandidates = [trimmed, stripCodeFence(trimmed)];
    for (const candidate of directCandidates) {
        if (!candidate) continue;
        try {
            return JSON.parse(candidate) as V2AnalysisResponse;
        } catch {
            // Try next strategy
        }
    }

    const extracted = extractFirstJsonObject(trimmed);
    if (extracted) {
        try {
            return JSON.parse(stripCodeFence(extracted)) as V2AnalysisResponse;
        } catch {
            // No recoverable JSON object
        }
    }

    return null;
}

export async function POST(req: Request) {
    // Verify authentication
    const supabase = await createClient();
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    const body = (await req.json()) as RequestBody;
    const { userMessage, currentPolicy, conversationHistory, isOnboarding } = body;

    const messages = buildV2Messages(conversationHistory, userMessage, currentPolicy, isOnboarding);

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
        async start(controller) {
            try {
                const response = await client.messages.create({
                    model: 'claude-sonnet-4-5-20250929',
                    max_tokens: 3000,
                    system: [
                        {
                            type: 'text',
                            text: V2_SYSTEM_PROMPT,
                            cache_control: { type: 'ephemeral' },
                        },
                    ],
                    messages,
                    stream: true,
                });

                let fullText = '';
                let hitJsonDelimiter = false;
                let sentThinkingLength = 0;
                const DELIMITER = '---JSON---';

                for await (const event of response) {
                    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
                        fullText += event.delta.text;

                        if (!hitJsonDelimiter) {
                            const delimiterIndex = fullText.indexOf(DELIMITER);
                            if (delimiterIndex === -1) {
                                // Check if the tail could be a prefix of the delimiter — hold it back
                                let safeLength = fullText.length;
                                for (let i = 1; i <= Math.min(DELIMITER.length, fullText.length); i++) {
                                    if (DELIMITER.startsWith(fullText.slice(-i))) {
                                        safeLength = fullText.length - i;
                                        break;
                                    }
                                }

                                const newThinking = fullText.substring(sentThinkingLength, safeLength);
                                if (newThinking) {
                                    controller.enqueue(
                                        encoder.encode(
                                            `data: ${JSON.stringify({ type: 'thinking', content: newThinking })}\n\n`
                                        )
                                    );
                                    sentThinkingLength = safeLength;
                                }
                            } else {
                                // Just crossed the delimiter — send any remaining pre-delimiter text
                                hitJsonDelimiter = true;
                                const remaining = fullText.substring(sentThinkingLength, delimiterIndex);
                                if (remaining.trim()) {
                                    controller.enqueue(
                                        encoder.encode(
                                            `data: ${JSON.stringify({ type: 'thinking', content: remaining })}\n\n`
                                        )
                                    );
                                }
                                // Tell the client we're now generating the structured policy
                                controller.enqueue(
                                    encoder.encode(
                                        `data: ${JSON.stringify({ type: 'status', content: 'Structuring policy...' })}\n\n`
                                    )
                                );
                            }
                        }
                    }
                }

                // Parse the final JSON from the complete response. Be tolerant of minor format drift.
                const delimiterIndex = fullText.indexOf(DELIMITER);
                const jsonTail =
                    delimiterIndex >= 0
                        ? fullText.slice(delimiterIndex + DELIMITER.length).trim()
                        : '';

                const parsedFromTail = parseStructuredResponse(jsonTail);
                const parsed = parsedFromTail ?? parseStructuredResponse(fullText);

                if (parsed) {
                    // Ensure arrays exist and IDs are set
                    parsed.reflections = (parsed.reflections ?? []).map((r: Reflection) => ({
                        ...r,
                        id: r.id ?? crypto.randomUUID(),
                    }));
                    parsed.challenges = (parsed.challenges ?? []).map((c: PolicyChallenge) => ({
                        ...c,
                        id: c.id ?? crypto.randomUUID(),
                    }));

                    // Normalize nextQuestions: support both singular (legacy) and plural
                    const raw = parsed as unknown as Record<string, unknown>;
                    const rawQuestions: ClarificationQuestion[] = [];
                    if (Array.isArray(parsed.nextQuestions)) {
                        rawQuestions.push(...parsed.nextQuestions);
                    } else if (raw.nextQuestion) {
                        rawQuestions.push(raw.nextQuestion as ClarificationQuestion);
                    }
                    // Enforce single-question flow even if the model returns multiple.
                    parsed.nextQuestions = rawQuestions.slice(0, 1).map((nq) => ({
                        ...nq,
                        id: nq.id ?? crypto.randomUUID(),
                        answered: false,
                    }));

                    // Ensure policy structure
                    if (parsed.policy) {
                        parsed.policy.version =
                            parsed.policy.version ?? (currentPolicy ? currentPolicy.version + 1 : 1);
                        parsed.policy.rules = (parsed.policy.rules ?? []).map((r: PolicyRule) => ({
                            ...r,
                            id: r.id ?? crypto.randomUUID(),
                            categoryType: r.categoryType ?? 'cancel',
                            macroCategory:
                                typeof r.macroCategory === 'string' && r.macroCategory.trim()
                                    ? r.macroCategory.trim()
                                    : undefined,
                        }));
                    }

                    controller.enqueue(
                        encoder.encode(`data: ${JSON.stringify({ type: 'result', data: parsed })}\n\n`)
                    );
                } else {
                    const parseFailureReason =
                        delimiterIndex >= 0
                            ? 'invalid_or_truncated_json'
                            : 'missing_json_delimiter_or_object';
                    console.error('Failed to recover structured JSON from Claude response.');
                    console.error('Parse failure reason:', parseFailureReason);
                    console.error('Delimiter present:', delimiterIndex >= 0);
                    console.error('Response head:', fullText.slice(0, 500));
                    controller.enqueue(
                        encoder.encode(
                            `data: ${JSON.stringify({
                                type: 'error',
                                message: `Failed to parse AI response format (${parseFailureReason})`,
                            })}\n\n`
                        )
                    );
                }

                controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            } catch (err) {
                console.error('Claude API error:', err);
                controller.enqueue(
                    encoder.encode(
                        `data: ${JSON.stringify({ type: 'error', message: 'AI service error' })}\n\n`
                    )
                );
            } finally {
                controller.close();
            }
        },
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
        },
    });
}
