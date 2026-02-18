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
            rules: [
                // See Urgently
                { id: 'sh-u1', description: 'Acute displaced fracture or shoulder dislocation unable to be reduced — urgent consultation within 24-48 hours', categoryType: 'see_urgently' },
                { id: 'sh-u2', description: 'Vascular compromise or nerve injury associated with shoulder trauma — emergency referral same day', categoryType: 'see_urgently' },
                // See
                { id: 'sh-s1', description: 'Full-thickness rotator cuff tear with significant weakness and failed conservative treatment (>6 weeks)', categoryType: 'see' },
                { id: 'sh-s2', description: 'Recurrent shoulder dislocations (>2 episodes) in active patient', categoryType: 'see' },
                { id: 'sh-s3', description: 'Displaced proximal humerus fracture requiring surgical fixation', categoryType: 'see' },
                { id: 'sh-s4', description: 'Advanced glenohumeral arthritis with bone-on-bone changes and failed non-operative management', categoryType: 'see' },
                { id: 'sh-s5', description: 'Large rotator cuff tear in older patient — request MRI before appointment for repair vs. reverse arthroplasty discussion', categoryType: 'see' },
                { id: 'sh-s6', description: 'First-time dislocation in young athlete — request MRI before appointment', categoryType: 'see' },
                { id: 'sh-s7', description: 'No MRI or ultrasound within 6 months — request imaging before appointment', categoryType: 'see' },
                // Cancel
                { id: 'sh-c1', description: 'Pathology not within the shoulder girdle — redirect to appropriate specialty', categoryType: 'cancel' },
                { id: 'sh-c2', description: 'Partial rotator cuff tear with mild symptoms responding to physical therapy — redirect to sports medicine', categoryType: 'cancel' },
                { id: 'sh-c3', description: 'Shoulder impingement without structural tear on imaging — redirect to sports medicine', categoryType: 'cancel' },
                { id: 'sh-c4', description: 'Frozen shoulder in early inflammatory phase — redirect to physiatry for non-operative management', categoryType: 'cancel' },
                { id: 'sh-c5', description: 'No trial of conservative treatment for non-urgent cases — redirect to physiotherapy for 6 weeks first', categoryType: 'cancel' },
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
            rules: [
                // See Urgently
                { id: 'sp-u1', description: 'Progressive neurological deficit (motor weakness, cauda equina symptoms) — urgent consultation within 48 hours', categoryType: 'see_urgently' },
                { id: 'sp-u2', description: 'Bladder or bowel dysfunction suggesting cauda equina — emergency referral same day', categoryType: 'see_urgently' },
                { id: 'sp-u3', description: 'Unstable spinal fracture or traumatic spinal cord injury', categoryType: 'see_urgently' },
                // See
                { id: 'sp-s1', description: 'Lumbar disc herniation with radiculopathy and failed conservative treatment (>6 weeks)', categoryType: 'see' },
                { id: 'sp-s2', description: 'Cervical myelopathy with progressive neurological deficit', categoryType: 'see' },
                { id: 'sp-s3', description: 'Spinal stenosis with neurogenic claudication limiting daily function', categoryType: 'see' },
                { id: 'sp-s4', description: 'Moderate stenosis with intermittent symptoms — request MRI before appointment', categoryType: 'see' },
                { id: 'sp-s5', description: 'Recurrent disc herniation after prior surgery — request MRI before appointment', categoryType: 'see' },
                { id: 'sp-s6', description: 'No MRI or CT of the spine within 6 months — request imaging before appointment', categoryType: 'see' },
                // Cancel
                { id: 'sp-c1', description: 'Pathology not within the spinal axis — redirect to appropriate specialty', categoryType: 'cancel' },
                { id: 'sp-c2', description: 'Mechanical back pain without radiculopathy or red flags — redirect to pain management or physiatry', categoryType: 'cancel' },
                { id: 'sp-c3', description: 'Degenerative disc disease with no neurological compromise — redirect to physiotherapy', categoryType: 'cancel' },
                { id: 'sp-c4', description: 'Chronic pain syndrome without structural surgical target — redirect to pain management', categoryType: 'cancel' },
                { id: 'sp-c5', description: 'No trial of conservative treatment — redirect to physiotherapy for 6 weeks first', categoryType: 'cancel' },
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
            rules: [
                // See Urgently
                { id: 'kr-u1', description: 'Acute fracture or mechanical locking of the knee — expedited surgical consultation', categoryType: 'see_urgently' },
                // See
                { id: 'kr-s1', description: 'Bone-on-bone arthritis (Kellgren-Lawrence grade 4) with significant functional limitation', categoryType: 'see' },
                { id: 'kr-s2', description: 'Failed all conservative measures including injections, PT, and NSAIDs for >6 months', categoryType: 'see' },
                { id: 'kr-s3', description: 'Night pain and rest pain affecting quality of life', categoryType: 'see' },
                { id: 'kr-s4', description: 'Moderate arthritis (KL grade 3) with variable symptoms — request weight-bearing X-rays before appointment', categoryType: 'see' },
                { id: 'kr-s5', description: 'No weight-bearing X-rays — request standing AP and lateral knee X-rays before appointment', categoryType: 'see' },
                // Cancel
                { id: 'kr-c1', description: 'Pain not localized to the knee joint — evaluate for hip or lumbar referred pain first', categoryType: 'cancel' },
                { id: 'kr-c2', description: 'Early osteoarthritis (KL grade 1-2) with mild symptoms — redirect to sports medicine or rheumatology', categoryType: 'cancel' },
                { id: 'kr-c3', description: 'BMI >45 without willingness to optimize weight — redirect to weight optimization program', categoryType: 'cancel' },
                { id: 'kr-c4', description: 'No documented trial of physical therapy — redirect to structured PT program before consultation', categoryType: 'cancel' },
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
            rules: [
                // See Urgently
                { id: 'bt-u1', description: 'Acute neurological deterioration, seizures, or signs of herniation — emergency neurosurgical evaluation', categoryType: 'see_urgently' },
                { id: 'bt-u2', description: 'New onset seizures with mass lesion — urgent consultation within 1 week', categoryType: 'see_urgently' },
                // See
                { id: 'bt-s1', description: 'Symptomatic mass lesion with mass effect or midline shift', categoryType: 'see' },
                { id: 'bt-s2', description: 'Rapidly growing lesion on serial imaging', categoryType: 'see' },
                { id: 'bt-s3', description: 'Lesion in surgically accessible location with high suspicion of high-grade glioma', categoryType: 'see' },
                { id: 'bt-s4', description: 'Growing but asymptomatic lesion — request contrast-enhanced MRI before appointment', categoryType: 'see' },
                { id: 'bt-s5', description: 'Deep-seated lesion requiring stereotactic biopsy — request contrast-enhanced MRI before appointment', categoryType: 'see' },
                { id: 'bt-s6', description: 'No contrast-enhanced MRI brain within 3 months — request MRI with gadolinium before appointment', categoryType: 'see' },
                // Cancel
                { id: 'bt-c1', description: 'Lesion is extracranial or spinal — redirect to spine surgery or appropriate specialty', categoryType: 'cancel' },
                { id: 'bt-c2', description: 'Small incidental meningioma (<2cm) without symptoms or edema — surveillance imaging protocol, redirect to neuro-oncology', categoryType: 'cancel' },
                { id: 'bt-c3', description: 'Stable lesion on serial imaging over >2 years with no symptoms — surveillance protocol', categoryType: 'cancel' },
                { id: 'bt-c4', description: 'Lesion more appropriate for radiosurgery — redirect to radiation oncology', categoryType: 'cancel' },
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
            rules: [
                // See Urgently
                { id: 'hr-u1', description: 'Signs of strangulation (irreducible, tender, erythematous) — emergency surgical consultation', categoryType: 'see_urgently' },
                // See
                { id: 'hr-s1', description: 'Symptomatic hernia causing pain, limitation of activity, or cosmetic concern', categoryType: 'see' },
                { id: 'hr-s2', description: 'Incarcerated hernia that was manually reduced — needs elective repair to prevent recurrence', categoryType: 'see' },
                { id: 'hr-s3', description: 'Enlarging hernia over serial examinations', categoryType: 'see' },
                { id: 'hr-s4', description: 'Complex incisional hernia requiring component separation — needs multidisciplinary planning', categoryType: 'see' },
                // Cancel
                { id: 'hr-c1', description: 'Mass is not a hernia (lipoma, lymphadenopathy, etc.) — redirect to appropriate workup', categoryType: 'cancel' },
                { id: 'hr-c2', description: 'Small asymptomatic inguinal hernia in elderly patient with significant comorbidities — watchful waiting with instructions on signs of incarceration', categoryType: 'cancel' },
                { id: 'hr-c3', description: 'Patient unable to tolerate general anesthesia — redirect to internal medicine for risk optimization', categoryType: 'cancel' },
                { id: 'hr-c4', description: 'BMI >40 for elective ventral hernia repair — redirect to weight optimization program', categoryType: 'cancel' },
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
            rules: [
                // See Urgently
                { id: 'cb-u1', description: 'Acute coronary syndrome with left main or critical triple vessel disease — urgent surgical consultation within 24-48 hours', categoryType: 'see_urgently' },
                // See
                { id: 'cb-s1', description: 'Left main coronary artery disease (>50% stenosis)', categoryType: 'see' },
                { id: 'cb-s2', description: 'Triple vessel disease with reduced ejection fraction (<50%)', categoryType: 'see' },
                { id: 'cb-s3', description: 'Failed PCI or anatomy not amenable to percutaneous intervention', categoryType: 'see' },
                { id: 'cb-s4', description: 'Two-vessel disease with proximal LAD involvement — request recent echocardiogram before appointment', categoryType: 'see' },
                { id: 'cb-s5', description: 'No recent echocardiogram (<6 months) — request echo to assess ventricular function before appointment', categoryType: 'see' },
                { id: 'cb-s6', description: 'Active smoking — require smoking cessation program enrollment before elective CABG', categoryType: 'see' },
                // Cancel
                { id: 'cb-c1', description: 'No documented coronary angiography or CT coronary angiogram — cannot assess candidacy, redirect for angiographic workup', categoryType: 'cancel' },
                { id: 'cb-c2', description: 'Single vessel disease amenable to PCI — redirect to interventional cardiology', categoryType: 'cancel' },
                { id: 'cb-c3', description: 'Advanced age (>85) with multiple comorbidities and limited life expectancy — optimize medical therapy', categoryType: 'cancel' },
                { id: 'cb-c4', description: 'Diffusely diseased vessels not suitable for grafting — redirect to cardiology for medical management', categoryType: 'cancel' },
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
            rules: [
                // See Urgently
                { id: 'ps-u1', description: 'Acute urinary retention requiring catheterization — expedited urology consultation', categoryType: 'see_urgently' },
                // See
                { id: 'ps-s1', description: 'Localized prostate cancer (Gleason 7+) in patient with >10 year life expectancy', categoryType: 'see' },
                { id: 'ps-s2', description: 'Severe BPH with urinary retention refractory to medical therapy', categoryType: 'see' },
                { id: 'ps-s3', description: 'Recurrent gross hematuria from prostatic source', categoryType: 'see' },
                { id: 'ps-s4', description: 'Intermediate-risk prostate cancer — request MRI pelvis and bone scan before appointment', categoryType: 'see' },
                { id: 'ps-s5', description: 'Moderate BPH with incomplete response to dual medical therapy', categoryType: 'see' },
                { id: 'ps-s6', description: 'No PSA or digital rectal exam within 3 months — request PSA and DRE before appointment', categoryType: 'see' },
                // Cancel
                { id: 'ps-c1', description: 'No tissue diagnosis (biopsy) for suspected cancer — redirect for prostate biopsy before surgical planning', categoryType: 'cancel' },
                { id: 'ps-c2', description: 'Low-risk prostate cancer (Gleason 6) — redirect to active surveillance protocol', categoryType: 'cancel' },
                { id: 'ps-c3', description: 'Mild BPH symptoms well-controlled with alpha-blockers — continue medical therapy with urology follow-up', categoryType: 'cancel' },
                { id: 'ps-c4', description: 'Advanced metastatic disease — redirect to oncology for systemic therapy', categoryType: 'cancel' },
            ],
        },
    },
];

export const TEMPLATE_CATEGORIES = ['All', 'Orthopedics', 'Neurosurgery', 'General', 'Cardiac', 'Urology'] as const;
export type TemplateCategory = typeof TEMPLATE_CATEGORIES[number];
