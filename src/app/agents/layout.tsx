'use client';

import { Sidebar } from '@/components/ui/Sidebar';
import { useOnboardingFlow, OnboardingFlowContext } from '@/hooks/useOnboardingFlow';

export default function AgentsLayout({ children }: { children: React.ReactNode }) {
    const flow = useOnboardingFlow();

    return (
        <OnboardingFlowContext.Provider value={flow}>
            <div className="h-screen flex overflow-hidden bg-bg-primary">
                <Sidebar />
                <main className="flex-1 overflow-auto">{children}</main>
            </div>
        </OnboardingFlowContext.Provider>
    );
}
