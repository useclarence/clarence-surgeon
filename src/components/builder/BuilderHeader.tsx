'use client';

import Link from 'next/link';
import type { BuilderStatus } from '@/lib/types';

interface BuilderHeaderProps {
    agentName: string;
    agentSpecialty?: string;
    status: BuilderStatus;
    policyVersion: number;
    hasPolicy: boolean;
    onTogglePolicy: () => void;
}

export function BuilderHeader({ agentName, agentSpecialty, status, policyVersion, hasPolicy, onTogglePolicy }: BuilderHeaderProps) {
    return (
        <header className="flex items-center justify-between px-8 py-6 bg-bg-primary/80 backdrop-blur-sm sticky top-0 z-10 border-b border-border/40">
            <div className="flex items-center gap-6">
                <Link
                    href="/agents"
                    className="p-2 rounded-full text-text-secondary hover:text-accent-blue hover:bg-bg-secondary transition-all"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                    </svg>
                </Link>

                <div className="flex flex-col">
                    <h1 className="text-xl font-serif text-text-primary tracking-tight">{agentName}</h1>
                    {agentSpecialty && (
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] uppercase tracking-widest text-accent-blue font-medium opacity-70">{agentSpecialty}</span>
                            <span className="w-1 h-1 rounded-full bg-border" />
                            <span className="text-[10px] uppercase tracking-widest text-text-secondary">Consultation Logic</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-6">
                {/* Refined Status */}
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-bg-secondary/50 border border-border/30">
                    <span
                        className={`w-1.5 h-1.5 rounded-full ${
                            status === 'recording'
                                ? 'bg-accent-red animate-pulse'
                                : status === 'processing'
                                  ? 'bg-accent-purple animate-pulse'
                                  : 'bg-accent-green opacity-40'
                        }`}
                    />
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-text-secondary">
                        {status === 'recording' ? 'Live Input' : status === 'processing' ? 'Thinking' : 'Ready'}
                    </span>
                </div>

                {hasPolicy && (
                    <button
                        onClick={onTogglePolicy}
                        className="group flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-accent-blue hover:opacity-70 transition-all cursor-pointer"
                    >
                        <span className="border-b border-accent-blue/30 pb-0.5">Formal Policy</span>
                        <span className="text-[9px] opacity-40">v{policyVersion}</span>
                    </button>
                )}
            </div>
        </header>
    );
}
