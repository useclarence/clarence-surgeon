'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAgents } from '@/hooks/useAgents';
import { CreateAgentModal } from '@/components/agents/CreateAgentModal';
import { TemplateGallery } from '@/components/onboarding/TemplateGallery';
import { TestView } from '@/components/onboarding/TestView';
import { useOnboardingFlowContext } from '@/hooks/useOnboardingFlow';

export default function AgentsPage() {
    const router = useRouter();
    const { createAgent } = useAgents();
    const { state } = useOnboardingFlowContext();
    const [showCreate, setShowCreate] = useState(false);

    const handleCreate = useCallback(
        async (name: string, specialty?: string) => {
            const agent = await createAgent(name, specialty);
            router.push(`/agents/${agent.id}`);
        },
        [createAgent, router]
    );

    return (
        <>
            {state.currentStep === 1 ? (
                <TemplateGallery onBuildCustom={() => setShowCreate(true)} />
            ) : (
                <TestView />
            )}

            <CreateAgentModal open={showCreate} onClose={() => setShowCreate(false)} onCreate={handleCreate} />
        </>
    );
}
