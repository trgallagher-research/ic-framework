#!/usr/bin/env node
// Verification summary for the mock data generator. Run with:
//   node scripts/mock-summary.mjs
// Reads data/items.json from disk (via fs) and passes it into the plain
// ES-module generator so the same generator code also runs unmodified in
// the browser.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import params from '../data/mock-params.js';
import outputsCatalogue from '../content/mock-outputs.js';
import { generateDataset, performanceSummary } from '../js/mockdata.js';
import { scoreAnswers, aggregate, round1 } from '../js/scoring.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const itemsPath = path.join(__dirname, '..', 'data', 'items.json');

const { items } = JSON.parse(fs.readFileSync(itemsPath, 'utf8'));
const scaleIds = Object.keys(params.scales);

function fmt(n, dp = 2) {
  return n === null || n === undefined ? 'n/a' : n.toFixed(dp);
}

const dataset = generateDataset(params, items, outputsCatalogue);

let failures = 0;
function check(label, cond) {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}`);
  if (!cond) failures++;
}

console.log('='.repeat(78));
console.log('MOCK DATA VERIFICATION SUMMARY');
console.log('='.repeat(78));

// --- People per office -----------------------------------------------------
console.log('\n-- People per office --');
const peopleByOffice = new Map();
for (const p of dataset.people) {
  peopleByOffice.set(p.officeId, (peopleByOffice.get(p.officeId) || 0) + 1);
}
let totalPeople = 0;
for (const office of dataset.offices) {
  const count = peopleByOffice.get(office.id) || 0;
  totalPeople += count;
  console.log(
    `  ${office.id.padEnd(5)} ${office.name.padEnd(38)} people=${String(count).padStart(4)}  headcount=${String(office.headcount).padStart(4)}  ${count === office.headcount ? 'OK' : 'MISMATCH'}`
  );
  check(`${office.id} people count equals headcount`, count === office.headcount);
}
console.log(`  TOTAL people: ${totalPeople}`);
check('total people equals 910', totalPeople === 910);

// --- Respondents per office -------------------------------------------------
console.log('\n-- Respondents per office --');
const respondentsByOffice = new Map();
for (const r of dataset.responses) {
  respondentsByOffice.set(r.officeId, (respondentsByOffice.get(r.officeId) || 0) + 1);
}
let totalRespondents = 0;
for (const office of dataset.offices) {
  const count = respondentsByOffice.get(office.id) || 0;
  totalRespondents += count;
  const quota = Math.round(office.headcount * params.responseRate);
  console.log(`  ${office.id.padEnd(5)} respondents=${String(count).padStart(4)}  target quota=${String(quota).padStart(4)}`);
}
console.log(`  TOTAL respondents: ${totalRespondents}`);

// --- Overall IB mean per scale vs param mean --------------------------------
console.log('\n-- Overall IB mean per scale (2dp) vs param mean --');
const ibAgg = aggregate(dataset.responses, items);
for (const scale of scaleIds) {
  console.log(
    `  ${scale.padEnd(3)} observed=${fmt(ibAgg.mean[scale])}  target=${fmt(params.scales[scale].mean)}  n=${ibAgg.n}`
  );
}

// --- Office means per scale table ------------------------------------------
console.log('\n-- Office means per scale --');
const officeAggs = {};
for (const office of dataset.offices) {
  const officeResponses = dataset.responses.filter((r) => r.officeId === office.id);
  officeAggs[office.id] = aggregate(officeResponses, items);
}
const header = ['office', ...scaleIds].map((s) => s.padEnd(6)).join('');
console.log(`  ${header}`);
for (const office of dataset.offices) {
  const agg = officeAggs[office.id];
  const row = [office.id.padEnd(6)];
  for (const scale of scaleIds) {
    row.push((agg.mean[scale] !== null && agg.mean[scale] !== undefined ? agg.mean[scale].toFixed(2) : 'n/a').padEnd(6));
  }
  console.log(`  ${row.join('')}`);
}

// --- Education Innovation vs IB ---------------------------------------------
console.log('\n-- Education Innovation senior experts vs IB overall --');
const eiExpertIds = new Set(dataset.manager.reportIds);
const eiResponses = dataset.responses.filter((r) => eiExpertIds.has(r.personId));
const eiAgg = aggregate(eiResponses, items);
console.log(`  EI respondents n=${eiAgg.n} (must be 7)`);
check('EI respondent count is 7', eiAgg.n === 7);
for (const scale of scaleIds) {
  const ei = eiAgg.mean[scale];
  const ib = ibAgg.mean[scale];
  const diff = ei !== null && ib !== null ? ei - ib : null;
  console.log(
    `  ${scale.padEnd(3)} EI=${fmt(ei)}  IB=${fmt(ib)}  diff=${diff === null ? 'n/a' : (diff >= 0 ? '+' : '') + diff.toFixed(2)}`
  );
}
for (const scale of ['A2', 'A5', 'CC']) {
  check(`EI mean(${scale}) above IB mean`, eiAgg.mean[scale] > ibAgg.mean[scale]);
}
check('EI mean(C2) below IB mean', eiAgg.mean.C2 < ibAgg.mean.C2);

// --- Director of Education Innovation: C1 respondent count & mean ----------
console.log('\n-- Director of Education Innovation (manager) --');
const dgEduDirectorReports = dataset.responses.filter((r) => r.managerId === dataset.manager.personId);
console.log(`  Direct reports who responded: ${dgEduDirectorReports.length} (must be 7)`);
check('Director of EI has 7 responding direct reports', dgEduDirectorReports.length === 7);
const c1Vals = dgEduDirectorReports
  .map((r) => scoreAnswers(r.items, items).C1)
  .filter((v) => v !== null && v !== undefined);
const c1Mean = c1Vals.length ? c1Vals.reduce((s, v) => s + v, 0) / c1Vals.length : null;
const eduAgg = officeAggs.edu;
console.log(`  C1 mean under this manager: ${fmt(c1Mean)}`);
console.log(`  C1 mean, IB overall:        ${fmt(ibAgg.mean.C1)}`);
console.log(`  C1 mean, Education office:  ${fmt(eduAgg.mean.C1)}`);

// --- Managers with >=5 respondents -----------------------------------------
console.log('\n-- Managers with >=5 respondents --');
const respondentsByManager = new Map();
for (const r of dataset.responses) {
  if (r.managerId === null) continue;
  respondentsByManager.set(r.managerId, (respondentsByManager.get(r.managerId) || 0) + 1);
}
const managersWith5plus = [...respondentsByManager.values()].filter((c) => c >= 5).length;
console.log(`  Managers with >=5 respondents: ${managersWith5plus} (out of ${respondentsByManager.size} managers with any respondents)`);

// --- Performance summary -----------------------------------------------------
console.log('\n-- Performance summary --');
const perfSummary = performanceSummary(dataset.proposals);
console.log(JSON.stringify(perfSummary, null, 2));
check('performanceSummary.total is 40', perfSummary.total === 40);
check('performanceSummary.byDecision.go is 17', perfSummary.byDecision.go === 17);
check('performanceSummary.byDecision.stop is 13', perfSummary.byDecision.stop === 13);
check('performanceSummary.byDecision.park is 7', perfSummary.byDecision.park === 7);
check('performanceSummary.byDecision.awaiting is 3', perfSummary.byDecision.awaiting === 3);
check('performanceSummary.inUse is 12', perfSummary.inUse === 12);
check('performanceSummary.beingImplemented is 5', perfSummary.beingImplemented === 5);

// --- In-use proposals: plausibility, novelty/horizon counts ----------------
console.log('\n-- In-use proposals (12) --');
const catalogueByTitle = new Map(outputsCatalogue.map((e) => [e.title, e]));
const inUseProposals = dataset.proposals.filter((p) => p.status === 'In use');
for (const p of inUseProposals) {
  console.log(`  [${p.novelty.padEnd(17)}] [${p.horizon}] ${p.title}`);
  console.log(`      -> ${p.change}`);
}
check('exactly 12 In use proposals', inUseProposals.length === 12);
const allInUseEducational = inUseProposals.every((p) => catalogueByTitle.get(p.title)?.educational === true);
check('every In use proposal is from an educational catalogue entry', allInUseEducational);

const inUseNoveltyCounts = {};
const inUseHorizonCounts = {};
for (const p of inUseProposals) {
  inUseNoveltyCounts[p.novelty] = (inUseNoveltyCounts[p.novelty] || 0) + 1;
  inUseHorizonCounts[p.horizon] = (inUseHorizonCounts[p.horizon] || 0) + 1;
}
console.log(`  novelty counts: ${JSON.stringify(inUseNoveltyCounts)} (target ${JSON.stringify(params.performance.noveltyInUse)})`);
console.log(`  horizon counts: ${JSON.stringify(inUseHorizonCounts)} (target ${JSON.stringify(params.performance.horizonInUse)})`);
for (const [label, target] of Object.entries(params.performance.noveltyInUse)) {
  check(`In-use novelty count "${label}" is ${target}`, (inUseNoveltyCounts[label] || 0) === target);
}
for (const [label, target] of Object.entries(params.performance.horizonInUse)) {
  check(`In-use horizon count "${label}" is ${target}`, (inUseHorizonCounts[label] || 0) === target);
}

// --- Whole catalogue: exactly one "New to the world" across all 40 ---------
const worldCountAll = dataset.proposals.filter((p) => p.novelty === 'New to the world').length;
console.log(`\n  "New to the world" proposals across all 40: ${worldCountAll}`);
check('exactly one "New to the world" proposal across all 40', worldCountAll === 1);

// Dates sanity: every date <= asOf where applicable, submitted within window (or asOf if clipped later? window end 2026-08-31 < asOf)
const asOfDate = new Date(`${params.asOf}T00:00:00Z`);
const winStart = new Date(`${params.performance.submissionWindow.start}T00:00:00Z`);
const winEnd = new Date(`${params.performance.submissionWindow.end}T00:00:00Z`);
let dateIssues = 0;
for (const p of dataset.proposals) {
  const sub = new Date(`${p.submitted}T00:00:00Z`);
  if (sub < winStart || sub > winEnd) dateIssues++;
  if (p.decided && new Date(`${p.decided}T00:00:00Z`) > asOfDate) dateIssues++;
  if (p.inUse && new Date(`${p.inUse}T00:00:00Z`) > asOfDate) dateIssues++;
}
check('all proposal dates within window / on or before asOf', dateIssues === 0);

// --- Workshop -----------------------------------------------------------
console.log('\n-- Workshop --');
const ws = dataset.workshop;
const wsMean = (key) => ws.participants.reduce((s, p) => s + p[key], 0) / ws.participants.length;
console.log(`  pre mean:      ${fmt(wsMean('pre'), 2)} (target ${params.workshop.targetMeans.pre})`);
console.log(`  post mean:     ${fmt(wsMean('post'), 2)} (target ${params.workshop.targetMeans.post})`);
console.log(`  followUp mean: ${fmt(wsMean('followUp'), 2)} (target ${params.workshop.targetMeans.followUp})`);
const usedSinceCount = ws.participants.filter((p) => p.usedSince).length;
console.log(`  usedSince count: ${usedSinceCount} (must be ${params.workshop.usedSince})`);
check('usedSince count matches params', usedSinceCount === params.workshop.usedSince);
check('pre mean rounds to target', round1(wsMean('pre')) === params.workshop.targetMeans.pre);
check('post mean rounds to target', round1(wsMean('post')) === params.workshop.targetMeans.post);
check('followUp mean rounds to target', round1(wsMean('followUp')) === params.workshop.targetMeans.followUp);
const usedAvg = ws.participants.filter((p) => p.usedSince).reduce((s, p) => s + p.followUp, 0) / usedSinceCount;
const notUsedAvg = ws.participants.filter((p) => !p.usedSince).reduce((s, p) => s + p.followUp, 0) / (ws.participants.length - usedSinceCount);
console.log(`  followUp avg (usedSince=true):  ${fmt(usedAvg, 2)}`);
console.log(`  followUp avg (usedSince=false): ${fmt(notUsedAvg, 2)}`);
check('usedSince group has higher followUp average', usedAvg > notUsedAvg);

// Ranges and per-participant ordering.
const preR = params.workshop.preRange;
const postR = params.workshop.postRange;
const followUpR = params.workshop.followUpRange;
const preInRange = ws.participants.every((p) => p.pre >= preR.min - 1 && p.pre <= preR.max);
const preAtMinMinusOneCount = ws.participants.filter((p) => p.pre === preR.min - 1).length;
const postInRange = ws.participants.every((p) => p.post >= postR.min && p.post <= postR.max);
const followUpInRange = ws.participants.every((p) => p.followUp >= followUpR.min && p.followUp <= followUpR.max);
const postGePre = ws.participants.every((p) => p.post >= p.pre);
const followUpLePost = ws.participants.every((p) => p.followUp <= p.post);
console.log(`  pre values:      ${ws.participants.map((p) => p.pre).join(',')}`);
console.log(`  post values:     ${ws.participants.map((p) => p.post).join(',')}`);
console.log(`  followUp values: ${ws.participants.map((p) => p.followUp).join(',')}`);
console.log(`  participants with pre === ${preR.min - 1}: ${preAtMinMinusOneCount} (at most 1 allowed)`);
check(`pre in [${preR.min - 1}, ${preR.max}] (at most one at ${preR.min - 1})`, preInRange);
check('at most one participant has pre at the one-below-range exception', preAtMinMinusOneCount <= 1);
check(`post in [${postR.min}, ${postR.max}]`, postInRange);
check(`followUp in [${followUpR.min}, ${followUpR.max}]`, followUpInRange);
check('post >= pre for every participant', postGePre);
check('followUp <= post for every participant', followUpLePost);

// --- Determinism check ---------------------------------------------------
console.log('\n-- Determinism check --');
const run1 = generateDataset(params, items, outputsCatalogue);
const run2 = generateDataset(params, items, outputsCatalogue);
const deterministic = JSON.stringify(run1) === JSON.stringify(run2);
check('generateDataset is deterministic for a fixed seed', deterministic);

// --- Name check -------------------------------------------------------------
console.log('\n-- Name check --');
const names = dataset.people.map((p) => p.name);
check('every synthetic name is unique', new Set(names).size === names.length);

// --- Summary ---------------------------------------------------------------
console.log('\n' + '='.repeat(78));
console.log(failures === 0 ? `ALL CHECKS PASSED` : `${failures} CHECK(S) FAILED`);
console.log('='.repeat(78));

process.exit(failures === 0 ? 0 : 1);
