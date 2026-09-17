// Every number and list used by the mock data generator (js/mockdata.js) lives here.
// Nothing tunable should be hard-coded in mockdata.js — change values here instead.
// Written to be readable by a non-programmer: each group is commented in plain terms.

export default {
  // --- Reproducibility -----------------------------------------------------
  // The single seed that drives every random draw in the dataset, and the
  // "as of" date the generator treats as "today" when building dates.
  seed: 20260917,
  asOf: '2026-09-17',

  // Share of each office's headcount who are assumed to have completed the
  // survey (before Education Innovation is force-included — see mockdata.js).
  responseRate: 0.55,

  // --- Organisation structure ------------------------------------------------
  // One entry per office. `headcount` is the total number of people in that
  // office, including its chief and directors. `departments` lists the
  // department names in that office, in display order. The Director
  // General's office has no departments (dg staff report straight to the DG).
  offices: [
    {
      id: 'ao',
      name: 'Assessment & Operations',
      headcount: 190,
      departments: [
        'Assessments',
        'Conferences',
        'Customer Service & Travel',
        'IBEN',
        'Multilingual Editorial Production',
        'Professional Learning Delivery',
        'Quality & Planning',
      ],
    },
    {
      id: 'cpd',
      name: 'Community Partnerships & Development',
      headcount: 220,
      departments: [
        'Africa, Europe, Middle East & Canada',
        'Asia Pacific',
        'Latin America, Spain & Portugal',
        'USA',
        'Insights & Solutions',
        'Communications & Marketing',
        'Stakeholder Success',
        'Systems Consultancy',
        'Youth',
      ],
    },
    {
      id: 'dd',
      name: 'Digital & Data',
      headcount: 200,
      departments: [
        'AI',
        'Capabilities Transformation',
        'Data',
        'Digital Portfolio, Transformation & Partnerships',
        'Innovation',
        'Product Engineering',
        'Product Management',
        'UX',
        'IT',
      ],
    },
    {
      id: 'edu',
      name: 'Education',
      headcount: 150,
      departments: [
        'Curriculum Development',
        'Education Innovation',
        'Education Design & Development',
        'Research',
        'School System Design',
        'Student Learning Design',
      ],
    },
    {
      id: 'sp',
      name: 'Strategy & People',
      headcount: 70,
      departments: [
        'Internal Communications',
        'Legal & Compliance',
        'Opportunity & Belonging',
        'People (HR)',
        'Privacy',
        'Secretariat',
        'Strategy Development & Delivery',
      ],
    },
    {
      id: 'fin',
      name: 'Finance',
      headcount: 70,
      departments: [
        'Finance Planning & Reporting',
        'Finance Operations',
        'Financial Accounting & Tax',
        'Risk & Internal Audit',
        'Facilities',
      ],
    },
    {
      id: 'dg',
      name: "Director General's office",
      headcount: 10,
      departments: [], // no departments; everyone reports directly to the DG
    },
  ],

  // Teams (below director level) are sized within this range, people per team.
  teamSize: { min: 6, max: 15 },

  // --- Survey scale targets --------------------------------------------------
  // The population mean and standard deviation the generator aims for on each
  // of the 13 scales, before office/manager effects and item-level noise.
  scales: {
    A1: { mean: 4.0, sd: 0.6 },
    A2: { mean: 4.1, sd: 0.7 },
    A3: { mean: 4.0, sd: 0.6 },
    A4: { mean: 3.2, sd: 0.8 },
    A5: { mean: 3.9, sd: 0.7 },
    A6: { mean: 3.7, sd: 0.8 },
    D1: { mean: 3.4, sd: 0.9 },
    C1: { mean: 3.5, sd: 0.8 },
    C2: { mean: 3.0, sd: 0.9 },
    B1: { mean: 3.6, sd: 0.7 },
    B2: { mean: 3.6, sd: 0.7 },
    B3: { mean: 3.6, sd: 0.7 },
    CC: { mean: 3.5, sd: 0.8 },
  },

  // How much noise is added when turning a person's "true" (latent) scale
  // score into each individual item answer. Item score =
  // round(clamp(latent + normal(0, itemNoiseSd), 1, 5)).
  itemNoiseSd: 0.55,

  // Each office gets its own small nudge (up or down) on every one of the 13
  // scales, drawn once per office per scale, uniformly within ±officeEffectMax.
  officeEffectMax: 0.2,

  // Each manager gets their own small nudge on how their direct reports rate
  // the manager- and team-related scales (C1, B1, B2, B3), drawn once per
  // manager per scale, uniformly within ±managerEffectMax.
  managerEffectMax: 0.3,

  // Extra fixed adjustment applied only to the Education Innovation team's
  // senior experts, on top of the office effect, to make that team visibly
  // different from the rest of the IB on these scales.
  educationInnovationAdjust: {
    A2: 0.25,
    A5: 0.25,
    CC: 0.3,
    C2: -0.25,
  },

  // --- Proposals / performance data ------------------------------------------
  performance: {
    proposals: 40,
    // Window within which every proposal's submission date must fall.
    submissionWindow: { start: '2025-09-01', end: '2026-08-31' },
    // How the 40 proposals split by outcome. Must sum to `proposals`.
    counts: { go: 17, stop: 13, park: 7, awaitingDecision: 3 },
    // Of the 17 "go" proposals, how many have reached each stage.
    // inUse + beingImplemented = counts.go.
    goStages: { inUse: 12, beingImplemented: 5 },
    // Time from submission to decision, in days (lognormal draw, then floored
    // at the minimum).
    // The drawn median is not the reported one: dates are fitted into the window, which shifts it.
    // With this seed, 24 here reports as a median of 31 days. Re-check with scripts/mock-summary.mjs.
    daysToDecision: { median: 24, sigma: 0.55, min: 5 },
    // Time from decision to being in use, in days (lognormal draw, then
    // floored at the minimum).
    daysToImplement: { median: 120, sigma: 0.5, min: 20 },
    // Novelty and horizon are no longer drawn at random: every proposal's
    // novelty/horizon comes straight from its catalogue entry
    // (content/mock-outputs.js). These counts are targets the generator
    // searches for when it picks which 12 catalogue entries (all tagged
    // `educational: true`) become the "In use" proposals — it selects a
    // combination whose novelty and horizon tags match these totals exactly.
    // Every other proposal simply keeps whatever tags its catalogue entry
    // carries.
    noveltyInUse: { 'New to the IB': 9, 'New to the sector': 2, 'New to the world': 1 },
    horizonInUse: { H1: 8, H2: 3, H3: 1 },
  },

  // --- Workshop data -----------------------------------------------------
  workshop: {
    title: 'Discovery interviews',
    date: '2026-05-12',
    followUpDate: '2026-08-12',
    participants: 14,
    // Target group-mean scores (1-5) the generator aims to hit exactly once
    // rounded to one decimal (round(target * participants) is the exact sum
    // of individual 1-5 scores across all participants).
    targetMeans: { pre: 2.8, post: 4.1, followUp: 3.6 },
    // Plausible ranges for each set of scores. `pre` mostly sits in
    // [min, max] with at most one participant allowed one point below that
    // (i.e. at most one 1, since min is 2) for realism. `post` must be at
    // least as high as that same participant's `pre` score, in addition to
    // sitting in its own range. `followUp` must be no higher than that same
    // participant's `post` score, in addition to sitting in its own range.
    preRange: { min: 2, max: 4 },
    postRange: { min: 3, max: 5 },
    followUpRange: { min: 2, max: 5 },
    // Of the 14 participants, exactly this many say they have used the skill
    // since the workshop (usedSince = true); those participants average a
    // higher follow-up score than the rest.
    usedSince: 9,
    item: 'How confident are you that you could run a discovery interview and come away with findings you could act on?',
    followUpItem: 'Have you run a discovery interview since the workshop?',
  },

  // --- Synthetic names -----------------------------------------------------
  // Pools the generator draws from (without replacement) to build unique
  // full names for all 910 people. Internationally diverse; none are the
  // names of well-known real people.
  names: {
    firstNames: [
      'Amara', 'Kenji', 'Sofía', 'Lars', 'Priya', 'Mateus', 'Ines', 'Tomasz', 'Yara', 'Olumide',
      'Noor', 'Chidi', 'Aiko', 'Farid', 'Ingrid', 'Rosa', 'Dimitri', 'Fatima', 'Hassan', 'Mei',
      'Sven', 'Zainab', 'Kwame', 'Luca', 'Anjali', 'Boris', 'Camille', 'Diego', 'Elif', 'Femi',
      'Grace', 'Hana', 'Ivan', 'Jamila', 'Kaito', 'Leila', 'Mihail', 'Naledi', 'Oscar', 'Paloma',
      'Quang', 'Ravi', 'Sana', 'Thabo', 'Uma', 'Viktor', 'Wanjiru', 'Xiomara', 'Yusuf', 'Zara',
      'Aditi', 'Bjorn', 'Chiara', 'Dara', 'Esperanza', 'Felipe', 'Gita', 'Hiroshi', 'Isabela', 'Jonas',
      'Kasimir', 'Lucía', 'Mansour', 'Nadia', 'Ola', 'Petra', 'Qadir', 'Rania', 'Santiago', 'Tariq',
      'Ulla', 'Valentina', 'Wei', 'Xavier', 'Yelena', 'Zoran', 'Abebe', 'Bianca', 'Cosmin', 'Delphine',
      'Ebele', 'Freya', 'Gustav', 'Halima',
    ],
    lastNames: [
      'Okafor', 'Nakamura', 'Silva', 'Andersson', 'Kowalski', 'Haddad', 'Ibrahim', 'Novak', 'Santos', 'Mensah',
      'Petrov', 'Fernandes', 'Larsen', 'Osei', 'Choudhury', 'Botha', 'Herrera', 'Nystrom', 'Diallo', 'Costa',
      'Weber', 'Abara', 'Kimura', 'Vargas', 'Nowak', 'Adeyemi', 'Baptiste', 'Cohen', 'Dubois', 'Ekwueme',
      'Falk', 'Garcia', 'Halvorsen', 'Ionescu', 'Jansen', 'Karimi', 'Lindqvist', 'Moreno', 'Ndiaye', 'Odhiambo',
      'Perreira', 'Qureshi', 'Rossi', 'Sundaram', 'Tanaka', 'Umeh', 'Vasquez', 'Wojcik', 'Xu', 'Yamamoto',
      'Zeleke', 'Aabo', 'Berger', 'Castillo', 'Duarte', 'Eriksson', 'Fischer', 'Gomez', 'Holm', 'Ivanov',
      'Jaramillo', 'Kallas', 'Lund', 'Mbeki', 'Nilsson', 'Ortega', 'Pham', 'Quinones', 'Ramirez', 'Steiner',
      'Tessema', 'Ulyanov', 'Valdez', 'Winter', 'Xiong', 'Yilmaz', 'Zubair', 'Amaro', 'Bekker', 'Carvalho',
      'Dahl', 'Endo', 'Farrukh',
    ],
  },
};
