// Dashboard frame: completeness gate, tab bar, sample-data notice, and
// mounting the active tab's own module.

import { h } from '../dom.js';
import * as employee from './employee.js';
import * as manager from './manager.js';
import * as organisation from './organisation.js';

const TABS = ['you', 'team', 'ib'];
const TAB_MODULES = { you: employee, team: manager, ib: organisation };

function needAnswers(ctx) {
  const c = ctx.copy.results.needAnswers;
  return h('div', { class: 'container stack results-page' },
    h('h1', {}, c.title),
    h('p', { class: 'lead' }, c.text),
    h('div', { class: 'actions' },
      h('button', { class: 'btn', onClick: () => ctx.navigate('#/survey/1') }, ctx.copy.nav.startSurvey),
      h('button', { class: 'btn-secondary', onClick: () => ctx.preview() }, ctx.copy.nav.preview),
    ),
  );
}

function tabBar(ctx, activeTab) {
  const c = ctx.copy.results;
  return h('nav', { class: 'results-tabs', 'aria-label': ctx.copy.results.tabsLabel },
    ...TABS.map((t) => {
      const active = t === activeTab;
      return h('a', {
        href: `#/results/${t}`,
        class: 'results-tab' + (active ? ' active' : ''),
        'aria-current': active ? 'page' : null,
      },
        h('span', { class: 'results-tab-label' }, c.tabs[t]),
        h('span', { class: 'results-tab-hint small muted' }, c.tabHints[t]),
      );
    }),
  );
}

function samplePanel(ctx) {
  const c = ctx.copy.results;
  return h('div', { class: 'panel sample-panel' },
    h('p', { class: 'small' }, c.sampleNotice),
    h('div', { class: 'actions' },
      h('button', { class: 'btn-text', onClick: () => ctx.navigate('#/survey/1') }, ctx.copy.nav.retake),
      h('button', { class: 'btn-text', onClick: () => { ctx.store.clearAnswers(); ctx.navigate('#/'); } }, ctx.copy.nav.restart),
    ),
  );
}

export async function render(container, ctx, { tab }) {
  if (!ctx.store.isComplete(ctx.items.items)) {
    container.replaceChildren(needAnswers(ctx));
    return;
  }

  const frame = h('div', { class: 'container' });
  frame.appendChild(tabBar(ctx, tab));
  if (ctx.store.isSample()) frame.appendChild(samplePanel(ctx));
  const mount = h('div', { class: 'results-tab-body' });
  frame.appendChild(mount);
  container.replaceChildren(frame);

  const dataset = await ctx.getDataset();
  const mod = TAB_MODULES[tab] || employee;
  await mod.render(mount, ctx, dataset);
}
