import { createHash } from "node:crypto";
import { analyzeR78ObservationSeriesV665 } from
  "./mainline-a-r78-longrun-series-v665.mjs";
import { inspectWebCurrentLongRunV648 } from
  "./verify-mainline-a-web-r65-current-v648.mjs";
import { verifyLongRunRawV650,
  verifyRawClockAgreementV650 } from
  "./capture-mainline-a-web-r65-longrun-v650.mjs";

const MIN_DURATION_MS = 30 * 60 * 1000;
const SOURCE_PATTERN = /^[a-f0-9]{64}$/;
const DEFAULT_BOUNDARY = Object.freeze({ candidateOnly: true,
  hold: true, notAdmitted: true,
  scientificPayloadWriteback: false,
  publicWebReleaseApproved: false });

function digest(value) {
  return createHash("sha256").update(JSON.stringify(value))
    .digest("hex");
}
function same(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}
function check(issues, valid, code) {
  if (!valid) issues.push(code);
}
function activeSource(input) {
  return input?.currentSourceSha256;
}
function priorVisualEvidence(input, issues) {
  const audit = input.r77Audit;
  const freeze = input.freeze;
  const build = input.build;
  const source = activeSource(input);
  check(issues, audit?.schema === "mainline-a-r77-evidence-audit-v664"
    && audit.status
      === "passed-current-source-local-candidate-release-blocked"
    && audit.release === "blocked"
    && audit.appSourceSha256 === source
    && audit.buildId === build?.buildId
    && audit.runtimeBuildId === build?.runtimeBuildId
    && audit.freezeFingerprint === freeze?.fingerprint
    && audit.screenshotCount === 77
    && audit.verification?.matrixBrowser?.matrixSelections === 192
    && audit.verification?.canonicalDesktop?.scenes === 36
    && audit.verification?.canonicalMobile?.scenes === 36,
  "r77-visual-browser-or-build-evidence-drift");
  check(issues, audit?.physicalMobile === "not-run"
    && audit.publicDeployment === "not-run"
    && audit.claims?.publicWebReleaseApproved === false
    && audit.claims?.productionPerformance === false
    && audit.boundary?.scientificPayloadWriteback === false,
  "r77-boundary-promoted");
}
function sourceEvidence(input, issues) {
  const build = input.build;
  const freeze = input.freeze;
  const source = activeSource(input);
  check(issues, SOURCE_PATTERN.test(source ?? "")
    && build?.status === "passed"
    && build.exitCode === 0 && build.sourceStable === true
    && build.inputBefore?.sha256 === source
    && build.inputAfterSha256 === source
    && build.runtimeBuildId
      === `mainline-a-${source.slice(0, 16)}`,
  "current-build-source-invalid");
  check(issues, freeze?.schema === "mainline-a-r77-web-freeze-v664"
    && freeze.appSourceSha256 === source
    && freeze.matrixRows?.length === 96
    && freeze.scenes?.length === 36
    && freeze.assetPins?.length === 49
    && freeze.boundary?.candidateOnly === true
    && freeze.boundary?.hold === true
    && freeze.boundary?.notAdmitted === true
    && freeze.boundary?.scientificPayloadWriteback === false
    && freeze.claims?.publicWebReleaseApproved === false,
  "frozen-web-source-or-boundary-invalid");
  check(issues, input.rawPin?.bytes > 1_000_000
    && SOURCE_PATTERN.test(input.rawPin?.sha256 ?? "")
    && input.rawPin?.path ===
      "docs/release/v607/mainline-a-r78-v665-browser-final-raw-"
      + input.runId + ".json",
  "raw-artifact-pin-invalid");
}
function observationEvidence(raw, build, issues) {
  const rows = raw?.observations ?? [];
  const expected = ["desktop", "mobile"];
  check(issues, raw?.schema === "mainline-a-r65-long-run-v643"
    && raw.version
      === "v643-mainline-a-r65-independent-long-run-lifecycle"
    && raw.evidenceClass === "browser-runtime-long-run-observation"
    && raw.status === "qualified"
    && raw.requestedObservations === 2
    && raw.minDurationMs === MIN_DURATION_MS
    && rows.length === 2,
  "raw-browser-contract-invalid");
  check(issues, raw?.build?.buildId === build?.runtimeBuildId
    && raw.build.runtimeBuildId === build.runtimeBuildId
    && raw.build.branch === build.branch
    && raw.build.head === build.head,
  "raw-browser-build-identity-invalid");
  check(issues, raw?.boundary?.candidateOnly === true
    && raw.boundary?.hold === true
    && raw.boundary?.notAdmitted === true
    && raw.boundary?.scientificPayloadWriteback === false
    && raw.claims?.productionPerformance === false
    && raw.claims?.realUserValidation === false
    && raw.claims?.physicalMobile === false,
  "raw-browser-boundary-promoted");
  for (const [index, device] of expected.entries()) {
    const row = rows[index];
    const viewport = device === "desktop"
      ? [1280, 720] : [390, 844];
    const wallMs = Date.parse(row?.endedAt)
      - Date.parse(row?.startedAt);
    check(issues, row?.device === device
      && row.status === "complete"
      && row.source === "browser-runtime"
      && row.physicalDevice === false
      && row.observedDurationMs >= MIN_DURATION_MS
      && wallMs >= MIN_DURATION_MS
      && Math.abs(wallMs - row.observedDurationMs) <= 5_000
      && same([row.viewport?.width, row.viewport?.height], viewport)
      && same([row.endedViewport?.width,
        row.endedViewport?.height], viewport)
      && row.build?.buildId === build.runtimeBuildId
      && row.endedBuild?.buildId === build.runtimeBuildId,
    `observation-${device}-identity-or-duration`);
  }
  check(issues, rows.length === 2
    && rows[0]?.sessionId !== rows[1]?.sessionId
    && rows[0]?.independenceKey !== rows[1]?.independenceKey
    && Date.parse(rows[0]?.endedAt)
      < Date.parse(rows[1]?.startedAt),
  "observations-not-independent-or-nonoverlapping");
}

export function inspectR78LongRunV665(input) {
  const issues = [];
  const raw = input?.raw;
  const build = input?.build;
  sourceEvidence(input, issues);
  priorVisualEvidence(input, issues);
  observationEvidence(raw, build, issues);
  const legacy = inspectWebCurrentLongRunV648(build,
    raw, activeSource(input));
  const desktopPrefix = raw?.observations?.length >= 1
    ? { ...raw, observations: raw.observations.slice(0, 1) }
    : raw;
  const rawDesktop = verifyLongRunRawV650(desktopPrefix, 1,
    "desktop", build);
  const rawMobile = verifyLongRunRawV650(raw, 2,
    "mobile", build);
  const rawClock = verifyRawClockAgreementV650(raw);
  check(issues, legacy.status
    === "verified-current-source-local-longrun"
    && legacy.currentSourceLongRuns === 2
    && legacy.issues.length === 0,
  "prior-offline-verifier-rejected");
  check(issues, rawDesktop.ok && rawMobile.ok
    && rawClock.ok,
  "raw-clock-or-resource-contract-rejected");
  const series = (raw?.observations ?? [])
    .map(analyzeR78ObservationSeriesV665);
  check(issues, series.length === 2
    && series.every((row) => row.ok)
    && series[0].device === "desktop"
    && series[1].device === "mobile",
  "window-series-incomplete");
  const windows = series.map((row) => ({
    device: row.device,
    sessionId: row.sessionId,
    durationMs: row.durationMs,
    frameSamples: row.frames.sampleCount,
    memorySamples: row.memory.sampleCount,
    frameP95Ms: row.frames.quantiles?.p95 ?? null,
    frameBudget: row.frames.frameBudget,
    frameTailTrend: row.frames.tailTrend,
    heapDeltaBytes: row.memory.deltaBytes,
    heapTrend: row.memory.trend,
    resourceTotals: row.resources.totals,
    resourceIdentityDigests: row.resources.identityDigests,
    renderableAcquired: row.resources.renderable.map(
      ({ identity, kind, owner, deltaCount,
        deltaBytes, contentSha256 }) => ({
        identity, kind, owner, deltaCount,
        deltaBytes, contentSha256 })),
    frameWindows: row.frames.windows.map((window) => ({
      index: window.index,
      count: window.sampleCount,
      p95Ms: window.deltaMs.p95,
      p99Ms: window.deltaMs.p99,
      longTaskCount: window.longTaskCount,
    })),
    memoryWindows: row.memory.windows.map((window) => ({
      index: window.index,
      count: window.sampleCount,
      usedSamples: window.usedSampleCount,
      firstUsedBytes: window.firstUsedBytes,
      lastUsedBytes: window.lastUsedBytes,
      deltaBytes: window.deltaBytes,
    })),
    issues: row.issues,
  }));
  const status = issues.length === 0
    ? "verified-current-source-local-longrun"
    : "candidate-longrun-rejected";
  const result = {
    schema: "mainline-a-r78-longrun-verification-v665",
    status, runId: input?.runId ?? null,
    sourceSha256: activeSource(input) ?? null,
    buildId: build?.buildId ?? null,
    runtimeBuildId: build?.runtimeBuildId ?? null,
    freezeFingerprint: input?.freeze?.fingerprint ?? null,
    rawPin: input?.rawPin ?? null,
    issues, windows,
    counts: { desktopLongRuns: status.startsWith("verified")
        ? 1 : 0,
      mobileViewportLongRuns: status.startsWith("verified")
        ? 1 : 0,
      totalIndependentLongRuns: status.startsWith("verified")
        ? 2 : 0 },
    boundary: DEFAULT_BOUNDARY,
    claims: { localCurrentSourceLongRun:
        status === "verified-current-source-local-longrun",
      productionPerformance: false,
      physicalMobile: false, realUserValidation: false,
      scientificValidity: false,
      copyrightApproval: false,
      publicWebReleaseApproved: false },
  };
  return { ...result, fingerprint: digest(result) };
}

export function replayR78LongRunV665(saved, fresh) {
  const copy = { ...saved };
  delete copy.fingerprint;
  const valid = saved?.schema
    === "mainline-a-r78-longrun-verification-v665"
    && saved.status === fresh?.status
    && saved.status === "verified-current-source-local-longrun"
    && saved.fingerprint === digest(copy)
    && saved.fingerprint === fresh.fingerprint
    && same(saved.rawPin, fresh.rawPin)
    && same(saved.windows, fresh.windows)
    && saved.counts?.totalIndependentLongRuns === 2
    && saved.boundary?.scientificPayloadWriteback === false
    && saved.claims?.productionPerformance === false
    && saved.claims?.publicWebReleaseApproved === false;
  return { ok: Boolean(valid),
    status: valid ? "replayed-current-source-local-longrun"
      : "replay-rejected",
    fingerprint: saved?.fingerprint ?? null,
    sourceSha256: fresh?.sourceSha256 ?? null,
    rawSha256: fresh?.rawPin?.sha256 ?? null,
    issues: valid ? [] : ["stored-or-current-evidence-drift"] };
}
