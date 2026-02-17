'use client';

import Vapi from '@vapi-ai/web';
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOnboardingFlowContext } from '@/hooks/useOnboardingFlow';

type CallState = 'idle' | 'ringing' | 'connected' | 'ended';

const ASSISTANT_ID = 'f28ad15f-ff54-439a-84ac-98bc7507ebec';

export function PlayView() {
    const [callState, setCallState] = useState<CallState>('idle');
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [elapsed, setElapsed] = useState(0);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const vapiRef = useRef<Vapi | null>(null);
    const { state } = useOnboardingFlowContext();
    const agent = state.selectedAgent;

    // Lazy-init Vapi once
    const getVapi = useCallback(() => {
        if (!vapiRef.current) {
            vapiRef.current = new Vapi(process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY!);
        }
        return vapiRef.current;
    }, []);

    // Wire up Vapi event listeners + cleanup on unmount
    useEffect(() => {
        const vapi = getVapi();

        const onCallStart = () => setCallState('connected');
        const onCallEnd = () => {
            setCallState('ended');
            setIsSpeaking(false);
        };
        const onSpeechStart = () => setIsSpeaking(true);
        const onSpeechEnd = () => setIsSpeaking(false);
        const onError = (error: unknown) => {
            console.error('[Vapi] error:', error);
            setCallState('ended');
            setIsSpeaking(false);
        };

        vapi.on('call-start', onCallStart);
        vapi.on('call-end', onCallEnd);
        vapi.on('speech-start', onSpeechStart);
        vapi.on('speech-end', onSpeechEnd);
        vapi.on('error', onError);

        return () => {
            vapi.removeListener('call-start', onCallStart);
            vapi.removeListener('call-end', onCallEnd);
            vapi.removeListener('speech-start', onSpeechStart);
            vapi.removeListener('speech-end', onSpeechEnd);
            vapi.removeListener('error', onError);
            vapi.stop();
        };
    }, [getVapi]);

    // Timer for connected state
    useEffect(() => {
        if (callState === 'connected') {
            timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
            if (callState === 'idle') setElapsed(0);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [callState]);

    const handleDial = () => {
        setCallState('ringing');
        getVapi().start(ASSISTANT_ID);
    };

    const handleEndCall = () => {
        getVapi().stop();
    };

    const handleCallAgain = () => {
        setElapsed(0);
        setCallState('idle');
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    if (!agent) return null;

    return (
        <div className="h-full flex flex-col items-center justify-center">
            <AnimatePresence mode="wait">
                {/* Idle / Entry Screen */}
                {callState === 'idle' && (
                    <motion.div
                        key="idle"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        className="text-center max-w-lg"
                    >
                        <div className="w-32 h-32 rounded-full bg-bg-panel border border-border/40 flex items-center justify-center mx-auto mb-10 shadow-[0_10px_40px_rgba(0,0,0,0.03)] relative overflow-hidden group">
                            <div className="absolute inset-0 bg-accent-blue/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <svg className="w-12 h-12 text-accent-blue opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                            </svg>
                        </div>

                        <h2 className="text-3xl font-serif text-text-primary mb-3 italic tracking-tight">{agent.name}</h2>
                        <span className="text-[10px] uppercase tracking-[0.3em] text-accent-blue font-bold opacity-50 mb-8 block">Test Call Mode</span>

                        <p className="text-sm text-text-secondary leading-[1.8] max-w-md mx-auto mb-12">
                            Pretend to be a patient and see how the assistant triages the case using the rules you configured.
                        </p>

                        <button
                            onClick={handleDial}
                            className="px-10 py-4 bg-accent-blue text-white rounded-sm text-[11px] font-bold uppercase tracking-[0.2em] shadow-lg shadow-accent-blue/20 hover:scale-[1.02] transition-all cursor-pointer"
                        >
                            Run Sample Patient Call
                        </button>
                    </motion.div>
                )}

                {/* Ringing / Connecting */}
                {callState === 'ringing' && (
                    <motion.div
                        key="ringing"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-center"
                    >
                        <div className="relative mb-12">
                            <motion.div
                                animate={{
                                    scale: [1, 1.2, 1],
                                    opacity: [0.1, 0.3, 0.1]
                                }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="absolute inset-0 rounded-full bg-accent-blue"
                            />
                            <div className="w-24 h-24 rounded-full border border-accent-blue/30 flex items-center justify-center relative bg-bg-primary">
                                <div className="flex gap-1">
                                    {[0, 1, 2].map((i) => (
                                        <motion.div
                                            key={i}
                                            animate={{ height: [8, 20, 8] }}
                                            transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                                            className="w-1 bg-accent-blue rounded-full"
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                        <h3 className="text-lg font-serif text-text-primary italic">Preparing your test call...</h3>
                    </motion.div>
                )}

                {/* Connected */}
                {callState === 'connected' && (
                    <motion.div
                        key="connected"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="w-full max-w-4xl"
                    >
                        {/* Status Bar */}
                        <div className="flex items-center justify-between mb-12 border-b border-border/30 pb-6">
                            <div className="flex items-center gap-4">
                                <div className="w-2 h-2 rounded-full bg-accent-green" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">Test Call Live</span>
                            </div>
                            <div className="text-center">
                                <h3 className="text-lg font-serif text-text-primary italic tracking-tight">{agent.name}</h3>
                            </div>
                            <div className="font-mono text-xs text-accent-blue font-bold tracking-tighter w-20 text-right">
                                {formatTime(elapsed)}
                            </div>
                        </div>

                        {/* Monitor Area */}
                        <div className="grid grid-cols-3 gap-12 min-h-[400px]">
                            {/* Left: Live Indicator */}
                            <div className="col-span-2 bg-bg-secondary/40 border border-border/20 rounded-sm p-10 flex flex-col items-center justify-center text-center relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent-blue/20 to-transparent" />

                                {/* Audio visualizer bars */}
                                <div className="flex items-center gap-1 mb-8">
                                    {[0, 1, 2, 3, 4].map((i) => (
                                        <motion.div
                                            key={i}
                                            animate={isSpeaking
                                                ? { height: [8, 28, 12, 24, 8], opacity: [0.4, 1, 0.6, 1, 0.4] }
                                                : { height: 8, opacity: 0.2 }
                                            }
                                            transition={isSpeaking
                                                ? { duration: 0.8, repeat: Infinity, delay: i * 0.1 }
                                                : { duration: 0.3 }
                                            }
                                            className="w-1 rounded-full bg-accent-blue"
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Right: Test Call Details */}
                            <div className="space-y-8">
                                <div className="pb-6 border-b border-border/30">
                                    <span className="text-[9px] font-bold uppercase tracking-widest text-text-secondary opacity-50 block mb-2">Assistant Status</span>
                                    <p className="text-xs font-medium text-text-primary">Triage rules loaded</p>
                                </div>
                                <div className="pb-6 border-b border-border/30">
                                    <span className="text-[9px] font-bold uppercase tracking-widest text-text-secondary opacity-50 block mb-2">Triage Logic</span>
                                    <p className="text-xs font-medium text-text-primary">Version {agent.policy?.version ?? '1.0'}</p>
                                </div>
                                <div className="pt-4">
                                    <button
                                        onClick={handleEndCall}
                                        className="w-full py-4 border-2 border-accent-red text-accent-red text-[10px] font-bold uppercase tracking-[0.2em] rounded-sm hover:bg-accent-red hover:text-white transition-all cursor-pointer"
                                    >
                                        End Test Call
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Ended */}
                {callState === 'ended' && (
                    <motion.div
                        key="ended"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-full max-w-2xl bg-bg-panel p-16 shadow-[0_20px_80px_rgba(0,0,0,0.04)] border border-border/40 relative overflow-hidden"
                    >
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-accent-blue/10" />

                        <div className="text-center mb-16">
                            <span className="text-[10px] uppercase tracking-[0.4em] text-accent-blue font-bold opacity-40 mb-4 block">Test Call Report</span>
                            <h2 className="text-3xl font-serif text-text-primary italic tracking-tight">Test Summary</h2>
                            <p className="text-xs text-text-secondary mt-2 opacity-60">Duration: {formatTime(elapsed)}</p>
                        </div>

                        <div className="space-y-12">
                            <div className="relative pl-8 border-l border-border/60">
                                <h4 className="text-[10px] font-bold uppercase tracking-widest text-text-primary mb-4 opacity-80">Triage Outcome</h4>
                                <p className="text-[13px] text-text-secondary leading-relaxed font-serif italic">
                                    After the test, this section will show the triage level, routing recommendation, and clinical rationale.
                                </p>
                            </div>

                            <div className="relative pl-8 border-l border-border/60">
                                <h4 className="text-[10px] font-bold uppercase tracking-widest text-text-primary mb-4 opacity-80">Suggested Follow-Up</h4>
                                <p className="text-[13px] text-text-secondary leading-relaxed font-serif italic">
                                    Suggested updates to your triage rules based on this test call will appear here.
                                </p>
                            </div>
                        </div>

                        <div className="mt-20 pt-10 border-t border-border/30 flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className="text-[9px] uppercase tracking-widest text-text-secondary font-bold opacity-40">System</span>
                                <span className="text-[11px] font-serif italic text-text-primary">Clarence Triage Assistant</span>
                            </div>
                            <button
                                onClick={handleCallAgain}
                                className="px-8 py-3 bg-bg-secondary text-text-primary text-[10px] font-bold uppercase tracking-[0.2em] rounded-sm hover:bg-border/40 transition-all cursor-pointer"
                            >
                                Run Another Test
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
