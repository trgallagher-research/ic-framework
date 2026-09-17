// Survey screens: #/survey/<n>, n = 1..13. Sections are in document order
// (items.sections, same order as domains.SURVEY_ORDER).
import { h, fill } from '../dom.js';

function toneBoxText(scale, domains) {
  const part = domains.PARTS[scale.part];
  return `${part.key} ${part.shortName}`;
}

// One item's five-button radiogroup. Owns its own DOM/state so answering it never triggers a
// full-screen re-render (keeps scroll position).
function createAnswerGroup(item, currentValue, ctx, onAnswered) {
  let value = currentValue;
  const buttons = [];

  function paint() {
    buttons.forEach((btn, idx) => {
      const v = idx + 1;
      const selected = value === v;
      btn.setAttribute('aria-checked', selected ? 'true' : 'false');
      btn.classList.toggle('selected', selected);
      const focusable = value ? selected : v === 1;
      btn.setAttribute('tabindex', focusable ? '0' : '-1');
    });
  }

  function select(v, { focus = false } = {}) {
    value = v;
    ctx.store.saveAnswer(item.id, v);
    paint();
    if (focus) buttons[v - 1].focus();
    onAnswered();
  }

  for (let v = 1; v <= 5; v += 1) {
    const btn = h('button', {
      type: 'button',
      role: 'radio',
      class: 'answer-btn',
      text: String(v),
      onclick: () => select(v),
      onkeydown: (e) => {
        let next = null;
        if (e.key === 'ArrowRight') next = Math.min(5, v + 1);
        else if (e.key === 'ArrowLeft') next = Math.max(1, v - 1);
        else if (e.key === 'Home') next = 1;
        else if (e.key === 'End') next = 5;
        if (next != null && next !== v) {
          e.preventDefault();
          select(next, { focus: true });
        }
      },
    });
    buttons.push(btn);
  }
  paint();

  const group = h('div', { class: 'radiogroup', role: 'radiogroup', 'aria-label': item.text }, buttons);
  return { group, isAnswered: () => value != null };
}

function createItemRow(item, currentValue, ctx, onAnswered) {
  const { group, isAnswered } = createAnswerGroup(item, currentValue, ctx, onAnswered);
  const labels = h('div', { class: 'cluster answer-scale-labels' },
    h('span', { class: 'muted small' }, ctx.copy.survey.minLabel),
    h('span', { class: 'muted small' }, ctx.copy.survey.maxLabel),
  );
  const answerCol = h('div', { class: 'survey-item-answer' }, group, labels);
  const textEl = h('p', { class: 'survey-item-text' }, item.text);
  const row = h('div', { class: 'survey-item-grid' }, textEl, answerCol);
  const li = h('li', { class: 'survey-item' }, row);
  return { li, group, isAnswered };
}

export async function render(container, ctx, { n }) {
  const { items, copy, domains, store, navigate, preview } = ctx;
  const total = items.sections.length;
  const section = items.sections[n - 1];
  const scale = domains.SCALES[section.scale];
  const sectionItems = items.items.filter((it) => it.scale === section.scale);
  const initialAnswers = store.loadAnswers();

  const wrap = h('div', { class: `container stack survey-screen tone-${scale.tone}` });

  // Progress bar + text, plus the preview shortcut, sit at the top of the survey card.
  const progressFill = h('div', { class: 'progress-fill' });
  const progressTrack = h('div', { class: 'progress-track' }, progressFill);
  const progressText = h('p', { class: 'muted small progress-text' });

  function updateProgress() {
    const answers = store.loadAnswers();
    const answered = items.items.filter((it) => answers[it.id] != null).length;
    const pct = items.items.length ? Math.round((answered / items.items.length) * 100) : 0;
    progressFill.setAttribute('style', `width:${pct}%`);
    progressText.textContent = fill(copy.survey.progress, { answered, total: items.items.length });
  }

  const topRow = h('div', { class: 'survey-top-row' },
    h('div', { class: 'progress-wrap' }, progressTrack, progressText),
    h('button', { type: 'button', class: 'btn-text', onclick: () => preview() }, copy.nav.preview),
  );

  const sectionOfLine = h('p', { class: 'muted small' }, fill(copy.survey.sectionOf, { n, total }));
  const tag = h('div', { class: `box tone-${scale.tone} box-tag` }, toneBoxText(scale, domains));
  const heading = h('h1', {}, scale.name);
  const aboutLine = h('p', { class: 'muted' }, copy.survey.about[scale.about]);

  const list = h('ol', { class: 'survey-items' });
  const itemRows = sectionItems.map((item) => {
    const row = createItemRow(item, initialAnswers[item.id], ctx, updateProgress);
    list.appendChild(row.li);
    return row;
  });

  const incompleteMsg = h('p', { class: 'incomplete-message', 'aria-live': 'polite' });

  const backHash = n === 1 ? '#/about/3' : `#/survey/${n - 1}`;
  const nextLabel = n === 13 ? copy.survey.finish : copy.survey.next;

  function goNext() {
    const allAnswered = itemRows.every((row) => row.isAnswered());
    if (!allAnswered) {
      incompleteMsg.textContent = copy.survey.incomplete;
      const firstUnanswered = itemRows.find((row) => !row.isAnswered());
      if (firstUnanswered) {
        const firstRadio = firstUnanswered.group.querySelector('[role="radio"]');
        if (firstRadio) firstRadio.focus();
      }
      return;
    }
    incompleteMsg.textContent = '';
    navigate(n === 13 ? '#/results/you' : `#/survey/${n + 1}`);
  }

  const footer = h('div', { class: 'actions survey-footer' },
    h('button', { type: 'button', class: 'btn-secondary', onclick: () => navigate(backHash) }, copy.survey.back),
    h('button', { type: 'button', class: 'btn', onclick: goNext }, nextLabel),
  );

  const metaRow = h('div', { class: 'survey-meta' }, tag, sectionOfLine);
  wrap.append(topRow, metaRow, heading, aboutLine, list, incompleteMsg, footer);
  container.appendChild(wrap);
  updateProgress();
}
