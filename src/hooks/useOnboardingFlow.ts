'use client';

import { createContext, useContext, useReducer, useCallback } from 'react';
import type { Agent } from '@/lib/types';
import { AGENT_TEMPLATES } from '@/lib/templates';

// ── State ──

export interface OnboardingFlowState {
    currentStep: 1 | 2;
    selectedAgent: Agent | null;
    testMode: 'observe' | 'play';
    isCreatingFromTemplate: boolean;
}

type FlowAction =
    | { type: 'SELECT_AGENT'; agent: Agent }
    | { type: 'GO_TO_STEP'; step: 1 | 2 }
    | { type: 'SET_TEST_MODE'; mode: 'observe' | 'play' }
    | { type: 'SET_CREATING'; creating: boolean }
    | { type: 'RESET' };

const initialState: OnboardingFlowState = {
    currentStep: 1,
    selectedAgent: null,
    testMode: 'observe',
    isCreatingFromTemplate: false,
};

function flowReducer(state: OnboardingFlowState, action: FlowAction): OnboardingFlowState {
    switch (action.type) {
        case 'SELECT_AGENT':
            return { ...state, selectedAgent: action.agent, currentStep: 2, isCreatingFromTemplate: false };
        case 'GO_TO_STEP':
            if (action.step === 2 && !state.selectedAgent) return state;
            return { ...state, currentStep: action.step };
        case 'SET_TEST_MODE':
            return { ...state, testMode: action.mode };
        case 'SET_CREATING':
            return { ...state, isCreatingFromTemplate: action.creating };
        case 'RESET':
            return initialState;
        default:
            return state;
    }
}

// ── Hook ──

export interface OnboardingFlowActions {
    selectTemplate: (templateId: string) => Promise<void>;
    selectAgent: (agent: Agent) => void;
    goToStep: (step: 1 | 2) => void;
    setTestMode: (mode: 'observe' | 'play') => void;
    reset: () => void;
}

export function useOnboardingFlow() {
    const [state, dispatch] = useReducer(flowReducer, initialState);

    const selectTemplate = useCallback(async (templateId: string) => {
        const template = AGENT_TEMPLATES.find((t) => t.id === templateId);
        if (!template) return;

        dispatch({ type: 'SET_CREATING', creating: true });

        try {
            const res = await fetch('/api/agents', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: template.name,
                    specialty: template.specialty,
                    policy: template.policy,
                    onboardingComplete: true,
                }),
            });

            if (!res.ok) throw new Error('Failed to create assistant from template');

            const agent: Agent = await res.json();
            dispatch({ type: 'SELECT_AGENT', agent });
        } catch {
            dispatch({ type: 'SET_CREATING', creating: false });
        }
    }, []);

    const selectAgent = useCallback((agent: Agent) => {
        dispatch({ type: 'SELECT_AGENT', agent });
    }, []);

    const goToStep = useCallback((step: 1 | 2) => {
        dispatch({ type: 'GO_TO_STEP', step });
    }, []);

    const setTestMode = useCallback((mode: 'observe' | 'play') => {
        dispatch({ type: 'SET_TEST_MODE', mode });
    }, []);

    const reset = useCallback(() => {
        dispatch({ type: 'RESET' });
    }, []);

    return {
        state,
        actions: { selectTemplate, selectAgent, goToStep, setTestMode, reset },
    };
}

// ── Context ──

export interface OnboardingFlowContextValue {
    state: OnboardingFlowState;
    actions: OnboardingFlowActions;
}

export const OnboardingFlowContext = createContext<OnboardingFlowContextValue | null>(null);

export function useOnboardingFlowContext() {
    const ctx = useContext(OnboardingFlowContext);
    if (!ctx) throw new Error('useOnboardingFlowContext must be used within OnboardingFlowProvider');
    return ctx;
}
