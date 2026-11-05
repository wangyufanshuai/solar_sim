import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import v624Batch from "../data/mainlineANebulaBatchV624.generated.json";
import v613RightsPack from "../data/mainlineANebulaRightsPackV613.generated.json";
import {
  NEBULA_RIGHTS_CLOSURE_BOUNDARY_V627,
  adaptNebulaV624BatchV627,
  assessNebulaRightsClosureV627,
  buildNebulaRightsClosureV627,
  applyNebulaV613RightsPackV627,
  createNebulaRightsClosureRecordV627,
  nebulaClosureAssessmentV627,
  nebulaClosureBlockerCountsV627,
  nebulaClosureCsvV627,
  nebulaClosureDiffV627,
  nebulaClosureDigestMatchesV627,
  nebulaClosureExportV627,
  nebulaClosureFilterRightsPendingV627,
  nebulaClosureJsonlV627,
  nebulaClosureProgressV627,
  nebulaClosureReplayCsvV627,
  nebulaClosureReplayJsonlV627,
  nebulaClosureSignoffReadyV627,
  nebulaClosureStableV627,
  nebulaClosureSummaryV627,
  nebulaClosureHasOnlyCandidateBoundaryV627,
  nebulaRightsClosureDigestV627,
  nebulaRightsClosureRequestFingerprintV627,
  nebulaClosureStatusLabelV627,
  nebulaClosureBlockerLabelV627,
  parseNebulaRightsClosureV627,
  rightsClosureBoundaryValidV627,
  rightsClosureGateLabelV627,
  rightsClosureNextActionV627,
  replayNebulaRightsClosureV627,
  serializeNebulaRightsClosureV627,
  verifyNebulaArtifactBytesV627,
  type NebulaClosureInputV627,
} from "./mainlineANebulaRightsClosureV627";

const URL = "https://images-assets.nasa.gov/image/PIA13112/PIA13112~orig.jpg";
const BODY = new TextEncoder().encode("verified-r64-nebula");
const BODY_SHA = createHash("sha256").update(BODY).digest("hex");
const ARTIFACT = "docs/release/v607/nebula-image-artifacts/r64/test-nebula.jpg";

function attempt(overrides: Partial<NebulaClosureInputV627["attempts"][number]> = {}): NebulaClosureInputV627["attempts"][number] {
  return {
    attempt: 1,
    startedAt: "2026-09-21T00:00:00.000Z",
    endedAt: "2026-09-21T00:00:01.000Z",
    timeout: false,
    retryCount: 0,
    httpStatus: 200,
    contentType: "image/jpeg",
    requestUrl: URL,
    finalUrl: URL,
    redirectChain: [],
    errorClass: null,
    requestFingerprint: nebulaRightsClosureRequestFingerprintV627(URL),
    responseCaptured: 1,
    responseBytes: BODY.byteLength,
    rawArtifactPath: ARTIFACT,
    rawPageSha256: BODY_SHA,
    ...overrides,
  };
}

function input(overrides: Partial<NebulaClosureInputV627> = {}): NebulaClosureInputV627 {
  return {
    id: "heart-nebula",
    title: "Heart Nebula",
    rank: 1,
    sourceUrl: URL,
    sourcePageUrl: "https://images-assets.nasa.gov/image/PIA13112/",
    sourcePageSha256: "a".repeat(64),
    sourceCredit: "NASA/JPL-Caltech/UCLA",
    declaredLicense: "NASA media guidelines candidate item credit",
    licensePolicyUrl: "https://www.nasa.gov/nasa-brand-center/images-and-media/",
    sourceSha256: BODY_SHA,
    artifact: { path: ARTIFACT, sha256: BODY_SHA, bytes: BODY.byteLength, width: 7252, height: 5142, format: "jpg", synthetic: false, fixture: false },
    attempts: [attempt()],
    rights: { status: "pending", license: null, policyUrl: null, evidencePath: null, evidenceSha256: null, reviewer: null, reviewedAt: null, creditConfirmed: false, signoff: "pending", notes: null },
    visualSignoff: "pending",
    candidateOnly: true,
    runtimeAdmission: "candidate-only",
    measurementAdmission: "not-admitted",
    scientificPayloadWriteback: false,
    runtimeWrites: false,
    measurementWrites: false,
    sourceSchema: "mainline-a-nebula-batch-v624",
    sourcePath: "app/data/mainlineANebulaBatchV624.generated.json",
    ...overrides,
  };
}

describe("R63-R64 nebula rights closure V627", () => {
  it("adapts the real V624 batch without inventing rights evidence", () => {
    const records = adaptNebulaV624BatchV627(v624Batch);
    expect(records).toHaveLength(6);
    expect(records[0].sourceUrl).toMatch(/^https:\/\/images-assets\.nasa\.gov\//);
    expect(records.every((record) => record.candidateOnly)).toBe(true);
    expect(records.every((record) => record.scientificPayloadWriteback === false)).toBe(true);
    expect(records.every((record) => record.rights.status === "pending")).toBe(true);
    expect(records.every((record) => record.rights.signoff === "pending")).toBe(true);
  });

  it("merges only the existing V613 rights ledger and keeps its pending decisions", () => {
    const base = adaptNebulaV624BatchV627(v624Batch);
    const merged = applyNebulaV613RightsPackV627(base, v613RightsPack);
    expect(merged).toHaveLength(6);
    expect(merged.every((record) => record.sourceSha256 === record.artifact.sha256)).toBe(true);
    expect(merged.every((record) => record.rights.status === "pending")).toBe(true);
    expect(merged.every((record) => record.rights.signoff === "pending")).toBe(true);
    const pack = buildNebulaRightsClosureV627(v624Batch, undefined, v613RightsPack);
    expect(pack.records.every((record) => record.payloadIntegrity === "verified")).toBe(true);
    expect(pack.records.every((record) => record.rightsClosure === "pending")).toBe(true);
    expect(pack.records.every((record) => record.scientificPayloadWriteback === false)).toBe(true);
  });

  it("keeps source, artifact, payload, and rights gates separate", () => {
    const record = createNebulaRightsClosureRecordV627(input());
    expect(record.sourceClosure).toBe("pending");
    expect(record.artifactClosure).toBe("verified");
    expect(record.payloadIntegrity).toBe("verified");
    expect(record.rightsClosure).toBe("pending");
    expect(record.status).toBe("source-pending");
    expect(record.blockers).toEqual(expect.arrayContaining(["rights-review-pending", "rights-signoff-pending", "visual-signoff-pending"]));
    expect(record.runtimeAdmission).toBe("candidate-only");
    expect(record.scientificPayloadWriteback).toBe(false);
    expect(nebulaClosureSignoffReadyV627(record)).toBe(false);
  });

  it("requires a real rights receipt before a verified signoff can clear", () => {
    const pending = createNebulaRightsClosureRecordV627(input({ rights: { ...input().rights, status: "verified", signoff: "signed" }, visualSignoff: "signed" }));
    expect(pending.rightsClosure).toBe("pending");
    expect(pending.blockers).toEqual(expect.arrayContaining(["source-evidence-missing", "rights-evidence-missing", "rights-evidence-digest-invalid", "rights-reviewer-invalid", "rights-reviewed-at-missing", "rights-credit-unconfirmed", "rights-evidence-unverified"]));
    const clearedRights = { status: "verified" as const, license: input().declaredLicense, policyUrl: input().licensePolicyUrl, evidencePath: "docs/release/v607/rights/heart.json", evidenceSha256: "b".repeat(64), reviewer: "reviewer-1", reviewedAt: "2026-09-21T01:00:00.000Z", creditConfirmed: true, signoff: "signed" as const, notes: null };
    const ready = createNebulaRightsClosureRecordV627(input({ rights: clearedRights, visualSignoff: "signed" }));
    expect(ready.rightsClosure).toBe("pending");
    expect(ready.status).toBe("source-pending");
    expect(nebulaClosureSignoffReadyV627(ready)).toBe(false);
  });

  it("fails closed for HTTP, source page, fixture, synthetic, and path attacks", () => {
    const bad = createNebulaRightsClosureRecordV627(input({
      sourceUrl: "http://example.invalid/image.jpg",
      sourcePageUrl: "file:///tmp/rights.html",
      artifact: { ...input().artifact, path: "../outside.jpg", synthetic: true, fixture: true },
      attempts: [attempt({ requestUrl: "https://example.invalid/image.jpg", requestFingerprint: "bad", redirectChain: ["https://example.invalid/redirect"] })],
      scientificPayloadWriteback: true,
    }));
    expect(bad.status).toBe("blocked");
    expect(bad.blockers).toEqual(expect.arrayContaining(["source-url-invalid", "artifact-path-invalid", "synthetic-prohibited", "fixture-prohibited", "request-fingerprint-invalid", "unsafe-redirect", "scientific-writeback-open"]));
    expect(rightsClosureBoundaryValidV627([bad])).toBe(false);
    expect(nebulaClosureHasOnlyCandidateBoundaryV627([bad])).toBe(false);
  });

  it("rejects a forged failed capture and malformed telemetry", () => {
    const bad = createNebulaRightsClosureRecordV627(input({
      attempts: [attempt({ responseCaptured: 0, httpStatus: null, contentType: null, finalUrl: null, errorClass: "timeout", rawArtifactPath: ARTIFACT, rawPageSha256: BODY_SHA, responseBytes: BODY.byteLength, timeout: false })],
    }));
    expect(bad.blockers).toEqual(expect.arrayContaining(["network-response-invalid", "network-response-missing"]));
    expect(bad.artifactClosure).not.toBe("verified");
  });

  it("recomputes raw bytes and refuses mismatches", () => {
    const record = createNebulaRightsClosureRecordV627(input());
    expect(verifyNebulaArtifactBytesV627(record, BODY)).toEqual([]);
    expect(verifyNebulaArtifactBytesV627(record, new Uint8Array([1, 2, 3]))).toEqual(["artifact-bytes-mismatch", "artifact-sha256-mismatch"]);
  });

  it("emits deterministic digest, replay rows, CSV, JSONL and summary", () => {
    const records = [createNebulaRightsClosureRecordV627(input()), createNebulaRightsClosureRecordV627(input({ id: "soul-nebula", rank: 2 }))];
    const replay = replayNebulaRightsClosureV627(records, "2026-09-21T02:00:00.000Z");
    expect(replay.rows).toHaveLength(12);
    expect(replay.counts.rightsPending).toBe(2);
    expect(replay.boundary.scientificPayloadWriteback).toBe(false);
    expect(nebulaClosureCsvV627(records)).toContain("rightsClosure");
    expect(nebulaClosureJsonlV627(records)).toContain("heart-nebula");
    expect(nebulaClosureReplayCsvV627(replay)).toContain("phase");
    expect(nebulaClosureReplayJsonlV627(replay)).toContain("rights");
    expect(nebulaClosureSummaryV627(records)).toMatchObject({ total: 2, artifactVerified: 2, payloadVerified: 2, rightsPending: 2, candidateOnly: 2, scientificPayloadWriteback: false });
    expect(nebulaClosureBlockerCountsV627(records)["rights-signoff-pending"]).toBe(2);
    expect(nebulaClosureProgressV627(records)).toBe(0);
    expect(nebulaClosureExportV627(records).replay.rows).toHaveLength(12);
  });

  it("builds a real input pack, preserves boundary, and round-trips its receipt", () => {
    const pack = buildNebulaRightsClosureV627(v624Batch);
    expect(pack.schema).toBe("mainline-a-nebula-rights-closure-v627");
    expect(pack.records).toHaveLength(6);
    expect(pack.records.every((record) => record.rightsClosure === "pending")).toBe(true);
    expect(pack.records.every((record) => record.runtimeAdmission === "candidate-only")).toBe(true);
    expect(rightsClosureBoundaryValidV627(pack)).toBe(true);
    expect(nebulaClosureDigestMatchesV627(pack)).toBe(true);
    const serialized = serializeNebulaRightsClosureV627(pack);
    const parsed = parseNebulaRightsClosureV627(serialized);
    expect(parsed.digest).toBe(pack.digest);
    expect(parsed.records.map((record) => record.id)).toEqual(pack.records.map((record) => record.id));
    expect(nebulaClosureStableV627(pack.records, parsed.records)).toBe(true);
    expect(nebulaClosureFilterRightsPendingV627(parsed.records)).toHaveLength(6);
    expect(rightsClosureGateLabelV627(parsed)).toContain("rights pending");
    expect(rightsClosureNextActionV627(parsed)).toContain("权利");
  });

  it("rejects duplicate IDs, tampered receipts, and open boundaries", () => {
    const one = createNebulaRightsClosureRecordV627(input());
    expect(() => buildNebulaRightsClosureV627({ rows: [input(), input()] })).toThrow(/Duplicate/);
    const pack = buildNebulaRightsClosureV627(v624Batch);
    const tampered = JSON.parse(serializeNebulaRightsClosureV627(pack)) as Record<string, unknown>;
    tampered.digest = "0".repeat(64);
    expect(() => parseNebulaRightsClosureV627(JSON.stringify(tampered))).toThrow(/digest mismatch/);
    expect(() => serializeNebulaRightsClosureV627({ ...pack, boundary: { ...NEBULA_RIGHTS_CLOSURE_BOUNDARY_V627, scientificPayloadWriteback: true } as never })).toThrow(/boundary/);
    expect(nebulaClosureDiffV627([one], [one])).toEqual({ added: [], removed: [], changed: [] });
  });

  it("keeps digest canonical and labels all exposed states", () => {
    const a = nebulaRightsClosureDigestV627({ b: 2, a: 1 });
    const b = nebulaRightsClosureDigestV627({ a: 1, b: 2 });
    expect(a).toBe(b);
    expect(a).toMatch(/^[a-f0-9]{64}$/);
    expect(nebulaClosureStatusLabelV627("rights-signoff-pending")).toContain("签署");
    expect(nebulaClosureBlockerLabelV627("fixture-prohibited")).toContain("fixture");
    expect(nebulaClosureAssessmentV627(createNebulaRightsClosureRecordV627(input())).rightsPending).toBe(true);
  });

  it("does not allow a rights payload to silently change scientific state", () => {
    const state = assessNebulaRightsClosureV627(input());
    expect(state.scientificPayloadWriteback).toBe(false);
    expect(state.runtimeWrites).toBe(false);
    expect(state.measurementWrites).toBe(false);
    expect(state.candidateOnly).toBe(true);
    expect(state.runtimeAdmission).toBe("candidate-only");
  });
});
