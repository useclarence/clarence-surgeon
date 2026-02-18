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

                // Parse the final JSON from the complete response
                const jsonMatch = fullText.split('---JSON---');
                if (jsonMatch.length > 1) {
                    const jsonStr = jsonMatch[1]!.trim();
                    try {
                        const parsed = JSON.parse(jsonStr) as V2AnalysisResponse;

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
                        parsed.nextQuestions = rawQuestions.map((nq) => ({
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
                            }));
                        }

                        controller.enqueue(
                            encoder.encode(`data: ${JSON.stringify({ type: 'result', data: parsed })}\n\n`)
                        );
                    } catch (parseErr) {
                        console.error('Failed to parse Claude JSON response:', parseErr);
                        console.error('Raw JSON string:', jsonStr.slice(0, 500));
                        controller.enqueue(
                            encoder.encode(
                                `data: ${JSON.stringify({ type: 'error', message: 'Failed to parse AI response' })}\n\n`
                            )
                        );
                    }
                } else {
                    console.error('No ---JSON--- delimiter found in response');
                    console.error('Full response:', fullText.slice(0, 500));
                    controller.enqueue(
                        encoder.encode(
                            `data: ${JSON.stringify({ type: 'error', message: 'Unexpected AI response format' })}\n\n`
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
