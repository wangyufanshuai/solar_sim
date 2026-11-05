import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import {
  rawReplayLedgerSummaryV620,
  replayRawCaptureRecordV620,
  validateRawReplayAttemptV620,
  replayStructuredRawCaptureV620,
  validateStructuredEvidenceV620,
  verifyRawReplayLedgerV620,
  type RawReplayAttemptV620,
  type RawReplayRecordV620,
  type RawStructuredEvidenceV620,
} from "./mainlineABetaStellarRawReplayV620";

const digest = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
const requestUrl = "https://simbad.cds.unistra.fr/simbad/sim-id?Ident=*%20alf01%20Cru";
const startedAt = "2026-09-13T00:00:00.000Z";
const endedAt = "2026-09-13T00:00:00.500Z";
const hashBody = (body: string) => createHash("sha256").update(body, "utf8").digest("hex");

function attempt(overrides: Partial<RawReplayAttemptV620> = {}): RawReplayAttemptV620 {
  const base: RawReplayAttemptV620 = {
    attempt: 1,
    startedAt,
    endedAt,
    timeout: true,
    retryCount: 0,
    httpStatus: null,
    contentType: null,
    requestUrl,
    finalUrl: null,
    redirectChain: [],
    errorClass: "timeout",
    errorMessage: "request timed out",
    requestFingerprint: "f".repeat(64),
    transport: "https-html",
    responseCaptured: false,
    responseBytes: null,
    rawPageSha256: null,
    rawArtifactPath: null,
    rawResponse: null,
  };
  return { ...base, ...overrides };
}

function record(overrides: Partial<RawReplayRecordV620> = {}): RawReplayRecordV620 {
  return {
    id: "acrux",
    planId: "mainline-a-v619-acrux-6283e0cf5cb9",
    requestUrl,
    serviceEndpoint: "https://simbad.cds.unistra.fr/simbad/sim-tap/sync",
    expectedSnapshotRecordDigest: digest,
    expectedProjectionRecordDigest: digest,
    attempts: [attempt()],
    state: "blocked",
    responseCaptured: false,
    runtimeAdmission: "candidate-only",
    measurementAdmission: "not-admitted",
    scientificPayloadWriteback: false,
    ...overrides,
  };
}

function structuredEvidence(overrides: Partial<RawStructuredEvidenceV620> = {}): RawStructuredEvidenceV620 {
  return {
    parser: "simbad-html",
    parseStatus: "structured",
    sourceUrl: requestUrl,
    responseSha256: "a".repeat(64),
    snapshotRecordDigest: digest,
    projectionRecordDigest: digest,
    identity: { id: "acrux", canonicalName: "* alf01 Cru" },
    fields: { spectralType: "B0.5IV", parallaxMas: null },
    sourceRefs: [{ url: requestUrl, label: "SIMBAD object page" }],
    scientificPayloadWriteback: false,
    ...overrides,
  };
}

describe("Mainline A V620 offline raw replay", () => {
  it("replays a timed-out network attempt as blocked without a response", () => {
    const result = replayRawCaptureRecordV620(record());
    expect(result.issues).toEqual([]);
    expect(result.state).toBe("blocked");
    expect(result.responseCaptured).toBe(false);
    expect(result.errorClasses).toEqual(["timeout"]);
    expect(result.retryCount).toBe(0);
  });

  it("accepts a complete live raw attempt, while retaining raw-only state", () => {
    const body = "<html>simbad response</html>";
    const live = attempt({
      timeout: false,
      httpStatus: 200,
      contentType: "text/html; charset=utf-8",
      finalUrl: requestUrl,
      errorClass: null,
      responseCaptured: true,
      responseBytes: new TextEncoder().encode(body).byteLength,
      rawPageSha256: createHash("sha256").update(body).digest("hex"),
      rawResponse: body,
      requestFingerprint: "f".repeat(64),
    });
    const result = replayRawCaptureRecordV620(record({ attempts: [live], state: "raw-only", responseCaptured: true }));
    expect(result.issues).toEqual([]);
    expect(result.responseCaptured).toBe(true);
    expect(result.state).toBe("raw-only");
  });

  it("normalizes collector numeric responseCaptured flags", () => {
    const result = replayRawCaptureRecordV620({ ...record(), responseCaptured: 0 });
    expect(result.issues).toEqual([]);
    expect(result.responseCaptured).toBe(false);
  });

  it("accepts structured evidence only when it closes over a live raw response", () => {
    const body = "<html>structured</html>";
    const live = attempt({ timeout: false, httpStatus: 200, contentType: "text/html", finalUrl: requestUrl, errorClass: null, responseCaptured: 1, responseBytes: new TextEncoder().encode(body).byteLength, rawPageSha256: hashBody(body), rawResponse: body, requestFingerprint: "f".repeat(64) });
    const row = record({ attempts: [live], state: "structured", responseCaptured: 1 });
    const result = replayStructuredRawCaptureV620(row, structuredEvidence({ responseSha256: hashBody(body) }));
    expect(result.structured).toBe(true);
    expect(result.sourceClosed).toBe(true);
    expect(result.fieldsConsistent).toBe(true);
    expect(result.issues).toEqual([]);
  });

  it("rejects structured records with a stale response hash or V616 digest", () => {
    const body = "<html>structured</html>";
    const live = attempt({ timeout: false, httpStatus: 200, contentType: "text/html", finalUrl: requestUrl, errorClass: null, responseCaptured: 1, responseBytes: new TextEncoder().encode(body).byteLength, rawPageSha256: hashBody(body), rawResponse: body, requestFingerprint: "f".repeat(64) });
    const row = record({ attempts: [live], state: "structured", responseCaptured: 1 });
    const result = replayStructuredRawCaptureV620(row, structuredEvidence({ responseSha256: "b".repeat(64), projectionRecordDigest: "c".repeat(64) }));
    expect(result.structured).toBe(false);
    expect(result.issues.map((entry) => entry.code)).toEqual(expect.arrayContaining(["structured-response-hash-mismatch", "structured-v616-digest-mismatch"]));
  });

  it("rejects source closure with non-SIMBAD references and missing fields", () => {
    const evidence = structuredEvidence({ sourceRefs: [{ url: "https://example.test/source", label: "forged" }], fields: {} });
    const issues = validateStructuredEvidenceV620(record({ state: "structured" }), evidence);
    expect(issues.map((entry) => entry.code)).toEqual(expect.arrayContaining(["structured-response-missing", "structured-source-ref-invalid", "structured-fields-empty"]));
  });

  it("does not promote fixture replay to structured scientific evidence", () => {
    const fixture = attempt({ timeout: false, httpStatus: 200, contentType: "text/html", finalUrl: requestUrl, errorClass: null, transport: "fixture-replay", responseCaptured: 1, responseBytes: 1, rawPageSha256: "a".repeat(64), rawResponse: "x", requestFingerprint: "f".repeat(64) });
    const result = replayStructuredRawCaptureV620(record({ attempts: [fixture], state: "structured", responseCaptured: 1 }), structuredEvidence({ parser: "fixture-replay" }));
    expect(result.structured).toBe(false);
    expect(result.issues.map((entry) => entry.code)).toContain("fixture-response-not-live");
    expect(result.issues.map((entry) => entry.code)).toContain("fixture-structured-boundary");
  });

  it("keeps scientificPayloadWriteback permanently false during structured replay", () => {
    const evidence = structuredEvidence({ scientificPayloadWriteback: true as never });
    const issues = validateStructuredEvidenceV620(record({ state: "structured" }), evidence);
    expect(issues.map((entry) => entry.code)).toContain("structured-writeback-opened");
  });

  it("rejects fixture replay promotion to a captured scientific response", () => {
    const fixture = attempt({
      timeout: false,
      httpStatus: 200,
      contentType: "text/html",
      finalUrl: requestUrl,
      errorClass: null,
      transport: "fixture-replay",
      responseCaptured: true,
      responseBytes: 1,
      rawPageSha256: "b".repeat(64),
      rawResponse: "x",
      requestFingerprint: "f".repeat(64),
    });
    const result = replayRawCaptureRecordV620(record({ attempts: [fixture], state: "raw-only", responseCaptured: true }));
    expect(result.responseCaptured).toBe(false);
    expect(result.state).toBe("blocked");
    expect(result.issues.map((entry) => entry.code)).toContain("fixture-response-not-live");
  });

  it("rejects forged status, hash, redirect and fingerprint metadata", () => {
    const bad = attempt({
      timeout: false,
      httpStatus: 503,
      contentType: "image/png",
      finalUrl: "https://example.com/redirect",
      redirectChain: [{ status: 302, from: requestUrl, to: "https://example.com/redirect" }],
      errorClass: null,
      responseCaptured: true,
      responseBytes: 0,
      rawPageSha256: "nope",
      rawResponse: "forged",
      requestFingerprint: "forged-fingerprint",
    });
    const result = replayRawCaptureRecordV620(record({ attempts: [bad], state: "captured", responseCaptured: true }));
    const codes = result.issues.map((entry) => entry.code);
    expect(codes).toEqual(expect.arrayContaining(["captured-http-status-invalid", "captured-content-type-invalid", "final-url-unsafe", "redirect-url-unsafe", "captured-byte-count-invalid", "captured-hash-invalid", "request-fingerprint-invalid"]));
    expect(result.responseCaptured).toBe(false);
  });

  it("rejects lookalike SIMBAD hosts", () => {
    const forged = attempt({ requestUrl: "https://simbad.cds.unistra.fr.evil.test/query", requestFingerprint: "GET https://simbad.cds.unistra.fr.evil.test/query transport=https-html" });
    expect(validateRawReplayAttemptV620(forged, requestUrl).map((entry) => entry.code)).toContain("request-url-mismatch");
  });

  it("rejects an opened admission boundary even when attempts are empty", () => {
    const opened = record({ runtimeAdmission: "admitted" as never, measurementAdmission: "admitted" as never });
    const result = replayRawCaptureRecordV620(opened);
    expect(result.issues.map((entry) => entry.code)).toContain("admission-boundary-opened");
    expect(result.state).toBe("blocked");
  });

  it("requires uncaptured failures to carry no artifact metadata", () => {
    const forged = attempt({ rawArtifactPath: "raw/acrux.html", rawPageSha256: "c".repeat(64) });
    const issues = validateRawReplayAttemptV620(forged, requestUrl);
    expect(issues.map((entry) => entry.code)).toContain("uncaptured-artifact-present");
  });

  it("summarizes a mixed ledger while preserving scientific writeback=false", () => {
    const results = verifyRawReplayLedgerV620([record(), record({ id: "spica", attempts: [], state: "pending" })]);
    expect(rawReplayLedgerSummaryV620(results)).toMatchObject({ total: 2, valid: 2, blocked: 1, captured: 0, scientificPayloadWriteback: false });
  });
});
