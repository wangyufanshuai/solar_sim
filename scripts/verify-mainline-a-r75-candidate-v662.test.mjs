import test from "node:test";
import assert from "node:assert/strict";
import { parseCandidateOptionsV662, replayR75CandidateV662,
  verifyR75CandidateShapeV662 } from
  "./verify-mainline-a-r75-candidate-v662.mjs";

const fake = () => ({
  schema: "mainline-a-r75-web-candidate-v662",
  status: "verified-local-web-candidate-hold-public-release-blocked",
  appSourceSha256: "a".repeat(64),
  buildId: "testBuildId01234",
  coverage: { aLine: [12, 12, 12], betaStars: 24,
    betaConstellations: 12, betaNebulae: 24,
    reviewableNebulaImageChains: 19, imageHolds: 5,
    componentIdentitiesConfirmed: 0, rightsSigned: 0,
    runtimeAdmitted: 0 },
  boundary: { candidateOnly: true, hold: true, notAdmitted: true,
    scientificPayloadWriteback: false, publicWebReleaseApproved: false },
  claims: { copyrightApproval: false, scientificValidity: false,
    productionPerformance: false, realUserValidation: false,
    physicalMobile: false, publicWebReleaseApproved: false },
  rollbackReference: "docs/release/v607/rollback.json",
  evidenceClasses: { static: [], http: [], visual: [], browser: [],
    performance: [], externalSource: [] },
  pinnedFiles: [],
});

test("unbound and synthetic release claims cannot qualify", () => {
  const forged = fake();
  forged.claims.publicWebReleaseApproved = true;
  forged.coverage.rightsSigned = 24;
  const result = verifyR75CandidateShapeV662(forged);
  assert.equal(result.ok, false);
  assert.ok(result.issues.includes("candidate-boundary-or-claim-invalid"));
  assert.ok(result.issues.includes("candidate-coverage-or-promotion-invalid"));
  assert.ok(result.issues.includes("rollback-reference-unpinned"));
  assert.ok(result.issues.includes("tool-source-not-pinned"));
  assert.ok(result.issues.includes("evidence-class-missing:performance"));
});

test("traversal and duplicate artifact pins are refused", () => {
  const forged = fake();
  forged.pinnedFiles.push({ path: "../outside", bytes: 1,
    sha256: "a".repeat(64) });
  forged.pinnedFiles.push({ path: "../outside", bytes: 1,
    sha256: "a".repeat(64) });
  const result = verifyR75CandidateShapeV662(forged);
  assert.ok(result.issues.includes("unsafe-pin-path:../outside"));
  assert.ok(result.issues.includes("pin-invalid:../outside"));
});

test("offline replay of missing evidence remains rejected", async () => {
  const result = await replayR75CandidateV662(fake());
  assert.equal(result.status, "rejected-candidate");
  assert.ok(result.issues.includes("source-no-longer-current"));
  assert.ok(result.issues.includes("evidence-link-unreadable"));
  assert.equal(result.claims.publicWebReleaseApproved, false);
});

test("candidate CLI cannot silently reuse a prior round", () => {
  assert.equal(parseCandidateOptionsV662(["--run-id",
    "20261013v662r75web02"]), "20261013v662r75web02");
  assert.throws(() => parseCandidateOptionsV662(["--run-id",
    "20261013v660r73web02"]));
});
