'use client';

import { motion } from 'framer-motion';
import type { AgentTemplate } from '@/lib/templates';

interface TemplateCardProps {
    template: AgentTemplate;
    onSelect: (templateId: string) => void;
    onView: (templateId: string) => void;
    isCreating: boolean;
}

export function TemplateCard({ template, onSelect, onView, isCreating }: TemplateCardProps) {
    const ruleCount = template.policy.rules.length;
    const isAvailable = template.available === true;
    const canSelect = isAvailable && !isCreating;
    const canView = isAvailable;
    const handleSelect = () => {
        if (!canSelect) return;
        onSelect(template.id);
    };
    const handleView = () => {
        if (!canView) return;
        onView(template.id);
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            onClick={handleSelect}
            onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    handleSelect();
                }
            }}
            role={canSelect ? 'button' : undefined}
            tabIndex={canSelect ? 0 : undefined}
            className={`group relative bg-bg-secondary/40 border border-border/40 rounded-xl p-5 transition-all duration-300 ${
                canSelect
                    ? 'hover:border-accent-blue/30 hover:bg-bg-secondary/60 cursor-pointer'
                    : 'pointer-events-none'
            }`}
        >
            {!isAvailable && (
                <div className="absolute inset-0 z-10 rounded-xl border-2 border-border/80 bg-bg-primary/35 backdrop-blur-md pointer-events-none">
                    <div className="flex h-full flex-col items-center px-4 pt-4">
                        <h4 className="text-sm font-semibold text-text-primary text-center max-w-full truncate">
                            {template.name}
                        </h4>
                        <span className="mt-3 text-xs uppercase tracking-[0.18em] font-bold text-text-primary bg-bg-primary/95 border-2 border-border/90 shadow-sm px-5 py-2 rounded-full">
                            Available Soon
                        </span>
                    </div>
                </div>
            )}

            <div className="flex items-start gap-3 mb-3">
                <span className="text-2xl">{template.icon}</span>
                <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-text-primary group-hover:text-accent-blue transition-colors truncate">
                        {template.name}
                    </h3>
                    <span className="inline-block text-[10px] font-medium text-accent-blue/70 bg-accent-blue/8 px-2 py-0.5 rounded mt-1">
                        {template.specialty}
                    </span>
                </div>
            </div>

            <p className="text-xs text-text-secondary leading-relaxed mb-4 line-clamp-2">
                {template.description}
            </p>

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-[10px] text-text-secondary">
                    <span className="flex items-center gap-1">
                        <svg className="w-3 h-3 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
                        </svg>
                        {ruleCount} decision rules
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onKeyDown={(event) => event.stopPropagation()}
                        onClick={(event) => {
                            event.stopPropagation();
                            handleView();
                        }}
                        disabled={!canView}
                        className="text-xs font-medium text-text-secondary border border-border/50 bg-bg-primary/45 hover:bg-bg-primary/65 px-3 py-1.5 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                        View
                    </button>
                    <button
                        onKeyDown={(event) => event.stopPropagation()}
                        onClick={(event) => {
                            event.stopPropagation();
                            handleSelect();
                        }}
                        disabled={isCreating || !isAvailable}
                        className="text-xs font-medium text-accent-blue bg-accent-blue/10 hover:bg-accent-blue/20 px-3.5 py-1.5 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                        {isCreating ? 'Creating...' : 'Choose'}
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
