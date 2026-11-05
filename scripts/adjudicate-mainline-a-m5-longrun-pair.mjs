import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { captureBuildInputs } from "./build-mainline-a-preserved.mjs";
import { validateM1Build } from "./capture-mainline-a-m1-browser.mjs";
import { inspectM5LongRuns, inspectM5ResourceGuard, M5_LONGRUN_POLICY,
  M5_LONGRUN_DRIVER_PATHS, M5_NATURAL_DOM_SETTLE_POLICY } from "./capture-mainline-a-m5-longrun.mjs";
import { inspectM5Quality } from "./mainline-a-m5-longrun-workload.mjs";
import { readBrowserCapacity, inspectBrowserCapacity, CONSTRAINED_DEVELOPMENT_BROWSER_RESOURCE_POLICY } from "./mainline-a-browser-resource-guard.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const COUNTERS = ["documents", "nodes", "jsEventListeners"];
const DOM_ISSUE = "DOM-counter-trend-review-required";
const PREIMAGE = Object.freeze({ path: "scripts/capture-mainline-a-m5-longrun.mjs", bytes: 34157,
  sha256: "35c5ab0e2182b453b549d96310dbe4b65d6ab7bdba31373c123e4d52b846fcc9",
  archive: "output/playwright/mainline-a-m5-20261028/capture-mainline-a-m5-longrun.pre-single-device.mjs" });
const BOUNDARY = Object.freeze({ candidateOnly: true, hold: true, notAdmitted: true,
  scientificPayloadWriteback: false, wholeM5FreezeApproved: false, humanArtApproved: false,
  rightsApproved: false, physicalMobileApproved: false, publicReleaseApproved: false });
const canonical = (v) => JSON.stringify(v, (_, entry) => entry && typeof entry === "object" && !Array.isArray(entry)
  ? Object.fromEntries(Object.entries(entry).sort(([a], [b]) => a.localeCompare(b))) : entry);
const same = (a, b) => canonical(a) === canonical(b);
const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
const ensure = (ok, message) => { if (!ok) throw new Error(`m5-pair:${message}`); };
const stamp = (v) => Date.parse(v);
const validDOM = (v) => v?.source === "CDP-Memory.getDOMCounters" && v.status === "observed"
  && v.sessionDetached === true && Number.isFinite(stamp(v.at))
  && COUNTERS.every((key) => Number.isSafeInteger(v[key]) && v[key] >= 0);
function baselineCameraStable(first, last) {
  if (!first || !last || first.source !== "read-only-actual-camera-dom-markers" || first.source !== last.source
    || first.focusState !== "idle" || last.focusState !== "idle" || first.selectedId !== "" || last.selectedId !== "") return false;
  for (const key of ["position", "target", "direction", "up", "quaternion"]) {
    const size = key === "quaternion" ? 4 : 3;
    if (![first[key], last[key]].every((v) => Array.isArray(v) && v.length === size && v.every(Number.isFinite))) return false;
    const signs = key === "quaternion" ? [1, -1] : [1];
    if (Math.min(...signs.map((sign) => Math.max(...first[key].map((v, i) => Math.abs(v - sign * last[key][i]))))) > .001) return false;
  }
  return ["fov", "zoom", "targetDistance"].every((key) => Number.isFinite(first[key]) && first[key] > 0
    && Number.isFinite(last[key]) && last[key] > 0 && Math.abs(first[key] - last[key]) <= .001);
}
const relative = (p) => path.relative(ROOT, p).replaceAll("\\", "/");
function inside(p) {
  ensure(typeof p === "string" && p.length > 0, "path-required");
  const absolute = path.resolve(ROOT, p), rel = path.relative(ROOT, absolute);
  ensure(rel && !rel.startsWith(`..${path.sep}`) && rel !== ".." && !path.isAbsolute(rel), "path-outside-workspace");
  return absolute;
}

export function parseM5PairOptions(args) {
  const allowed = new Set(["build", "desktop-dir", "mobile-dir", "desktop-review", "out"]), values = {};
  ensure(args.length % 2 === 0, "arguments-must-be-pairs");
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].slice(2);
    ensure(args[i].startsWith("--") && allowed.has(key) && !(key in values)
      && args[i + 1] && !args[i + 1].startsWith("--"), "unknown-or-duplicate-argument");
    values[key] = inside(args[i + 1]);
  }
  ensure([...allowed].every((key) => values[key]), "all-five-explicit-paths-required");
  ensure(values["desktop-dir"] !== values["mobile-dir"], "independent-input-directories-required");
  ensure(!Object.entries(values).some(([key, value]) => key !== "out"
    && (value === values.out || value.startsWith(`${values.out}${path.sep}`)
      || values.out.startsWith(`${value}${path.sep}`))), "output-must-be-separate");
  return values;
}

/** Keep the original result false when its DOM advisory is separately adjudicated. */
export function inspectM5PairMachineGate(machine) {
  const checks = {
    onlyDOMOutstanding: Array.isArray(machine?.issues) && machine.issues.every((issue) => issue === DOM_ISSUE)
      && new Set(machine.issues).size === machine.issues.length,
    legacy: machine?.legacy?.status === "verified-current-source-local-longrun",
    official: machine?.officialChecksCoveredByLegacy?.passed === true,
    raw: machine?.rawChecks?.length === 2 && machine.rawChecks.every((row) => row.ok === true),
    boundaries: machine?.singleBoundaryChecks?.length === 2 && machine.singleBoundaryChecks.every((row) => row.ok === true),
    combinedRaw: machine?.combinedRaw?.ok === true, clock: machine?.clock?.ok === true,
    series: machine?.series?.length === 2 && machine.series.every((row) => row.ok === true),
    targets: machine?.targets?.length === 2 && machine.targets.every((row) => row.ok === true),
    workload: machine?.workloadChecks?.length === 2 && machine.workloadChecks.every((row) => row.ok === true && row.cycles === 6 && row.completeWindows === 6),
    advisories: machine?.advisoryReview?.ok === true,
    session: !machine?.issues?.includes("fresh-sequential-browser-evidence-invalid"),
    consistentOriginalStatus: machine?.domCounterReview?.ok === true
      ? machine.ok === true && machine.issues.length === 0
      : machine?.domCounterReview?.ok === false && machine.ok === false && same(machine.issues, [DOM_ISSUE]),
  };
  return { ok: Object.values(checks).every(Boolean), checks,
    issues: Object.entries(checks).filter(([, ok]) => !ok).map(([name]) => `${name}-not-proven`) };
}

/** Recorded samples are checked against their complete retained progress chain, not their ok flags alone. */
export function inspectM5PairGuardChain(log, progress, session, observation, plan) {
  const issues = [], device = session?.device;
  const guardRecord = (row) => Object.fromEntries(["at", "device", "freePhysicalBytes", "commitLimitBytes", "committedBytes", "ok", "issues"].map((key) => [key, row?.[key]]));
  if (!same(log?.policy, M5_LONGRUN_POLICY.resourceGuard)
    || !same(plan?.policy?.resourceGuard, M5_LONGRUN_POLICY.resourceGuard)) issues.push("strict-guard-policy-mismatch");
  const all = log?.samples ?? [];
  const fullJournal = (progress ?? []).filter((row) => row.kind === "resource-guard").map((row) => row.record);
  if (!same(all.map(guardRecord), fullJournal.map(guardRecord))) issues.push("full-retained-guard-journal-different");
  const selected = all.filter((row) => row.device === device);
  const journal = (progress ?? []).filter((row) => row.kind === "resource-guard" && row.record?.device === device).map((row) => row.record);
  if (!selected.length || !same(selected.map(guardRecord), journal.map(guardRecord))) issues.push("retained-guard-chain-missing-or-different");
  if (selected.some((row) => !inspectM5ResourceGuard(row).ok || row.ok !== true || row.issues?.length !== 0)) issues.push("selected-device-guard-failed");
  if (!session?.profile || selected.slice(1).some((row) => !inspectM5Quality(row.runtimeProfile,
    { device, preflightQuality: session.profile }).ok)) issues.push("periodic-fixed-quality-not-proven");
  if (!all.some((row) => row.device === "preflight" && stamp(row.at) <= stamp(session?.launchedAt)
    && inspectM5ResourceGuard(row).ok && row.ok === true)) issues.push("preflight-guard-missing");
  const times = selected.map((row) => stamp(row.at));
  if (times.some((at, i) => !Number.isFinite(at) || (i && at <= times[i - 1]))) issues.push("guard-clock-order-invalid");
  // The pinned monitor performs fifteen-second waits and bounded CIM reads. Keep
  // actual observed gaps visible; do not impose a new post-hoc sampling tolerance.
  const final = all.filter((row) => row.device === "final");
  const endBracket = Math.max(times.at(-1) ?? NaN, ...final.map((row) => stamp(row.at)));
  if (!(times[0] <= stamp(observation?.startedAt) && endBracket >= stamp(observation?.endedAt))) issues.push("observation-guard-coverage-missing");
  if (selected.some((row) => stamp(row.at) > stamp(session?.closedAt))) issues.push("guard-session-time-mismatch");
  if (device === "mobile" && (!final.length || final.some((row) => !inspectM5ResourceGuard(row).ok || row.ok !== true))) issues.push("mobile-final-guard-not-proven");
  return { ok: issues.length === 0, issues, device, policy: log?.policy,
    samples: selected.length, firstAt: selected[0]?.at ?? null, lastAt: selected.at(-1)?.at ?? null,
    maxObservedGapMs: times.length > 1 ? Math.max(...times.slice(1).map((at, i) => at - times[i])) : null,
    minimumPhysicalBytes: selected.length ? Math.min(...selected.map((row) => row.freePhysicalBytes)) : null,
    minimumCommitHeadroomBytes: selected.length ? Math.min(...selected.map((row) => row.commitLimitBytes - row.committedBytes)) : null,
    excludedOtherDeviceSamples: all.filter((row) => ![device, "preflight", "final"].includes(row.device)).length };
}

/** Additional same-session evidence resolves a review; it never changes old counters or the machine result. */
export function inspectM5MobileNaturalSettle(settle, workload, observation, session) {
  const issues = [], samples = settle?.samples ?? [], frozen = workload?.warmup?.frozen;
  const reference = workload?.cycles?.[0]?.stages?.find((row) => row.name === "returned-baseline");
  const last = workload?.cycles?.at(-1)?.stages?.at(-1);
  if (!validDOM(reference?.domCounters) || reference?.longrun?.running !== true
    || reference?.longrun?.observationCount !== 0) issues.push("matched-running-reference-unavailable");
  if (session?.device !== "mobile" || observation?.device !== "mobile" || frozen?.device !== "mobile") issues.push("mobile-session-required");
  if (!same(settle?.policy, M5_NATURAL_DOM_SETTLE_POLICY) || settle?.garbageCollectionRequested !== false
    || settle?.qualifiedLongrun !== false || settle?.candidateFreezeAllowed !== false
    || settle?.status !== "observed-additional-review-evidence") issues.push("settle-scope-invalid");
  if (!same(samples.map((row) => row.elapsedTargetMs), M5_NATURAL_DOM_SETTLE_POLICY.elapsedTargetsMs)) issues.push("settle-targets-incomplete");
  if (!(stamp(settle?.startedAt) >= stamp(workload?.cycles?.at(-1)?.endedAt)
    && stamp(settle?.endedAt) <= stamp(observation?.endedAt))) issues.push("settle-outside-original-observation");
  const clockOffset = stamp(workload?.anchor?.at) - workload?.anchor?.browserMs;
  let previousAt = stamp(settle?.startedAt), previousElapsed = -1;
  for (const [index, row] of samples.entries()) {
    const state = row?.state, at = stamp(row?.at), counterAt = stamp(row?.domCounters?.at), stateAt = stamp(state?.at);
    if (!validDOM(row?.domCounters)) issues.push(`sample-${index}:counter-unavailable`);
    if (!(Number.isFinite(row?.actualElapsedMs) && row.actualElapsedMs >= row.elapsedTargetMs
      && row.actualElapsedMs > previousElapsed && at >= previousAt && at <= counterAt && counterAt <= stateAt
      && stateAt <= stamp(observation?.endedAt) && Math.abs(at - stamp(settle.startedAt) - row.actualElapsedMs) <= 1_200
      && Number.isFinite(clockOffset) && Math.abs(stateAt - state?.browserMs - clockOffset) <= 1_200)) issues.push(`sample-${index}:clock-or-coverage-invalid`);
    if (!state || state.runtimeBuildId !== session.runtimeBuildId || state.releaseBoundary !== "candidate-only-hold-not-admitted"
      || state.scientificPayloadWriteback !== "false" || state.visibility !== "visible" || state.canvasCount !== 1
      || state.longrun?.attached !== true || state.longrun?.running !== true || state.longrun?.observationCount !== 0
      || state.selectedId !== null || state.image !== null || state.viewer !== null || state.journey !== null
      || state.borrowedCount !== 0) issues.push(`sample-${index}:not-matched-running-baseline`);
    if (!same(state?.resources, last?.resources)) issues.push(`sample-${index}:resource-identity-changed`);
    if (!inspectM5Quality(state, frozen, { stageName: "returned-baseline", requireWarmStage: true }).ok) issues.push(`sample-${index}:quality-drift`);
    if (!baselineCameraStable(last?.camera, state?.camera)) issues.push(`sample-${index}:camera-drift`);
    if (row.elapsedTargetMs >= 60_000 && validDOM(reference?.domCounters)
      && COUNTERS.some((key) => !(row?.domCounters?.[key] <= reference.domCounters[key]))) issues.push(`sample-${index}:not-returned-with-zero-tolerance`);
    previousAt = at; previousElapsed = row?.actualElapsedMs;
  }
  return { ok: issues.length === 0, issues, status: issues.length ? "review-required" : "resolved-mobile-lifecycle-with-same-session-natural-settle",
    comparison: "60s and 120s unforced totals each <= first matched R65-running baseline; zero added counter tolerance",
    reference: reference?.domCounters ?? null, samples: samples.map((row) => ({ at: row.at, actualElapsedMs: row.actualElapsedMs, counters: row.domCounters })),
    originalMachineDOMResultUnchanged: true };
}

export function inspectM5DesktopAdjudication(review, binding, originalPins) {
  const checks = {
    status: review?.schema === "mainline-a-m5-independent-dom-review/v1"
      && review.status === "resolved-build15-desktop-lifecycle-review-with-separate-diagnostic-evidence",
    scope: review?.decision?.desktopBuildLifecycleReviewResolved === true
      && review.decision.originalLong07MachineDomCheckStill === false
      && review.decision.diagnosticIsQualifiedLongrun === false && review.decision.combinedLongrunQualified === false
      && review.decision.candidateFreezeAllowed === false && review.decision.requiresExplicitAdjudicationInAnyFutureQualification === true,
    binding: same(review?.binding, binding), originalPins: same(review?.originalLong07Pins, originalPins),
    census: review?.matchedCensus?.length === 2 && review.matchedCensus.every((row) => row.allReleased === true
      && row.allDetached === true && row.cameraIdentical === true && row.counters?.length === 6),
    cleanup: review?.cleanup?.censuses === 13 && review.cleanup.allHandlesReleased === true
      && review.cleanup.allCDPSessionsDetached === true && review.cleanup.ownedBrowserClosed === true
      && review.cleanup.allDevelopmentGuardsPassed === true,
    boundedNaturalReturn: review?.naturalSettle?.idleSamples?.length === 4
      && same(review.naturalSettle.idleSamples.map((row) => row.targetMs), [15_000, 30_000, 60_000, 120_000])
      && validDOM(review.naturalSettle.firstMatchedRunningBaseline)
      && review.naturalSettle.idleSamples.every((row) => row.R65running === true && row.selection === "none"
        && validDOM(row.counters) && row.actualMs >= row.targetMs
        && COUNTERS.every((key) => row.counters[key] <= review.naturalSettle.firstMatchedRunningBaseline[key])),
    evidenceInventory: review?.evidencePins?.length === 27 && Boolean(review?.originalReviewPin?.sha256)
      && review?.diagnosticToolPreimageChecks?.length === 12,
    boundary: review?.boundary?.candidateOnly === true && review.boundary.hold === true && review.boundary.notAdmitted === true
      && review.boundary.scientificPayloadWriteback === false && review.boundary.humanArtApproved === false
      && review.boundary.rightsApproved === false && review.boundary.physicalMobileApproved === false && review.boundary.publicReleaseApproved === false,
  };
  return { ok: Object.values(checks).every(Boolean), checks,
    issues: Object.entries(checks).filter(([, ok]) => !ok).map(([name]) => `desktop-review-${name}-invalid`),
    interpretation: "Separate same-build lifecycle adjudication; original-tail GC causality and original machine DOM result are not rewritten" };
}

function connectedShape(sample) {
  return { trees: sample?.active?.documentTrees, listeners: sample?.active?.activeListeners?.map((row) => {
    const signatureMultiplicityBins = {}, perTarget = {}, targetListenerCountBins = {};
    for (const [signature, count] of Object.entries(row.signatureMultiplicity ?? {})) {
      signatureMultiplicityBins[count] = (signatureMultiplicityBins[count] ?? 0) + 1;
      const target = signature.split("|")[0]; perTarget[target] = (perTarget[target] ?? 0) + count;
    }
    for (const count of Object.values(perTarget)) targetListenerCountBins[count] = (targetListenerCountBins[count] ?? 0) + 1;
    return { target: row.target, count: row.count, typeCounts: row.typeCounts, signatureMultiplicityBins, targetListenerCountBins };
  }) };
}

/** Re-read the actual diagnostic materials behind the independent decision. */
export async function verifyDesktopDiagnosticMaterials(review, binding, load) {
  const auditPins = review.evidencePins.filter((pin) => pin.path.endsWith("/audit.json"));
  ensure(auditPins.length === 1, "desktop-diagnostic-audit-pin-required");
  const audit = (await load(auditPins[0].path)).value;
  ensure(same(audit.initialBinding, binding) && same(audit.finalBinding, binding)
    && same(audit.initialPins, audit.finalPins) && same(audit.initialPins, review.diagnosticToolPreimageChecks.map((row) => row.recorded))
    && audit.cycles === 6 && audit.samples?.length === 13 && audit.idleSamples?.length === 4
    && audit.session?.browserClosed === true && audit.session.freshContext === true
    && audit.session.consoleErrors?.length === 0 && audit.session.pageErrors?.length === 0
    && audit.scope?.garbageCollectionRequested === false && audit.scope?.qualifiedLongrun === false
    && audit.scope?.candidateFreezeAllowed === false, "desktop-diagnostic-binding-or-scope-invalid");
  ensure(audit.guards?.length === 53 && audit.guards.every((row) => row.profile === "constrained-development"
    && same(row.policy, CONSTRAINED_DEVELOPMENT_BROWSER_RESOURCE_POLICY) && row.ok === true
    && inspectBrowserCapacity(row, CONSTRAINED_DEVELOPMENT_BROWSER_RESOURCE_POLICY).ok), "desktop-diagnostic-development-guard-invalid");
  const firstShapes = new Map(), censusRows = [];
  for (const row of audit.samples) {
    ensure(review.evidencePins.some((pin) => same(pin, row.pin)), "desktop-census-not-in-review-pins");
    const sample = (await load(row.pin.path)).value, active = sample.active, shape = connectedShape(sample);
    ensure(active?.status === "observed" && active.sessionDetached === true && active.errors?.length === 0
      && active.remoteHandleCount === active.releasedHandleCount && active.remoteHandleCount > 0
      && sample.observationRunning === true && sample.runtime?.observationCount === 0
      && sample.workload?.runtimeBuildId === binding.runtimeBuildId, "desktop-census-cleanup-or-running-state-invalid");
    const expected = review.matchedCensus.find((entry) => entry.name === sample.name);
    ensure(expected && same(shape, expected.identicalConnectedShape), "desktop-connected-census-disagrees-with-review");
    if (!firstShapes.has(sample.name)) firstShapes.set(sample.name, shape);
    ensure(same(firstShapes.get(sample.name), shape), "desktop-connected-census-grew");
    censusRows.push(sample);
  }
  const referenceSample = censusRows.find((row) => row.index === 0 && row.name === "returned-baseline");
  const reference = referenceSample?.freshUnforced;
  ensure(validDOM(reference) && same(reference, review.naturalSettle.firstMatchedRunningBaseline), "desktop-natural-reference-different");
  for (const row of audit.idleSamples) {
    const stored = (await load(path.join(path.dirname(auditPins[0].path), `idle-${row.elapsedTargetMs}.json`))).value;
    ensure(same(stored, row) && row.observationRunning === true && row.activeEnumerationDuringIdle === false
      && row.runtime?.observationCount === 0 && row.runtime.guidedSelected === "none"
      && row.runtime.resourceIdentityDigest === referenceSample.runtime.resourceIdentityDigest
      && row.runtime.buildId === binding.runtimeBuildId && validDOM(row.unforced)
      && COUNTERS.every((key) => row.unforced[key] <= reference[key]), "desktop-natural-idle-material-invalid");
  }
  return { verifiedActualDiagnosticMaterials: true, auditPin: auditPins[0], censuses: censusRows.length,
    independentlyBoundDecisionRetained: true };
}

export async function adjudicateM5LongRunPair(config) {
  await mkdir(config.out); // A new directory is mandatory; failed or successful prior evidence survives.
  const inputs = new Map(), verifiedPreimages = [];
  const loadBytes = async (p) => {
    const full = inside(p), bytes = await readFile(full), pin = { path: relative(full), bytes: bytes.length, sha256: digest(bytes) };
    const prior = inputs.get(pin.path);
    ensure(!prior || same(prior, pin), `input-drift:${pin.path}`); inputs.set(pin.path, pin);
    return { bytes, pin };
  };
  const load = async (p) => { const value = await loadBytes(p); return { ...value, value: JSON.parse(value.bytes.toString("utf8")) }; };
  const verifyPin = async (expected) => {
    ensure(expected && /^[a-f0-9]{64}$/.test(expected.sha256 ?? ""), "invalid-input-pin");
    let actual = (await loadBytes(expected.path)).pin;
    if (actual.sha256 !== expected.sha256 && expected.path === PREIMAGE.path
      && expected.sha256 === PREIMAGE.sha256 && expected.bytes === PREIMAGE.bytes) {
      actual = (await loadBytes(PREIMAGE.archive)).pin;
      ensure(actual.sha256 === expected.sha256 && actual.bytes === expected.bytes, "historical-driver-preimage-mismatch");
      verifiedPreimages.push({ recorded: expected, archive: actual }); return;
    }
    ensure(actual.sha256 === expected.sha256 && (expected.bytes === undefined || actual.bytes === expected.bytes), `pin-mismatch:${expected.path}`);
  };
  const save = async (name, data) => {
    const bytes = Buffer.from(`${JSON.stringify(data, null, 2)}\n`), full = path.join(config.out, name);
    await writeFile(full, bytes, { flag: "wx" }); return { path: relative(full), bytes: bytes.length, sha256: digest(bytes) };
  };
  const startedAt = new Date().toISOString();
  const offlineCapacity = [];
  const checkCapacity = async (label) => {
    const sample = await readBrowserCapacity(), checked = { label, ...sample, ...inspectM5ResourceGuard(sample) };
    const pin = await save(`offline-capacity-${label}.json`, { scope: "offline-instantaneous-protection-only-not-periodic-browser-evidence", ...checked });
    offlineCapacity.push({ ...checked, pin }); ensure(checked.ok, `offline-resource-protection:${label}`);
  };
  try {
    await checkCapacity("preflight");
    const build = await load(config.build), review = await load(config["desktop-review"]);
    const sourceBinding = async () => validateM1Build(build.value, await captureBuildInputs(),
      (await readFile(inside(path.join(build.value.distDir, "BUILD_ID")), "utf8")).trim());
    const binding = await sourceBinding();
    for (const name of ["adjudicate-mainline-a-m5-longrun-pair.mjs", "adjudicate-mainline-a-m5-longrun-pair.test.mjs",
      "mainline-a-browser-resource-guard.mjs", ...M5_LONGRUN_DRIVER_PATHS]) await loadBytes(`scripts/${name}`);
    const bundles = [];
    for (const device of ["desktop", "mobile"]) {
      const dir = config[`${device}-dir`], raw = await load(path.join(dir, `${device}-browser-raw.json`));
      const workload = await load(path.join(dir, `${device}-workload.json`)), session = await load(path.join(dir, `${device}-session.json`));
      const plan = await load(path.join(dir, "plan.json")), guard = await load(path.join(dir, "resource-guard.json"));
      const progressBytes = await loadBytes(path.join(dir, "progress.jsonl"));
      const progress = progressBytes.bytes.toString("utf8").trim().split("\n").filter(Boolean).map(JSON.parse);
      ensure(same(plan.value.binding, binding) && same(plan.value.policy, M5_LONGRUN_POLICY), `${device}-plan-binding-or-policy-drift`);
      await verifyPin(plan.value.buildReceipt);
      for (const pin of plan.value.scripts) await verifyPin(pin);
      const ready = progress.find((row) => row.kind === "device-ready" && row.device === device);
      ensure(ready?.browserLaunchId === session.value.browserLaunchId && ready.contextId === session.value.contextId
        && same(ready.binding, binding) && same(ready.profile, session.value.profile), `${device}-session-progress-mismatch`);
      const rawSaved = progress.find((row) => row.kind === "raw-saved" && row.device === device);
      ensure(rawSaved?.rawPin?.sha256 === raw.pin.sha256 && rawSaved.rawPin.bytes === raw.pin.bytes
        && rawSaved.rawPin.browserLaunchId === session.value.browserLaunchId
        && rawSaved.rawPin.sessionId === raw.value.observations?.[0]?.sessionId, `${device}-raw-progress-mismatch`);
      const closed = progress.find((row) => row.kind === "device-closed" && row.device === device);
      ensure(same(closed?.session, session.value), `${device}-close-progress-mismatch`);
      for (const row of progress.filter((row) => row.device === device)) {
        for (const key of ["pin", "warmupPin", "workloadPin", "rawPin"]) if (row[key]?.path) await verifyPin(row[key]);
      }
      const observation = raw.value.observations?.[0];
      ensure(raw.value.observations?.length === 1 && observation.device === device && observation.source === "browser-runtime"
        && observation.status === "complete" && observation.observedDurationMs >= 1_800_000
        && stamp(session.value.launchedAt) <= stamp(observation.startedAt) && stamp(observation.startedAt) < stamp(observation.endedAt)
        && stamp(observation.endedAt) <= stamp(session.value.closedAt), `${device}-original-observation-invalid`);
      bundles.push({ device, raw, workload, session, plan, guard, progress, observation });
    }
    const [desktop, mobile] = bundles;
    ensure(desktop.observation.sessionId !== mobile.observation.sessionId
      && desktop.observation.independenceKey !== mobile.observation.independenceKey, "observation-identities-not-independent");
    const capture = await load(path.join(config["mobile-dir"], "capture-only-audit.json"));
    ensure(capture.value.captureValid === true && capture.value.qualifiedLongrun === false
      && capture.value.candidateFreezeAllowed === false && capture.value.device === "mobile"
      && same(capture.value.selectedDevices, ["mobile"]) && same(capture.value.binding, binding)
      && same(capture.value.sessions, [mobile.session.value]) && same(capture.value.policy, M5_LONGRUN_POLICY), "mobile-capture-only-audit-invalid");
    for (const pin of [...capture.value.rawPins, ...capture.value.workloadPins, ...capture.value.scripts]) await verifyPin(pin);
    const settle = await load(path.join(config["mobile-dir"], "mobile-dom-settle.json"));
    const settleEvent = mobile.progress.find((row) => row.kind === "natural-DOM-settle-complete" && row.device === "mobile");
    ensure(settleEvent?.pin?.sha256 === settle.pin.sha256, "same-session-settle-progress-missing");
    for (const pin of [review.value.originalReviewPin, ...review.value.originalLong07Pins,
      ...review.value.evidencePins]) await verifyPin(pin);
    for (const check of review.value.diagnosticToolPreimageChecks) {
      ensure(check.recorded.sha256 === check.verifiedPreimage.sha256 && check.recorded.bytes === check.verifiedPreimage.bytes, "desktop-tool-attestation-invalid");
      await verifyPin(check.recorded);
    }
    const desktopReview = inspectM5DesktopAdjudication(review.value, binding,
      [desktop.raw.pin, desktop.workload.pin, desktop.session.pin, desktop.plan.pin]);
    const desktopMaterials = await verifyDesktopDiagnosticMaterials(review.value, binding, load);
    const mobileReview = inspectM5MobileNaturalSettle(settle.value, mobile.workload.value, mobile.observation, mobile.session.value);
    const guards = bundles.map((entry) => inspectM5PairGuardChain(entry.guard.value, entry.progress,
      entry.session.value, entry.observation, entry.plan.value));
    await checkCapacity("before-analysis");
    const machine = inspectM5LongRuns(bundles.map((entry) => entry.raw.value), build.value, binding.sourceSha256,
      bundles.map((entry) => entry.session.value), bundles.map((entry) => entry.workload.value));
    const machineGate = inspectM5PairMachineGate(machine);
    const combinedPin = await save("combined-derived-receipt.json", machine.combined);
    const { combined: ignoredCombined, ...machineReport } = machine; void ignoredCombined;
    const machinePin = await save("original-machine-analysis.json", machineReport);
    await checkCapacity("after-analysis");
    const finalBinding = await sourceBinding(); ensure(same(binding, finalBinding), "final-source-drift");
    for (const pin of inputs.values()) ensure(digest(await readFile(inside(pin.path))) === pin.sha256, `final-input-drift:${pin.path}`);
    const checks = { originalNonDOMGates: machineGate.ok, desktopExplicitDOMReview: desktopReview.ok,
      mobileSameSessionDOMReview: mobileReview.ok, strictGuards: guards.every((row) => row.ok) };
    const ok = Object.values(checks).every(Boolean);
    const auditPin = await save("audit.json", { schema: "mainline-a-m5-pair-explicit-adjudication/v1", startedAt,
      endedAt: new Date().toISOString(), status: ok ? "passed-with-explicit-DOM-adjudication" : "not-qualified-pair",
      localTwoDeviceLongrunsAccepted: ok, wholeM5FreezeApproved: false, checks, binding, finalBinding,
      machinePin, combinedPin, originalMachineOk: machine.ok, originalMachineDOMOk: machine.domCounterReview.ok,
      machineGate, desktopReview, desktopMaterials, mobileReview, guards, offlineCapacity, inputPins: [...inputs.values()], verifiedPreimages,
      derivation: "Offline combination of two unchanged original browser observations. Original machine analysis is retained unchanged; only its DOM review concern receives separate explicit adjudication.",
      boundary: BOUNDARY });
    ensure(ok, "paired-evidence-not-qualified");
    return { status: "passed-with-explicit-DOM-adjudication", auditPin, combinedPin, machinePin };
  } catch (error) {
    await save("attempt.json", { status: "failed-offline-pair-adjudication", startedAt, endedAt: new Date().toISOString(),
      error: error.message, inputPins: [...inputs.values()], offlineCapacity, wholeM5FreezeApproved: false, boundary: BOUNDARY });
    throw error;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { console.log(JSON.stringify(await adjudicateM5LongRunPair(parseM5PairOptions(process.argv.slice(2))))); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
