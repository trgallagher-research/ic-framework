// Manager results view ("team" tab): what the Director of Education
// Innovation would see about their own team of seven senior experts.

import { h, fill } from '../dom.js';
import { aggregate, MIN_GROUP } from '../scoring.js';
import { comparisonRows, singleValueRows, dotStrip } from '../charts.js';

function mockTag(copy) {
  return h('span', { class: 'small muted mock-tag' }, copy.mockLabel);
}

export async function render(container, ctx, dataset) {
  const { copy, domains, items } = ctx;
  const c = copy.results;
  const cm = c.manager;
  const manager = dataset.manager;

  const teamResponses = dataset.responses.filter((r) => manager.reportIds.includes(r.personId));
  const officeResponses = dataset.responses.filter((r) => r.officeId === 'edu');
  const ibAgg = aggregate(dataset.responses, items.items);
  const teamAgg = aggregate(teamResponses, items.items);
  const officeAgg = aggregate(officeResponses, items.items);

  // Leaders comparison: every manager (by managerId) with >= MIN_GROUP direct
  // respondents, their mean C1 score.
  const byManager = new Map();
  for (const r of dataset.responses) {
    if (!r.managerId) continue;
    if (!byManager.has(r.managerId)) byManager.set(r.managerId, []);
    byManager.get(r.managerId).push(r);
  }
  const leaderPoints = [];
  for (const [mgrId, resps] of byManager) {
    if (resps.length < MIN_GROUP) continue;
    const agg = aggregate(resps, items.items);
    leaderPoints.push({ id: mgrId, value: agg.mean.C1 });
  }

  const banner = h('div', { class: 'panel mock-banner' },
    h('p', { class: 'mock-banner-label' }, copy.mockLabel),
    h('p', { class: 'mock-banner-text' }, copy.results.mockBanner),
  );

  const c1Rows = singleValueRows([
    { label: fill(c.manager.teamBar, { n: teamAgg.n }), value: teamAgg.mean.C1, colorVar: '--tone-c-border' },
    { label: c.officeBaseline, value: officeAgg.mean.C1, colorVar: '--tone-c-border', opacity: 0.45 },
    { label: c.ibBaseline, value: ibAgg.mean.C1, colorVar: '--mark-baseline' },
  ]);

  const c1Section = h('section', { class: 'results-section' },
    h('div', { class: 'results-section-head' }, h('h2', {}, cm.c1Title), mockTag(copy)),
    h('p', { class: 'muted' }, cm.c1Intro),
    c1Rows,
    h('p', { class: 'small muted' }, fill(cm.c1Respondents, { n: teamAgg.n })),

    h('h3', {}, fill(cm.c1Leaders, { min: MIN_GROUP })),
    dotStrip({
      points: leaderPoints,
      ibMean: ibAgg.mean.C1,
      ibLabel: fill(c.compare.ibValue, { value: (ibAgg.mean.C1 ?? 0).toFixed(1) }),
      highlightId: manager.personId,
      axisLabel: fill(cm.c1Leaders, { min: MIN_GROUP }),
    }),
    h('p', { class: 'small muted' }, cm.c1LeadersNote),

    h('h3', {}, cm.practicesTitle),
    h('ul', { class: 'box tone-c results-skill-list' },
      ...(domains.SCALES.C1.skills || []).map((s) => h('li', {}, s)),
    ),
  );

  const teamRows = domains.TEAM.map((id) => {
    const scale = domains.SCALES[id];
    return { id, label: scale.label, explain: scale.explain, value: teamAgg.mean[id] ?? null, ib: ibAgg.mean[id] ?? null, tone: scale.tone };
  });
  const teamChart = comparisonRows(teamRows, {
    compare: c.compare,
    legendValueLabel: c.manager.legendTeam,
    legendIbLabel: c.employee.legendIb,
  });

  const teamSection = h('section', { class: 'results-section' },
    h('div', { class: 'results-section-head' }, h('h2', {}, cm.teamTitle), mockTag(copy)),
    h('p', { class: 'muted' }, cm.teamIntro),
    teamChart,
  );

  let profileBody;
  if (teamAgg.n < MIN_GROUP) {
    profileBody = h('p', { class: 'muted' }, fill(cm.suppressed, { min: MIN_GROUP }));
  } else {
    const profileRows = domains.PROFILE_SCALES.map((id) => {
      const scale = domains.SCALES[id];
      return { id, label: scale.label, explain: scale.explain, value: teamAgg.mean[id] ?? null, ib: ibAgg.mean[id] ?? null, tone: scale.tone };
    });
    profileBody = h('div', {},
      comparisonRows(profileRows, { compare: c.compare, legendValueLabel: c.manager.legendTeam, legendIbLabel: c.employee.legendIb }),
      h('p', { class: 'small muted' }, `n = ${teamAgg.n}`),
    );
  }

  const profileSection = h('section', { class: 'results-section' },
    h('div', { class: 'results-section-head' }, h('h2', {}, cm.profileTitle), mockTag(copy)),
    h('p', { class: 'muted' }, cm.profileIntro),
    profileBody,
  );

  const el = h('div', { class: 'stack results-page' },
    banner,
    h('h1', {}, cm.title),
    h('p', { class: 'lead' }, fill(cm.intro, { min: MIN_GROUP })),
    h('p', { class: 'muted small' }, fill(cm.viewerLine, { name: manager.name, title: manager.title })),
    c1Section,
    teamSection,
    profileSection,
  );

  container.replaceChildren(el);
}
