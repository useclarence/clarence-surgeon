'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useOnboardingFlowContext } from '@/hooks/useOnboardingFlow';
import { Modal } from '@/components/ui/Modal';
import { ObserveView } from './ObserveView';
import { PlayView } from './PlayView';

export function TestView() {
    const { state, actions } = useOnboardingFlowContext();
    const agent = state.selectedAgent;
    const [confirmModifyOpen, setConfirmModifyOpen] = useState(false);

    if (!agent) return null;

    const handleModify = () => {
        setConfirmModifyOpen(true);
    };

    const handleAcceptModify = () => {
        setConfirmModifyOpen(false);
        actions.goToStep(1);
    };

    return (
        <div className="h-full flex flex-col bg-bg-primary">
            {/* Header */}
            <div className="px-12 pt-12 pb-8">
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: [0.19, 1, 0.22, 1] }}
                >
                    <div className="flex items-center gap-6 mb-2">
                        <button
                            onClick={() => actions.goToStep(1)}
                            className="p-2 rounded-full text-text-secondary hover:text-accent-blue hover:bg-bg-secondary transition-all cursor-pointer"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                            </svg>
                        </button>
                        <h1 className="text-3xl font-serif text-text-primary tracking-tight italic">
                            Test Your Assistant
                        </h1>
                    </div>
                    <div className="flex items-center gap-3 ml-14">
                        <span className="text-[10px] uppercase tracking-[0.3em] text-accent-blue font-bold opacity-60">Testing Assistant</span>
                        <span className="w-1 h-1 rounded-full bg-border" />
                        <span className="text-sm font-medium text-text-primary">{agent.name}</span>
                        <button
                            onClick={handleModify}
                            className="ml-2 px-2.5 py-1 rounded-md border border-border/50 text-[10px] uppercase tracking-[0.16em] font-semibold text-text-secondary hover:text-accent-blue hover:border-accent-blue/40 hover:bg-bg-secondary/50 transition-all cursor-pointer"
                        >
                            Modify
                        </button>
                    </div>
                    {state.isCreatingFromTemplate && (
                        <div className="ml-14 mt-3 inline-flex items-center gap-2 rounded-lg border border-flow-blue/20 bg-flow-blue/10 px-3 py-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-flow-blue animate-pulse" />
                            <span className="text-[11px] text-text-secondary">Finalizing assistant setup...</span>
                        </div>
                    )}
                    <p className="text-sm text-text-secondary mt-4 ml-14 max-w-2xl leading-relaxed">
                        Run pre-recorded calls or live calls to see triage decisions, routing recommendations, and clinical rationale.
                    </p>
                </motion.div>

                {/* Tab Switcher */}
                <div className="flex items-center gap-10 mt-12 border-b border-border/30 pb-4 ml-14">
                    <button
                        onClick={() => actions.setTestMode('observe')}
                        className={`relative px-1 py-2 text-[11px] font-bold uppercase tracking-[0.2em] transition-all cursor-pointer ${
                            state.testMode === 'observe'
                                ? 'text-accent-blue'
                                : 'text-text-secondary hover:text-text-primary opacity-60 hover:opacity-100'
                        }`}
                    >
                        Pre-recorded calls
                        {state.testMode === 'observe' && (
                            <motion.div
                                layoutId="test-tab-underline"
                                className="absolute -bottom-[17px] left-0 right-0 h-0.5 bg-accent-blue"
                            />
                        )}
                    </button>
                    <button
                        onClick={() => actions.setTestMode('play')}
                        className={`relative px-1 py-2 text-[11px] font-bold uppercase tracking-[0.2em] transition-all cursor-pointer ${
                            state.testMode === 'play'
                                ? 'text-accent-blue'
                                : 'text-text-secondary hover:text-text-primary opacity-60 hover:opacity-100'
                        }`}
                    >
                        Live-call
                        {state.testMode === 'play' && (
                            <motion.div
                                layoutId="test-tab-underline"
                                className="absolute -bottom-[17px] left-0 right-0 h-0.5 bg-accent-blue"
                            />
                        )}
                    </button>
                </div>
            </div>

            {/* Content Container */}
            <div className="flex-1 overflow-auto px-12 pb-12 ml-14">
                <div className="max-w-5xl">
                    {state.testMode === 'observe' ? <ObserveView /> : <PlayView />}
                </div>
            </div>

            <Modal open={confirmModifyOpen} onClose={() => setConfirmModifyOpen(false)}>
                <div className="bg-bg-panel border border-border/45 rounded-2xl shadow-2xl overflow-hidden">
                    <div className="px-6 py-5 border-b border-border/45 bg-bg-primary/55">
                        <h2 className="text-base font-semibold text-text-primary">Modify assistant template</h2>
                        <p className="text-sm text-text-secondary mt-1">
                            You will be redirected to Step 1 to choose another assistant template.
                        </p>
                    </div>
                    <div className="px-6 py-4 flex items-center justify-end gap-2">
                        <button
                            onClick={() => setConfirmModifyOpen(false)}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium border border-border/55 bg-bg-primary/45 text-text-secondary hover:text-text-primary hover:bg-bg-primary/70 transition-all cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleAcceptModify}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-accent-blue/40 bg-accent-blue/15 text-accent-blue hover:bg-accent-blue/25 transition-all cursor-pointer"
                        >
                            Accept
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
