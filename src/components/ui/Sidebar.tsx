'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/providers/AuthProvider';
import { useOnboardingFlowContext } from '@/hooks/useOnboardingFlow';
import { motion } from 'framer-motion';

function StepCircle({ number, state }: { number: number; state: 'active' | 'completed' | 'locked' }) {
    if (state === 'completed') {
        return (
            <div className="w-8 h-8 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
            </div>
        );
    }

    if (state === 'locked') {
        return (
            <div className="w-8 h-8 rounded-full bg-bg-primary/50 border border-border/30 flex items-center justify-center flex-shrink-0 opacity-40">
                <svg className="w-3.5 h-3.5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
            </div>
        );
    }

    return (
        <div className="w-8 h-8 rounded-full bg-accent-blue/15 border border-accent-blue/40 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-semibold text-accent-blue">{number}</span>
        </div>
    );
}

export function Sidebar() {
    const router = useRouter();
    const { user } = useAuth();
    const { state, actions } = useOnboardingFlowContext();

    const step1State = state.currentStep === 1 ? 'active' : (state.selectedAgent ? 'completed' : 'active');
    const step2State = state.selectedAgent ? (state.currentStep === 2 ? 'active' : 'completed') : 'locked';

    const handleSignOut = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push('/login');
        router.refresh();
    };

    return (
        <aside className="w-[260px] h-full flex flex-col bg-bg-secondary/30">
            {/* Logo */}
            <div className="px-7 py-8">
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
            <div className="flex-1 px-5">
                <p className="text-[10px] uppercase tracking-[0.15em] text-text-secondary mb-5 px-2 font-medium">
                    Getting Started
                </p>

                <div className="space-y-0">
                    {/* Step 1 */}
                    <button
                        onClick={() => actions.goToStep(1)}
                        className={`w-full text-left px-3 py-3 rounded-lg transition-all duration-200 cursor-pointer ${
                            state.currentStep === 1
                                ? 'bg-bg-panel/80'
                                : 'hover:bg-bg-panel/40'
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            <StepCircle number={1} state={step1State} />
                            <div className="min-w-0">
                                <p className={`text-sm font-medium ${
                                    state.currentStep === 1 ? 'text-text-primary' : 'text-text-secondary'
                                }`}>
                                    Choose Your Agent
                                </p>
                                <p className="text-[11px] text-text-secondary mt-0.5 truncate">
                                    Select a template or build custom
                                </p>
                            </div>
                        </div>
                        {state.selectedAgent && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="ml-11 mt-2"
                            >
                                <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-accent-blue/10 border border-accent-blue/20">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                                    <span className="text-xs text-accent-blue font-medium truncate">
                                        {state.selectedAgent.name}
                                    </span>
                                </div>
                            </motion.div>
                        )}
                    </button>

                    {/* Connecting Line */}
                    <div className="ml-[27px] w-px h-4 bg-border/40" />

                    {/* Step 2 */}
                    <div className="relative group/step2">
                    <button
                        onClick={() => actions.goToStep(2)}
                        disabled={!state.selectedAgent}
                        className={`w-full text-left px-3 py-3 rounded-lg transition-all duration-200 ${
                            !state.selectedAgent
                                ? 'opacity-50 cursor-not-allowed'
                                : state.currentStep === 2
                                    ? 'bg-bg-panel/80 cursor-pointer'
                                    : 'hover:bg-bg-panel/40 cursor-pointer'
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            <StepCircle number={2} state={step2State} />
                            <div className="min-w-0">
                                <p className={`text-sm font-medium ${
                                    state.currentStep === 2 ? 'text-text-primary' : 'text-text-secondary'
                                }`}>
                                    Test Your Agent
                                </p>
                                <p className="text-[11px] text-text-secondary mt-0.5">
                                    Observe scenarios or role-play
                                </p>
                            </div>
                        </div>
                    </button>

                    {/* Sub-tabs for Step 2 */}
                    {state.currentStep === 2 && state.selectedAgent && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="ml-11 mt-1 space-y-0.5"
                        >
                            <button
                                onClick={() => actions.setTestMode('observe')}
                                className={`w-full text-left px-3 py-1.5 rounded-md text-xs transition-all cursor-pointer ${
                                    state.testMode === 'observe'
                                        ? 'text-accent-blue bg-accent-blue/10 font-medium'
                                        : 'text-text-secondary hover:text-text-primary'
                                }`}
                            >
                                <span className="flex items-center gap-2">
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    Observe
                                </span>
                            </button>
                            <button
                                onClick={() => actions.setTestMode('play')}
                                className={`w-full text-left px-3 py-1.5 rounded-md text-xs transition-all cursor-pointer ${
                                    state.testMode === 'play'
                                        ? 'text-accent-blue bg-accent-blue/10 font-medium'
                                        : 'text-text-secondary hover:text-text-primary'
                                }`}
                            >
                                <span className="flex items-center gap-2">
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                                    </svg>
                                    Play
                                </span>
                            </button>
                        </motion.div>
                    )}
                    {!state.selectedAgent && (
                        <div className="invisible group-hover/step2:visible absolute left-full top-1/2 -translate-y-1/2 ml-2 z-50">
                            <div className="bg-bg-panel border border-border/60 shadow-lg rounded-lg px-3 py-2 whitespace-nowrap">
                                <p className="text-[11px] text-text-secondary font-medium">
                                    Do step 1 first — choose your agent
                                </p>
                            </div>
                        </div>
                    )}
                    </div>
                </div>
            </div>

            {/* Sign out */}
            <div className="px-4 pb-6 mt-auto">
                <div className="px-4 py-4 rounded-sm bg-bg-primary/50 border border-border/50">
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
