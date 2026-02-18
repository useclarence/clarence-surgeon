'use client';

import { useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { CategoryType, ConsultationPolicy, PolicyRule } from '@/lib/types';

const CATEGORY_CONFIG: Record<CategoryType, { label: string; accentClass: string }> = {
    see_urgently: { label: 'See Urgently', accentClass: 'text-accent-red' },
    see: { label: 'See', accentClass: 'text-accent-green' },
    cancel: { label: 'Cancel', accentClass: 'text-accent-amber' },
};

const CATEGORY_ORDER: CategoryType[] = ['see_urgently', 'see', 'cancel'];

function collectAllRuleIds(policy: ConsultationPolicy): Set<string> {
    const ids = new Set<string>();
    for (const rule of policy.rules) {
        ids.add(rule.id);
    }
    return ids;
}

interface GroupedRuleItem {
    rule: PolicyRule;
    displayText: string;
}

interface GroupedRuleSection {
    key: string;
    macroCategory?: string;
    items: GroupedRuleItem[];
}

function normalizeMacroCategory(value?: string): string | null {
    if (!value) return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
}

function inferMacroSplit(description: string): { macroCategory: string; displayText: string } | null {
    const match = description.match(/^([^,:]{3,80})[:,]\s+(.+)$/);
    if (!match) return null;

    const macroCategory = match[1]?.trim();
    const displayText = match[2]?.trim();

    if (!macroCategory || !displayText) return null;
    return { macroCategory, displayText };
}

function escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function stripMacroPrefix(description: string, macroCategory: string): string {
    const prefixPattern = new RegExp(
        `^${escapeRegExp(macroCategory)}\\s*(?:,|:|->|→|—|-)\\s*`,
        'i'
    );
    const stripped = description.replace(prefixPattern, '').trim();
    return stripped || description;
}

const CATEGORY_SUFFIX_LABELS: Record<CategoryType, string[]> = {
    see_urgently: ['see urgently', 'see_urgently', 'urgent'],
    see: ['see'],
    cancel: ['cancel'],
};

function stripTrailingCategoryAction(description: string, categoryType: CategoryType): string {
    for (const label of CATEGORY_SUFFIX_LABELS[categoryType]) {
        const arrowSuffixPattern = new RegExp(
            `\\s*(?:,|:|;)?\\s*(?:->|→|—|-)\\s*${escapeRegExp(label)}\\s*$`,
            'i'
        );

        if (arrowSuffixPattern.test(description)) {
            const stripped = description.replace(arrowSuffixPattern, '').trim();
            return stripped || description;
        }

        const parenSuffixPattern = new RegExp(`\\s*\\(${escapeRegExp(label)}\\)\\s*$`, 'i');
        if (parenSuffixPattern.test(description)) {
            const stripped = description.replace(parenSuffixPattern, '').trim();
            return stripped || description;
        }
    }

    return description;
}

function buildRuleSections(rules: PolicyRule[]): GroupedRuleSection[] {
    const inferredByRuleId = new Map<string, { macroCategory: string; displayText: string }>();
    const inferredCounts = new Map<string, number>();

    for (const rule of rules) {
        if (normalizeMacroCategory(rule.macroCategory)) continue;
        const inferred = inferMacroSplit(rule.description);
        if (!inferred) continue;
        inferredByRuleId.set(rule.id, inferred);
        const countKey = inferred.macroCategory.toLowerCase();
        inferredCounts.set(countKey, (inferredCounts.get(countKey) ?? 0) + 1);
    }

    const eligibleInferred = new Set(
        Array.from(inferredCounts.entries())
            .filter(([, count]) => count > 1)
            .map(([countKey]) => countKey)
    );

    const grouped: GroupedRuleSection[] = [];
    const groupedIndexByKey = new Map<string, number>();

    for (const rule of rules) {
        const explicitMacro = normalizeMacroCategory(rule.macroCategory);
        const inferred = inferredByRuleId.get(rule.id);
        const inferredKey = inferred?.macroCategory.toLowerCase();
        const macroCategory =
            explicitMacro ??
            (inferred && inferredKey && eligibleInferred.has(inferredKey)
                ? inferred.macroCategory
                : null);

        const strippedMacroPrefixText = macroCategory
            ? stripMacroPrefix(rule.description, macroCategory)
            : rule.description;
        const displayText = stripTrailingCategoryAction(strippedMacroPrefixText, rule.categoryType);

        if (!macroCategory) {
            grouped.push({
                key: `rule:${rule.id}`,
                items: [{ rule, displayText }],
            });
            continue;
        }

        const macroKey = `macro:${macroCategory.toLowerCase()}`;
        const existingIndex = groupedIndexByKey.get(macroKey);
        if (existingIndex === undefined) {
            groupedIndexByKey.set(macroKey, grouped.length);
            grouped.push({
                key: macroKey,
                macroCategory,
                items: [{ rule, displayText }],
            });
            continue;
        }

        grouped[existingIndex]!.items.push({ rule, displayText });
    }

    return grouped;
}

interface PolicyPanelProps {
    open: boolean;
    onClose: () => void;
    policy: ConsultationPolicy | null;
}

export function PolicyPanel({ open, onClose, policy }: PolicyPanelProps) {
    const prevRuleIdsRef = useRef<Set<string>>(new Set());

    // Compute which rule IDs are new (not in the previous policy)
    const newRuleIds = useMemo(() => {
        if (!policy) return new Set<string>();
        const currentIds = collectAllRuleIds(policy);
        const newIds = new Set<string>();
        for (const id of currentIds) {
            if (!prevRuleIdsRef.current.has(id)) {
                newIds.add(id);
            }
        }
        return newIds;
    }, [policy]);

    // Update the ref after rendering so next change can diff against it
    useEffect(() => {
        if (policy) {
            prevRuleIdsRef.current = collectAllRuleIds(policy);
        }
    }, [policy]);

    // Detect legacy policy format (has blocks property)
    const isLegacy = policy && 'blocks' in policy;

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 480, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ type: 'spring', damping: 35, stiffness: 350 }}
                    className="h-full bg-white flex flex-col overflow-hidden flex-shrink-0 shadow-[-10px_0_30px_rgba(0,0,0,0.02)] border-l border-border/40"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-8 py-8 flex-shrink-0">
                        <div>
                            <h2 className="text-xl font-serif text-text-primary tracking-tight italic">
                                Consultation Charter
                            </h2>
                            {policy && (
                                <p className="text-[10px] uppercase tracking-[0.2em] text-text-secondary mt-1 opacity-60">
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

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto px-8 py-2 custom-scrollbar pb-20">
                        {policy ? (
                            isLegacy ? (
                                <div className="flex flex-col items-center justify-center h-full opacity-40 text-center px-8">
                                    <p className="text-sm font-serif italic">Policy uses a legacy format.</p>
                                    <p className="text-xs mt-2 text-text-secondary">Continue the conversation to rebuild it in the new format.</p>
                                </div>
                            ) : (
                                <div className="space-y-10">
                                    {CATEGORY_ORDER.map((categoryType) => {
                                        const rules = policy.rules.filter((r) => r.categoryType === categoryType);
                                        if (rules.length === 0) return null;
                                        const config = CATEGORY_CONFIG[categoryType];
                                        const groupedSections = buildRuleSections(rules);

                                        return (
                                            <div key={categoryType}>
                                                <div className="flex items-baseline gap-3 mb-4">
                                                    <h3 className={`text-[10px] uppercase tracking-[0.2em] opacity-80 ${config.accentClass}`}>
                                                        {config.label}
                                                    </h3>
                                                    <div className="h-px flex-1 bg-border/30" />
                                                </div>
                                                <div className="space-y-4">
                                                    <AnimatePresence initial={false}>
                                                        {groupedSections.map((section) => {
                                                            if (!section.macroCategory) {
                                                                const item = section.items[0]!;
                                                                const isNew = newRuleIds.has(item.rule.id);

                                                                return (
                                                                    <motion.div
                                                                        key={item.rule.id}
                                                                        layout
                                                                        initial={{ opacity: 0, x: -4 }}
                                                                        animate={{
                                                                            opacity: 1,
                                                                            x: 0,
                                                                        }}
                                                                        exit={{ opacity: 0, scale: 0.95 }}
                                                                        transition={{ duration: 0.4 }}
                                                                        className={`text-[13px] text-text-primary leading-relaxed pl-4 border-l-2 py-1 transition-colors duration-1000 ${
                                                                            isNew ? 'border-accent-blue/40' : 'border-border/35'
                                                                        }`}
                                                                    >
                                                                        <span className="opacity-90">{item.displayText}</span>
                                                                    </motion.div>
                                                                );
                                                            }

                                                            const hasNewRule = section.items.some((item) => newRuleIds.has(item.rule.id));

                                                            return (
                                                                <motion.div
                                                                    key={section.key}
                                                                    layout
                                                                    initial={{ opacity: 0, x: -4 }}
                                                                    animate={{
                                                                        opacity: 1,
                                                                        x: 0,
                                                                    }}
                                                                    exit={{ opacity: 0, scale: 0.95 }}
                                                                    transition={{ duration: 0.4 }}
                                                                    className={`pl-4 border-l-2 transition-colors duration-1000 ${
                                                                        hasNewRule ? 'border-accent-blue/40 py-2' : 'border-border/35 py-1'
                                                                    }`}
                                                                >
                                                                    <p className="text-[13px] leading-relaxed text-text-primary">
                                                                        {section.macroCategory}
                                                                    </p>
                                                                    <ul className="mt-2 pl-4 space-y-2 list-disc marker:text-text-secondary/60">
                                                                        {section.items.map((item) => {
                                                                            return (
                                                                                <li
                                                                                    key={item.rule.id}
                                                                                    className="text-[13px] leading-relaxed text-text-primary"
                                                                                >
                                                                                    <span className="opacity-90">{item.displayText}</span>
                                                                                </li>
                                                                            );
                                                                        })}
                                                                    </ul>
                                                                </motion.div>
                                                            );
                                                        })}
                                                    </AnimatePresence>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )
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
