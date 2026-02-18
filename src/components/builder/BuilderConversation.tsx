'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { BuilderMessage } from '@/lib/types';
import { MessageBubble } from './MessageBubble';

interface BuilderConversationProps {
    messages: BuilderMessage[];
    isProcessing: boolean;
    streamingThought: string;
    ruleCount: number;
    answerCount: number;
    onAnswerClarification: (messageId: string, clarificationId: string, answer: string) => void;
}

const BODY_PART_COUNT = 13;

const PART_SPRING = {
    type: 'spring',
    stiffness: 260,
    damping: 22,
    mass: 0.52,
} as const;

const TARGET_RULES_FOR_FULL_BUILD = 24;
const TARGET_ANSWERS_FOR_FULL_BUILD = BODY_PART_COUNT;

function clamp01(value: number) {
    return Math.min(1, Math.max(0, value));
}

function pieceProgress(progress: number, pieceIndex: number, totalPieces: number) {
    return clamp01(progress * totalPieces - pieceIndex);
}

function MiniBuildCharacter({ progress }: { progress: number }) {
    const uid = useId().replace(/:/g, '');
    const bodyLightGradientId = `${uid}-body-light-gradient`;
    const bodyDarkGradientId = `${uid}-body-dark-gradient`;
    const limbLightGradientId = `${uid}-limb-light-gradient`;
    const limbDarkGradientId = `${uid}-limb-dark-gradient`;
    const neckLightGradientId = `${uid}-neck-light-gradient`;
    const neckDarkGradientId = `${uid}-neck-dark-gradient`;
    const faceLightGradientId = `${uid}-face-light-gradient`;
    const faceDarkGradientId = `${uid}-face-dark-gradient`;
    const handLightGradientId = `${uid}-hand-light-gradient`;
    const handDarkGradientId = `${uid}-hand-dark-gradient`;
    const shoeLightGradientId = `${uid}-shoe-light-gradient`;
    const shoeDarkGradientId = `${uid}-shoe-dark-gradient`;
    const shadowGradientId = `${uid}-shadow-gradient`;

    const leftFootProgress = pieceProgress(progress, 0, BODY_PART_COUNT);
    const rightFootProgress = pieceProgress(progress, 1, BODY_PART_COUNT);
    const leftLegProgress = pieceProgress(progress, 2, BODY_PART_COUNT);
    const rightLegProgress = pieceProgress(progress, 3, BODY_PART_COUNT);
    const hipsProgress = pieceProgress(progress, 4, BODY_PART_COUNT);
    const torsoProgress = pieceProgress(progress, 5, BODY_PART_COUNT);
    const leftArmProgress = pieceProgress(progress, 6, BODY_PART_COUNT);
    const rightArmProgress = pieceProgress(progress, 7, BODY_PART_COUNT);
    const leftHandProgress = pieceProgress(progress, 8, BODY_PART_COUNT);
    const rightHandProgress = pieceProgress(progress, 9, BODY_PART_COUNT);
    const fingersProgress = pieceProgress(progress, 10, BODY_PART_COUNT);
    const neckProgress = pieceProgress(progress, 11, BODY_PART_COUNT);
    const faceProgress = pieceProgress(progress, 12, BODY_PART_COUNT);

    const partMotion = (partProgress: number, floatDistance: number) => ({
        opacity: partProgress,
        y: (1 - partProgress) * floatDistance,
        scale: 0.88 + partProgress * 0.12,
    });

    return (
        <div className="relative shrink-0 rounded-2xl border border-accent-blue/20 bg-gradient-to-b from-bg-primary to-bg-panel/80 p-2.5 shadow-[0_14px_32px_-24px_rgba(77,120,184,0.95)]">
            <motion.svg
                className="h-[88px] w-[72px] text-accent-blue"
                viewBox="0 0 160 220"
                fill="none"
                role="img"
                aria-label="Character body progressively assembling"
                animate={progress > 0 ? { y: [0, -1.1, 0, 0.9, 0] } : { y: 0 }}
                transition={
                    progress > 0
                        ? { duration: 3.8, ease: 'easeInOut', repeat: Infinity, repeatType: 'loop' }
                        : { duration: 0.2 }
                }
            >
                <defs>
                    <radialGradient id={shadowGradientId} cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="currentColor" stopOpacity="0.26" />
                        <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                    </radialGradient>
                    <linearGradient id={bodyLightGradientId} x1="80" y1="56" x2="80" y2="164" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#d8e8ff" />
                        <stop offset="55%" stopColor="#bfd7fb" />
                        <stop offset="100%" stopColor="#a9c6f1" />
                    </linearGradient>
                    <linearGradient id={bodyDarkGradientId} x1="80" y1="56" x2="80" y2="164" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#84aee8" />
                        <stop offset="52%" stopColor="#5b88c9" />
                        <stop offset="100%" stopColor="#3f69a7" />
                    </linearGradient>
                    <linearGradient id={limbLightGradientId} x1="80" y1="90" x2="80" y2="206" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#c7ddff" />
                        <stop offset="100%" stopColor="#a9c8f1" />
                    </linearGradient>
                    <linearGradient id={limbDarkGradientId} x1="80" y1="90" x2="80" y2="206" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#6186bd" />
                        <stop offset="100%" stopColor="#36588e" />
                    </linearGradient>
                    <linearGradient id={shoeLightGradientId} x1="80" y1="193" x2="80" y2="208" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#9fc0ed" />
                        <stop offset="100%" stopColor="#84a9da" />
                    </linearGradient>
                    <linearGradient id={shoeDarkGradientId} x1="80" y1="193" x2="80" y2="208" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#2f4f82" />
                        <stop offset="100%" stopColor="#223a62" />
                    </linearGradient>
                    <linearGradient id={neckLightGradientId} x1="80" y1="61" x2="80" y2="75" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#eaf2ff" />
                        <stop offset="100%" stopColor="#d2e3fd" />
                    </linearGradient>
                    <linearGradient id={neckDarkGradientId} x1="80" y1="61" x2="80" y2="75" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#dce8ff" />
                        <stop offset="100%" stopColor="#bccff3" />
                    </linearGradient>
                    <radialGradient id={faceLightGradientId} cx="40%" cy="30%" r="68%">
                        <stop offset="0%" stopColor="#f4f9ff" />
                        <stop offset="100%" stopColor="#dce9ff" />
                    </radialGradient>
                    <radialGradient id={faceDarkGradientId} cx="40%" cy="30%" r="68%">
                        <stop offset="0%" stopColor="#edf4ff" />
                        <stop offset="100%" stopColor="#c9dbfb" />
                    </radialGradient>
                    <radialGradient id={handLightGradientId} cx="36%" cy="32%" r="68%">
                        <stop offset="0%" stopColor="#f1f7ff" />
                        <stop offset="100%" stopColor="#d6e6fd" />
                    </radialGradient>
                    <radialGradient id={handDarkGradientId} cx="36%" cy="32%" r="68%">
                        <stop offset="0%" stopColor="#e9f2ff" />
                        <stop offset="100%" stopColor="#c4d6f6" />
                    </radialGradient>
                </defs>

                <ellipse cx="80" cy="212" rx="30" ry="11" fill={`url(#${shadowGradientId})`} />

                {/* Base silhouette: always visible (light blue) */}
                <g>
                    <rect x="55" y="196" width="22" height="8" rx="4" fill={`url(#${shoeLightGradientId})`} />
                    <rect x="84" y="196" width="22" height="8" rx="4" fill={`url(#${shoeLightGradientId})`} />
                    <rect x="61" y="142" width="12" height="53" rx="6" fill={`url(#${limbLightGradientId})`} />
                    <rect x="87" y="142" width="12" height="53" rx="6" fill={`url(#${limbLightGradientId})`} />
                    <rect x="58" y="130" width="44" height="16" rx="8" fill={`url(#${bodyLightGradientId})`} />
                    <path d="M58 80c0-13 10-23 22-23s22 10 22 23v52H58V80z" fill={`url(#${bodyLightGradientId})`} />
                    <path d="M63 86c2-10 9-16 17-16" stroke="white" strokeOpacity={0.48} strokeWidth="3" strokeLinecap="round" />
                    <path d="M58 115h44" stroke="#8baedf" strokeOpacity={0.55} strokeWidth="2" />
                    <rect x="38" y="98" width="12" height="42" rx="6" transform="rotate(-28 38 98)" fill={`url(#${limbLightGradientId})`} />
                    <rect x="110" y="92" width="12" height="42" rx="6" transform="rotate(28 110 92)" fill={`url(#${limbLightGradientId})`} />
                    <ellipse cx="35" cy="132" rx="8.5" ry="7" fill={`url(#${handLightGradientId})`} />
                    <ellipse cx="125" cy="132" rx="8.5" ry="7" fill={`url(#${handLightGradientId})`} />
                    <rect x="24" y="122" width="8" height="3.2" rx="1.6" transform="rotate(-32 24 122)" fill="#d4e4fb" />
                    <rect x="22" y="130" width="8" height="3.2" rx="1.6" transform="rotate(-8 22 130)" fill="#d4e4fb" />
                    <rect x="24" y="138" width="8" height="3.2" rx="1.6" transform="rotate(24 24 138)" fill="#d4e4fb" />
                    <rect x="128" y="122" width="8" height="3.2" rx="1.6" transform="rotate(32 128 122)" fill="#d4e4fb" />
                    <rect x="130" y="130" width="8" height="3.2" rx="1.6" transform="rotate(8 130 130)" fill="#d4e4fb" />
                    <rect x="128" y="138" width="8" height="3.2" rx="1.6" transform="rotate(-24 128 138)" fill="#d4e4fb" />
                    <rect x="72" y="61" width="16" height="13" rx="6.5" fill={`url(#${neckLightGradientId})`} />
                    <circle cx="80" cy="40" r="22" fill={`url(#${faceLightGradientId})`} />
                    <circle cx="80" cy="40" r="21.5" stroke="#a8c4eb" strokeOpacity={0.5} />
                    <ellipse cx="67" cy="48" rx="4.2" ry="2.2" fill="#bfd3f3" fillOpacity={0.85} />
                    <ellipse cx="93" cy="48" rx="4.2" ry="2.2" fill="#bfd3f3" fillOpacity={0.85} />
                    <ellipse cx="72.5" cy="37.5" rx="2.2" ry="2.2" fill="#95b4e1" />
                    <ellipse cx="87.5" cy="37.5" rx="2.2" ry="2.2" fill="#95b4e1" />
                    <path d="M71 49c2.6 2.7 15.4 2.7 18 0" stroke="#8eaedf" strokeWidth="2.4" strokeLinecap="round" />
                </g>

                {/* Dark overlay: appears progressively on top of the base silhouette */}
                <motion.g animate={partMotion(leftFootProgress, 8)} transition={PART_SPRING}>
                    <rect x="55" y="196" width="22" height="8" rx="4" fill={`url(#${shoeDarkGradientId})`} />
                </motion.g>
                <motion.g animate={partMotion(rightFootProgress, 8)} transition={PART_SPRING}>
                    <rect x="84" y="196" width="22" height="8" rx="4" fill={`url(#${shoeDarkGradientId})`} />
                </motion.g>
                <motion.g animate={partMotion(leftLegProgress, 11)} transition={PART_SPRING}>
                    <rect x="61" y="142" width="12" height="53" rx="6" fill={`url(#${limbDarkGradientId})`} />
                </motion.g>
                <motion.g animate={partMotion(rightLegProgress, 11)} transition={PART_SPRING}>
                    <rect x="87" y="142" width="12" height="53" rx="6" fill={`url(#${limbDarkGradientId})`} />
                </motion.g>
                <motion.g animate={partMotion(hipsProgress, 10)} transition={PART_SPRING}>
                    <rect x="58" y="130" width="44" height="16" rx="8" fill={`url(#${bodyDarkGradientId})`} />
                </motion.g>
                <motion.g animate={partMotion(torsoProgress, 10)} transition={PART_SPRING}>
                    <path d="M58 80c0-13 10-23 22-23s22 10 22 23v52H58V80z" fill={`url(#${bodyDarkGradientId})`} />
                    <path d="M63 86c2-10 9-16 17-16" stroke="white" strokeOpacity={0.42} strokeWidth="3" strokeLinecap="round" />
                    <path d="M58 115h44" stroke="#2f4f82" strokeOpacity={0.4} strokeWidth="2" />
                </motion.g>
                <motion.g animate={partMotion(leftArmProgress, 9)} transition={PART_SPRING}>
                    <rect x="38" y="98" width="12" height="42" rx="6" transform="rotate(-28 38 98)" fill={`url(#${limbDarkGradientId})`} />
                </motion.g>
                <motion.g animate={partMotion(rightArmProgress, 9)} transition={PART_SPRING}>
                    <rect x="110" y="92" width="12" height="42" rx="6" transform="rotate(28 110 92)" fill={`url(#${limbDarkGradientId})`} />
                </motion.g>
                <motion.g animate={partMotion(leftHandProgress, 7)} transition={PART_SPRING}>
                    <ellipse cx="35" cy="132" rx="8.5" ry="7" fill={`url(#${handDarkGradientId})`} />
                </motion.g>
                <motion.g animate={partMotion(rightHandProgress, 7)} transition={PART_SPRING}>
                    <ellipse cx="125" cy="132" rx="8.5" ry="7" fill={`url(#${handDarkGradientId})`} />
                </motion.g>
                <motion.g animate={partMotion(fingersProgress, 8)} transition={PART_SPRING}>
                    <rect x="24" y="122" width="8" height="3.2" rx="1.6" transform="rotate(-32 24 122)" fill="#b6caf0" />
                    <rect x="22" y="130" width="8" height="3.2" rx="1.6" transform="rotate(-8 22 130)" fill="#b6caf0" />
                    <rect x="24" y="138" width="8" height="3.2" rx="1.6" transform="rotate(24 24 138)" fill="#b6caf0" />
                    <rect x="128" y="122" width="8" height="3.2" rx="1.6" transform="rotate(32 128 122)" fill="#b6caf0" />
                    <rect x="130" y="130" width="8" height="3.2" rx="1.6" transform="rotate(8 130 130)" fill="#b6caf0" />
                    <rect x="128" y="138" width="8" height="3.2" rx="1.6" transform="rotate(-24 128 138)" fill="#b6caf0" />
                </motion.g>
                <motion.g animate={partMotion(neckProgress, 7)} transition={PART_SPRING}>
                    <rect x="72" y="61" width="16" height="13" rx="6.5" fill={`url(#${neckDarkGradientId})`} />
                </motion.g>
                <motion.g animate={partMotion(faceProgress, 6)} transition={PART_SPRING}>
                    <circle cx="80" cy="40" r="22" fill={`url(#${faceDarkGradientId})`} />
                    <circle cx="80" cy="40" r="21.5" stroke="#7ea6df" strokeOpacity={0.45} />
                    <ellipse cx="67" cy="48" rx="4.2" ry="2.2" fill="#a8c0ea" fillOpacity={0.55} />
                    <ellipse cx="93" cy="48" rx="4.2" ry="2.2" fill="#a8c0ea" fillOpacity={0.55} />
                    <motion.g
                        style={{ originX: 0.5, originY: 0.5, transformBox: 'fill-box' }}
                        animate={faceProgress > 0.88 ? { scaleY: [1, 1, 0.22, 1, 1] } : { scaleY: 1 }}
                        transition={
                            faceProgress > 0.88
                                ? { duration: 3.1, ease: 'easeInOut', repeat: Infinity, repeatDelay: 1.8 }
                                : { duration: 0.2 }
                        }
                    >
                        <ellipse cx="72.5" cy="37.5" rx="2.2" ry="2.2" fill="#2c4e85" />
                        <ellipse cx="87.5" cy="37.5" rx="2.2" ry="2.2" fill="#2c4e85" />
                    </motion.g>
                    <path d="M71 49c2.6 2.7 15.4 2.7 18 0" stroke="#2c4e85" strokeWidth="2.4" strokeLinecap="round" />
                </motion.g>
            </motion.svg>
        </div>
    );
}

export function BuilderConversation({
    messages,
    isProcessing,
    streamingThought,
    ruleCount,
    answerCount,
    onAnswerClarification,
}: BuilderConversationProps) {
    const bottomRef = useRef<HTMLDivElement>(null);
    const [buildProgress, setBuildProgress] = useState(0);
    const progressRef = useRef(0);
    const baseRuleCountRef = useRef<number>(ruleCount);
    const baseAnswerCountRef = useRef<number>(answerCount);

    const sessionRuleCount = Math.max(0, ruleCount - baseRuleCountRef.current);
    const sessionAnswerCount = Math.max(0, answerCount - baseAnswerCountRef.current);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isProcessing, streamingThought]);

    useEffect(() => {
        let rafId = 0;
        const startProgress = progressRef.current;
        const ruleDrivenProgress = clamp01(sessionRuleCount / TARGET_RULES_FOR_FULL_BUILD);
        const answerDrivenProgress = clamp01(sessionAnswerCount / TARGET_ANSWERS_FOR_FULL_BUILD);
        const gatedProgress = Math.min(ruleDrivenProgress, answerDrivenProgress);
        const targetProgress = Math.max(startProgress, gatedProgress);
        const startTime = performance.now();
        const durationMs = 420;

        const animate = (now: number) => {
            const elapsedRatio = clamp01((now - startTime) / durationMs);
            const eased = 1 - Math.pow(1 - elapsedRatio, 2.2);
            const next = startProgress + (targetProgress - startProgress) * eased;
            progressRef.current = next;
            setBuildProgress(next);

            if (elapsedRatio < 1) {
                rafId = requestAnimationFrame(animate);
            }
        };

        rafId = requestAnimationFrame(animate);
        return () => {
            cancelAnimationFrame(rafId);
        };
    }, [sessionRuleCount, sessionAnswerCount]);

    const completionPercent = Math.round(buildProgress * 100);

    return (
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
            {messages.map((msg) => (
                <MessageBubble
                    key={msg.id}
                    message={msg}
                    onAnswerClarification={(clarificationId, answer) =>
                        onAnswerClarification(msg.id, clarificationId, answer)
                    }
                />
            ))}

            <AnimatePresence>
                {isProcessing && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2 }}
                        className="flex justify-start"
                    >
                        <div className="flex items-start gap-3 px-4 py-3 rounded-xl border border-border bg-bg-panel/30 max-w-[85%]">
                            <MiniBuildCharacter progress={buildProgress} />

                            <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2 text-[10px] uppercase tracking-[0.16em] text-text-secondary/90">
                                    <span>Building Agent</span>
                                    <span>{completionPercent}%</span>
                                </div>

                                <div className="mt-1.5 h-1.5 w-full rounded-full bg-bg-primary/70 border border-border/40 overflow-hidden">
                                    <div
                                        className="h-full rounded-full bg-accent-blue transition-[width] duration-150"
                                        style={{ width: `${completionPercent}%` }}
                                    />
                                </div>

                                {streamingThought && (
                                    <p className="mt-2 max-h-24 overflow-y-auto text-[11px] leading-relaxed text-text-secondary/90 whitespace-pre-wrap">
                                        {streamingThought}
                                    </p>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div ref={bottomRef} />
        </div>
    );
}
