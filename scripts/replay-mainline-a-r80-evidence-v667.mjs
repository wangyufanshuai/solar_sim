import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { captureBuildInputs } from "./build-mainline-a-preserved.mjs";
import { safeWorkspacePathV662 } from
  "./build-mainline-a-r75-matrix-v662.mjs";
import { replayR79VisualAuditV666 } from
  "./audit-mainline-a-r79-visual-v666.mjs";
import { verifyR80HttpV667 } from
  "./verify-mainline-a-r80-http-v667.mjs";
import { inspectR80BrowserV667,
  verifyR80ScreenshotsV667 } from
  "./capture-mainline-a-r80-browser-v667.mjs";
import { inspectR79ExternalBoundaryV666 } from
  "./verify-mainline-a-r79-external-v666.mjs";

const sha256 = (bytes) => createHash("sha256").update(bytes)
  .digest("hex");
function check(value, code, detail) {
  if (!value) throw new Error("r80-replay:" + code
    + (detail ? ":" + JSON.stringify(detail) : ""));
}

const PATHS = Object.freeze({
  build: "docs/release/v607/mainline-a-r80-build-20261013v667r80web01.json",
  audit: "docs/release/v607/mainline-a-r79-v666-visual-static-20261013v666r79visual04.json",
  httpEnabled: "docs/release/v607/mainline-a-r80-v667-http-enabled-20261013v667r80http01.json",
  httpDefaultOff: "docs/release/v607/mainline-a-r80-v667-http-default-off-20261013v667r80http02.json",
  browser: "docs/release/v607/mainline-a-r80-v667-browser-20261013v667r80browser02.json",
  visual: "docs/release/v607/mainline-a-r80-v667-visual-20261013v667r80browser02.json",
  scenes: "docs/release/v607/mainline-a-r80-v667-scene-verification-20261013.json",
  external: "docs/release/v607/mainline-a-r79-v666-external-source-20261013v666r79external02.json",
  readiness: "app/data/mainlineAWebReadinessV663.generated.json",
});

async function pinnedJson(relative) {
  const bytes = await readFile(safeWorkspacePathV662(relative));
  return { relative, bytes: bytes.length,
    sha256: sha256(bytes), value: JSON.parse(bytes.toString("utf8")) };
}

export function inspectR80EvidenceBundleV667(values, sourceSha256) {
  const issues = [];
  const { build, audit, httpEnabled, httpDefaultOff,
    browser, visual, scenes, external, readiness } = values;
  if (build?.status !== "passed" || build.sourceStable !== true
    || build.inputAfterSha256 !== sourceSha256
    || build.inputBefore?.sha256 !== sourceSha256
    || !/^[a-f0-9]{64}$/.test(sourceSha256 ?? "")) {
    issues.push("current-production-build");
  }
  for (const [name, receipt] of Object.entries({
    audit, httpEnabled, httpDefaultOff, browser,
    visual, scenes, external,
  })) {
    const reported = name === "scenes"
      ? receipt?.sourceSha256 : receipt?.appSourceSha256;
    if (reported !== sourceSha256) issues.push(`source:${name}`);
  }
  if (browser?.buildId !== build?.buildId
    || browser.runtimeBuildId !== build?.runtimeBuildId
    || scenes?.buildId !== build?.buildId
    || httpEnabled?.buildId !== build?.buildId
    || httpDefaultOff?.buildId !== build?.buildId) {
    issues.push("build-identity-drift");
  }
  for (const [mode, receipt] of [
    ["enabled", httpEnabled], ["default-off", httpDefaultOff],
  ]) {
    const checkHttp = verifyR80HttpV667(audit,
      receipt?.observation, receipt?.origin, mode);
    if (!checkHttp.ok || receipt?.verification?.ok !== true
      || receipt?.mode !== mode) {
      issues.push(`http:${mode}:${checkHttp.issues.join(",")}`);
    }
  }
  const checkBrowser = inspectR80BrowserV667(browser, audit);
  if (!checkBrowser.ok || checkBrowser.imageCycles !== 62) {
    issues.push(`browser:${checkBrowser.issues.join(",")}`);
  }
  if (visual?.status !==
      "65-browser-screenshots-rehashed-human-signoff-pending"
    || visual.verification?.ok !== true
    || visual.verification.screenshotCount !== 65
    || visual.perItemHumanVisualSignoff !== false
    || scenes?.status !== "verified-local-browser-scenes-candidate"
    || scenes.counts?.desktopSelectedReady !== 36
    || scenes.counts?.mobileViewportSelectedReady !== 36
    || scenes.counts?.screenshotsHashed !== 72
    || scenes.counts?.humanRightsSigned !== 0) {
    issues.push("visual-or-scene-coverage");
  }
  const checkExternal = inspectR79ExternalBoundaryV666(
    readiness, audit, external?.observedPins, sourceSha256);
  if (!checkExternal.ok || external?.verification?.ok !== true
    || external.newHttpsRequests !== 0) {
    issues.push(`external:${checkExternal.issues.join(",")}`);
  }
  if (browser?.boundary?.candidateOnly !== true
    || browser.boundary.hold !== true
    || browser.boundary.notAdmitted !== true
    || browser.boundary.scientificPayloadWriteback !== false
    || browser.boundary.publicWebReleaseApproved !== false
    || browser?.claims?.humanVisualSignoff !== false
    || browser.claims.copyrightApproval !== false
    || browser.claims.scientificValidity !== false
    || browser.claims.productionPerformance !== false) {
    issues.push("boundary-or-approval-promotion");
  }
  return { ok: issues.length === 0, issues,
    currentSourceSha256: sourceSha256,
    buildId: build?.buildId ?? null,
    localImageCycles: checkBrowser.imageCycles,
    canonicalSceneSelections: 72,
    screenshotPinsExpected: 137,
    priorExternalSourcePins: 20,
    stellarComponentHolds: 4,
    imageAcquisitionHolds: 5,
    rightsSignatures: 0,
    publicWebReleaseApproved: false };
}

export async function runR80EvidenceReplayV667() {
  const sourceBefore = await captureBuildInputs();
  const inputs = Object.fromEntries(await Promise.all(
    Object.entries(PATHS).map(async ([name, relative]) =>
      [name, await pinnedJson(relative)])));
  const values = Object.fromEntries(Object.entries(inputs).map(
    ([name, entry]) => [name, entry.value]));
  const inspection = inspectR80EvidenceBundleV667(values,
    sourceBefore.sha256);
  check(inspection.ok, "bundle", inspection.issues);
  const auditReplay = await replayR79VisualAuditV666(
    values.audit, "20261013v666r79visual04");
  check(auditReplay.ok, "local-image-file-replay",
    auditReplay.issues);
  const screenshotReplay = await verifyR80ScreenshotsV667(
    values.browser);
  check(screenshotReplay.ok
    && screenshotReplay.screenshotCount === 65,
  "browser-screenshot-replay", screenshotReplay.issues);
  process.env.MAINLINE_A_R80_PROFILE = "1";
  process.env.MAINLINE_A_R80_ORIGIN =
    "http://127.0.0.1:3136/";
  process.env.MAINLINE_A_R80_BUILD_RUN_ID =
    "20261013v667r80web01";
  const { auditWebCanonicalSceneV648,
    replayWebCanonicalSceneV648 } = await import(
    "./verify-mainline-a-web-canonical-scene-v648.mjs");
  const freshScenes = await auditWebCanonicalSceneV648(
    "20261013-v667scene01");
  check(freshScenes.status === "verified-local-browser-scenes-candidate",
    "scene-screenshot-replay", freshScenes.issues);
  replayWebCanonicalSceneV648(values.scenes, freshScenes);
  const observedExternal = [];
  for (const pin of values.readiness.sourcePins) {
    const bytes = await readFile(safeWorkspacePathV662(pin.path));
    observedExternal.push({ path: pin.path,
      bytes: bytes.length, sha256: sha256(bytes) });
  }
  const externalReplay = inspectR79ExternalBoundaryV666(
    values.readiness, values.audit,
    observedExternal, sourceBefore.sha256);
  check(externalReplay.ok, "source-pin-replay",
    externalReplay.issues);
  check((await captureBuildInputs()).sha256 === sourceBefore.sha256,
    "source-drift-during-replay");
  const output = "docs/release/v607/mainline-a-r80-v667-evidence-replay-"
    + "20261013.json";
  const receipt = { schema: "mainline-a-r80-evidence-replay-v667",
    status: "replayed-current-source-local-web-candidate-hold",
    generatedAt: new Date().toISOString(),
    appSourceSha256: sourceBefore.sha256,
    buildId: values.build.buildId,
    inputs: Object.fromEntries(Object.entries(inputs).map(
      ([name, entry]) => [name, {
        path: entry.relative, bytes: entry.bytes,
        sha256: entry.sha256 }])),
    inspection, auditReplay, screenshotReplay,
    canonicalSceneReplay: { status: freshScenes.status,
      screenshotPinsRecomputed: 72,
      desktopSelectedReady: 36,
      mobileViewportSelectedReady: 36 },
    externalReplay,
    boundary: { candidateOnly: true, hold: true,
      notAdmitted: true, scientificPayloadWriteback: false,
      publicWebReleaseApproved: false },
    claims: { humanVisualSignoff: false,
      scientificValidity: false,
      copyrightApproval: false,
      realUserValidation: false,
      productionPerformance: false } };
  await writeFile(safeWorkspacePathV662(output),
    JSON.stringify(receipt, null, 2) + "\n", { flag: "wx" });
  return { status: receipt.status, output,
    inspection, screenshotReplay };
}

if (process.argv[1] && path.resolve(process.argv[1])
  === fileURLToPath(import.meta.url)) {
  console.log(JSON.stringify(await runR80EvidenceReplayV667()));
}
