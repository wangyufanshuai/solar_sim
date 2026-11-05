import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  CAPTURE_IDS,
  CAPTURE_RESPONSE_SCHEMA,
  INPUT_PATH,
  OUTPUT_PATH,
  buildFreshCapturePatch,
  buildPack,
  buildRequest,
  canonicalSha,
  parseCaptureDocument,
  run,
  sha256,
  validateCaptureAgainstRequest,
  validatePack,
} from "./build-mainline-a-beta-stellar-fresh-capture-v618.mjs";

const root = process.cwd();

function sampleCapture(request, overrides = {}) {
  const base = { schema: CAPTURE_RESPONSE_SCHEMA, id: request.id, queryIdentifier: request.queryIdentifier, sourceUrl: request.sourceUrl, capturedAt: "2026-09-13T00:00:00.000Z", serviceLicense: "ODbL-1.0", citation: "Wenger et al. 2000, A&AS, 143, 9", resolutionClass: request.expectedResolutionClass, snapshotRecordDigest: request.expectedSnapshotRecordDigest, projectionRecordDigest: request.expectedProjectionRecordDigest, parallaxMas: 3.2, errorMas: 0.1, bibcode: "2000A&AS..143....9W", componentIdentityDecision: "confirmed", componentSourceReference: "https://simbad.cds.unistra.fr/simbad/sim-id?Ident=component", rawResponse: `response:${request.id}` };
  const capture = { ...base, ...overrides };
  capture.recordDigest = canonicalSha({ id: capture.id, queryIdentifier: capture.queryIdentifier, resolutionClass: capture.resolutionClass, parallaxMas: capture.parallaxMas, errorMas: capture.errorMas, bibcode: capture.bibcode, componentIdentityDecision: capture.componentIdentityDecision });
  capture.responseSha256 = sha256(capture.rawResponse);
  return capture;
}

test("creates four allowlisted HTTPS capture requests without fake responses", () => {
  const pack = buildPack(root);
  assert.equal(pack.schema, "mainline-a-beta-stellar-fresh-capture-v618");
  assert.deepEqual(pack.records.map((record) => record.request.id), CAPTURE_IDS);
  assert.equal(pack.counts.total, 4);
  assert.equal(pack.counts.responseCaptured, 0);
  assert.ok(pack.records.every((record) => record.state === "required" && record.response === null && record.patch === null));
  assert.ok(pack.records.every((record) => record.request.serviceEndpoint.startsWith("https://")));
});

test("parses a sealed response and creates a hold-only fresh capture patch", () => {
  const record = buildPack(root).records[0];
  const capture = sampleCapture(record.request);
  const parsed = parseCaptureDocument(JSON.stringify(capture));
  assert.deepEqual(validateCaptureAgainstRequest(record.request, parsed), []);
  const patch = buildFreshCapturePatch(record.request, parsed);
  assert.equal(patch.id, "acrux");
  assert.equal(patch.decision, "hold");
  assert.equal(patch.runtimeAdmission, "candidate-only");
  assert.equal(patch.scientificPayloadWriteback, false);
});

test("rejects redirects, foreign identities, missing citation, and malformed hashes", () => {
  const request = buildPack(root).records[0].request;
  assert.throws(() => parseCaptureDocument(sampleCapture(request, { sourceUrl: "http://simbad.cds.unistra.fr/redirect" })), /source URL not HTTPS/);
  assert.throws(() => parseCaptureDocument(sampleCapture(request, { id: "not-allowlisted" })), /not allowlisted/);
  assert.throws(() => parseCaptureDocument(sampleCapture(request, { citation: "" })), /citation missing/);
  const malformed = sampleCapture(request);
  malformed.responseSha256 = "bad";
  assert.throws(() => parseCaptureDocument(malformed), /response digest invalid/);
  assert.throws(() => parseCaptureDocument(sampleCapture(request, { capturedAt: "2099-01-01T00:00:00.000Z" })), /future/);
});

test("rejects stale query, resolution, response, and record digests", () => {
  const request = buildPack(root).records[1].request;
  const capture = sampleCapture(request);
  assert.ok(validateCaptureAgainstRequest(request, { ...capture, queryIdentifier: "wrong" }).includes("query-mismatch"));
  assert.ok(validateCaptureAgainstRequest(request, { ...capture, resolutionClass: "ambiguous" }).includes("resolution-class-mismatch"));
  assert.ok(validateCaptureAgainstRequest(request, { ...capture, responseSha256: "0".repeat(64) }).includes("response-digest-mismatch"));
  assert.ok(validateCaptureAgainstRequest(request, { ...capture, recordDigest: "0".repeat(64) }).includes("record-digest-mismatch"));
  assert.ok(validateCaptureAgainstRequest(request, { ...capture, projectionRecordDigest: "0".repeat(64) }).includes("projection-record-digest-mismatch"));
});

test("fails closed when V616 closure input is stale or capture output is forged", () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "mainline-a-v618-"));
  fs.mkdirSync(path.join(temp, "app/data"), { recursive: true });
  fs.copyFileSync(path.join(root, INPUT_PATH), path.join(temp, INPUT_PATH));
  const closurePath = path.join(temp, INPUT_PATH);
  const closure = JSON.parse(fs.readFileSync(closurePath, "utf8"));
  closure.records[0].runtimeAdmission = "admitted";
  fs.writeFileSync(closurePath, JSON.stringify(closure));
  assert.throws(() => buildPack(temp), /closure admission changed/);
  fs.rmSync(temp, { recursive: true, force: true });
});

test("generates deterministic required-only output and rejects reordered records", () => {
  const expected = buildPack(root);
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "mainline-a-v618-output-"));
  fs.mkdirSync(path.join(temp, "app/data"), { recursive: true });
  fs.copyFileSync(path.join(root, INPUT_PATH), path.join(temp, INPUT_PATH));
  assert.equal(run({ root: temp }).status, "generated");
  const actual = JSON.parse(fs.readFileSync(path.join(temp, OUTPUT_PATH), "utf8"));
  assert.equal(validatePack(actual).counts.total, 4);
  actual.records.reverse();
  assert.throws(() => validatePack(actual), /capture order changed/);
  fs.rmSync(temp, { recursive: true, force: true });
});

test("preserves immutable snapshot and projection digests in each request", () => {
  const pack = buildPack(root);
  for (const record of pack.records) {
    assert.match(record.request.expectedSnapshotRecordDigest, /^[a-f0-9]{64}$/);
    assert.match(record.request.expectedProjectionRecordDigest, /^[a-f0-9]{64}$/);
    assert.equal(record.request.expectedSnapshotRecordDigest, record.request.expectedProjectionRecordDigest);
    assert.equal(record.request.responseRequired, true);
    assert.equal(record.request.scientificPayloadWriteback, false);
  }
});

test("requires a component source reference for ambiguous systems", () => {
  const request = buildPack(root).records[1].request;
  const capture = sampleCapture(request, { componentIdentityDecision: "confirmed", componentSourceReference: null });
  const patch = buildFreshCapturePatch(request, capture);
  assert.equal(patch.componentSourceReference, null);
  assert.equal(patch.decision, "hold");
  assert.equal(patch.runtimeAdmission, "candidate-only");
});

test("does not accept an HTTPS page as a structured scientific response by itself", () => {
  const request = buildPack(root).records[0].request;
  const rawOnly = sampleCapture(request, { parallaxMas: null, errorMas: null, bibcode: null, componentIdentityDecision: "ambiguous", componentSourceReference: null });
  const patch = buildFreshCapturePatch(request, rawOnly);
  assert.equal(patch.parallaxMas, null);
  assert.equal(patch.bibcode, null);
  assert.equal(patch.decision, "hold");
});
