import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { captureBuildInputs } from "./build-mainline-a-preserved.mjs";
import { safeFile } from "./mainline-a-release-evidence.mjs";
import longRunModule from "../app/lib/mainlineAR65LongRunV643.ts";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCHEMA = "mainline-a-web-r65-current-longrun-v648";
const MINIMUM_MS = 30 * 60 * 1000;
const EXPECTED = Object.freeze({ desktop: [1280, 720], mobile: [390, 844] });
const { verifyMainlineAR65LongRunReceiptV643,
  replayMainlineAR65LongRunReceiptV643 } = longRunModule.default ?? longRunModule;
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);
function issue(list, condition, code) { if (!condition) list.push(code); }

function observationSummary(entry) {
  return Object.freeze({ sessionId: entry.sessionId, independenceKey: entry.independenceKey,
    device: entry.device, scenario: entry.scenario, status: entry.status,
    startedAt: entry.startedAt, endedAt: entry.endedAt,
    observedDurationMs: entry.observedDurationMs,
    frameSamples: entry.frameSummary?.sampleCount ?? 0,
    frameP95Ms: entry.frameSummary?.p95Ms ?? null,
    memorySamples: entry.memorySummary?.sampleCount ?? 0,
    memoryDeltaBytes: entry.memorySummary?.deltaBytes ?? null,
    resourceTotal: [entry.resources?.baseline?.total ?? null,
      entry.resources?.active?.total ?? null, entry.resources?.final?.total ?? null],
    resourceDigest: [entry.resources?.baseline?.identityDigest ?? null,
      entry.resources?.active?.identityDigest ?? null,
      entry.resources?.final?.identityDigest ?? null],
    visibilityInterruptions: entry.visibility?.interruptions ?? null,
    consoleErrors: entry.consoleErrors, pageErrors: entry.pageErrors,
    source: entry.source, physicalDevice: entry.physicalDevice,
    digest: entry.digest });
}

export function inspectWebCurrentLongRunV648(build, raw, expectedSourceSha256) {
  const issues = [];
  issue(issues, build?.status === "passed" && build.exitCode === 0
    && build.sourceStable === true && build.inputBefore?.sha256 === expectedSourceSha256
    && build.inputAfterSha256 === expectedSourceSha256
    && build.runtimeBuildId === `mainline-a-${expectedSourceSha256.slice(0, 16)}`,
  "build-source-drift");
  issue(issues, raw?.schema === "mainline-a-r65-long-run-v643"
    && raw.version === "v643-mainline-a-r65-independent-long-run-lifecycle"
    && raw.evidenceClass === "browser-runtime-long-run-observation"
    && raw.status === "qualified" && raw.requestedObservations === 2
    && raw.minDurationMs === MINIMUM_MS, "raw-receipt-not-qualified");
  issue(issues, raw?.build?.buildId === build?.runtimeBuildId
    && raw.build.runtimeBuildId === build.runtimeBuildId
    && raw.build.branch === build.branch && raw.build.head === build.head
    && raw.build.route === "/" && raw.build.source === "runtime-marker",
  "browser-build-identity-drift");
  issue(issues, raw?.boundary?.candidateOnly === true
    && raw.boundary.hold === true && raw.boundary.notAdmitted === true
    && raw.boundary.scientificPayloadWriteback === false
    && raw.boundary.runtimePromotion === "closed"
    && raw.claims?.productionPerformance === false
    && raw.claims?.realUserValidation === false
    && raw.claims?.scientificValidity === false
    && raw.claims?.copyrightApproval === false
    && raw.claims?.physicalMobile === false,
  "boundary-or-claim-promotion");
  const rows = Array.isArray(raw?.observations) ? raw.observations : [];
  issue(issues, rows.length === 2
    && new Set(rows.map((entry) => entry?.sessionId)).size === 2
    && new Set(rows.map((entry) => entry?.independenceKey)).size === 2
    && new Set(rows.map((entry) => entry?.device)).size === 2,
  "two-independent-devices-missing");
  for (const [index, entry] of rows.entries()) {
    const device = entry?.device;
    const tag = `${device ?? index}`;
    const viewport = EXPECTED[device];
    issue(issues, Boolean(viewport)
      && same([entry.viewport?.width, entry.viewport?.height], viewport)
      && same([entry.endedViewport?.width, entry.endedViewport?.height], viewport)
      && entry.viewport?.device === device && entry.endedViewport?.device === device
      && entry.viewport?.class === (device === "mobile" ? "mobile-viewport" : "desktop-browser")
      && entry.endedViewport?.class === entry.viewport?.class,
    `${tag}:viewport-drift`);
    const actualWallMs = Date.parse(entry?.endedAt) - Date.parse(entry?.startedAt);
    issue(issues, entry?.status === "complete" && entry.requestedDurationMs === MINIMUM_MS
      && Number.isFinite(actualWallMs) && actualWallMs >= MINIMUM_MS
      && Number.isFinite(entry.observedDurationMs)
      && entry.observedDurationMs >= MINIMUM_MS
      && Math.abs(actualWallMs - entry.observedDurationMs) < 5_000,
    `${tag}:duration-invalid`);
    issue(issues, entry?.source === "browser-runtime" && entry.physicalDevice === false
      && entry.build?.buildId === build?.runtimeBuildId
      && entry.endedBuild?.buildId === build?.runtimeBuildId
      && entry.build?.branch === build?.branch && entry.endedBuild?.branch === build?.branch
      && entry.build?.head === build?.head && entry.endedBuild?.head === build?.head,
    `${tag}:source-or-build-drift`);
    issue(issues, entry?.visibility?.startedVisible === true
      && entry.visibility.endedVisible === true
      && entry.visibility.documentVisibility === "visible"
      && entry.visibility.rootVisible === true
      && entry.visibility.canvasCount >= 1
      && entry.visibility.interruptions === 0
      && entry.consoleErrors === 0 && entry.pageErrors === 0,
    `${tag}:visibility-or-page-error`);
    const before = entry?.resources?.baseline;
    const active = entry?.resources?.active;
    const after = entry?.resources?.final;
    issue(issues, before?.total > 0 && active?.total > before.total
      && after?.total === before.total
      && before.identityDigest !== active.identityDigest
      && before.identityDigest === after.identityDigest
      && before.estimatedGpuBytes < active.estimatedGpuBytes
      && before.estimatedGpuBytes === after.estimatedGpuBytes
      && before.phase === "baseline" && active.phase === "active" && after.phase === "final"
      && entry.notes?.includes("resource-switch-captured"),
    `${tag}:resource-lifecycle-invalid`);
    issue(issues, entry?.frameSummary?.sampleCount >= 10_000
      && entry.frameSamples?.length === entry.frameSummary.sampleCount
      && entry.memorySummary?.sampleCount >= 1_500
      && entry.memorySamples?.length === entry.memorySummary.sampleCount
      && entry.frameSummary?.p95Ms > 0,
    `${tag}:sampling-incomplete`);
  }
  if (rows.length === 2) {
    issue(issues, Date.parse(rows[0].endedAt) < Date.parse(rows[1].startedAt),
      "observations-overlap");
  }
  if (issues.length === 0) {
    const verified = verifyMainlineAR65LongRunReceiptV643(raw);
    const replayed = replayMainlineAR65LongRunReceiptV643(raw);
    issue(issues, verified.ok === true && verified.status === "qualified"
      && verified.completeLongRuns === 2
      && verified.observationChecks.every((entry) => entry.status === "valid")
      && replayed.status === "verified" && replayed.failures.length === 0,
    "offline-verifier-rejected");
  }
  return Object.freeze({ status: issues.length === 0
    ? "verified-current-source-local-longrun" : "blocked",
    issues: Object.freeze(issues), sourceSha256: expectedSourceSha256,
    buildId: build?.buildId ?? null, runtimeBuildId: build?.runtimeBuildId ?? null,
    observations: Object.freeze(rows.map(observationSummary)),
    currentSourceLongRuns: issues.length === 0 ? 2 : 0,
    physicalMobile: "not-run", productionPerformance: false });
}

async function pinnedJson(relative, maxBytes = 256 * 1024 * 1024) {
  const file = await safeFile(ROOT, relative);
  if (file.stat.size < 1 || file.stat.size > maxBytes) throw new Error(`longrun-v648:input-size:${relative}`);
  const bytes = await readFile(file.absolute);
  return { value: JSON.parse(bytes.toString("utf8")),
    pin: { path: relative, bytes: bytes.length, sha256: sha(bytes) } };
}
export async function auditWebCurrentLongRunV648(buildPath, rawPath) {
  const [build, raw] = await Promise.all([pinnedJson(buildPath, 2 * 1024 * 1024), pinnedJson(rawPath)]);
  const current = await captureBuildInputs();
  const inspected = inspectWebCurrentLongRunV648(build.value, raw.value, current.sha256);
  return Object.freeze({ schema: SCHEMA, evidenceClass: "performance",
    ...inspected, buildReceipt: build.pin, rawBrowserReceipt: raw.pin,
    claims: { currentSourceLongRunQualified: inspected.status === "verified-current-source-local-longrun",
      productionPerformance: false, realUserValidation: false,
      physicalMobile: false, scientificValidity: false, copyrightApproval: false },
    boundary: { candidateOnly: true, hold: true, notAdmitted: true,
      scientificPayloadWriteback: false } });
}
export function replayWebCurrentLongRunV648(saved, fresh) {
  if (saved?.schema !== SCHEMA || saved.status !== "verified-current-source-local-longrun"
    || fresh.status !== saved.status
    || saved.sourceSha256 !== fresh.sourceSha256 || saved.buildId !== fresh.buildId
    || !same(saved.buildReceipt, fresh.buildReceipt)
    || !same(saved.rawBrowserReceipt, fresh.rawBrowserReceipt)
    || !same(saved.observations, fresh.observations)
    || saved.currentSourceLongRuns !== 2
    || saved.claims?.productionPerformance !== false
    || saved.claims?.physicalMobile !== false
    || saved.boundary?.scientificPayloadWriteback !== false) {
    throw new Error("longrun-v648:saved-replay-mismatch");
  }
  return Object.freeze({ status: "replayed-current-source-local-longrun",
    sourceSha256: fresh.sourceSha256, buildId: fresh.buildId,
    observations: 2, physicalMobile: "not-run", productionPerformance: false });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const value = (name) => {
    const index = process.argv.indexOf(name);
    return index < 0 ? null : process.argv[index + 1];
  };
  const buildPath = value("--build");
  const rawPath = value("--raw");
  if (!buildPath || !rawPath) throw new Error("longrun-v648:build-and-raw-required");
  const report = await auditWebCurrentLongRunV648(buildPath, rawPath);
  const output = value("--output");
  const replay = value("--replay");
  for (const relative of [output, replay].filter(Boolean)) {
    if (!/^docs\/release\/v607\/[a-z0-9-]+\.json$/i.test(relative)) {
      throw new Error("longrun-v648:receipt-path-invalid");
    }
  }
  if (output) await writeFile(path.join(ROOT, output), `${JSON.stringify(report, null, 2)}\n`, { flag: "wx" });
  if (replay) console.log(JSON.stringify(replayWebCurrentLongRunV648(
    JSON.parse(await readFile(path.join(ROOT, replay), "utf8")), report), null, 2));
  else console.log(JSON.stringify({ status: report.status, issues: report.issues,
    currentSourceLongRuns: report.currentSourceLongRuns,
    sourceSha256: report.sourceSha256, output }, null, 2));
  if (report.status !== "verified-current-source-local-longrun") process.exitCode = 1;
}
