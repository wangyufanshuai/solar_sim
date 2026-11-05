import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { indexCanonicalObservationsV635, parseCanonicalIndexArgumentsV635 } from "./index-mainline-a-canonical-observations-v635";

const root = process.cwd();
const coverage = "app/data/mainlineACanonicalCoverageV622.generated.json";
const buildIdentity = { status: "passed", exitCode: 0, sourceStable: true, buildId: "fixture-package", runtimeBuildId: "fixture-local", branch: "codex/test", head: "a".repeat(40) };
async function files() {
  const directory = await mkdtemp(path.join(root, "tmp", "canonical-index-057-test-"));
  const buildReceipt = path.join(directory, "build.json");
  const raw = path.join(directory, "raw.json");
  await writeFile(buildReceipt, JSON.stringify(buildIdentity), { flag: "wx" });
  await writeFile(raw, '{ "runId": "negative-fixture", "checkpoints": [] }\n', { flag: "wx" });
  return { directory, options: { root, buildReceipt, coverage, raw: [raw], output: path.join(directory, "index.json"), replayOutput: path.join(directory, "replay.json") } };
}

test("raw CLI paths are explicit, repeatable and mutually distinct from single flags", () => {
  const args = ["--raw", "one", "--raw", "two", "--build-receipt", "build", "--coverage", coverage, "--output", "index"];
  assert.deepEqual(parseCanonicalIndexArgumentsV635(args, root).raw, ["one", "two"]);
  for (const invalid of [[], args.slice(2, 4), [...args, "--output", "again"], [...args, "--force", "true"], [...args, "--raw"]]) {
    assert.throws(() => parseCanonicalIndexArgumentsV635(invalid, root));
  }
});

test("intake preserves exact raw bytes and records failed replay without promoting it", async () => {
  const { options } = await files();
  const before = await readFile(options.raw[0]);
  const result = await indexCanonicalObservationsV635(options);
  assert.deepEqual(await readFile(options.raw[0]), before);
  assert.equal(result.sourceFilesMutated, false);
  assert.equal(result.replay.status, "blocked");
  const saved = JSON.parse(await readFile(options.output, "utf8"));
  assert.equal(saved.status, "collected-pending-browser-binding");
  assert.equal(saved.boundary.scientificPayloadWriteback, false);
  assert.equal(saved.rawObservations.length, 1);
  assert.equal(saved.checks[0].status, "blocked");
  assert.match(saved.authenticity, /do not authenticate/u);
  assert.equal(JSON.parse(await readFile(options.replayOutput, "utf8")).status, "blocked");
});

test("intake refuses fixture flags, duplicate bytes and duplicate run ids", async () => {
  const { options, directory } = await files();
  await assert.rejects(indexCanonicalObservationsV635({ ...options, raw: [options.raw[0], options.raw[0]] }), /duplicate-artifact/u);
  const second = path.join(directory, "second.json");
  await writeFile(second, '{"runId":"negative-fixture","differentBytes":true}', { flag: "wx" });
  await assert.rejects(indexCanonicalObservationsV635({ ...options, raw: [options.raw[0], second] }), /duplicate-run-id/u);
  const fixture = path.join(directory, "fixture.json");
  await writeFile(fixture, '{"runId":"explicit-fixture","fixture":true}', { flag: "wx" });
  await assert.rejects(indexCanonicalObservationsV635({ ...options, raw: [fixture] }), /fixture-not-admitted/u);
});

test("intake cannot overwrite an input or an existing evidence index", async () => {
  const { options } = await files();
  const before = await readFile(options.raw[0]);
  await assert.rejects(indexCanonicalObservationsV635({ ...options, output: options.raw[0] }), /output-input-collision/u);
  await assert.rejects(indexCanonicalObservationsV635({ ...options, replayOutput: options.buildReceipt }), /replay-output-collision/u);
  await indexCanonicalObservationsV635(options);
  const originalIndex = await readFile(options.output);
  await assert.rejects(indexCanonicalObservationsV635(options), /EEXIST/u);
  assert.deepEqual(await readFile(options.output), originalIndex);
  assert.deepEqual(await readFile(options.raw[0]), before);
});

test("intake rejects failed builds, wrong canonical file and unbounded collections", async () => {
  const { options, directory } = await files();
  const badBuild = path.join(directory, "failed-build.json");
  await writeFile(badBuild, JSON.stringify({ ...buildIdentity, exitCode: 1 }), { flag: "wx" });
  await assert.rejects(indexCanonicalObservationsV635({ ...options, buildReceipt: badBuild }), /build-not-passed/u);
  await assert.rejects(indexCanonicalObservationsV635({ ...options, coverage: options.buildReceipt }), /coverage-digest/u);
  await assert.rejects(indexCanonicalObservationsV635({ ...options, raw: [] }), /raw-count/u);
  await assert.rejects(indexCanonicalObservationsV635({ ...options, raw: Array(73).fill(options.raw[0]) }), /raw-count/u);
});
