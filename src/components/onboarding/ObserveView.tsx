'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOnboardingFlowContext } from '@/hooks/useOnboardingFlow';

interface ScenarioStep {
    speaker: 'patient' | 'assistant';
    text: string;
    policyHighlight?: string;
}

interface Scenario {
    id: string;
    patientName: string;
    age: number;
    chiefComplaint: string;
    background: string;
    steps: ScenarioStep[];
    triageResult: 'high_potential' | 'low_potential' | 'in_between' | 'non_qualified';
    triageSummary: string;
}

const SCENARIOS: Scenario[] = [
    {
        id: 'scenario-1',
        patientName: 'Marie Dupont',
        age: 58,
        chiefComplaint: 'Persistent shoulder pain and weakness when lifting overhead for 4 months',
        background: 'Completed 8 weeks of physical therapy and oral anti-inflammatories without improvement. MRI from last month shows a full-thickness supraspinatus tear.',
        steps: [
            { speaker: 'assistant', text: 'Good morning. I\'m calling from Dr. Martin\'s office to help assess your referral. Could you describe your main concern?' },
            { speaker: 'patient', text: 'My right shoulder has been hurting for months, and now I can barely lift my arm to place dishes in the cabinet.' },
            { speaker: 'assistant', text: 'I\'m sorry to hear that. Have you tried any treatment so far — physical therapy, medications, injections?' },
            { speaker: 'patient', text: 'Yes, I did 8 weeks of PT and took anti-inflammatory medication, but I still have weakness and night pain.' },
            { speaker: 'assistant', text: 'Do you have recent shoulder imaging — MRI or ultrasound within the last 6 months?', policyHighlight: 'Checking readiness: shoulder imaging prerequisite' },
            { speaker: 'patient', text: 'Yes, I had an MRI last month. It showed a full-thickness rotator cuff tear.' },
            { speaker: 'assistant', text: 'Thank you. Because you have persistent functional weakness, failed conservative care, and recent imaging confirming a full-thickness tear, I\'ll book you for a priority surgical consultation with Dr. Martin.', policyHighlight: 'High potential: full-thickness cuff tear + failed conservative treatment' },
        ],
        triageResult: 'high_potential',
        triageSummary: 'Patient meets high-potential shoulder surgery criteria: full-thickness rotator cuff tear on recent MRI, meaningful weakness, and failed 6+ weeks of conservative treatment. Scheduled for priority consultation.',
    },
    {
        id: 'scenario-2',
        patientName: 'Jean-Pierre Moreau',
        age: 45,
        chiefComplaint: 'Occasional shoulder soreness after weekend tennis',
        background: 'No major trauma, no instability episodes, full daily function, and no prior structured conservative treatment.',
        steps: [
            { speaker: 'assistant', text: 'Hello, I\'m calling regarding your referral to Dr. Martin. Can you tell me about your symptoms?' },
            { speaker: 'patient', text: 'My shoulder gets sore after tennis on weekends. I can still work and sleep fine, but I wanted to see if surgery could just fix it quickly.' },
            { speaker: 'assistant', text: 'Have you had dislocations, major weakness, or trouble with daily activities like dressing or reaching overhead?' },
            { speaker: 'patient', text: 'No dislocations, and I can do all that. It mostly flares after long matches.' },
            { speaker: 'assistant', text: 'Have you completed a structured program yet — physical therapy, activity modification, or injection?', policyHighlight: 'Checking readiness: conservative treatment prerequisite' },
            { speaker: 'patient', text: 'No, I haven\'t tried any formal treatment yet.' },
            { speaker: 'assistant', text: 'Given your mild intermittent symptoms and preserved function, surgery is not the right first step. I\'ll route you to sports medicine and a 6-week shoulder PT plan, then reassess if symptoms persist.', policyHighlight: 'Non-qualified: mild overuse symptoms without structural red flags' },
        ],
        triageResult: 'non_qualified',
        triageSummary: 'Patient is non-qualified for shoulder surgery at this stage: mild activity-related pain, no instability or functional loss, and no conservative treatment trial. Redirected to sports medicine plus structured PT.',
    },
    {
        id: 'scenario-3',
        patientName: 'Sophie Laurent',
        age: 67,
        chiefComplaint: 'Chronic shoulder pain with loss of motion and increasing night pain',
        background: 'Shoulder MRI from 9 months ago showed a large rotator cuff tear with early arthritic change. Symptoms and stiffness have worsened recently.',
        steps: [
            { speaker: 'assistant', text: 'Good afternoon, Ms. Laurent. I\'m calling about your referral. How are you doing today?' },
            { speaker: 'patient', text: 'Not great. I can\'t raise my arm well anymore, and the shoulder pain wakes me up most nights.' },
            { speaker: 'assistant', text: 'When did this start getting worse?' },
            { speaker: 'patient', text: 'Over the last 6 months. I used to manage, but now I struggle even getting dressed.' },
            { speaker: 'assistant', text: 'Do you have shoulder imaging from the last 6 months?', policyHighlight: 'Checking readiness: imaging within 6 months' },
            { speaker: 'patient', text: 'No, my MRI is from about 9 months ago.' },
            { speaker: 'assistant', text: 'Because your symptoms progressed and imaging is out of date, we need updated shoulder imaging before final surgical planning. I\'ll arrange new imaging and then a consultation to discuss repair versus reverse shoulder replacement.', policyHighlight: 'In-between: large tear in older patient, needs updated imaging for repair vs arthroplasty decision' },
        ],
        triageResult: 'in_between',
        triageSummary: 'Patient falls in the in-between category: worsening function and pain with prior evidence of a large cuff tear, but imaging is outdated. Updated imaging is required to decide between rotator cuff repair and reverse shoulder arthroplasty.',
    },
];

const TRIAGE_LABELS: Record<Scenario['triageResult'], { label: string; color: string }> = {
    high_potential: { label: 'High Potential', color: 'text-green-400 bg-green-400/10 border-green-400/20' },
    low_potential: { label: 'Low Potential', color: 'text-red-400 bg-red-400/10 border-red-400/20' },
    in_between: { label: 'In Between', color: 'text-amber-400 bg-amber-400/10 border-amber-400/20' },
    non_qualified: { label: 'Non-Qualified', color: 'text-text-secondary bg-bg-secondary/60 border-border/40' },
};

export function ObserveView() {
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [visibleSteps, setVisibleSteps] = useState(0);
    const { state } = useOnboardingFlowContext();

    const handleExpand = (id: string) => {
        if (expandedId === id) {
            setExpandedId(null);
            setVisibleSteps(0);
        } else {
            setExpandedId(id);
            setVisibleSteps(0);
            // Reveal steps one by one
            const scenario = SCENARIOS.find((s) => s.id === id);
            if (scenario) {
                scenario.steps.forEach((_, i) => {
                    setTimeout(() => setVisibleSteps((v) => Math.max(v, i + 1)), (i + 1) * 800);
                });
            }
        }
    };

    return (
        <div className="space-y-4">
            <p className="text-xs text-text-secondary mb-6">
                Watch how <span className="text-accent-blue font-medium">{state.selectedAgent?.name}</span> handles different patient scenarios.
            </p>

            {SCENARIOS.map((scenario) => {
                const isExpanded = expandedId === scenario.id;
                const triage = TRIAGE_LABELS[scenario.triageResult];

                return (
                    <div key={scenario.id} className="border border-border/40 rounded-xl overflow-hidden bg-bg-secondary/20">
                        {/* Scenario Header */}
                        <button
                            onClick={() => handleExpand(scenario.id)}
                            className="w-full text-left px-5 py-4 flex items-center justify-between hover:bg-bg-secondary/40 transition-colors cursor-pointer"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-9 h-9 rounded-full bg-bg-panel flex items-center justify-center text-sm font-medium text-text-secondary">
                                    {scenario.patientName.split(' ').map((n) => n[0]).join('')}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-text-primary">
                                        {scenario.patientName}, {scenario.age}
                                    </p>
                                    <p className="text-xs text-text-secondary mt-0.5">{scenario.chiefComplaint}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className={`text-[10px] font-medium px-2.5 py-1 rounded-full border ${triage.color}`}>
                                    {triage.label}
                                </span>
                                <svg
                                    className={`w-4 h-4 text-text-secondary transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                </svg>
                            </div>
                        </button>

                        {/* Expanded Conversation */}
                        <AnimatePresence>
                            {isExpanded && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="overflow-hidden"
                                >
                                    <div className="px-5 pb-5 border-t border-border/30">
                                        {/* Background */}
                                        <div className="mt-4 mb-5 px-3 py-2.5 rounded-lg bg-bg-primary/60 border border-border/30">
                                            <p className="text-[10px] uppercase tracking-wider text-text-secondary font-medium mb-1">Background</p>
                                            <p className="text-xs text-text-secondary leading-relaxed">{scenario.background}</p>
                                        </div>

                                        {/* Steps */}
                                        <div className="space-y-3">
                                            {scenario.steps.map((step, i) => (
                                                <motion.div
                                                    key={i}
                                                    initial={{ opacity: 0, x: step.speaker === 'patient' ? 12 : -12 }}
                                                    animate={{
                                                        opacity: i < visibleSteps ? 1 : 0.15,
                                                        x: i < visibleSteps ? 0 : (step.speaker === 'patient' ? 12 : -12),
                                                    }}
                                                    transition={{ duration: 0.4 }}
                                                    className={`flex ${step.speaker === 'patient' ? 'justify-end' : 'justify-start'}`}
                                                >
                                                    <div className={`max-w-[80%] ${
                                                        step.speaker === 'patient'
                                                            ? 'bg-accent-blue/10 border border-accent-blue/20'
                                                            : 'bg-bg-panel border border-border/40'
                                                    } rounded-xl px-4 py-2.5`}>
                                                        <p className="text-[10px] font-medium text-text-secondary mb-1">
                                                            {step.speaker === 'patient' ? 'Patient' : 'Assistant'}
                                                        </p>
                                                        <p className="text-xs text-text-primary leading-relaxed">{step.text}</p>
                                                        {step.policyHighlight && (
                                                            <p className="text-[10px] text-accent-blue mt-2 italic">
                                                                {step.policyHighlight}
                                                            </p>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>

                                        {/* Triage Summary */}
                                        {visibleSteps >= scenario.steps.length && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 8 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.3 }}
                                                className="mt-5 px-4 py-3 rounded-lg bg-accent-blue/5 border border-accent-blue/15"
                                            >
                                                <p className="text-[10px] uppercase tracking-wider text-accent-blue font-medium mb-1.5">Triage Decision</p>
                                                <p className="text-xs text-text-primary leading-relaxed">{scenario.triageSummary}</p>
                                            </motion.div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                );
            })}
        </div>
    );
}
