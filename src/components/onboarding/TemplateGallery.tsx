'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { AGENT_TEMPLATES, TEMPLATE_CATEGORIES, type AgentTemplate, type TemplateCategory } from '@/lib/templates';
import { TemplateCard } from './TemplateCard';
import { useOnboardingFlowContext } from '@/hooks/useOnboardingFlow';
import { Modal } from '@/components/ui/Modal';
import type { Agent, CategoryType } from '@/lib/types';

interface TemplateGalleryProps {
    onBuildCustom: () => void;
}

interface ShoulderRuleSection {
    title: string;
    statements: string[];
}

interface ShoulderSummaryRow {
    referred: string;
    onset: string;
    consulted: string;
    treatment: string;
    recommendation: string;
}

const SHOULDER_RULE_SECTIONS: ShoulderRuleSection[] = [
    {
        title: '1. Referred by a doctor',
        statements: [
            'If the patient was referred by a doctor (for example GP, sports doctor, or another specialist), always recommend seeing the shoulder surgeon.',
            'No other conditions are checked in this branch.',
        ],
    },
    {
        title: '2. Not referred: how the problem started',
        statements: [
            'Sudden onset: if the problem appeared suddenly, recommend the shoulder surgeon regardless of accident/fall context, duration, or imaging.',
            'Gradual onset: recommend the shoulder surgeon only if both are true: (1) they already consulted a health professional and (2) they already had treatment such as physiotherapy, injection, or other.',
            'If either condition is not met in gradual onset, recommend sports medicine (or equivalent) first for initial assessment/treatment, then referral to shoulder surgeon later if needed.',
        ],
    },
    {
        title: '3. Urgency flag',
        statements: [
            'Urgency is separate from the referral decision and does not change whether the patient sees the shoulder surgeon or sports medicine first.',
            'Set urgency only when all are true: sudden onset, in the context of an accident or fall, and symptom duration is less than 3 weeks.',
        ],
    },
];

const SHOULDER_SUMMARY_ROWS: ShoulderSummaryRow[] = [
    {
        referred: 'Yes',
        onset: 'Any',
        consulted: 'N/A',
        treatment: 'N/A',
        recommendation: 'See shoulder surgeon',
    },
    {
        referred: 'No',
        onset: 'Sudden',
        consulted: 'N/A',
        treatment: 'N/A',
        recommendation: 'See shoulder surgeon',
    },
    {
        referred: 'No',
        onset: 'Gradual',
        consulted: 'Yes',
        treatment: 'Yes',
        recommendation: 'See shoulder surgeon',
    },
    {
        referred: 'No',
        onset: 'Gradual',
        consulted: 'No',
        treatment: 'N/A',
        recommendation: 'Sports medicine first',
    },
    {
        referred: 'No',
        onset: 'Gradual',
        consulted: 'Yes',
        treatment: 'No',
        recommendation: 'Sports medicine first',
    },
];

function ShoulderTemplateDetails() {
    return (
        <div className="space-y-6">
            <section className="rounded-xl border border-flow-blue/25 bg-flow-blue/8 px-4 py-3">
                <h3 className="text-sm font-semibold text-text-primary">Assistant purpose</h3>
                <p className="mt-2 text-xs leading-relaxed text-text-secondary">
                    This assistant helps determine the surgical potential of patients coming in with shoulder-related issues and routes them either to the shoulder surgeon or to sports medicine first.
                </p>
            </section>

            <section>
                <h3 className="text-sm font-semibold text-text-primary">Clinical rules</h3>
                <p className="mt-2 text-xs leading-relaxed text-text-secondary">
                    These rules define whether to send the patient to the shoulder surgeon or to sports medicine first.
                </p>
                <div className="mt-3 space-y-3">
                    {SHOULDER_RULE_SECTIONS.map((section) => (
                        <article key={section.title} className="rounded-lg border border-border/45 bg-bg-primary/40 p-3">
                            <h4 className="text-xs font-semibold text-text-primary">{section.title}</h4>
                            <ul className="mt-2 space-y-1.5">
                                {section.statements.map((statement) => (
                                    <li key={statement} className="text-xs leading-relaxed text-text-secondary">
                                        {statement}
                                    </li>
                                ))}
                            </ul>
                        </article>
                    ))}
                </div>
            </section>

            <section>
                <h3 className="text-sm font-semibold text-text-primary">Summary table</h3>
                <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                    <span className="inline-flex items-center rounded-full border border-flow-blue/35 bg-flow-blue/10 px-2 py-0.5 font-medium text-flow-blue">
                        Blue: see shoulder surgeon
                    </span>
                    <span className="inline-flex items-center rounded-full border border-border/55 bg-bg-primary/65 px-2 py-0.5 font-medium text-text-secondary">
                        Gray: sports medicine first
                    </span>
                </div>
                <div className="mt-3 overflow-x-auto rounded-lg border border-border/45">
                    <table className="w-full min-w-[720px] border-collapse text-xs">
                        <thead className="bg-bg-primary/75">
                            <tr>
                                <th className="px-3 py-2 text-left font-semibold text-text-primary">Referred by a doctor?</th>
                                <th className="px-3 py-2 text-left font-semibold text-text-primary">Onset</th>
                                <th className="px-3 py-2 text-left font-semibold text-text-primary">Already consulted?</th>
                                <th className="px-3 py-2 text-left font-semibold text-text-primary">Already had treatment?</th>
                                <th className="px-3 py-2 text-left font-semibold text-text-primary">Recommendation</th>
                            </tr>
                        </thead>
                        <tbody>
                            {SHOULDER_SUMMARY_ROWS.map((row, index) => {
                                const surgeonPath = row.recommendation === 'See shoulder surgeon';

                                return (
                                    <tr
                                        key={`${row.referred}-${row.onset}-${row.consulted}-${row.treatment}`}
                                        className={`${index === 0 ? '' : 'border-t'} ${surgeonPath ? 'border-flow-blue/20 bg-flow-blue/8' : 'border-border/35 bg-bg-primary/35'
                                            }`}
                                    >
                                        <td className="px-3 py-2 text-text-secondary">{row.referred}</td>
                                        <td className="px-3 py-2 text-text-secondary">{row.onset}</td>
                                        <td className="px-3 py-2 text-text-secondary">{row.consulted}</td>
                                        <td className="px-3 py-2 text-text-secondary">{row.treatment}</td>
                                        <td className="px-3 py-2">
                                            <span
                                                className={`inline-flex items-center rounded-full border px-2 py-0.5 font-medium ${surgeonPath
                                                        ? 'border-flow-blue/35 bg-flow-blue/12 text-flow-blue'
                                                        : 'border-border/55 bg-bg-primary/75 text-text-secondary'
                                                    }`}
                                            >
                                                {row.recommendation}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}

function GenericTemplateDetails({ template }: { template: AgentTemplate }) {
    return (
        <div className="space-y-5">
            <section>
                <h3 className="text-sm font-semibold text-text-primary">Overview</h3>
                <p className="mt-2 text-xs leading-relaxed text-text-secondary">{template.description}</p>
            </section>
            <section>
                <h3 className="text-sm font-semibold text-text-primary">Current decision rules</h3>
                <ul className="mt-2 space-y-2">
                    {template.policy.rules.map((rule) => (
                        <li key={rule.id} className="rounded-lg border border-border/45 bg-bg-primary/40 px-3 py-2 text-xs leading-relaxed text-text-secondary">
                            {rule.description}
                        </li>
                    ))}
                </ul>
            </section>
        </div>
    );
}

function UnderConstructionCard({ agent, onView }: { agent: Agent; onView: (agent: Agent) => void }) {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="group relative bg-bg-secondary/25 border border-accent-amber/30 rounded-xl p-5 transition-all duration-300"
        >
            <div className="mb-3 flex items-start justify-between gap-3">
                <div className="flex min-w-0 flex-1 items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-accent-amber/10 border border-accent-amber/20 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-accent-amber" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085" />
                        </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-semibold text-text-primary truncate">{agent.name}</h3>
                        {agent.specialty && (
                            <span className="inline-block text-[10px] font-medium text-accent-amber/80 bg-accent-amber/8 px-2 py-0.5 rounded mt-1">
                                {agent.specialty}
                            </span>
                        )}
                    </div>
                </div>
                {agent.policy && (
                    <button
                        onClick={() => onView(agent)}
                        className="text-xs font-medium text-text-secondary border border-border/50 bg-bg-primary/45 hover:bg-bg-primary/65 px-3 py-1.5 rounded-lg transition-all cursor-pointer shrink-0"
                    >
                        View Policy
                    </button>
                )}
            </div>

            <div className="mt-4">
                <div className="min-w-0">
                    <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] font-bold text-accent-amber bg-accent-amber/10 border border-accent-amber/25 px-2.5 py-1 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent-amber animate-pulse" />
                        Under Construction
                    </span>
                    <p className="mt-2 text-[12px] font-medium text-accent-amber/90">
                        Check back tomorrow as our team is working on it.
                    </p>
                    <div className="mt-2 max-w-[28rem] rounded-lg border border-border/45 px-2.5 py-1.5">
                        <p className="flex items-start gap-2 text-[11px] leading-relaxed text-text-secondary">
                            <span className="mt-0.5 inline-flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border border-flow-blue/30 text-[10px] font-semibold text-flow-blue">i</span>
                            <span>
                                Want to test calls now? Pick one from the template library using{' '}
                                <span className="inline-flex items-center rounded-md border border-flow-blue/32 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-flow-blue">
                                    Use a Template
                                </span>{' '}
                                below.
                            </span>
                        </p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

function BuildingAgentDetails({ agent }: { agent: Agent }) {
    if (!agent.policy) return null;
    const rules = Array.isArray(agent.policy.rules) ? agent.policy.rules : [];
    const categoryEntries: Array<{ key: CategoryType; label: string }> = [
        { key: 'see_urgently', label: 'See Urgently' },
        { key: 'see', label: 'See' },
        { key: 'cancel', label: 'Cancel & Redirect' },
    ];

    return (
        <div className="space-y-5">
            <section className="rounded-xl border border-accent-amber/25 bg-accent-amber/8 px-4 py-3">
                <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-amber animate-pulse" />
                    <h3 className="text-sm font-semibold text-text-primary">Under Construction</h3>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-text-secondary">
                    This agent was submitted via the custom builder. Its policy is shown below.
                </p>
            </section>

            {categoryEntries.map(({ key, label }) => {
                const categoryRules = rules.filter((rule) => rule.categoryType === key);
                if (!categoryRules.length) return null;
                return (
                    <section key={key}>
                        <h3 className="text-sm font-semibold text-text-primary">{label}</h3>
                        <ul className="mt-2 space-y-1.5">
                            {categoryRules.map((rule) => (
                                <li key={rule.id} className="rounded-lg border border-border/45 bg-bg-primary/40 px-3 py-2 text-xs leading-relaxed text-text-secondary">
                                    {rule.description}
                                </li>
                            ))}
                        </ul>
                    </section>
                );
            })}

            {rules.length === 0 && (
                <section>
                    <h3 className="text-sm font-semibold text-text-primary">Decision Rules</h3>
                    <p className="mt-2 text-xs leading-relaxed text-text-secondary">
                        No rules have been saved yet.
                    </p>
                </section>
            )}
        </div>
    );
}

export function TemplateGallery({ onBuildCustom }: TemplateGalleryProps) {
    const [activeCategory, setActiveCategory] = useState<TemplateCategory>('All');
    const [showTemplates, setShowTemplates] = useState(false);
    const [viewingTemplateId, setViewingTemplateId] = useState<string | null>(null);
    const [viewingBuildingAgent, setViewingBuildingAgent] = useState<Agent | null>(null);
    const [buildingAgents, setBuildingAgents] = useState<Agent[]>([]);
    const { state, actions } = useOnboardingFlowContext();
    const prefersReducedMotion = useReducedMotion();
    const headingWords = ['Set up', 'your', 'triage', 'assistant'];
    const viewingTemplate = viewingTemplateId
        ? AGENT_TEMPLATES.find((template) => template.id === viewingTemplateId) ?? null
        : null;

    useEffect(() => {
        fetch('/api/agents')
            .then((res) => res.json())
            .then((agents: Agent[]) => setBuildingAgents(agents.filter((a) => a.status === 'building')))
            .catch(() => { });
    }, []);

    const filtered = (activeCategory === 'All'
        ? AGENT_TEMPLATES
        : AGENT_TEMPLATES.filter((t) => t.category === activeCategory)
    ).sort((a, b) => (b.available ? 1 : 0) - (a.available ? 1 : 0));

    useEffect(() => {
        if (state.templateCreationError) {
            setShowTemplates(true);
        }
    }, [state.templateCreationError]);

    if (showTemplates) {
        return (
            <div className="h-full flex flex-col">
                {/* Header with back button */}
                <div className="px-10 pt-10 pb-6">
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <button
                            onClick={() => {
                                setShowTemplates(false);
                                setViewingTemplateId(null);
                            }}
                            className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-flow-blue transition-colors mb-5 cursor-pointer group"
                        >
                            <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                            </svg>
                            Back
                        </button>
                        <h1 className="text-2xl font-semibold text-text-primary tracking-tight">
                            Choose a triage assistant
                        </h1>
                        <p className="text-sm text-text-secondary mt-2 max-w-lg">
                            Ready-made clinical assistants with built-in triage logic.
                        </p>
                        <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-flow-blue/20 bg-flow-blue/10 px-3 py-1.5">
                            <span className="text-[10px] uppercase tracking-[0.16em] font-semibold text-flow-blue">Step 1</span>
                            <span className="text-xs text-text-secondary">Choose your assistant template.</span>
                        </div>
                        {state.templateCreationError && (
                            <div className="mt-4 rounded-lg border border-accent-red/25 bg-accent-red/10 px-3 py-2">
                                <p className="text-xs text-accent-red">{state.templateCreationError}</p>
                            </div>
                        )}
                    </motion.div>

                    {/* Category Filter */}
                    <div className="flex items-center gap-2 mt-6">
                        {TEMPLATE_CATEGORIES.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${activeCategory === cat
                                        ? 'bg-flow-blue/15 text-flow-blue border border-flow-blue/30'
                                        : 'bg-bg-secondary/40 text-text-secondary hover:text-text-primary border border-transparent hover:border-border/40'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Templates Grid */}
                <div className="flex-1 overflow-auto px-10 pb-10">
                    {buildingAgents.length > 0 && (
                        <div className="mb-8">
                            <h2 className="text-sm font-semibold text-text-primary mb-3">Your Agents</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                {buildingAgents.map((agent) => (
                                    <UnderConstructionCard key={agent.id} agent={agent} onView={setViewingBuildingAgent} />
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        <AnimatePresence mode="popLayout">
                            {filtered.map((template) => (
                                <TemplateCard
                                    key={template.id}
                                    template={template}
                                    onSelect={actions.selectTemplate}
                                    onView={setViewingTemplateId}
                                    isCreating={state.isCreatingFromTemplate}
                                />
                            ))}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Template detail modal */}
                <Modal
                    open={Boolean(viewingTemplate)}
                    onClose={() => setViewingTemplateId(null)}
                    containerClassName="max-w-4xl"
                >
                    {viewingTemplate && (
                        <div className="bg-bg-panel border border-border/45 rounded-2xl shadow-2xl overflow-hidden">
                            <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-border/45 bg-bg-primary/55">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xl">{viewingTemplate.icon}</span>
                                        <h2 className="text-lg font-semibold text-text-primary truncate">
                                            {viewingTemplate.name}
                                        </h2>
                                    </div>
                                    <p className="text-xs text-text-secondary mt-1">
                                        {viewingTemplate.specialty}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setViewingTemplateId(null)}
                                    className="text-xs font-medium text-text-secondary hover:text-text-primary border border-border/55 bg-bg-primary/50 hover:bg-bg-primary/75 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                                >
                                    Close
                                </button>
                            </div>
                            <div className="max-h-[78vh] overflow-y-auto px-6 py-5">
                                {viewingTemplate.id === 'shoulder-triage'
                                    ? <ShoulderTemplateDetails />
                                    : <GenericTemplateDetails template={viewingTemplate} />}
                            </div>
                        </div>
                    )}
                </Modal>

                {/* Building agent policy modal */}
                <Modal
                    open={Boolean(viewingBuildingAgent)}
                    onClose={() => setViewingBuildingAgent(null)}
                    containerClassName="max-w-4xl"
                >
                    {viewingBuildingAgent && (
                        <div className="bg-bg-panel border border-border/45 rounded-2xl shadow-2xl overflow-hidden">
                            <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-border/45 bg-bg-primary/55">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <svg className="w-5 h-5 text-accent-amber" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085" />
                                        </svg>
                                        <h2 className="text-lg font-semibold text-text-primary truncate">
                                            {viewingBuildingAgent.name}
                                        </h2>
                                    </div>
                                    {viewingBuildingAgent.specialty && (
                                        <p className="text-xs text-text-secondary mt-1">
                                            {viewingBuildingAgent.specialty}
                                        </p>
                                    )}
                                </div>
                                <button
                                    onClick={() => setViewingBuildingAgent(null)}
                                    className="text-xs font-medium text-text-secondary hover:text-text-primary border border-border/55 bg-bg-primary/50 hover:bg-bg-primary/75 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                                >
                                    Close
                                </button>
                            </div>
                            <div className="max-h-[78vh] overflow-y-auto px-6 py-5">
                                <BuildingAgentDetails agent={viewingBuildingAgent} />
                            </div>
                        </div>
                    )}
                </Modal>
            </div>
        );
    }

    // ── Landing: Two-path choice ──
    return (
        <div className="flex flex-col items-center justify-center px-10 py-10">
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-3xl w-full text-center"
            >
                <div className="relative inline-flex flex-col items-center">
                    <motion.span
                        aria-hidden
                        className="pointer-events-none absolute -inset-x-8 -inset-y-5 rounded-full"
                        style={{ background: 'radial-gradient(ellipse at center, rgba(30,78,160,0.2) 0%, rgba(30,78,160,0) 72%)' }}
                        animate={
                            prefersReducedMotion
                                ? { opacity: 0.4 }
                                : { opacity: [0.3, 0.6, 0.3], scale: [0.95, 1.06, 0.95] }
                        }
                        transition={
                            prefersReducedMotion
                                ? undefined
                                : { duration: 3.2, repeat: Infinity, ease: 'easeInOut' }
                        }
                    />
                    <h1 className="relative text-3xl font-semibold text-text-primary tracking-tight">
                        <span className="sr-only">Set up your triage assistant</span>
                        <span aria-hidden className="inline-flex flex-wrap justify-center gap-x-2">
                            {headingWords.map((word, index) => (
                                <motion.span
                                    key={word}
                                    initial={{ opacity: 0, y: 18, filter: 'blur(8px)' }}
                                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                                    transition={{ duration: 0.5, delay: 0.08 + index * 0.09, ease: 'easeOut' }}
                                    className="relative inline-block"
                                >
                                    {word}
                                    <motion.span
                                        aria-hidden
                                        className="absolute -inset-x-1 -inset-y-0.5 rounded-md"
                                        style={{
                                            background:
                                                'linear-gradient(115deg, rgba(30,78,160,0) 0%, rgba(30,78,160,0.23) 46%, rgba(30,78,160,0) 100%)',
                                        }}
                                        initial={{ opacity: 0 }}
                                        animate={
                                            prefersReducedMotion
                                                ? { opacity: 0 }
                                                : { opacity: [0, 0.8, 0], x: [-12, 20, 38] }
                                        }
                                        transition={{
                                            duration: 0.95,
                                            delay: 0.36 + index * 0.1,
                                            ease: 'easeOut',
                                        }}
                                    />
                                </motion.span>
                            ))}
                        </span>
                    </h1>
                    <div className="relative mt-3 h-1 w-64 max-w-full overflow-hidden rounded-full bg-flow-blue/12">
                        <motion.span
                            className="absolute inset-y-0 left-0 rounded-full bg-flow-blue/65"
                            initial={{ width: '0%' }}
                            animate={{ width: '100%' }}
                            transition={{ duration: 0.8, delay: 0.42, ease: 'easeInOut' }}
                        />
                        <motion.span
                            aria-hidden
                            className="absolute inset-y-0 w-20 rounded-full bg-gradient-to-r from-transparent via-white/85 to-transparent"
                            animate={prefersReducedMotion ? { opacity: 0 } : { x: ['-35%', '125%'], opacity: [0, 0.9, 0] }}
                            transition={
                                prefersReducedMotion
                                    ? undefined
                                    : { duration: 1.6, delay: 0.95, repeat: Infinity, repeatDelay: 2.1, ease: 'easeInOut' }
                            }
                        />
                    </div>
                </div>
                <p className="text-sm text-text-secondary mt-3 max-w-xl mx-auto leading-relaxed">
                    Start with a ready-made clinical assistant or create your own for your practice.
                </p>
                <p className="text-[11px] uppercase tracking-[0.16em] text-text-secondary/80 mt-5 font-semibold">
                    Most clinics start with a template, then customize
                </p>
            </motion.div>

            {buildingAgents.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    className="mt-8 max-w-3xl w-full"
                >
                    <h2 className="text-sm font-semibold text-text-primary mb-3">Your Agents</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {buildingAgents.map((agent) => (
                            <UnderConstructionCard key={agent.id} agent={agent} onView={setViewingBuildingAgent} />
                        ))}
                    </div>
                </motion.div>
            )}

            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.15 }}
                className="relative grid grid-cols-1 sm:grid-cols-2 gap-5 mt-8 max-w-3xl w-full"
            >
                <div className="hidden sm:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 items-center justify-center">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-flow-blue bg-bg-primary border border-flow-blue/20 rounded-full px-3 py-1.5 shadow-sm">
                        OR
                    </span>
                </div>

                {/* Option 1: Use a Template */}
                <button
                    onClick={() => setShowTemplates(true)}
                    className="group relative sm:-translate-y-1 overflow-hidden bg-bg-panel border border-flow-blue/45 ring-1 ring-flow-blue/20 rounded-xl p-7 text-left transition-all duration-300 hover:border-flow-blue/65 hover:ring-flow-blue/30 hover:bg-bg-secondary/30 shadow-[0_10px_30px_rgba(30,78,160,0.16),0_1px_0_rgba(15,23,42,0.04)] cursor-pointer"
                >
                    <span
                        aria-hidden
                        className="pointer-events-none absolute inset-x-8 top-4 h-16 bg-flow-blue/18 blur-2xl opacity-70"
                    />
                    <span className="inline-flex items-center text-[10px] uppercase tracking-[0.16em] font-semibold text-flow-blue bg-flow-blue/10 border border-flow-blue/25 rounded-full px-2.5 py-1 mb-4">
                        Option 1
                    </span>
                    <span className="absolute top-5 right-5 inline-flex items-center text-[10px] uppercase tracking-[0.12em] font-semibold text-flow-blue bg-flow-blue/15 border border-flow-blue/35 rounded-full px-2 py-1 shadow-sm">
                        Recommended
                    </span>
                    <div className="w-11 h-11 rounded-xl bg-flow-blue/12 border border-flow-blue/20 flex items-center justify-center mb-5">
                        <svg className="w-5 h-5 text-flow-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
                        </svg>
                    </div>
                    <h3 className="text-base font-semibold text-text-primary group-hover:text-flow-blue transition-colors">
                        Use a Template
                    </h3>
                    <p className="text-xs text-text-secondary mt-2 leading-relaxed">
                        Begin with a proven setup and run test calls quickly.
                    </p>
                    <p className="text-[11px] text-text-secondary/80 mt-3 font-medium">
                        Setup time: ~1 minute
                    </p>
                    <div className="flex items-center gap-1.5 mt-5 text-xs text-flow-blue font-semibold">
                        Browse Templates
                        <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                    </div>
                </button>

                {/* Option 2: Build Custom */}
                <button
                    onClick={onBuildCustom}
                    className="group relative bg-bg-secondary/35 border border-border/45 rounded-xl p-7 text-left transition-all duration-300 hover:border-flow-blue/30 hover:bg-bg-secondary/55 cursor-pointer"
                >
                    <span className="inline-flex items-center text-[10px] uppercase tracking-[0.16em] font-semibold text-text-secondary bg-bg-primary/85 border border-border/60 rounded-full px-2.5 py-1 mb-4">
                        Option 2
                    </span>
                    <div className="w-11 h-11 rounded-xl bg-bg-primary/85 border border-border/55 flex items-center justify-center mb-5">
                        <svg className="w-5 h-5 text-text-secondary group-hover:text-flow-blue transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                    </div>
                    <h3 className="text-base font-semibold text-text-primary group-hover:text-flow-blue transition-colors">
                        Build Custom Assistant
                    </h3>
                    <p className="text-xs text-text-secondary mt-2 leading-relaxed">
                        Define your own triage approach, then test with sample patient calls.
                    </p>
                    <p className="text-[11px] text-text-secondary/80 mt-3 font-medium">
                        Setup time: ~5 minutes
                    </p>
                    <div className="flex items-center gap-1.5 mt-5 text-xs text-text-secondary group-hover:text-flow-blue font-medium transition-colors">
                        Build Custom Assistant
                        <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                    </div>
                </button>
            </motion.div>

            {/* Building agent policy modal (landing page) */}
            <Modal
                open={Boolean(viewingBuildingAgent)}
                onClose={() => setViewingBuildingAgent(null)}
                containerClassName="max-w-4xl"
            >
                {viewingBuildingAgent && (
                    <div className="bg-bg-panel border border-border/45 rounded-2xl shadow-2xl overflow-hidden">
                        <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-border/45 bg-bg-primary/55">
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <svg className="w-5 h-5 text-accent-amber" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085" />
                                    </svg>
                                    <h2 className="text-lg font-semibold text-text-primary truncate">
                                        {viewingBuildingAgent.name}
                                    </h2>
                                </div>
                                {viewingBuildingAgent.specialty && (
                                    <p className="text-xs text-text-secondary mt-1">
                                        {viewingBuildingAgent.specialty}
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={() => setViewingBuildingAgent(null)}
                                className="text-xs font-medium text-text-secondary hover:text-text-primary border border-border/55 bg-bg-primary/50 hover:bg-bg-primary/75 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                            >
                                Close
                            </button>
                        </div>
                        <div className="max-h-[78vh] overflow-y-auto px-6 py-5">
                            <BuildingAgentDetails agent={viewingBuildingAgent} />
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
