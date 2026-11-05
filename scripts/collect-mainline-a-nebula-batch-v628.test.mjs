import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { createRequire } from "node:module";
import { IDS, OFFLINE_OUTPUT, OUTPUT, artifactRelativePath, buildOfflineRow, run, safeSourceUrl, validateBatch } from "./collect-mainline-a-nebula-batch-v628.mjs";
import { replayBatch } from "./replay-mainline-a-nebula-batch-v628.mjs";

const require = createRequire(import.meta.url);
const sharp = require("sharp");
const fixtureRoot = async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "solar-v628-"));
  await fs.mkdir(path.join(root, "app", "data"), { recursive: true });
  await fs.copyFile(path.join(process.cwd(), "app/data/mainlineANebulaRightsPackV613.generated.json"), path.join(root, "app/data/mainlineANebulaRightsPackV613.generated.json"));
  return root;
};

test("V628 roster is the next six V613 candidates and uses only safe HTTPS", () => {
  assert.deepEqual(IDS, ["jellyfish-nebula", "cocoon-nebula", "rho-ophiuchi-cloud", "cepheus-c-nebula", "dragon-lair-nebula", "monkey-head-nebula"]);
  assert.equal(safeSourceUrl("https://images-assets.nasa.gov/image/PIA13449/PIA13449~orig.jpg"), true);
  assert.equal(safeSourceUrl("https://example.invalid/fixture.jpg"), false);
  assert.match(artifactRelativePath("jellyfish-nebula", "PIA13449", "jpg", "a".repeat(64)), /r68\/jellyfish-nebula-pia13449/);
});

test("offline V628 ledger records no request, payload, or rights promotion", async () => {
  const root = await fixtureRoot();
  const result = await run({ root, offline: true });
  assert.equal(result.output, OFFLINE_OUTPUT);
  const batch = JSON.parse(await fs.readFile(path.join(root, OFFLINE_OUTPUT), "utf8"));
  assert.equal(batch.counts.total, 6);
  assert.equal(batch.counts.networkAttempted, 0);
  assert.equal(batch.counts.captured, 0);
  assert.equal(batch.counts.rightsPending, 6);
  assert.ok(batch.rows.every((row) => row.network.responseCaptured === 0 && row.source.sourcePageStatus === "pending" && row.rights.status === "pending" && row.scientificPayloadWriteback === false));
  assert.deepEqual(validateBatch(batch), []);
});

test("live collector persists a real response supplied by the fetch boundary and hashes exact bytes", async () => {
  const root = await fixtureRoot();
  const bytes = await sharp({ create: { width: 3, height: 2, channels: 3, background: "#345678" } }).png().toBuffer();
  const result = await run({ root, maxRetries: 0, fetchImpl: async () => new Response(bytes, { status: 200, headers: { "content-type": "image/png", "content-length": String(bytes.byteLength) } }) });
  assert.equal(result.output, OUTPUT);
  const batch = JSON.parse(await fs.readFile(path.join(root, OUTPUT), "utf8"));
  assert.equal(batch.counts.captured, 6);
  assert.ok(batch.rows.every((row) => row.network.artifact?.sha256 && row.network.artifact?.bytes === bytes.byteLength));
  assert.ok(batch.rows.every((row) => row.network.attempts[0].httpStatus === 200 && row.network.attempts[0].responseCaptured === 1));
  assert.deepEqual(validateBatch(batch), []);
  const replay = replayBatch(batch, root);
  assert.equal(replay.status, "passed");
});

test("boundary validator rejects opened writeback and rights claims", () => {
  const row = buildOfflineRow({ candidateId: IDS[0], nasaId: "PIA13449", sourceUrl: "https://images-assets.nasa.gov/image/PIA13449/PIA13449~orig.jpg", sourceCredit: "NASA/JPL-Caltech/UCLA", sourceLicense: "candidate", sourceLocalPath: null, sourceSha256: "", evidence: { sourceLicenseUrl: "https://www.nasa.gov/" } }, process.cwd());
  const batch = { schema: "mainline-a-nebula-batch-v628", batchId: "r66-beta-next-six", rows: IDS.map((id) => id === IDS[0] ? { ...row, scientificPayloadWriteback: true } : { ...row, id }), boundary: { candidateOnly: true, hold: true, notAdmitted: true, scientificPayloadWriteback: false } };
  assert.ok(validateBatch(batch).some((issue) => issue.includes("boundary-open")));
  const promoted = { ...row, source: { ...row.source, sourcePageStatus: "verified" } };
  assert.ok(validateBatch({ ...batch, rows: IDS.map((id) => ({ ...promoted, id })) }).some((issue) => issue.includes("source-page-open")));
});

test("replay fails closed on synthetic marker and tampered artifact", async () => {
  const root = await fixtureRoot();
  await run({ root, offline: true });
  const batch = JSON.parse(await fs.readFile(path.join(root, OFFLINE_OUTPUT), "utf8"));
  batch.rows[0].source.url = "https://example.invalid/fixture.jpg";
  const report = replayBatch(batch, root);
  assert.equal(report.status, "blocked");
  assert.ok(report.integrityIssues.some((issue) => issue.includes("synthetic-marker")));
});

test("real collector binds the recorded fingerprint to the actual request headers", async () => {
  const root = await fixtureRoot();
  const calls = [];
  const result = await run({
    root,
    maxRetries: 0,
    fetchImpl: async (url, init) => {
      calls.push({ url, init });
      throw Object.assign(new Error("temporary DNS failure"), { code: "EAI_AGAIN" });
    },
  });
  const batch = JSON.parse(await fs.readFile(path.join(root, OUTPUT), "utf8"));
  expectCallsForEveryCandidate(calls, batch);
  assert.equal(result.counts.captured, 0);
  assert.equal(result.counts.networkAttempted, 6);
  assert.ok(batch.rows.every((row) => row.network.status === "failed" && row.network.responseCaptured === 0 && row.network.artifact === null));
  assert.ok(batch.rows.every((row) => row.network.attempts.length === 1 && row.network.attempts[0].retryCount === 0 && row.network.attempts[0].errorClass === "dns"));
});

test("redirects leaving the NASA allowlist fail closed without an artifact", async () => {
  const root = await fixtureRoot();
  const result = await run({
    root,
    maxRetries: 0,
    fetchImpl: async () => new Response(null, { status: 302, headers: { location: "https://example.invalid/fixture.jpg" } }),
  });
  const batch = JSON.parse(await fs.readFile(path.join(root, OUTPUT), "utf8"));
  assert.equal(result.counts.captured, 0);
  assert.ok(batch.rows.every((row) => row.network.responseCaptured === 0 && row.network.artifact === null && row.network.attempts[0].errorClass === "redirect"));
  assert.ok(batch.rows.every((row) => row.network.attempts[0].redirectChain.at(-1) === "https://example.invalid/fixture.jpg"));
});

function expectCallsForEveryCandidate(calls, batch) {
  assert.equal(calls.length, 6);
  for (const [index, row] of batch.rows.entries()) {
    const call = calls[index];
    assert.equal(call.url, row.source.url);
    assert.equal(call.init.method, "GET");
    assert.equal(call.init.headers.accept, "image/jpeg,image/png,image/webp");
    assert.equal(call.init.headers["user-agent"], "SolarSim-MainlineA-R66-Nebula/1.0");
    assert.equal(row.network.attempts[0].requestFingerprint.length, 64);
  }
}
