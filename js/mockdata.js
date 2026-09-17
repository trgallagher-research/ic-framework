// Deterministic mock-data generator for the IC framework prototype.
// Plain ES module, no dependencies. See docs/SPEC.md for the exact shapes.

import { createRng } from './rng.js';
import { median } from './scoring.js';

const MANAGER_SCALES = ['C1', 'B1', 'B2', 'B3'];
const ROLE_WORDS = ['Specialist', 'Officer', 'Analyst', 'Coordinator', 'Associate', 'Advisor'];

// ---------------------------------------------------------------------------
// Small deterministic helpers (no rng involved)
// ---------------------------------------------------------------------------

function clamp(x, lo, hi) {
  return Math.min(hi, Math.max(lo, x));
}

/** Split `total` into `parts` integers as evenly as possible, summing to total. */
function splitEvenly(total, parts) {
  const base = Math.floor(total / parts);
  let remainder = total - base * parts;
  const out = [];
  for (let i = 0; i < parts; i++) {
    out.push(base + (i < remainder ? 1 : 0));
  }
  return out;
}

/** Partition n people into teams sized within [min, max] (lead included), summing to n. */
function partitionTeams(n, min, max) {
  if (n <= 0) return [];
  let k = Math.max(1, Math.ceil(n / max));
  while (k > 1 && k * min > n) k--;
  return splitEvenly(n, k);
}

// ---------------------------------------------------------------------------
// Date helpers (UTC, ISO 'YYYY-MM-DD' strings)
// ---------------------------------------------------------------------------

function parseDate(s) {
  return new Date(`${s}T00:00:00Z`);
}
function formatDate(d) {
  return d.toISOString().slice(0, 10);
}
function addDays(d, n) {
  return new Date(d.getTime() + n * 86400000);
}
function daysBetween(a, b) {
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}
function clipDate(d, lo, hi) {
  if (d.getTime() < lo.getTime()) return lo;
  if (d.getTime() > hi.getTime()) return hi;
  return d;
}

// ---------------------------------------------------------------------------
// Score distribution helper for the workshop
// ---------------------------------------------------------------------------

/** n integers in [min, max] summing exactly to `sum`, built by random top-up. */
function distributeScores(rng, n, sum, min, max) {
  const arr = new Array(n).fill(min);
  let remaining = sum - n * min;
  let guard = 0;
  while (remaining > 0 && guard < 100000) {
    const idx = rng.int(0, n - 1);
    if (arr[idx] < max) {
      arr[idx]++;
      remaining--;
    }
    guard++;
  }
  return arr;
}

/**
 * Choose which catalogue entries (from `educationalEntries`, all tagged
 * `educational: true`) become the "In use" proposals, so that their
 * novelty/horizon tags match `noveltyTargets` / `horizonTargets` exactly.
 *
 * Uses constraint propagation: whenever a novelty (or horizon) has exactly
 * one remaining horizon (or novelty) bucket that can still supply entries,
 * that assignment is forced; this repeats until every target is resolved.
 * Where a bucket has more entries available than are needed, the specific
 * entries taken are chosen with a seeded shuffle, so there is still a real
 * (but deterministic) choice involved. Throws if the catalogue cannot
 * satisfy the targets — content/mock-outputs.js is designed so it always can.
 */
function pickInUseSet(rng, educationalEntries, noveltyTargets, horizonTargets) {
  const groups = new Map(); // "novelty__horizon" -> entries[]
  for (const e of educationalEntries) {
    const key = `${e.novelty}__${e.horizon}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(e);
  }

  const novelties = Object.keys(noveltyTargets);
  const horizons = Object.keys(horizonTargets);
  const noveltyRemaining = { ...noveltyTargets };
  const horizonRemaining = { ...horizonTargets };
  const bucketAvail = (n, h) => (groups.get(`${n}__${h}`) || []).length;
  const chosenCounts = new Map();
  const takeFrom = (n, h) => (chosenCounts.get(`${n}__${h}`) || 0);

  let changed = true;
  while (changed) {
    changed = false;
    for (const n of novelties) {
      if (noveltyRemaining[n] === 0) continue;
      const options = horizons.filter(
        (h) => bucketAvail(n, h) - takeFrom(n, h) > 0 && horizonRemaining[h] > 0
      );
      if (options.length === 1) {
        const h = options[0];
        const take = Math.min(bucketAvail(n, h) - takeFrom(n, h), noveltyRemaining[n], horizonRemaining[h]);
        if (take > 0) {
          const key = `${n}__${h}`;
          chosenCounts.set(key, (chosenCounts.get(key) || 0) + take);
          noveltyRemaining[n] -= take;
          horizonRemaining[h] -= take;
          changed = true;
        }
      }
    }
    for (const h of horizons) {
      if (horizonRemaining[h] === 0) continue;
      const options = novelties.filter(
        (n) => bucketAvail(n, h) - takeFrom(n, h) > 0 && noveltyRemaining[n] > 0
      );
      if (options.length === 1) {
        const n = options[0];
        const take = Math.min(bucketAvail(n, h) - takeFrom(n, h), noveltyRemaining[n], horizonRemaining[h]);
        if (take > 0) {
          const key = `${n}__${h}`;
          chosenCounts.set(key, (chosenCounts.get(key) || 0) + take);
          noveltyRemaining[n] -= take;
          horizonRemaining[h] -= take;
          changed = true;
        }
      }
    }
  }

  const unresolved = Object.values(noveltyRemaining).reduce((s, v) => s + v, 0);
  if (unresolved !== 0) {
    throw new Error(
      'content/mock-outputs.js cannot satisfy the requested In-use novelty/horizon counts; adjust the catalogue tags.'
    );
  }

  const chosen = [];
  for (const [key, count] of chosenCounts) {
    if (count <= 0) continue;
    const entries = groups.get(key);
    const shuffled = rng.shuffle(entries);
    for (let i = 0; i < count; i++) chosen.push(shuffled[i]);
  }
  return chosen;
}

// ===========================================================================
// generateDataset
// ===========================================================================

export function generateDataset(params, items, outputsCatalogue) {
  const rng = createRng(params.seed);

  const itemsByScale = new Map();
  for (const item of items) {
    if (!itemsByScale.has(item.scale)) itemsByScale.set(item.scale, []);
    itemsByScale.get(item.scale).push(item);
  }
  const scaleIds = Object.keys(params.scales);

  // -- id / name generators --------------------------------------------------
  let personCounter = 0;
  let deptCounter = 0;
  let teamCounter = 0;
  const nextPersonId = () => `p${String(++personCounter).padStart(4, '0')}`;
  const nextDeptId = () => `dept${String(++deptCounter).padStart(2, '0')}`;
  const nextTeamId = () => `team${String(++teamCounter).padStart(3, '0')}`;

  const usedNames = new Set();
  function drawName() {
    const { firstNames, lastNames } = params.names;
    let full;
    let guard = 0;
    do {
      const first = rng.pick(firstNames);
      const last = rng.pick(lastNames);
      full = `${first} ${last}`;
      guard++;
    } while (usedNames.has(full) && guard < 100000);
    usedNames.add(full);
    return full;
  }

  const people = [];
  const departments = [];
  const teams = [];
  const peopleById = new Map();

  function makePerson({ title, officeId, departmentId, teamId, managerId, isLeader }) {
    const person = {
      id: nextPersonId(),
      name: drawName(),
      title,
      officeId,
      departmentId: departmentId ?? null,
      teamId: teamId ?? null,
      managerId: managerId ?? null,
      isLeader: !!isLeader,
    };
    people.push(person);
    peopleById.set(person.id, person);
    return person;
  }

  /** Build teams (with a lead + members) covering `n` people inside `dept`. */
  function buildTeams(n, dept, office, directorId) {
    const teamOut = [];
    const sizes = partitionTeams(n, params.teamSize.min, params.teamSize.max);
    sizes.forEach((size, i) => {
      const team = {
        id: nextTeamId(),
        departmentId: dept.id,
        officeId: office.id,
        leadId: null,
        name: `${dept.name} team ${i + 1}`,
      };
      const lead = makePerson({
        title: `Team lead, ${dept.name}`,
        officeId: office.id,
        departmentId: dept.id,
        teamId: team.id,
        managerId: directorId,
        isLeader: true,
      });
      team.leadId = lead.id;
      for (let m = 0; m < size - 1; m++) {
        const role = rng.pick(ROLE_WORDS);
        makePerson({
          title: `${role}, ${dept.name}`,
          officeId: office.id,
          departmentId: dept.id,
          teamId: team.id,
          managerId: lead.id,
          isLeader: false,
        });
      }
      teamOut.push(team);
    });
    return teamOut;
  }

  // -- Organisation: DG first (other offices' chiefs report to the DG) -------
  const dgOfficeParam = params.offices.find((o) => o.id === 'dg');
  const dgPerson = makePerson({
    title: 'Director General',
    officeId: 'dg',
    departmentId: null,
    teamId: null,
    managerId: null,
    isLeader: true,
  });
  const dgTeam = {
    id: nextTeamId(),
    departmentId: null,
    officeId: 'dg',
    leadId: dgPerson.id,
    name: "Director General's office",
  };
  teams.push(dgTeam);
  const dgStaffCount = dgOfficeParam.headcount - 1;
  for (let i = 0; i < dgStaffCount; i++) {
    const role = rng.pick(ROLE_WORDS);
    makePerson({
      title: `${role}, Director General's office`,
      officeId: 'dg',
      departmentId: null,
      teamId: dgTeam.id,
      managerId: dgPerson.id,
      isLeader: false,
    });
  }

  const officeChiefIds = { dg: dgPerson.id };
  let eiDept = null;
  let eiDirector = null;
  let eiExperts = [];

  for (const office of params.offices) {
    if (office.id === 'dg') continue;

    const chief = makePerson({
      title: `Chief, ${office.name}`,
      officeId: office.id,
      departmentId: null,
      teamId: null,
      managerId: dgPerson.id,
      isLeader: true,
    });
    officeChiefIds[office.id] = chief.id;

    const deptNames = office.departments;

    if (office.id === 'edu') {
      const eiIndex = deptNames.indexOf('Education Innovation');
      const otherDeptNames = deptNames.filter((_, i) => i !== eiIndex);
      const remaining = office.headcount - 1 - deptNames.length - 7;
      const otherSizes = splitEvenly(remaining, otherDeptNames.length);
      let otherIdx = 0;

      for (const deptName of deptNames) {
        const dept = { id: nextDeptId(), officeId: office.id, name: deptName, headId: null };
        const director = makePerson({
          title: `Director, ${deptName}`,
          officeId: office.id,
          departmentId: dept.id,
          teamId: null,
          managerId: chief.id,
          isLeader: true,
        });
        dept.headId = director.id;
        departments.push(dept);

        if (deptName === 'Education Innovation') {
          eiDept = dept;
          eiDirector = director;
          for (let i = 0; i < 7; i++) {
            const expert = makePerson({
              title: 'Senior expert, Education Innovation',
              officeId: office.id,
              departmentId: dept.id,
              teamId: null,
              managerId: director.id,
              isLeader: false,
            });
            eiExperts.push(expert);
          }
        } else {
          const size = otherSizes[otherIdx++];
          const built = buildTeams(size, dept, office, director.id);
          teams.push(...built);
        }
      }
    } else {
      const numDepts = deptNames.length;
      const remaining = office.headcount - 1 - numDepts;
      const sizes = splitEvenly(remaining, numDepts);
      deptNames.forEach((deptName, i) => {
        const dept = { id: nextDeptId(), officeId: office.id, name: deptName, headId: null };
        const director = makePerson({
          title: `Director, ${deptName}`,
          officeId: office.id,
          departmentId: dept.id,
          teamId: null,
          managerId: chief.id,
          isLeader: true,
        });
        dept.headId = director.id;
        departments.push(dept);
        const built = buildTeams(sizes[i], dept, office, director.id);
        teams.push(...built);
      });
    }
  }

  const offices = params.offices.map((o) => ({
    id: o.id,
    name: o.name,
    headcount: o.headcount,
    chiefId: officeChiefIds[o.id],
  }));

  // -- viewer / manager --------------------------------------------------
  const manager = {
    personId: eiDirector.id,
    name: eiDirector.name,
    title: eiDirector.title,
    departmentId: eiDirector.departmentId,
    reportIds: eiExperts.map((p) => p.id),
  };
  const firstExpert = eiExperts[0];
  const viewer = {
    personId: firstExpert.id,
    name: firstExpert.name,
    title: firstExpert.title,
    officeId: 'edu',
    departmentId: firstExpert.departmentId,
    managerId: firstExpert.managerId,
  };

  // -- Office effects (all 13 scales, every office) --------------------------
  const officeEffect = {};
  for (const office of params.offices) {
    officeEffect[office.id] = {};
    for (const scale of scaleIds) {
      officeEffect[office.id][scale] = rng.uniform(-params.officeEffectMax, params.officeEffectMax);
    }
  }

  // -- Manager effects (C1, B1, B2, B3; every distinct manager) --------------
  const managerIds = [...new Set(people.map((p) => p.managerId).filter((id) => id !== null))].sort();
  const managerEffect = {};
  for (const mgrId of managerIds) {
    managerEffect[mgrId] = {};
    for (const scale of MANAGER_SCALES) {
      managerEffect[mgrId][scale] = rng.uniform(-params.managerEffectMax, params.managerEffectMax);
    }
  }

  // -- Respondent sampling -----------------------------------------------
  const peopleByOffice = new Map();
  for (const p of people) {
    if (!peopleByOffice.has(p.officeId)) peopleByOffice.set(p.officeId, []);
    peopleByOffice.get(p.officeId).push(p.id);
  }
  const eiExpertIds = eiExperts.map((p) => p.id);
  const eiExpertIdSet = new Set(eiExpertIds);

  const selected = new Set();
  for (const office of params.offices) {
    const officePeople = peopleByOffice.get(office.id) || [];
    const quota = Math.round(office.headcount * params.responseRate);
    const shuffled = rng.shuffle(officePeople);
    let picked = shuffled.slice(0, quota);

    if (office.id === 'edu') {
      const pickedSet = new Set(picked);
      for (const id of eiExpertIds) pickedSet.add(id);
      // If forcing EI experts pushed us over quota, drop non-EI respondents
      // starting from the end of the shuffle order used to build `picked`.
      let i = picked.length - 1;
      while (pickedSet.size > quota && i >= 0) {
        const candidate = picked[i];
        if (!eiExpertIdSet.has(candidate) && pickedSet.has(candidate)) {
          pickedSet.delete(candidate);
        }
        i--;
      }
      picked = [...pickedSet];
    }
    for (const id of picked) selected.add(id);
  }
  const respondentIds = [...selected].sort();

  // -- Responses: scale outer loop, respondent inner loop, item innermost ----
  const responseMap = new Map();
  for (const id of respondentIds) {
    const person = peopleById.get(id);
    responseMap.set(id, {
      personId: id,
      officeId: person.officeId,
      departmentId: person.departmentId,
      managerId: person.managerId,
      items: {},
    });
  }

  for (const scale of scaleIds) {
    const scaleParams = params.scales[scale];
    const scaleItems = itemsByScale.get(scale) || [];

    // EI senior experts: draw all 7 noise values for this scale, then
    // de-mean them so the group mean lands exactly on its target.
    const eiNoiseRaw = eiExperts.map(() => rng.normal(0, scaleParams.sd));
    const eiMean = eiNoiseRaw.reduce((s, v) => s + v, 0) / eiNoiseRaw.length;
    const eiNoiseById = new Map(eiExperts.map((p, i) => [p.id, eiNoiseRaw[i] - eiMean]));

    for (const id of respondentIds) {
      const person = peopleById.get(id);
      const officeEff = officeEffect[person.officeId][scale];
      const mgrEff = MANAGER_SCALES.includes(scale)
        ? (managerEffect[person.managerId]?.[scale] ?? 0)
        : 0;
      const isEI = eiExpertIdSet.has(id);
      const eduAdjust = isEI ? (params.educationInnovationAdjust[scale] ?? 0) : 0;
      const noise = isEI ? eiNoiseById.get(id) : rng.normal(0, scaleParams.sd);
      const latent = scaleParams.mean + officeEff + mgrEff + eduAdjust + noise;

      const resp = responseMap.get(id);
      for (const item of scaleItems) {
        const raw = latent + rng.normal(0, params.itemNoiseSd);
        resp.items[item.id] = Math.round(clamp(raw, 1, 5));
      }
    }
  }
  const responses = respondentIds.map((id) => responseMap.get(id));

  // -- Proposals ---------------------------------------------------------
  // Choose the 12 "In use" proposals up front: only from educational
  // catalogue entries, and only a combination whose novelty/horizon tags
  // match params.performance.noveltyInUse / horizonInUse exactly. Every
  // other proposal draws from the remaining 28 entries (any tags) and
  // simply keeps its entry's own novelty/horizon.
  const perf = params.performance;
  const educationalEntries = outputsCatalogue.filter((e) => e.educational);
  const inUseEntrySet = new Set(pickInUseSet(rng, educationalEntries, perf.noveltyInUse, perf.horizonInUse));
  const shuffledInUse = rng.shuffle([...inUseEntrySet]);
  const shuffledOther = rng.shuffle(outputsCatalogue.filter((e) => !inUseEntrySet.has(e)));
  const windowStart = parseDate(perf.submissionWindow.start);
  const windowEnd = parseDate(perf.submissionWindow.end);
  const asOf = parseDate(params.asOf);
  const windowSpan = daysBetween(windowStart, windowEnd);

  const officeWeights = { ao: 1, cpd: 1, dd: 3, edu: 3, sp: 1, fin: 1, dg: 0 };
  const weightedOffices = params.offices.filter((o) => (officeWeights[o.id] || 0) > 0);
  const totalWeight = weightedOffices.reduce((s, o) => s + officeWeights[o.id], 0);
  const departmentsByOffice = new Map();
  for (const d of departments) {
    if (!departmentsByOffice.has(d.officeId)) departmentsByOffice.set(d.officeId, []);
    departmentsByOffice.get(d.officeId).push(d);
  }

  function pickWeightedOffice() {
    let r = rng.next() * totalWeight;
    for (const o of weightedOffices) {
      r -= officeWeights[o.id];
      if (r <= 0) return o;
    }
    return weightedOffices[weightedOffices.length - 1];
  }

  function drawDaysToDecision() {
    return Math.max(perf.daysToDecision.min, Math.round(rng.lognormal(perf.daysToDecision.median, perf.daysToDecision.sigma)));
  }
  function drawDaysToImplement() {
    return Math.max(perf.daysToImplement.min, Math.round(rng.lognormal(perf.daysToImplement.median, perf.daysToImplement.sigma)));
  }

  const proposalPlans = [];
  for (let i = 0; i < perf.goStages.inUse; i++) proposalPlans.push('inUse');
  for (let i = 0; i < perf.goStages.beingImplemented; i++) proposalPlans.push('beingImplemented');
  for (let i = 0; i < perf.counts.stop; i++) proposalPlans.push('stop');
  for (let i = 0; i < perf.counts.park; i++) proposalPlans.push('park');
  for (let i = 0; i < perf.counts.awaitingDecision; i++) proposalPlans.push('awaitingDecision');

  let inUsePtr = 0;
  let otherPtr = 0;
  const proposals = proposalPlans.map((kind, idx) => {
    const catalogueEntry = kind === 'inUse' ? shuffledInUse[inUsePtr++] : shuffledOther[otherPtr++];
    const office = pickWeightedOffice();
    const officeDepts = departmentsByOffice.get(office.id) || [];
    const dept = rng.pick(officeDepts);

    let submitted;
    let decidedDate = null;
    let inUseDate = null;
    let decision = null;
    let status;
    let daysToDecision = null;
    let daysToImplement = null;

    if (kind === 'inUse') {
      submitted = addDays(windowStart, rng.int(0, Math.floor(windowSpan * 0.55)));
      let dtd = drawDaysToDecision();
      decidedDate = clipDate(addDays(submitted, dtd), submitted, asOf);
      dtd = daysBetween(submitted, decidedDate);
      let dti = drawDaysToImplement();
      inUseDate = clipDate(addDays(decidedDate, dti), decidedDate, asOf);
      dti = daysBetween(decidedDate, inUseDate);
      decision = 'go';
      status = 'In use';
      daysToDecision = dtd;
      daysToImplement = dti;
    } else if (kind === 'beingImplemented') {
      decidedDate = addDays(asOf, -rng.int(1, 150));
      let dtd = drawDaysToDecision();
      submitted = clipDate(addDays(decidedDate, -dtd), windowStart, windowEnd);
      dtd = daysBetween(submitted, decidedDate);
      inUseDate = null;
      decision = 'go';
      status = 'Being implemented';
      daysToDecision = dtd;
      daysToImplement = null;
    } else if (kind === 'stop' || kind === 'park') {
      submitted = addDays(windowStart, rng.int(0, Math.floor(windowSpan * 0.85)));
      let dtd = drawDaysToDecision();
      decidedDate = clipDate(addDays(submitted, dtd), submitted, asOf);
      dtd = daysBetween(submitted, decidedDate);
      inUseDate = null;
      decision = kind;
      status = kind === 'stop' ? 'Stopped' : 'Parked';
      daysToDecision = dtd;
      daysToImplement = null;
    } else {
      // awaitingDecision
      submitted = clipDate(addDays(asOf, -rng.int(1, 45)), windowStart, windowEnd);
      decidedDate = null;
      inUseDate = null;
      decision = null;
      status = 'Awaiting decision';
      daysToDecision = null;
      daysToImplement = null;
    }

    return {
      id: `prop${String(idx + 1).padStart(2, '0')}`,
      title: catalogueEntry.title,
      officeId: office.id,
      departmentId: dept.id,
      submitted: formatDate(submitted),
      decision,
      decided: decidedDate ? formatDate(decidedDate) : null,
      inUse: inUseDate ? formatDate(inUseDate) : null,
      status,
      novelty: catalogueEntry.novelty,
      horizon: catalogueEntry.horizon,
      change: status === 'In use' ? catalogueEntry.change : null,
      daysToDecision,
      daysToImplement,
    };
  });

  // -- Workshop ------------------------------------------------------------
  const ws = params.workshop;
  const n = ws.participants;
  const targetPreSum = Math.round(ws.targetMeans.pre * n);
  const targetPostSum = Math.round(ws.targetMeans.post * n);
  const targetFollowUpSum = Math.round(ws.targetMeans.followUp * n);

  // pre: within preRange, with at most one participant allowed one point
  // below preRange.min (e.g. a single 1 when min is 2), for realism.
  const pre = distributeScores(rng, n, targetPreSum, ws.preRange.min, ws.preRange.max);
  if (rng.next() < 0.5) {
    const atMin = pre.map((v, i) => ({ v, i })).filter((o) => o.v === ws.preRange.min);
    if (atMin.length) {
      const chosen = atMin[rng.int(0, atMin.length - 1)];
      const room = pre.map((_, i) => i).filter((i) => i !== chosen.i && pre[i] < ws.preRange.max);
      if (room.length) {
        const bumpIdx = room[rng.int(0, room.length - 1)];
        pre[chosen.i] = ws.preRange.min - 1;
        pre[bumpIdx]++;
      }
    }
  }

  // post: within postRange, and never below this same participant's pre.
  const post = pre.map((v) => Math.max(v, ws.postRange.min));
  {
    let diff = targetPostSum - post.reduce((s, v) => s + v, 0);
    let guard = 0;
    while (diff !== 0 && guard < 100000) {
      const idx = rng.int(0, n - 1);
      if (diff > 0 && post[idx] < ws.postRange.max) {
        post[idx]++;
        diff--;
      } else if (diff < 0 && post[idx] > Math.max(pre[idx], ws.postRange.min)) {
        post[idx]--;
        diff++;
      }
      guard++;
    }
  }

  // usedSince: exactly ws.usedSince participants, chosen by a seeded shuffle.
  const order = rng.shuffle([...Array(n).keys()]);
  const usedSinceSet = new Set(order.slice(0, ws.usedSince));

  // followUp: within followUpRange, never above this same participant's
  // post, and filled so the "used since" group is prioritised first —
  // which guarantees its average ends up higher than the rest (with a
  // corrective swap loop as a safety net for unusual parameter choices).
  const followUp = new Array(n).fill(ws.followUpRange.min);
  {
    let remaining = targetFollowUpSum - n * ws.followUpRange.min;
    const uOrder = rng.shuffle([...Array(n).keys()].filter((i) => usedSinceSet.has(i)));
    const nOrder = rng.shuffle([...Array(n).keys()].filter((i) => !usedSinceSet.has(i)));
    const cap = (i) => Math.min(ws.followUpRange.max, post[i]);

    function fillRound(idxOrder) {
      let progress = true;
      while (remaining > 0 && progress) {
        progress = false;
        for (const idx of idxOrder) {
          if (remaining <= 0) break;
          if (followUp[idx] < cap(idx)) {
            followUp[idx]++;
            remaining--;
            progress = true;
          }
        }
      }
    }
    fillRound(uOrder);
    fillRound(nOrder);

    const groupAvg = (idxOrder) => idxOrder.reduce((s, i) => s + followUp[i], 0) / idxOrder.length;
    let guard = 0;
    while (groupAvg(uOrder) <= groupAvg(nOrder) && guard < 100000) {
      const upIdx = uOrder.find((i) => followUp[i] < cap(i));
      const downIdx = nOrder.find((i) => followUp[i] > ws.followUpRange.min);
      if (upIdx === undefined || downIdx === undefined) break;
      followUp[upIdx]++;
      followUp[downIdx]--;
      guard++;
    }
  }

  const participants = [];
  for (let i = 0; i < n; i++) {
    participants.push({
      id: `wp${String(i + 1).padStart(2, '0')}`,
      pre: pre[i],
      post: post[i],
      followUp: followUp[i],
      usedSince: usedSinceSet.has(i),
    });
  }

  const workshop = {
    title: ws.title,
    date: ws.date,
    followUpDate: ws.followUpDate,
    item: ws.item,
    followUpItem: ws.followUpItem,
    participants,
  };

  return {
    seed: params.seed,
    asOf: params.asOf,
    offices,
    departments,
    teams,
    people,
    responses,
    viewer,
    manager,
    proposals,
    workshop,
  };
}

export function performanceSummary(proposals) {
  const byDecision = { go: 0, stop: 0, park: 0, awaiting: 0 };
  let inUse = 0;
  let beingImplemented = 0;
  const byNovelty = {};
  const byHorizon = {};
  const daysToDecisionVals = [];
  const daysToImplementVals = [];

  for (const p of proposals) {
    if (p.decision === 'go') byDecision.go++;
    else if (p.decision === 'stop') byDecision.stop++;
    else if (p.decision === 'park') byDecision.park++;
    else byDecision.awaiting++;

    if (p.status === 'In use') inUse++;
    if (p.status === 'Being implemented') beingImplemented++;

    if (p.novelty) byNovelty[p.novelty] = (byNovelty[p.novelty] || 0) + 1;
    if (p.horizon) byHorizon[p.horizon] = (byHorizon[p.horizon] || 0) + 1;

    if (p.daysToDecision !== null && p.daysToDecision !== undefined) daysToDecisionVals.push(p.daysToDecision);
    if (p.daysToImplement !== null && p.daysToImplement !== undefined) daysToImplementVals.push(p.daysToImplement);
  }

  return {
    total: proposals.length,
    byDecision,
    inUse,
    beingImplemented,
    medianDaysToDecision: median(daysToDecisionVals),
    medianDaysToImplement: median(daysToImplementVals),
    byNovelty,
    byHorizon,
  };
}
