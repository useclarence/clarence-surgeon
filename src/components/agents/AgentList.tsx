'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import type { Agent } from '@/lib/types';
import { AgentCard } from './AgentCard';

type Tab = 'all' | 'active' | 'archived';

interface AgentListProps {
    agents: Agent[];
    onArchive?: (id: string) => void;
    onDelete?: (id: string) => void;
}

export function AgentList({ agents, onArchive, onDelete }: AgentListProps) {
    const [tab, setTab] = useState<Tab>('all');
    const [search, setSearch] = useState('');

    const filtered = useMemo(() => {
        let list = agents;
        if (tab === 'active') list = list.filter((a) => a.status === 'active');
        if (tab === 'archived') list = list.filter((a) => a.status === 'archived');
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(
                (a) => a.name.toLowerCase().includes(q) || a.specialty?.toLowerCase().includes(q)
            );
        }
        return list.sort((a, b) => b.updatedAt - a.updatedAt);
    }, [agents, tab, search]);

    const tabs: { key: Tab; label: string; count: number }[] = [
        { key: 'all', label: 'All', count: agents.length },
        { key: 'active', label: 'Active', count: agents.filter((a) => a.status === 'active').length },
        { key: 'archived', label: 'Archived', count: agents.filter((a) => a.status === 'archived').length },
    ];

    return (
        <div>
            {/* Search + Tabs */}
            <div className="flex items-center justify-between mb-12 border-b border-border/30 pb-4">
                <div className="flex items-center gap-10">
                    {tabs.map((t) => (
                        <button
                            key={t.key}
                            onClick={() => setTab(t.key)}
                            className={`relative px-1 py-2 text-[11px] font-bold uppercase tracking-[0.2em] transition-all cursor-pointer ${
                                tab === t.key
                                    ? 'text-accent-blue'
                                    : 'text-text-secondary hover:text-text-primary opacity-60 hover:opacity-100'
                            }`}
                        >
                            {t.label}
                            {tab === t.key && (
                                <motion.div
                                    layoutId="tab-underline"
                                    className="absolute -bottom-[17px] left-0 right-0 h-0.5 bg-accent-blue"
                                />
                            )}
                            <span className="ml-2 opacity-40 text-[9px]">{t.count}</span>
                        </button>
                    ))}
                </div>

                <div className="relative group">
                    <svg
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-secondary opacity-40 group-focus-within:text-accent-blue transition-colors"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                        />
                    </svg>
                    <input
                        type="text"
                        placeholder="Search protocols..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-64 pl-6 pr-4 py-2 bg-transparent text-xs font-medium text-text-primary placeholder:text-text-secondary/30 placeholder:uppercase placeholder:tracking-widest focus:outline-none focus:border-b-2 border-transparent focus:border-accent-blue/40 transition-all"
                    />
                </div>
            </div>

            {/* Grid */}
            {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 opacity-20">
                    <svg className="w-12 h-12 mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={0.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                    </svg>
                    <p className="text-sm font-serif italic">
                        {search ? 'Search parameters yielded no clinical records.' : 'No protocol records available in the current archive.'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                    {filtered.map((agent) => (
                        <AgentCard key={agent.id} agent={agent} onArchive={onArchive} onDelete={onDelete} />
                    ))}
                </div>
            )}
        </div>
    );
}
