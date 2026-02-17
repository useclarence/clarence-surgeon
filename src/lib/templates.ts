import type { ConsultationPolicy } from './types';

export interface AgentTemplate {
    id: string;
    name: string;
    specialty: string;
    description: string;
    category: 'Orthopedics' | 'Neurosurgery' | 'General' | 'Cardiac' | 'Urology';
    icon: string;
    featured?: boolean;
    available?: boolean;
    policy: ConsultationPolicy;
}

export const AGENT_TEMPLATES: AgentTemplate[] = [
    {
        id: 'shoulder-triage',
        name: 'Shoulder Surgery Triage',
        specialty: 'Shoulder Surgery',
        description: 'Triages shoulder patients by pathology type, imaging completeness, and functional impairment. Covers rotator cuff tears, instability, fractures, and arthroplasty candidacy.',
        category: 'Orthopedics',
        icon: '💪',
        featured: true,
        available: true,
        policy: {
            version: 1,
            blocks: {
                highPotentialPatients: {
                    items: [
                        { id: 'sh-h1', description: 'Full-thickness rotator cuff tear with significant weakness and failed conservative treatment (>6 weeks)' },
                        { id: 'sh-h2', description: 'Recurrent shoulder dislocations (>2 episodes) in active patient' },
                        { id: 'sh-h3', description: 'Displaced proximal humerus fracture requiring surgical fixation' },
                        { id: 'sh-h4', description: 'Advanced glenohumeral arthritis with bone-on-bone changes and failed non-operative management' },
                    ],
                },
                lowPotentialPatients: {
                    items: [
                        { id: 'sh-l1', description: 'Partial rotator cuff tear with mild symptoms responding to physical therapy' },
                        { id: 'sh-l2', description: 'Shoulder impingement without structural tear on imaging' },
                        { id: 'sh-l3', description: 'Frozen shoulder in early inflammatory phase — non-operative management preferred' },
                    ],
                },
                inBetween: {
                    items: [
                        { id: 'sh-m1', description: 'Large rotator cuff tear in older patient — repair vs. reverse arthroplasty discussion' },
                        { id: 'sh-m2', description: 'First-time dislocation in young athlete — surgery vs. rehabilitation depends on sport and exam findings' },
                        { id: 'sh-m3', description: 'AC joint arthritis with persistent pain — may benefit from distal clavicle excision if conservative fails' },
                    ],
                },
                forNonQualified: {
                    items: [
                        { id: 'sh-n1', description: 'Refer to sports medicine or physiatry for conservative management' },
                        { id: 'sh-n2', description: 'Recommend structured physical therapy program (minimum 6 weeks)' },
                        { id: 'sh-n3', description: 'Offer corticosteroid injection for diagnostic and therapeutic purposes' },
                    ],
                },
            },
            rules: [
                { id: 'sh-r1', type: 'gate', condition: 'Pathology is not within the shoulder girdle', outcome: 'Redirect to appropriate specialty', dimension: 'scope' },
                { id: 'sh-r2', type: 'prerequisite', condition: 'No MRI or ultrasound of the shoulder within the last 6 months', outcome: 'Request imaging before consultation', dimension: 'readiness' },
                { id: 'sh-r3', type: 'accelerator', condition: 'Acute displaced fracture or shoulder dislocation unable to be reduced', outcome: 'Urgent consultation within 24-48 hours', dimension: 'urgency' },
                { id: 'sh-r4', type: 'prerequisite', condition: 'No trial of conservative treatment for non-urgent cases', outcome: 'Recommend 6 weeks of physical therapy first', dimension: 'readiness' },
                { id: 'sh-r5', type: 'accelerator', condition: 'Vascular compromise or nerve injury associated with shoulder trauma', outcome: 'Emergency referral — same day', dimension: 'urgency' },
            ],
        },
    },
    {
        id: 'spine-triage',
        name: 'Spine Surgery Triage',
        specialty: 'Spine Surgery',
        description: 'Triages spine patients by pathology scope, imaging readiness, and neurological urgency. Covers disc herniation, stenosis, deformity, and trauma referrals.',
        category: 'Orthopedics',
        icon: '🦴',
        policy: {
            version: 1,
            blocks: {
                highPotentialPatients: {
                    items: [
                        { id: 'sp-h1', description: 'Lumbar disc herniation with radiculopathy and failed conservative treatment (>6 weeks)' },
                        { id: 'sp-h2', description: 'Cervical myelopathy with progressive neurological deficit' },
                        { id: 'sp-h3', description: 'Spinal stenosis with neurogenic claudication limiting daily function' },
                        { id: 'sp-h4', description: 'Unstable spinal fracture or traumatic spinal cord injury' },
                    ],
                },
                lowPotentialPatients: {
                    items: [
                        { id: 'sp-l1', description: 'Mechanical back pain without radiculopathy or red flags' },
                        { id: 'sp-l2', description: 'Degenerative disc disease with no neurological compromise' },
                        { id: 'sp-l3', description: 'Chronic pain syndrome without structural surgical target' },
                    ],
                },
                inBetween: {
                    items: [
                        { id: 'sp-m1', description: 'Moderate stenosis with intermittent symptoms — may benefit from surgery if conservative fails' },
                        { id: 'sp-m2', description: 'Recurrent disc herniation after prior surgery — depends on imaging findings' },
                        { id: 'sp-m3', description: 'Scoliosis with progressive curve but manageable symptoms' },
                    ],
                },
                forNonQualified: {
                    items: [
                        { id: 'sp-n1', description: 'Refer to pain management or physiatry for conservative care' },
                        { id: 'sp-n2', description: 'Recommend structured physical therapy program (minimum 6 weeks)' },
                        { id: 'sp-n3', description: 'Provide patient education materials on spine health and when to return' },
                    ],
                },
            },
            rules: [
                { id: 'sp-r1', type: 'gate', condition: 'Pathology is not within the spinal axis', outcome: 'Redirect to appropriate specialty', dimension: 'scope' },
                { id: 'sp-r2', type: 'prerequisite', condition: 'No MRI or CT of the spine within the last 6 months', outcome: 'Request imaging before consultation', dimension: 'readiness' },
                { id: 'sp-r3', type: 'accelerator', condition: 'Progressive neurological deficit (motor weakness, cauda equina symptoms)', outcome: 'Urgent consultation within 48 hours', dimension: 'urgency' },
                { id: 'sp-r4', type: 'prerequisite', condition: 'No trial of conservative treatment for non-urgent cases', outcome: 'Recommend 6 weeks of physical therapy first', dimension: 'readiness' },
                { id: 'sp-r5', type: 'accelerator', condition: 'Bladder or bowel dysfunction suggesting cauda equina', outcome: 'Emergency referral — same day', dimension: 'urgency' },
            ],
        },
    },
    {
        id: 'knee-replacement',
        name: 'Knee Surgery Triage',
        specialty: 'Orthopedics',
        description: 'Screens patients for total or partial knee arthroplasty candidacy based on functional impairment, imaging, and conservative treatment history.',
        category: 'Orthopedics',
        icon: '🦿',
        policy: {
            version: 1,
            blocks: {
                highPotentialPatients: {
                    items: [
                        { id: 'kr-h1', description: 'Bone-on-bone arthritis (Kellgren-Lawrence grade 4) with significant functional limitation' },
                        { id: 'kr-h2', description: 'Failed all conservative measures including injections, PT, and NSAIDs for >6 months' },
                        { id: 'kr-h3', description: 'Night pain and rest pain affecting quality of life' },
                    ],
                },
                lowPotentialPatients: {
                    items: [
                        { id: 'kr-l1', description: 'Early osteoarthritis (KL grade 1-2) with mild symptoms' },
                        { id: 'kr-l2', description: 'Active infection or skin condition over the knee' },
                        { id: 'kr-l3', description: 'BMI >45 without willingness to optimize weight pre-operatively' },
                    ],
                },
                inBetween: {
                    items: [
                        { id: 'kr-m1', description: 'Moderate arthritis (KL grade 3) with variable symptoms — may benefit from partial replacement' },
                        { id: 'kr-m2', description: 'Younger patient (<55) with significant arthritis — requires careful discussion of longevity expectations' },
                    ],
                },
                forNonQualified: {
                    items: [
                        { id: 'kr-n1', description: 'Refer to sports medicine or rheumatology for ongoing conservative management' },
                        { id: 'kr-n2', description: 'Recommend weight optimization program if BMI is a barrier' },
                        { id: 'kr-n3', description: 'Offer viscosupplementation or PRP injection referral' },
                    ],
                },
            },
            rules: [
                { id: 'kr-r1', type: 'gate', condition: 'Pain is not localized to the knee joint', outcome: 'Evaluate for hip or lumbar referred pain first', dimension: 'scope' },
                { id: 'kr-r2', type: 'prerequisite', condition: 'No weight-bearing X-rays of the knee', outcome: 'Order standing AP and lateral knee X-rays', dimension: 'readiness' },
                { id: 'kr-r3', type: 'prerequisite', condition: 'No documented trial of physical therapy', outcome: 'Recommend structured PT program before consultation', dimension: 'readiness' },
                { id: 'kr-r4', type: 'accelerator', condition: 'Acute fracture or mechanical locking of the knee', outcome: 'Expedited surgical consultation', dimension: 'urgency' },
            ],
        },
    },
    {
        id: 'brain-tumor',
        name: 'Brain Surgery Triage',
        specialty: 'Neurosurgery',
        description: 'Evaluates patients with suspected or confirmed intracranial lesions for surgical candidacy, biopsy needs, and observation protocols.',
        category: 'Neurosurgery',
        icon: '🧠',
        policy: {
            version: 1,
            blocks: {
                highPotentialPatients: {
                    items: [
                        { id: 'bt-h1', description: 'Symptomatic mass lesion with mass effect or midline shift' },
                        { id: 'bt-h2', description: 'Rapidly growing lesion on serial imaging' },
                        { id: 'bt-h3', description: 'Lesion in a surgically accessible location with high suspicion of high-grade glioma' },
                    ],
                },
                lowPotentialPatients: {
                    items: [
                        { id: 'bt-l1', description: 'Small incidental meningioma (<2cm) without symptoms or edema' },
                        { id: 'bt-l2', description: 'Stable lesion on serial imaging over >2 years with no symptoms' },
                        { id: 'bt-l3', description: 'Lesion more appropriate for radiosurgery than open surgery' },
                    ],
                },
                inBetween: {
                    items: [
                        { id: 'bt-m1', description: 'Growing but asymptomatic lesion — surgery timing depends on location and growth rate' },
                        { id: 'bt-m2', description: 'Deep-seated lesion requiring stereotactic biopsy for diagnosis before treatment planning' },
                    ],
                },
                forNonQualified: {
                    items: [
                        { id: 'bt-n1', description: 'Establish surveillance imaging protocol (MRI every 6-12 months)' },
                        { id: 'bt-n2', description: 'Refer to neuro-oncology for non-surgical management options' },
                        { id: 'bt-n3', description: 'Refer to radiation oncology if radiosurgery is more appropriate' },
                    ],
                },
            },
            rules: [
                { id: 'bt-r1', type: 'gate', condition: 'Lesion is extracranial or spinal', outcome: 'Redirect to spine surgery or appropriate specialty', dimension: 'scope' },
                { id: 'bt-r2', type: 'prerequisite', condition: 'No contrast-enhanced MRI brain within 3 months', outcome: 'Order MRI with gadolinium before consultation', dimension: 'readiness' },
                { id: 'bt-r3', type: 'accelerator', condition: 'Acute neurological deterioration, seizures, or signs of herniation', outcome: 'Emergency neurosurgical evaluation', dimension: 'urgency' },
                { id: 'bt-r4', type: 'accelerator', condition: 'New onset seizures with mass lesion', outcome: 'Urgent consultation within 1 week', dimension: 'urgency' },
            ],
        },
    },
    {
        id: 'hernia-repair',
        name: 'Abdominal Surgery Triage',
        specialty: 'General Surgery',
        description: 'Assesses patients with inguinal, ventral, or incisional hernias for surgical repair candidacy, timing, and approach.',
        category: 'General',
        icon: '🩺',
        policy: {
            version: 1,
            blocks: {
                highPotentialPatients: {
                    items: [
                        { id: 'hr-h1', description: 'Symptomatic hernia causing pain, limitation of activity, or cosmetic concern' },
                        { id: 'hr-h2', description: 'Incarcerated hernia that was manually reduced — needs elective repair to prevent recurrence' },
                        { id: 'hr-h3', description: 'Enlarging hernia over serial examinations' },
                    ],
                },
                lowPotentialPatients: {
                    items: [
                        { id: 'hr-l1', description: 'Small asymptomatic inguinal hernia in elderly patient with significant comorbidities' },
                        { id: 'hr-l2', description: 'Patient unable to tolerate general anesthesia without significant risk optimization' },
                    ],
                },
                inBetween: {
                    items: [
                        { id: 'hr-m1', description: 'Mildly symptomatic hernia in patient with moderate surgical risk — watchful waiting vs. repair discussion' },
                        { id: 'hr-m2', description: 'Complex incisional hernia requiring component separation — needs multidisciplinary planning' },
                    ],
                },
                forNonQualified: {
                    items: [
                        { id: 'hr-n1', description: 'Watchful waiting protocol with instructions on signs of incarceration/strangulation' },
                        { id: 'hr-n2', description: 'Refer to internal medicine for surgical risk optimization before reconsideration' },
                        { id: 'hr-n3', description: 'Provide hernia truss/support garment for symptom management' },
                    ],
                },
            },
            rules: [
                { id: 'hr-r1', type: 'gate', condition: 'Mass is not a hernia (lipoma, lymphadenopathy, etc.)', outcome: 'Redirect to appropriate workup', dimension: 'scope' },
                { id: 'hr-r2', type: 'prerequisite', condition: 'BMI >40 for elective ventral hernia repair', outcome: 'Weight optimization required before surgery', dimension: 'readiness' },
                { id: 'hr-r3', type: 'accelerator', condition: 'Signs of strangulation (irreducible, tender, erythematous)', outcome: 'Emergency surgical consultation', dimension: 'urgency' },
            ],
        },
    },
    {
        id: 'cabg-screening',
        name: 'Cardiac Surgery Triage',
        specialty: 'Cardiac Surgery',
        description: 'Screens patients with coronary artery disease for coronary artery bypass grafting candidacy based on anatomy, function, and risk profile.',
        category: 'Cardiac',
        icon: '❤️',
        policy: {
            version: 1,
            blocks: {
                highPotentialPatients: {
                    items: [
                        { id: 'cb-h1', description: 'Left main coronary artery disease (>50% stenosis)' },
                        { id: 'cb-h2', description: 'Triple vessel disease with reduced ejection fraction (<50%)' },
                        { id: 'cb-h3', description: 'Failed PCI or anatomy not amenable to percutaneous intervention' },
                    ],
                },
                lowPotentialPatients: {
                    items: [
                        { id: 'cb-l1', description: 'Single vessel disease amenable to PCI' },
                        { id: 'cb-l2', description: 'Advanced age (>85) with multiple comorbidities and limited life expectancy' },
                        { id: 'cb-l3', description: 'Diffusely diseased vessels not suitable for grafting' },
                    ],
                },
                inBetween: {
                    items: [
                        { id: 'cb-m1', description: 'Two-vessel disease with proximal LAD involvement — CABG vs. PCI discussion based on SYNTAX score' },
                        { id: 'cb-m2', description: 'Diabetic patient with multivessel disease — strong evidence favors CABG but risk-benefit analysis needed' },
                    ],
                },
                forNonQualified: {
                    items: [
                        { id: 'cb-n1', description: 'Refer to interventional cardiology for PCI evaluation' },
                        { id: 'cb-n2', description: 'Optimize medical therapy (dual antiplatelet, statin, beta-blocker)' },
                        { id: 'cb-n3', description: 'Cardiac rehabilitation referral for functional optimization' },
                    ],
                },
            },
            rules: [
                { id: 'cb-r1', type: 'gate', condition: 'No documented coronary angiography or CT coronary angiogram', outcome: 'Cannot assess candidacy without angiographic data', dimension: 'scope' },
                { id: 'cb-r2', type: 'prerequisite', condition: 'No recent echocardiogram (<6 months)', outcome: 'Order echocardiogram to assess ventricular function', dimension: 'readiness' },
                { id: 'cb-r3', type: 'prerequisite', condition: 'Active smoking without cessation attempt', outcome: 'Require smoking cessation program enrollment before elective CABG', dimension: 'readiness' },
                { id: 'cb-r4', type: 'accelerator', condition: 'Acute coronary syndrome with left main or critical triple vessel disease', outcome: 'Urgent surgical consultation within 24-48 hours', dimension: 'urgency' },
            ],
        },
    },
    {
        id: 'prostate-surgery',
        name: 'Prostate Surgery Triage',
        specialty: 'Urology',
        description: 'Triages patients with prostate conditions for surgical intervention including prostatectomy, TURP, and robotic-assisted procedures.',
        category: 'Urology',
        icon: '🔬',
        policy: {
            version: 1,
            blocks: {
                highPotentialPatients: {
                    items: [
                        { id: 'ps-h1', description: 'Localized prostate cancer (Gleason 7+) in patient with >10 year life expectancy' },
                        { id: 'ps-h2', description: 'Severe BPH with urinary retention refractory to medical therapy' },
                        { id: 'ps-h3', description: 'Recurrent gross hematuria from prostatic source' },
                    ],
                },
                lowPotentialPatients: {
                    items: [
                        { id: 'ps-l1', description: 'Low-risk prostate cancer (Gleason 6) suitable for active surveillance' },
                        { id: 'ps-l2', description: 'Mild BPH symptoms well-controlled with alpha-blockers' },
                        { id: 'ps-l3', description: 'Advanced metastatic disease — systemic therapy more appropriate' },
                    ],
                },
                inBetween: {
                    items: [
                        { id: 'ps-m1', description: 'Intermediate-risk prostate cancer — surgery vs. radiation discussion based on patient preference and anatomy' },
                        { id: 'ps-m2', description: 'Moderate BPH with incomplete response to dual medical therapy — consider minimally invasive options' },
                    ],
                },
                forNonQualified: {
                    items: [
                        { id: 'ps-n1', description: 'Active surveillance protocol for low-risk prostate cancer' },
                        { id: 'ps-n2', description: 'Medical therapy optimization with urology follow-up' },
                        { id: 'ps-n3', description: 'Refer to radiation oncology for non-surgical treatment discussion' },
                    ],
                },
            },
            rules: [
                { id: 'ps-r1', type: 'gate', condition: 'No tissue diagnosis (biopsy) for suspected cancer cases', outcome: 'Prostate biopsy required before surgical planning', dimension: 'scope' },
                { id: 'ps-r2', type: 'prerequisite', condition: 'No PSA or digital rectal exam within 3 months', outcome: 'Order PSA and perform DRE before consultation', dimension: 'readiness' },
                { id: 'ps-r3', type: 'prerequisite', condition: 'No staging imaging for intermediate/high-risk cancer', outcome: 'Order MRI pelvis and bone scan', dimension: 'readiness' },
                { id: 'ps-r4', type: 'accelerator', condition: 'Acute urinary retention requiring catheterization', outcome: 'Expedited urology consultation', dimension: 'urgency' },
            ],
        },
    },
];

export const TEMPLATE_CATEGORIES = ['All', 'Orthopedics', 'Neurosurgery', 'General', 'Cardiac', 'Urology'] as const;
export type TemplateCategory = typeof TEMPLATE_CATEGORIES[number];
