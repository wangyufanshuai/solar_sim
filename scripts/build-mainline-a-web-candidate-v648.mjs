import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { captureBuildInputs } from "./build-mainline-a-preserved.mjs";
import { safeFile, sha256 } from "./mainline-a-release-evidence.mjs";
import { verifyPreservedBuildArtifactsV647 } from "./build-mainline-a-web-candidate-v647.mjs";
import { auditWebNebulaBrowserV648 } from "./verify-mainline-a-web-nebula-browser-v648.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCHEMA = "mainline-a-web-candidate-package-v648";
const SOURCES = Object.freeze({
  build: "docs/release/v607/mainline-a-r66-build-20261007-v648web01.json",
  rights: "docs/release/v607/mainline-a-r66-web-nebula-rights-20261007-v648web01.json",
  pageHttp: "docs/release/v607/mainline-a-r66-http-20261007-v648web01.json",
  assetHttp: "docs/release/v607/mainline-a-r66-web-nebula-http-20261007-v648web01.json",
  browser: "docs/release/v607/mainline-a-r66-web-nebula-browser-20261007-v648web02.json",
  visual: "docs/release/v607/mainline-a-r66-web-visual-20261007-v648web02.json",
  performance: "docs/release/v607/mainline-a-r66-web-performance-20261007-v648perf01.json",
  round: "docs/release/v607/mainline-a-r66-web-v648-round-20261007.json",
  codeChange: "docs/release/v607/mainline-a-r66-web-v648-code-change-20261007.json",
  externalSource: "docs/release/v607/mainline-a-r66-v646-evidence-supplement-20261007.json",
});
function fail(code) { throw new Error(`web-candidate-v648:${code}`); }
function same(left, right) { return JSON.stringify(left) === JSON.stringify(right); }

export function validateWebCandidateV648(values, sourceSha) {
  const { build, rights, pageHttp, assetHttp, browser, visual,
    performance, round, codeChange, externalSource } = values;
  if (build?.status !== "passed" || build.exitCode !== 0 || build.sourceStable !== true
    || build.inputBefore?.sha256 !== sourceSha || build.inputAfterSha256 !== sourceSha
    || build.runtimeBuildId !== `mainline-a-${sourceSha.slice(0, 16)}`
    || build.distDir !== ".next-mainline-a-r66-20261007-v648web01/.next") fail("build-identity-invalid");
  if (rights?.status !== "passed-local-candidate-rights-pending"
    || rights.sourceSha256 !== sourceSha || rights.counts?.previewAvailable !== 12
    || rights.counts?.currentRuntimeLicensed !== 0
    || rights.counts?.humanRightsSigned !== 0 || rights.counts?.releaseAdmitted !== 0
    || rights.claims?.copyrightApproval !== false) fail("rights-promotion-or-drift");
  if (pageHttp?.status !== "passed" || pageHttp.buildId !== build.buildId
    || pageHttp.runtimeBuildId !== build.runtimeBuildId
    || pageHttp.pageStatus !== 200 || pageHttp.healthStatus !== 200
    || pageHttp.allScriptAssetsOk !== true || pageHttp.scientificPayloadWriteback !== false) {
    fail("page-http-invalid");
  }
  if (assetHttp?.status !== "passed-local-http-candidate-release-blocked"
    || assetHttp.buildId !== build.buildId || assetHttp.sourceSha256 !== sourceSha
    || assetHttp.counts?.matched !== 12 || assetHttp.counts?.failed !== 0
    || assetHttp.counts?.humanRightsSigned !== 0 || assetHttp.counts?.releaseAdmitted !== 0
    || assetHttp.claims?.releaseApproved !== false) fail("asset-http-invalid");
  if (browser?.status !== "verified-local-browser-candidate-release-blocked"
    || browser.sourceSha256 !== sourceSha || browser.buildId !== build.buildId
    || browser.issues?.length !== 0 || browser.signedRights !== 0
    || browser.publicWebRelease !== "blocked"
    || browser.claims?.publicWebReleaseApproved !== false) fail("browser-invalid");
  if (visual?.schema !== "mainline-a-web-nebula-visual-review-v648"
    || visual.sourceSha256 !== sourceSha || visual.buildId !== build.buildId
    || visual.screenshots?.length !== 3 || visual.rightsDisclosure?.humanSignedCount !== 0
    || visual.claims?.copyrightApproval !== false) fail("visual-invalid");
  if (performance?.schema !== "mainline-a-web-performance-v647"
    || performance.status !== "measured-local"
    || performance.sourceSha256 !== sourceSha
    || performance.build?.buildId !== build.buildId
    || performance.longRunStatus !== "historical-needs-rerun-for-current-source"
    || performance.claims?.productionPerformance !== false
    || performance.physicalMobile !== "not-run") fail("performance-scope-invalid");
  if (round?.schema !== "mainline-a-r66-web-round-completion-v648"
    || round.sourceSha256 !== sourceSha || round.buildId !== build.buildId
    || round.status?.publicWebRelease !== "blocked"
    || round.status?.currentSourceLongRun !== "not-run-v647-history-only"
    || round.status?.nebulaHumanRightsSigned !== "0/12"
    || round.boundary?.scientificPayloadWriteback !== false
    || round.claims?.publicWebReleaseApproved !== false) fail("round-invalid");
  if (codeChange?.schema !== "mainline-a-r66-web-code-change-v648"
    || codeChange.currentBuild?.sourceSha256 !== sourceSha
    || codeChange.effectiveCode?.totalEffectiveChangedLines < 500
    || codeChange.effectiveCode?.cumulativeR66LowerBound < 1000) fail("code-change-invalid");
  if (externalSource?.schema !== "mainline-a-r66-evidence-supplement-v646"
    || externalSource.status !== "blocked"
    || externalSource.sourceSha256 === sourceSha
    || externalSource.gates?.nebulaRightsSignoff !== "pending-0-of-12"
    || externalSource.gates?.stellarComponentIdentity !== "pending-0-of-4"
    || externalSource.claims?.releaseApproved !== false) fail("external-source-promotion");
  return Object.freeze({ buildId: build.buildId, runtimeBuildId: build.runtimeBuildId,
    sourceSha256: sourceSha, rightsSigned: 0, localPreviewImages: 12,
    longRunQualified: false, publicWebRelease: "blocked" });
}

async function pinnedJson(relative, role) {
  const file = await safeFile(ROOT, relative);
  if (file.stat.size < 1 || file.stat.size > 2 * 1024 * 1024) fail(`input-size:${role}`);
  const bytes = await readFile(file.absolute);
  return { value: JSON.parse(bytes.toString("utf8")),
    pin: { role, path: relative, bytes: bytes.length, sha256: sha256(bytes) } };
}
export async function buildWebCandidatePackageV648() {
  const inputs = Object.fromEntries(await Promise.all(Object.entries(SOURCES).map(
    async ([role, relative]) => [role, await pinnedJson(relative, role)])));
  const values = Object.fromEntries(Object.entries(inputs).map(([role, item]) => [role, item.value]));
  const current = await captureBuildInputs();
  const checked = validateWebCandidateV648(values, current.sha256);
  const browserFresh = await auditWebNebulaBrowserV648();
  if (browserFresh.status !== values.browser.status
    || !same(browserFresh.inputs, values.browser.inputs)) fail("browser-replay-mismatch");
  const roundPins = Object.values(values.round.evidence).flat();
  for (const item of roundPins) {
    const file = await safeFile(ROOT, item.path);
    if (sha256(await readFile(file.absolute)) !== item.sha256) fail(`round-pin-drift:${item.path}`);
  }
  if (values.round.effectiveCode.sha256 !== inputs.codeChange.pin.sha256) fail("code-pin-drift");
  const buildArtifactPins = await verifyPreservedBuildArtifactsV647(values.build, values.pageHttp);
  return Object.freeze({ schema: SCHEMA, status: "candidate-blocked-current-source",
    deliveryTarget: "next-web-only", generatedAt: new Date().toISOString(),
    sourceSha256: checked.sourceSha256, buildId: checked.buildId,
    runtimeBuildId: checked.runtimeBuildId, branch: values.build.branch,
    head: values.build.head, preservedBuildDirectory: values.build.distDir,
    buildArtifactPins, evidence: Object.values(inputs).map((item) => item.pin),
    counts: { localPreviewImages: 12, humanRightsSigned: 0,
      stellarPhysicalComponentConfirmed: 0, currentSourceLongRuns: 0 },
    checks: { build: "passed", staticRights: "12-preview-0-signed",
      assetHttp: "12-of-12-jpeg-and-credits-matched",
      browser: "desktop-and-mobile-viewport-current-build-replayed",
      visual: "three-current-build-screenshots-pinned",
      performance: "two-short-frame-samples-only-long-run-not-run",
      externalSource: "historical-pending", physicalMobile: "not-run" },
    gates: { nebulaRightsSignoff: "pending-0-of-12",
      stellarPhysicalComponentIdentity: "pending-0-of-4",
      publicWebRelease: "blocked",
      rootAppParity: "out-of-scope-for-current-web-only-batch" },
    rollback: { previousPreservedBuild: ".next-mainline-a-r66-20261007-v647web02/.next",
      previousBuildSelectionRequiresIndependentVerification: true,
      destructiveGitAction: false, stopOwnedPreviewAllowed: true },
    boundary: { candidateOnly: true, hold: true, notAdmitted: true,
      scientificPayloadWriteback: false, runtimePromotion: "closed" },
    claims: { releaseApproved: false, copyrightApproval: false,
      scientificValidity: false, productionPerformance: false, realUserValidation: false },
    note: "Current-source candidate evidence packet. It does not authorize deployment or public release." });
}
export function replaySavedWebCandidateV648(saved, fresh) {
  if (saved?.schema !== SCHEMA || saved.status !== "candidate-blocked-current-source"
    || saved.sourceSha256 !== fresh.sourceSha256 || saved.buildId !== fresh.buildId
    || saved.runtimeBuildId !== fresh.runtimeBuildId
    || !same(saved.buildArtifactPins, fresh.buildArtifactPins)
    || !same(saved.evidence, fresh.evidence)
    || !same(saved.counts, fresh.counts)
    || !same(saved.gates, fresh.gates)
    || !same(saved.checks, fresh.checks)
    || !same(saved.rollback, fresh.rollback)
    || !same(saved.claims, fresh.claims)
    || !same(saved.boundary, fresh.boundary)
    || saved.counts?.humanRightsSigned !== 0
    || saved.counts?.currentSourceLongRuns !== 0
    || saved.gates?.publicWebRelease !== "blocked"
    || saved.claims?.releaseApproved !== false
    || saved.boundary?.scientificPayloadWriteback !== false) fail("saved-replay-mismatch");
  return Object.freeze({ status: "replayed-candidate-blocked-current-source",
    buildId: fresh.buildId, sourceSha256: fresh.sourceSha256,
    humanRightsSigned: 0, publicWebRelease: "blocked" });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const fresh = await buildWebCandidatePackageV648();
  const outputAt = process.argv.indexOf("--output");
  const replayAt = process.argv.indexOf("--replay");
  if (outputAt >= 0) {
    const relative = process.argv[outputAt + 1];
    if (!/^docs\/release\/v607\/[a-z0-9-]+\.json$/i.test(relative ?? "")) fail("output-path-invalid");
    await writeFile(path.join(ROOT, relative), `${JSON.stringify(fresh, null, 2)}\n`, { flag: "wx" });
  }
  if (replayAt >= 0) {
    const relative = process.argv[replayAt + 1];
    if (!/^docs\/release\/v607\/[a-z0-9-]+\.json$/i.test(relative ?? "")) fail("replay-path-invalid");
    const saved = JSON.parse(await readFile(path.join(ROOT, relative), "utf8"));
    console.log(JSON.stringify(replaySavedWebCandidateV648(saved, fresh), null, 2));
  } else console.log(JSON.stringify({ status: fresh.status, buildId: fresh.buildId,
    pinnedEvidence: fresh.evidence.length, pinnedBuildFiles: fresh.buildArtifactPins.length }, null, 2));
}
