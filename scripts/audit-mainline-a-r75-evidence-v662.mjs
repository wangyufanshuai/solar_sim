import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { captureBuildInputs } from "./build-mainline-a-preserved.mjs";
import { pinFileV662, safeWorkspacePathV662 } from
  "./build-mainline-a-r75-matrix-v662.mjs";
import { replayR75MatrixV662, verifyR75MatrixShapeV662 } from
  "./verify-mainline-a-r75-matrix-v662.mjs";
import { verifyHttpMatrixV662 } from
  "./verify-mainline-a-r75-http-v662.mjs";
import { verifyDisabledHttpV662 } from
  "./verify-mainline-a-r75-http-disabled-v662.mjs";
import { verifyR73LongRunV660 } from
  "./capture-mainline-a-r73-longrun-v660.mjs";

const HISTORICAL_SOURCE = Object.freeze([
  "docs/release/v607/mainline-a-r74-v661-page-ledger-20261013v661r74page02.json",
  "docs/release/v607/mainline-a-r74-v661-page-audit-20261013v661r74page02.json",
]);
const ROLLBACK = "docs/release/v607/mainline-a-r73-v660-web-candidate-20261013v660r73web02.json";
const CODE_CHANGE = "docs/release/v607/mainline-a-r75-v662-code-change-20261013.json";
const TOOL_SOURCE = Object.freeze([
  "app/lib/mainlineAWebAcceptanceV662.ts",
  "app/components/MainlineAWebAcceptancePanelV662.tsx",
  "app/components/MainlineANebulaReviewPanelV610.tsx",
  "scripts/build-mainline-a-r75-matrix-v662.mjs",
  "scripts/verify-mainline-a-r75-matrix-v662.mjs",
  "scripts/verify-mainline-a-r75-http-v662.mjs",
  "scripts/verify-mainline-a-r75-http-disabled-v662.mjs",
  "scripts/capture-mainline-a-r75-matrix-browser-v662.mjs",
  "scripts/build-mainline-a-r75-visual-v662.mjs",
  "scripts/audit-mainline-a-r75-evidence-v662.mjs",
  "scripts/verify-mainline-a-r75-candidate-v662.mjs",
  "scripts/capture-mainline-a-web-canonical-scene-v648.mjs",
  "scripts/capture-mainline-a-web-sky-browser-v656.mjs",
  "scripts/capture-mainline-a-r73-browser-v660.mjs",
  "scripts/capture-mainline-a-r73-longrun-v660.mjs",
  "scripts/build-mainline-a-preserved.mjs",
  "scripts/capture-mainline-a-web-r65-longrun-v650.mjs",
]);
const V616 = Object.freeze([
  { path: "docs/release/post-v593/source-snapshots/simbad-stellar-24-2026-08-25.json",
    sha256: "706be4e043fce25df4cd0e01522dd6ef5863c5cdf902c3e08ab6563e6c7a863b" },
  { path: "app/data/mainlineABetaStellarProjectionV607.generated.ts",
    sha256: "8fbb31166d5b96890236da6842ce9f53a4ace3133ffbaabccd9811e8005e0dce" },
]);
function check(value, code, detail) {
  if (!value) throw new Error(`r75-evidence:${code}${detail
    ? `:${JSON.stringify(detail)}` : ""}`);
}
function receiptPaths(config) {
  const base = "docs/release/v607/";
  return { build: `${base}mainline-a-r75-build-${config.runId}.json`,
    matrix: `${base}mainline-a-r75-v662-matrix-${config.runId}.json`,
    replay: `${base}mainline-a-r75-v662-matrix-replay-${config.runId}.json`,
    http: `${base}mainline-a-r75-v662-http-${config.runId}.json`,
    httpDisabled: `${base}mainline-a-r75-v662-http-disabled-${config.runId}.json`,
    matrixBrowser: `${base}mainline-a-r75-v662-matrix-browser-${config.matrixBrowserRunId}.json`,
    canonicalDesktop: `${base}mainline-a-r75-web-canonical-scene-desktop-raw-20261013-v662scene01.json`,
    canonicalMobile: `${base}mainline-a-r75-web-canonical-scene-mobile-raw-20261013-v662scene02.json`,
    sky: `${base}mainline-a-r75-v662-sky-browser-${config.runId}.json`,
    nebula: `${base}mainline-a-r75-v662-nebula-browser-${config.runId}.json`,
    visual: `${base}mainline-a-r75-v662-visual-${config.runId}.json`,
    longrun: `${base}mainline-a-r75-v662-longrun-audit-${config.longId}.json`,
    longrunDesktop: `${base}mainline-a-r75-v662-browser-desktop-raw-${config.longId}.json`,
    longrunFinal: `${base}mainline-a-r75-v662-browser-final-raw-${config.longId}.json` };
}
export function parseEvidenceOptionsV662(argv) {
  check(argv.length === 6 && argv[0] === "--run-id"
    && argv[2] === "--matrix-browser-run-id"
    && argv[4] === "--long-id", "usage");
  check(/^20261013v662r75web0[1-9]$/.test(argv[1])
    && /^20261013v662r75web0[1-9]$/.test(argv[3])
    && /^20261013v662r75long0[1-9]$/.test(argv[5]),
  "run-identities-invalid");
  return { runId: argv[1], matrixBrowserRunId: argv[3],
    longId: argv[5] };
}
async function read(relative) {
  return JSON.parse(await readFile(safeWorkspacePathV662(relative), "utf8"));
}
function expectedCanonicalKeys(matrix) {
  return matrix.rows.filter((row) => row.key.startsWith("a:"))
    .map((row) => row.key.slice(2)).sort();
}
export function verifyCanonicalBrowserV662(raw, matrix, build, device) {
  const issues = [];
  const rows = raw?.items ?? [];
  const keys = rows.map((row) => row.key).sort();
  if (raw?.schema !== "mainline-a-r66-web-canonical-scene-raw-v648"
    || raw.device !== device || raw.items?.length !== 36
    || JSON.stringify(keys) !== JSON.stringify(expectedCanonicalKeys(matrix))
    || raw.build?.sourceSha256 !== build.inputAfterSha256
    || raw.build?.buildId !== build.buildId
    || raw.errors?.length !== 0 || raw.physicalDevice !== false
    || raw.boundary?.scientificPayloadWriteback !== false
    || raw.claims?.publicWebReleaseApproved !== false) {
    issues.push("canonical-device-identity-or-coverage");
  }
  for (const row of rows) {
    if (row?.observed?.selectedCatalogId !== (row.key.startsWith("star:")
      ? `stellar-hero:${row.key.slice(5)}` : row.key)
      || !row.runtime?.endsWith(" · ready")
      || row.observed?.build?.runtimeBuildId !== build.runtimeBuildId
      || row.observed?.boundary?.scientificPayloadWriteback !== "false"
      || !row.screenshot?.path?.endsWith(".png")) {
      issues.push(`canonical-row:${row?.key}`);
    }
    if (row.key?.startsWith("nebula:")
      && (row.observed?.nebula?.state !== "ready"
        || row.observed?.nebula?.rights !== "pending"
        || row.observed?.nebula?.admission !== "candidate-only")) {
      issues.push(`canonical-nebula:${row.key}`);
    }
  }
  return { ok: issues.length === 0, issues,
    objects: rows.length, screenshots: rows.length };
}
export function verifySkyBrowserV662(raw, matrix, build) {
  const issues = [];
  if (raw?.schema !== "mainline-a-r75-web-sky-browser-v662"
    || raw.status !== "passed-local-desktop-and-mobile-viewport"
    || raw.appSourceSha256 !== build.inputAfterSha256
    || raw.buildId !== build.buildId
    || raw.totals?.starCardSelections !== 48
    || raw.totals?.constellationChartSelections !== 24
    || raw.totals?.holdFocusAttemptsAllowed !== 0) {
    issues.push("sky-browser-identity-or-total");
  }
  const stars = matrix.rows.filter((row) => row.group === "beta-star");
  const constellations = matrix.rows.filter((row) =>
    row.group === "beta-constellation");
  for (const device of ["desktop", "mobileViewport"]) {
    const item = raw?.[device];
    if (item?.starSelections?.length !== 24
      || item?.constellationSelections?.length !== 12
      || item?.pageErrors?.length !== 0
      || item?.requests?.active !== 0
      || stars.some((row) => !item.starSelections.some((entry) =>
        entry.id === row.id && entry.focusEnabled
          === (row.state !== "identity-hold")))
      || constellations.some((row) => !item.constellationSelections.some(
        (entry) => entry.code === row.id && entry.chartCount === 1))) {
      issues.push(`sky-browser:${device}`);
    }
  }
  return { ok: issues.length === 0, issues, stars: 24,
    constellations: 12, viewports: 2 };
}
export function verifyNebulaBrowserV662(raw, matrix, build) {
  const issues = [];
  if (raw?.schema !== "mainline-a-r73-nebula-browser-v660"
    || raw.status !== "passed-local-desktop-and-mobile-viewport"
    || raw.sourceSha256 !== build.inputAfterSha256
    || raw.buildId !== build.buildId
    || raw.totals?.selections !== 48
    || raw.totals?.loadedImages !== 38
    || raw.totals?.policyHeldDetails !== 10
    || raw.totals?.objectUrlsAfterClose !== 0) {
    issues.push("nebula-browser-identity-or-total");
  }
  const expected = matrix.rows.filter((row) => row.group === "beta-nebula");
  for (const device of ["desktop", "mobileViewport"]) {
    const item = raw?.[device];
    if (item?.rows?.length !== 24
      || item.objectUrlsAfterClose !== 0
      || item.pageErrors?.length !== 0
      || item.consoleErrors?.length !== 0
      || expected.some((row) => !item.rows.some((entry) =>
        entry.id === row.id
        && entry.imageState === (row.imageRoute ? "loaded" : "policy-hold")
        && entry.sourceLinkMatched && entry.parentDetailMatched))) {
      issues.push(`nebula-browser:${device}`);
    }
  }
  return { ok: issues.length === 0, issues,
    candidates: 24, reviewImages: 19, heldImages: 5,
    objectUrlsAfterClose: 0 };
}
export function verifyMatrixBrowserV662(raw, matrix, build) {
  const issues = [];
  if (raw?.schema !== "mainline-a-r75-matrix-browser-v662"
    || raw.status !== "passed-local-desktop-and-mobile-viewport"
    || raw.appSourceSha256 !== build.inputAfterSha256
    || raw.buildId !== build.buildId
    || raw.totals?.selections !== 192
    || raw.totals?.externalImageRequests !== 0
    || raw.claims?.publicWebReleaseApproved !== false) {
    issues.push("matrix-browser-identity-or-total");
  }
  for (const device of ["desktop", "mobileViewport"]) {
    const item = raw?.[device];
    if (item?.selections?.length !== 96
      || item.pageErrors?.length !== 0
      || item.consoleErrors?.length !== 0
      || item.externalImageRequests?.length !== 0
      || item.conflictSourcePreserved !== true
      || item.layout?.documentWidth > item.layout?.viewportWidth
      || matrix.rows.some((row) => !item.selections.some((entry) =>
        entry.key === row.key && entry.state === row.state
        && entry.sourceLinkMatched))) {
      issues.push(`matrix-browser:${device}`);
    }
  }
  return { ok: issues.length === 0, issues,
    entriesPerViewport: 96, viewports: 2 };
}
export function verifyLongRunAuditV662(audit, desktop, final, build) {
  const issues = [];
  const rows = final?.observations ?? [];
  let recomputed;
  try {
    recomputed = verifyR73LongRunV660(final, desktop,
      build, build.inputAfterSha256);
  } catch {
    issues.push("raw-longrun-recomputation-failed");
  }
  if (audit?.schema !== "mainline-a-r75-longrun-audit-v662"
    || audit.status !== "verified-two-independent-current-source-local-browser-runs"
    || audit.sourceSha256 !== build.inputAfterSha256
    || audit.buildId !== build.buildId
    || audit.runtimeBuildId !== build.runtimeBuildId
    || audit.physicalMobile !== "not-run"
    || audit.claims?.productionPerformance !== false
    || audit.claims?.copyrightApproval !== false
    || audit.qualification?.ok !== true
    || desktop?.observations?.length !== 1
    || rows.length !== 2
    || desktop.observations[0]?.digest !== rows[0]?.digest
    || rows[0]?.device !== "desktop" || rows[1]?.device !== "mobile"
    || rows[0]?.independenceKey === rows[1]?.independenceKey
    || Date.parse(rows[0]?.endedAt) >= Date.parse(rows[1]?.startedAt)) {
    issues.push("longrun-identity-independence-or-boundary");
  }
  if (!recomputed?.ok || JSON.stringify(audit?.qualification)
    !== JSON.stringify(recomputed)) {
    issues.push("longrun-qualification-not-reproducible");
  }
  for (const row of rows) {
    if (row.observedDurationMs < 1_800_000
      || Date.parse(row.endedAt) - Date.parse(row.startedAt) < 1_800_000
      || row.visibility?.interruptions !== 0
      || row.pageErrors !== 0 || row.consoleErrors !== 0
      || row.resources?.active?.total <= row.resources?.baseline?.total
      || row.resources?.final?.identityDigest
        !== row.resources?.baseline?.identityDigest) {
      issues.push(`longrun-observation:${row?.device}`);
    }
  }
  return { ok: issues.length === 0, issues,
    durationsMs: rows.map((row) => row.observedDurationMs),
    frameP95Ms: rows.map((row) => row.frameSummary?.p95Ms),
    resourceTotals: rows.map((row) => [row.resources?.baseline?.total,
      row.resources?.active?.total, row.resources?.final?.total]) };
}
function collectScreenshots(value, collected = new Map()) {
  if (!value || typeof value !== "object") return collected;
  if (typeof value.path === "string" && value.path.endsWith(".png")
    && Number.isInteger(value.bytes) && typeof value.sha256 === "string") {
    const prior = collected.get(value.path);
    check(!prior || prior.sha256 === value.sha256,
      "duplicate-screenshot-drift", value.path);
    collected.set(value.path, value);
  }
  for (const child of Object.values(value)) {
    if (child && typeof child === "object") collectScreenshots(child, collected);
  }
  return collected;
}
export async function auditR75EvidenceV662(config) {
  const paths = receiptPaths(config);
  const currentSource = await captureBuildInputs();
  const values = await Promise.all(Object.entries(paths).map(
    async ([role, relative]) => [role, await read(relative)]));
  const records = Object.fromEntries(values);
  const { build, matrix, replay, http, httpDisabled,
    matrixBrowser, visual: visualReceipt,
    canonicalDesktop, canonicalMobile, sky, nebula,
    longrun, longrunDesktop, longrunFinal } = records;
  check(build.status === "passed" && build.sourceStable
    && build.inputAfterSha256 === currentSource.sha256
    && matrix.appSourceSha256 === currentSource.sha256
    && verifyR75MatrixShapeV662(matrix).ok,
  "current-static-identity");
  const freshReplay = await replayR75MatrixV662(matrix, { build });
  check(freshReplay.status === "verified-candidate-hold"
    && replay.status === "verified-candidate-hold",
  "offline-matrix-replay", freshReplay.issues);
  const checks = {
    http: verifyHttpMatrixV662(matrix, http.observations, http.origin),
    httpDisabled: verifyDisabledHttpV662(matrix,
      httpDisabled.observations, httpDisabled.origin),
    canonicalDesktop: verifyCanonicalBrowserV662(canonicalDesktop,
      matrix, build, "desktop"),
    canonicalMobile: verifyCanonicalBrowserV662(canonicalMobile,
      matrix, build, "mobile"),
    sky: verifySkyBrowserV662(sky, matrix, build),
    nebula: verifyNebulaBrowserV662(nebula, matrix, build),
    matrixBrowser: verifyMatrixBrowserV662(matrixBrowser, matrix, build),
    longrun: verifyLongRunAuditV662(longrun, longrunDesktop,
      longrunFinal, build),
  };
  for (const [name, result] of Object.entries(checks)) {
    check(result.ok, `${name}-failed`, result.issues);
  }
  check(visualReceipt?.status === "88-local-screenshots-pinned-seven-sample-inspected"
    && visualReceipt.appSourceSha256 === currentSource.sha256
    && visualReceipt.coverage?.screenshotCount === 88
    && visualReceipt.samples?.length === 7
    && visualReceipt.claims?.humanPerItemSignoff === false,
  "visual-receipt-invalid");
  const visual = collectScreenshots({ canonicalDesktop,
    canonicalMobile, sky, nebula, matrixBrowser });
  check(visual.size >= 85, "visual-coverage", visual.size);
  const screenshotPins = await Promise.all([...visual.values()]
    .map(async (expected) => {
      const actual = await pinFileV662(expected.path);
      check(actual.bytes === expected.bytes
        && actual.sha256 === expected.sha256,
      "screenshot-pin-drift", expected.path);
      return actual;
    }));
  const receiptPins = await Promise.all([
    ...Object.values(paths), ...HISTORICAL_SOURCE, ROLLBACK,
    CODE_CHANGE,
  ].map(pinFileV662));
  const toolPins = await Promise.all(TOOL_SOURCE.map(pinFileV662));
  const v616Pins = await Promise.all(V616.map(async (expected) => {
    const actual = await pinFileV662(expected.path);
    check(actual.sha256 === expected.sha256,
      "v616-digest-changed", expected.path);
    return actual;
  }));
  const sourceAfter = await captureBuildInputs();
  check(sourceAfter.sha256 === currentSource.sha256,
    "source-drift-during-audit");
  const packagePath = `docs/release/v607/mainline-a-r75-v662-web-candidate-${config.runId}.json`;
  const auditPath = `docs/release/v607/mainline-a-r75-v662-evidence-audit-${config.runId}.json`;
  const packageValue = { schema: "mainline-a-r75-web-candidate-v662",
    status: "verified-local-web-candidate-hold-public-release-blocked",
    createdAt: new Date().toISOString(),
    buildId: build.buildId, runtimeBuildId: build.runtimeBuildId,
    appSourceSha256: currentSource.sha256,
    rollbackReference: ROLLBACK,
    toolSourcePaths: TOOL_SOURCE,
    pinnedFiles: [...matrix.inputs, ...matrix.assetPins,
      ...v616Pins, ...receiptPins, ...toolPins, ...screenshotPins],
    evidenceClasses: { static: [paths.build, paths.matrix, paths.replay,
      CODE_CHANGE, ...TOOL_SOURCE],
      http: [paths.http, paths.httpDisabled], visual: [paths.visual,
        ...screenshotPins.map((pin) => pin.path)],
      browser: [paths.matrixBrowser, paths.canonicalDesktop,
        paths.canonicalMobile, paths.sky, paths.nebula],
      performance: [paths.longrun, paths.longrunDesktop,
        paths.longrunFinal], externalSource: HISTORICAL_SOURCE },
    coverage: { aLine: [12, 12, 12], betaStars: 24,
      betaConstellations: 12, betaNebulae: 24,
      reviewableNebulaImageChains: 19, imageHolds: 5,
      componentIdentitiesConfirmed: 0, rightsSigned: 0,
      runtimeAdmitted: 0 },
    boundary: { candidateOnly: true, hold: true, notAdmitted: true,
      scientificPayloadWriteback: false, publicWebReleaseApproved: false },
    claims: { copyrightApproval: false, scientificValidity: false,
      realUserValidation: false, productionPerformance: false,
      physicalMobile: false, publicWebReleaseApproved: false } };
  check(new Set(packageValue.pinnedFiles.map((pin) => pin.path)).size
    === packageValue.pinnedFiles.length,
  "package-duplicate-pin");
  await writeFile(safeWorkspacePathV662(packagePath),
    `${JSON.stringify(packageValue, null, 2)}\n`, { flag: "wx" });
  const audit = { schema: "mainline-a-r75-layered-evidence-audit-v662",
    status: "verified-current-source-local-candidate-hold",
    observedAt: new Date().toISOString(),
    buildId: build.buildId, appSourceSha256: currentSource.sha256,
    package: await pinFileV662(packagePath),
    evidence: { static: { status: "passed", matrixRows: 96,
      assetPins: matrix.assetPins.length,
      toolSourcePins: toolPins.length, v616Pins,
      sourceStable: true },
    http: { status: "passed-local-enabled-and-default-off",
      enabled: checks.http, disabled: checks.httpDisabled },
    visual: { status: "screenshots-pinned-sample-inspected-no-human-signoff",
      screenshotCount: screenshotPins.length,
      humanPerItemSignoff: false },
    browser: { status: "desktop-and-simulated-mobile-passed",
      canonicalObjectsPerViewport: 36, skyStarsPerViewport: 24,
      skyConstellationsPerViewport: 12,
      nebulaePerViewport: 24, matrixRowsPerViewport: 96,
      physicalMobile: "not-run" },
    performance: { status: "two-independent-local-browser-observations",
      ...checks.longrun, productionPerformanceClaim: false },
    externalSource: { status: "prior-real-HTTPS-captures-replayed",
      receipts: HISTORICAL_SOURCE,
      newImageResponsesCaptured: 0, rightsSigned: 0 } },
    boundary: packageValue.boundary,
    claims: packageValue.claims };
  await writeFile(safeWorkspacePathV662(auditPath),
    `${JSON.stringify(audit, null, 2)}\n`, { flag: "wx" });
  return { status: audit.status, package: packagePath,
    audit: auditPath, pinnedFiles: packageValue.pinnedFiles.length,
    screenshots: screenshotPins.length };
}
if (process.argv[1] && path.resolve(process.argv[1])
  === fileURLToPath(import.meta.url)) {
  console.log(JSON.stringify(await auditR75EvidenceV662(
    parseEvidenceOptionsV662(process.argv.slice(2)))));
}
