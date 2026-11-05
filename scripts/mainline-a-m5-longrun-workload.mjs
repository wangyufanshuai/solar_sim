import { setTimeout as delay } from "node:timers/promises";
import { readFile } from "node:fs/promises";
import { selectScene } from "./capture-mainline-a-m1-browser.mjs";
import { readActualCameraObservation, cameraPoseStable, waitForActualCameraStable } from "./mainline-a-browser-camera-observation.mjs";
import resourceObservationModule from "../app/lib/mainlineAResourceObservationV633.ts";

const { validateMainlineAResourceSnapshotV633 } = resourceObservationModule.default ?? resourceObservationModule;
const JOURNEY = '[data-mainline-a-journey="orion-clouds-and-stars"]';
const PERFORMANCE = '[data-mainline-a-performance="v625"]';
const STOPS = Object.freeze(["constellation:Ori", "nebula:m42", "nebula:b33", "nearby-star:betelgeuse", "nearby-star:rigel"]);
const STAGES = Object.freeze(["station-0", "station-1", "viewer-open", "viewer-closed", "station-2", "station-3", "station-4", "returned-orion", "returned-baseline"]);
const coverage = JSON.parse(await readFile(new URL("../app/data/mainlineACanonicalCoverageV622.generated.json", import.meta.url), "utf8"));
const IMAGE_HASHES = Object.freeze(Object.fromEntries(["m42", "b33"].map((id) => [id,
  coverage.records.find((row) => row.kind === "nebula" && row.id === id)?.route?.assetHash])));
if (!Object.values(IMAGE_HASHES).every((hash) => /^[a-f0-9]{64}$/.test(hash ?? ""))) throw new Error("m5-workload:canonical-image-hash-unavailable");
export const M5_QUALITY_POLICY = Object.freeze({
  version: "registered-scene-tier-fixed-presentation-stage-reference-v2",
  source: "app/lib/launchSequenceDirector.ts:selectAtlasRuntimeQualityTier-and-AtlasRuntimeWorkbench-closeup-selection",
  sceneTiers: Object.freeze({ desktop: Object.freeze({ atlas: "balanced", inspect: "closeup-inspect" }),
    mobile: Object.freeze({ atlas: "mobile-safe", inspect: "mobile-safe" }) }),
  viewports: Object.freeze({ desktop: Object.freeze({ width: 1280, height: 720 }), mobile: Object.freeze({ width: 390, height: 844 }) }),
  renderBudgets: Object.freeze(["balanced", "dense"]),
  invariant: "fixed-actual-preflight-visualProfile-renderBudget-query-storage-URL-viewport-browser-and-canvas-DPR",
  stageReference: "every-observation-stage-equals-the-corresponding-real-warmup-stage-and-the-registered-scene-tier-formula",
  convergence: "read-only-wait-for-shell-scene-probe-scene-and-exact-formula-tier-to-agree-no-arbitrary-tier-set-or-application-reset",
  budgetEvidenceLimit: "preflight-actual-HUD-props-control-then-unchanged-normal-UI-query-and-storage-evidence-not-an-unpublished-React-store-read",
});
export const M5_WORKLOAD_POLICY = Object.freeze({
  version: "fixed-orion-five-station-six-window-workload-v1", routeId: "orion-clouds-and-stars",
  stops: STOPS, stages: STAGES, imageHashes: IMAGE_HASHES, windowMs: 300_000, windows: 6,
  scheduledOffsetsMs: Object.freeze([60_000, 360_000, 660_000, 960_000, 1_260_000, 1_560_000]),
  warmup: "one-complete-route-then-two-matching-four-second-resource-probes-before-observation",
  quality: M5_QUALITY_POLICY,
  resourceSampling: "normal-product-four-second-performance-control-full-registry-before-and-after-plus-read-only-DOM-renderer",
  resourceReturn: "exact-warmed-registry-identity-kind-owner-and-byte-baseline-no-new-cache-tolerance",
  measurementOverhead: "fixed-workload-includes-the-product-four-second-resource-probes-and-panel-docking",
  auxiliaryReceipt: "save-each-full-short-probe-then-clear-only-its-normal-UI-receipt-before-docking-no-R65-or-product-cache-reset",
  domCounters: "read-only-CDP-Memory.getDOMCounters-at-every-warmed-and-returned-checkpoint-finally-detach-no-forced-GC",
  domCounterReturn: "retain-idle-warmup-counts-first-window-matched-R65-running-return-counts-are-reference-later-growth-or-unavailable-requires-review-no-numeric-tolerance",
  geometryMaterialLimit: "registered-geometry-material-model-and-subscription-identities-plus-renderer-program-count-no-independent-full-three-object-enumeration-or-unregistered-listener-proof",
});
const ensure = (ok, code, detail) => { if (!ok) throw new Error(`m5-workload:${code}${detail === undefined ? "" : `:${JSON.stringify(detail)}`}`); };
const canonical = (value) => JSON.stringify(value, (_, entry) => entry && typeof entry === "object" && !Array.isArray(entry)
  ? Object.fromEntries(Object.entries(entry).sort(([a], [b]) => a.localeCompare(b))) : entry);
const validSnapshot = (snapshot) => validateMainlineAResourceSnapshotV633(snapshot).valid;
export function m5ResourceFootprint(snapshot) {
  if (!validSnapshot(snapshot)) return null;
  const { revision: ignoredRevision, ...footprint } = snapshot;
  void ignoredRevision;
  return canonical(footprint);
}
export function m5ResourcesMatch(before, after) {
  const footprint = m5ResourceFootprint(before);
  return footprint !== null && footprint === m5ResourceFootprint(after);
}

export function m5QualityRecord(sample) {
  return { sceneMode: sample?.sceneMode ?? null, probeSceneMode: sample?.probeSceneMode ?? null,
    qualityTier: sample?.qualityTier ?? null, visualProfile: sample?.visualProfile ?? null,
    userAgent: sample?.userAgent ?? null, browserVersion: sample?.browserVersion ?? null,
    renderBudget: sample?.renderBudget ?? null, presentation: sample?.presentation ?? null,
    viewport: sample?.viewport ?? null, devicePixelRatio: sample?.devicePixelRatio ?? null, canvasDPR: sample?.canvasDPR ?? null };
}

/** Only atlas/inspect belong to this route. Mobile-safe never excuses a launch/kerr scene. */
export function inspectM5Quality(sample, frozen, { stageName = null, requireWarmStage = false } = {}) {
  const issues = [], expected = frozen?.preflightQuality, policy = M5_QUALITY_POLICY;
  const tier = policy.sceneTiers[frozen?.device]?.[sample?.sceneMode];
  if (!tier) issues.push("unregistered-scene-or-device");
  if (sample?.probeSceneMode !== sample?.sceneMode) issues.push("scene-probe-pair-not-converged");
  if (sample?.qualityTier !== tier) issues.push("scene-tier-formula-mismatch");
  if (stageName) {
    const scene = ["returned-baseline", "warmup-stable-confirmation", "preflight"].includes(stageName) ? "atlas" : "inspect";
    if (sample?.sceneMode !== scene) issues.push("stage-scene-mismatch");
  }
  if (!sample?.visualProfile || typeof sample.visualProfile !== "string") issues.push("visual-profile-unavailable");
  if (!sample?.userAgent || !sample?.browserVersion) issues.push("browser-identity-unavailable");
  const budget = sample?.presentation;
  if (!policy.renderBudgets.includes(sample?.renderBudget) || budget?.storageReadable !== true
    || (budget.queryBudget !== null && !policy.renderBudgets.includes(budget.queryBudget))
    || (budget.storedRenderBudget !== null && !policy.renderBudgets.includes(budget.storedRenderBudget))
    || sample.renderBudget !== (budget?.queryBudget ?? budget?.storedRenderBudget ?? "balanced")
    || typeof budget?.url !== "string") issues.push("render-budget-evidence-invalid");
  if (canonical(sample?.viewport) !== canonical(policy.viewports[frozen?.device]) || sample?.devicePixelRatio !== 1
    || sample?.canvasDPR?.x !== 1 || sample?.canvasDPR?.y !== 1
    || !(sample?.canvasDPR?.width > 0 && sample?.canvasDPR?.height > 0
      && sample.canvasDPR.width === sample.canvasDPR.cssWidth && sample.canvasDPR.height === sample.canvasDPR.cssHeight)) issues.push("viewport-or-browser-canvas-DPR-drift");
  if (expected) for (const key of ["visualProfile", "renderBudget", "presentation", "viewport", "devicePixelRatio", "canvasDPR", "userAgent", "browserVersion"]) {
    if (canonical(sample?.[key]) !== canonical(expected?.[key])) issues.push(`fixed-${key}-drift`);
  }
  if (requireWarmStage && (!frozen?.stageQuality?.[stageName]
    || canonical(m5QualityRecord(sample)) !== canonical(frozen.stageQuality[stageName]))) issues.push("quality-not-equal-to-warmed-stage");
  return { ok: issues.length === 0, issues, expectedTier: tier ?? null, observed: m5QualityRecord(sample) };
}

/** Probe mode/tier are published together about once a second, later than the shell mode. */
export async function waitForM5QualityState(page, frozen, options = {}) {
  const deadline = Date.now() + (options.timeoutMs ?? 8_000);
  let sample, check;
  while (Date.now() < deadline) {
    sample = await readM5WorkloadState(page);
    check = inspectM5Quality(sample, frozen, options);
    if (check.ok) return sample;
    const transient = new Set(["scene-probe-pair-not-converged", "scene-tier-formula-mismatch", "quality-not-equal-to-warmed-stage"]);
    if (check.issues.some((issue) => !transient.has(issue))) break;
    await page.waitForTimeout(150);
  }
  const error = new Error(`m5-workload:quality-state-not-converged:${JSON.stringify(check?.issues ?? [])}`);
  error.qualityEvidence = { policy: M5_QUALITY_POLICY, observed: m5QualityRecord(sample), issues: check?.issues ?? ["quality-read-unavailable"] };
  error.qualitySample = sample ?? null;
  throw error;
}

/** Read the actual props-backed HUD value once, without changing it or repeatedly opening menus. */
export async function captureM5QualityPreflight(page, device) {
  const toggle = page.locator('button[title="图层"]');
  ensure(await toggle.getAttribute("aria-expanded") === "false", "preflight-layer-menu-not-closed");
  await toggle.press("Enter");
  let renderBudgetControl;
  try {
    const control = page.locator('[data-atlas-layer-menu="true"]').getByRole("button", { name: /^轨道密度/ });
    await control.waitFor({ state: "visible" });
    renderBudgetControl = await control.evaluate((node) => ({ text: node.textContent?.trim() ?? null,
      value: node.querySelector("span:last-child")?.textContent?.trim() ?? null,
      source: "normal-HUD-layer-menu-props-backed-orbit-density-control" }));
  } finally {
    if (await toggle.getAttribute("aria-expanded") === "true") await toggle.press("Enter");
  }
  const state = await waitForM5QualityState(page, { device }, { stageName: "preflight" });
  ensure(renderBudgetControl?.value === state.renderBudget, "actual-render-budget-control-disagrees", { renderBudgetControl, presentation: state.presentation });
  return { ...m5QualityRecord(state), renderBudgetPreflight: renderBudgetControl };
}

/** Read-only browser counters include unregistered DOM listeners; no GC is requested. */
export async function readM5DOMCounters(page) {
  let session;
  let result = { source: "CDP-Memory.getDOMCounters", at: new Date().toISOString(), status: "unavailable", sessionDetached: false };
  try {
    session = await page.context().newCDPSession(page);
    const counters = await session.send("Memory.getDOMCounters");
    ensure(["documents", "nodes", "jsEventListeners"].every((key) => Number.isSafeInteger(counters[key]) && counters[key] >= 0), "DOM-counter-values-invalid");
    result = { ...result, at: new Date().toISOString(), status: "observed", documents: counters.documents,
      nodes: counters.nodes, jsEventListeners: counters.jsEventListeners };
  } catch (error) {
    result = { ...result, status: "unavailable", error: String(error?.message ?? error) };
  } finally {
    if (session) {
      try { await session.detach(); result.sessionDetached = true; }
      catch (error) { result = { ...result, status: "unavailable", detachError: String(error?.message ?? error) }; }
    }
  }
  return result;
}

const DOM_COUNTER_KEYS = ["documents", "nodes", "jsEventListeners"];
const validDOMCounters = (value) => value?.source === "CDP-Memory.getDOMCounters" && value?.status === "observed"
  && value?.sessionDetached === true && Number.isFinite(Date.parse(value?.at))
  && DOM_COUNTER_KEYS.every((key) => Number.isSafeInteger(value[key]) && value[key] >= 0);

/** Compare like-for-like running states: starting R65 legitimately adds observers absent during warmup. */
export function inspectM5DOMCounterTrend(workload) {
  const reviews = [], curves = [], baselines = {}, references = {};
  for (const name of ["returned-orion", "returned-baseline"]) {
    const warm = workload?.warmup?.cycle?.stages?.find((stage) => stage?.name === name);
    const baselineSamples = [{ phase: "warmup", index: -1, name, at: warm?.at ?? null, counters: warm?.domCounters ?? null }];
    if (name === "returned-baseline") baselineSamples.push({ phase: "warmup", index: -1, name: "warmup-stable-confirmation",
      at: workload?.warmup?.confirmation?.at ?? null, counters: workload?.warmup?.confirmation?.domCounters ?? null });
    const baselineValid = baselineSamples.every((sample) => validDOMCounters(sample.counters));
    const bound = baselineValid ? Object.fromEntries(DOM_COUNTER_KEYS.map((key) => [key, Math.max(...baselineSamples.map((sample) => sample.counters[key]))])) : null;
    baselines[name] = { source: "observed-matched-warmup-checkpoints", bound, samples: baselineSamples };
    if (!baselineValid) reviews.push({ name, kind: "warmed-DOM-counter-evidence-unavailable" });
    const referenceStage = workload?.cycles?.[0]?.stages?.find((entry) => entry?.name === name);
    const reference = referenceStage?.domCounters ?? null;
    const referenceValid = validDOMCounters(reference) && referenceStage?.longrun?.attached === true
      && referenceStage?.longrun?.running === true && referenceStage?.longrun?.observationCount === 0;
    references[name] = { source: "first-window-actual-matched-R65-running-checkpoint", index: 0,
      at: referenceStage?.at ?? null, counters: reference, stateValid: referenceValid,
      deltaFromIdleWarmedBound: referenceValid && bound
        ? Object.fromEntries(DOM_COUNTER_KEYS.map((key) => [key, reference[key] - bound[key]])) : null };
    if (!referenceValid) reviews.push({ name, kind: "running-DOM-counter-reference-unavailable" });
    for (let index = 0; index < M5_WORKLOAD_POLICY.windows; index++) {
      const stage = workload?.cycles?.[index]?.stages?.find((entry) => entry?.name === name);
      const counters = stage?.domCounters ?? null;
      const valid = validDOMCounters(counters) && stage?.longrun?.attached === true
        && stage?.longrun?.running === true && stage?.longrun?.observationCount === 0;
      const deltaFromWarmedBound = valid && bound ? Object.fromEntries(DOM_COUNTER_KEYS.map((key) => [key, counters[key] - bound[key]])) : null;
      const deltaFromRunningReference = valid && referenceValid ? Object.fromEntries(DOM_COUNTER_KEYS.map((key) => [key, counters[key] - reference[key]])) : null;
      curves.push({ phase: "observation", index, name, at: stage?.at ?? null, counters, deltaFromWarmedBound, deltaFromRunningReference,
        role: index === 0 ? "running-reference-only-not-a-growth-comparison" : "later-window-comparison",
        elapsedSinceRunningReferenceMs: valid && referenceValid ? Date.parse(counters.at) - Date.parse(reference.at) : null });
      if (!valid) reviews.push({ index, name, kind: "returned-DOM-counter-evidence-unavailable" });
      else if (index > 0 && deltaFromRunningReference && DOM_COUNTER_KEYS.some((key) => deltaFromRunningReference[key] > 0)) {
        reviews.push({ index, name, kind: "returned-DOM-counter-growth-review", deltaFromRunningReference });
      }
    }
  }
  return { ok: reviews.length === 0, status: reviews.length ? "review-required" : "within-observed-running-return-reference", baselines, references, curves, reviews,
    measurement: M5_WORKLOAD_POLICY.domCounters, qualification: M5_WORKLOAD_POLICY.domCounterReturn,
    interpretation: "idle-warmup-to-running-deltas-are-retained-not-treated-as-growth-first-window-establishes-running-reference-only-later-five-windows-are-compared-unforced-counts-can-include-detached-nodes-awaiting-GC-growth-needs-review-not-itself-proven-leak" };
}

/** Uses only existing public DOM markers and an existing actual-camera reader. */
export async function readM5WorkloadState(page) {
  const state = await page.evaluate(() => {
    const shell = document.querySelector("[data-atlas-app-shell]");
    const marker = document.querySelector("[data-atlas-browser-acceptance-version]");
    const attr = (node, name) => node?.getAttribute(name) ?? null;
    const read = (name) => document.querySelector(`[${name}]`)?.getAttribute(name) ?? null;
    const number = (name) => { const value = read(name); return value !== null && value !== "" && Number.isFinite(Number(value)) ? Number(value) : null; };
    const journey = document.querySelector('[data-mainline-a-journey="orion-clouds-and-stars"]');
    const image = document.querySelector("[data-mainline-a-scene-nebula]");
    const viewer = document.querySelector("dialog[data-mainline-a-nebula-viewer]");
    const longrun = document.querySelector("[data-mainline-a-r65-longrun]");
    const canvas = document.querySelector("canvas"), bounds = canvas?.getBoundingClientRect();
    let storedRenderBudget = null, storageReadable = true;
    try {
      const stored = JSON.parse(localStorage.getItem("solar.presentation.v1") ?? "{}");
      storageReadable = stored !== null && typeof stored === "object" && !Array.isArray(stored);
      storedRenderBudget = stored?.renderBudget ?? null;
    } catch { storageReadable = false; }
    const queryBudget = new URLSearchParams(location.search).get("budget");
    return { at: new Date().toISOString(), browserMs: performance.now(), selectedId: attr(shell, "data-celestial-catalog-selected-id") || null,
      visibility: document.visibilityState, runtimeBuildId: attr(shell, "data-mainline-build-id"),
      releaseBoundary: attr(shell, "data-mainline-a-release-boundary"), scientificPayloadWriteback: attr(shell, "data-mainline-a-scientific-payload-writeback"),
      qualityTier: read("data-atlas-runtime-quality-tier"), sceneMode: attr(shell, "data-atlas-scene-mode-v2"),
      probeSceneMode: read("data-atlas-runtime-scene-mode"), visualProfile: attr(shell, "data-atlas-visual-profile-v294"),
      userAgent: navigator.userAgent,
      viewport: { width: innerWidth, height: innerHeight }, renderBudget: queryBudget ?? storedRenderBudget ?? "balanced",
      presentation: { queryBudget, storedRenderBudget, storageReadable, url: location.href }, devicePixelRatio, canvasCount: document.querySelectorAll("canvas").length,
      canvasDPR: canvas && bounds ? { width: canvas.width, height: canvas.height, cssWidth: bounds.width, cssHeight: bounds.height,
        x: bounds.width > 0 ? canvas.width / bounds.width : null, y: bounds.height > 0 ? canvas.height / bounds.height : null } : null,
      journey: journey ? { status: attr(journey, "data-mainline-a-journey-status"), index: Number(attr(journey, "data-mainline-a-journey-index")),
        target: attr(journey, "data-mainline-a-journey-target"), request: number("data-mainline-a-journey-request") } : null,
      image: image ? { id: attr(image, "data-mainline-a-scene-nebula"), status: attr(image, "data-mainline-a-scene-image-status"), sha256: attr(image, "data-mainline-a-scene-image-sha256") } : null,
      viewer: viewer ? { id: attr(viewer, "data-mainline-a-nebula-viewer"), open: viewer.open,
        zoom: Number(attr(viewer, "data-mainline-a-nebula-viewer-zoom")), borrowedCount: viewer.querySelectorAll("[data-mainline-a-nebula-borrowed]").length } : null,
      borrowedCount: document.querySelectorAll("[data-mainline-a-nebula-borrowed]").length,
      longrun: { attached: Boolean(longrun), running: [...longrun?.querySelectorAll("button") ?? []].some((button) => button.textContent?.trim() === "中止并留账"),
        observationCount: window.__mainlineAR65LongRunReceiptV643?.observations?.length ?? null },
      resources: Object.fromEntries([...shell?.attributes ?? []].filter((entry) => entry.name.startsWith("data-atlas-resource-")).map((entry) => [entry.name, entry.value])),
      renderer: { contextStatus: attr(marker, "data-atlas-render-context-status"), drawCalls: number("data-atlas-render-draw-calls"),
        triangles: number("data-atlas-render-triangles"), textures: number("data-atlas-render-textures"), programs: number("data-atlas-render-programs"),
        r3fSamples: number("data-atlas-render-r3f-frame-samples"), r3fP50Ms: number("data-atlas-render-r3f-frame-p50-ms"),
        r3fP95Ms: number("data-atlas-render-r3f-frame-p95-ms"), gpuSamples: number("data-atlas-render-gpu-frame-samples"),
        gpuP50Ms: number("data-atlas-render-gpu-frame-p50-ms"), gpuP95Ms: number("data-atlas-render-gpu-frame-p95-ms"), gpuTimer: read("data-atlas-render-gpu-timer") },
    };
  });
  return { ...state, browserVersion: page.context().browser()?.version() ?? null, camera: await readActualCameraObservation(page) };
}

/** Obtain full byIdentity/byKind/byOwner snapshots through an existing real UI action. */
export async function captureM5ResourceCheckpoint(page, device) {
  const panel = page.locator(PERFORMANCE);
  if (await panel.getAttribute("data-mainline-a-performance-docked") === "true") {
    await page.getByRole("button", { name: "展开性能观察面板", exact: true }).press("Enter");
  }
  await panel.getByRole("button", { name: "短时帧采样", exact: true }).press("Enter");
  const controls = panel.locator("[data-mainline-a-performance-summary] + div");
  await controls.locator("select").nth(0).selectOption(device);
  const ids = await page.evaluate(() => (window.__mainlineAPerformanceReceiptV625?.runs ?? []).map((run) => run.runId));
  await panel.getByRole("button", { name: "开始 4s", exact: true }).press("Enter");
  await page.waitForFunction((prior) => (window.__mainlineAPerformanceReceiptV625?.runs ?? []).some((run) => !prior.includes(run.runId)), ids, { timeout: 15_000 });
  const capture = await page.evaluate((prior) => {
    const additions = (window.__mainlineAPerformanceReceiptV625?.runs ?? []).filter((run) => !prior.includes(run.runId));
    if (additions.length !== 1) return null;
    const run = additions[0];
    return { source: "normal-product-four-second-performance-control", runId: run.runId, device: run.device,
      startedAt: run.startedAt, endedAt: run.endedAt, durationMs: run.durationMs, status: run.status, build: run.build,
      visibility: run.visibility, before: run.resources.before, after: run.resources.after, memory: run.memory,
      frame: { sampleCount: run.frame.sampleCount, p50Ms: run.frame.p50Ms, p95Ms: run.frame.p95Ms },
      interpretation: "resource-snapshot-probe-not-an-independent-longrun-or-route-label" };
  }, ids);
  // Bound our own RunRow DOM/heap overhead. This exact sibling excludes the R65 clear control.
  // The complete run object is already copied out, and the product sequenceRef is not reset.
  await controls.getByRole("button", { name: "清空", exact: true }).press("Enter");
  await page.waitForFunction(() => window.__mainlineAPerformanceReceiptV625?.runs?.length === 0
    && document.querySelectorAll("[data-mainline-a-performance-run]").length === 0);
  await panel.getByRole("button", { name: "收起以选择对象", exact: true }).press("Enter");
  return capture ? { ...capture, auxiliaryReceipt: M5_WORKLOAD_POLICY.auxiliaryReceipt } : null;
}

function inspectState(sample, frozen) {
  const issues = [];
  issues.push(...inspectM5Quality(sample, frozen, { stageName: sample?.name ?? null }).issues);
  if (sample?.runtimeBuildId !== frozen?.runtimeBuildId || sample?.releaseBoundary !== "candidate-only-hold-not-admitted"
    || sample?.scientificPayloadWriteback !== "false" || sample?.canvasCount !== 1 || sample?.visibility !== "visible") issues.push("runtime-boundary-or-visibility");
  if (sample?.renderer?.contextStatus !== "ready" || !Number.isFinite(sample.renderer.drawCalls) || sample.renderer.drawCalls <= 0
    || !Number.isFinite(sample.renderer.r3fSamples) || sample.renderer.r3fSamples <= 0
    || !["triangles", "textures", "programs"].every((key) => Number.isFinite(sample.renderer[key]) && sample.renderer[key] >= 0)) issues.push("renderer-evidence-unavailable");
  const probe = sample?.resourceCapture;
  if (probe && (probe.source !== "normal-product-four-second-performance-control" || probe.status !== "complete" || probe.durationMs < 4_000
    || probe.device !== frozen?.device || probe.build?.buildId !== frozen?.runtimeBuildId
    || !(Date.parse(probe.endedAt) - Date.parse(probe.startedAt) >= 4_000 && Date.parse(probe.endedAt) <= Date.parse(sample.at))
    || !validSnapshot(probe.before) || !validSnapshot(probe.after))) issues.push("resource-probe-invalid");
  return issues;
}

/** Five existing journey stops, including the real M42 viewer, then normal exit focus. */
export async function runM5FixedCycle(page, { device, frozen, index, phase, assertRunning = () => {}, onStage = async () => {} }) {
  const cycle = { phase, index, startedAt: new Date().toISOString(), stages: [] };
  const sample = async (name, fullResources = true) => {
    assertRunning();
    try { await waitForM5QualityState(page, frozen, { stageName: name, requireWarmStage: phase === "observation" }); }
    catch (error) {
      const entry = { name, ...error.qualitySample, resourceCapture: null };
      await onStage({ phase, index, name, at: entry.at ?? null, selectedId: entry.selectedId ?? null,
        sample: entry, issues: error.qualityEvidence?.issues ?? ["quality-state-read-failed"], qualityEvidence: error.qualityEvidence ?? null });
      throw error;
    }
    const resourceCapture = fullResources ? await captureM5ResourceCheckpoint(page, device) : null;
    const entry = { name, ...(await readM5WorkloadState(page)), resourceCapture };
    if (["returned-orion", "returned-baseline"].includes(name)) entry.domCounters = await readM5DOMCounters(page);
    const issues = inspectState(entry, frozen);
    if (phase === "observation") issues.push(...inspectM5Quality(entry, frozen, { stageName: name, requireWarmStage: true }).issues);
    if (fullResources && !resourceCapture) issues.push("full-registry-missing");
    if (!entry.longrun?.attached || (phase === "observation" && (!entry.longrun.running || entry.longrun.observationCount !== 0))) issues.push("longrun-observation-not-continuing");
    // Persist the actual observation before refusing it, so failed cycles remain reviewable.
    await onStage({ phase, index, name, at: entry.at, selectedId: entry.selectedId, sample: entry, issues });
    ensure(!issues.length, "stage-invalid", { name, issues });
    cycle.stages.push(entry);
    assertRunning(); return entry;
  };
  const panel = page.locator(PERFORMANCE);
  if (await panel.getAttribute("data-mainline-a-performance-docked") !== "true") {
    await panel.getByRole("button", { name: "收起以选择对象", exact: true }).press("Enter");
  }
  await selectScene(page, { kind: "constellation", id: "Ori", selectedId: STOPS[0] });
  const passport = page.locator('#atlas-celestial-object-passport[data-celestial-object-passport-open="true"]');
  const summary = passport.getByRole("button", { name: "查看摘要", exact: true });
  if (device === "mobile" && await summary.isVisible()) {
    await summary.press("Enter");
    await page.locator('#atlas-celestial-object-passport[data-mainline-a-passport-state="half"]').waitFor();
  }
  // The mobile sheet changes the safe viewport and the locked camera's actual pose.
  await waitForActualCameraStable(page, STOPS[0]);
  const departure = await readActualCameraObservation(page);
  await page.locator('[data-mainline-a-journey-start="orion-clouds-and-stars"]').press("Enter");
  const journey = page.locator(JOURNEY);
  for (let station = 0; station < STOPS.length; station++) {
    assertRunning();
    if (station) await journey.getByRole("button", { name: "下一站", exact: true }).press("Enter");
    await page.locator(`${JOURNEY}[data-mainline-a-journey-status="ready"][data-mainline-a-journey-index="${station}"]`).waitFor();
    if ([1, 2].includes(station)) await page.locator(`[data-mainline-a-scene-nebula="${station === 1 ? "m42" : "b33"}"][data-mainline-a-scene-image-status="ready"]`).waitFor();
    await waitForActualCameraStable(page, STOPS[station]);
    await sample(`station-${station}`);
    if (station === 1) {
      const opener = page.locator('[data-mainline-a-scene-nebula="m42"]').getByRole("button", { name: "放大观测图", exact: true });
      await opener.press("Enter");
      const dialog = page.locator('dialog[data-mainline-a-nebula-viewer="m42"]'); await dialog.waitFor();
      await dialog.locator('[data-mainline-a-nebula-borrowed="m42"]').waitFor();
      await dialog.getByRole("button", { name: "2× 局部", exact: true }).press("Enter");
      await page.locator('dialog[data-mainline-a-nebula-viewer="m42"][data-mainline-a-nebula-viewer-zoom="2"]').waitFor();
      await sample("viewer-open", false); // Modal makes the other product controls inert.
      await dialog.getByRole("button", { name: "关闭观测图放大", exact: true }).press("Enter");
      await dialog.waitFor({ state: "detached" });
      cycle.viewerRestoredFocus = await opener.evaluate((node) => document.activeElement === node);
      await sample("viewer-closed");
    }
  }
  await journey.getByRole("button", { name: "返回出发视点", exact: true }).press("Enter");
  await page.locator(`${JOURNEY}[data-mainline-a-journey-status="returned"]`).waitFor();
  await waitForActualCameraStable(page, STOPS[0]);
  const returned = await sample("returned-orion");
  cycle.departureCamera = departure;
  cycle.poseRestored = cameraPoseStable(departure, returned.camera);
  ensure(cycle.poseRestored, "departure-camera-not-restored");
  await page.getByRole("button", { name: "结束观测旅程", exact: true }).press("Enter");
  await journey.waitFor({ state: "detached" });
  await passport.getByRole("button", { name: "退出聚焦", exact: true }).press("Enter");
  await page.waitForFunction(() => !document.querySelector("[data-atlas-app-shell]")?.getAttribute("data-celestial-catalog-selected-id"));
  const baseline = await sample("returned-baseline");
  ensure(!baseline.selectedId && !baseline.image && !baseline.viewer && baseline.borrowedCount === 0
    && m5ResourcesMatch(baseline.resourceCapture.before, baseline.resourceCapture.after), "return-not-stable");
  cycle.endedAt = baseline.at;
  cycle.warmedBaselineRestored = phase === "warmup" || m5ResourcesMatch(frozen.baseline, baseline.resourceCapture.after);
  ensure(cycle.warmedBaselineRestored, "warmed-resource-baseline-not-restored");
  return cycle;
}

export async function warmupM5Workload(page, { device, profile, runtimeBuildId, assertRunning, onStage }) {
  const frozen = { device, runtimeBuildId, preflightQuality: m5QualityRecord(profile), renderBudgetPreflight: profile.renderBudgetPreflight, devicePixelRatio: 1 };
  ensure(inspectM5Quality(profile, frozen, { stageName: "preflight" }).ok
    && profile.renderBudgetPreflight?.value === profile.renderBudget, "quality-preflight-unavailable");
  const cycle = await runM5FixedCycle(page, { device, frozen, index: -1, phase: "warmup", assertRunning, onStage });
  frozen.stageQuality = Object.fromEntries(cycle.stages.map((stage) => [stage.name, m5QualityRecord(stage)]));
  await waitForM5QualityState(page, frozen, { stageName: "returned-baseline", requireWarmStage: true });
  const confirmation = { name: "warmup-stable-confirmation", resourceCapture: await captureM5ResourceCheckpoint(page, device), ...(await readM5WorkloadState(page)) };
  confirmation.domCounters = await readM5DOMCounters(page);
  await onStage?.({ phase: "warmup", index: -1, name: confirmation.name, at: confirmation.at,
    selectedId: confirmation.selectedId, sample: confirmation, issues: inspectState(confirmation, frozen) });
  const returned = cycle.stages.at(-1).resourceCapture;
  ensure(!inspectState(confirmation, frozen).length && !confirmation.selectedId
    && m5ResourcesMatch(confirmation.resourceCapture?.before, confirmation.resourceCapture?.after)
    && m5ResourcesMatch(returned.after, confirmation.resourceCapture?.after), "warmup-baseline-not-stable");
  frozen.baseline = confirmation.resourceCapture.after;
  return { policy: M5_WORKLOAD_POLICY, frozen, cycle, confirmation, completedAt: confirmation.at };
}

export async function captureM5Workload(page, { device, warmup, anchor, assertRunning, onStage, onCycle }) {
  const result = { policy: M5_WORKLOAD_POLICY, device, warmup, anchor, cycles: [] };
  for (const [index, offset] of M5_WORKLOAD_POLICY.scheduledOffsetsMs.entries()) {
    while (true) {
      assertRunning();
      const remaining = anchor.browserMs + offset - await page.evaluate(() => performance.now());
      if (remaining <= 0) break;
      await delay(Math.min(1_000, remaining));
    }
    const cycle = await runM5FixedCycle(page, { device, frozen: warmup.frozen, index, phase: "observation", assertRunning, onStage });
    result.cycles.push(cycle);
    await onCycle(cycle);
    // Keep each whole fixed route inside its own registered five-minute window.
    ensure(await page.evaluate(() => performance.now()) < anchor.browserMs + (index + 1) * M5_WORKLOAD_POLICY.windowMs,
      "cycle-overran-registered-window", index);
  }
  return result;
}

/** Original v665 threshold definitions remain the only tail/growth thresholds. */
export function inspectM5Advisories(series) {
  const reviews = [];
  for (const row of series ?? []) {
    for (const [kind, trend, healthy] of [["frame-tail", row?.frames?.tailTrend, "no-late-window-tail-signal"],
      ["reported-heap", row?.memory?.trend, "no-sustained-growth-signal"]]) {
      if (trend?.advisory !== healthy) reviews.push({ device: row?.device ?? null, kind, advisory: trend?.advisory ?? "unavailable", trend: trend ?? null });
    }
  }
  return { ok: reviews.length === 0, status: reviews.length ? "review-required" : "no-existing-series-review-signal", reviews,
    interpretation: "existing-v665-advisories-require-review-before-candidate-freeze-not-a-new-performance-threshold" };
}

export function inspectM5Workload(workload, observation, profile) {
  const issues = [];
  const domCounterReview = inspectM5DOMCounterTrend(workload);
  const frozen = workload?.warmup?.frozen;
  const start = Date.parse(observation?.startedAt), end = Date.parse(observation?.endedAt);
  if (canonical(workload?.policy) !== canonical(M5_WORKLOAD_POLICY)) issues.push("workload-policy-not-registered");
  if (workload?.device !== observation?.device || frozen?.device !== observation?.device
    || canonical(frozen?.preflightQuality) !== canonical(m5QualityRecord(profile))
    || frozen?.renderBudgetPreflight?.value !== profile?.renderBudget
    || frozen?.runtimeBuildId !== observation?.build?.buildId || frozen?.devicePixelRatio !== 1) issues.push("frozen-quality-device-or-build-mismatch");
  if (canonical(Object.keys(frozen?.stageQuality ?? {})) !== canonical(STAGES)
    || canonical(frozen?.stageQuality) !== canonical(Object.fromEntries((workload?.warmup?.cycle?.stages ?? []).map((stage) => [stage.name, m5QualityRecord(stage)])))) {
    issues.push("warmed-stage-quality-reference-invalid");
  }
  if (!(Date.parse(workload?.warmup?.completedAt) < start) || !validSnapshot(frozen?.baseline)) issues.push("warmup-not-complete-before-observation");
  if (!Number.isFinite(start) || !Number.isFinite(end) || end - start < 1_800_000) issues.push("observation-time-invalid");
  const cycles = workload?.cycles;
  if (!Array.isArray(cycles) || cycles.length !== M5_WORKLOAD_POLICY.windows) return { ok: false, issues: [...issues, "six-complete-window-cycles-required"], domCounterReview };
  const captureIds = new Set();
  const confirmation = workload?.warmup?.confirmation;
  if (!confirmation || inspectState(confirmation, frozen).length || confirmation.selectedId
    || canonical(m5QualityRecord(confirmation)) !== canonical(frozen?.stageQuality?.["returned-baseline"])
    || !m5ResourcesMatch(confirmation.resourceCapture?.before, confirmation.resourceCapture?.after)
    || !m5ResourcesMatch(frozen?.baseline, confirmation.resourceCapture?.after)
    || confirmation.at !== workload?.warmup?.completedAt || confirmation.longrun?.attached !== true
    || confirmation.longrun?.running !== false || confirmation.longrun?.observationCount !== 0) issues.push("warmup-confirmation-invalid");
  if (confirmation?.resourceCapture) captureIds.add(confirmation.resourceCapture.runId);
  const allCycles = [{ index: -1, cycle: workload?.warmup?.cycle }, ...cycles.map((cycle, index) => ({ index, cycle }))];
  for (const { index, cycle } of allCycles) {
    const warmup = index === -1;
    const tag = warmup ? "warmup" : `cycle-${index}`;
    if (!cycle) { issues.push(`${tag}:route-stage-coverage`); continue; }
    const from = start + index * M5_WORKLOAD_POLICY.windowMs, to = Math.min(end, from + M5_WORKLOAD_POLICY.windowMs);
    if (cycle.index !== index || cycle.phase !== (warmup ? "warmup" : "observation")
      || (warmup ? !(Date.parse(cycle.startedAt) < Date.parse(cycle.endedAt) && Date.parse(cycle.endedAt) <= Date.parse(confirmation?.resourceCapture?.startedAt))
        : !(Date.parse(cycle.startedAt) >= from && Date.parse(cycle.endedAt) < to))) issues.push(`${tag}:outside-registered-window`);
    if (!Array.isArray(cycle.stages) || canonical(cycle.stages.map((stage) => stage?.name)) !== canonical(STAGES)) { issues.push(`${tag}:route-stage-coverage`); continue; }
    let previousAt = Date.parse(cycle.startedAt);
    for (const sample of cycle.stages) {
      if (!(Date.parse(sample.at) >= previousAt && Date.parse(sample.at) <= Date.parse(cycle.endedAt))) issues.push(`${tag}:${sample.name}:time-order`);
      previousAt = Date.parse(sample.at);
      issues.push(...inspectState(sample, frozen).map((issue) => `${tag}:${sample.name}:${issue}`));
      issues.push(...inspectM5Quality(sample, frozen, { stageName: sample.name, requireWarmStage: true }).issues
        .map((issue) => `${tag}:${sample.name}:${issue}`));
      if (!sample.longrun?.attached || sample.longrun.running !== !warmup || sample.longrun.observationCount !== 0) issues.push(`${tag}:${sample.name}:longrun-observation-not-continuing`);
      if (sample.name !== "viewer-open" && !sample.resourceCapture) issues.push(`${tag}:${sample.name}:full-registry-missing`);
      if (sample.resourceCapture) {
        if (captureIds.has(sample.resourceCapture.runId)) issues.push(`${tag}:${sample.name}:resource-probe-reused`);
        captureIds.add(sample.resourceCapture.runId);
      }
      const station = /^station-(\d)$/.exec(sample.name)?.[1];
      if (station !== undefined && (sample.selectedId !== STOPS[Number(station)] || sample.journey?.status !== "ready"
        || sample.journey?.index !== Number(station) || sample.journey?.target !== STOPS[Number(station)])) issues.push(`${tag}:${sample.name}:station-not-observed`);
      if (["station-1", "station-2", "viewer-open", "viewer-closed"].includes(sample.name)) {
        const id = sample.name === "station-2" ? "b33" : "m42";
        if (sample.image?.id !== id || sample.image?.status !== "ready" || sample.image?.sha256 !== IMAGE_HASHES[id]) issues.push(`${tag}:${sample.name}:real-image-not-ready`);
      }
    }
    const viewer = cycle.stages.find((stage) => stage.name === "viewer-open");
    const closed = cycle.stages.find((stage) => stage.name === "viewer-closed");
    if (viewer.viewer?.id !== "m42" || viewer.viewer?.open !== true || viewer.viewer?.zoom !== 2 || viewer.viewer?.borrowedCount !== 1
      || closed.viewer !== null || closed.borrowedCount !== 0 || closed.selectedId !== "nebula:m42"
      || viewer.image?.sha256 !== closed.image?.sha256 || cycle.viewerRestoredFocus !== true) issues.push(`${tag}:viewer-open-close-not-proven`);
    const returned = cycle.stages.find((stage) => stage.name === "returned-orion");
    if (returned.selectedId !== STOPS[0] || returned.journey?.status !== "returned" || cycle.poseRestored !== true
      || !cameraPoseStable(cycle.departureCamera, returned.camera)) issues.push(`${tag}:departure-pose-not-restored`);
    const baseline = cycle.stages.at(-1);
    if (baseline.selectedId || baseline.image || baseline.viewer || baseline.journey || baseline.borrowedCount !== 0
      || !m5ResourcesMatch(baseline.resourceCapture?.before, baseline.resourceCapture?.after)
      || !m5ResourcesMatch(frozen?.baseline, baseline.resourceCapture?.after) || cycle.warmedBaselineRestored !== true) issues.push(`${tag}:warmed-resource-baseline-not-restored`);
  }
  return { ok: issues.length === 0, issues, routeId: M5_WORKLOAD_POLICY.routeId, cycles: cycles.length,
    completeWindows: issues.length ? null : M5_WORKLOAD_POLICY.windows, preflightQuality: frozen?.preflightQuality ?? null,
    warmedStageQuality: frozen?.stageQuality ?? null, qualityPolicy: M5_QUALITY_POLICY,
    measurement: M5_WORKLOAD_POLICY.resourceSampling, geometryMaterialLimit: M5_WORKLOAD_POLICY.geometryMaterialLimit, domCounterReview };
}
