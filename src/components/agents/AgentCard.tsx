'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Agent } from '@/lib/types';

interface AgentCardProps {
    agent: Agent;
    onArchive?: (id: string) => void;
    onDelete?: (id: string) => void;
}

export function AgentCard({ agent, onDelete }: AgentCardProps) {
    const [confirmDelete, setConfirmDelete] = useState(false);
    const hasPolicy = agent.policy !== null;
    const rulesCount = agent.policy?.rules.length ?? 0;

    return (
        <Link
            href={`/agents/${agent.id}`}
            className="group block relative bg-bg-panel p-8 transition-all hover:bg-bg-panel shadow-[0_2px_15px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.05)] border border-border/40 rounded-sm overflow-hidden"
        >
            <div className="absolute top-0 left-0 w-1 h-full bg-accent-blue/10 group-hover:bg-accent-blue transition-all" />

            <div className="flex items-start justify-between mb-4">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <span
                            className={`w-1.5 h-1.5 rounded-full ${
                                agent.status === 'archived'
                                    ? 'bg-text-secondary/30'
                                    : hasPolicy
                                      ? 'bg-accent-green'
                                      : 'bg-accent-amber'
                            }`}
                        />
                        <h3 className="text-xl font-serif text-text-primary group-hover:text-accent-blue transition-colors italic">
                            {agent.name}
                        </h3>
                    </div>
                    {agent.specialty && (
                        <span className="text-[10px] uppercase tracking-[0.2em] text-accent-blue font-bold opacity-60">
                            {agent.specialty}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {agent.status === 'archived' && (
                        <span className="text-[9px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full bg-text-secondary/10 text-text-secondary">
                            Archived
                        </span>
                    )}
                    {onDelete && (
                        confirmDelete ? (
                            <div
                                className="flex items-center gap-1"
                                onClick={(e) => e.preventDefault()}
                            >
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        onDelete(agent.id);
                                    }}
                                    className="text-[9px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full bg-accent-red text-white hover:bg-accent-red/90 transition-colors cursor-pointer"
                                >
                                    Confirm
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setConfirmDelete(false);
                                    }}
                                    className="text-[9px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full bg-bg-secondary text-text-secondary hover:bg-text-secondary/20 transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setConfirmDelete(true);
                                }}
                                className="opacity-0 group-hover:opacity-100 text-text-secondary hover:text-accent-red transition-all cursor-pointer p-1"
                                title="Delete agent"
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="3 6 5 6 21 6" />
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                </svg>
                            </button>
                        )
                    )}
                </div>
            </div>

            <div className="mt-8 flex items-end justify-between border-t border-border/30 pt-4">
                <div className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase tracking-widest text-text-secondary font-bold opacity-40">Charter Status</span>
                    <span className="text-[11px] font-medium text-text-primary">
                        {hasPolicy ? `${rulesCount} Decision Rules • v${agent.policy!.version}` : 'Charter Pending'}
                    </span>
                </div>
                <span className="text-[10px] text-text-secondary opacity-60 font-serif italic">
                    Updated {new Date(agent.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
            </div>
        </Link>
    );
}
