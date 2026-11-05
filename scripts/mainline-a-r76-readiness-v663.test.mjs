import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { buildR76ReadinessV663, R76_OUTPUT_V663,
  parseR76OptionsV663, pinR76V663, safePathR76V663 } from
  "./build-mainline-a-r76-readiness-v663.mjs";
import { inspectR76ReadinessShapeV663,
  parseReplayOptionsV663, replayR76ReadinessV663 } from
  "./verify-mainline-a-r76-readiness-v663.mjs";

const clone = (value) => structuredClone(value);
let saved;
async function baseline() {
  saved ??= JSON.parse(await readFile(safePathR76V663(
    R76_OUTPUT_V663), "utf8"));
  return saved;
}

test("real prior pages and component CSVs replay as held source evidence", async () => {
  const snapshot = await baseline();
  assert.deepEqual(inspectR76ReadinessShapeV663(snapshot).issues, []);
  const result = await replayR76ReadinessV663(snapshot);
  assert.equal(result.status, "verified-candidate-hold");
  assert.equal(result.sourcePinsChecked, 20);
  assert.equal(result.stars, 4);
  assert.equal(result.nebulae, 5);
  assert.deepEqual(result.issues, []);
  const rebuilt = await buildR76ReadinessV663();
  assert.equal(rebuilt.fingerprint, snapshot.fingerprint);
  assert.equal(rebuilt.gates.publicWebReleaseAllowed, false);
});

test("raw pin replay recomputes existing bytes without network", async () => {
  const snapshot = await baseline();
  const page = snapshot.nebulae[0].officialPageRaw;
  const csv = snapshot.stars[0].rawCsv;
  assert.deepEqual(await pinR76V663(page.path), page);
  assert.deepEqual(await pinR76V663(csv.path), csv);
  assert.equal(snapshot.nebulae.every((row) =>
    row.imageRequestExecuted === false
    && row.imageResponseCaptured === 0), true);
});

test("forged image request and signed rights fail closed", async () => {
  const forged = clone(await baseline());
  forged.nebulae[0].imageRequestExecuted = true;
  forged.nebulae[0].imageResponseCaptured = 1;
  forged.nebulae[0].rightsSigned = true;
  forged.gates.betaNebulaRightsSigned = 1;
  const result = inspectR76ReadinessShapeV663(forged);
  assert.equal(result.ok, false);
  assert.ok(result.issues.includes("gate-count-or-promotion-invalid"));
  assert.ok(result.issues.includes("nebula-promoted-or-incomplete:ring-nebula"));
  assert.ok(result.issues.includes("fingerprint-not-reproducible"));
});

test("a matched cross-ID cannot be forged into component confirmation", async () => {
  const forged = clone(await baseline());
  forged.stars[2].physicalComponentConfirmed = true;
  const result = inspectR76ReadinessShapeV663(forged);
  assert.equal(result.ok, false);
  assert.ok(result.issues.includes("star-promoted-or-incomplete:regulus"));
});

test("Dumbbell conflict cannot be deleted from the review chain", async () => {
  const forged = clone(await baseline());
  forged.nebulae.find((row) => row.id === "dumbbell-nebula")
    .conflictingSources = [];
  const result = inspectR76ReadinessShapeV663(forged);
  assert.ok(result.issues.includes("dumbbell-conflict-erased"));
});

test("source-path traversal and duplicate pins cannot qualify", async () => {
  for (const unsafe of ["../outside", "docs/../outside",
    "C:/Windows/system.ini", "/absolute", "docs\\bad"])
    assert.throws(() => safePathR76V663(unsafe));
  const forged = clone(await baseline());
  forged.sourcePins[0].path = forged.sourcePins[1].path;
  const result = inspectR76ReadinessShapeV663(forged);
  assert.ok(result.issues.includes("source-pin-coverage-invalid"));
});

test("source pin and source decision drift are detected independently", async () => {
  const forged = clone(await baseline());
  forged.sourcePins[0].sha256 = "a".repeat(64);
  const result = await replayR76ReadinessV663(forged);
  assert.equal(result.status, "rejected-candidate");
  assert.ok(result.issues.some((issue) =>
    issue.startsWith("source-bytes-drift:")));
  assert.ok(result.issues.includes("recomputed-source-decision-drift"));
});

test("CLI modes and run IDs are bounded to this round", () => {
  assert.equal(parseR76OptionsV663(["--write"]), "--write");
  assert.equal(parseR76OptionsV663(["--check"]), "--check");
  assert.throws(() => parseR76OptionsV663(["--collect-image"]));
  assert.equal(parseReplayOptionsV663(["--run-id",
    "20261013v663r76source01"]), "20261013v663r76source01");
  assert.throws(() => parseReplayOptionsV663(["--run-id",
    "20261013v662r75web02"]));
});
