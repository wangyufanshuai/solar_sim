import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {
  parseCanonicalReplayArgumentsV635,
  replayCanonicalRuntimeV635,
  validateCanonicalRuntimeIndexV635,
} from "./replay-mainline-a-canonical-runtime-v635";

const root = process.cwd();
const sha = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex");
const coverage = "app/data/mainlineACanonicalCoverageV622.generated.json";
const boundary = { candidateOnly: true, hold: true, notAdmitted: true, scientificPayloadWriteback: false };
const index = () => ({ schema: "mainline-a-canonical-runtime-index-v635", mode: "candidate", boundary,
  rawObservations: [{ path: "docs/raw.json", sha256: "a".repeat(64) }] });

test("index does not treat summary counts, rights or an approval badge as raw observations", () => {
  for (const value of [null, [], { status: "passed", counts: { total: 36 } }, { ...index(), rawObservations: [] }]) {
    assert.throws(() => validateCanonicalRuntimeIndexV635(value));
  }
});

test("index rejects fixture promotion and every open boundary", () => {
  for (const value of [{ ...index(), fixture: true }, { ...index(), synthetic: true }, { ...index(), mode: "fixture" },
    ...Object.keys(boundary).map((key) => ({ ...index(), boundary: { ...boundary, [key]: !boundary[key as keyof typeof boundary] } }))]) {
    assert.throws(() => validateCanonicalRuntimeIndexV635(value), /origin|boundary/u);
  }
});

test("case aliases, duplicate hashes, extra raw fields and oversized lists are rejected", () => {
  const first = index().rawObservations[0];
  for (const refs of [
    [first, { ...first, path: "different.json" }],
    [first, { path: "DOCS\\RAW.JSON", sha256: "b".repeat(64) }],
    [{ ...first, status: "passed" }],
    Array.from({ length: 73 }, () => first),
    [{ path: first.path, sha256: "bad" }],
  ]) assert.throws(() => validateCanonicalRuntimeIndexV635({ ...index(), rawObservations: refs }));
});

test("index returns only precise raw references without summary promotion", () => {
  const value = { ...index(), counts: { verified: 36 }, status: "passed" };
  assert.deepEqual(validateCanonicalRuntimeIndexV635(value), value.rawObservations);
});

test("CLI requires coverage and build binding and refuses duplicate flags", () => {
  const args = ["--input", "i.json", "--expected-sha256", "a".repeat(64), "--build-receipt", "b.json", "--coverage", coverage, "--coverage-sha256", "b".repeat(64)];
  assert.equal(parseCanonicalReplayArgumentsV635(args, root).coverage, coverage);
  for (const values of [[], args.slice(0, 8), [...args, "--input", "second"], [...args, "--force", "yes"], [...args, "--output"]]) {
    assert.throws(() => parseCanonicalReplayArgumentsV635(values, root));
  }
});

async function negativeFiles() {
  await mkdir(path.join(root, "tmp"), { recursive: true });
  const directory = await mkdtemp(path.join(root, "tmp", "canonical-replay-057-test-"));
  const rawFile = path.join(directory, "raw.json");
  const raw = Buffer.from('{ "runId": "fixture-negative", "checkpoints": [] }\n');
  await writeFile(rawFile, raw, { flag: "wx" });
  const indexFile = path.join(directory, "index.json");
  const body = { ...index(), rawObservations: [{ path: path.relative(root, rawFile), sha256: sha(raw) }] };
  const bytes = Buffer.from(JSON.stringify(body));
  await writeFile(indexFile, bytes, { flag: "wx" });
  const buildReceipt = path.join(directory, "build.json");
  await writeFile(buildReceipt, JSON.stringify({ runtimeBuildId: "local-fixture", buildId: "package", branch: "codex/test", head: "a".repeat(40), exitCode: 0, sourceStable: true }), { flag: "wx" });
  return { directory, rawFile, options: { root, input: indexFile, expectedSha256: sha(bytes), coverage,
    coverageSha256: sha(await readFile(path.join(root, coverage))), buildReceipt } };
}

test("offline replay preserves missing coverage and invalid observation as blocked", async () => {
  const { options } = await negativeFiles();
  const report = await replayCanonicalRuntimeV635(options);
  assert.equal(report.status, "blocked");
  assert.equal(report.scientificPayloadWriteback, false);
  assert.equal(report.rightsApproval, false);
  assert.equal(report.rawObservations.length, 1);
  assert.ok(report.issues.some((issue) => issue.startsWith("raw:0:")));
  assert.match(report.limits.authenticity, /do not independently authenticate/u);
});

test("changed index, manifest and raw byte whitespace are independently rejected", async () => {
  const { options, rawFile } = await negativeFiles();
  await assert.rejects(replayCanonicalRuntimeV635({ ...options, expectedSha256: "0".repeat(64) }), /index-byte/u);
  await assert.rejects(replayCanonicalRuntimeV635({ ...options, coverageSha256: "0".repeat(64) }), /coverage-byte/u);
  await writeFile(rawFile, (await readFile(rawFile)).toString("utf8") + " ");
  await assert.rejects(replayCanonicalRuntimeV635(options), /raw-byte/u);
});

test("workspace escape and replacement output cannot overwrite source evidence", async () => {
  const { options } = await negativeFiles();
  await assert.rejects(replayCanonicalRuntimeV635({ ...options, input: "../outside.json" }), /outside-workspace/u);
  const original = await readFile(options.input);
  await assert.rejects(replayCanonicalRuntimeV635({ ...options, output: options.input }), /EEXIST/u);
  assert.deepEqual(await readFile(options.input), original);
});

test("malformed UTF-8 is rejected without replacement characters", async () => {
  const { options, directory } = await negativeFiles();
  const file = path.join(directory, "invalid.json");
  const bytes = Buffer.from([0x7b, 0xff, 0x7d]);
  await writeFile(file, bytes, { flag: "wx" });
  await assert.rejects(replayCanonicalRuntimeV635({ ...options, input: file, expectedSha256: sha(bytes) }), /encoded data|encoding/u);
});
