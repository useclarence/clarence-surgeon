'use client';

import { createContext, useContext, useReducer, useCallback, useRef } from 'react';
import type { Agent } from '@/lib/types';
import { AGENT_TEMPLATES } from '@/lib/templates';

// ── State ──

export interface OnboardingFlowState {
    currentStep: 1 | 2;
    selectedAgent: Agent | null;
    testMode: 'observe' | 'play';
    isCreatingFromTemplate: boolean;
    templateCreationError: string | null;
}

type FlowAction =
    | { type: 'SELECT_AGENT'; agent: Agent }
    | { type: 'REPLACE_SELECTED_AGENT'; agent: Agent }
    | { type: 'CLEAR_SELECTED_AGENT' }
    | { type: 'GO_TO_STEP'; step: 1 | 2 }
    | { type: 'SET_TEST_MODE'; mode: 'observe' | 'play' }
    | { type: 'SET_CREATING'; creating: boolean }
    | { type: 'SET_TEMPLATE_ERROR'; error: string | null }
    | { type: 'RESET' };

const initialState: OnboardingFlowState = {
    currentStep: 1,
    selectedAgent: null,
    testMode: 'observe',
    isCreatingFromTemplate: false,
    templateCreationError: null,
};

function flowReducer(state: OnboardingFlowState, action: FlowAction): OnboardingFlowState {
    switch (action.type) {
        case 'SELECT_AGENT':
            return { ...state, selectedAgent: action.agent, currentStep: 2, isCreatingFromTemplate: false, templateCreationError: null };
        case 'REPLACE_SELECTED_AGENT':
            return { ...state, selectedAgent: action.agent };
        case 'CLEAR_SELECTED_AGENT':
            return { ...state, selectedAgent: null, currentStep: 1, isCreatingFromTemplate: false };
        case 'GO_TO_STEP':
            if (action.step === 2 && !state.selectedAgent) return state;
            return { ...state, currentStep: action.step };
        case 'SET_TEST_MODE':
            return { ...state, testMode: action.mode };
        case 'SET_CREATING':
            return { ...state, isCreatingFromTemplate: action.creating };
        case 'SET_TEMPLATE_ERROR':
            return { ...state, templateCreationError: action.error };
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
    const templateCreateRequestRef = useRef(0);

    const selectTemplate = useCallback(async (templateId: string) => {
        const template = AGENT_TEMPLATES.find((t) => t.id === templateId);
        if (!template) return;

        const requestId = templateCreateRequestRef.current + 1;
        templateCreateRequestRef.current = requestId;
        const now = Date.now();
        const optimisticAgent: Agent = {
            id: `temp-${template.id}-${now}`,
            name: template.name,
            specialty: template.specialty,
            createdAt: now,
            updatedAt: now,
            status: 'active',
            policy: template.policy,
            conversationHistory: [],
            onboardingComplete: true,
        };

        dispatch({ type: 'SET_TEMPLATE_ERROR', error: null });
        dispatch({ type: 'SELECT_AGENT', agent: optimisticAgent });
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
            if (templateCreateRequestRef.current !== requestId) return;

            dispatch({ type: 'REPLACE_SELECTED_AGENT', agent });
            dispatch({ type: 'SET_CREATING', creating: false });
        } catch {
            if (templateCreateRequestRef.current !== requestId) return;

            dispatch({ type: 'SET_CREATING', creating: false });
            dispatch({ type: 'SET_TEMPLATE_ERROR', error: 'Could not create that assistant. Please try selecting a template again.' });
            dispatch({ type: 'CLEAR_SELECTED_AGENT' });
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
        templateCreateRequestRef.current += 1;
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
