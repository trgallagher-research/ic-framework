// End-to-end check with Playwright: orientation, the full survey by clicking, the three
// results views, the sample preview, and that the employee view follows the answers.
//
//   BASE_URL=http://localhost:8765/ node tests/e2e.mjs
//
// Env: BASE_URL (default http://localhost:8765/), SHOTS (screenshot dir, default ./shots),
// PLAYWRIGHT (path to the playwright package if it is not installed here),
// CHROME (browser executable, optional).
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.env.BASE_URL || 'http://localhost:8765/';
const SHOTS = process.env.SHOTS || 'shots';
const { chromium } = await import(process.env.PLAYWRIGHT || 'playwright');
const items = JSON.parse(fs.readFileSync(new URL('../data/items.json', import.meta.url))).items;
fs.mkdirSync(SHOTS, { recursive: true });

const VIEWPORTS = [
  { name: 'desktop', width: 1280, height: 800 },
  { name: 'mobile', width: 375, height: 812 },
];
const failures = [];
const fail = (msg) => { failures.push(msg); console.log('FAIL', msg); };
const pass = (msg) => console.log('PASS', msg);

const browser = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});

function watch(page, label) {
  page.on('console', (m) => { if (m.type() === 'error') fail(`${label}: console error: ${m.text()}`); });
  page.on('pageerror', (e) => fail(`${label}: page error: ${e.message}`));
  page.on('response', (r) => { if (r.status() >= 400 && !r.url().endsWith('favicon.ico')) fail(`${label}: HTTP ${r.status()} ${r.url()}`); });
}

async function waitHash(page, re) {
  await page.waitForFunction((src) => new RegExp(src).test(location.hash), re.source);
  await page.waitForTimeout(100);
}

async function shot(page, vp, name) {
  await page.waitForTimeout(150);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  if (overflow > 0) fail(`${vp.name} ${name}: horizontal overflow ${overflow}px`);
  await page.screenshot({ path: path.join(SHOTS, `${vp.name}-${name}.png`), fullPage: true });
}

async function answerSurvey(page, vp, pick, doShots) {
  const seen = [];
  for (let n = 1; n <= 13; n++) {
    await waitHash(page, new RegExp(`#/survey/${n}$`));
    const groups = page.locator('[role="radiogroup"]');
    const count = await groups.count();
    for (let i = 0; i < count; i++) {
      const g = groups.nth(i);
      seen.push(await g.getAttribute('aria-label'));
      await g.locator('[role="radio"]').nth(pick(seen.length - 1) - 1).click();
    }
    if (doShots) await shot(page, vp, `survey-${String(n).padStart(2, '0')}`);
    const next = page.getByRole('button', { name: n === 13 ? 'See my results' : 'Next group' });
    await next.click();
  }
  await waitHash(page, /#\/results\/you$/);
  return seen;
}

async function employeeValues(page) {
  await page.locator('.chart-value-main').first().waitFor();
  return page.locator('.chart-value-main').allInnerTexts();
}

for (const vp of VIEWPORTS) {
  const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
  const page = await context.newPage();
  watch(page, vp.name);

  // Orientation
  await page.goto(BASE);
  await page.locator('h1').waitFor();
  await shot(page, vp, 'about-1');
  await page.getByRole('button', { name: 'Continue' }).click();
  await waitHash(page, /#\/about\/2$/);
  await shot(page, vp, 'about-2');
  await page.getByRole('button', { name: 'Continue' }).click();
  await waitHash(page, /#\/about\/3$/);
  await shot(page, vp, 'about-3');
  await page.getByRole('button', { name: 'Start the survey' }).click();

  // Survey, with a varied answer pattern
  const patternA = (i) => [4, 5, 3, 4, 2][i % 5];
  const seen = await answerSurvey(page, vp, patternA, true);
  const expected = items.map((it) => it.text);
  if (JSON.stringify(seen) === JSON.stringify(expected)) pass(`${vp.name}: survey showed all 43 items, in order, worded as data/items.json`);
  else fail(`${vp.name}: survey items on screen differ from data/items.json (${seen.length} seen)`);

  const stored = await page.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('icf.answers.v1') || '{}')).length);
  if (stored === 43) pass(`${vp.name}: 43 answers stored in the browser`); else fail(`${vp.name}: ${stored} answers stored`);

  // Results
  const valuesA = await employeeValues(page);
  await shot(page, vp, 'results-you');
  for (const tab of ['team', 'ib']) {
    await page.getByRole('link', { name: new RegExp(tab === 'team' ? 'Your team' : 'The IB') }).click();
    await waitHash(page, new RegExp(`#/results/${tab}$`));
    await page.locator('h1').waitFor();
    if (tab === 'ib') await page.locator('details').first().evaluate((d) => { d.open = true; });
    await shot(page, vp, `results-${tab}`);
  }

  if (vp.name === 'desktop') {
    const teamA = await page.goto(BASE + '#/results/team').then(() => page.locator('main').innerText());
    // Change the answers by retaking the survey with another pattern
    await page.goto(BASE + '#/results/you');
    await page.getByRole('button', { name: 'Change my answers' }).click().catch(async () => page.goto(BASE + '#/survey/1'));
    if (!/#\/survey\/1$/.test(page.url())) await page.goto(BASE + '#/survey/1');
    await answerSurvey(page, vp, (i) => [2, 1, 2, 3, 2][i % 5], false);
    const valuesB = await employeeValues(page);
    console.log('employee values, first answers: ', valuesA.join(' '));
    console.log('employee values, second answers:', valuesB.join(' '));
    if (JSON.stringify(valuesA) !== JSON.stringify(valuesB)) pass('employee view changed when the answers changed');
    else fail('employee view did not change when the answers changed');
    await shot(page, vp, 'results-you-changed');
    await page.goto(BASE + '#/results/team');
    await page.locator('h1').waitFor();
    await page.waitForTimeout(200);
    const teamB = await page.locator('main').innerText();
    if (teamA === teamB) pass('manager view unchanged by the person\'s answers (fixed-seed data)');
    else fail('manager view changed with the person\'s answers');
  }
  await context.close();

  // Sample preview from a fresh browser
  const ctx2 = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
  const p2 = await ctx2.newPage();
  watch(p2, `${vp.name} preview`);
  await p2.goto(BASE + '#/results/you');
  await p2.locator('h1').waitFor();
  await shot(p2, vp, 'results-need-answers');
  await p2.getByRole('button', { name: 'Preview with sample answers' }).click();
  await waitHash(p2, /#\/results\/you$/);
  await employeeValues(p2);
  await shot(p2, vp, 'results-you-sample');
  pass(`${vp.name}: preview with sample answers reaches the employee view`);
  await ctx2.close();
}

await browser.close();
console.log(failures.length ? `\n${failures.length} failure(s)` : '\nAll checks passed');
process.exit(failures.length ? 1 : 0);
