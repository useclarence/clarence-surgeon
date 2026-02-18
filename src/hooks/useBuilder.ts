'use client';

import { useCallback, useEffect, useReducer, useRef } from 'react';
import type {
    Agent,
    BuilderAction,
    BuilderMessage,
    BuilderState,
    ClarificationQuestion,
    Reflection,
    V2AnalysisResponse,
} from '@/lib/types';

function getErrorStatus(error: unknown): number | null {
    if (typeof error === 'object' && error !== null && 'status' in error) {
        const status = (error as { status?: unknown }).status;
        if (typeof status === 'number') return status;
    }
    return null;
}

// ── Onboarding Questions ──

const ONBOARDING_QUESTIONS = [
    {
        intro: "Welcome! I'll help you formalize your consultation policy. Let's start with 3 questions to understand your practice.",
        question: 'Who do you need to see most urgently? (red flags, acute injuries, neurological emergencies...)',
    },
    {
        question: 'Are there any patients you should still see, but with less urgency?',
    },
    {
        question: 'Who should you absolutely not see, and where should they be redirected? (physiotherapy, pain management, another specialist...)',
    },
];

const FINAL_RULES_CHECK_ID = 'final_rules_check';
const FINAL_RULES_CHECK_QUESTION = 'Do you have anything else to add to your rules?';
const FINAL_RULES_CHECK_SUGGESTIONS = ['Yes', 'No'];

function makeFinalRulesCheckQuestion(): ClarificationQuestion {
    return {
        id: FINAL_RULES_CHECK_ID,
        question: FINAL_RULES_CHECK_QUESTION,
        suggestions: FINAL_RULES_CHECK_SUGGESTIONS,
        answered: false,
    };
}

function makeOnboardingMessage(step: 0 | 1 | 2): BuilderMessage {
    const q = ONBOARDING_QUESTIONS[step]!;
    const content = q.intro ? `${q.intro}\n\n**Question ${step + 1}/3:** ${q.question}` : `**Question ${step + 1}/3:** ${q.question}`;
    return {
        id: `onboarding-q${step}`,
        role: 'assistant',
        content,
        timestamp: Date.now(),
        isOnboarding: true,
    };
}

// ── Reducer ──

function builderReducer(state: BuilderState, action: BuilderAction): BuilderState {
    switch (action.type) {
        case 'START_RECORDING':
            return { ...state, status: 'recording' };
        case 'STOP_RECORDING':
            return { ...state, status: 'idle', interimText: '' };
        case 'SET_INTERIM_TEXT':
            return { ...state, interimText: action.text };
        case 'ADD_USER_MESSAGE':
            return { ...state, messages: [...state.messages, action.message] };
        case 'ADVANCE_ONBOARDING': {
            const nextStep = (state.onboardingStep as number) + 1;
            if (nextStep >= 3) {
                return { ...state, onboardingStep: 'complete' };
            }
            const nextQ = makeOnboardingMessage(nextStep as 0 | 1 | 2);
            return {
                ...state,
                onboardingStep: nextStep as 0 | 1 | 2,
                messages: [...state.messages, nextQ],
            };
        }
        case 'START_PROCESSING':
            return { ...state, status: 'processing', processingContext: action.context, streamingThought: '' };
        case 'APPEND_THINKING':
            return { ...state, streamingThought: state.streamingThought + action.text };
        case 'SET_THINKING':
            return { ...state, streamingThought: action.text };
        case 'PROCESSING_COMPLETE': {
            const isFirstPolicy = state.policy === null && action.policy !== null;
            return {
                ...state,
                status: 'idle',
                streamingThought: '',
                messages: [...state.messages, action.message],
                policy: action.policy ?? state.policy,
                showPolicyDrawer: isFirstPolicy ? true : state.showPolicyDrawer,
            };
        }
        case 'PROCESSING_ERROR':
            return { ...state, status: 'idle', streamingThought: '' };
        case 'ANSWER_CLARIFICATION':
            return {
                ...state,
                messages: state.messages.map((m) => {
                    if (m.id !== action.messageId || !m.clarifications) return m;
                    return {
                        ...m,
                        clarifications: m.clarifications.map((c) =>
                            c.id === action.clarificationId
                                ? { ...c, answered: true, answer: action.answer }
                                : c
                        ),
                    };
                }),
            };
        case 'TOGGLE_POLICY_DRAWER':
            return { ...state, showPolicyDrawer: !state.showPolicyDrawer };
        case 'SUBMIT_POLICY':
            return { ...state, submitted: true, status: 'idle' };
        default:
            return state;
    }
}

// ── Hook ──

export function useBuilder(agent: Agent) {
    // Determine onboarding state from saved data
    const hasHistory = agent.conversationHistory.length > 0;
    const onboardingComplete = agent.onboardingComplete;

    // Build initial messages: if fresh agent, inject first onboarding question
    const initialMessages: BuilderMessage[] = hasHistory
        ? agent.conversationHistory
        : [makeOnboardingMessage(0)];

    // Determine initial onboarding step
    let initialOnboardingStep: BuilderState['onboardingStep'] = 'complete';
    if (!onboardingComplete) {
        if (!hasHistory) {
            initialOnboardingStep = 0;
        } else {
            // Count user messages to determine which step we're on
            const userMsgCount = agent.conversationHistory.filter(
                (m) => m.role === 'user'
            ).length;
            initialOnboardingStep = userMsgCount >= 3 ? 'complete' : (Math.min(userMsgCount, 2) as 0 | 1 | 2);
        }
    }

    const initialState: BuilderState = {
        status: 'idle',
        processingContext: 'analyzing',
        messages: initialMessages,
        policy: agent.policy ?? null,
        onboardingStep: initialOnboardingStep,
        showPolicyDrawer: false,
        interimText: '',
        streamingThought: '',
        submitted: false,
    };

    const [state, dispatch] = useReducer(builderReducer, initialState);
    const stateRef = useRef(state);
    const processingRef = useRef(false);
    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        stateRef.current = state;
    }, [state]);

    // Debounced persistence to Supabase via API
    useEffect(() => {
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        saveTimeoutRef.current = setTimeout(() => {
            fetch(`/api/agents/${agent.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    policy: stateRef.current.policy,
                    conversationHistory: stateRef.current.messages,
                    onboardingComplete: stateRef.current.onboardingStep === 'complete',
                }),
            }).catch((err) => console.error('Failed to persist assistant:', err));
        }, 1500);

        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, [state.policy, state.messages, state.onboardingStep, agent.id]);

    // Flush pending save on unmount
    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
                // Fire-and-forget final save
                fetch(`/api/agents/${agent.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        policy: stateRef.current.policy,
                        conversationHistory: stateRef.current.messages,
                        onboardingComplete: stateRef.current.onboardingStep === 'complete',
                    }),
                }).catch(() => {});
            }
        };
    }, [agent.id]);

    // Bundle onboarding answers into a single message for the API
    const bundleOnboardingAnswers = useCallback((): string => {
        const current = stateRef.current;
        const userMessages = current.messages.filter((m) => m.role === 'user');
        const labels = [
            'Q1 — Urgent cases (patients needing fast-track consultation)',
            'Q2 — Standard cases (core surgical candidates)',
            'Q3 — Cancel & redirect (patients to redirect elsewhere)',
        ];
        return labels
            .map((label, i) => `${label}:\n"${userMessages[i]?.content ?? '(no answer)'}"`)
            .join('\n\n');
    }, []);

    // Bundle clarification answers from a message into a single text for the API
    const bundleClarificationAnswers = useCallback((clarifications: ClarificationQuestion[]): string => {
        return clarifications
            .filter((c) => c.answered && c.answer)
            .map((c) => `Q: ${c.question}\nA: ${c.answer}`)
            .join('\n\n');
    }, []);

    const callApi = useCallback(
        async (userMessage: string, isOnboarding: boolean) => {
            const assistantMsgId = crypto.randomUUID();
            const currentState = stateRef.current;

            // Build conversation history for API (exclude onboarding assistant messages)
            const conversationForApi = currentState.messages
                .filter((m) => !m.isOnboarding)
                .map((m) => ({ role: m.role, content: m.content }));

            try {
                const res = await fetch('/api/analyze', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        agentId: agent.id,
                        userMessage,
                        currentPolicy: currentState.policy,
                        conversationHistory: conversationForApi,
                        isOnboarding,
                    }),
                });

                if (!res.ok) {
                    let errorMessage = `API error: ${res.status}`;
                    try {
                        const errorJson = (await res.json()) as { error?: string };
                        if (errorJson.error) {
                            errorMessage = errorJson.error;
                        }
                    } catch {
                        // Non-JSON error body
                    }

                    throw Object.assign(new Error(errorMessage), { status: res.status });
                }
                if (!res.body) throw new Error('No response body');

                const reader = res.body.getReader();
                const decoder = new TextDecoder();
                let buffer = '';
                let receivedResult = false;

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n');
                    buffer = lines.pop() ?? '';

                    for (const line of lines) {
                        if (!line.startsWith('data: ')) continue;
                        const data = line.slice(6);
                        if (data === '[DONE]') continue;

                        let parsed:
                            | {
                                  type: string;
                                  content?: string;
                                  data?: V2AnalysisResponse;
                                  message?: string;
                              }
                            | null = null;

                        try {
                            parsed = JSON.parse(data) as {
                                type: string;
                                content?: string;
                                data?: V2AnalysisResponse;
                                message?: string;
                            };
                        } catch {
                            // Incomplete JSON chunk, skip
                            continue;
                        }

                        if (parsed.type === 'thinking' && parsed.content) {
                            dispatch({ type: 'APPEND_THINKING', text: parsed.content });
                        } else if (parsed.type === 'status' && parsed.content) {
                            dispatch({ type: 'SET_THINKING', text: parsed.content });
                        } else if (parsed.type === 'result' && parsed.data) {
                            receivedResult = true;
                            const result = parsed.data;
                            const modelClarifications = result.nextQuestions.length > 0
                                ? result.nextQuestions.map((q) => ({ ...q, answered: false }))
                                : [];
                            const hasAskedFollowUpBefore = currentState.messages.some((m) =>
                                (m.clarifications ?? []).some((c) => c.id !== FINAL_RULES_CHECK_ID)
                            );
                            const hasPendingFinalRulesCheck = currentState.messages.some((m) =>
                                (m.clarifications ?? []).some(
                                    (c) => c.id === FINAL_RULES_CHECK_ID && !c.answered
                                )
                            );
                            const shouldAskFinalRulesCheck =
                                modelClarifications.length === 0 &&
                                currentState.onboardingStep === 'complete' &&
                                hasAskedFollowUpBefore &&
                                !hasPendingFinalRulesCheck &&
                                !currentState.submitted;
                            const clarifications = modelClarifications.length > 0
                                ? modelClarifications
                                : shouldAskFinalRulesCheck
                                  ? [makeFinalRulesCheckQuestion()]
                                  : undefined;

                            const assistantMsg: BuilderMessage = {
                                id: assistantMsgId,
                                role: 'assistant',
                                content: result.reflections.map((r: Reflection) => r.content).join('\n'),
                                timestamp: Date.now(),
                                reflections: result.reflections,
                                clarifications,
                                challenges: result.challenges,
                            };

                            dispatch({
                                type: 'PROCESSING_COMPLETE',
                                message: assistantMsg,
                                policy: result.policy,
                            });
                        } else if (parsed.type === 'error') {
                            throw new Error(parsed.message ?? 'AI service error');
                        }
                    }
                }

                if (!receivedResult) {
                    throw new Error('AI response ended without a structured result');
                }
            } catch (err) {
                if (getErrorStatus(err) === 401) {
                    const assistantMsg: BuilderMessage = {
                        id: crypto.randomUUID(),
                        role: 'assistant',
                        content: 'Your session has expired. Please sign in again to continue building this assistant.',
                        timestamp: Date.now(),
                    };
                    dispatch({ type: 'ADD_USER_MESSAGE', message: assistantMsg });
                    if (typeof window !== 'undefined') {
                        window.location.href = '/login';
                    }
                } else {
                    console.error('Analysis failed:', err);
                    const reason = err instanceof Error ? err.message : 'Unknown error';
                    const assistantMsg: BuilderMessage = {
                        id: crypto.randomUUID(),
                        role: 'assistant',
                        content: `I could not parse that update cleanly (${reason}). Please retry your last answer, or continue with a new instruction.`,
                        timestamp: Date.now(),
                    };
                    dispatch({ type: 'ADD_USER_MESSAGE', message: assistantMsg });
                }
                dispatch({ type: 'PROCESSING_ERROR' });
            } finally {
                processingRef.current = false;
            }
        },
        [agent.id]
    );

    const completeSubmission = useCallback(() => {
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }
        fetch(`/api/agents/${agent.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                policy: stateRef.current.policy,
                conversationHistory: stateRef.current.messages,
                onboardingComplete: true,
                status: 'building',
            }),
        }).catch((err) => console.error('Failed to persist on submit:', err));
        dispatch({ type: 'SUBMIT_POLICY' });
    }, [agent.id]);

    const sendMessage = useCallback(
        async (text: string) => {
            if (!text.trim() || processingRef.current) return;

            const userMsg: BuilderMessage = {
                id: crypto.randomUUID(),
                role: 'user',
                content: text.trim(),
                timestamp: Date.now(),
            };
            dispatch({ type: 'ADD_USER_MESSAGE', message: userMsg });

            const currentStep = stateRef.current.onboardingStep;

            // During onboarding (steps 0-1): advance to next question, no API call
            if (typeof currentStep === 'number' && currentStep < 2) {
                dispatch({ type: 'ADVANCE_ONBOARDING' });
                return;
            }

            // Step 2 (last onboarding question): advance to 'complete' then call API with bundled answers
            if (currentStep === 2) {
                dispatch({ type: 'ADVANCE_ONBOARDING' });
                processingRef.current = true;
                dispatch({ type: 'START_PROCESSING', context: 'analyzing' });

                // Need to wait a tick so the state updates with the user message
                await new Promise((r) => setTimeout(r, 0));
                const bundled = bundleOnboardingAnswers();
                await callApi(bundled, true);
                return;
            }

            // Normal conversation: call API directly
            processingRef.current = true;
            dispatch({ type: 'START_PROCESSING', context: 'analyzing' });
            await callApi(text.trim(), false);
        },
        [bundleOnboardingAnswers, callApi]
    );

    // Answer a single clarification question. When all questions in the batch are answered,
    // auto-bundle and send to API.
    const answerClarification = useCallback(
        (messageId: string, clarificationId: string, answer: string) => {
            dispatch({ type: 'ANSWER_CLARIFICATION', messageId, clarificationId, answer });

            if (clarificationId === FINAL_RULES_CHECK_ID) {
                const normalized = answer.trim().toLowerCase();
                if (normalized === 'n' || normalized.startsWith('no')) {
                    completeSubmission();
                }
                return;
            }

            // Wait a tick for state to update, then check if all questions are answered
            setTimeout(() => {
                const currentState = stateRef.current;
                const msg = currentState.messages.find((m) => m.id === messageId);
                if (!msg?.clarifications) return;

                // Check: the one we just answered + all previously answered
                const updatedClarifications = msg.clarifications.map((c) =>
                    c.id === clarificationId ? { ...c, answered: true, answer } : c
                );
                const allAnswered = updatedClarifications.every((c) => c.answered);

                if (allAnswered && !processingRef.current) {
                    processingRef.current = true;
                    dispatch({ type: 'START_PROCESSING', context: 'updating' });
                    const bundled = bundleClarificationAnswers(updatedClarifications);

                    // Add a user message with the bundled answers
                    const userMsg: BuilderMessage = {
                        id: crypto.randomUUID(),
                        role: 'user',
                        content: bundled,
                        timestamp: Date.now(),
                    };
                    dispatch({ type: 'ADD_USER_MESSAGE', message: userMsg });

                    callApi(bundled, false);
                }
            }, 0);
        },
        [bundleClarificationAnswers, callApi, completeSubmission]
    );

    const submitPolicy = useCallback(() => {
        completeSubmission();
    }, [completeSubmission]);

    return {
        state,
        dispatch,
        sendMessage,
        answerClarification,
        submitPolicy,
    };
}
