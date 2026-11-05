import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { captureBuildInputs } from "./build-mainline-a-preserved.mjs";
import { R76_OUTPUT_V663, safePathR76V663 } from
  "./build-mainline-a-r76-readiness-v663.mjs";
import { inspectR76ReadinessShapeV663 } from
  "./verify-mainline-a-r76-readiness-v663.mjs";

const SHA = /^[a-f0-9]{64}$/;
const V616 = [
  { path: "docs/release/post-v593/source-snapshots/simbad-stellar-24-2026-08-25.json",
    sha256:
      "706be4e043fce25df4cd0e01522dd6ef5863c5cdf902c3e08ab6563e6c7a863b" },
  { path: "app/data/mainlineABetaStellarProjectionV607.generated.ts",
    sha256:
      "8fbb31166d5b96890236da6842ce9f53a4ace3133ffbaabccd9811e8005e0dce" },
];
const digest = (bytes) => createHash("sha256").update(bytes)
  .digest("hex");
function check(value, code, detail) {
  if (!value) throw new Error(`r76-evidence:${code}${detail
    ? `:${JSON.stringify(detail)}` : ""}`);
}
export function parseR76EvidenceOptionsV663(argv) {
  check(argv.length === 8
    && argv[0] === "--build-run-id"
    && argv[2] === "--http-run-id"
    && argv[4] === "--browser-run-id"
    && argv[6] === "--source-run-id", "usage");
  const [buildRunId, httpRunId, browserRunId, sourceRunId] =
    [argv[1], argv[3], argv[5], argv[7]];
  check([buildRunId, httpRunId, browserRunId].every((id) =>
    /^20261013v663r76web0[1-9]$/.test(id))
    && /^20261013v663r76source0[1-9]$/.test(sourceRunId),
  "run-id");
  return { buildRunId, httpRunId, browserRunId, sourceRunId };
}
const base = "docs/release/v607/";
function receiptPaths(config) {
  return {
    build: `${base}mainline-a-r76-build-${config.buildRunId}.json`,
    http: `${base}mainline-a-r76-v663-http-${config.httpRunId}.json`,
    browser:
      `${base}mainline-a-r76-v663-browser-${config.browserRunId}.json`,
    source:
      `${base}mainline-a-r76-v663-readiness-replay-${config.sourceRunId}.json`,
  };
}
async function read(relative) {
  return JSON.parse(await readFile(safePathR76V663(relative), "utf8"));
}
function expectedKeys(snapshot) {
  return [...snapshot.stars.map((row) => `star:${row.id}`),
    ...snapshot.nebulae.map((row) => `nebula:${row.id}`)].sort();
}
function equal(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}
export function verifyR76EvidenceV663(snapshot, build, http,
  browser, source) {
  const issues = [...inspectR76ReadinessShapeV663(snapshot).issues];
  const sha = build?.inputAfterSha256;
  if (build?.status !== "passed"
    || build.sourceStable !== true
    || !SHA.test(sha ?? "")
    || build.inputBefore?.sha256 !== sha
    || build.runtimeBuildId !== `mainline-a-${sha.slice(0, 16)}`) {
    issues.push("build-source-or-identity-invalid");
  }
  if (source?.status !== "verified-candidate-hold"
    || source.inputFingerprint !== snapshot?.fingerprint
    || source.sourcePinsChecked !== 20
    || source.issues?.length !== 0
    || source.boundary?.scientificPayloadWriteback !== false) {
    issues.push("source-replay-invalid");
  }
  if (http?.status !== "passed-local-production-build-candidate-hold"
    || http.appSourceSha256 !== sha
    || http.buildId !== build?.buildId
    || http.verification?.ok !== true
    || http.verification?.heldImagesDenied !== 5
    || http.verification?.reviewImagesDefaultOff !== 19
    || http.observations?.readiness?.status !== 200
    || http.observations?.heldImages?.some((row) =>
      row.status !== 404)
    || http.observations?.reviewDefaultOff?.some((row) =>
      row.status !== 404)
    || http.claims?.publicWebReleaseApproved !== false) {
    issues.push("http-default-off-or-identity-invalid");
  }
  if (browser?.status
      !== "passed-local-desktop-and-simulated-mobile-candidate-hold"
    || browser.appSourceSha256 !== sha
    || browser.buildId !== build?.buildId
    || browser.snapshotFingerprint !== snapshot?.fingerprint
    || browser.physicalMobile !== "not-run"
    || browser.boundary?.scientificPayloadWriteback !== false
    || browser.claims?.publicWebReleaseApproved !== false
    || browser.claims?.productionPerformance !== false) {
    issues.push("browser-identity-or-boundary-invalid");
  }
  for (const [name, expectedViewport] of [
    ["desktop", [1280, 720]],
    ["mobileViewport", [390, 844]],
  ]) {
    const item = browser?.[name];
    if (!equal(item?.viewport, expectedViewport)
      || !equal(item?.readiness?.selections
        ?.map((row) => row.key).sort(), expectedKeys(snapshot))
      || item.readiness?.selections?.some((row) =>
        row.sourceMatched !== true || row.rightsSigned !== false
        || row.componentConfirmed !== false
        || row.rawImageCaptured !== false)
      || item.readiness?.panelLayout?.documentWidth
        > item.readiness?.panelLayout?.viewportWidth
      || item.pageErrors?.length !== 0
      || item.consoleErrors?.length !== 0
      || item.externalImageRequests?.length !== 0
      || item.readiness?.reviewChangedScene !== false
      || item.readiness?.emptySearchState !== true) {
      issues.push(`browser-${name}-coverage-or-errors`);
    }
    const diagnostic = item?.readiness?.performanceDiagnostic;
    if (diagnostic?.frames !== 120
      || !Number.isFinite(diagnostic.p95IntervalMs)
      || diagnostic.p95IntervalMs <= 0
      || diagnostic.scope
        !== "short-local-headless-Chrome-diagnostic-only") {
      issues.push(`performance-${name}-measurement-invalid`);
    }
  }
  if (browser?.desktop?.scene?.initialMode !== "details"
    || browser?.mobileViewport?.scene?.initialMode !== "peek"
    || browser.mobileViewport.scene.mobileDetailsCanExpand !== true
    || browser.mobileViewport.scene.objectId !== "nearby-star:vega"
    || browser.desktop.scene.objectId !== "nearby-star:vega") {
    issues.push("mobile-scene-lifecycle-invalid");
  }
  return { ok: issues.length === 0, issues,
    itemsPerViewport: expectedKeys(snapshot).length,
    viewports: 2, blockedImages: 5,
    defaultOffReviewImages: 19 };
}
function screenshotMetadata(browser) {
  return [
    { device: "desktop", kind: "readiness",
      meta: browser.desktop.readiness.overview },
    { device: "desktop", kind: "held-nebula-detail",
      meta: browser.desktop.readiness.detailScreenshot },
    { device: "desktop", kind: "scene-passport",
      meta: browser.desktop.scene.screenshots.initial },
    { device: "mobileViewport", kind: "readiness",
      meta: browser.mobileViewport.readiness.overview },
    { device: "mobileViewport", kind: "held-nebula-detail",
      meta: browser.mobileViewport.readiness.detailScreenshot },
    { device: "mobileViewport", kind: "scene-peek",
      meta: browser.mobileViewport.scene.screenshots.initial },
    { device: "mobileViewport", kind: "scene-details",
      meta: browser.mobileViewport.scene.screenshots.expanded },
  ];
}
export function verifyR76ScreenshotV663(item, bytes) {
  const expected = item.device === "desktop"
    ? [1280, 720] : [390, 844];
  const png = bytes.subarray(0, 8).equals(Buffer.from([
    137, 80, 78, 71, 13, 10, 26, 10]));
  const width = png && bytes.length >= 24
    ? bytes.readUInt32BE(16) : null;
  const height = png && bytes.length >= 24
    ? bytes.readUInt32BE(20) : null;
  const sha256 = digest(bytes);
  const ok = item.meta?.bytes === bytes.length
    && item.meta?.sha256 === sha256
    && width === expected[0] && height === expected[1];
  return { ok, path: item.meta?.path, kind: item.kind,
    device: item.device, bytes: bytes.length, sha256,
    width, height, screenshotOnly: true };
}
export async function runR76EvidenceV663(config) {
  const paths = receiptPaths(config);
  const [snapshot, build, http, browser, source,
    currentSource] = await Promise.all([
    read(R76_OUTPUT_V663), read(paths.build), read(paths.http),
    read(paths.browser), read(paths.source), captureBuildInputs(),
  ]);
  const verification = verifyR76EvidenceV663(snapshot,
    build, http, browser, source);
  check(verification.ok, "receipt-replay-failed",
    verification.issues);
  check(currentSource.sha256 === build.inputAfterSha256,
    "current-source-changed");
  const screenshots = [];
  for (const item of screenshotMetadata(browser)) {
    const bytes = await readFile(safePathR76V663(item.meta.path));
    const checked = verifyR76ScreenshotV663(item, bytes);
    check(checked.ok, "screenshot-pin-or-dimensions", checked);
    screenshots.push(checked);
  }
  const v616 = [];
  for (const expected of V616) {
    const bytes = await readFile(safePathR76V663(expected.path));
    const actual = digest(bytes);
    check(actual === expected.sha256, "v616-digest-changed",
      expected.path);
    v616.push({ ...expected, bytes: bytes.length });
  }
  check((await captureBuildInputs()).sha256 === currentSource.sha256,
    "source-drift-during-audit");
  const stamp = config.browserRunId;
  const visualPath =
    `${base}mainline-a-r76-v663-visual-${stamp}.json`;
  const performancePath =
    `${base}mainline-a-r76-v663-performance-${stamp}.json`;
  const externalPath =
    `${base}mainline-a-r76-v663-external-source-${stamp}.json`;
  const auditPath =
    `${base}mainline-a-r76-v663-evidence-audit-${stamp}.json`;
  const boundary = { candidateOnly: true, hold: true,
    notAdmitted: true, scientificPayloadWriteback: false,
    publicWebReleaseApproved: false };
  const visual = { schema: "mainline-a-r76-visual-v663",
    status: "seven-current-build-screenshots-rehashed",
    buildId: build.buildId, appSourceSha256: currentSource.sha256,
    browserReceipt: paths.browser, screenshots,
    visualSampleInspectedByAgent: [
      "mobile-viewport-held-nebula-detail",
      "desktop-held-nebula-detail",
      "mobile-viewport-scene-peek",
      "mobile-viewport-scene-details",
    ],
    humanPerItemVisualSignoff: false,
    realUserValidation: false, boundary };
  const performance = {
    schema: "mainline-a-r76-performance-v663",
    status: "short-local-browser-diagnostic-only",
    buildId: build.buildId, appSourceSha256: currentSource.sha256,
    browserReceipt: paths.browser,
    measurements: ["desktop", "mobileViewport"].map((device) => ({
      device,
      ...browser[device].readiness.performanceDiagnostic,
    })),
    localLongRunOnThisBuild: "not-run",
    priorR75LongRunsReusableForThisBuild: false,
    physicalMobile: "not-run",
    productionPerformanceEstablished: false, boundary };
  const external = {
    schema: "mainline-a-r76-external-source-v663",
    status: "twenty-prior-raw-pins-replayed-no-new-network-requests",
    sourceReplay: paths.source,
    generatedManifest: R76_OUTPUT_V663,
    sourcePinCount: snapshot.sourcePins.length,
    priorOfficialPages: 6,
    priorStructuredStellarResponses: 4,
    priorWdsPairArtifacts: 4,
    stellarPhysicalComponentsConfirmed: 0,
    blockedNebulaImageRequests: 5,
    newHttpsRequests: 0, newImageResponsesCaptured: 0,
    sourceValidityApproved: false, copyrightApproval: false,
    rightsSignatures: 0, boundary };
  const audit = {
    schema: "mainline-a-r76-evidence-audit-v663",
    status: "passed-current-source-local-web-candidate-release-blocked",
    observedAt: new Date().toISOString(),
    buildId: build.buildId, runtimeBuildId: build.runtimeBuildId,
    appSourceSha256: currentSource.sha256,
    snapshotFingerprint: snapshot.fingerprint,
    references: { ...paths, visual: visualPath,
      performance: performancePath,
      externalSource: externalPath },
    verification, screenshotCount: screenshots.length,
    v616Unchanged: v616,
    release: "blocked", physicalMobile: "not-run",
    publicDeployment: "not-run", boundary,
    claims: { scientificValidity: false,
      copyrightApproval: false,
      productionPerformance: false,
      realUserValidation: false,
      publicWebReleaseApproved: false },
  };
  for (const [name, value] of [
    [visualPath, visual], [performancePath, performance],
    [externalPath, external], [auditPath, audit],
  ]) {
    await writeFile(safePathR76V663(name),
      `${JSON.stringify(value, null, 2)}\n`, { flag: "wx" });
  }
  return { status: audit.status, verification,
    screenshotCount: screenshots.length,
    auditPath, visualPath, performancePath, externalPath };
}
if (process.argv[1] && path.resolve(process.argv[1])
  === fileURLToPath(import.meta.url)) {
  console.log(JSON.stringify(await runR76EvidenceV663(
    parseR76EvidenceOptionsV663(process.argv.slice(2)))));
}
