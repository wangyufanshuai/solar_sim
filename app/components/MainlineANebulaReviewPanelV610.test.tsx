import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import reviewPack from "../data/mainlineANebulaReviewPackV612.generated.json";
import rightsPack from "../data/mainlineANebulaRightsPackV613.generated.json";
import expansionPack from "../data/mainlineABetaNebulaExpansionV617.generated.json";
import { MAINLINE_A_NEBULA_ATLAS_CANDIDATES } from "../lib/mainlineANebulaAtlasV609";

describe("MainlineANebulaReviewPanelV610 evidence contract", () => {
  it("renders a review row for every projected candidate", () => {
    expect(reviewPack.schema).toBe("mainline-a-nebula-review-pack-v612");
    expect(reviewPack.candidateCount).toBe(18);
    expect(reviewPack.records).toHaveLength(MAINLINE_A_NEBULA_ATLAS_CANDIDATES.length);
    expect(reviewPack.records.map((record) => record.id.replace(/-nebula$/, ""))).toEqual(MAINLINE_A_NEBULA_ATLAS_CANDIDATES.map((record) => record.id));
  });

  it("keeps the visual review state separate from runtime admission", () => {
    expect(reviewPack.records.every((record) => record.runtime.candidateOnly)).toBe(true);
    expect(reviewPack.records.every((record) => record.runtime.visualAssetAdmitted === false)).toBe(true);
    expect(reviewPack.records.every((record) => record.runtime.scienceImagePayloadAllowed === false)).toBe(true);
    expect(reviewPack.runtimeAdmissionCount).toBe(0);
  });

  it("shows three explicit blockers for every NASA candidate", () => {
    for (const record of reviewPack.records) {
      expect(record.state).toBe("rights-review");
      expect(record.blockers).toEqual([
        "rights-policy-review",
        "visual-crop-signoff",
        "runtime-admission",
      ]);
      expect(record.localEvidence.status).toBe("verified");
      expect(record.runtime.candidateOnly).toBe(true);
    }
  });

  it("preserves source evidence identity and dimensions", () => {
    for (const record of reviewPack.records) {
      expect(record.source.url).toMatch(/^https:\/\//);
      expect(record.source.localPath).toMatch(/^source-cache\//);
      expect(record.source.sha256).toMatch(/^[a-f0-9]{64}$/);
      expect(record.source.bytes).toBeGreaterThan(0);
      expect(record.source.width).toBeGreaterThanOrEqual(256);
      expect(record.source.height).toBeGreaterThanOrEqual(256);
      expect(record.provenance.manifestSha256).toMatch(/^[a-f0-9]{64}$/);
      expect(record.provenance.projectionSha256).toMatch(/^[a-f0-9]{64}$/);
    }
  });

  it("exposes deterministic state counts for the UI summary", () => {
    expect(reviewPack.states).toEqual(["source-verified", "rights-review", "visual-review", "admission-ready"]);
    expect(reviewPack.counts).toEqual({ "rights-review": 18, "visual-review": 0, "admission-ready": 0, "runtime-admitted": 0 });
  });

  it("keeps a one-to-one V613 rights evidence record for every candidate", () => {
    expect(rightsPack.schema).toBe("mainline-a-nebula-rights-pack-v613");
    expect(rightsPack.candidateCount).toBe(18);
    expect(rightsPack.records).toHaveLength(reviewPack.records.length);
    expect(rightsPack.records.map((record) => record.candidateId)).toEqual(reviewPack.records.map((record) => record.id));
    expect(rightsPack.records.every((record) => record.evidence.status === "pending" && record.evidence.decision === "unreviewed")).toBe(true);
    expect(rightsPack.records.every((record) => record.runtime.candidateOnly && !record.runtime.visualAssetAdmitted)).toBe(true);
    expect(rightsPack.records.every((record) => record.receiptLinkage.valid)).toBe(true);
  });

  it("preserves the NASA policy URL and explicit pending boundary", () => {
    for (const record of rightsPack.records) {
      expect(record.evidence.sourceLicenseUrl).toBe("https://www.nasa.gov/nasa-brand-center/images-and-media/");
      expect(record.evidence.rightsPage).toBeNull();
      expect(record.evidence.policyPage).toBeNull();
      expect(record.evidence.evidenceSha256).toBeNull();
      expect(record.evidence.creditConfirmed).toBe(false);
    }
    expect(rightsPack.rightsDecisionCounts).toEqual({ unreviewed: 18, cleared: 0, rejected: 0 });
    expect(rightsPack.runtimeAdmissionCount).toBe(0);
    expect(rightsPack.receiptLinkage).toMatchObject({ validCandidates: 18, missing: 0, status: "linked-but-not-a-rights-grant" });
  });

  it("exposes the six-record V617 expansion without pretending 24 images are admitted", () => {
    expect(expansionPack.schema).toBe("mainline-a-beta-nebula-expansion-v617");
    expect(expansionPack.counts).toMatchObject({ baseCandidates: 18, expansionCandidates: 6, candidateTotal: 24, localPayloadPresent: 1, payloadAcquisitionPending: 5, runtimeAdmitted: 0 });
    expect(expansionPack.records.map((record) => record.candidateId)).toEqual(["ring-nebula", "dumbbell-nebula", "california-nebula", "bubble-nebula", "cats-eye-nebula", "omega-nebula"]);
    expect(expansionPack.records.every((record) => record.runtime.candidateOnly && !record.runtime.visualAssetAdmitted && !record.runtime.scienceImagePayloadAllowed)).toBe(true);
  });

  it("exposes six expansion source, license, payload and artifact states for browser review", () => {
    const source = readFileSync("app/components/MainlineANebulaReviewPanelV610.tsx", "utf8");
    expect(source).toContain("data-mainline-a-nebula-expansion-state");
    expect(source).toContain("data-mainline-a-nebula-expansion-payload");
    expect(source).toContain("data-mainline-a-nebula-expansion-rights");
    expect(source).toContain("betaNebulaExpansionMetadataStateLabelV617");
    expect(source).toContain("betaNebulaExpansionReceiptLabelV617");
    expect(expansionPack.records).toHaveLength(6);
    expect(expansionPack.records.filter((record) => record.payload.state === "local-payload-present")).toHaveLength(expansionPack.counts.localPayloadPresent);
    expect(expansionPack.records.filter((record) => record.payload.state === "payload-acquisition-pending")).toHaveLength(expansionPack.counts.payloadAcquisitionPending);
    expect(expansionPack.records.every((record) => record.source.licenseUrl.startsWith("https://") && record.source.declaredLicenseState)).toBe(true);
    expect(expansionPack.records.every((record) => record.blockers.length > 0 && record.nextAction.length > 0)).toBe(true);
    expect(expansionPack.records.every((record) => record.runtime.candidateOnly && !record.runtime.visualAssetAdmitted && !record.runtime.scienceImagePayloadAllowed)).toBe(true);
  });
});
