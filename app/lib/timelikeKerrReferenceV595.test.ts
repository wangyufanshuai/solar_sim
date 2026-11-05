import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import admissionJson from "../../public/data/post-v593-stellar-relativity/timelike-kerr-reference-v595.json";
import receiptJson from "../../docs/release/post-v593/timelike-kerr-reference-receipt-v595.json";
import {
  TIMELIKE_KERR_REFERENCE_SUMMARY_V595,
  TIMELIKE_KERR_REFERENCE_V595,
} from "./timelikeKerrReferenceV595";

const canonicalize = (value: unknown): unknown => Array.isArray(value)
  ? value.map(canonicalize)
  : value && typeof value === "object"
    ? Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize((value as Record<string, unknown>)[key])]))
    : value;

const canonicalSha256 = (value: unknown) => createHash("sha256")
  .update(JSON.stringify(canonicalize(value)))
  .digest("hex");

describe("v595 timelike Kerr compact admission", () => {
  it("binds the exact external source, summary, fixtures and analytic anchors", () => {
    expect(TIMELIKE_KERR_REFERENCE_SUMMARY_V595).toMatchObject({
      fixtureCount: 4,
      analyticAnchorCount: 3,
      allQualified: true,
      manifestSha256: "0b4d72b0313b6ba5bcdd49a0fdd20dc2e17a137a76902e55d530da08d46c3e63",
      summarySha256: "59b46d0f0a3d18b34c5bb96003215976e75596177855f73ed4dd2f1dd02f6d69",
      sourceSha256: "23e775498e009cd5a458df000e7ae20c3e416dc7065328af4cab922b5c36a06f",
      formalEvidence: false,
      promotion: "none",
    });
    expect(TIMELIKE_KERR_REFERENCE_V595.fixtures.map(({ id }) => id)).toEqual([
      "bound",
      "capture",
      "scatter",
      "escape",
    ]);
    expect(TIMELIKE_KERR_REFERENCE_V595.fixtures.map(({ dynamics }) => dynamics.radialTurningPointCount)).toEqual([2, 0, 1, 0]);
    expect(TIMELIKE_KERR_REFERENCE_V595.fixtures.every(({ invariants, dynamics, gates }) => (
      invariants.computedFromTrajectory
      && dynamics.dynamicThetaSpan > 0
      && dynamics.dynamicPThetaSpan > 0
      && Object.values(gates).every(Boolean)
    ))).toBe(true);
    expect(TIMELIKE_KERR_REFERENCE_V595.analyticAnchors.map(({ id }) => id)).toEqual([
      "schwarzschild-circular-r10",
      "kerr-prograde-circular-a0.7-r10",
      "kerr-retrograde-circular-a0.7-r10",
    ]);
  });

  it("keeps the reference lane non-authoritative and non-mutating", () => {
    expect(TIMELIKE_KERR_REFERENCE_V595.authority).toEqual({
      defaultWebKernel: "legacy-eih-1pn",
      v2Mode: "shadow-only",
      referenceCandidateEvidence: true,
      formalEvidence: false,
      promotion: "none",
      scientificAuthorityGranted: false,
      measuredAuthorityGranted: false,
      gpuAuthorityGranted: false,
      radiativeTransferAuthorityGranted: false,
      grmhdAuthorityGranted: false,
      productionAuthorityGranted: false,
      webTeachingKernelModified: false,
      scientificPayloadMutationAllowed: false,
    });
  });

  it("verifies compact admission and receipt seals plus output bytes", () => {
    const unsignedAdmission = { ...admissionJson } as Record<string, unknown>;
    delete unsignedAdmission.admissionSha256;
    expect(admissionJson.admissionSha256).toBe(canonicalSha256(unsignedAdmission));

    const unsignedReceipt = { ...receiptJson } as Record<string, unknown>;
    delete unsignedReceipt.receiptSha256;
    expect(receiptJson.receiptSha256).toBe(canonicalSha256(unsignedReceipt));

    const output = readFileSync(new URL("../../public/data/post-v593-stellar-relativity/timelike-kerr-reference-v595.json", import.meta.url));
    expect(output.byteLength).toBe(receiptJson.output.bytes);
    expect(createHash("sha256").update(output).digest("hex")).toBe(receiptJson.output.sha256);
    expect(receiptJson.validation).toEqual(expect.objectContaining({
      manifestCanonicalSeal: true,
      summaryPythonCanonicalSeal: true,
      productFileHashes: true,
      jsonHdf5FitsSemantics: true,
      numericThresholds: true,
      authorityBoundary: true,
      writesPerformedByExternalVerifier: false,
    }));
  });
});
