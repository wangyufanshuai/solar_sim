import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildPack, lifecycle } from "./build-mainline-a-canonical-coverage-v622";
import { buildReplay } from "./replay-mainline-a-canonical-coverage-v622";

describe("V656 canonical candidate asset lifecycle", () => {
  it("recognizes a delivered candidate asset without licensing or admitting it", () => {
    assert.equal(lifecycle({ presentation: {
      assetStatus: "manifest-candidate", assetId: "m42",
    } }, "nebula"), "asset-delivered");
    assert.equal(lifecycle({ presentation: {
      assetStatus: "manifest-candidate", assetId: null,
    } }, "nebula"), "catalog-mapped");
    assert.equal(lifecycle({ presentation: {
      assetStatus: "licensed", assetId: "m42",
    } }, "nebula"), "asset-delivered");
    assert.equal(lifecycle({ presentation: {
      assetStatus: "manifest-candidate", assetId: "m42",
    } }, "star"), "catalog-mapped");
  });

  it("replays all 12 canonical nebula rows without opening the rights gate", () => {
    const pack = buildPack();
    const nebulae = pack.records.filter((row) => row.kind === "nebula");
    assert.equal(nebulae.length, 12);
    assert.equal(nebulae.filter((row) => row.lifecycle === "asset-delivered").length, 12);
    for (const row of nebulae) {
      assert.equal(row.status, "rights-pending");
      assert.equal(row.candidateOnly, true);
      assert.equal(row.runtimeAdmission, "candidate-only");
      assert.equal(row.measurementAdmission, "not-admitted");
      assert.equal(row.scientificPayloadWriteback, false);
    }
    const replay = buildReplay();
    assert.equal(replay.validation.manifestEqual, true);
    assert.deepEqual(replay.validation.errors, []);
    assert.equal(replay.validation.rebuiltDigest, replay.validation.storedDigest);
  });
});
