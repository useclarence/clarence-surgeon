'use client';

import { motion } from 'framer-motion';
import { useOnboardingFlowContext } from '@/hooks/useOnboardingFlow';
import { ObserveView } from './ObserveView';
import { PlayView } from './PlayView';

export function TestView() {
    const { state, actions } = useOnboardingFlowContext();
    const agent = state.selectedAgent;

    if (!agent) return null;

    const handleModify = () => {
        window.alert("You'll be redirected to Step 1 to choose another assistant template.");
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
                        Observe
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
                        Role-play
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
        </div>
    );
}
