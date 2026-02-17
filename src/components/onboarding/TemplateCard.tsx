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
    const itemCount = Object.values(template.policy.blocks).reduce(
        (sum, block) => sum + block.items.length,
        0
    );
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
                        {itemCount} criteria
                    </span>
                    <span className="flex items-center gap-1">
                        <svg className="w-3 h-3 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                        </svg>
                        {ruleCount} rules
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
