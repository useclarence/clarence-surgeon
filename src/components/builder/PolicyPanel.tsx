'use client';

import { useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ConsultationPolicy, PolicyRule } from '@/lib/types';
import { PolicyBlockView } from './PolicyBlockView';

const RULE_TYPE_CONFIG: Record<PolicyRule['type'], { label: string; accentClass: string }> = {
    gate: { label: 'Gates (Scope)', accentClass: 'text-accent-red' },
    prerequisite: { label: 'Prerequisites (Readiness)', accentClass: 'text-accent-amber' },
    accelerator: { label: 'Accelerators (Urgency)', accentClass: 'text-medical' },
    action: { label: 'Actions', accentClass: 'text-accent-green' },
};

function collectAllItemIds(policy: ConsultationPolicy): Set<string> {
    const ids = new Set<string>();
    for (const block of Object.values(policy.blocks)) {
        for (const item of block.items) {
            ids.add(item.id);
        }
    }
    for (const rule of policy.rules) {
        ids.add(rule.id);
    }
    return ids;
}

interface PolicyPanelProps {
    open: boolean;
    onClose: () => void;
    policy: ConsultationPolicy | null;
}

export function PolicyPanel({ open, onClose, policy }: PolicyPanelProps) {
    const prevItemIdsRef = useRef<Set<string>>(new Set());

    // Compute which item IDs are new (not in the previous policy)
    const newItemIds = useMemo(() => {
        if (!policy) return new Set<string>();
        const currentIds = collectAllItemIds(policy);
        const newIds = new Set<string>();
        for (const id of currentIds) {
            if (!prevItemIdsRef.current.has(id)) {
                newIds.add(id);
            }
        }
        return newIds;
    }, [policy]);

    // Update the ref after rendering so next change can diff against it
    useEffect(() => {
        if (policy) {
            prevItemIdsRef.current = collectAllItemIds(policy);
        }
    }, [policy]);

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 480, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ type: 'spring', damping: 35, stiffness: 350 }}
                    className="h-full bg-bg-panel flex flex-col overflow-hidden flex-shrink-0 shadow-[-10px_0_30px_rgba(0,0,0,0.02)] border-l border-border/40"
                >
                    {/* Header — Formal Title */}
                    <div className="flex items-center justify-between px-8 py-8 flex-shrink-0">
                        <div>
                            <h2 className="text-xl font-serif text-text-primary tracking-tight italic">
                                Consultation Charter
                            </h2>
                            {policy && (
                                <p className="text-[10px] uppercase tracking-[0.2em] text-text-secondary mt-1 font-bold opacity-60">
                                    Logic Version {policy.version}.0
                                </p>
                            )}
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full text-text-secondary hover:text-accent-red hover:bg-bg-secondary transition-all cursor-pointer"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Content — Document Layout */}
                    <div className="flex-1 overflow-y-auto px-8 py-2 custom-scrollbar pb-20">
                        {policy ? (
                            <div className="space-y-12">
                                <PolicyBlockView
                                    title="High Potential (Priority)"
                                    icon={
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    }
                                    block={policy.blocks.highPotentialPatients}
                                    accentClass="text-accent-green"
                                    newItemIds={newItemIds}
                                />

                                <PolicyBlockView
                                    title="Low Potential (Gatekeep)"
                                    icon={
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                        </svg>
                                    }
                                    block={policy.blocks.lowPotentialPatients}
                                    accentClass="text-accent-red"
                                    newItemIds={newItemIds}
                                />

                                <div className="grid grid-cols-2 gap-8 border-t border-border/40 pt-10">
                                    <PolicyBlockView
                                        title="Conditional"
                                        icon={null}
                                        block={policy.blocks.inBetween}
                                        accentClass="text-accent-amber"
                                        newItemIds={newItemIds}
                                    />

                                    <PolicyBlockView
                                        title="Directives"
                                        icon={null}
                                        block={policy.blocks.forNonQualified}
                                        accentClass="text-accent-blue"
                                        newItemIds={newItemIds}
                                    />
                                </div>

                                {policy.rules.length > 0 && (
                                    <div className="pt-10 border-t border-border/40">
                                        <h2 className="text-[10px] font-bold text-text-primary uppercase tracking-[0.2em] mb-8 opacity-40">
                                            Actionable Decision Rules
                                        </h2>

                                        <div className="space-y-8">
                                            {(['gate', 'prerequisite', 'accelerator', 'action'] as const).map((ruleType) => {
                                                const rules = policy.rules.filter((r) => r.type === ruleType);
                                                if (rules.length === 0) return null;
                                                const config = RULE_TYPE_CONFIG[ruleType];
                                                return (
                                                    <div key={ruleType}>
                                                        <h3 className={`text-[9px] font-bold uppercase tracking-widest mb-4 opacity-70 ${config.accentClass}`}>
                                                            {config.label}
                                                        </h3>
                                                        <ul className="space-y-4">
                                                            {rules.map((rule) => {
                                                                const isNew = newItemIds.has(rule.id);
                                                                return (
                                                                    <motion.li
                                                                        key={rule.id}
                                                                        layout
                                                                        className="text-[13px] leading-relaxed group"
                                                                    >
                                                                        <div className="flex gap-3">
                                                                            <span className="text-text-secondary opacity-30 font-serif italic text-sm">if</span>
                                                                            <p className="text-text-primary">
                                                                                {rule.condition}{' '}
                                                                                <span className="text-text-secondary opacity-30 font-serif italic mx-1">then</span>{' '}
                                                                                <span className="font-medium">{rule.outcome}</span>
                                                                            </p>
                                                                        </div>
                                                                    </motion.li>
                                                                );
                                                            })}
                                                        </ul>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full opacity-20">
                                <svg className="w-12 h-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                </svg>
                                <p className="text-sm font-serif italic">Awaiting Logic Formalization</p>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
