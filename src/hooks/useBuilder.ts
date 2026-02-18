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

// ── Onboarding Questions ──

const ONBOARDING_QUESTIONS = [
    {
        intro: "Welcome! I'll help you formalize your consultation policy. Let's start with 4 questions to understand your practice.",
        question: 'What is the ideal type of patient you currently see in consultation?',
    },
    {
        question: 'What type of patient would you consider to have low surgical potential?',
    },
    {
        question: 'Is there an in-between: patients who qualify but with low or uncertain surgical potential?',
    },
    {
        question: 'For non-qualifying patients, what would you like to offer them? (advice, exams to complete, specialist referral, colleague...)',
    },
];

function makeOnboardingMessage(step: 0 | 1 | 2 | 3): BuilderMessage {
    const q = ONBOARDING_QUESTIONS[step]!;
    const content = q.intro ? `${q.intro}\n\n**Question ${step + 1}/4:** ${q.question}` : `**Question ${step + 1}/4:** ${q.question}`;
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
            if (nextStep >= 4) {
                return { ...state, onboardingStep: 'complete' };
            }
            const nextQ = makeOnboardingMessage(nextStep as 0 | 1 | 2 | 3);
            return {
                ...state,
                onboardingStep: nextStep as 0 | 1 | 2 | 3,
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
            initialOnboardingStep = userMsgCount >= 4 ? 'complete' : (Math.min(userMsgCount, 3) as 0 | 1 | 2 | 3);
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
            'Q1 — High potential patients (ideal surgical candidates)',
            'Q2 — Low potential patients (low surgical potential)',
            'Q3 — In-between (uncertain surgical potential)',
            'Q4 — For non-qualifying patients (redirect/advice)',
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

                if (!res.ok) throw new Error(`API error: ${res.status}`);
                if (!res.body) throw new Error('No response body');

                const reader = res.body.getReader();
                const decoder = new TextDecoder();
                let buffer = '';

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

                        try {
                            const parsed = JSON.parse(data) as {
                                type: string;
                                content?: string;
                                data?: V2AnalysisResponse;
                            };

                            if (parsed.type === 'thinking' && parsed.content) {
                                dispatch({ type: 'APPEND_THINKING', text: parsed.content });
                            } else if (parsed.type === 'status' && parsed.content) {
                                dispatch({ type: 'SET_THINKING', text: parsed.content });
                            } else if (parsed.type === 'result' && parsed.data) {
                                const result = parsed.data;
                                const clarifications = result.nextQuestions.length > 0
                                    ? result.nextQuestions.map((q) => ({ ...q, answered: false }))
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
                            }
                        } catch {
                            // Incomplete JSON chunk, skip
                        }
                    }
                }
            } catch (err) {
                console.error('Analysis failed:', err);
                dispatch({ type: 'PROCESSING_ERROR' });
            } finally {
                processingRef.current = false;
            }
        },
        [agent.id]
    );

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

            // During onboarding (steps 0-2): advance to next question, no API call
            if (typeof currentStep === 'number' && currentStep < 3) {
                dispatch({ type: 'ADVANCE_ONBOARDING' });
                return;
            }

            // Step 3 (last onboarding question): advance to 'complete' then call API with bundled answers
            if (currentStep === 3) {
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
        [bundleClarificationAnswers, callApi]
    );

    const submitPolicy = useCallback(() => {
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

    return {
        state,
        dispatch,
        sendMessage,
        answerClarification,
        submitPolicy,
    };
}
