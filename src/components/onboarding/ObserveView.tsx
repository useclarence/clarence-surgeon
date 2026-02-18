'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
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

// WeakMap ensures we never call createMediaElementSource twice on the same element
const sourceMap = new WeakMap<HTMLAudioElement, { ctx: AudioContext; analyser: AnalyserNode }>();

function getOrCreateAnalyser(audio: HTMLAudioElement) {
    const existing = sourceMap.get(audio);
    if (existing) return existing;

    const ctx = new AudioContext();
    const source = ctx.createMediaElementSource(audio);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 128;
    analyser.smoothingTimeConstant = 0.7;
    source.connect(analyser);
    analyser.connect(ctx.destination);

    const entry = { ctx, analyser };
    sourceMap.set(audio, entry);
    return entry;
}

function useAudioAnalyser(audioElement: HTMLAudioElement | null, isPlaying: boolean, barCount: number) {
    const rafRef = useRef<number>(0);
    const [levels, setLevels] = useState<number[]>(() => Array(barCount).fill(0) as number[]);

    useEffect(() => {
        if (!audioElement || !isPlaying) {
            cancelAnimationFrame(rafRef.current);
            setLevels(Array(barCount).fill(0) as number[]);
            return;
        }

        const { ctx, analyser } = getOrCreateAnalyser(audioElement);

        if (ctx.state === 'suspended') {
            void ctx.resume();
        }

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        // Per-bar variation offsets so each bar wiggles slightly differently
        const offsets = Array.from({ length: barCount }, (_, i) => 0.12 * (i - Math.floor(barCount / 2)));

        const tick = () => {
            analyser.getByteFrequencyData(dataArray);
            // Compute overall RMS volume from all bins
            let sumSq = 0;
            for (let j = 0; j < dataArray.length; j++) {
                const v = (dataArray[j] ?? 0) / 255;
                sumSq += v * v;
            }
            const rms = Math.sqrt(sumSq / dataArray.length);
            // Boost so speech-level audio fills more of the range
            const volume = Math.min(1, rms * 2.5);

            const next: number[] = [];
            for (let i = 0; i < barCount; i++) {
                // Add per-bar variation based on time for a wave-like effect
                const wave = Math.sin(Date.now() / 180 + offsets[i]! * 8) * 0.15;
                next.push(Math.max(0, Math.min(1, volume + wave * volume)));
            }

            setLevels(next);
            rafRef.current = requestAnimationFrame(tick);
        };

        rafRef.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(rafRef.current);
    }, [audioElement, isPlaying, barCount]);

    return levels;
}

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
            {SCENARIOS.map((scenario, scenarioIndex) => (
                <ScenarioCard
                    key={scenario.id}
                    scenario={scenario}
                    index={scenarioIndex}
                    isExpanded={expandedId === scenario.id}
                    isPlaying={activePlaybackId === scenario.id}
                    currentTime={currentTimeById[scenario.id] ?? 0}
                    duration={durationById[scenario.id] ?? scenario.durationHintSec}
                    audioError={audioErrorById[scenario.id]}
                    onExpand={() => handleExpand(scenario.id)}
                    onPlay={() => { void playScenario(scenario); }}
                    onPause={() => pauseScenario(scenario)}
                    onRestart={() => { void restartScenario(scenario); }}
                    onSeek={(value) => seekScenario(scenario, value)}
                    onAudioRef={(node) => { audioRefs.current[scenario.id] = node; }}
                    onLoadedMetadata={(d) => setDurationById((prev) => ({ ...prev, [scenario.id]: d }))}
                    onTimeUpdate={(t) => setCurrentTimeById((prev) => ({ ...prev, [scenario.id]: t }))}
                    onPlayEvent={() => setActivePlaybackId(scenario.id)}
                    onPauseEvent={() => setActivePlaybackId((c) => (c === scenario.id ? null : c))}
                    onEndedEvent={() => setActivePlaybackId((c) => (c === scenario.id ? null : c))}
                    onErrorEvent={() => setAudioErrorById((prev) => ({ ...prev, [scenario.id]: getAudioMissingMessage(scenario) }))}
                />
            ))}
        </div>
    );
}

interface ScenarioCardProps {
    scenario: Scenario;
    index: number;
    isExpanded: boolean;
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    audioError: string | undefined;
    onExpand: () => void;
    onPlay: () => void;
    onPause: () => void;
    onRestart: () => void;
    onSeek: (value: number) => void;
    onAudioRef: (node: HTMLAudioElement | null) => void;
    onLoadedMetadata: (duration: number) => void;
    onTimeUpdate: (time: number) => void;
    onPlayEvent: () => void;
    onPauseEvent: () => void;
    onEndedEvent: () => void;
    onErrorEvent: () => void;
}

function ScenarioCard({
    scenario,
    index,
    isExpanded,
    isPlaying,
    currentTime,
    duration,
    audioError,
    onExpand,
    onPlay,
    onPause,
    onRestart,
    onSeek,
    onAudioRef,
    onLoadedMetadata,
    onTimeUpdate,
    onPlayEvent,
    onPauseEvent,
    onEndedEvent,
    onErrorEvent,
}: ScenarioCardProps) {
    const triage = TRIAGE_LABELS[scenario.triageResult];
    const sliderMax = duration > 0 ? duration : scenario.durationHintSec;
    const [audioEl, setAudioEl] = useState<HTMLAudioElement | null>(null);
    const levels = useAudioAnalyser(audioEl, isPlaying, 5);

    const setAudioRef = useCallback((node: HTMLAudioElement | null) => {
        setAudioEl(node);
        onAudioRef(node);
    }, [onAudioRef]);

    return (
        <div className="border border-border/40 rounded-xl overflow-hidden bg-bg-secondary/20">
            <button
                onClick={onExpand}
                className="w-full text-left px-5 py-4 flex items-center justify-between hover:bg-bg-secondary/40 transition-colors cursor-pointer"
            >
                <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-full bg-bg-panel flex items-center justify-center text-sm font-medium text-text-secondary">
                        {index + 1}
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
                                ref={setAudioRef}
                                src={scenario.audioSrc}
                                preload="metadata"
                                className="hidden"
                                onLoadedMetadata={(event) => {
                                    const d = event.currentTarget.duration;
                                    if (Number.isFinite(d) && d > 0) onLoadedMetadata(d);
                                }}
                                onTimeUpdate={(event) => onTimeUpdate(event.currentTarget.currentTime)}
                                onPlay={onPlayEvent}
                                onPause={onPauseEvent}
                                onEnded={onEndedEvent}
                                onError={onErrorEvent}
                            />

                            <div className="rounded-2xl border border-border/35 bg-bg-primary/65 px-5 py-5">
                                <div className="flex items-center justify-center gap-3">
                                    <button
                                        type="button"
                                        onClick={onPlay}
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
                                        onClick={onPause}
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
                                        onClick={onRestart}
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
                                        onChange={(event) => onSeek(Number(event.currentTarget.value))}
                                        aria-label="Audio progress"
                                        className="w-full accent-[#4d78b8] cursor-pointer"
                                    />
                                </div>

                                <div className="mt-4 flex items-end justify-center h-7" aria-hidden="true">
                                    <div className="inline-flex items-end gap-[3px]">
                                        {levels.map((level, i) => {
                                            const minH = 4;
                                            const maxH = 28;
                                            const height = minH + level * (maxH - minH);
                                            const opacity = isPlaying ? 0.5 + level * 0.5 : 0.3;

                                            return (
                                                <div
                                                    key={i}
                                                    className="w-[3px] rounded-full bg-accent-blue"
                                                    style={{
                                                        height: `${height}px`,
                                                        opacity,
                                                        transition: 'height 0.08s ease-out, opacity 0.08s ease-out',
                                                    }}
                                                />
                                            );
                                        })}
                                    </div>
                                </div>

                                {audioError && (
                                    <div className="mt-3 flex justify-center">
                                        <span
                                            className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-accent-blue/35 bg-accent-blue/10 text-accent-blue"
                                            title={audioError}
                                        >
                                            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                                <path d="M12 8v5m0 3h.01M10.29 3.86l-8.1 14A1 1 0 003.05 19h17.9a1 1 0 00.86-1.5l-8.1-14a1 1 0 00-1.72 0z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                            <span className="sr-only">{audioError}</span>
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
}
