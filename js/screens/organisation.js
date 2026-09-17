// Organisation results view ("ib" tab): survey results by office, the
// innovation pipeline / performance, and one skills workshop.

import { h, fill } from '../dom.js';
import { aggregate, median, MIN_GROUP } from '../scoring.js';
import { durationStrip, slopeChart, stackedBar, fmtGap } from '../charts.js';
import { performanceSummary } from '../mockdata.js';

// Copy keys the SPEC calls for that do not exist in content/copy.js.
// Kept together here so they are easy to find and swap once real copy exists.

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

function niceMax(values) {
  const top = values.length ? Math.max(...values) : 0;
  if (top <= 30) return 30;
  if (top <= 60) return 60;
  return Math.ceil(top / 30) * 30;
}

function mockTag(copy) {
  return h('span', { class: 'small muted mock-tag' }, copy.mockLabel);
}

function heatClass(gap) {
  const rounded = Math.round(gap * 10) / 10;
  if (rounded === 0) return '';
  const intensity = Math.min(Math.abs(gap) / 0.4, 1);
  const bin = intensity <= 1 / 3 ? 1 : intensity <= 2 / 3 ? 2 : 3;
  return (gap > 0 ? 'heat-pos-' : 'heat-neg-') + bin;
}

export async function render(container, ctx, dataset) {
  const { copy, domains, items } = ctx;
  const c = copy.results;
  const co = c.organisation;
  const { SCALES, PARTS, ALL_SCALES } = domains;

  const banner = h('div', { class: 'panel mock-banner' },
    h('p', { class: 'mock-banner-label' }, copy.mockLabel),
    h('p', { class: 'mock-banner-text' }, c.mockBanner),
  );

  // --- Heat table -----------------------------------------------------------
  // D1 and CC are single-scale groups, so they get an "ordinary" (wider)
  // column to hold their group label; the rest are narrow. This keeps the
  // whole table inside the 1016px content width on desktop, no scrolling.
  const WIDE_SCALES = new Set(['D1', 'CC']);
  const groups = [
    { part: 'A', label: co.heatGroups.A, scales: ['A1', 'A2', 'A3', 'A4', 'A5', 'A6'] },
    { part: 'D', label: co.heatGroups.D, scales: ['D1'] },
    { part: 'CC', label: co.heatGroups.CC, scales: ['CC'] },
    { part: 'B', label: co.heatGroups.B, scales: ['B1', 'B2', 'B3'] },
    { part: 'C', label: co.heatGroups.C, scales: ['C1', 'C2'] },
  ];

  const ibAgg = aggregate(dataset.responses, items.items);

  function heatCell(agg, id) {
    const val = agg.mean[id];
    if (agg.n < MIN_GROUP || val == null) {
      return h('td', { class: 'heat-cell heat-suppressed', title: fill(c.manager.suppressed, { min: MIN_GROUP }) }, '–');
    }
    const gap = val - (ibAgg.mean[id] ?? val);
    const cls = heatClass(gap);
    return h('td', { class: `heat-cell ${cls}` },
      h('div', { class: 'heat-value' }, val.toFixed(1)),
      h('div', { class: 'heat-gap small' }, fmtGap(gap)),
    );
  }

  const colgroup = h('colgroup', {},
    h('col', { class: 'col-name' }),
    h('col', { class: 'col-n' }),
    ...ALL_SCALES.map((id) => h('col', { class: WIDE_SCALES.has(id) ? 'col-wide' : 'col-narrow' })),
  );

  const headRow1 = h('tr', {},
    h('th', { class: 'sticky-col', rowspan: '2' }, ''),
    h('th', { class: 'heat-n-col', rowspan: '2', title: co.respondents }, co.respondentsShort),
    ...groups.map((g) => h('th', { colspan: String(g.scales.length) }, g.label)),
  );
  const headRow2 = h('tr', {}, ...ALL_SCALES.map((id) => h('th', { title: SCALES[id].name }, id)));

  function nameCell(label, n, bold) {
    const text = bold ? h('strong', {}, label) : label;
    return h('td', { class: 'sticky-col' }, text, h('div', { class: 'heat-n-inline small muted' }, `n = ${n}`));
  }

  const ibRow = h('tr', { class: 'heat-row-ib' },
    nameCell(co.ibRow, ibAgg.n, true),
    h('td', { class: 'heat-n-col' }, String(ibAgg.n)),
    ...ALL_SCALES.map((id) => h('td', { class: 'heat-cell' }, h('div', { class: 'heat-value' }, h('strong', {}, (ibAgg.mean[id] ?? 0).toFixed(1))))),
  );

  const officeRows = dataset.offices.map((office) => {
    const responses = dataset.responses.filter((r) => r.officeId === office.id);
    const agg = aggregate(responses, items.items);
    return h('tr', {},
      nameCell(office.name, agg.n, false),
      h('td', { class: 'heat-n-col' }, String(agg.n)),
      ...ALL_SCALES.map((id) => heatCell(agg, id)),
    );
  });

  const heatTable = h('div', { class: 'table-scroll' },
    h('table', { class: 'heat-table' },
      colgroup,
      h('thead', {}, headRow1, headRow2),
      h('tbody', {}, ibRow, ...officeRows),
    ),
  );

  const surveySection = h('section', { class: 'results-section' },
    h('div', { class: 'results-section-head' }, h('h2', {}, co.surveyTitle), mockTag(copy)),
    h('p', { class: 'muted' }, co.surveyIntro),
    h('p', { class: 'small muted heat-scroll-hint' }, co.scrollHint),
    heatTable,
    h('p', { class: 'small muted' }, co.heatLegend),
  );

  // --- Performance ------------------------------------------------------------
  const summary = performanceSummary(dataset.proposals);

  const kpis = h('div', { class: 'kpi-grid' },
    h('div', { class: 'box tone-d kpi-tile' }, h('div', { class: 'small' }, co.kpis.proposals), h('div', { class: 'kpi-number' }, String(summary.total))),
    h('div', { class: 'box tone-d kpi-tile' }, h('div', { class: 'small' }, co.kpis.inUse), h('div', { class: 'kpi-number' }, String(summary.inUse))),
    h('div', { class: 'box tone-d kpi-tile' },
      h('div', { class: 'small' }, co.kpis.timeToDecision),
      h('div', { class: 'kpi-number' }, fill(co.kpis.days, { n: Math.round(summary.medianDaysToDecision) })),
      h('div', { class: 'small muted' }, fill(co.kpis.open, { n: summary.byDecision.awaiting })),
    ),
    h('div', { class: 'box tone-d kpi-tile' },
      h('div', { class: 'small' }, co.kpis.timeToImplement),
      h('div', { class: 'kpi-number' }, fill(co.kpis.days, { n: Math.round(summary.medianDaysToImplement) })),
      h('div', { class: 'small muted' }, fill(co.kpis.open, { n: summary.beingImplemented })),
    ),
  );

  const decisions = stackedBar([
    { label: co.decisionLabels.go, value: summary.byDecision.go, colorVar: '--tone-a-border' },
    { label: co.decisionLabels.stop, value: summary.byDecision.stop, colorVar: '--tone-d-border' },
    { label: co.decisionLabels.park, value: summary.byDecision.park, colorVar: '--tone-b-border' },
    { label: co.decisionLabels.awaiting, value: summary.byDecision.awaiting, colorVar: '--panel-border' },
  ]);

  const decisionsSection = h('div', { class: 'results-subsection' },
    h('h3', {}, co.decisionsTitle),
    decisions,
  );

  const daysToDecisionVals = dataset.proposals.map((p) => p.daysToDecision).filter((v) => v != null);
  const daysToImplementVals = dataset.proposals.map((p) => p.daysToImplement).filter((v) => v != null);
  const decisionMax = niceMax(daysToDecisionVals);
  const implementMax = niceMax(daysToImplementVals);
  const decisionMedian = median(daysToDecisionVals);
  const implementMedian = median(daysToImplementVals);

  const durationsSection = h('div', { class: 'results-subsection' },
    h('h3', {}, co.durationsTitle),
    h('p', { class: 'muted small' }, co.durationsIntro),
    h('p', { class: 'small chart-subhead' }, co.kpis.timeToDecision),
    durationStrip({ values: daysToDecisionVals, max: decisionMax, medianLabel: fill(co.medianDays, { n: Math.round(decisionMedian) }) }),
    h('p', { class: 'small chart-subhead' }, co.kpis.timeToImplement),
    durationStrip({ values: daysToImplementVals, max: implementMax, medianLabel: fill(co.medianDays, { n: Math.round(implementMedian) }) }),
  );

  const inUseProposals = dataset.proposals
    .filter((p) => p.status === 'In use')
    .slice()
    .sort((a, b) => (a.inUse < b.inUse ? 1 : a.inUse > b.inUse ? -1 : 0));

  const oc = co.outputsColumns;
  const outputsTable = h('table', { class: 'outputs-table' },
    h('thead', {}, h('tr', {},
      h('th', {}, oc.title),
      h('th', { class: 'nowrap' }, oc.novelty),
      h('th', { class: 'nowrap' }, oc.horizon),
      h('th', { class: 'nowrap' }, oc.decision),
      h('th', { class: 'nowrap' }, oc.implement),
    )),
    h('tbody', {}, ...inUseProposals.map((p) => h('tr', {},
      h('td', {}, h('div', { class: 'output-title' }, p.title), h('div', { class: 'small muted' }, p.change)),
      h('td', { class: 'nowrap' }, p.novelty),
      h('td', { class: 'nowrap' }, p.horizon),
      h('td', { class: 'nowrap' }, fill(co.kpis.days, { n: p.daysToDecision })),
      h('td', { class: 'nowrap' }, fill(co.kpis.days, { n: p.daysToImplement })),
    ))),
  );

  const outputsCards = h('div', { class: 'output-cards' },
    ...inUseProposals.map((p) => h('div', { class: 'output-card' },
      h('div', { class: 'output-title' }, p.title),
      h('div', { class: 'small muted' }, p.change),
      h('div', { class: 'small output-card-tag' }, fill(co.outputCard, { novelty: p.novelty, horizon: p.horizon, decision: p.daysToDecision, implement: p.daysToImplement })),
    )),
  );

  const outputsSection = h('div', { class: 'results-subsection' },
    h('h3', {}, co.outputsTitle),
    outputsTable,
    outputsCards,
  );

  const selfReported = h('p', { class: 'small' }, fill(co.selfReported, { score: (ibAgg.mean.D1 ?? 0).toFixed(1), n: ibAgg.n }));

  const pipelineRows = dataset.proposals
    .slice()
    .sort((a, b) => (a.submitted < b.submitted ? 1 : a.submitted > b.submitted ? -1 : 0))
    .map((p) => {
      const office = dataset.offices.find((o) => o.id === p.officeId);
      return h('tr', {},
        h('td', {}, p.title),
        h('td', {}, office ? office.name : ''),
        h('td', {}, p.status),
        h('td', {}, formatDate(p.submitted)),
        h('td', {}, p.novelty),
        h('td', {}, p.horizon),
      );
    });

  const pipeline = h('details', { class: 'results-details' },
    h('summary', {}, `${co.pipelineTitle} (${dataset.proposals.length})`),
    h('div', { class: 'table-scroll' },
      h('table', { class: 'pipeline-table' },
        h('thead', {}, h('tr', {},
          h('th', {}, oc.title), h('th', {}, co.pipelineColumns.office), h('th', {}, co.pipelineColumns.status),
          h('th', {}, co.pipelineColumns.submitted), h('th', {}, oc.novelty), h('th', {}, oc.horizon),
        )),
        h('tbody', {}, ...pipelineRows),
      ),
    ),
  );

  const performanceSection = h('section', { class: 'results-section' },
    h('div', { class: 'results-section-head' }, h('h2', {}, co.performanceTitle), mockTag(copy)),
    h('p', { class: 'muted' }, co.performanceIntro),
    kpis,
    decisionsSection,
    durationsSection,
    outputsSection,
    selfReported,
    pipeline,
  );

  // --- Skills workshop --------------------------------------------------------
  const participants = dataset.workshop.participants;
  const avg = (key) => participants.reduce((s, p) => s + p[key], 0) / participants.length;
  const preMean = avg('pre');
  const postMean = avg('post');
  const followMean = avg('followUp');
  const usedCount = participants.filter((p) => p.usedSince).length;

  const points = [
    { key: 'pre', label: co.skillsPoints.pre },
    { key: 'post', label: co.skillsPoints.post },
    { key: 'followUp', label: co.skillsPoints.followUp },
  ];

  const slope = slopeChart({ points, participants, means: { pre: preMean, post: postMean, followUp: followMean } });

  const skillsSection = h('section', { class: 'results-section' },
    h('div', { class: 'results-section-head' }, h('h2', {}, co.skillsTitle), mockTag(copy)),
    h('p', { class: 'muted' }, co.skillsIntro),
    h('div', { class: 'skills-chart-row' },
      h('div', { class: 'skills-chart' }, slope),
      h('div', { class: 'box tone-skill skills-side' }, fill(co.skillsUsed, { used: usedCount, total: participants.length })),
    ),
    h('p', { class: 'small' }, fill(co.skillsPreToPost, { pre: preMean.toFixed(1), post: postMean.toFixed(1) })),
    h('p', { class: 'small' }, fill(co.skillsPreToFollow, { follow: followMean.toFixed(1), used: usedCount, total: participants.length })),
    h('figure', { class: 'results-figure' },
      h('img', { src: './assets/img/figure-3-skill-assessment.png', alt: co.figureCaption, width: '100%' }),
      h('figcaption', { class: 'small muted' }, co.figureCaption),
    ),
  );

  const el = h('div', { class: 'stack results-page' },
    banner,
    h('h1', {}, co.title),
    h('p', { class: 'lead' }, co.intro),
    surveySection,
    performanceSection,
    skillsSection,
  );

  container.replaceChildren(el);
}
