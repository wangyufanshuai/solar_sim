import { execFile } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { appendFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { chromium } from "playwright";
import { captureBuildInputs } from "./build-mainline-a-preserved.mjs";
import { validateM1Build } from "./capture-mainline-a-m1-browser.mjs";
import { observe, captureResourceCycle, waitForObservation, browserReceipt,
  verifyLongRunLaunchV650, verifyLongRunRawV650, verifyRawClockAgreementV650 }
  from "./capture-mainline-a-web-r65-longrun-v650.mjs";
import { inspectWebCurrentLongRunV648 } from "./verify-mainline-a-web-r65-current-v648.mjs";
import { analyzeR78ObservationSeriesV665 } from "./mainline-a-r78-longrun-series-v665.mjs";
import { M5_WORKLOAD_POLICY, M5_QUALITY_POLICY, warmupM5Workload, captureM5Workload, inspectM5Workload, inspectM5Advisories,
  readM5WorkloadState, readM5DOMCounters, m5QualityRecord, waitForM5QualityState, captureM5QualityPreflight }
  from "./mainline-a-m5-longrun-workload.mjs";
import longRunModule from "../app/lib/mainlineAR65LongRunV643.ts";

const { createMainlineAR65LongRunReceiptV643, finalizeMainlineAR65LongRunReceiptV643 } =
  longRunModule.default ?? longRunModule;
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const exec = promisify(execFile);
const DEVICES = ["desktop", "mobile"];
const VIEWPORTS = { desktop: { width: 1280, height: 720 }, mobile: { width: 390, height: 844 } };
export const M5_LONGRUN_DRIVER_PATHS = Object.freeze(["capture-mainline-a-m5-longrun.mjs", "mainline-a-m5-longrun-workload.mjs", "capture-mainline-a-web-r65-longrun-v650.mjs",
  "mainline-a-r78-longrun-series-v665.mjs", "verify-mainline-a-web-r65-current-v648.mjs",
  "capture-mainline-a-m1-browser.mjs", "build-mainline-a-preserved.mjs",
  "mainline-a-browser-camera-observation.mjs", "mainline-a-release-evidence.mjs",
  "validate-mainline-a-longrun-v635.mjs"]);
const BOUNDARY = Object.freeze({ candidateOnly: true, hold: true, notAdmitted: true,
  scientificPayloadWriteback: false, productionPerformance: false, physicalMobile: false,
  realUserValidation: false, publicWebReleaseApproved: false });
export const M5_LONGRUN_POLICY = Object.freeze({
  minDurationMs: 1_800_000, runs: 2, sequential: true, freshBrowserAndContext: true,
  metric: "browser-animation-frame-interval-not-renderer-fps",
  targets: Object.freeze({ desktop: Object.freeze({ medianDerivedFpsMin: 55, p95MsMax: 33.3 }),
    mobile: Object.freeze({ medianDerivedFpsMin: 30, p95MsMax: 50 }) }),
  resourceGuard: Object.freeze({ intervalMs: 15_000, freePhysicalBytesMin: 2 * 1024 ** 3,
    commitHeadroomBytesMin: 2 * 1024 ** 3, commitHeadroomRatioMin: 0.1 }),
  legacyGates: Object.freeze(["v643 verify/replay", "v648 current source", "v650 raw/clock/resource cycle", "v665 six five-minute windows"]),
  workload: M5_WORKLOAD_POLICY,
});
const ensure = (ok, code, detail) => {
  if (!ok) throw new Error(`m5-longrun:${code}${detail === undefined ? "" : `:${JSON.stringify(detail)}`}`);
};
const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
const log = (stage, detail = {}) => console.log(JSON.stringify({ at: new Date().toISOString(), stage, ...detail }));

export function createM5SignalAbort(target = process) {
  const controller = new AbortController();
  const handlers = new Map(["SIGINT", "SIGTERM"].map((name) => [name, () => {
    if (controller.signal.aborted) return;
    const error = new Error(`m5-longrun:interrupted:${name}`);
    error.signal = name;
    error.exitCode = name === "SIGINT" ? 130 : 143;
    controller.abort(error);
  }]));
  for (const [name, handler] of handlers) target.on(name, handler);
  return { signal: controller.signal,
    dispose() { for (const [name, handler] of handlers) target.off(name, handler); } };
}

export async function raceM5Abort(operation, signal) {
  let rejectAbort;
  const aborted = new Promise((_, reject) => { rejectAbort = () => reject(signal.reason); });
  if (signal.aborted) rejectAbort();
  else signal.addEventListener("abort", rejectAbort, { once: true });
  try { return await Promise.race([operation, aborted]); }
  finally { signal.removeEventListener("abort", rejectAbort); }
}

/** Append bounded metadata, never raw sample arrays, throughout the run. */
export async function createM5ProgressJournal(directory) {
  const filename = path.join(directory, "progress.jsonl");
  await writeFile(filename, "", { flag: "wx" });
  let sequence = 0;
  let tail = Promise.resolve();
  return {
    append(entry) {
      const row = { sequence: ++sequence, at: new Date().toISOString(), ...entry };
      const pending = tail.then(() => appendFile(filename, `${JSON.stringify(row)}\n`, "utf8"));
      tail = pending.catch(() => {});
      return pending;
    },
    flush: () => tail,
  };
}

export function parseM5LongRunOptions(args) {
  const allowed = new Set(["build", "origin", "run-id", "chrome", "device"]);
  const values = {};
  ensure(args.length % 2 === 0, "arguments-must-be-pairs");
  for (let index = 0; index < args.length; index += 2) {
    const key = args[index].slice(2);
    ensure(args[index].startsWith("--") && allowed.has(key) && !(key in values)
      && args[index + 1] && !args[index + 1].startsWith("--"), "unknown-or-duplicate-argument");
    values[key] = args[index + 1];
  }
  ensure(values.build && values.origin && values["run-id"], "build-origin-run-id-required");
  const origin = new URL(values.origin);
  ensure(origin.protocol === "http:" && origin.hostname === "127.0.0.1" && origin.port
    && origin.pathname === "/" && !origin.search && !origin.hash && !origin.username && !origin.password,
  "local-origin-required");
  ensure(/^[a-zA-Z0-9-]{8,48}$/.test(values["run-id"]), "invalid-run-id");
  ensure(values.device === undefined || DEVICES.includes(values.device), "invalid-device");
  return { build: path.resolve(ROOT, values.build), origin: origin.origin, runId: values["run-id"],
    chrome: values.chrome ?? "C:/Program Files/Google/Chrome/Application/chrome.exe", device: values.device ?? null };
}

export function inspectM5ResourceGuard(sample) {
  const issues = [];
  const guard = M5_LONGRUN_POLICY.resourceGuard;
  const finite = [sample?.freePhysicalBytes, sample?.commitLimitBytes, sample?.committedBytes]
    .every((value) => Number.isFinite(value) && value >= 0);
  if (!finite || !(sample.commitLimitBytes > 0) || sample.committedBytes > sample.commitLimitBytes) {
    issues.push("memory-measurement-unavailable");
  } else {
    if (sample.freePhysicalBytes < guard.freePhysicalBytesMin) issues.push("physical-memory-below-reserve");
    const remaining = sample.commitLimitBytes - sample.committedBytes;
    if (remaining < guard.commitHeadroomBytesMin || remaining / sample.commitLimitBytes < guard.commitHeadroomRatioMin) {
      issues.push("commit-headroom-below-reserve");
    }
  }
  return { ok: issues.length === 0, issues };
}

export function inspectM5FrameTarget(device, series) {
  const target = M5_LONGRUN_POLICY.targets[device];
  const medianDerivedFps = series?.frames?.frameBudget?.medianDerivedFps;
  const p95Ms = series?.frames?.quantiles?.p95;
  const measured = Boolean(target) && Number.isFinite(medianDerivedFps) && medianDerivedFps > 0
    && Number.isFinite(p95Ms) && p95Ms > 0;
  return { device, metric: M5_LONGRUN_POLICY.metric, target,
    medianDerivedFps: medianDerivedFps ?? null, p95Ms: p95Ms ?? null,
    ok: measured && medianDerivedFps >= target.medianDerivedFpsMin && p95Ms <= target.p95MsMax,
    rendererFpsMeasured: false };
}

// Derived receipt only: original browser raw files remain byte-for-byte inputs.
export function combineM5LongRunReceipts(receipts) {
  ensure(receipts.length === 2 && receipts.every((raw) => raw?.observations?.length === 1), "two-single-run-raw-required");
  ensure(JSON.stringify(receipts[0].build) === JSON.stringify(receipts[1].build), "raw-builds-differ");
  return finalizeMainlineAR65LongRunReceiptV643(createMainlineAR65LongRunReceiptV643({
    build: receipts[0].build, observations: receipts.flatMap((raw) => raw.observations),
  }));
}

export function inspectM5SessionEvidence(sessions, build, currentSourceSha256) {
  return sessions?.length === 2 && sessions.every((session, index) => session.device === DEVICES[index]
    && session.browserClosed === true && session.freshContext === true && session.priorObservationCount === 0
    && typeof session.browserLaunchId === "string" && session.browserLaunchId.length > 0
    && typeof session.contextId === "string" && session.contextId.length > 0
    && session.sourceSha256 === currentSourceSha256 && session.runtimeBuildId === build.runtimeBuildId
    && session.consoleErrors?.length === 0 && session.pageErrors?.length === 0)
    && sessions[0].browserLaunchId !== sessions[1].browserLaunchId
    && sessions[0].contextId !== sessions[1].contextId
    && Date.parse(sessions[0].closedAt) < Date.parse(sessions[1].launchedAt);
}

export function inspectM5LongRuns(receipts, build, currentSourceSha256, sessions, workloads = []) {
  const combined = combineM5LongRunReceipts(receipts);
  const legacy = inspectWebCurrentLongRunV648(build, combined, currentSourceSha256);
  // v648 invokes the full official v643 verify + replay. Do not repeat those
  // deep canonical passes here: each real browser raw can contain many MB of samples.
  const rawChecks = receipts.map((raw, index) => verifyLongRunRawV650(raw, 1, DEVICES[index], build));
  const singleBoundaryChecks = receipts.map((raw) => ({ ok: raw.boundary?.runtimePromotion === "closed"
    && raw.boundary?.physicalDevicePromotion === "closed"
    && ["productionPerformance", "physicalMobile", "realUserValidation", "scientificValidity", "copyrightApproval"]
      .every((claim) => raw.claims?.[claim] === false) }));
  const combinedRaw = verifyLongRunRawV650(combined, 2, "mobile", build);
  const clock = verifyRawClockAgreementV650(combined);
  const series = combined.observations.map(analyzeR78ObservationSeriesV665);
  const targets = series.map((entry, index) => inspectM5FrameTarget(DEVICES[index], entry));
  const advisoryReview = inspectM5Advisories(series);
  const workloadChecks = combined.observations.map((observation, index) => inspectM5Workload(workloads[index], observation, sessions?.[index]?.profile));
  const domCounterReview = { ok: workloadChecks.every((row) => row.domCounterReview.ok),
    status: workloadChecks.every((row) => row.domCounterReview.ok) ? "within-observed-running-return-reference" : "review-required",
    devices: workloadChecks.map((row, index) => ({ device: DEVICES[index], ...row.domCounterReview })) };
  const issues = [];
  if (legacy.status !== "verified-current-source-local-longrun") issues.push("legacy-verification-failed");
  if (!rawChecks.every((row) => row.ok) || !singleBoundaryChecks.every((row) => row.ok)
    || !combinedRaw.ok || !clock.ok) issues.push("raw-or-clock-invalid");
  if (!series.every((row) => row.ok)) issues.push("series-undercovered-or-invalid");
  if (!targets.every((row) => row.ok)) issues.push("registered-frame-target-missed");
  if (!advisoryReview.ok) issues.push("existing-series-advisory-review-required");
  if (!domCounterReview.ok) issues.push("DOM-counter-trend-review-required");
  if (!workloadChecks.every((row) => row.ok)) issues.push("registered-repeat-workload-not-proven");
  if (!inspectM5SessionEvidence(sessions, build, currentSourceSha256)) {
    issues.push("fresh-sequential-browser-evidence-invalid");
  }
  return { ok: issues.length === 0, issues, combined, legacy,
    officialChecksCoveredByLegacy: { implementation: "inspectWebCurrentLongRunV648",
      checks: ["verifyMainlineAR65LongRunReceiptV643", "replayMainlineAR65LongRunReceiptV643"],
      passed: legacy.status === "verified-current-source-local-longrun" },
    rawChecks, singleBoundaryChecks, combinedRaw, clock, series, targets, workloadChecks, advisoryReview, domCounterReview,
    candidateFreeze: issues.length === 0 ? "eligible-local-candidate-only" : advisoryReview.ok && domCounterReview.ok ? "not-qualified" : "review-required",
    boundary: BOUNDARY };
}

/** A single capture remains an input to a later two-device review, never a qualification. */
export function inspectM5SingleCapture(raw, device, build, currentSourceSha256, session, workload) {
  const scope = { qualifiedLongrun: false, candidateFreezeAllowed: false,
    candidateFreeze: "not-qualified-single-device-capture", requiredDevices: [...DEVICES], boundary: BOUNDARY };
  if (!DEVICES.includes(device) || raw?.observations?.length !== 1) return { ...scope,
    status: "invalid-single-device-capture", captureValid: false, issues: ["one-single-device-raw-required"] };
  const observation = raw.observations[0];
  const rawCheck = verifyLongRunRawV650(raw, 1, device, build);
  const clock = verifyRawClockAgreementV650(raw);
  const series = analyzeR78ObservationSeriesV665(observation);
  const target = inspectM5FrameTarget(device, series);
  const workloadCheck = inspectM5Workload(workload, observation, session?.profile);
  const advisoryReview = inspectM5Advisories([series]);
  const singleBoundaryCheck = { ok: raw.boundary?.runtimePromotion === "closed"
    && raw.boundary?.physicalDevicePromotion === "closed"
    && ["productionPerformance", "physicalMobile", "realUserValidation", "scientificValidity", "copyrightApproval"]
      .every((claim) => raw.claims?.[claim] === false) };
  const source = build?.status === "passed" && build?.sourceStable === true
    && build?.inputBefore?.sha256 === currentSourceSha256 && build?.inputAfterSha256 === currentSourceSha256;
  const sessionCheck = session?.device === device && session.browserClosed === true
    && session.freshContext === true && session.priorObservationCount === 0
    && typeof session.browserLaunchId === "string" && session.browserLaunchId.length > 0
    && typeof session.contextId === "string" && session.contextId.length > 0
    && session.sourceSha256 === currentSourceSha256 && session.runtimeBuildId === build.runtimeBuildId
    && session.consoleErrors?.length === 0 && session.pageErrors?.length === 0
    && Date.parse(session.launchedAt) <= Date.parse(observation.startedAt)
    && Date.parse(session.closedAt) >= Date.parse(observation.endedAt);
  const checks = { raw: rawCheck.ok, clock: clock.ok, source, boundary: singleBoundaryCheck.ok,
    series: series.ok, target: target.ok, workload: workloadCheck.ok, session: sessionCheck };
  const issues = Object.entries(checks).filter(([, ok]) => !ok).map(([name]) => `${name}-invalid`);
  const reviewIssues = [!advisoryReview.ok && "existing-series-advisory-review-required",
    !workloadCheck.domCounterReview.ok && "DOM-counter-trend-review-required"].filter(Boolean);
  return { ...scope, status: issues.length ? "invalid-single-device-capture" : "capture-complete-awaiting-paired-review",
    device, captureValid: issues.length === 0, issues, reviewIssues, checks,
    rawCheck, clock, series, target, workloadCheck, advisoryReview,
    domCounterReview: workloadCheck.domCounterReview, singleBoundaryCheck };
}

export const M5_NATURAL_DOM_SETTLE_POLICY = Object.freeze({
  elapsedTargetsMs: Object.freeze([0, 15_000, 30_000, 60_000, 120_000]),
  scope: "same-session-light-counters-only-additional-review-evidence-no-GC-no-qualification",
});

/** Keep normal product activity running; record an ended observation rather than restarting it. */
export async function captureM5NaturalDOMSettle(page, { assertRunning, assertPanelMounted, onSample },
  runtime = { now: () => performance.now(), wait: delay, counters: readM5DOMCounters, state: readM5WorkloadState }) {
  const started = runtime.now();
  const result = { policy: M5_NATURAL_DOM_SETTLE_POLICY, startedAt: new Date().toISOString(), samples: [],
    qualifiedLongrun: false, candidateFreezeAllowed: false, garbageCollectionRequested: false };
  for (const elapsedTargetMs of M5_NATURAL_DOM_SETTLE_POLICY.elapsedTargetsMs) {
    let remaining;
    while ((remaining = elapsedTargetMs - (runtime.now() - started)) > 0) {
      assertRunning();
      await runtime.wait(Math.min(1_000, remaining));
    }
    assertRunning();
    await assertPanelMounted();
    const sample = { elapsedTargetMs, actualElapsedMs: runtime.now() - started, at: new Date().toISOString(),
      domCounters: await runtime.counters(page), state: await runtime.state(page) };
    result.samples.push(sample);
    await onSample(sample, result.samples.length - 1);
  }
  result.endedAt = new Date().toISOString();
  result.status = result.samples.every((sample) => sample.domCounters.status === "observed"
    && sample.domCounters.sessionDetached === true && sample.state.longrun?.running === true
    && sample.state.longrun?.observationCount === 0) ? "observed-additional-review-evidence" : "review-required";
  return result;
}

async function powershellJson(script) {
  const { stdout } = await exec("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", script],
    { windowsHide: true, timeout: 10_000, maxBuffer: 64 * 1024 });
  return JSON.parse(stdout.trim());
}
async function machineIdentity() {
  return powershellJson("$m5os=Get-CimInstance Win32_OperatingSystem; $m5cpu=Get-CimInstance Win32_Processor; "
    + "[pscustomobject]@{os=$m5os.Caption; osVersion=$m5os.Version; totalPhysicalBytes=([double]$m5os.TotalVisibleMemorySize*1024); "
    + "cpu=@($m5cpu | Select-Object Name,NumberOfCores,NumberOfLogicalProcessors)} | ConvertTo-Json -Depth 4 -Compress");
}
async function memorySample() {
  const sample = await powershellJson("$m5os=Get-CimInstance Win32_OperatingSystem; "
    + "$m5mem=Get-CimInstance Win32_PerfFormattedData_PerfOS_Memory; "
    + "[pscustomobject]@{freePhysicalBytes=([double]$m5os.FreePhysicalMemory*1024); "
    + "commitLimitBytes=[double]$m5mem.CommitLimit; committedBytes=[double]$m5mem.CommittedBytes} | ConvertTo-Json -Compress");
  return { at: new Date().toISOString(), ...sample };
}
async function scriptPins() {
  return Promise.all(M5_LONGRUN_DRIVER_PATHS.map(async (name) => {
    const bytes = await readFile(path.join(ROOT, "scripts", name));
    return { path: `scripts/${name}`, sha256: digest(bytes), bytes: bytes.length };
  }));
}
async function save(directory, name, value) {
  const bytes = Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
  const filename = path.join(directory, name);
  await writeFile(filename, bytes, { flag: "wx" });
  return { path: path.relative(ROOT, filename).replaceAll("\\", "/"), sha256: digest(bytes), bytes: bytes.length };
}
async function sourceBinding(build) {
  const inputs = await captureBuildInputs();
  const diskBuildId = (await readFile(path.resolve(ROOT, build.distDir, "BUILD_ID"), "utf8")).trim();
  return validateM1Build(build, inputs, diskBuildId);
}
async function openPanel(page, origin) {
  await page.goto(origin, { waitUntil: "domcontentloaded", timeout: 30_000 });
  await page.locator("[data-atlas-app-shell]").waitFor({ state: "visible", timeout: 20_000 });
  await page.locator("[data-mainline-a-tools-toggle]").click();
  await page.getByRole("button", { name: "性能生命周期", exact: true }).click();
  await page.locator("[data-mainline-a-r65-longrun]").waitFor({ state: "attached" });
  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    const state = await observe(page);
    if (state.archiveState && !["loading", "saving"].includes(state.archiveState) && state.resourceTotal > 0) return state;
    await delay(500);
  }
  throw new Error("m5-longrun:panel-not-ready");
}
async function runtimeProfile(page, frozen = null, options = {}) {
  const state = frozen ? await waitForM5QualityState(page, frozen, options) : await readM5WorkloadState(page);
  return { ...m5QualityRecord(state), canvasCount: state.canvasCount,
    renderer: { measurement: "rolling-window-samples-not-whole-run-percentiles", r3fWindowCapacity: 720, gpuWindowCapacity: 240,
      r3f: { p50Ms: state.renderer.r3fP50Ms, p95Ms: state.renderer.r3fP95Ms, samples: state.renderer.r3fSamples },
      gpu: { p50Ms: state.renderer.gpuP50Ms, p95Ms: state.renderer.gpuP95Ms, samples: state.renderer.gpuSamples, timer: state.renderer.gpuTimer },
      drawCalls: state.renderer.drawCalls, triangles: state.renderer.triangles, textures: state.renderer.textures, programs: state.renderer.programs } };
}

export async function preserveM5InterruptedCapture(page, directory, device, session, error, completedRawPin = null) {
  let rawPin = completedRawPin;
  const rawCapture = { status: completedRawPin ? "already-persisted" : "not-started", abortAttempted: false,
    preObservationCount: null, postObservationCount: null, settled: false, errors: [] };
  if (!rawPin) {
    try {
      // The fixed route docks the controls and may leave the observation viewer open.
      // Restore normal UI access before aborting; visibility alone would silently miss
      // a running observation and export the previous (possibly empty) receipt.
      const viewerClose = page.locator("dialog[data-mainline-a-nebula-viewer]")
        .getByRole("button", { name: "关闭观测图放大", exact: true });
      if (await viewerClose.isVisible()) await viewerClose.press("Enter", { timeout: 3_000 });
      const performancePanel = page.locator('[data-mainline-a-performance="v625"]');
      if (await performancePanel.getAttribute("data-mainline-a-performance-docked") === "true") {
        await page.getByRole("button", { name: "展开性能观察面板", exact: true }).press("Enter", { timeout: 3_000 });
      }
      const before = await browserReceipt(page);
      rawCapture.preObservationCount = before?.observations?.length ?? 0;
      const abort = page.getByRole("button", { name: "中止并留账", exact: true });
      if (await abort.isVisible()) {
        rawCapture.abortAttempted = true;
        await abort.press("Enter", { timeout: 3_000 });
        // UI abort finalizes asynchronously. Save only after the published browser
        // receipt contains the newly aborted row, or explicitly retain a wait failure.
        await page.waitForFunction((count) =>
          (window.__mainlineAR65LongRunReceiptV643?.observations?.length ?? 0) > count,
        rawCapture.preObservationCount, { timeout: 10_000 });
        rawCapture.settled = true;
        rawCapture.status = "aborted-observation-published";
      } else {
        rawCapture.status = "no-visible-running-observation";
      }
    } catch (cleanupError) {
      rawCapture.status = "cleanup-incomplete-surviving-receipt-only";
      rawCapture.errors.push(cleanupError.message);
    }
    const raw = await browserReceipt(page).catch((readError) => {
      rawCapture.status = "cleanup-incomplete-surviving-receipt-only";
      rawCapture.errors.push(readError.message);
      return null;
    });
    rawCapture.postObservationCount = raw?.observations?.length ?? null;
    rawPin = await save(directory, `${device}-interrupted-browser-raw.json`, raw);
  }
  await save(directory, `${device}-interrupted-session.json`, { ...session, error: error.message,
    qualityEvidence: error.qualityEvidence ?? null,
    signal: error.signal ?? null, rawPin, rawAlreadySaved: completedRawPin !== null, rawCapture,
    sessionSnapshotScope: "before-owned-browser-close" });
  return rawPin;
}

// A new launch and context per call; only resources owned by this invocation are closed.
export async function withM5FreshBrowser(config, device, task, launch = (options) => chromium.launch(options)) {
  const session = { device, browserLaunchId: randomUUID(), contextId: randomUUID(),
    launchedAt: new Date().toISOString(), browserClosed: false, freshContext: true,
    launch: { headless: true, executablePath: config.chrome, args: [], handleSIGINT: false, handleSIGTERM: false },
    context: { viewport: VIEWPORTS[device], deviceScaleFactor: 1, isMobile: device === "mobile", hasTouch: device === "mobile" },
    consoleErrors: [], pageErrors: [] };
  const browser = await launch(session.launch);
  try {
    const context = await browser.newContext(session.context);
    try {
      const page = await context.newPage();
      page.setDefaultTimeout(10_000);
      page.on("console", (message) => { if (message.type() === "error") session.consoleErrors.push(message.text()); });
      page.on("pageerror", (error) => session.pageErrors.push(error.message));
      return { value: await task(page, session), session };
    } finally { await context.close(); }
  } finally {
    await browser.close();
    session.browserClosed = true;
    session.closedAt = new Date().toISOString();
  }
}

export async function runM5LongRun(config) {
  ensure(config.device === undefined || config.device === null || DEVICES.includes(config.device), "invalid-device");
  const devices = config.device ? [config.device] : DEVICES;
  const captureScope = devices.length === 1 ? "single-device-capture-only-awaiting-paired-review" : "two-device-acceptance";
  const directory = path.join(ROOT, "output/playwright", `mainline-a-m5-longrun-${config.runId}`);
  await mkdir(path.dirname(directory), { recursive: true });
  await mkdir(directory); // Never replace an earlier attempt, even one that failed preflight.
  const journal = await createM5ProgressJournal(directory);
  const termination = createM5SignalAbort();
  const startedAt = new Date().toISOString();
  const receipts = [], rawPins = [], sessions = [], guards = [], workloads = [], workloadPins = [];
  let stage = "preflight", build = null, binding = null, pins = null, activeSession = null;
  const checkpoint = (kind, detail = {}) => journal.append({ kind, stage, runId: config.runId, ...detail });
  const assertRunning = () => termination.signal.throwIfAborted();
  const guard = async (device) => {
    const sample = { ...(await memorySample()), device };
    const result = inspectM5ResourceGuard(sample);
    const record = { ...sample, ...result };
    guards.push(record);
    await checkpoint("resource-guard", { record });
    ensure(result.ok, "resource-protection-stop", result.issues);
    assertRunning();
    return record;
  };
  try {
    await checkpoint("started", { policy: M5_LONGRUN_POLICY, captureScope, selectedDevices: devices, boundary: BOUNDARY });
    assertRunning();
    const buildBytes = await readFile(config.build);
    build = JSON.parse(buildBytes.toString("utf8"));
    binding = await sourceBinding(build);
    pins = await scriptPins();
    await save(directory, "plan.json", { schema: "mainline-a-m5-longrun-plan", startedAt,
      runId: config.runId, origin: config.origin, policy: M5_LONGRUN_POLICY,
      captureScope, selectedDevices: devices, requiredQualificationDevices: DEVICES,
      naturalDOMSettle: M5_NATURAL_DOM_SETTLE_POLICY,
      buildReceipt: { path: path.relative(ROOT, config.build).replaceAll("\\", "/"), sha256: digest(buildBytes) },
      binding, scripts: pins, machine: await machineIdentity(), node: process.version,
      launch: { headless: true, executablePath: config.chrome, args: [], playwrightDefaultArgs: true,
        handleSIGINT: false, handleSIGTERM: false },
      contexts: devices.map((device) => ({ device, viewport: VIEWPORTS[device], deviceScaleFactor: 1,
        isMobile: device === "mobile", hasTouch: device === "mobile", physicalDevice: false })),
      quality: M5_QUALITY_POLICY,
      workload: M5_WORKLOAD_POLICY,
      boundary: BOUNDARY });
    await guard("preflight");
    for (const device of devices) {
      stage = `${device}-source-check`;
      assertRunning();
      await sourceBinding(build);
      await guard(device);
      const result = await withM5FreshBrowser(config, device, async (page, session) => {
        activeSession = session;
        assertRunning();
        let completedRawPin = null;
        let pendingRawWrite = null;
        let interrupted = false;
        const assertCaptureRunning = () => { assertRunning(); ensure(!interrupted, "capture-interrupted"); };
        let stopped = false;
        const stop = new AbortController();
        const monitor = (async () => {
          while (!stopped) {
            await delay(M5_LONGRUN_POLICY.resourceGuard.intervalMs, undefined, { signal: stop.signal });
            const sample = await guard(device);
            if (session.profile) {
              sample.runtimeProfile = await runtimeProfile(page, { device, preflightQuality: session.profile });
              await checkpoint("renderer-window", { device, runtimeProfile: sample.runtimeProfile });
            }
          }
        })();
        const capture = (async () => {
          stage = `${device}-open`;
          const opened = await openPanel(page, config.origin);
          assertCaptureRunning();
          const launch = verifyLongRunLaunchV650(build, binding.sourceSha256, opened);
          ensure(launch.ok && opened.observationCount === 0, "runtime-or-prior-observations-invalid", launch.issues);
          await page.locator("[data-atlas-runtime-quality-tier]").waitFor({ state: "attached", timeout: 5_000 });
          const actualQualityPreflight = await captureM5QualityPreflight(page, device);
          Object.assign(session, { priorObservationCount: opened.observationCount,
            runtimeBuildId: opened.buildId, sourceSha256: binding.sourceSha256,
            browserVersion: await page.context().browser().version(), profile: { ...await runtimeProfile(page), ...actualQualityPreflight } });
          ensure(session.profile.qualityTier && session.profile.devicePixelRatio === 1, "quality-or-dpr-unavailable");
          await save(directory, `${device}-preflight.json`, { ...session, runId: config.runId, boundary: BOUNDARY });
          await checkpoint("device-ready", { device, browserLaunchId: session.browserLaunchId,
            contextId: session.contextId, profile: session.profile, binding });
          assertCaptureRunning();
          const r65Panel = await page.locator("[data-mainline-a-r65-longrun]").elementHandle();
          const assertPanelMounted = async () => ensure(await page.locator("[data-mainline-a-r65-longrun]")
            .evaluate((node, original) => node === original, r65Panel), "longrun-panel-remounted");
          const onStage = async ({ sample, issues, ...detail }) => {
            await assertPanelMounted();
            const pin = await save(directory, `${device}-workload-${detail.phase}-${detail.index}-${detail.name}.json`, { ...detail, sample, issues });
            workloadPins.push({ ...pin, device, kind: "stage", phase: detail.phase, index: detail.index, name: detail.name });
            await checkpoint("workload-stage", { device, ...detail, issues, pin });
          };
          stage = `${device}-fixed-route-warmup`;
          const warmup = await warmupM5Workload(page, { device, profile: session.profile, runtimeBuildId: build.runtimeBuildId,
            assertRunning: assertCaptureRunning, onStage });
          const warmupPin = await save(directory, `${device}-workload-warmup.json`, warmup);
          workloadPins.push({ ...warmupPin, device, kind: "warmup" });
          await checkpoint("workload-warmup-complete", { device, warmupPin, preflightQuality: warmup.frozen.preflightQuality,
            baselineIdentityDigest: warmup.frozen.baseline.identityDigest });
          // Existing v650 controls must be visible for the untouched official resource cycle.
          await page.getByRole("button", { name: "展开性能观察面板", exact: true }).press("Enter");
          const anchor = await page.evaluate(() => ({ at: new Date().toISOString(), browserMs: performance.now() }));
          stage = `${device}-resource-cycle`;
          const cycle = await captureResourceCycle(page, device);
          assertCaptureRunning();
          await checkpoint("resource-cycle-captured", { device, totals: cycle.totals });
          stage = `${device}-fixed-repeat-workload`;
          const workload = await captureM5Workload(page, { device, warmup, anchor, assertRunning: assertCaptureRunning, onStage,
            onCycle: async (entry) => {
              await assertPanelMounted();
              const pin = await save(directory, `${device}-workload-cycle-${entry.index}.json`, entry);
              workloadPins.push({ ...pin, device, kind: "cycle", index: entry.index });
              await checkpoint("workload-cycle-complete", { device, index: entry.index, pin });
            } });
          await assertPanelMounted();
          const workloadPin = await save(directory, `${device}-workload.json`, workload);
          workloadPins.push({ ...workloadPin, device, kind: "workload" });
          workloads.push(workload);
          await checkpoint("workload-complete", { device, workloadPin });
          stage = `${device}-natural-DOM-settle`;
          const naturalDOMSettle = await captureM5NaturalDOMSettle(page, { assertRunning: assertCaptureRunning,
            assertPanelMounted, onSample: async (sample, index) => {
              const pin = await save(directory, `${device}-dom-settle-${index}.json`, sample);
              workloadPins.push({ ...pin, device, kind: "natural-DOM-settle-sample", index });
              await checkpoint("natural-DOM-settle-sample", { device, index, pin,
                actualElapsedMs: sample.actualElapsedMs, domCounters: sample.domCounters, longrun: sample.state.longrun });
            } });
          const naturalDOMSettlePin = await save(directory, `${device}-dom-settle.json`, naturalDOMSettle);
          workloadPins.push({ ...naturalDOMSettlePin, device, kind: "natural-DOM-settle" });
          await checkpoint("natural-DOM-settle-complete", { device, pin: naturalDOMSettlePin, status: naturalDOMSettle.status });
          stage = `${device}-observation`;
          await waitForObservation(page, device, 1, cycle.clockOffsetMs);
          assertCaptureRunning();
          const raw = await browserReceipt(page);
          pendingRawWrite = save(directory, `${device}-browser-raw.json`, raw);
          const rawPin = await pendingRawWrite;
          completedRawPin = rawPin;
          rawPins.push({ ...rawPin, device, runId: config.runId, browserLaunchId: session.browserLaunchId,
            sessionId: raw?.observations?.[0]?.sessionId, sourceSha256: binding.sourceSha256, runtimeBuildId: build.runtimeBuildId });
          receipts.push(raw);
          await checkpoint("raw-saved", { device, rawPin: rawPins.at(-1) });
          assertCaptureRunning();
          const checked = verifyLongRunRawV650(raw, 1, device, build);
          const clock = verifyRawClockAgreementV650(raw);
          const ended = await observe(page);
          const profile = await runtimeProfile(page, warmup.frozen, { stageName: "returned-baseline", requireWarmStage: true });
          ensure(checked.ok && clock.ok, "raw-invalid", [...checked.issues, ...clock.issues]);
          ensure(verifyLongRunLaunchV650(build, binding.sourceSha256, ended).ok, "ended-runtime-invalid");
          await sourceBinding(build);
          ensure(session.consoleErrors.length === 0 && session.pageErrors.length === 0, "browser-errors");
          await assertPanelMounted();
          await r65Panel.dispose();
          log("device-complete", { device, durationMs: raw.observations[0].observedDurationMs, raw: rawPin });
          return rawPin;
        })();
        try { return await raceM5Abort(Promise.race([capture, monitor]), termination.signal); }
        catch (error) {
          interrupted = true;
          stopped = true;
          stop.abort();
          await checkpoint("device-interrupted", { device, signal: error.signal ?? null, error: error.message });
          const savedRaw = completedRawPin ?? (pendingRawWrite ? await pendingRawWrite.catch(() => null) : null);
          const rawPin = await preserveM5InterruptedCapture(page, directory, device, session, error, savedRaw);
          await checkpoint("interrupted-raw-saved", { device, rawPin });
          throw error;
        } finally {
          stopped = true;
          stop.abort();
          await monitor.catch(() => {});
        }
      });
      sessions.push(result.session);
      await save(directory, `${device}-session.json`, result.session);
      await checkpoint("device-closed", { device, session: result.session });
      activeSession = null;
    }
    stage = "final-source-and-offline-verification";
    assertRunning();
    const finalBinding = await sourceBinding(build);
    ensure(JSON.stringify(await scriptPins()) === JSON.stringify(pins), "driver-source-drift");
    await guard("final");
    // Fatal process/heap termination cannot run finally. Persist all completed
    // inputs and guard history before entering synchronous official replay.
    await save(directory, "resource-guard-before-offline.json", { policy: M5_LONGRUN_POLICY.resourceGuard, samples: guards });
    await checkpoint("offline-verification-started", { rawPins, workloadPins, sessions, binding: finalBinding, scripts: pins });
    assertRunning();
    if (devices.length === 1) {
      const analysis = inspectM5SingleCapture(receipts[0], devices[0], build, finalBinding.sourceSha256, sessions[0], workloads[0]);
      await delay(0);
      assertRunning();
      await sourceBinding(build);
      ensure(JSON.stringify(await scriptPins()) === JSON.stringify(pins), "driver-source-drift");
      ensure(digest(await readFile(config.build)) === digest(buildBytes), "build-receipt-drift");
      for (const pin of [...rawPins, ...workloadPins]) {
        ensure(digest(await readFile(path.join(ROOT, pin.path))) === pin.sha256, "raw-artifact-drift", pin.path);
      }
      assertRunning();
      await save(directory, "capture-only-audit.json", { schema: "mainline-a-m5-single-device-capture-audit", ...analysis,
        runId: config.runId, startedAt, endedAt: new Date().toISOString(), binding: finalBinding,
        captureScope, selectedDevices: devices, rawPins, workloadPins, sessions, scripts: pins, policy: M5_LONGRUN_POLICY,
        derivation: "single original browser raw and sidecars; no combined receipt or pair qualification" });
      ensure(analysis.captureValid, "single-capture-invalid", analysis.issues);
      await checkpoint("capture-complete-awaiting-paired-review", { device: devices[0], qualifiedLongrun: false, candidateFreezeAllowed: false });
      log("capture-complete-awaiting-paired-review", { runId: config.runId, directory, device: devices[0] });
      return;
    }
    const analysis = inspectM5LongRuns(receipts, build, finalBinding.sourceSha256, sessions, workloads);
    await delay(0); // Let a signal received during synchronous replay abort before any pass is published.
    assertRunning();
    const combinedPin = await save(directory, "combined-derived-receipt.json", analysis.combined);
    // Recheck after potentially expensive offline replay, immediately before publishing its result.
    await sourceBinding(build);
    ensure(JSON.stringify(await scriptPins()) === JSON.stringify(pins), "driver-source-drift");
    ensure(digest(await readFile(config.build)) === digest(buildBytes), "build-receipt-drift");
    for (const pin of [...rawPins, ...workloadPins, combinedPin]) {
      ensure(digest(await readFile(path.join(ROOT, pin.path))) === pin.sha256, "raw-artifact-drift", pin.path);
    }
    assertRunning();
    const report = { ...analysis };
    delete report.combined;
    await save(directory, "audit.json", { schema: "mainline-a-m5-longrun-audit", ...report,
      status: analysis.ok ? "passed-local-browser-diagnostic" : analysis.candidateFreeze === "review-required" ? "review-required-local-browser-diagnostic" : "failed-local-browser-diagnostic",
      runId: config.runId, startedAt, endedAt: new Date().toISOString(), binding: finalBinding,
      rawPins, workloadPins, combinedPin, derivation: "offline v643 create/finalize over unchanged observations in pinned independent browser raw files; fixed-route sidecars remain separate",
      sessions, scripts: pins, policy: M5_LONGRUN_POLICY });
    ensure(analysis.ok, "acceptance-failed", analysis.issues);
    await checkpoint("completed", { status: "passed-local-browser-diagnostic", combinedPin });
    log("passed-local-browser-diagnostic", { runId: config.runId, directory });
  } catch (error) {
    // withM5FreshBrowser has completed its finally blocks before this catch runs.
    // Retain the actual close outcome even when no completed capture was returned.
    if (activeSession && !sessions.includes(activeSession)) {
      sessions.push(activeSession);
      await save(directory, `${activeSession.device}-session.json`, activeSession);
      await checkpoint("device-closed-after-failure", { device: activeSession.device, session: activeSession });
    }
    await checkpoint("failed", { signal: error.signal ?? null, error: error.message, rawPins, workloadPins });
    await save(directory, "attempt.json", { schema: "mainline-a-m5-longrun-attempt", status: "failed",
      runId: config.runId, startedAt, endedAt: new Date().toISOString(), stage,
      buildId: build?.buildId ?? null, binding, rawPins, workloadPins, sessions, error: error.message, signal: error.signal ?? null,
      qualityEvidence: error.qualityEvidence ?? null,
      browserObservationQualified: false, boundary: BOUNDARY });
    throw error;
  } finally {
    try {
      await save(directory, "resource-guard.json", { policy: M5_LONGRUN_POLICY.resourceGuard, samples: guards });
      await journal.flush();
    } finally { termination.dispose(); }
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { await runM5LongRun(parseM5LongRunOptions(process.argv.slice(2))); }
  catch (error) { console.error(error); process.exitCode = error.exitCode ?? 1; }
}
