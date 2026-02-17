'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AGENT_TEMPLATES, TEMPLATE_CATEGORIES, type TemplateCategory } from '@/lib/templates';
import { TemplateCard } from './TemplateCard';
import { useOnboardingFlowContext } from '@/hooks/useOnboardingFlow';

interface TemplateGalleryProps {
    onBuildCustom: () => void;
}

export function TemplateGallery({ onBuildCustom }: TemplateGalleryProps) {
    const [activeCategory, setActiveCategory] = useState<TemplateCategory>('All');
    const [showTemplates, setShowTemplates] = useState(false);
    const { state, actions } = useOnboardingFlowContext();

    const filtered = (activeCategory === 'All'
        ? AGENT_TEMPLATES
        : AGENT_TEMPLATES.filter((t) => t.category === activeCategory)
    ).sort((a, b) => (b.available ? 1 : 0) - (a.available ? 1 : 0));

    if (showTemplates) {
        return (
            <div className="h-full flex flex-col">
                {/* Header with back button */}
                <div className="px-10 pt-10 pb-6">
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <button
                            onClick={() => setShowTemplates(false)}
                            className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-accent-blue transition-colors mb-5 cursor-pointer group"
                        >
                            <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                            </svg>
                            Back
                        </button>
                        <h1 className="text-2xl font-semibold text-text-primary tracking-tight">
                            Choose a Starting Template
                        </h1>
                        <p className="text-sm text-text-secondary mt-2 max-w-lg">
                            Ready-made clinical assistants with built-in triage logic. Pick one to start quickly, then test and adjust.
                        </p>
                    </motion.div>

                    {/* Category Filter */}
                    <div className="flex items-center gap-2 mt-6">
                        {TEMPLATE_CATEGORIES.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                                    activeCategory === cat
                                        ? 'bg-accent-blue/15 text-accent-blue border border-accent-blue/25'
                                        : 'bg-bg-secondary/40 text-text-secondary hover:text-text-primary border border-transparent hover:border-border/40'
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Templates Grid */}
                <div className="flex-1 overflow-auto px-10 pb-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        <AnimatePresence mode="popLayout">
                            {filtered.map((template) => (
                                <TemplateCard
                                    key={template.id}
                                    template={template}
                                    onSelect={actions.selectTemplate}
                                    isCreating={state.isCreatingFromTemplate}
                                />
                            ))}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        );
    }

    // ── Landing: Two-path choice ──
    return (
        <div className="h-full flex flex-col items-center justify-center px-10">
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-3xl w-full text-center"
            >
                <h1 className="text-3xl font-semibold text-text-primary tracking-tight">
                    Set Up Your Assistant
                </h1>
                <p className="text-sm text-text-secondary mt-3 max-w-xl mx-auto leading-relaxed">
                    Start with a ready-made clinical assistant or create your own for your practice.
                </p>
                <p className="text-[11px] uppercase tracking-[0.16em] text-text-secondary/80 mt-5 font-semibold">
                    Most clinics start with a template, then customize
                </p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.15 }}
                className="relative grid grid-cols-1 sm:grid-cols-2 gap-5 mt-8 max-w-3xl w-full"
            >
                <div className="hidden sm:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 items-center justify-center">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-text-secondary bg-bg-primary border border-border/60 rounded-full px-3 py-1.5 shadow-sm">
                        OR
                    </span>
                </div>

                {/* Option 1: Use a Template */}
                <button
                    onClick={() => setShowTemplates(true)}
                    className="group relative sm:-translate-y-1 overflow-hidden bg-bg-panel border border-accent-blue/40 ring-1 ring-accent-blue/15 rounded-xl p-7 text-left transition-all duration-300 hover:border-accent-blue/55 hover:ring-accent-blue/25 hover:bg-bg-secondary/30 shadow-[0_10px_30px_rgba(37,99,235,0.12),0_1px_0_rgba(15,23,42,0.04)] cursor-pointer"
                >
                    <span
                        aria-hidden
                        className="pointer-events-none absolute inset-x-8 top-4 h-16 bg-accent-blue/15 blur-2xl opacity-70"
                    />
                    <span className="inline-flex items-center text-[10px] uppercase tracking-[0.16em] font-semibold text-text-secondary bg-bg-primary/80 border border-border/50 rounded-full px-2.5 py-1 mb-4">
                        Option 1
                    </span>
                    <span className="absolute top-5 right-5 inline-flex items-center text-[10px] uppercase tracking-[0.12em] font-semibold text-accent-blue bg-accent-blue/15 border border-accent-blue/35 rounded-full px-2 py-1 shadow-sm">
                        Recommended
                    </span>
                    <div className="w-11 h-11 rounded-xl bg-accent-blue/12 border border-accent-blue/20 flex items-center justify-center mb-5">
                        <svg className="w-5 h-5 text-accent-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
                        </svg>
                    </div>
                    <h3 className="text-base font-semibold text-text-primary group-hover:text-accent-blue transition-colors">
                        Use a Template
                    </h3>
                    <p className="text-xs text-text-secondary mt-2 leading-relaxed">
                        Begin with a proven setup and run test calls quickly.
                    </p>
                    <p className="text-[11px] text-text-secondary/80 mt-3 font-medium">
                        Setup time: ~1 minute
                    </p>
                    <div className="flex items-center gap-1.5 mt-5 text-xs text-accent-blue font-semibold">
                        Browse Templates
                        <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                    </div>
                </button>

                {/* Option 2: Build Custom */}
                <button
                    onClick={onBuildCustom}
                    className="group relative bg-bg-secondary/35 border border-border/35 rounded-xl p-7 text-left transition-all duration-300 hover:border-accent-blue/35 hover:bg-bg-secondary/55 cursor-pointer"
                >
                    <span className="inline-flex items-center text-[10px] uppercase tracking-[0.16em] font-semibold text-text-secondary bg-bg-primary/80 border border-border/50 rounded-full px-2.5 py-1 mb-4">
                        Option 2
                    </span>
                    <div className="w-11 h-11 rounded-xl bg-accent-blue/12 border border-accent-blue/20 flex items-center justify-center mb-5">
                        <svg className="w-5 h-5 text-accent-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                    </div>
                    <h3 className="text-base font-semibold text-text-primary group-hover:text-accent-blue transition-colors">
                        Build Custom Assistant
                    </h3>
                    <p className="text-xs text-text-secondary mt-2 leading-relaxed">
                        Define your own triage approach, then test with sample patient calls.
                    </p>
                    <p className="text-[11px] text-text-secondary/80 mt-3 font-medium">
                        Setup time: ~5 minutes
                    </p>
                    <div className="flex items-center gap-1.5 mt-5 text-xs text-accent-blue/80 font-medium">
                        Build Custom Assistant
                        <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                    </div>
                </button>
            </motion.div>
        </div>
    );
}
