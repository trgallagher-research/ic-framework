// The three orientation screens: #/ (about/1), #/about/2, #/about/3.
import { h, fill } from '../dom.js';

function box(id, name, tone) {
  return h('div', { class: `box tone-${tone}` }, `${id} ${name}`.trim());
}

function panel(part, boxesEl, extraClass) {
  return h('div', { class: `panel fig-panel${extraClass ? ' ' + extraClass : ''}` },
    h('h2', { class: 'fig-panel-title' }, `${part.key} ${part.name}`),
    h('p', { class: 'muted small fig-panel-tagline' }, part.tagline),
    boxesEl,
  );
}

// Figure 1: the framework, built from domains.PARTS / domains.SCALES / domains.INDICATORS.
function renderFigure1(domains) {
  const { PARTS, SCALES, INDICATORS } = domains;

  const aBoxes = h('div', { class: 'fig-boxes-grid-2' },
    ['A1', 'A2', 'A3', 'A4', 'A5', 'A6'].map((id) => box(id, SCALES[id].name, SCALES[id].tone)),
  );
  const bBoxes = h('div', { class: 'fig-boxes-stack' },
    ['B1', 'B2', 'B3'].map((id) => box(id, SCALES[id].name, SCALES[id].tone)),
  );
  const cBoxes = h('div', { class: 'fig-boxes-grid-2' },
    ['C1', 'C2'].map((id) => box(id, SCALES[id].name, SCALES[id].tone)),
  );
  const dBoxes = h('div', { class: 'fig-boxes-grid-3' },
    ['D1', 'D2', 'D3'].map((id) => box(id, INDICATORS[id].name, PARTS.D.tone)),
  );

  return h('figure', { class: 'figure figure-1' },
    h('figcaption', { class: 'visually-hidden' }, 'The innovation capability framework'),
    h('div', { class: 'fig-rows' },
      h('div', { class: 'fig-row fig-row-top' },
        panel(PARTS.A, aBoxes, 'fig-panel-a'),
        panel(PARTS.B, bBoxes, 'fig-panel-b'),
      ),
      h('div', { class: 'fig-row' }, panel(PARTS.C, cBoxes, 'fig-panel-c')),
      h('div', { class: 'fig-row' }, panel(PARTS.D, dBoxes, 'fig-panel-d')),
    ),
  );
}

// Figure 2: how it is measured. Sourced from copy.orientation[1].sources (three panels).
function renderFigure2(copy) {
  const sources = copy.orientation[1].sources;

  const panels = sources.map((source) => h('div', { class: 'panel fig-panel' },
    h('h2', { class: 'fig-panel-title' }, source.title),
    h('p', { class: 'muted small fig-panel-tagline' }, source.subtitle),
    h('div', { class: 'fig-boxes-stack' },
      source.boxes.map((b) => h('div', { class: `box tone-${b.tone}` },
        h('div', { class: 'box-text' }, b.text),
        b.note ? h('div', { class: 'box-note small muted' }, b.note) : null,
      )),
    ),
    h('p', { class: 'fig-source-text' }, source.text),
  ));

  return h('figure', { class: 'figure figure-2' },
    h('figcaption', { class: 'visually-hidden' }, copy.orientation[1].title),
    h('div', { class: 'fig-row fig-row-3' }, panels),
  );
}

function renderSteps(steps) {
  return h('div', { class: 'grid-2' },
    steps.map((step, i) => h('div', { class: 'cluster step-item' },
      h('div', { class: 'box tone-a step-number' }, String(i + 1)),
      h('div', { class: 'step-body' },
        h('h3', {}, step.title),
        h('p', {}, step.text),
      ),
    )),
  );
}

function renderActions(step, ctx) {
  const { copy, navigate, preview, store } = ctx;

  const primaryHash = step === 1 ? '#/about/2' : (step === 2 ? '#/about/3' : '#/survey/1');
  const primaryLabel = step === 3 ? copy.nav.startSurvey : copy.nav.next;
  const backHash = step === 3 ? '#/about/2' : (step === 2 ? '#/' : null);

  const buttons = [];
  if (backHash) {
    buttons.push(h('button', { type: 'button', class: 'btn-text', onclick: () => navigate(backHash) }, copy.nav.back));
  }
  buttons.push(h('button', { type: 'button', class: 'btn', onclick: () => navigate(primaryHash) }, primaryLabel));

  const rows = [h('div', { class: 'actions' }, buttons)];

  if (step === 1 || step === 3) {
    rows.push(h('div', { class: 'cluster preview-cluster' },
      h('button', { type: 'button', class: 'btn-secondary', onclick: () => preview() }, copy.nav.preview),
      h('span', { class: 'muted small' }, copy.nav.previewHint),
    ));
  }

  if (step === 3) {
    const answers = store.loadAnswers();
    if (Object.keys(answers).length > 0) {
      rows.push(h('div', { class: 'actions' },
        h('button', { type: 'button', class: 'btn-secondary', onclick: () => navigate('#/results/you') }, copy.survey.finish),
      ));
    }
  }

  return h('div', { class: 'stack orientation-actions' }, rows);
}

export async function render(container, ctx, { step }) {
  const { copy, domains } = ctx;
  const data = copy.orientation[step - 1];

  const wrap = h('div', { class: 'container stack orientation-screen' });

  wrap.append(
    h('p', { class: 'muted small step-of' }, fill(copy.nav.stepOf, { n: step, total: 3 })),
    h('h1', {}, data.title),
    h('p', { class: 'lead' }, data.lead),
  );

  if (step === 1) {
    wrap.appendChild(renderFigure1(domains));
    for (const para of data.body) {
      wrap.appendChild(h('p', {}, para));
    }
  } else if (step === 2) {
    wrap.appendChild(renderFigure2(copy));
  } else if (step === 3) {
    wrap.appendChild(renderSteps(data.steps));
    wrap.appendChild(h('div', { class: 'panel' }, h('p', { class: 'role-text' }, data.role)));
    wrap.appendChild(h('p', { class: 'muted small' }, data.privacy));
  }

  wrap.appendChild(renderActions(step, ctx));

  container.appendChild(wrap);
}
