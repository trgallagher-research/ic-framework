# Build spec: innovation capability framework prototype

A clickable prototype. Plain static site served as-is (GitHub Pages, repo root). No build
step, no framework, no npm dependencies at runtime, no external requests (no CDNs, no web
fonts). ES modules (`<script type="module">`). JSON loaded with `fetch` relative to the page.
Must work when served from a sub-path (e.g. `https://user.github.io/ic-framework/`), so
every URL is relative (`./data/items.json`, never `/data/items.json`).

## File layout and ownership

```
index.html                    shell (UI agent)
assets/css/tokens.css         design tokens (lead, hand-editable; do not edit)
assets/css/site.css           layout, shell, orientation, survey (UI agent)
assets/css/dashboards.css     dashboard + chart styles (dashboard agent)
assets/img/figure-*.png       the three figures from the document
content/copy.js               all UI copy (lead; do not edit — ask by listing missing keys)
content/domains.js            parts + scales: names, one-line explanations, skills (lead)
content/mock-outputs.js       40 mock proposal titles + "what changed" lines (generator agent)
data/items.json               the 43 items, document order (transcription agent)
data/mock-params.js           every mock-data parameter (generator agent)
js/rng.js                     seeded PRNG (generator agent)
js/mockdata.js                dataset generator (generator agent)
js/scoring.js                 scoring + aggregation (generator agent)
js/store.js                   localStorage answers (UI agent)
js/app.js                     router + screen mounting (UI agent)
js/screens/orientation.js     (UI agent)
js/screens/survey.js          (UI agent)
js/screens/results.js         dashboard frame + tab switching (dashboard agent)
js/screens/employee.js        (dashboard agent)
js/screens/manager.js         (dashboard agent)
js/screens/organisation.js    (dashboard agent)
js/charts.js                  small chart components, HTML/CSS or inline SVG (dashboard agent)
js/dom.js                     tiny helper: h(tag, attrs, ...children), esc() (UI agent)
scripts/check_wording.py      docx vs items.json assertion
```

## Scale ids

`A1 A2 A3 A4 A5 A6 D1 CC B1 B2 B3 C1 C2` (CC = co-creation cluster).
Survey section order is the document order: `A1 A2 A3 A4 A5 A6 D1 C1 C2 CC B1 B2 B3`.

## data/items.json

```json
{
  "responseScale": {"min": 1, "max": 5, "minLabel": "Fully disagree", "maxLabel": "Fully agree"},
  "sections": [{"scale": "A1", "appendix": "A"}, ...13],
  "items": [{"id": "A1_1", "scale": "A1", "text": "..."}, ...43]
}
```

## content/domains.js

```js
export const PARTS = { A: {key, letter, name, tagline, description, tone}, B: ..., C: ..., D: ... }
export const SCALES = { A1: {id, part, name, label /* "A1 Generating ideas" */, about /* 'self'|'team'|'manager'|'organisation' */,
                              explain /* one line, second person, for the employee profile */,
                              skills /* string[] or null */, why /* string or null */, tone }, ... }
export const INDIVIDUAL = ['A1','A2','A3','A4','A5','A6']
export const PROFILE_SCALES = ['A1','A2','A3','A4','A5','A6','D1','CC']
export const TEAM = ['B1','B2','B3']
export const CLIMATE = ['C1','C2']
export const SURVEY_ORDER = ['A1','A2','A3','A4','A5','A6','D1','C1','C2','CC','B1','B2','B3']
export const ALL_SCALES = ['A1','A2','A3','A4','A5','A6','D1','CC','B1','B2','B3','C1','C2']
```
`tone` is one of `a b c d skill neutral` and maps to CSS tokens `--tone-a-border`,
`--tone-a-fill`, `--tone-a-ink` etc.

## js/scoring.js

```js
export const MIN_GROUP = 5;
export function scoreAnswers(answers /* {itemId: 1..5} */, items /* items.json .items */)
  // -> {A1: number|null, ...all 13}; mean of the scale's answered items; null if none answered
export function aggregate(responses /* [{items:{itemId:n}}] */, items)
  // -> {n, suppressed: n < MIN_GROUP, mean: {scale: number}, sd: {scale: number}}
  //    mean/sd computed over respondents' scale scores; when suppressed, mean/sd are still computed
  //    (callers decide) but UI must not show them
export function median(numbers)
export function round1(x) // one decimal, returns number
```

## js/mockdata.js

```js
export function generateDataset(params, items, outputsCatalogue) // deterministic for params.seed
// returns:
{
  seed,
  asOf: '2026-09-17',
  offices:     [{id, name, headcount, chiefId}],          // includes the Director General's office (id 'dg')
  departments: [{id, officeId, name, headId}],
  teams:       [{id, departmentId, officeId, leadId, name}],
  people:      [{id, name, title, officeId, departmentId|null, teamId|null, managerId|null, isLeader}],
  responses:   [{personId, officeId, departmentId, managerId, items: {itemId: 1..5}}],
  viewer:      {personId, name, title, officeId: 'edu', departmentId, managerId},  // one of the 7 senior experts
  manager:     {personId, name, title, departmentId, reportIds: [7 ids]},          // Director of Education Innovation
  proposals:   [{id, title, officeId, departmentId, submitted, decision /* 'go'|'stop'|'park'|null */,
                 decided /* ISO date|null */, inUse /* ISO date|null */,
                 status /* 'Awaiting decision'|'Stopped'|'Parked'|'Being implemented'|'In use' */,
                 novelty /* 'New to the IB'|'New to the sector'|'New to the world' */,
                 horizon /* 'H1'|'H2'|'H3' */, change /* string, only when In use, else null */,
                 daysToDecision /* number|null */, daysToImplement /* number|null */}],
  workshop:    {title, date, followUpDate, item, followUpItem,
                participants: [{id, pre, post, followUp, usedSince}]}   // 14
}
export function performanceSummary(proposals)
// -> {total, byDecision:{go,stop,park,awaiting}, inUse, beingImplemented,
//     medianDaysToDecision, medianDaysToImplement, byNovelty:{...}, byHorizon:{...}}
```
Office ids: `ao` Assessment & Operations, `cpd` Community Partnerships & Development,
`dd` Digital & Data, `edu` Education, `sp` Strategy & People, `fin` Finance,
`dg` Director General's office.

## Routes (hash)

```
#/                    orientation 1 (the framework)
#/about/2             orientation 2 (how it is measured)
#/about/3             orientation 3 (what you are about to do)
#/survey/<n>          survey section n (1..13)
#/results/you         employee view
#/results/team        manager view
#/results/ib          organisation view
```
Results routes with no complete answers show a short prompt with two buttons: start the
survey, or preview with sample answers.

## Answers storage (js/store.js)

```js
export function loadAnswers()  // {itemId: n}; {} if none or storage unavailable
export function saveAnswer(itemId, n)
export function setAllAnswers(map, {sample: boolean})
export function isSample()      // true when answers came from "preview with sample answers"
export function clearAnswers()
export function isComplete(items) // all 43 answered
```
localStorage key `icf.answers.v1`, `icf.sample.v1`. Every access in try/catch; fall back to an
in-memory object. Answering any item manually after a sample preview sets sample=false.
Sample answers come from `copy.sampleAnswers` (a map scale -> list of values, one per item).

## Visual system (from the document's figures)

- Page background white. Section panels: fill `--panel`, 2px border `--panel-border`,
  radius `--radius-panel`. Inner boxes: fill `--tone-x-fill`, 2px border `--tone-x-border`,
  text `--tone-x-ink`, radius `--radius-box`.
- Type: `--font` (Arial-like sans, as in the figures). Headings weight 600, sentence case.
  Muted text `--muted`.
- Hard rules: no ALL-CAPS or letter-spaced labels; no `·` centre-dot separators; no gradients;
  no icons, emoji or decorative glyphs; no box shadows; no animation beyond a 150ms colour
  transition. Plain, well spaced, like a consultant's client deck.
- Layout: content max-width `--content-max`; side gutter 16px at <=600px; nothing may cause
  horizontal scrolling at 375px (wide tables go inside an `overflow-x:auto` wrapper).
- Mock data must always be labelled: every chart or table that shows generated data carries
  the text from `copy.mockLabel`, and the manager and organisation views carry
  `copy.results.mockBanner` at the top.
- Accessible: buttons are `<button>`, answer buttons are a radiogroup (role="radiogroup",
  role="radio", aria-checked), visible focus ring, colour never the only carrier of meaning.
