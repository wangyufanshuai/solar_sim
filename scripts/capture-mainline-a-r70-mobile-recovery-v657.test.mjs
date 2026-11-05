import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import { composeR70IndependentLongRunsV657 } from
  "./capture-mainline-a-r70-mobile-recovery-v657.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const load = (relative) => readFile(path.join(ROOT, relative), "utf8")
  .then(JSON.parse);

describe("R70 independently captured mobile long-run composition", () => {
  it("replays a prior two-observation receipt split into independent inputs", async () => {
    const [build, prior] = await Promise.all([
      load("docs/release/v607/mainline-a-r66-build-20261011-v649web02.json"),
      load("docs/release/v607/mainline-a-r66-web-r65-browser-final-raw-20261011-v650long01.json"),
    ]);
    const desktop = { ...prior, observations: [prior.observations[0]] };
    const mobile = { ...prior, observations: [prior.observations[1]] };
    const result = composeR70IndependentLongRunsV657(
      desktop, mobile, build);
    assert.equal(result.final.status, "qualified");
    assert.equal(result.verification.completeLongRuns, 2);
    assert.equal(result.replay.status, "verified");
    assert.deepEqual(result.final.observations.map((row) => row.device),
      ["desktop", "mobile"]);
  });

  it("rejects a mobile observation tied to a different source build", async () => {
    const [build, prior] = await Promise.all([
      load("docs/release/v607/mainline-a-r66-build-20261011-v649web02.json"),
      load("docs/release/v607/mainline-a-r66-web-r65-browser-final-raw-20261011-v650long01.json"),
    ]);
    const desktop = { ...prior, observations: [prior.observations[0]] };
    const mobile = { ...prior,
      build: { ...prior.build, head: "0".repeat(40) },
      observations: [prior.observations[1]] };
    assert.throws(() => composeR70IndependentLongRunsV657(
      desktop, mobile, build), /independent-build-identity-drift/);
  });
});
