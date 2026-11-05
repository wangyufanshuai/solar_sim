import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { buildWebCandidatePackageV647, validateWebCandidateInputsV647, verifyPreservedBuildArtifactsV647,
  verifySavedWebCandidateV647 } from "./build-mainline-a-web-candidate-v647.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = "8136bf33ce9a75d1f708b9a67c3f87cbfd8148c9819ce40d004fb668bf57d00d";
async function json(relative) { return JSON.parse(await readFile(path.join(ROOT, relative), "utf8")); }
async function values() {
  const entries = {
    build: "mainline-a-r66-build-20261007-v647web02.json",
    webAudit: "mainline-a-r66-web-delivery-audit-20261007-v647web02.json",
    assetHttp: "mainline-a-r66-web-asset-http-20261007-v647web02-credits-pinned.json",
    pageHttp: "mainline-a-r66-http-20261007-v647web02.json",
    browser: "mainline-a-r66-web-browser-20261007-v647web02.json",
    visual: "mainline-a-r66-web-visual-20261007-v647web02.json",
    shortPerformance: "mainline-a-r66-web-performance-20261007-v647web02.json",
    round: "mainline-a-r66-web-v647-round-20261007.json",
    codeChange: "mainline-a-r66-web-v647-code-change-20261007.json",
    assetSupplement: "mainline-a-r66-web-asset-http-supplement-20261007-v647web02.json",
    source: "mainline-a-r66-v646-evidence-supplement-20261007.json",
    longRun: "mainline-a-r66-web-r65-browser-desktop-raw-20261007-v647web02.json",
  };
  return Object.fromEntries(await Promise.all(Object.entries(entries).map(async ([role, file]) =>
    [role, await json(`docs/release/v607/${file}`)])));
}

test("one real desktop long run remains blocked until an independent mobile viewport run exists", async () => {
  const evidence = await values();
  assert.equal(evidence.longRun.observations.length, 1);
  assert.equal(evidence.longRun.observations[0].device, "desktop");
  assert.throws(() => validateWebCandidateInputsV647(evidence, SOURCE), /longrun-not-qualified/);
});

test("current-source build, rights boundary and image HTTP pins reject falsification", async () => {
  const evidence = await values();
  assert.throws(() => validateWebCandidateInputsV647(evidence, "f".repeat(64)), /preserved-build-stale-or-invalid/);
  assert.throws(() => validateWebCandidateInputsV647({
    ...evidence, webAudit: { ...evidence.webAudit,
      rightsCounts: { ...evidence.webAudit.rightsCounts, rightsApproved: 12 } },
  }, SOURCE), /web-audit-invalid/);
  assert.throws(() => validateWebCandidateInputsV647({
    ...evidence, assetHttp: { ...evidence.assetHttp, credits: { status: "missing" } },
  }, SOURCE), /asset-http-invalid/);
  assert.throws(() => validateWebCandidateInputsV647({
    ...evidence, assetHttp: { ...evidence.assetHttp, assets: evidence.assetHttp.assets.map((row, index) =>
      index === 0 ? { ...row, observedSha256: "f".repeat(64) } : row) },
  }, SOURCE), /asset-http-row-invalid/);
  assert.throws(() => validateWebCandidateInputsV647({
    ...evidence, pageHttp: { ...evidence.pageHttp, allScriptAssetsOk: false },
  }, SOURCE), /page-http-invalid/);
  assert.throws(() => validateWebCandidateInputsV647({
    ...evidence, browser: { ...evidence.browser, physicalMobile: "passed" },
  }, SOURCE), /browser-invalid/);
});

test("a copied desktop observation cannot be promoted to independent mobile evidence", async () => {
  const evidence = await values();
  const forged = structuredClone(evidence.longRun);
  forged.observations.push({ ...forged.observations[0], device: "mobile",
    viewport: { width: 390, height: 844 }, endedViewport: { width: 390, height: 844 } });
  assert.throws(() => validateWebCandidateInputsV647({ ...evidence, longRun: forged }, SOURCE), /longrun-not-qualified/);
});

test("candidate package rehashes the preserved BUILD_ID and every served script", async () => {
  const evidence = await values();
  const pins = await verifyPreservedBuildArtifactsV647(evidence.build, evidence.pageHttp);
  assert.equal(pins.length, evidence.pageHttp.scriptAssets.length + 1);
  assert.equal(pins[0].role, "build-id");
  assert.ok(pins.every((row) => /^[a-f0-9]{64}$/.test(row.sha256)));
  await assert.rejects(() => verifyPreservedBuildArtifactsV647(evidence.build, {
    ...evidence.pageHttp, scriptAssets: evidence.pageHttp.scriptAssets.map((row, index) =>
      index === 0 ? { ...row, expectedSha256: "f".repeat(64) } : row),
  }), /preserved-script-mismatch/);
  await assert.rejects(() => verifyPreservedBuildArtifactsV647({
    ...evidence.build, distDir: "../parent/.next",
  }, evidence.pageHttp), /preserved-build-directory-invalid/);
});

test("saved candidate replay rejects changed evidence pins and release promotion", () => {
  const candidate = {
    schema: "mainline-a-web-candidate-package-v647", status: "candidate-blocked",
    deliveryTarget: "next-web-only", sourceSha256: SOURCE,
    buildId: "B3cFqMTv1S0yIvqbkXPXQ", runtimeBuildId: `mainline-a-${SOURCE.slice(0, 16)}`,
    branch: "codex/solar-sim-mainline-a", head: "156ec7790a99be2f89f5d8f44831cb118c9437e1",
    preservedBuildDirectory: ".next-mainline-a-r66-20261007-v647web02",
    buildArtifactPins: [{ role: "build-id", path: ".next-mainline-a-r66-20261007-v647web02/.next/BUILD_ID",
      bytes: 21, sha256: "a".repeat(64) }],
    performanceObservations: [{ device: "desktop", durationMs: 1802003, frameP95Ms: 7.12,
      memoryDeltaBytes: 37_231_622, visibilityInterruptions: 0 }],
    evidence: [{ role: "build", path: "docs/release/v607/build.json", bytes: 1, sha256: "a".repeat(64) }],
    checks: { localTechnicalReview: "verified" },
    rollback: { destructiveGitAction: false },
    gates: { publicWebRelease: "blocked", nebulaRightsSignoff: "pending-0-of-12",
      stellarPhysicalComponentIdentity: "pending-0-of-4",
      constellationVisualSignoff: "pending-0-of-12",
      legacyA3RightsTerminology: "pending-migration",
      rootAppParity: "out-of-scope-for-web-only-local-review" },
    boundary: { candidateOnly: true, hold: true, notAdmitted: true,
      scientificPayloadWriteback: false, runtimePromotion: "closed" },
    claims: { releaseApproved: false, copyrightApproval: false,
      scientificValidity: false, productionPerformance: false, realUserValidation: false },
  };
  assert.equal(verifySavedWebCandidateV647(candidate, candidate).status, "verified-candidate-blocked");
  assert.throws(() => verifySavedWebCandidateV647({ ...candidate,
    evidence: [{ ...candidate.evidence[0], sha256: "b".repeat(64) }] }, candidate), /saved-package-replay-mismatch/);
  assert.throws(() => verifySavedWebCandidateV647({ ...candidate,
    gates: { ...candidate.gates, publicWebRelease: "approved" } }, candidate), /saved-package-replay-mismatch/);
  assert.throws(() => verifySavedWebCandidateV647({ ...candidate,
    claims: { ...candidate.claims, copyrightApproval: true } }, candidate), /saved-package-replay-mismatch/);
});

test("two real current-source long runs build only a blocked web candidate package", async () => {
  const longRunPath = "docs/release/v607/mainline-a-r66-web-r65-browser-final-raw-20261007-v647web02.json";
  const candidate = await buildWebCandidatePackageV647(longRunPath);
  const saved = await json("docs/release/v607/mainline-a-r66-web-candidate-20261007-v647web02.json");
  assert.equal(candidate.status, "candidate-blocked");
  assert.equal(candidate.sourceSha256, SOURCE);
  assert.equal(candidate.evidence.length, 12);
  assert.equal(candidate.buildArtifactPins.length, 7);
  assert.deepEqual(candidate.performanceObservations.map((row) => row.device), ["desktop", "mobile"]);
  assert.ok(candidate.performanceObservations.every((row) => row.durationMs >= 1_800_000
    && row.baselineResources === row.finalResources && row.activeResources > row.baselineResources));
  assert.equal(candidate.gates.nebulaRightsSignoff, "pending-0-of-12");
  assert.equal(candidate.gates.publicWebRelease, "blocked");
  assert.equal(candidate.claims.productionPerformance, false);
  assert.equal(verifySavedWebCandidateV647(saved, candidate).status, "verified-candidate-blocked");
});
