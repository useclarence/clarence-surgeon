// ── Consultation Policy ──

export interface PolicyItem {
    id: string;
    description: string;
    sourceQuote?: string;
}

export interface PolicyBlock {
    items: PolicyItem[];
}

export interface PolicyRule {
    id: string;
    type: 'gate' | 'prerequisite' | 'accelerator' | 'action';
    condition: string;
    outcome: string;
    dimension: 'scope' | 'readiness' | 'urgency';
    sourceQuote?: string;
}

export interface ConsultationPolicy {
    version: number;
    blocks: {
        highPotentialPatients: PolicyBlock;
        lowPotentialPatients: PolicyBlock;
        inBetween: PolicyBlock;
        forNonQualified: PolicyBlock;
    };
    rules: PolicyRule[];
}

// ── Challenge ──

export interface PolicyChallenge {
    id: string;
    type: 'ambiguity' | 'contradiction' | 'vague_criterion' | 'missing_action';
    description: string;
    suggestion: string;
}

// ── Agent ──

export interface Agent {
    id: string;
    name: string;
    specialty?: string;
    createdAt: number;
    updatedAt: number;
    status: 'active' | 'archived';
    policy: ConsultationPolicy | null;
    conversationHistory: BuilderMessage[];
    onboardingComplete: boolean;
}

// ── Builder Messages ──

export interface BuilderMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
    reflections?: Reflection[];
    clarifications?: ClarificationQuestion[];
    challenges?: PolicyChallenge[];
    isOnboarding?: boolean;
}

export interface Reflection {
    id: string;
    type: 'extraction' | 'linkage' | 'inference' | 'summary';
    content: string;
}

export interface ClarificationQuestion {
    id: string;
    question: string;
    suggestions: string[];
    answered: boolean;
    answer?: string;
}

// ── Builder State ──

export type BuilderStatus = 'idle' | 'recording' | 'processing';
export type ProcessingContext = 'analyzing' | 'updating';

export interface BuilderState {
    status: BuilderStatus;
    processingContext: ProcessingContext;
    messages: BuilderMessage[];
    policy: ConsultationPolicy | null;
    onboardingStep: 0 | 1 | 2 | 3 | 'complete';
    showPolicyDrawer: boolean;
    interimText: string;
    streamingThought: string;
    submitted: boolean;
}

export type BuilderAction =
    | { type: 'START_RECORDING' }
    | { type: 'STOP_RECORDING' }
    | { type: 'SET_INTERIM_TEXT'; text: string }
    | { type: 'ADD_USER_MESSAGE'; message: BuilderMessage }
    | { type: 'ADVANCE_ONBOARDING' }
    | { type: 'START_PROCESSING'; context: ProcessingContext }
    | { type: 'PROCESSING_COMPLETE'; message: BuilderMessage; policy: ConsultationPolicy | null }
    | { type: 'PROCESSING_ERROR' }
    | { type: 'ANSWER_CLARIFICATION'; messageId: string; clarificationId: string; answer: string }
    | { type: 'TOGGLE_POLICY_DRAWER' }
    | { type: 'APPEND_THINKING'; text: string }
    | { type: 'SET_THINKING'; text: string }
    | { type: 'SUBMIT_POLICY' };

// ── API Response ──

export interface V2AnalysisResponse {
    policy: ConsultationPolicy;
    reflections: Reflection[];
    nextQuestions: ClarificationQuestion[];
    challenges: PolicyChallenge[];
}
