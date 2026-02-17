'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { BuilderView } from '@/components/builder/BuilderView';
import type { Agent } from '@/lib/types';

export default function BuilderPage() {
    const { id } = useParams<{ id: string }>();
    const [agent, setAgent] = useState<Agent | null>(null);
    const [error, setError] = useState(false);

    useEffect(() => {
        fetch(`/api/agents/${id}`)
            .then((res) => {
                if (!res.ok) throw new Error('Not found');
                return res.json();
            })
            .then((data: Agent) => setAgent(data))
            .catch(() => setError(true));
    }, [id]);

    if (error) {
        return (
            <div className="flex items-center justify-center h-full">
                <p className="text-sm text-text-secondary">Assistant not found.</p>
            </div>
        );
    }

    if (!agent) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="w-6 h-6 border-2 border-accent-blue/30 border-t-accent-blue rounded-full animate-spin" />
            </div>
        );
    }

    return <BuilderView agent={agent} />;
}
