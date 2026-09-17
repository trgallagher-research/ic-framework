// Employee results view ("you" tab). Always scores the answers currently in
// storage - never cached - so a changed answer set is reflected immediately.

import { h, fill } from '../dom.js';
import { scoreAnswers, aggregate } from '../scoring.js';
import { comparisonRows, compareWord } from '../charts.js';

function pickStrongest(list) {
  return list.reduce((best, cur) => {
    if (!best) return cur;
    if (cur.value > best.value) return cur;
    if (cur.value < best.value) return best;
    if (cur.gap > best.gap) return cur;
    return best;
  }, null);
}

function pickDevelop(list) {
  return list.reduce((worst, cur) => {
    if (!worst) return cur;
    if (cur.value < worst.value) return cur;
    if (cur.value > worst.value) return worst;
    if (cur.gap < worst.gap) return cur;
    return worst;
  }, null);
}

function joinSkills(skills) {
  return skills
    .map((s, i) => (i === 0 ? s : s.charAt(0).toLowerCase() + s.slice(1)))
    .join('; ');
}

function rowsFor(scaleIds, own, ib, domains) {
  return scaleIds.map((id) => {
    const scale = domains.SCALES[id];
    return { id, label: scale.label, explain: scale.explain, value: own[id] ?? null, ib: ib[id] ?? null, tone: scale.tone };
  });
}

export async function render(container, ctx, dataset) {
  const { copy, domains, items, store } = ctx;
  const c = copy.results;
  const ce = c.employee;

  const answers = store.loadAnswers();
  const own = scoreAnswers(answers, items.items);
  const ibAgg = aggregate(dataset.responses, items.items);
  const ib = ibAgg.mean;

  const individual = domains.INDIVIDUAL.map((id) => ({
    id,
    value: own[id] ?? null,
    gap: (own[id] ?? 0) - (ib[id] ?? 0),
  }));

  let strongest = pickStrongest(individual);
  let develop = pickDevelop(individual);
  if (develop && strongest && develop.id === strongest.id) {
    const rest = individual.filter((x) => x.id !== strongest.id);
    develop = pickDevelop(rest);
  }

  const strongestScale = domains.SCALES[strongest.id];
  const developScale = domains.SCALES[develop.id];

  const strongestBox = h('div', { class: 'box tone-a results-callout' },
    h('h2', { class: 'box-title' }, ce.strongestTitle),
    h('p', {}, fill(ce.strongest, { domain: strongestScale.label, explain: strongestScale.explain })),
  );

  const developBox = h('div', { class: 'box tone-neutral results-callout' },
    h('h2', { class: 'box-title' }, ce.developTitle),
    h('p', {}, fill(ce.develop, { domain: developScale.label, explain: developScale.explain })),
    developScale.skills ? h('p', { class: 'small' }, fill(ce.developSkills, { skills: joinSkills(developScale.skills) })) : null,
  );

  const capabilities = comparisonRows(rowsFor(domains.PROFILE_SCALES, own, ib, domains), {
    compare: c.compare,
    legendValueLabel: ce.legendYou,
    legendIbLabel: ce.legendIb,
  });

  const team = comparisonRows(rowsFor(domains.TEAM, own, ib, domains), {
    compare: c.compare,
    legendValueLabel: ce.legendYou,
    legendIbLabel: ce.legendIb,
  });

  const climate = comparisonRows(rowsFor(domains.CLIMATE, own, ib, domains), {
    compare: c.compare,
    legendValueLabel: ce.legendYou,
    legendIbLabel: ce.legendIb,
  });

  const c1word = compareWord(own.C1 ?? null, ib.C1 ?? null, c.compare).rateWord;
  const c2word = compareWord(own.C2 ?? null, ib.C2 ?? null, c.compare).rateWord;

  const el = h('div', { class: 'stack results-page' },
    h('h1', {}, ce.title),
    h('p', { class: 'lead' }, ce.intro),
    h('p', { class: 'muted small' }, c.scaleNote),

    h('div', { class: 'grid-2 results-callouts' }, strongestBox, developBox),

    h('section', { class: 'results-section' },
      h('h2', {}, ce.capabilitiesTitle),
      h('p', { class: 'muted' }, ce.capabilitiesIntro),
      capabilities,
    ),

    h('section', { class: 'results-section' },
      h('h2', {}, ce.teamTitle),
      h('p', { class: 'muted' }, ce.teamIntro),
      team,
    ),

    h('section', { class: 'results-section' },
      h('h2', {}, ce.climateTitle),
      h('p', { class: 'muted' }, ce.climateIntro),
      climate,
      h('p', { class: 'small' }, fill(ce.climateReading, { c1word, c2word })),
    ),
  );

  container.replaceChildren(el);
}
