// The framework's four parts and thirteen scored scales.
// Names, skills, practices, definitions and "why it matters" text are taken from
// Draft_Innovation_Capability_Framework-v02.docx. The one-line `explain` text is written for
// the employee profile and can be edited freely.

export const PARTS = {
  A: {
    key: 'A',
    name: 'Innovation capabilities (individual)',
    shortName: 'Individual capabilities',
    tagline: 'What a person does when innovating',
    description: 'Six domains describing what a person does when innovating. These are things individuals can do and get better at.',
    tone: 'a',
  },
  B: {
    key: 'B',
    name: 'Innovation capabilities (team)',
    shortName: 'Team capabilities',
    tagline: 'How a team works with ideas together',
    description: 'Three collective capabilities that distinguish teams able to innovate repeatedly. A group of capable individuals can still smother disagreement, over-plan or settle every choice by seniority.',
    tone: 'b',
  },
  C: {
    key: 'C',
    name: 'Innovation climate',
    shortName: 'Innovation climate',
    tagline: 'The conditions the capabilities operate within',
    description: 'The conditions that managers and the IB provide. Climate is something people receive or operate within rather than do, measured for the manager a person reports to and for the IB as a whole.',
    tone: 'c',
  },
  D: {
    key: 'D',
    name: 'Innovation performance',
    shortName: 'Innovation performance',
    tagline: 'What comes of it',
    description: 'Evidence of innovation happening in practice: which ideas are acted on, and how long they take to be decided on and implemented. An idea counts once it is in use.',
    tone: 'd',
  },
};

export const SCALES = {
  A1: {
    id: 'A1', part: 'A', name: 'Generating ideas', about: 'self', tone: 'a',
    explain: 'Coming up with new ways of doing things, especially when something is not working.',
    skills: ['Reframing a problem', 'Structured ideation'],
    why: 'Innovation starts with a new idea; generating ideas is one of the two building blocks of innovation, the other being implementation.',
  },
  A2: {
    id: 'A2', part: 'A', name: 'Searching for ideas', about: 'self', tone: 'a',
    explain: 'Looking for ideas that already work elsewhere and bringing them into your own work.',
    skills: ['Discovery interviews', 'Learning from the people closest to a problem', 'Scanning outside the IB for what already works'],
    why: 'Innovation can start by finding ideas rather than inventing them; searching for ideas is a valid route into innovation.',
  },
  A3: {
    id: 'A3', part: 'A', name: 'Communicating ideas', about: 'self', tone: 'a',
    explain: 'Taking a new idea to colleagues and to your manager, to test it and win support.',
    skills: ['Testing an idea early with colleagues', 'Making the case to a decision maker'],
    why: 'Employees can rarely implement ideas alone and usually need permission, so communicating an idea to colleagues and managers for feedback is a distinct step.',
  },
  A4: {
    id: 'A4', part: 'A', name: 'Starting implementation', about: 'self', tone: 'a',
    explain: 'Turning an approved idea into a plan, a schedule and the resources to deliver it.',
    skills: ['Writing a scoping document', 'Prototyping before committing', 'Securing resources'],
    why: 'Once an idea is approved, time, money and people have to be allocated; implementation starts with plans, anticipated problems and secured resources.',
  },
  A5: {
    id: 'A5', part: 'A', name: 'Involving others', about: 'self', tone: 'a',
    explain: 'Bringing in the people who can decide, solve problems and push an idea through.',
    skills: ['Mapping who has to say yes', 'Getting the first meeting', 'Co-designing with the people an idea affects'],
    why: 'Innovation is social; others have to be persuaded of an idea’s value and their help mobilised to implement it.',
  },
  A6: {
    id: 'A6', part: 'A', name: 'Persisting through obstacles', about: 'self', tone: 'a',
    explain: 'Keeping an idea moving when it meets obstacles or resistance, until it is in use.',
    skills: ['Designing a test that can fail cheaply', 'Documenting what a failed prototype taught'],
    why: 'The central challenge of implementation is overcoming obstacles and resistance, done by adapting the idea or the plan in response to what happens, until it is in use.',
  },
  D1: {
    id: 'D1', part: 'D', name: 'Innovation outputs', about: 'self', tone: 'd',
    explain: 'How far your own ideas have been put into practice and are in use.',
    skills: null,
    why: 'Proposals that have been implemented and are in use, having changed a product, a service or a process.',
  },
  CC: {
    id: 'CC', part: 'A', name: 'Co-creation', about: 'self', tone: 'neutral',
    explain: 'Developing and testing ideas together with the people who will use them.',
    skills: null,
    why: 'Co-creation is not a separate domain; it appears as a practice under A2, A5 and C1, and is reported as its own cluster.',
  },
  B1: {
    id: 'B1', part: 'B', name: 'Creative abrasion', about: 'team', tone: 'b',
    explain: 'Your team produces a range of ideas through open disagreement, without it becoming personal.',
    skills: null,
    why: 'A team’s ability to produce a range of ideas through open disagreement and debate, without the debate becoming personal.',
  },
  B2: {
    id: 'B2', part: 'B', name: 'Creative agility', about: 'team', tone: 'b',
    explain: 'Your team tests ideas quickly through small experiments, learns and adjusts.',
    skills: null,
    why: 'A team’s ability to test ideas quickly through small experiments, learn from the results and adjust.',
  },
  B3: {
    id: 'B3', part: 'B', name: 'Creative resolution', about: 'team', tone: 'b',
    explain: 'Your team makes decisions that combine ideas instead of letting one view win.',
    skills: null,
    why: 'A team’s ability to make decisions that combine ideas, including opposing ones, instead of letting one view win or settling on a weak compromise.',
  },
  C1: {
    id: 'C1', part: 'C', name: 'Conditions the manager creates', about: 'manager', tone: 'c',
    explain: 'How far your manager invites, recognises and backs new ideas.',
    skills: ['Inviting unfinished ideas', 'Recognising good ideas', 'Protecting time and resources', 'Tolerating visible failure', 'Securing support beyond the department', 'Bringing problems rather than solutions, to leave room for co-design'],
    why: 'The manager is the closest and strongest influence on whether people innovate: the nearest signal that new ideas are wanted and will be backed, and the route by which the organisation\'s support reaches people.',
  },
  C2: {
    id: 'C2', part: 'C', name: 'Conditions the organisation creates', about: 'organisation', tone: 'c',
    explain: 'How far the IB recognises, resources and makes time for new ideas.',
    skills: ['Recognising new ideas in how people are rewarded', 'Setting aside resources for implementing them', 'Giving people time to put them into practice'],
    why: 'People innovate when they can see the organisation will recognise, resource and make time for new ideas; a manager can only back what the organisation is prepared to back.',
  },
};

// Performance indicators measured from pipeline records, not the survey.
export const INDICATORS = {
  D1: { id: 'D1', name: 'Innovation outputs', definition: 'Proposals that have been implemented and are in use, having changed a product, a service or a process.' },
  D2: { id: 'D2', name: 'Time to decision', definition: 'The time between a proposal being submitted and a decision on it being recorded, whether go, stop or park.' },
  D3: { id: 'D3', name: 'Time to implement', definition: 'The time between a go decision and the proposed change being in use.' },
};

for (const s of Object.values(SCALES)) s.label = `${s.id === 'CC' ? '' : s.id + ' '}${s.name}`;

export const INDIVIDUAL = ['A1', 'A2', 'A3', 'A4', 'A5', 'A6'];
export const PROFILE_SCALES = ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'D1', 'CC'];
export const TEAM = ['B1', 'B2', 'B3'];
export const CLIMATE = ['C1', 'C2'];
export const SURVEY_ORDER = ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'D1', 'C1', 'C2', 'CC', 'B1', 'B2', 'B3'];
export const ALL_SCALES = ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'D1', 'CC', 'B1', 'B2', 'B3', 'C1', 'C2'];
