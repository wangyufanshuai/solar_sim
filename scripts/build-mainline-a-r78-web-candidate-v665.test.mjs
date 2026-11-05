import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { inspectR78WebCandidateV665,
  parseR78CandidateOptionsV665,
  requiredGates,
  verifyR78PackageInputsV665 } from
  "./build-mainline-a-r78-web-candidate-v665.mjs";

const base = "docs/release/v607/";
async function receipt(name) {
  return JSON.parse(await readFile(base + name, "utf8"));
}
const [priorBuild, priorFreeze, priorStatic,
  priorAudit, priorHttpEnabled, priorHttpDefaultOff,
  priorBrowser, priorVisual, priorExternal] = await Promise.all([
  receipt("mainline-a-r77-build-20261013v664r77web01.json"),
  receipt("mainline-a-r77-v664-freeze-20261013v664r77freeze01.json"),
  receipt("mainline-a-r77-v664-static-20261013.json"),
  receipt("mainline-a-r77-v664-evidence-audit-20261013v664r77web01.json"),
  receipt("mainline-a-r77-v664-http-enabled-20261013v664r77web01.json"),
  receipt("mainline-a-r77-v664-http-default-off-20261013v664r77web01.json"),
  receipt("mainline-a-r77-v664-matrix-browser-20261013v664r77web01.json"),
  receipt("mainline-a-r77-v664-visual-20261013v664r77web01.json"),
  receipt("mainline-a-r77-v664-external-source-20261013v664r77web01.json"),
]);
function inputFixture() {
  const source = priorBuild.inputAfterSha256;
  const buildId = priorBuild.buildId;
  const fingerprint = "e".repeat(64);
  const values = { build: priorBuild,
    compileBuild: { ...priorBuild },
    freeze: priorFreeze,
    static: priorStatic,
    r77Audit: priorAudit,
    httpEnabled: priorHttpEnabled,
    httpDefaultOff: priorHttpDefaultOff,
    browser: priorBrowser,
    visual: priorVisual,
    external: priorExternal,
    r78External: { status:
        "prior-real-raw-pins-verified-no-new-acquisition",
      appSourceSha256: source,
      verification: { ok: true, verifiedFilePins: 57,
        stellarComponentHolds: 4,
        betaNebulaImageHolds: 5 },
      newHttpsRequests: 0,
      copyrightApproval: false,
      boundary: { scientificPayloadWriteback: false } },
    r78Http: { status:
        "passed-same-build-local-two-preview-modes",
      appSourceSha256: source, buildId,
      enabled: { ok: true }, defaultOff: { ok: true } },
    r78Browser: { status:
        "passed-local-desktop-and-simulated-mobile",
      appSourceSha256: source, buildId,
      desktop: { matrixSelections: 96, errors: 0 },
      mobileViewport: { matrixSelections: 96, errors: 0 },
      physicalMobile: "not-run",
      boundary: { scientificPayloadWriteback: false } },
    r78Visual: { status:
        "77-current-build-screenshots-rehashed",
      appSourceSha256: source, buildId,
      screenshots: Array.from({ length: 77 }),
      humanPerItemSignoff: false,
      boundary: { scientificPayloadWriteback: false } },
    longRun: { status:
        "verified-current-source-local-longrun",
      sourceSha256: source, buildId,
      freezeFingerprint: priorFreeze.fingerprint,
      fingerprint,
      counts: { totalIndependentLongRuns: 2 },
      windows: [{ device: "desktop" }, { device: "mobile" }],
      claims: { publicWebReleaseApproved: false } },
    longRunReplay: { ok: true, fingerprint },
    performance: { status:
        "two-current-source-local-longruns-verified",
      sourceSha256: source, buildId,
      observations: [{ device: "desktop" }, { device: "mobile" }] },
  };
  return Object.fromEntries(Object.entries(values).map(
    ([name, value]) => [name, { value }]));
}

function fingerprint(value) {
  const payload = { ...value };
  delete payload.fingerprint;
  delete payload.generatedAt;
  value.fingerprint = createHash("sha256")
    .update(JSON.stringify(payload)).digest("hex");
  return value;
}
function fixture() {
  const source = "a".repeat(64);
  const matrix = Object.fromEntries([
    ["a-star", 12], ["a-constellation", 12],
    ["a-nebula", 12], ["beta-star", 24],
    ["beta-constellation", 12],
    ["beta-nebula", 24],
  ].map(([name, total]) => [name,
    { total, rightsSigned: 0, rightsStates: ["pending"], states: {},
      admission: ["candidate-only"] }]));
  return fingerprint({
    schema: "mainline-a-r78-web-candidate-v665",
    status: "candidate-only-public-release-blocked",
    runId: "20261013-v665long01",
    sourceSha256: source,
    buildId: "local-fixture-build",
    runtimeBuildId: "mainline-a-" + source.slice(0, 16),
    freezeFingerprint: "b".repeat(64),
    longRunFingerprint: "c".repeat(64),
    repository: { root: "E:/fixture/next-web",
      branch: "codex/solar-sim-mainline-a",
      head: "f".repeat(40), parentGitTouched: false },
    matrix, gates: requiredGates(),
    v616Pins: [{ sha256:
        "706be4e043fce25df4cd0e01522dd6ef5863c5cdf902c3e08ab6563e6c7a863b" },
      { sha256:
        "8fbb31166d5b96890236da6842ce9f53a4ace3133ffbaabccd9811e8005e0dce" }],
    evidencePins: Array.from({ length: 17 }, (_, index) => ({
      path: `docs/release/v607/fixture-${index}.json`,
      bytes: index + 1, sha256: index.toString(16).padStart(64, "0"),
    })),
    rollback: { type: "local-preserved-build-only",
      slot: ".next-mainline-a-r77-fixture-slot/.next",
      buildReceipt: "docs/release/v607/fixture-0.json",
      sourceSha256: source,
      publicDeploymentRollback: "not-applicable-no-deployment" },
    buildRecheck: {
      receipt: "docs/release/v607/mainline-a-r78-build-20261013v665r78web01.json",
      buildId: "local-fixture-recheck",
      sourceSha256: source,
      role: "same-source-independent-compile-proof",
      browserPerformanceClaim: false },
    release: { publicWebReleaseAllowed: false,
      scientificPayloadWriteback: false,
      candidateImagePreviewDefaultOff: true,
      physicalMobile: "not-run",
      rootAppParity: "deferred-web-only-scope" },
    boundary: { candidateOnly: true, hold: true,
      notAdmitted: true, scientificPayloadWriteback: false,
      publicWebReleaseApproved: false },
    claims: { copyrightApproval: false,
      scientificValidity: false,
      productionPerformance: false,
      realUserValidation: false,
      publicWebReleaseApproved: false },
  });
}

test("accepts a bounded candidate envelope as a test fixture only", () => {
  const result = inspectR78WebCandidateV665(fixture());
  assert.equal(result.ok, true, result.issues.join(","));
});

test("rejects a signed-rights promotion even after resigning", () => {
  const bad = fixture();
  bad.matrix["a-nebula"].rightsSigned = 1;
  fingerprint(bad);
  assert.ok(inspectR78WebCandidateV665(bad).issues
    .includes("candidate-matrix-count-or-rights:a-nebula"));
});

test("rejects fake public release and missing review gates", () => {
  const bad = fixture();
  bad.release.publicWebReleaseAllowed = true;
  bad.gates.splice(6, 1);
  fingerprint(bad);
  const issues = inspectR78WebCandidateV665(bad).issues;
  assert.ok(issues.includes("candidate-envelope-or-boundary-invalid"));
  assert.ok(issues.includes("release-gate-promoted-or-missing"));
});

test("rejects duplicated evidence pins and a foreign rollback slot", () => {
  const bad = fixture();
  bad.evidencePins[1].path = bad.evidencePins[0].path;
  bad.rollback.slot = "../foreign/.next";
  fingerprint(bad);
  const issues = inspectR78WebCandidateV665(bad).issues;
  assert.ok(issues.includes("candidate-evidence-pins-invalid"));
  assert.ok(issues.includes("candidate-rollback-or-web-scope-invalid"));
});

test("rejects source drift and byte edits without resigning", () => {
  const bad = fixture();
  bad.sourceSha256 = "1".repeat(64);
  const issues = inspectR78WebCandidateV665(bad).issues;
  assert.ok(issues.includes("candidate-source-or-repository-invalid"));
  assert.ok(issues.includes("candidate-fingerprint-drift"));
});

test("rejects a changed V616 scientific pin even after resigning", () => {
  const bad = fixture();
  bad.v616Pins[0].sha256 = "1".repeat(64);
  fingerprint(bad);
  assert.ok(inspectR78WebCandidateV665(bad).issues
    .includes("v616-scientific-source-pin-drift"));
});

test("CLI has no publish mode and rejects path traversal", () => {
  assert.equal(parseR78CandidateOptionsV665([
    "--mode", "build", "--run-id",
    "20261013-v665long01"]).mode, "build");
  assert.throws(() => parseR78CandidateOptionsV665([
    "--mode", "publish", "--run-id",
    "20261013-v665long01"]));
  assert.throws(() => parseR78CandidateOptionsV665([
    "--mode", "replay", "--run-id", "../outside"]));
});

test("cross-checks real R77 pins with clearly simulated R78 envelopes", () => {
  const items = inputFixture();
  const result = verifyR78PackageInputsV665(items,
    priorBuild.inputAfterSha256);
  assert.equal(result.ok, true, result.issues.join(","));
  assert.equal(result.matrix["beta-star"].states["identity-hold"], 4);
  assert.equal(result.matrix["beta-nebula"].states["source-hold"], 5);
});

test("rejects forged rights in frozen source even with a good R78 envelope", () => {
  const items = inputFixture();
  items.freeze.value = structuredClone(priorFreeze);
  items.freeze.value.matrixRows[0].rights = "signed";
  const result = verifyR78PackageInputsV665(items,
    priorBuild.inputAfterSha256);
  assert.equal(result.ok, false);
  assert.ok(result.issues.includes(
    "matrix-count-or-rights-promotion"));
});

test("rejects separate compile source drift and missing long-run proof", () => {
  const items = inputFixture();
  items.compileBuild.value = { ...priorBuild,
    inputAfterSha256: "0".repeat(64) };
  items.longRun.value = { ...items.longRun.value,
    counts: { totalIndependentLongRuns: 1 } };
  const issues = verifyR78PackageInputsV665(items,
    priorBuild.inputAfterSha256).issues;
  assert.ok(issues.includes("source-build-or-freeze-drift"));
  assert.ok(issues.includes("longrun-or-replay-unqualified"));
});
