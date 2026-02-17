'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ScenarioStep {
    speaker: 'patient' | 'assistant';
    text: string;
    timestampSec: number;
    policyHighlight?: string;
}

type TriageResult = 'high_surgical_potential' | 'low_surgical_potential';

interface Scenario {
    id: string;
    patientName: string;
    displayLabel?: string;
    age: number;
    chiefComplaint: string;
    background: string;
    audioSrc: string;
    durationHintSec: number;
    steps: ScenarioStep[];
    triageResult: TriageResult;
    triageSummary: string;
}

const SCENARIOS: Scenario[] = [
    {
        id: 'scenario-1',
        patientName: 'Olivier',
        displayLabel: 'Pre-recorded call #1',
        age: 58,
        chiefComplaint: 'Shoulder dislocation feeling on right arm',
        background: 'Completed 8 weeks of physical therapy and oral anti-inflammatories without improvement. MRI from last month shows a full-thickness supraspinatus tear.',
        audioSrc: '/audio/pre-recorded/marie-dupont-demo.m4a',
        durationHintSec: 38,
        steps: [
            {
                speaker: 'assistant',
                text: 'Good morning. I\'m calling from Dr. Martin\'s office to help assess your referral. Could you describe your main concern?',
                timestampSec: 0,
            },
            {
                speaker: 'patient',
                text: 'My right shoulder has been hurting for months, and now I can barely lift my arm to place dishes in the cabinet.',
                timestampSec: 5,
            },
            {
                speaker: 'assistant',
                text: 'I\'m sorry to hear that. Have you tried any treatment so far - physical therapy, medications, injections?',
                timestampSec: 10,
            },
            {
                speaker: 'patient',
                text: 'Yes, I did 8 weeks of PT and took anti-inflammatory medication, but I still have weakness and night pain.',
                timestampSec: 15,
            },
            {
                speaker: 'assistant',
                text: 'Do you have recent shoulder imaging - MRI or ultrasound within the last 6 months?',
                timestampSec: 20,
                policyHighlight: 'Checking readiness: shoulder imaging prerequisite',
            },
            {
                speaker: 'patient',
                text: 'Yes, I had an MRI last month. It showed a full-thickness rotator cuff tear.',
                timestampSec: 25,
            },
            {
                speaker: 'assistant',
                text: 'Thank you. Because you have persistent functional weakness, failed conservative care, and recent imaging confirming a full-thickness tear, you are high surgical potential and will be prioritized in Dr. Martin\'s agenda.',
                timestampSec: 31,
                policyHighlight: 'High surgical potential: full-thickness cuff tear + failed conservative treatment',
            },
        ],
        triageResult: 'high_surgical_potential',
        triageSummary: 'Patient meets high surgical potential criteria: full-thickness rotator cuff tear on recent MRI, meaningful weakness, and failed 6+ weeks of conservative treatment. Prioritized in doctor\'s agenda.',
    },
    {
        id: 'scenario-2',
        patientName: 'Lucas',
        displayLabel: 'Pre-recorded call #2',
        age: 45,
        chiefComplaint: 'Sharp pinching sensation in shoulder',
        background: 'MRI from 2 months ago shows tendinopathy and bursitis without a full-thickness tear or repairable structural lesion. Persistent pain, but preserved strength and daily function.',
        audioSrc: '/audio/pre-recorded/lucas-demo.m4a',
        durationHintSec: 36,
        steps: [
            {
                speaker: 'assistant',
                text: 'Hello, I\'m calling regarding your referral to Dr. Martin. Can you tell me about your symptoms?',
                timestampSec: 0,
            },
            {
                speaker: 'patient',
                text: 'I have shoulder pain most days now. I already did therapy and two injections, but pain keeps coming back.',
                timestampSec: 4,
            },
            {
                speaker: 'assistant',
                text: 'Do you have recent imaging, and did it show a tendon tear or another surgical lesion?',
                timestampSec: 9,
            },
            {
                speaker: 'patient',
                text: 'My MRI is recent, but they said there is inflammation and tendinopathy, no full-thickness tear.',
                timestampSec: 14,
            },
            {
                speaker: 'assistant',
                text: 'Are you losing strength or unable to perform daily tasks because of weakness?',
                timestampSec: 19,
            },
            {
                speaker: 'patient',
                text: 'No major weakness. It mostly feels painful and tiring.',
                timestampSec: 23,
            },
            {
                speaker: 'assistant',
                text: 'Given persistent pain without a repairable surgical target on imaging, this is low surgical potential. You will be redirected towards a pain management doctor for non-surgical care optimization.',
                timestampSec: 29,
                policyHighlight: 'Low surgical potential: pain-dominant symptoms without surgical lesion',
            },
        ],
        triageResult: 'low_surgical_potential',
        triageSummary: 'Patient is low surgical potential: persistent pain profile without a repairable structural lesion and no objective major weakness. Redirected towards pain management doctor.',
    },
];

const TRIAGE_LABELS: Record<Scenario['triageResult'], { label: string; color: string; routeNote: string }> = {
    high_surgical_potential: {
        label: 'High Surgical Potential',
        color: 'text-flow-blue bg-flow-blue/12 border-flow-blue/35',
        routeNote: 'Prioritized in doctor\'s agenda',
    },
    low_surgical_potential: {
        label: 'Low Surgical Potential',
        color: 'text-text-secondary bg-bg-primary/75 border-border/55',
        routeNote: 'Redirected towards pain management doctor',
    },
};

function getAudioMissingMessage(scenario: Scenario): string {
    return `Add an audio file at ${scenario.audioSrc} to activate playback.`;
}

export function ObserveView() {
    const [expandedId, setExpandedId] = useState<string | null>(SCENARIOS[0]?.id ?? null);
    const [activePlaybackId, setActivePlaybackId] = useState<string | null>(null);
    const [currentTimeById, setCurrentTimeById] = useState<Record<string, number>>({});
    const [durationById, setDurationById] = useState<Record<string, number>>({});
    const [audioErrorById, setAudioErrorById] = useState<Record<string, string>>({});
    const audioRefs = useRef<Record<string, HTMLAudioElement | null>>({});
    useEffect(() => {
        return () => {
            Object.values(audioRefs.current).forEach((audio) => {
                if (audio) {
                    audio.pause();
                }
            });
        };
    }, []);

    const handleExpand = (id: string) => {
        if (expandedId === id) {
            const currentAudio = audioRefs.current[id];
            if (currentAudio && !currentAudio.paused) {
                currentAudio.pause();
            }
            setExpandedId(null);
            return;
        }

        if (activePlaybackId && activePlaybackId !== id) {
            const activeAudio = audioRefs.current[activePlaybackId];
            if (activeAudio && !activeAudio.paused) {
                activeAudio.pause();
            }
            setActivePlaybackId(null);
        }

        setExpandedId(id);
    };

    const playScenario = async (scenario: Scenario) => {
        const audio = audioRefs.current[scenario.id];
        if (!audio) return;

        if (activePlaybackId && activePlaybackId !== scenario.id) {
            const activeAudio = audioRefs.current[activePlaybackId];
            if (activeAudio && !activeAudio.paused) {
                activeAudio.pause();
            }
        }

        try {
            await audio.play();
            setAudioErrorById((prev) => ({ ...prev, [scenario.id]: '' }));
        } catch {
            setAudioErrorById((prev) => ({ ...prev, [scenario.id]: getAudioMissingMessage(scenario) }));
        }
    };

    const pauseScenario = (scenario: Scenario) => {
        const audio = audioRefs.current[scenario.id];
        if (!audio || audio.paused) return;
        audio.pause();
    };

    const restartScenario = async (scenario: Scenario) => {
        const audio = audioRefs.current[scenario.id];
        if (!audio) return;

        audio.currentTime = 0;
        setCurrentTimeById((prev) => ({ ...prev, [scenario.id]: 0 }));

        try {
            await audio.play();
            setAudioErrorById((prev) => ({ ...prev, [scenario.id]: '' }));
        } catch {
            setAudioErrorById((prev) => ({ ...prev, [scenario.id]: getAudioMissingMessage(scenario) }));
        }
    };

    const seekScenario = (scenario: Scenario, value: number) => {
        const audio = audioRefs.current[scenario.id];
        if (!audio) return;

        const duration = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : scenario.durationHintSec;
        const clampedTime = Math.max(0, Math.min(value, duration));
        audio.currentTime = clampedTime;
        setCurrentTimeById((prev) => ({ ...prev, [scenario.id]: clampedTime }));
    };

    return (
        <div className="space-y-4">
            {SCENARIOS.map((scenario) => {
                const isExpanded = expandedId === scenario.id;
                const isPlaying = activePlaybackId === scenario.id;
                const triage = TRIAGE_LABELS[scenario.triageResult];
                const currentTime = currentTimeById[scenario.id] ?? 0;
                const duration = durationById[scenario.id] ?? scenario.durationHintSec;
                const sliderMax = duration > 0 ? duration : scenario.durationHintSec;

                return (
                    <div key={scenario.id} className="border border-border/40 rounded-xl overflow-hidden bg-bg-secondary/20">
                        {/* Scenario Header */}
                        <button
                            onClick={() => handleExpand(scenario.id)}
                            className="w-full text-left px-5 py-4 flex items-center justify-between hover:bg-bg-secondary/40 transition-colors cursor-pointer"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-9 h-9 rounded-full bg-bg-panel flex items-center justify-center text-sm font-medium text-text-secondary">
                                    {scenario.patientName.split(' ').map((n) => n[0]).join('')}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-text-primary">
                                        {scenario.displayLabel ?? `${scenario.patientName}, ${scenario.age}`}
                                    </p>
                                    <p className="text-xs text-text-secondary mt-0.5">{scenario.chiefComplaint}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {isPlaying && (
                                    <span
                                        className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-accent-blue/30 bg-accent-blue/10"
                                        title="Playing"
                                        aria-label="Playing"
                                    >
                                        <span className="h-2 w-2 rounded-full bg-accent-blue animate-pulse" />
                                    </span>
                                )}
                                <div className="flex flex-col items-end">
                                    <span className={`text-[10px] font-medium px-2.5 py-1 rounded-full border ${triage.color}`}>
                                        {triage.label}
                                    </span>
                                    <p className="mt-1 text-[10px] leading-tight text-text-secondary text-right max-w-[220px]">
                                        {triage.routeNote}
                                    </p>
                                </div>
                                <svg
                                    className={`w-4 h-4 text-text-secondary transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                </svg>
                            </div>
                        </button>

                        {/* Expanded Conversation */}
                        <AnimatePresence>
                            {isExpanded && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="overflow-hidden"
                                >
                                    <div className="px-5 py-5 border-t border-border/30">
                                        <audio
                                            ref={(node) => {
                                                audioRefs.current[scenario.id] = node;
                                            }}
                                            src={scenario.audioSrc}
                                            preload="metadata"
                                            className="hidden"
                                            onLoadedMetadata={(event) => {
                                                const loadedDuration = event.currentTarget.duration;
                                                if (Number.isFinite(loadedDuration) && loadedDuration > 0) {
                                                    setDurationById((prev) => ({ ...prev, [scenario.id]: loadedDuration }));
                                                }
                                            }}
                                            onTimeUpdate={(event) => {
                                                const nextTime = event.currentTarget.currentTime;
                                                setCurrentTimeById((prev) => ({ ...prev, [scenario.id]: nextTime }));
                                            }}
                                            onPlay={() => setActivePlaybackId(scenario.id)}
                                            onPause={() => {
                                                setActivePlaybackId((current) => (current === scenario.id ? null : current));
                                            }}
                                            onEnded={() => {
                                                setActivePlaybackId((current) => (current === scenario.id ? null : current));
                                            }}
                                            onError={() => {
                                                setAudioErrorById((prev) => ({ ...prev, [scenario.id]: getAudioMissingMessage(scenario) }));
                                            }}
                                        />

                                        <div className="rounded-2xl border border-border/35 bg-bg-primary/65 px-5 py-5">
                                            <div className="flex items-center justify-center gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        void playScenario(scenario);
                                                    }}
                                                    aria-label="Play"
                                                    title="Play"
                                                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-accent-blue/40 bg-accent-blue/12 text-accent-blue hover:bg-accent-blue/22 transition-colors cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
                                                    disabled={isPlaying}
                                                >
                                                    <svg className="h-4 w-4 translate-x-[1px]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                                        <path d="M7.5 5.5v13l10-6.5-10-6.5z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => pauseScenario(scenario)}
                                                    aria-label="Pause"
                                                    title="Pause"
                                                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border/55 bg-bg-panel/70 text-text-primary hover:border-border/75 transition-colors cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
                                                    disabled={!isPlaying}
                                                >
                                                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                                        <path d="M7.5 5.5h3v13h-3zM13.5 5.5h3v13h-3z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        void restartScenario(scenario);
                                                    }}
                                                    aria-label="Restart"
                                                    title="Restart"
                                                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border/55 bg-bg-panel/70 text-text-primary hover:border-border/75 transition-colors cursor-pointer"
                                                >
                                                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                                        <path d="M20 11a8 8 0 10-2.34 5.66M20 4v7h-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                </button>
                                            </div>

                                            <div className="mt-5">
                                                <input
                                                    type="range"
                                                    min={0}
                                                    max={sliderMax}
                                                    step={0.1}
                                                    value={Math.min(currentTime, sliderMax)}
                                                    onChange={(event) => seekScenario(scenario, Number(event.currentTarget.value))}
                                                    aria-label="Audio progress"
                                                    className="w-full accent-[#4d78b8] cursor-pointer"
                                                />
                                            </div>

                                            <div className="mt-4 flex justify-center" aria-hidden="true">
                                                <div className="inline-flex items-end gap-1 rounded-md border border-white/10 bg-[#0f1319] px-3 py-2 shadow-inner">
                                                    {Array.from({ length: 9 }).map((_, index) => {
                                                        const amplitude = 3 + ((index * 7) % 5);

                                                        return (
                                                            <motion.span
                                                                key={`${scenario.id}-meter-dot-${index}`}
                                                                className="h-1.5 w-1.5 rounded-full bg-white/75"
                                                                animate={isPlaying ? { y: [0, -amplitude, 0], opacity: [0.45, 1, 0.45] } : { y: 0, opacity: 0.45 }}
                                                                transition={
                                                                    isPlaying
                                                                        ? {
                                                                            duration: 0.55 + (index % 3) * 0.08,
                                                                            repeat: Infinity,
                                                                            ease: 'easeInOut',
                                                                            delay: index * 0.045,
                                                                        }
                                                                        : { duration: 0.2 }
                                                                }
                                                            />
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {audioErrorById[scenario.id] && (
                                                <div className="mt-3 flex justify-center">
                                                    <span
                                                        className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-accent-blue/35 bg-accent-blue/10 text-accent-blue"
                                                        title={audioErrorById[scenario.id]}
                                                    >
                                                        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                                            <path d="M12 8v5m0 3h.01M10.29 3.86l-8.1 14A1 1 0 003.05 19h17.9a1 1 0 00.86-1.5l-8.1-14a1 1 0 00-1.72 0z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                                        </svg>
                                                        <span className="sr-only">{audioErrorById[scenario.id]}</span>
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                );
            })}
        </div>
    );
}
