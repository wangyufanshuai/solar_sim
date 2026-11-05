import test from "node:test";
import assert from "node:assert/strict";
import {
  allowedContentType,
  sha256,
  verifyAttempt,
  verifyLedgerDocument,
  verifyRecord,
} from "./build-mainline-a-beta-stellar-raw-replay-v620.mjs";

const url = "https://simbad.cds.unistra.fr/simbad/sim-id?Ident=*%20alf01%20Cru";
const digest = "0".repeat(64);
const base = {
  attempt: 1, startedAt: "2026-09-13T00:00:00.000Z", endedAt: "2026-09-13T00:00:00.500Z",
  timeout: true, retryCount: 0, httpStatus: null, contentType: null, requestUrl: url, finalUrl: null,
  redirectChain: [], errorClass: "timeout", requestFingerprint: `GET ${url} transport=https-html`, transport: "https-html",
  responseCaptured: false, responseBytes: null, rawPageSha256: null, rawResponse: null,
};
const baseRecord = {
  id: "acrux", planId: "mainline-a-v620-acrux", requestUrl: url,
  serviceEndpoint: "https://simbad.cds.unistra.fr/simbad/sim-tap/sync",
  expectedSnapshotRecordDigest: digest, expectedProjectionRecordDigest: digest,
  attempts: [base], state: "blocked", responseCaptured: false,
  runtimeAdmission: "candidate-only", measurementAdmission: "not-admitted", scientificPayloadWriteback: false,
};

test("timeout attempt replays as a valid blocked record", () => {
  const result = verifyRecord(baseRecord);
  assert.deepEqual(result.errors, []);
  assert.equal(result.responseCaptured, false);
});

test("successful raw body is hash and byte checked", () => {
  const body = "<html>ok</html>";
  const live = { ...base, timeout: false, httpStatus: 200, contentType: "text/html; charset=utf-8", finalUrl: url,
    errorClass: null, responseCaptured: true, responseBytes: Buffer.byteLength(body), rawPageSha256: sha256(body), rawResponse: body };
  const result = verifyRecord({ ...baseRecord, attempts: [live], state: "raw-only", responseCaptured: true });
  assert.deepEqual(result.errors, []);
  assert.equal(result.responseCaptured, true);
});

test("fixture replay cannot be considered a live response", () => {
  const body = "fixture";
  const fixture = { ...base, timeout: false, httpStatus: 200, contentType: "text/html", finalUrl: url, errorClass: null,
    transport: "fixture-replay", requestFingerprint: `GET ${url} transport=fixture-replay`, responseCaptured: true,
    responseBytes: Buffer.byteLength(body), rawPageSha256: sha256(body), rawResponse: body };
  const result = verifyRecord({ ...baseRecord, attempts: [fixture], state: "raw-only", responseCaptured: true });
  assert.ok(result.errors.includes("fixture-response-not-live"));
  assert.equal(result.responseCaptured, false);
});

test("forged metadata is rejected fail closed", () => {
  const forged = { ...base, timeout: false, httpStatus: 500, contentType: "image/png", finalUrl: "https://evil.test/",
    errorClass: null, requestFingerprint: "forged", responseCaptured: true, responseBytes: 0, rawPageSha256: "bad", rawResponse: "x" };
  const errors = verifyAttempt(forged, url);
  assert.ok(errors.includes("captured-http-status-invalid"));
  assert.ok(errors.includes("captured-content-type-invalid"));
  assert.ok(errors.includes("final-url-unsafe"));
  assert.ok(errors.includes("request-fingerprint-mismatch"));
  assert.ok(errors.includes("captured-hash-invalid"));
});

test("uncaptured attempts cannot carry artifacts", () => {
  const forged = { ...base, rawArtifactPath: "raw/acrux.html", rawPageSha256: "a".repeat(64) };
  assert.ok(verifyAttempt(forged, url).includes("uncaptured-artifact-present"));
});

test("ledger boundary remains writeback false", () => {
  const document = { schema: "mainline-a-beta-stellar-raw-attempt-ledger-v620", boundary: { candidateOnly: true, hold: true, notAdmitted: true, scientificPayloadWriteback: false, runtimeWrites: false, measurementWrites: false }, records: [baseRecord] };
  const result = verifyLedgerDocument(document);
  assert.equal(result.summary.scientificPayloadWriteback, false);
  assert.equal(result.summary.valid, 1);
});

test("content type allowlist is narrow", () => {
  assert.equal(allowedContentType("text/html; charset=utf-8"), true);
  assert.equal(allowedContentType("application/json"), true);
  assert.equal(allowedContentType("image/png"), false);
});
