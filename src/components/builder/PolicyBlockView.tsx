'use client';

import { motion, AnimatePresence } from 'framer-motion';
import type { PolicyBlock } from '@/lib/types';

interface PolicyBlockViewProps {
    title: string;
    icon: React.ReactNode;
    block: PolicyBlock;
    accentClass: string;
    newItemIds?: Set<string>;
}

export function PolicyBlockView({ title, icon, block, accentClass, newItemIds }: PolicyBlockViewProps) {
    return (
        <div className="mb-2">
            <div className="flex items-baseline gap-3 mb-4">
                <h3 className={`text-[10px] font-bold uppercase tracking-[0.2em] opacity-80 ${accentClass}`}>{title}</h3>
                <div className="h-px flex-1 bg-border/30" />
            </div>
            {block.items.length === 0 ? (
                <p className="text-[11px] text-text-secondary/40 italic font-serif">No criteria defined.</p>
            ) : (
                <ul className="space-y-4">
                    <AnimatePresence initial={false}>
                        {block.items.map((item) => {
                            const isNew = newItemIds?.has(item.id);
                            return (
                                <motion.li
                                    key={item.id}
                                    layout
                                    initial={{ opacity: 0, x: -4 }}
                                    animate={{
                                        opacity: 1,
                                        x: 0,
                                        borderLeftColor: isNew ? 'var(--color-accent-blue)' : 'transparent',
                                    }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.4 }}
                                    className={`text-[13px] text-text-primary leading-relaxed pl-4 border-l-2 border-transparent transition-colors duration-1000 ${
                                        isNew ? 'border-accent-blue/40 bg-accent-blue/5 py-1' : ''
                                    }`}
                                >
                                    <span className="opacity-90">{item.description}</span>
                                </motion.li>
                            );
                        })}
                    </AnimatePresence>
                </ul>
            )}
        </div>
    );
}
