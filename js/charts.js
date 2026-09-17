// Small chart components for the results dashboards.
// Pure functions that return DOM nodes. HTML pieces are built with h() from
// js/dom.js; anything that needs an axis or free positioning is inline SVG
// built with document.createElementNS. No animation, no gradients, no icons.
//
// Exports: comparisonRows, singleValueRows, dotStrip, durationStrip,
// slopeChart, stackedBar.

import { h, fill } from './dom.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

function svgEl(tag, attrs = {}) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === null || v === undefined) continue;
    el.setAttribute(k, v);
  }
  return el;
}

function svgLine(x1, y1, x2, y2, stroke, width = 1) {
  return svgEl('line', { x1, y1, x2, y2, stroke, 'stroke-width': width });
}

function svgCircle(cx, cy, r, fill, opacity = 1) {
  return svgEl('circle', { cx, cy, r, fill, 'fill-opacity': opacity });
}

// When `cls` is given, font-size comes from a CSS class in dashboards.css
// instead of an SVG attribute, so it can be set in real CSS pixels (and
// adjusted per breakpoint) rather than scaling with the viewBox.
function svgText(x, y, str, { size = 12, fill = 'var(--muted)', anchor = 'middle', weight = 400, cls = null } = {}) {
  const attrs = { x, y, fill, 'text-anchor': anchor, 'font-family': 'var(--font)', 'font-weight': weight };
  if (cls) attrs.class = cls; else attrs['font-size'] = size;
  const t = svgEl('text', attrs);
  t.textContent = str;
  return t;
}

/** Deterministic pseudo-random in [0, 1) from an integer index (no external RNG dependency). */
function seededUnit(i) {
  const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function fmt1(v) {
  return v == null ? '–' : v.toFixed(1);
}

export function fmtGap(gap) {
  if (gap == null) return '';
  const r = Math.round(gap * 10) / 10;
  if (r === 0) return '0.0';
  const sign = r > 0 ? '+' : '−';
  return sign + Math.abs(r).toFixed(1);
}

/**
 * Work out the wording for a score compared with a baseline, using
 * copy.results.compare (threshold, above/below/close, rateAbove/rateBelow/rateClose).
 */
export function compareWord(value, baseline, compare) {
  if (value == null || baseline == null) return { gap: null, gapWord: '', rateWord: '' };
  const gap = value - baseline;
  if (gap > compare.threshold) return { gap, gapWord: compare.above, rateWord: compare.rateAbove };
  if (gap < -compare.threshold) return { gap, gapWord: compare.below, rateWord: compare.rateBelow };
  return { gap, gapWord: compare.close, rateWord: compare.rateClose };
}

function pct(value, min = 1, max = 5) {
  if (value == null) return 0;
  return Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
}

function trackNode({ value, tone, marks = [], min = 1, max = 5 }) {
  const base = h('div', { class: 'chart-track-base' });
  if (value != null) {
    const fill = h('div', { class: tone ? `chart-track-fill tone-${tone}` : 'chart-track-fill' });
    fill.style.width = pct(value, min, max) + '%';
    base.appendChild(fill);
  }
  const wrap = h('div', { class: 'chart-track' }, base);
  for (const m of marks) {
    if (m.value == null) continue;
    const tick = h('div', { class: `chart-track-tick ${m.className || ''}` });
    tick.style.left = pct(m.value, min, max) + '%';
    wrap.appendChild(tick);
  }
  return wrap;
}

/**
 * A stack of comparison rows: one row per scale, a fill bar for `value` and a
 * tick for `ib`. Rows: [{id, label, explain, value, ib, tone}].
 * opts: {compare, legendValueLabel, legendIbLabel, tickLabels=true}
 */
export function comparisonRows(rows, opts) {
  const { compare, legendValueLabel, legendIbLabel, tickLabels = true } = opts;
  const legend = h('div', { class: 'chart-legend small muted' },
    h('span', { class: 'chart-legend-item' }, h('span', { class: 'chart-swatch chart-swatch-fill' }), legendValueLabel),
    h('span', { class: 'chart-legend-item' }, h('span', { class: 'chart-swatch chart-swatch-tick' }), legendIbLabel),
  );
  const rowEls = rows.map((row, i) => {
    const isLast = i === rows.length - 1;
    const { gapWord } = compareWord(row.value, row.ib, compare);
    const track = trackNode({
      value: row.value,
      tone: row.tone,
      marks: row.ib != null ? [{ value: row.ib, className: 'chart-track-tick-ib' }] : [],
    });
    const trackWrap = h('div', { class: 'chart-row-track' }, track);
    if (isLast && tickLabels) {
      trackWrap.appendChild(h('div', { class: 'chart-ticklabels small muted' },
        ...[1, 2, 3, 4, 5].map((n) => h('span', {}, String(n))),
      ));
    }
    return h('div', { class: 'chart-row' },
      h('div', { class: 'chart-row-label' },
        h('div', { class: 'chart-row-label-text' }, row.label),
        row.explain ? h('div', { class: 'chart-row-explain small muted' }, row.explain) : null,
      ),
      trackWrap,
      h('div', { class: 'chart-row-values' },
        h('span', { class: 'chart-value-main' }, fmt1(row.value)),
        h('span', { class: 'chart-value-ib small muted' }, row.ib != null ? fill(compare.ibValue, { value: fmt1(row.ib) }) : ''),
        h('span', { class: 'chart-value-gap small muted' }, gapWord),
      ),
    );
  });
  return h('div', { class: 'chart-comparison' }, legend, h('div', { class: 'chart-rows' }, ...rowEls));
}

/**
 * Single-value bar rows (no IB tick per row) - used for the manager C1
 * team / office / IB comparison. rows: [{label, value, colorVar, opacity}]
 * where colorVar is a CSS custom property name, e.g. "--tone-c-border".
 */
export function singleValueRows(rows, { tickLabels = true } = {}) {
  const rowEls = rows.map((row, i) => {
    const isLast = i === rows.length - 1;
    const track = trackNode({ value: row.value, tone: null });
    const fillEl = track.querySelector('.chart-track-fill');
    if (fillEl) {
      fillEl.style.background = `var(${row.colorVar})`;
      if (row.opacity != null) fillEl.style.opacity = String(row.opacity);
    }
    const trackWrap = h('div', { class: 'chart-row-track' }, track);
    if (isLast && tickLabels) {
      trackWrap.appendChild(h('div', { class: 'chart-ticklabels small muted' },
        ...[1, 2, 3, 4, 5].map((n) => h('span', {}, String(n))),
      ));
    }
    return h('div', { class: 'chart-row chart-row-single' },
      h('div', { class: 'chart-row-label' }, h('div', { class: 'chart-row-label-text' }, row.label)),
      trackWrap,
      h('div', { class: 'chart-row-values' }, h('span', { class: 'chart-value-main' }, fmt1(row.value))),
    );
  });
  return h('div', { class: 'chart-rows chart-rows-single' }, ...rowEls);
}

/** Anchor helper for a label tied to a horizontal % position: centred, but
 * flipped to hang off the left of its point once past 70% so it never runs
 * off the right edge. Returns a CSS class name to combine with a base class. */
function edgeAnchorClass(pctValue) {
  return pctValue > 70 ? ' is-end' : pctValue < 8 ? ' is-start' : '';
}

/**
 * One dot per group mean on a 1..5 axis (plain HTML/CSS, not SVG, so it can
 * span the full column width at any viewport without a scale-dependent font
 * size). The highlighted id is larger, with its value labelled above it in a
 * white pill; the IB mean is a vertical line labelled at the top.
 * points: [{id, value}]. opts: {ibMean, ibLabel, highlightId, axisLabel}.
 * ibLabel is the already-filled copy string, e.g. "IB 3.5".
 */
export function dotStrip({ points, ibMean, ibLabel, highlightId, axisLabel } = {}) {
  const min = 1, max = 5;
  const xPct = (v) => Math.max(0, Math.min(100, ((v - min) / (max - min)) * 100));

  const plot = h('div', { class: 'dot-strip-plot' });

  if (ibMean != null) {
    const p = xPct(ibMean);
    const line = h('div', { class: 'dot-strip-ib-line' });
    line.style.left = p + '%';
    const label = h('span', { class: 'dot-strip-ib-label' + edgeAnchorClass(p) }, ibLabel || '');
    line.appendChild(label);
    plot.appendChild(line);
  }

  points.forEach((p, i) => {
    if (p.value == null) return;
    const isHighlight = p.id === highlightId;
    const left = xPct(p.value);
    const dot = h('div', { class: 'dot-strip-dot' + (isHighlight ? ' highlight' : '') });
    dot.style.left = left + '%';
    if (!isHighlight) {
      const band = 62;
      dot.style.top = (18 + seededUnit(i * 7 + 3) * band) + '%';
    }
    plot.appendChild(dot);
    if (isHighlight) {
      const label = h('span', { class: 'dot-strip-highlight-label' + edgeAnchorClass(left) }, p.value.toFixed(1));
      label.style.left = left + '%';
      plot.appendChild(label);
    }
  });

  const axis = h('div', { class: 'dot-strip-axis' },
    ...[min, 2, 3, 4, max].map((v) => {
      const span = h('span', {}, String(v));
      span.style.left = xPct(v) + '%';
      return span;
    }),
  );

  return h('div', { class: 'dot-strip', role: 'img', 'aria-label': axisLabel || '' }, plot, axis);
}

/**
 * A row of dots on a days axis (0..max), with a median vertical line.
 * Plain HTML/CSS so it can span the full column width at any viewport.
 * opts: {values, max, medianLabel}. medianLabel is the already-filled text,
 * e.g. "Median 30 days".
 */
export function durationStrip({ values, max, medianLabel }) {
  const xPct = (v) => Math.max(0, Math.min(100, (v / max) * 100));

  const plot = h('div', { class: 'dot-strip-plot duration-strip-plot' });

  const med = values.length ? median(values) : null;
  if (med != null) {
    const p = xPct(med);
    const line = h('div', { class: 'dot-strip-median-line' });
    line.style.left = p + '%';
    const label = h('span', { class: 'dot-strip-median-label' + edgeAnchorClass(p) }, medianLabel || '');
    line.appendChild(label);
    plot.appendChild(line);
  }

  values.forEach((v, i) => {
    const dot = h('div', { class: 'dot-strip-dot duration-dot' });
    dot.style.left = xPct(v) + '%';
    dot.style.top = (20 + seededUnit(i * 5 + 11) * 60) + '%';
    plot.appendChild(dot);
  });

  const step = max <= 30 ? 10 : max <= 60 ? 15 : 30;
  const ticks = [];
  for (let v = 0; v <= max; v += step) ticks.push(v);

  const axis = h('div', { class: 'dot-strip-axis' },
    ...ticks.map((v) => {
      const span = h('span', {}, String(v));
      span.style.left = xPct(v) + '%';
      return span;
    }),
  );

  return h('div', { class: 'dot-strip', role: 'img', 'aria-label': medianLabel || '' }, plot, axis);
}

function median(numbers) {
  const s = numbers.slice().sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 === 0 ? (s[mid - 1] + s[mid]) / 2 : s[mid];
}

/**
 * Three-point slope chart. points: [{key,label}] (3). participants:
 * [{[key]: number}]. means: {[key]: number}.
 */
export function slopeChart({ points, participants, means }) {
  const width = 440;
  const height = 230;
  const padLeft = 60;
  const padRight = 24;
  const padTop = 30;
  const padBottom = 36;
  const min = 1, max = 5;
  const plotH = height - padTop - padBottom;
  const n = points.length;
  const xAt = (i) => padLeft + (i / (n - 1)) * (width - padLeft - padRight);
  const yAt = (v) => padTop + (1 - (v - min) / (max - min)) * plotH;

  const svg = svgEl('svg', { viewBox: `0 0 ${width} ${height}`, role: 'img' });

  // y axis
  for (let v = min; v <= max; v++) {
    svg.appendChild(svgLine(padLeft, yAt(v), width - padRight, yAt(v), 'var(--rule)', 1));
    svg.appendChild(svgText(padLeft - 10, yAt(v) + 5, String(v), { anchor: 'end', cls: 'chart-slope-axis-label' }));
  }
  // x labels
  points.forEach((p, i) => {
    const anchor = i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle';
    svg.appendChild(svgText(xAt(i), height - 6, p.label, { anchor, cls: 'chart-slope-axis-label' }));
  });

  // participant lines (thin, offset a little so overlaps are visible)
  participants.forEach((part, pi) => {
    const offset = (seededUnit(pi * 3 + 1) - 0.5) * 0.35;
    let d = '';
    points.forEach((p, i) => {
      const v = part[p.key];
      if (v == null) return;
      const yy = yAt(Math.max(min, Math.min(max, v + offset)));
      d += (d ? ' L ' : 'M ') + xAt(i) + ' ' + yy;
    });
    if (d) {
      const path = svgEl('path', { d, fill: 'none', stroke: 'var(--tone-a-border)', 'stroke-width': 1, 'stroke-opacity': 0.25 });
      svg.appendChild(path);
    }
  });

  // mean line
  let dMean = '';
  points.forEach((p, i) => {
    const v = means[p.key];
    if (v == null) return;
    const yy = yAt(v);
    dMean += (dMean ? ' L ' : 'M ') + xAt(i) + ' ' + yy;
  });
  if (dMean) {
    svg.appendChild(svgEl('path', { d: dMean, fill: 'none', stroke: 'var(--tone-a-ink)', 'stroke-width': 3 }));
  }
  points.forEach((p, i) => {
    const v = means[p.key];
    if (v == null) return;
    const yy = yAt(v);
    const anchor = i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle';
    const dx = i === 0 ? 6 : i === n - 1 ? -6 : 0;
    svg.appendChild(svgCircle(xAt(i), yy, 4, 'var(--tone-a-ink)'));
    svg.appendChild(svgText(xAt(i) + dx, yy - 14, v.toFixed(1), { fill: 'var(--tone-a-ink)', weight: 600, anchor, cls: 'chart-slope-mean-label' }));
  });

  return svg;
}

/**
 * A single stacked horizontal bar with a legend beneath.
 * segments: [{label, value, colorVar}].
 */
export function stackedBar(segments) {
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  const bar = h('div', { class: 'stacked-bar' },
    ...segments.map((seg) => {
      const el = h('div', { class: 'stacked-bar-seg' });
      el.style.width = ((seg.value / total) * 100) + '%';
      el.style.background = `var(${seg.colorVar})`;
      return el;
    }),
  );
  const legend = h('div', { class: 'stacked-legend' },
    ...segments.map((seg) => {
      const swatch = h('span', { class: 'chart-swatch' });
      swatch.style.background = `var(${seg.colorVar})`;
      return h('span', { class: 'chart-legend-item small' }, swatch, `${seg.label} (${seg.value})`);
    }),
  );
  return h('div', { class: 'stacked-bar-wrap' }, bar, legend);
}
