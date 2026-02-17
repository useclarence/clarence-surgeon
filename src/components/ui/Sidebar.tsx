'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/providers/AuthProvider';
import { useOnboardingFlowContext } from '@/hooks/useOnboardingFlow';
import { motion } from 'framer-motion';

function StepCircle({ number, state }: { number: number; state: 'active' | 'inactive' | 'completed' | 'locked' }) {
    if (state === 'completed') {
        return (
            <div className="w-10 h-10 rounded-full bg-accent-green/15 border border-accent-green/35 flex items-center justify-center flex-shrink-0">
                <svg className="w-[18px] h-[18px] text-accent-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
            </div>
        );
    }

    if (state === 'locked') {
        return (
            <div className="w-10 h-10 rounded-full bg-bg-secondary/70 border border-border/60 flex items-center justify-center flex-shrink-0">
                <svg className="w-3.5 h-3.5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
            </div>
        );
    }

    if (state === 'inactive') {
        return (
            <div className="w-10 h-10 rounded-full bg-bg-secondary/70 border border-border/60 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-semibold text-text-secondary">{number}</span>
            </div>
        );
    }

    return (
        <div className="w-10 h-10 rounded-full bg-flow-blue/12 border border-flow-blue/35 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-semibold text-flow-blue">{number}</span>
        </div>
    );
}

export function Sidebar() {
    const router = useRouter();
    const { user } = useAuth();
    const { state, actions } = useOnboardingFlowContext();

    const step1State = state.currentStep === 1 ? 'active' : 'inactive';
    const step2State = state.selectedAgent ? (state.currentStep === 2 ? 'active' : 'completed') : 'locked';

    const step1Active = state.currentStep === 1;
    const step2Active = state.currentStep === 2;
    const step2Locked = !state.selectedAgent;

    const stepCardBase = 'w-full text-left rounded-2xl border px-4 py-4 transition-all duration-200';
    const step1Classes = step1Active
        ? 'bg-bg-panel border-flow-blue/35 shadow-[0_10px_24px_rgba(30,78,160,0.10)]'
        : 'bg-bg-panel/75 border-border/70 hover:border-flow-blue/25 hover:bg-bg-panel';
    const step2Classes = step2Locked
        ? 'bg-bg-primary/70 border-border/60 opacity-75 cursor-not-allowed'
        : step2Active
            ? 'bg-bg-panel border-flow-blue/35 shadow-[0_10px_24px_rgba(30,78,160,0.10)] cursor-pointer'
            : 'bg-bg-panel/75 border-border/70 hover:border-flow-blue/25 hover:bg-bg-panel cursor-pointer';

    const handleSignOut = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push('/login');
        router.refresh();
    };

    return (
        <aside className="w-[292px] h-full flex flex-col border-r border-border/70 bg-gradient-to-b from-bg-secondary/70 via-bg-primary to-bg-primary">
            {/* Logo */}
            <div className="px-7 py-8 border-b border-border/60">
                <button
                    className="group text-left cursor-pointer"
                    onClick={() => {
                        actions.reset();
                        window.location.href = '/agents';
                    }}
                >
                    <h2 className="text-xl font-medium tracking-tight font-serif text-accent-blue italic">
                        Clarence <span className="text-text-primary not-italic opacity-80">Surgeon</span>
                    </h2>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-text-secondary mt-1 font-sans">
                        Doctor platform
                    </p>
                </button>
            </div>

            {/* Step Indicator */}
            <div className="flex-1 px-5 pt-6">
                <div className="mb-2 px-2 flex items-center justify-between">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-text-secondary/90 font-semibold">
                        Quick Setup
                    </p>
                    <span className="text-[10px] text-text-secondary/80 font-medium">
                        2 minutes
                    </span>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed px-2 mb-5">
                    Follow two simple steps to build and test your assistant.
                </p>

                <div>
                    {/* Step 1 */}
                    <button
                        onClick={() => actions.goToStep(1)}
                        className={`${stepCardBase} ${step1Classes} cursor-pointer`}
                    >
                        <div className="flex items-center gap-3">
                            <StepCircle number={1} state={step1State} />
                            <div className="min-w-0">
                                <p className={`text-sm font-semibold ${step1Active ? 'text-text-primary' : 'text-text-primary/90'}`}>
                                    Choose Your Assistant
                                </p>
                                <p className="text-[11px] text-text-secondary mt-0.5">
                                    Pick a template or create your own
                                </p>
                            </div>
                        </div>
                        {state.selectedAgent && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="ml-12 mt-3"
                            >
                                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-flow-blue/10 border border-flow-blue/20">
                                    <div className="w-1.5 h-1.5 rounded-full bg-accent-green" />
                                    <span className="text-[10px] uppercase tracking-[0.12em] text-text-secondary/90 font-semibold">
                                        Selected
                                    </span>
                                    <span className="text-xs text-flow-blue font-medium truncate">
                                        {state.selectedAgent.name}
                                    </span>
                                </div>
                            </motion.div>
                        )}
                    </button>

                    {/* Connecting Line */}
                    <div
                        className={`ml-5 w-px h-4 ${state.selectedAgent ? 'bg-flow-blue/30' : 'bg-border/80'}`}
                    />

                    {/* Step 2 */}
                    <button
                        onClick={() => actions.goToStep(2)}
                        disabled={!state.selectedAgent}
                        className={`${stepCardBase} ${step2Classes}`}
                    >
                        <div className="flex items-center gap-3">
                            <StepCircle number={2} state={step2State} />
                            <div className="min-w-0">
                                <p className={`text-sm font-semibold ${step2Active ? 'text-text-primary' : 'text-text-primary/90'}`}>
                                    Test Your Assistant
                                </p>
                                <p className="text-[11px] text-text-secondary mt-0.5 leading-relaxed">
                                    Practice with sample scenarios before going live
                                </p>
                            </div>
                        </div>
                        {!state.selectedAgent && (
                            <p className="ml-12 mt-2 text-[11px] text-text-secondary">
                                Complete step 1 to unlock testing.
                            </p>
                        )}
                    </button>

                    {/* Sub-tabs for Step 2 */}
                    {step2Active && state.selectedAgent && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="ml-12 mt-2 rounded-xl border border-border/70 bg-bg-primary/80 p-1.5 space-y-1"
                        >
                            <button
                                onClick={() => actions.setTestMode('observe')}
                                className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all cursor-pointer ${
                                    state.testMode === 'observe'
                                        ? 'text-flow-blue bg-bg-panel border border-flow-blue/25 font-semibold'
                                        : 'text-text-secondary hover:text-text-primary hover:bg-bg-secondary/60 border border-transparent'
                                }`}
                            >
                                <span className="flex items-center gap-2">
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    <span>Pre-recorded calls</span>
                                </span>
                            </button>
                            <button
                                onClick={() => actions.setTestMode('play')}
                                className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all cursor-pointer ${
                                    state.testMode === 'play'
                                        ? 'text-flow-blue bg-bg-panel border border-flow-blue/25 font-semibold'
                                        : 'text-text-secondary hover:text-text-primary hover:bg-bg-secondary/60 border border-transparent'
                                }`}
                            >
                                <span className="flex items-center gap-2">
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                                    </svg>
                                    <span>Live-call</span>
                                </span>
                            </button>
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Sign out */}
            <div className="px-4 pb-6 pt-4 mt-auto border-t border-border/60">
                <div className="px-4 py-4 rounded-xl bg-bg-panel/75 border border-border/70">
                    {user && (
                        <p className="text-[10px] text-text-secondary truncate mb-3 tracking-wide">{user.email}</p>
                    )}
                    <button
                        onClick={handleSignOut}
                        className="flex items-center gap-2 text-[11px] font-medium text-text-secondary hover:text-accent-red transition-colors cursor-pointer"
                    >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3-3h-9m9 0l-3-3m3 3l-3 3"
                            />
                        </svg>
                        Log Out
                    </button>
                </div>
            </div>
        </aside>
    );
}
