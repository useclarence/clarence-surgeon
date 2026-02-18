'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import type { BuilderMessage } from '@/lib/types';
import { ClarificationChips } from './ClarificationChips';

interface MessageBubbleProps {
    message: BuilderMessage;
    onAnswerClarification?: (clarificationId: string, answer: string) => void;
    onEdit?: (content: string) => void;
}

export function MessageBubble({ message, onAnswerClarification, onEdit }: MessageBubbleProps) {
    const isUser = message.role === 'user';
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(message.content);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (editing && textareaRef.current) {
            const ta = textareaRef.current;
            ta.focus();
            ta.selectionStart = ta.value.length;
            ta.selectionEnd = ta.value.length;
            ta.style.height = 'auto';
            ta.style.height = `${ta.scrollHeight}px`;
        }
    }, [editing]);

    const handleSave = useCallback(() => {
        const trimmed = draft.trim();
        if (trimmed && trimmed !== message.content) {
            onEdit?.(trimmed);
        }
        setEditing(false);
    }, [draft, message.content, onEdit]);

    const handleCancel = useCallback(() => {
        setDraft(message.content);
        setEditing(false);
    }, [message.content]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSave();
        } else if (e.key === 'Escape') {
            handleCancel();
        }
    }, [handleSave, handleCancel]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.19, 1, 0.22, 1] }}
            className={`flex ${isUser ? 'justify-end' : 'justify-start'} w-full max-w-4xl mx-auto`}
        >
            <div
                className={`w-full max-w-[85%] ${isUser
                    ? 'bg-bg-secondary/60 rounded-sm px-6 py-4'
                    : 'space-y-6'
                    }`}
            >
                {isUser ? (
                    editing ? (
                        <div className="flex flex-col gap-2">
                            <textarea
                                ref={textareaRef}
                                value={draft}
                                onChange={(e) => {
                                    setDraft(e.target.value);
                                    e.target.style.height = 'auto';
                                    e.target.style.height = `${e.target.scrollHeight}px`;
                                }}
                                onKeyDown={handleKeyDown}
                                className="w-full resize-none rounded border border-accent-blue/30 bg-bg-primary/60 px-3 py-2 text-sm text-text-primary leading-relaxed focus:outline-none focus:border-accent-blue/60"
                                rows={3}
                            />
                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={handleCancel}
                                    className="px-3 py-1 text-[11px] uppercase tracking-wider text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={!draft.trim()}
                                    className="px-3 py-1 text-[11px] uppercase tracking-wider text-accent-blue hover:text-accent-blue/80 font-bold transition-colors disabled:opacity-40 cursor-pointer"
                                >
                                    Save
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-start gap-4">
                            <p className="text-sm text-text-primary font-medium leading-relaxed flex-1">{message.content}</p>
                            {onEdit && (
                                <button
                                    onClick={() => { setDraft(message.content); setEditing(true); }}
                                    className="shrink-0 mt-0.5 p-1 rounded text-text-secondary/40 hover:text-text-secondary transition-colors cursor-pointer"
                                    aria-label="Edit message"
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                                        <path d="m15 5 4 4" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    )
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
