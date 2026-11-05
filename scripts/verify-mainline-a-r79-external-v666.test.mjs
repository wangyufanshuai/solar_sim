import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  inspectR79ExternalBoundaryV666,
  parseR79ExternalOptionsV666,
} from "./verify-mainline-a-r79-external-v666.mjs";

const sourceSha256 =
  "5acf2252241c7e133b208d9e53b89bafbe2ad21794051a210bf4c544e751e63d";
const readinessPath =
  "app/data/mainlineAWebReadinessV663.generated.json";
const auditPath =
  "docs/release/v607/mainline-a-r79-v666-visual-static-"
    + "20261013v666r79visual03.json";

async function currentEvidence() {
  const [readiness, audit] = await Promise.all([
    readFile(readinessPath, "utf8").then(JSON.parse),
    readFile(auditPath, "utf8").then(JSON.parse),
  ]);
  return {
    readiness,
    audit,
    observedPins: readiness.sourcePins.map(({ path, bytes, sha256 }) => ({
      path,
      bytes,
      sha256,
    })),
  };
}

function inspect(evidence) {
  return inspectR79ExternalBoundaryV666(
    evidence.readiness,
    evidence.audit,
    evidence.observedPins,
    sourceSha256,
  );
}

test("R79 external boundary accepts pinned current candidate evidence", async () => {
  const result = inspect(await currentEvidence());
  assert.equal(result.ok, true);
  assert.deepEqual(result.issues, []);
  assert.equal(result.priorSourcePinsRecomputed, 20);
  assert.equal(result.stellarPhysicalComponentsConfirmed, 0);
  assert.equal(result.nebulaImageAcquisitionHolds, 5);
  assert.equal(result.newHttpsRequests, 0);
  assert.equal(result.publicWebReleaseApproved, false);
});

test("R79 external boundary rejects invented source pin bytes", async () => {
  const evidence = await currentEvidence();
  evidence.observedPins[0].sha256 = "0".repeat(64);
  const result = inspect(evidence);
  assert.equal(result.ok, false);
  assert.ok(result.issues.some((issue) =>
    issue.startsWith("prior-source-pin-drift:")));
});

test("R79 external boundary rejects a forged stellar admission", async () => {
  const evidence = await currentEvidence();
  evidence.readiness.stars[0].physicalComponentConfirmed = true;
  const result = inspect(evidence);
  assert.equal(result.ok, false);
  assert.ok(result.issues.includes("stellar-or-nebula-hold-promoted"));
});

test("R79 external boundary rejects a synthetic image response promotion", async () => {
  const evidence = await currentEvidence();
  evidence.readiness.nebulae[0].imageResponseCaptured = 1;
  const result = inspect(evidence);
  assert.equal(result.ok, false);
  assert.ok(result.issues.includes("stellar-or-nebula-hold-promoted"));
});

test("R79 external boundary rejects asserted rights and release clearance", async () => {
  const evidence = await currentEvidence();
  evidence.readiness.gates.betaNebulaRightsSigned = 24;
  evidence.readiness.gates.publicWebReleaseAllowed = true;
  const result = inspect(evidence);
  assert.equal(result.ok, false);
  assert.ok(result.issues.includes("rights-science-or-release-promotion"));
});

test("R79 external boundary rejects current-source drift", async () => {
  const evidence = await currentEvidence();
  evidence.audit.appSourceSha256 = "0".repeat(64);
  const result = inspect(evidence);
  assert.equal(result.ok, false);
  assert.ok(result.issues.includes("current-source-or-audit"));
});

test("R79 external options accept only explicit current run identifiers", () => {
  assert.deepEqual(parseR79ExternalOptionsV666([
    "--run-id", "20261013v666r79external01",
    "--audit-run-id", "20261013v666r79visual03",
  ]), {
    runId: "20261013v666r79external01",
    auditRunId: "20261013v666r79visual03",
  });
  assert.throws(() => parseR79ExternalOptionsV666([
    "--run-id", "unsafe-output",
    "--audit-run-id", "20261013v666r79visual03",
  ]), /r79-external:usage/);
});
