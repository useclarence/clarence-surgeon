'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Agent } from '@/lib/types';

export function useAgents() {
    const [agents, setAgents] = useState<Agent[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/agents')
            .then((res) => res.json())
            .then((data: Agent[]) => setAgents(data))
            .catch((err) => console.error('Failed to load assistants:', err))
            .finally(() => setLoading(false));
    }, []);

    const createAgent = useCallback(async (name: string, specialty?: string): Promise<Agent> => {
        const res = await fetch('/api/agents', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, specialty }),
        });
        const agent = (await res.json()) as Agent;
        setAgents((prev) => [agent, ...prev]);
        return agent;
    }, []);

    const archiveAgent = useCallback(async (id: string) => {
        await fetch(`/api/agents/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'archived' }),
        });
        setAgents((prev) =>
            prev.map((a) => (a.id === id ? { ...a, status: 'archived' as const, updatedAt: Date.now() } : a))
        );
    }, []);

    const deleteAgent = useCallback(async (id: string) => {
        await fetch(`/api/agents/${id}`, { method: 'DELETE' });
        setAgents((prev) => prev.filter((a) => a.id !== id));
    }, []);

    return { agents, loading, createAgent, archiveAgent, deleteAgent };
}
