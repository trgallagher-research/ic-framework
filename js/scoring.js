// Scoring and aggregation helpers. Plain ES module, no dependencies.

export const MIN_GROUP = 5;

/**
 * Score a single respondent's answers into per-scale means.
 * @param {Record<string, number>} answers - {itemId: 1..5}
 * @param {Array<{id: string, scale: string}>} items - items.json .items
 * @returns {Record<string, number|null>} one entry per scale present in items; null if none answered
 */
export function scoreAnswers(answers, items) {
  const byScale = {};
  for (const item of items) {
    if (!byScale[item.scale]) byScale[item.scale] = [];
    const v = answers ? answers[item.id] : undefined;
    if (v !== undefined && v !== null) {
      byScale[item.scale].push(v);
    }
  }
  const out = {};
  for (const scale of Object.keys(byScale)) {
    const vals = byScale[scale];
    out[scale] = vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : null;
  }
  return out;
}

/**
 * Aggregate a group of responses into n, suppression flag, mean and sd per scale.
 * @param {Array<{items: Record<string, number>}>} responses
 * @param {Array<{id: string, scale: string}>} items
 * @returns {{n: number, suppressed: boolean, mean: Record<string, number>, sd: Record<string, number>}}
 */
export function aggregate(responses, items) {
  const scales = [...new Set(items.map((it) => it.scale))];
  const n = responses.length;
  const suppressed = n < MIN_GROUP;

  // Per-respondent scale scores, skipping scales the respondent did not answer.
  const perScale = {};
  for (const scale of scales) perScale[scale] = [];
  for (const resp of responses) {
    const scored = scoreAnswers(resp.items, items);
    for (const scale of scales) {
      const v = scored[scale];
      if (v !== null && v !== undefined) {
        perScale[scale].push(v);
      }
    }
  }

  const mean = {};
  const sd = {};
  for (const scale of scales) {
    const vals = perScale[scale];
    if (vals.length === 0) {
      mean[scale] = null;
      sd[scale] = null;
      continue;
    }
    const m = vals.reduce((s, v) => s + v, 0) / vals.length;
    mean[scale] = m;
    if (vals.length > 1) {
      const variance = vals.reduce((s, v) => s + (v - m) * (v - m), 0) / (vals.length - 1);
      sd[scale] = Math.sqrt(variance);
    } else {
      sd[scale] = 0;
    }
  }

  return { n, suppressed, mean, sd };
}

/** Median of an array of numbers (does not mutate input). */
export function median(numbers) {
  if (!numbers || numbers.length === 0) return null;
  const sorted = numbers.slice().sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

/** Round to one decimal place, returning a number. */
export function round1(x) {
  return Math.round(x * 10) / 10;
}
