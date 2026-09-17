// Shell: router + screen mounting.
// Routes:
//   #/                 orientation 1 (the framework)          -- #/about/1 is an alias
//   #/about/2          orientation 2 (how it is measured)
//   #/about/3          orientation 3 (what you are about to do)
//   #/survey/<n>       survey section n (1..13)
//   #/results/you|team|ib
// Any other hash redirects to #/.

import copy from '../content/copy.js';
import * as domains from '../content/domains.js';
import * as store from './store.js';
import { h, clear } from './dom.js';
import * as orientationScreen from './screens/orientation.js';
import * as surveyScreen from './screens/survey.js';

let itemsData = { responseScale: {}, sections: [], items: [] };
let datasetPromise = null;

function navigate(hash) {
  if (location.hash === hash) {
    handleRoute();
  } else {
    location.hash = hash;
  }
}

function preview() {
  const map = store.sampleAnswerMap(itemsData.items, copy);
  store.setAllAnswers(map, { sample: true });
  navigate('#/results/you');
}

// Memoised: fetches the mock params/outputs modules and the generator only once, and only
// when a results screen actually needs them.
function getDataset() {
  if (!datasetPromise) {
    datasetPromise = (async () => {
      const [mockdata, paramsModule, outputsModule] = await Promise.all([
        import('./mockdata.js'),
        import('../data/mock-params.js'),
        import('../content/mock-outputs.js'),
      ]);
      return mockdata.generateDataset(paramsModule.default, itemsData.items, outputsModule.default);
    })();
  }
  return datasetPromise;
}

const ctx = {
  items: itemsData,
  copy,
  domains,
  store,
  navigate,
  getDataset,
  preview,
};

function parseRoute(rawHash) {
  const hash = rawHash || '#/';
  const path = hash.replace(/^#/, '') || '/';

  if (path === '/' || path === '/about/1') {
    return { screen: 'orientation', step: 1 };
  }

  let m = path.match(/^\/about\/([23])$/);
  if (m) return { screen: 'orientation', step: Number(m[1]) };

  m = path.match(/^\/survey\/(\d{1,2})$/);
  if (m) {
    const n = Number(m[1]);
    if (n >= 1 && n <= 13) return { screen: 'survey', n };
  }

  m = path.match(/^\/results\/(you|team|ib)$/);
  if (m) return { screen: 'results', tab: m[1] };

  return { redirect: '#/' };
}

async function handleRoute() {
  const route = parseRoute(location.hash);

  if (route.redirect) {
    if (location.hash !== route.redirect) {
      location.hash = route.redirect;
    }
    return;
  }

  const container = document.getElementById('app');
  clear(container);

  try {
    if (route.screen === 'orientation') {
      await orientationScreen.render(container, ctx, { step: route.step });
    } else if (route.screen === 'survey') {
      await surveyScreen.render(container, ctx, { n: route.n });
    } else if (route.screen === 'results') {
      try {
        const mod = await import('./screens/results.js');
        await mod.render(container, ctx, { tab: route.tab });
      } catch (err) {
        clear(container);
        container.appendChild(
          h('div', { class: 'container stack' },
            h('h1', {}, 'Results are not ready yet'),
            h('p', { class: 'muted' }, 'This part of the prototype has not been built yet.'),
          ),
        );
      }
    }
  } finally {
    const heading = container.querySelector('h1');
    const titleText = (heading && heading.textContent) || copy.siteTitle;
    document.title = `${titleText} – ${copy.siteTitle}`;
    window.scrollTo(0, 0);
    if (heading) {
      heading.setAttribute('tabindex', '-1');
      heading.focus();
    } else {
      container.focus();
    }
  }
}

async function init() {
  const siteTitleEl = document.getElementById('site-title');
  const siteSubtitleEl = document.getElementById('site-subtitle');
  const siteFooterEl = document.getElementById('site-footer');
  if (siteTitleEl) siteTitleEl.textContent = copy.siteTitle;
  if (siteSubtitleEl) siteSubtitleEl.textContent = copy.siteSubtitle;
  if (siteFooterEl) siteFooterEl.textContent = copy.footer;

  try {
    const res = await fetch('./data/items.json');
    itemsData = await res.json();
  } catch (err) {
    itemsData = { responseScale: {}, sections: [], items: [] };
  }
  ctx.items = itemsData;

  window.addEventListener('hashchange', handleRoute);
  await handleRoute();
}

init();
