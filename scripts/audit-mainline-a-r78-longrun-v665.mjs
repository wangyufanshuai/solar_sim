import { createHash } from "node:crypto";
import { lstat, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { captureBuildInputs } from
  "./build-mainline-a-preserved.mjs";
import { inspectR78LongRunV665,
  replayR78LongRunV665 } from
  "./verify-mainline-a-r78-longrun-v665.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PREFIX = "docs/release/v607/";
const RUN_ID = /^20261013-v665long0[1-9]$/;
const BUILD = PREFIX
  + "mainline-a-r77-build-20261013v664r77web01.json";
const FREEZE = PREFIX
  + "mainline-a-r77-v664-freeze-20261013v664r77freeze01.json";
const R77_AUDIT = PREFIX
  + "mainline-a-r77-v664-evidence-audit-20261013v664r77web01.json";
const R77_ROUND = PREFIX
  + "mainline-a-r77-v664-round-20261013.json";

function check(valid, code, detail) {
  if (!valid) throw new Error("r78-audit:" + code
    + (detail === undefined ? "" : ":" + JSON.stringify(detail)));
}
function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}
function safe(relative) {
  check(/^docs\/release\/v607\/[a-z0-9-]+\.json$/i
    .test(relative), "path-invalid", relative);
  const resolved = path.resolve(ROOT, relative);
  check(resolved.toLowerCase().startsWith(
    (ROOT + path.sep).toLowerCase()),
  "path-outside-worktree", relative);
  return resolved;
}
async function pinned(relative, maxBytes = 256 * 1024 * 1024) {
  const absolute = safe(relative);
  const stats = await lstat(absolute);
  check(stats.isFile() && !stats.isSymbolicLink(),
    "input-not-regular", relative);
  check(stats.size > 0 && stats.size <= maxBytes,
    "input-size-invalid", { relative, bytes: stats.size });
  const bytes = await readFile(absolute);
  check(bytes.length === stats.size,
    "input-changed-while-reading", relative);
  return { value: JSON.parse(bytes.toString("utf8")),
    pin: { path: relative, bytes: bytes.length,
      sha256: sha256(bytes) } };
}
function paths(runId) {
  check(RUN_ID.test(runId), "run-id-invalid", runId);
  return { build: BUILD, freeze: FREEZE,
    r77Audit: R77_AUDIT, r77Round: R77_ROUND,
    raw: PREFIX
      + `mainline-a-r78-v665-browser-final-raw-${runId}.json`,
    verification: PREFIX
      + `mainline-a-r78-v665-longrun-verification-${runId}.json`,
    performance: PREFIX
      + `mainline-a-r78-v665-performance-${runId}.json`,
    replay: PREFIX
      + `mainline-a-r78-v665-longrun-replay-${runId}.json`,
    attempt: PREFIX
      + `mainline-a-r78-v665-audit-attempt-${runId}.json` };
}
export function parseR78AuditOptionsV665(argv) {
  check(argv.length === 4 && argv[0] === "--mode"
    && ["audit", "replay"].includes(argv[1])
    && argv[2] === "--run-id" && RUN_ID.test(argv[3]),
  "usage:--mode audit|replay --run-id YYYYMMDD-v665longNN");
  return { mode: argv[1], runId: argv[3] };
}
function describeError(error) {
  const message = error?.message ?? String(error);
  const classification = message.includes("ENOENT")
    ? "input-missing"
    : message.includes("source") || message.includes("drift")
      ? "source-or-identity-drift"
      : message.includes("size") || message.includes("regular")
        ? "artifact-invalid"
        : message.includes("rejected") || message.includes("unqualified")
          ? "evidence-rejected"
          : "unexpected-error";
  return { classification,
    name: error?.name ?? "Error", message };
}
function reportPerformance(verification, pins, raw) {
  const valid = verification.status
    === "verified-current-source-local-longrun";
  return {
    schema: "mainline-a-r78-performance-v665",
    evidenceClass: "local-browser-long-run-diagnostic",
    status: valid
      ? "two-current-source-local-longruns-verified"
      : "local-longrun-evidence-rejected",
    generatedAt: new Date().toISOString(),
    sourceSha256: verification.sourceSha256,
    buildId: verification.buildId,
    runtimeBuildId: verification.runtimeBuildId,
    freezeFingerprint: verification.freezeFingerprint,
    inputs: pins,
    observations: verification.windows,
    measuredAt: raw?.observations?.map((row) => ({
      device: row.device, startedAt: row.startedAt,
      endedAt: row.endedAt,
      observedDurationMs: row.observedDurationMs,
      sessionId: row.sessionId,
      independenceKey: row.independenceKey,
      visibilityInterruptions: row.visibility?.interruptions,
      consoleErrors: row.consoleErrors,
      pageErrors: row.pageErrors,
    })) ?? [],
    errors: verification.issues,
    claimScope: {
      localBrowserDiagnostic: valid,
      twoIndependentObservations: valid,
      physicalMobile: "not-run",
      realUserValidation: false,
      productionPerformanceEstablished: false,
      frameTimingsAreBrowserSamples: true,
      heapIsBrowserReportedNotPhysicalMemory: true,
      resourceBytesAreRegistryEstimatesNotMeasuredGpuMemory: true,
    },
    boundary: { candidateOnly: true, hold: true,
      notAdmitted: true, scientificPayloadWriteback: false,
      publicWebReleaseApproved: false },
  };
}

export async function computeR78AuditV665(runId) {
  const files = paths(runId);
  const sourceBefore = await captureBuildInputs();
  const [build, freeze, r77Audit, r77Round, raw] =
    await Promise.all([
      pinned(files.build, 2 * 1024 * 1024),
      pinned(files.freeze, 2 * 1024 * 1024),
      pinned(files.r77Audit, 2 * 1024 * 1024),
      pinned(files.r77Round, 2 * 1024 * 1024),
      pinned(files.raw),
    ]);
  check(r77Round.value.identity?.appSourceSha256
    === sourceBefore.sha256
    && r77Round.value.identity?.buildId === build.value.buildId
    && r77Round.value.remainingGates?.publicWebRelease
      === "blocked",
  "prior-round-identity-invalid");
  const verification = inspectR78LongRunV665({
    runId, build: build.value, freeze: freeze.value,
    r77Audit: r77Audit.value, raw: raw.value,
    rawPin: raw.pin,
    currentSourceSha256: sourceBefore.sha256,
  });
  const sourceAfter = await captureBuildInputs();
  check(sourceAfter.sha256 === sourceBefore.sha256,
    "source-drift-during-audit", {
      before: sourceBefore.sha256,
      after: sourceAfter.sha256 });
  const pins = [build.pin, freeze.pin,
    r77Audit.pin, r77Round.pin, raw.pin];
  return { files, pins, verification,
    performance: reportPerformance(verification,
      pins, raw.value) };
}
async function exclusive(relative, value) {
  await writeFile(safe(relative),
    JSON.stringify(value, null, 2) + "\n",
  { flag: "wx" });
}
export async function runR78AuditV665(options) {
  const startedAt = new Date().toISOString();
  const files = paths(options.runId);
  try {
    const result = await computeR78AuditV665(options.runId);
    if (options.mode === "audit") {
      await exclusive(files.verification, result.verification);
      await exclusive(files.performance, result.performance);
      return { status: result.verification.status,
        issues: result.verification.issues,
        verificationPath: files.verification,
        performancePath: files.performance,
        sourceSha256: result.verification.sourceSha256,
        observations: result.verification.windows.length };
    }
    const saved = await pinned(files.verification,
      2 * 1024 * 1024);
    const replay = replayR78LongRunV665(saved.value,
      result.verification);
    const output = {
      schema: "mainline-a-r78-longrun-replay-v665",
      generatedAt: new Date().toISOString(),
      verificationPin: saved.pin,
      rawPin: result.verification.rawPin,
      ...replay,
      boundary: result.verification.boundary,
      claims: { productionPerformance: false,
        physicalMobile: false, publicWebReleaseApproved: false },
    };
    await exclusive(files.replay, output);
    return { status: replay.status,
      ok: replay.ok, output: files.replay,
      fingerprint: replay.fingerprint };
  } catch (error) {
    const attempt = { schema: "mainline-a-r78-audit-attempt-v665",
      startedAt, endedAt: new Date().toISOString(),
      runId: options.runId, mode: options.mode,
      inputs: { build: files.build, raw: files.raw },
      ...describeError(error),
      evidencePromoted: false,
      productionPerformance: false,
      scientificPayloadWriteback: false };
    try { await exclusive(files.attempt, attempt); }
    catch { /* Preserve the original error and any prior attempt. */ }
    throw error;
  }
}

if (process.argv[1] && path.resolve(process.argv[1])
  === fileURLToPath(import.meta.url)) {
  const result = await runR78AuditV665(
    parseR78AuditOptionsV665(process.argv.slice(2)));
  console.log(JSON.stringify(result));
  if (result.ok === false
    || result.status === "local-longrun-evidence-rejected"
    || result.status === "candidate-longrun-rejected") {
    process.exitCode = 1;
  }
}
