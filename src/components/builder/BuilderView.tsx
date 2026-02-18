'use client';

import { useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useBuilder } from '@/hooks/useBuilder';
import { useOnboardingFlowContext } from '@/hooks/useOnboardingFlow';
import { BuilderHeader } from '@/components/builder/BuilderHeader';
import { BuilderConversation } from '@/components/builder/BuilderConversation';
import { DictationZone } from '@/components/builder/DictationZone';
import { PolicyPanel } from '@/components/builder/PolicyPanel';
import type { Agent } from '@/lib/types';

interface BuilderViewProps {
    agent: Agent;
}

function SubmittedConfirmation({ agentName, onBackToTemplates }: { agentName: string; onBackToTemplates: () => void }) {
    return (
        <div className="h-full flex items-center justify-center bg-bg-primary">
            <div className="max-w-lg text-center px-8">
                <div className="w-16 h-16 mx-auto mb-8 rounded-full bg-accent-blue/5 border border-accent-blue/10 flex items-center justify-center">
                    <svg className="w-7 h-7 text-accent-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085" />
                    </svg>
                </div>

                <h1 className="text-2xl font-serif text-text-primary mb-3">
                    {agentName} is under construction
                </h1>
                <p className="text-sm text-text-secondary leading-relaxed mb-10">
                    Your consultation policy has been submitted. We&apos;re building your agent and
                    will send you a notification when it&apos;s ready to take calls.
                </p>

                <button
                    onClick={onBackToTemplates}
                    className="inline-flex items-center gap-3 px-6 py-3 bg-accent-blue text-white text-sm font-medium tracking-wide rounded-sm hover:opacity-90 transition-opacity cursor-pointer"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                    </svg>
                    Back to Template Library
                </button>
            </div>
        </div>
    );
}

export function BuilderView({ agent }: BuilderViewProps) {
    const router = useRouter();
    const { actions } = useOnboardingFlowContext();
    const { state, dispatch, sendMessage, answerClarification, submitPolicy } = useBuilder(agent);

    const speechBufferRef = useRef<string[]>([]);

    const onFinalResult = useCallback((text: string) => {
        speechBufferRef.current.push(text);
    }, []);

    const { isListening, interimText, isSupported, start, stop } = useSpeechRecognition(onFinalResult);

    const handleStartRecording = useCallback(() => {
        speechBufferRef.current = [];
        dispatch({ type: 'START_RECORDING' });
        start();
    }, [dispatch, start]);

    const handleStopRecording = useCallback(() => {
        stop();
        dispatch({ type: 'STOP_RECORDING' });
        const fullText = speechBufferRef.current.join(' ');
        speechBufferRef.current = [];
        if (fullText.trim()) {
            sendMessage(fullText);
        }
    }, [stop, dispatch, sendMessage]);

    const handleSendText = useCallback(
        (text: string) => {
            sendMessage(text);
        },
        [sendMessage]
    );

    const handleBackToTemplates = useCallback(() => {
        actions.reset();
        router.push('/agents');
    }, [actions, router]);

    if (state.submitted) {
        return <SubmittedConfirmation agentName={agent.name} onBackToTemplates={handleBackToTemplates} />;
    }

    if (!isSupported) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center max-w-md">
                    <h1 className="text-xl font-bold text-accent-red mb-2">Browser Not Supported</h1>
                    <p className="text-text-secondary text-sm">
                        Speech recognition requires Chrome. Please open this page in Google Chrome.
                    </p>
                </div>
            </div>
        );
    }

    const canSubmit = state.policy !== null && state.status !== 'processing';

    return (
        <div className="h-full flex flex-row">
            {/* Left side: Chat area */}
            <div className="flex-1 flex flex-col min-w-0">
                <BuilderHeader
                    agentName={agent.name}
                    agentSpecialty={agent.specialty}
                    status={state.status}
                    policyVersion={state.policy?.version ?? 0}
                    hasPolicy={state.policy !== null}
                    onTogglePolicy={() => dispatch({ type: 'TOGGLE_POLICY_DRAWER' })}
                />

                <BuilderConversation
                    messages={state.messages}
                    isProcessing={state.status === 'processing'}
                    streamingThought={state.streamingThought}
                    ruleCount={state.policy?.rules.length ?? 0}
                    answerCount={state.messages.filter((m) => m.role === 'user').length}
                    onAnswerClarification={answerClarification}
                />

                <DictationZone
                    isRecording={isListening}
                    isProcessing={state.status === 'processing'}
                    interimText={interimText}
                    onStartRecording={handleStartRecording}
                    onStopRecording={handleStopRecording}
                    onSendText={handleSendText}
                    canSubmit={canSubmit}
                    onSubmit={submitPolicy}
                />
            </div>

            {/* Right side: Policy panel (inline) */}
            <PolicyPanel
                open={state.showPolicyDrawer}
                onClose={() => dispatch({ type: 'TOGGLE_POLICY_DRAWER' })}
                policy={state.policy}
            />
        </div>
    );
}
