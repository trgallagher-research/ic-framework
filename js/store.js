// localStorage-backed answer storage. Every access is wrapped in try/catch and falls back to
// an in-memory object when storage is unavailable (private browsing, quota, etc).

const ANSWERS_KEY = 'icf.answers.v1';
const SAMPLE_KEY = 'icf.sample.v1';

let memoryAnswers = {};
let memorySample = false;
let storageAvailable = null;

function hasStorage() {
  if (storageAvailable !== null) return storageAvailable;
  try {
    const testKey = '__icf_test__';
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);
    storageAvailable = true;
  } catch {
    storageAvailable = false;
  }
  return storageAvailable;
}

export function loadAnswers() {
  if (!hasStorage()) return { ...memoryAnswers };
  try {
    const raw = window.localStorage.getItem(ANSWERS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return { ...memoryAnswers };
  }
}

function writeAnswers(map) {
  memoryAnswers = { ...map };
  if (!hasStorage()) return;
  try {
    window.localStorage.setItem(ANSWERS_KEY, JSON.stringify(map));
  } catch {
    // fall back to memory only
  }
}

function writeSample(sample) {
  memorySample = !!sample;
  if (!hasStorage()) return;
  try {
    window.localStorage.setItem(SAMPLE_KEY, JSON.stringify(!!sample));
  } catch {
    // fall back to memory only
  }
}

export function saveAnswer(itemId, n) {
  const answers = loadAnswers();
  answers[itemId] = n;
  writeAnswers(answers);
  // Answering any item manually (this function) always clears the sample flag,
  // which covers "answering an item after a sample preview sets sample=false".
  writeSample(false);
}

export function setAllAnswers(map, { sample = false } = {}) {
  writeAnswers({ ...map });
  writeSample(sample);
}

export function isSample() {
  if (!hasStorage()) return memorySample;
  try {
    const raw = window.localStorage.getItem(SAMPLE_KEY);
    return raw ? JSON.parse(raw) : false;
  } catch {
    return memorySample;
  }
}

export function clearAnswers() {
  writeAnswers({});
  writeSample(false);
  if (hasStorage()) {
    try {
      window.localStorage.removeItem(ANSWERS_KEY);
      window.localStorage.removeItem(SAMPLE_KEY);
    } catch {
      // ignore
    }
  }
}

export function isComplete(items) {
  const list = Array.isArray(items) ? items : (items && items.items) || [];
  if (list.length === 0) return false;
  const answers = loadAnswers();
  return list.every((item) => answers[item.id] != null);
}

// Builds {itemId: value} from copy.sampleAnswers (scale -> list of values, one per item,
// in the order items for that scale appear in items.json).
export function sampleAnswerMap(items, copy) {
  const list = Array.isArray(items) ? items : (items && items.items) || [];
  const counters = {};
  const map = {};
  for (const item of list) {
    const values = (copy.sampleAnswers && copy.sampleAnswers[item.scale]) || [];
    const idx = counters[item.scale] || 0;
    counters[item.scale] = idx + 1;
    if (idx < values.length) map[item.id] = values[idx];
  }
  return map;
}
