import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  ALLOWLIST,
  INPUT_PATH,
  OUTPUT_PATH,
  PACK_SCHEMA,
  buildCapturePlan,
  buildPack,
  canonicalSha,
  parseRawCaptureDocument,
  run,
  sealRawCapture,
  sha256,
  validatePack,
  validateRawCaptureAgainstPlan,
} from "./build-mainline-a-beta-stellar-raw-capture-v619.mjs";

const root = process.cwd();

function sampleRaw(plan, overrides = {}) {
  const rawResponse = `<html><body>${plan.id} SIMBAD raw fixture</body></html>`;
  return {
    schema: "mainline-a-stellar-raw-capture-response-v619",
    planId: plan.planId,
    id: plan.id,
    queryIdentifier: plan.queryIdentifier,
    sourceUrl: plan.sourceUrl,
    requestUrl: plan.requestUrl,
    serviceEndpoint: plan.serviceEndpoint,
    transport: "fixture-replay",
    parseStatus: "raw-only",
    capturedAt: "2026-09-13T00:00:00.000Z",
    httpStatus: 200,
    contentType: "text/html; charset=utf-8",
    responseBytes: Buffer.byteLength(rawResponse, "utf8"),
    finalUrl: plan.sourceUrl,
    rawResponse,
    rawPageSha256: sha256(rawResponse),
    errors: [],
    retryAfter: null,
    reviewer: null,
    decision: "hold",
    runtimeAdmission: "candidate-only",
    measurementAdmission: "not-admitted",
    scientificPayloadWriteback: false,
    ...overrides,
  };
}

test("creates four pending capture plans without contacting SIMBAD", () => {
  const pack = buildPack(root);
  assert.equal(pack.schema, PACK_SCHEMA);
  assert.deepEqual(pack.records.map((record) => record.plan.id), ALLOWLIST);
  assert.equal(pack.counts.pending, 4);
  assert.equal(pack.counts.captured, 0);
  assert.ok(pack.records.every((record) => record.state === "pending" && record.rawResponse === null));
  assert.deepEqual(pack.service.transports, ["https-html", "astroquery-sim-script", "fixture-replay"]);
});

test("builds deterministic plans with immutable input digests", () => {
  const record = buildPack(root).records[0];
  const plan = record.plan;
  assert.match(plan.planId, /^mainline-a-v619-acrux-/);
  assert.equal(plan.timeoutMs, 20000);
  assert.deepEqual(plan.retryBackoffMs, [500, 1500]);
  assert.equal(plan.expectedSnapshotRecordDigest, plan.expectedProjectionRecordDigest);
  assert.equal(plan.structuredEvidenceRequired, true);
});

test("seals a raw-only fixture and keeps the scientific boundary closed", () => {
  const plan = buildPack(root).records[0].plan;
  const capture = sampleRaw(plan);
  const parsed = parseRawCaptureDocument(capture);
  assert.deepEqual(validateRawCaptureAgainstPlan(plan, parsed), []);
  const sealed = sealRawCapture(plan, parsed);
  assert.equal(sealed.parseStatus, "raw-only");
  assert.equal(sealed.expectedSnapshotRecordDigest, plan.expectedSnapshotRecordDigest);
  assert.equal(sealed.runtimeAdmission, "candidate-only");
});

test("rejects malformed bytes, unsafe redirects, future timestamps and opened admission", () => {
  const plan = buildPack(root).records[0].plan;
  const malformedBytes = sampleRaw(plan, { responseBytes: 3 });
  assert.throws(() => parseRawCaptureDocument(malformedBytes), /byte count mismatch/);
  assert.throws(() => parseRawCaptureDocument(sampleRaw(plan, { finalUrl: "https://example.com/redirect" })), /final URL unsafe/);
  assert.throws(() => parseRawCaptureDocument(sampleRaw(plan, { contentType: "image/png" })), /content type not allowed/);
  assert.throws(() => parseRawCaptureDocument(sampleRaw(plan, { httpStatus: 302 })), /HTTP status invalid/);
  assert.throws(() => parseRawCaptureDocument(sampleRaw(plan, { rawResponse: "" })), /bytes missing/);
  assert.throws(() => parseRawCaptureDocument(sampleRaw(plan, { capturedAt: "2099-01-01T00:00:00.000Z" })), /timestamp invalid or future/);
  assert.throws(() => parseRawCaptureDocument(sampleRaw(plan, { runtimeAdmission: "admitted" })), /admission opened/);
});

test("rejects stale request identity, query and endpoint bindings", () => {
  const plan = buildPack(root).records[1].plan;
  const capture = sampleRaw(plan);
  assert.ok(validateRawCaptureAgainstPlan(plan, { ...capture, id: "acrux" }).includes("identity-mismatch"));
  assert.ok(validateRawCaptureAgainstPlan(plan, { ...capture, queryIdentifier: "wrong" }).includes("query-mismatch"));
  assert.ok(validateRawCaptureAgainstPlan(plan, { ...capture, serviceEndpoint: "https://example.com" }).includes("service-endpoint-mismatch"));
  assert.ok(validateRawCaptureAgainstPlan(plan, { ...capture, requestUrl: "https://example.com" }).includes("request-url-mismatch"));
  assert.ok(validateRawCaptureAgainstPlan(plan, { ...capture, finalUrl: "https://example.com" }).includes("final-url-unsafe"));
});

test("does not treat fixture raw HTML as structured scientific closure", () => {
  const plan = buildPack(root).records[2].plan;
  const capture = sampleRaw(plan, { parseStatus: "structured" });
  assert.ok(validateRawCaptureAgainstPlan(plan, capture).includes("fixture-structured-requires-review"));
});

test("fails closed on stale V618 input or forged output", () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "mainline-a-v619-"));
  fs.mkdirSync(path.join(temp, "app/data"), { recursive: true });
  fs.copyFileSync(path.join(root, INPUT_PATH), path.join(temp, INPUT_PATH));
  const freshPath = path.join(temp, INPUT_PATH);
  const fresh = JSON.parse(fs.readFileSync(freshPath, "utf8"));
  fresh.records[0].state = "captured";
  fs.writeFileSync(freshPath, JSON.stringify(fresh));
  assert.throws(() => buildPack(temp), /fresh capture request pack changed/);
  fs.rmSync(temp, { recursive: true, force: true });
});

test("generator and check mode preserve a required-only replay pack", () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "mainline-a-v619-output-"));
  fs.mkdirSync(path.join(temp, "app/data"), { recursive: true });
  fs.copyFileSync(path.join(root, INPUT_PATH), path.join(temp, INPUT_PATH));
  assert.equal(run({ root: temp }).status, "generated");
  const actual = JSON.parse(fs.readFileSync(path.join(temp, OUTPUT_PATH), "utf8"));
  assert.equal(validatePack(actual).counts.pending, 4);
  assert.deepEqual(run({ root: temp, check: true }), { status: "verified", total: 4, pending: 4, output: OUTPUT_PATH });
  actual.records.reverse();
  assert.throws(() => validatePack(actual), /order changed/);
  fs.rmSync(temp, { recursive: true, force: true });
});

test("canonical plan fingerprint changes when a source identity changes", () => {
  const plan = buildPack(root).records[0].plan;
  const altered = { ...plan, queryIdentifier: "different" };
  assert.notEqual(canonicalSha(plan), canonicalSha(altered));
});
