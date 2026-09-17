// 40 mock proposal outcomes used by the dataset generator (js/mockdata.js).
//
// `title` is a short, sentence-case proposal name. `change` is one
// past-tense line describing what changed once the proposal was in use
// (only surfaced by the generator when a proposal's status is "In use").
// `educational` marks proposals that are plausibly about assessment,
// school support, curriculum, professional learning or research, as
// opposed to internal operations — the generator only picks "In use"
// proposals from educational entries. `novelty` and `horizon` are fixed
// per entry (not drawn at random): the generator selects a combination of
// 12 educational entries whose novelty/horizon tags match
// params.performance.noveltyInUse / horizonInUse exactly, and every other
// proposal simply keeps its own entry's tags.
//
// Across the 40 entries: exactly one is "New to the world" (paired with
// H3 — the closest thing to a moonshot here), a handful are "New to the
// sector", the rest are "New to the IB"; two entries total are H3
// ("genuinely future-facing"), a modest handful are H2 ("extending into
// adjacent programmes/services"), and the rest are H1 ("incremental
// improvements to existing work"). No real product names, no people's
// names, no hype words.

export default [
  // --- Educational: the one "New to the world" / H3 entry -------------------
  {
    title: 'Adaptive on-demand assessment for individual learner pathways',
    change: 'Students in the pilot programmes now sit a short adaptive assessment that adjusts item difficulty in real time, replacing the fixed-form paper test for that cohort.',
    educational: true,
    novelty: 'New to the world',
    horizon: 'H3',
  },

  // --- Educational: "New to the sector" / H2 (3 entries) ---------------------
  {
    title: 'Cross-programme moderation panels for borderline grades',
    change: 'Examiners from more than one programme now sit together on moderation panels for borderline grades, a practice borrowed from other qualification bodies.',
    educational: true,
    novelty: 'New to the sector',
    horizon: 'H2',
  },
  {
    title: 'Shared item-banking platform across programmes',
    change: 'Item writers across the Diploma and Career-related Programmes now draw from one shared item bank instead of maintaining separate item sets per programme.',
    educational: true,
    novelty: 'New to the sector',
    horizon: 'H2',
  },
  {
    title: 'Structured lesson study cycles for professional learning',
    change: 'Participating teachers now run structured lesson study cycles in small groups, a professional learning model adapted from practice used in other education systems.',
    educational: true,
    novelty: 'New to the sector',
    horizon: 'H2',
  },

  // --- Educational: "New to the IB" / H1 (14 entries) -------------------------
  {
    title: 'Rubric calibration tool for examiners',
    change: 'Examiners now calibrate against annotated exemplars before marking, replacing the separate standardisation call.',
    educational: true,
    novelty: 'New to the IB',
    horizon: 'H1',
  },
  {
    title: 'Shared exemplar library for coordinators',
    change: 'Coordinators now pull sample work from one shared library instead of emailing schools individually for examples.',
    educational: true,
    novelty: 'New to the IB',
    horizon: 'H1',
  },
  {
    title: 'Plain-language subject guide summaries',
    change: 'Teachers new to a subject now start from a one-page plain-language summary before opening the full subject guide.',
    educational: true,
    novelty: 'New to the IB',
    horizon: 'H1',
  },
  {
    title: 'Peer review pairing for curriculum drafts',
    change: 'Curriculum writers are now paired for peer review before a draft goes to committee, catching gaps earlier.',
    educational: true,
    novelty: 'New to the IB',
    horizon: 'H1',
  },
  {
    title: 'Shared glossary across subject guides',
    change: 'Subject guides now reference one shared glossary, removing inconsistent definitions of the same term across subjects.',
    educational: true,
    novelty: 'New to the IB',
    horizon: 'H1',
  },
  {
    title: 'Templated feedback for rejected assessment items',
    change: 'Item writers now receive templated, specific feedback on rejected items instead of a single rejected status.',
    educational: true,
    novelty: 'New to the IB',
    horizon: 'H1',
  },
  {
    title: 'Fast-track review lane for minor curriculum edits',
    change: 'Minor wording corrections to curriculum documents now go through a fast-track lane instead of the full review cycle.',
    educational: true,
    novelty: 'New to the IB',
    horizon: 'H1',
  },
  {
    title: 'Office hours for new professional learning facilitators',
    change: 'New facilitators now attend weekly office hours instead of waiting for scheduled formal training sessions.',
    educational: true,
    novelty: 'New to the IB',
    horizon: 'H1',
  },
  {
    title: 'Pre-built agenda templates for school visits',
    change: 'Visiting teams now start from a pre-built agenda template instead of drafting each school visit agenda from scratch.',
    educational: true,
    novelty: 'New to the IB',
    horizon: 'H1',
  },
  {
    title: 'Cohort model for new examiner training',
    change: 'New examiners now train in small cohorts with a named mentor, rather than working through self-paced modules alone.',
    educational: true,
    novelty: 'New to the IB',
    horizon: 'H1',
  },
  {
    title: 'Structured feedback loop for teacher support materials',
    change: 'Teacher support materials are now revised on a structured feedback loop with schools, rather than only when complaints arrive.',
    educational: true,
    novelty: 'New to the IB',
    horizon: 'H1',
  },
  {
    title: 'Structured peer debrief for classroom research studies',
    change: "Researchers now run a structured peer debrief after each classroom study, and the notes feed directly into the next study's design.",
    educational: true,
    novelty: 'New to the IB',
    horizon: 'H1',
  },
  {
    title: 'Shared coding scheme for open-response research data',
    change: "Researchers now code open-response survey data against one shared scheme instead of each study building its own from scratch.",
    educational: true,
    novelty: 'New to the IB',
    horizon: 'H1',
  },
  {
    title: 'Common feedback template for school authorisation visits',
    change: 'Visiting teams now leave schools a common feedback template after an authorisation visit instead of an informal written summary.',
    educational: true,
    novelty: 'New to the IB',
    horizon: 'H1',
  },

  // --- Educational: "New to the IB" / H2 (2 entries) --------------------------
  {
    title: 'Common moderation criteria extended to school-based assessment',
    change: 'Schools now apply the same moderation criteria used for external assessment to their own school-based assessment, closing a gap between the two.',
    educational: true,
    novelty: 'New to the IB',
    horizon: 'H2',
  },
  {
    title: 'Professional learning pathway extended to teaching assistants',
    change: 'Teaching assistants now follow the same structured professional learning pathway that was previously only open to classroom teachers.',
    educational: true,
    novelty: 'New to the IB',
    horizon: 'H2',
  },

  // --- Educational: "New to the IB" / H3, the second future-facing entry -----
  {
    title: 'Multi-year longitudinal study of learner outcomes across programmes',
    change: 'A cohort of students is now tracked across programme transitions to build a longitudinal picture of learner outcomes, the first study of its kind at the IB.',
    educational: true,
    novelty: 'New to the IB',
    horizon: 'H3',
  },

  // --- Internal operations (19 entries) ---------------------------------------
  {
    title: 'Self-service transcript requests',
    change: 'Former students now request transcripts through a self-service form, cutting the usual back-and-forth with the service desk.',
    educational: false,
    novelty: 'New to the IB',
    horizon: 'H1',
  },
  {
    title: 'Early-warning flag for at-risk school authorisation cases',
    change: 'Regional teams now see an early-warning flag on authorisation cases before a visit is even scheduled.',
    educational: false,
    novelty: 'New to the IB',
    horizon: 'H2',
  },
  {
    title: 'Structured onboarding path for new coordinators',
    change: 'New coordinators now follow a structured first-90-days path instead of assembling guidance from separate emails.',
    educational: false,
    novelty: 'New to the IB',
    horizon: 'H1',
  },
  {
    title: 'Common intake form for school enquiries',
    change: 'Prospective schools now submit one common enquiry form that routes automatically to the right regional team.',
    educational: false,
    novelty: 'New to the IB',
    horizon: 'H1',
  },
  {
    title: 'Consolidated dashboard for programme evaluation data',
    change: 'Programme evaluators now check one dashboard instead of combining exports from three separate systems.',
    educational: false,
    novelty: 'New to the IB',
    horizon: 'H2',
  },
  {
    title: 'Standard naming convention for shared drives',
    change: 'Teams across the organisation now file working documents under one shared naming convention, making cross-team search possible.',
    educational: false,
    novelty: 'New to the IB',
    horizon: 'H1',
  },
  {
    title: 'Simplified expense claim workflow',
    change: 'Staff now submit expense claims through a shorter workflow with fewer approval steps for low-value items.',
    educational: false,
    novelty: 'New to the IB',
    horizon: 'H1',
  },
  {
    title: 'Common data dictionary for assessment systems',
    change: 'Assessment teams now refer to one data dictionary, removing mismatched field definitions between systems.',
    educational: false,
    novelty: 'New to the IB',
    horizon: 'H1',
  },
  {
    title: 'Structured handover template for coordinator turnover',
    change: 'Outgoing coordinators now complete a structured handover template, replacing informal notes left for their successor.',
    educational: false,
    novelty: 'New to the IB',
    horizon: 'H1',
  },
  {
    title: 'Automated reminder sequence for overdue school reports',
    change: 'Schools now receive an automated reminder sequence for overdue reports instead of individual follow-up emails.',
    educational: false,
    novelty: 'New to the IB',
    horizon: 'H1',
  },
  {
    title: 'Single sign-on for professional learning platforms',
    change: 'Facilitators and participants now use one login across professional learning platforms instead of separate accounts for each.',
    educational: false,
    novelty: 'New to the IB',
    horizon: 'H1',
  },
  {
    title: 'Shared style guide for external communications',
    change: 'Writers across departments now draft against one shared style guide instead of each team keeping its own version.',
    educational: false,
    novelty: 'New to the IB',
    horizon: 'H1',
  },
  {
    title: 'Structured triage process for support tickets',
    change: 'Incoming support tickets are now triaged against a shared set of criteria before being assigned, cutting misrouted cases.',
    educational: false,
    novelty: 'New to the IB',
    horizon: 'H1',
  },
  {
    title: 'Version-controlled curriculum document repository',
    change: 'Curriculum documents now live in a version-controlled repository, ending the practice of emailing round the latest draft.',
    educational: false,
    novelty: 'New to the IB',
    horizon: 'H1',
  },
  {
    title: 'Shared calendar for regional school events',
    change: 'Regional teams now check one shared calendar of school events instead of maintaining separate spreadsheets.',
    educational: false,
    novelty: 'New to the IB',
    horizon: 'H1',
  },
  {
    title: 'Structured exit interview for departing staff',
    change: 'Departing staff now complete a structured exit interview, and the themes are reviewed quarterly rather than left unread.',
    educational: false,
    novelty: 'New to the IB',
    horizon: 'H1',
  },
  {
    title: 'Common intake checklist for new IT requests',
    change: 'New IT requests now go through a common intake checklist, reducing requests bounced back for missing information.',
    educational: false,
    novelty: 'New to the IB',
    horizon: 'H1',
  },
  {
    title: 'Shared risk register for major projects',
    change: 'Project leads now log risks on one shared register that is reviewed monthly, rather than tracking risks in separate documents.',
    educational: false,
    novelty: 'New to the IB',
    horizon: 'H1',
  },
  {
    title: 'Structured debrief after major conferences',
    change: 'Conference teams now run a structured debrief within a week of each event, and the notes feed directly into planning for the next one.',
    educational: false,
    novelty: 'New to the IB',
    horizon: 'H1',
  },
];
