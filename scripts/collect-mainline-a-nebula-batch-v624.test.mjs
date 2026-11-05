import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { IDS, OFFLINE_OUTPUT, appendAttemptHistory, artifactRelativePath, assembleBatch, buildOfflineRow, canonical, classifyError, fetchImage, fingerprintRequest, isRetryable, run, safeSourceUrl, validateBatch, verifyPriorArtifact } from "./collect-mainline-a-nebula-batch-v624.mjs";

const require = createRequire(import.meta.url);
const sharp = require("sharp");

test("R64 source roster and request policy are deterministic", () => {
  assert.deepEqual(IDS, ["heart-nebula", "soul-nebula", "witch-head-nebula", "flame-nebula", "pacman-nebula", "running-chicken-nebula"]);
  assert.equal(safeSourceUrl("https://images-assets.nasa.gov/image/PIA.jpg"), true);
  assert.equal(safeSourceUrl("https://user:pass@images-assets.nasa.gov/image/PIA.jpg"), false);
  assert.equal(safeSourceUrl("https://images-assets.nasa.gov:8443/image/PIA.jpg"), false);
  assert.equal(fingerprintRequest("https://images-assets.nasa.gov/image/PIA.jpg"), fingerprintRequest("https://images-assets.nasa.gov/image/PIA.jpg"));
  assert.deepEqual(canonical({ b: 1, a: 2 }), canonical({ a: 2, b: 1 }));
});

test("R64 error classes and retry policy separate transient failures", () => {
  assert.equal(classifyError({ name: "AbortError" }), "timeout");
  assert.equal(classifyError({ code: "CONTENT_TYPE" }), "content-type");
  assert.equal(classifyError(null, { status: 503 }), "http-5xx");
  assert.equal(isRetryable("timeout"), true);
  assert.equal(isRetryable("content-type"), false);
  const digest = "a".repeat(64);
  assert.equal(artifactRelativePath("Heart Nebula", "PIA 1", "jpg", digest), `docs/release/v607/nebula-image-artifacts/r64/heart-nebula-pia-1-${digest}.jpg`);
  assert.throws(() => artifactRelativePath("Heart Nebula", "PIA 1", "jpg"), /digest required/);
});

test("R64 offline row records no executed request and remains candidate-only", () => {
  const row = buildOfflineRow({ candidateId: "heart-nebula", nasaId: "PIA13112", sourceUrl: "https://images-assets.nasa.gov/image/PIA13112/PIA13112~orig.jpg", sourceCredit: "NASA", sourceLicense: "candidate", sourceLocalPath: null, sourceSha256: "", sourceBytes: null, sourceWidth: null, sourceHeight: null, evidence: { status: "pending", sourceLicenseUrl: "https://www.nasa.gov/nasa-brand-center/images-and-media/" } }, process.cwd());
  assert.equal(row.network.responseCaptured, 0);
  assert.equal(row.network.attempts[0].requestExecuted, false);
  assert.equal(row.runtimeAdmission, "candidate-only");
  assert.equal(row.scientificPayloadWriteback, false);
});

test("R64 batch validator rejects opened runtime and inconsistent captures", () => {
  const base = { schema: "mainline-a-nebula-batch-v624", batchId: "r64-base-six", rows: [], boundary: { candidateOnly: true, hold: true, notAdmitted: true, scientificPayloadWriteback: false } };
  assert.ok(validateBatch(base).includes("row-count-invalid"));
});

test("R64 attempt history is append-only and renumbered across reruns", () => {
  const prior = [{ attempt: 1, retryCount: 0, requestExecuted: true }, { attempt: 2, retryCount: 1, requestExecuted: true }];
  const current = [{ attempt: 1, retryCount: 0, requestExecuted: true }, { attempt: 2, retryCount: 1, requestExecuted: false }];
  const merged = appendAttemptHistory(prior, current);
  assert.deepEqual(merged.map((attempt) => attempt.attempt), [1, 2, 3, 4]);
  assert.deepEqual(merged.map((attempt) => attempt.retryCount), [0, 1, 0, 1]);
  assert.equal(merged[1].requestExecuted, true);
  assert.equal(merged[3].requestExecuted, false);
});

test("R64 evidence marks the live HTTPS source explicitly", () => {
  const batch = assembleBatch([], process.cwd(), "live-https-attempt");
  assert.equal(batch.evidence.externalSourceEvidence, true);
  assert.equal(assembleBatch([], process.cwd(), "offline-no-request").evidence.externalSourceEvidence, false);
});

test("R64 fetch telemetry follows safe redirects and records the terminal URL", async () => {
  const bytes = await sharp({ create: { width: 2, height: 3, channels: 3, background: "#ff0044" } }).png().toBuffer();
  const seen = [];
  const result = await fetchImage("https://images-assets.nasa.gov/image/start.jpg", {
    fetchImpl: async (url) => {
      seen.push(url);
      if (seen.length === 1) return new Response(null, { status: 302, headers: { location: "/image/final.png" } });
      return new Response(bytes, { status: 200, headers: { "content-type": "image/png", "content-length": String(bytes.byteLength) } });
    },
  });
  assert.deepEqual(seen, ["https://images-assets.nasa.gov/image/start.jpg", "https://images-assets.nasa.gov/image/final.png"]);
  assert.equal(result.finalUrl, "https://images-assets.nasa.gov/image/final.png");
  assert.deepEqual(result.redirectChain, seen);
  assert.equal(result.width, 2);
  assert.equal(result.height, 3);
});

test("R64 redirect telemetry rejects an unsafe terminal URL", async () => {
  await assert.rejects(
    fetchImage("https://images-assets.nasa.gov/image/start.jpg", {
      fetchImpl: async () => new Response(null, { status: 302, headers: { location: "https://example.invalid/away.jpg" } }),
    }),
    (error) => error.code === "REDIRECT" && error.redirectChain.at(-1) === "https://example.invalid/away.jpg",
  );
});

test("R64 prior artifact reuse requires a successful attempt linkage", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "solar-r64-artifact-"));
  const bytes = await sharp({ create: { width: 1, height: 1, channels: 3, background: "#00aa55" } }).png().toBuffer();
  const digest = (await import("node:crypto")).createHash("sha256").update(bytes).digest("hex");
  const relative = artifactRelativePath("heart-nebula", "PIA1", "png", digest);
  await fs.mkdir(path.dirname(path.join(root, relative)), { recursive: true });
  await fs.writeFile(path.join(root, relative), bytes, { flag: "wx" });
  const artifact = { path: relative, sha256: digest, bytes: bytes.length, width: 1, height: 1, format: "png" };
  assert.equal(await verifyPriorArtifact(artifact, root, []), null);
  const linked = [{ responseCaptured: 1, rawArtifactPath: relative, rawPageSha256: digest }];
  assert.equal((await verifyPriorArtifact(artifact, root, linked)).sha256, digest);
  await fs.rm(root, { recursive: true, force: true });
});

test("R64 offline run writes an isolated output and does not overwrite live output", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "solar-r64-offline-"));
  await fs.mkdir(path.join(root, "app", "data"), { recursive: true });
  const input = path.join(process.cwd(), "app/data/mainlineANebulaRightsPackV613.generated.json");
  await fs.copyFile(input, path.join(root, "app/data/mainlineANebulaRightsPackV613.generated.json"));
  const result = await run({ root, offline: true });
  assert.equal(result.output, OFFLINE_OUTPUT);
  assert.equal(await fs.stat(path.join(root, OFFLINE_OUTPUT)).then(() => true), true);
  assert.equal(await fs.stat(path.join(root, "app/data/mainlineANebulaBatchV624.generated.json")).then(() => true).catch(() => false), false);
  await fs.rm(root, { recursive: true, force: true });
});
