'use client';

import { motion } from 'framer-motion';
import type { BuilderMessage } from '@/lib/types';
import { ClarificationChips } from './ClarificationChips';

interface MessageBubbleProps {
    message: BuilderMessage;
    onAnswerClarification?: (clarificationId: string, answer: string) => void;
}

export function MessageBubble({ message, onAnswerClarification }: MessageBubbleProps) {
    const isUser = message.role === 'user';

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.19, 1, 0.22, 1] }}
            className={`flex ${isUser ? 'justify-end' : 'justify-start'} w-full max-w-4xl mx-auto`}
        >
            <div
                className={`w-full max-w-[85%] ${
                    isUser
                        ? 'bg-bg-secondary/60 rounded-sm px-6 py-4'
                        : 'space-y-6'
                }`}
            >
                {isUser ? (
                    <div className="flex items-start gap-4">
                        <span className="text-[10px] uppercase tracking-widest text-text-secondary mt-1 font-bold">User</span>
                        <p className="text-sm text-text-primary font-medium leading-relaxed">{message.content}</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {/* Onboarding messages render as a prestigious document block */}
                        {message.isOnboarding && (
                            <div className="px-2 py-1">
                                <span className="text-[10px] uppercase tracking-[0.3em] text-accent-blue font-bold mb-3 block opacity-50">Surgeon Logic Engine</span>
                                <div className="text-lg font-serif text-text-primary leading-[1.6] whitespace-pre-line">
                                    {message.content.split('**').map((part, i) =>
                                        i % 2 === 1 ? (
                                            <span key={i} className="text-accent-blue font-medium border-b border-accent-blue/20">
                                                {part}
                                            </span>
                                        ) : (
                                            <span key={i} className="opacity-90">{part}</span>
                                        )
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Standard assistant reflections / summary text */}
                        {!message.isOnboarding && message.content.trim() && (
                            <div className="rounded-xl border border-border/60 bg-bg-panel/40 px-4 py-3">
                                <p className="text-sm text-text-primary leading-relaxed whitespace-pre-line">
                                    {message.content}
                                </p>
                            </div>
                        )}

                        {/* Clarification questions (batch — sequential reveal) */}
                        {message.clarifications && message.clarifications.length > 0 && (
                            <div className="space-y-6 mt-4 border-l-2 border-accent-blue/10 pl-8">
                                {message.clarifications.map((clarification, index) => {
                                    // Only show answered questions + the next unanswered one
                                    const firstUnansweredIndex = message.clarifications!.findIndex((c) => !c.answered);
                                    const isVisible = clarification.answered || index === firstUnansweredIndex;
                                    if (!isVisible) return null;

                                    return (
                                        <ClarificationChips
                                            key={clarification.id}
                                            clarification={clarification}
                                            questionNumber={index + 1}
                                            totalQuestions={message.clarifications!.length}
                                            onAnswer={(answer) =>
                                                onAnswerClarification?.(clarification.id, answer)
                                            }
                                        />
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {!message.isOnboarding && (
                    <div className={`mt-2 ${isUser ? 'text-right' : 'text-left opacity-40'}`}>
                        <span className="text-[9px] uppercase tracking-widest text-text-secondary font-medium">
                            {new Date(message.timestamp).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                            })}
                        </span>
                    </div>
                )}
            </div>
        </motion.div>
    );
}
