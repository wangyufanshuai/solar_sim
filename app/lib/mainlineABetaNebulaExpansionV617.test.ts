import packJson from "../data/mainlineABetaNebulaExpansionV617.generated.json";
import { describe, expect, it } from "vitest";
import {
  betaNebulaExpansionBoundaryLabelV617,
  betaNebulaExpansionAcquisitionLabelV617,
  betaNebulaExpansionAdmissionStatementV617,
  betaNebulaExpansionBlockedIdsV617,
  betaNebulaExpansionBlockerCountV617,
  betaNebulaExpansionCanAdmitV617,
  betaNebulaExpansionCandidateIdsV617,
  betaNebulaExpansionCompletionV617,
  betaNebulaExpansionHasPayloadV617,
  betaNebulaExpansionIsMetadataOnlyV617,
  betaNebulaExpansionMetadataOnlyIdsV617,
  betaNebulaExpansionLocalPayloadBytesV617,
  betaNebulaExpansionAllCreditsPresentV617,
  betaNebulaExpansionAllPolicyUrlsV617,
  betaNebulaExpansionNextActionV617,
  betaNebulaExpansionOpenGateV617,
  betaNebulaExpansionPayloadCountLabelV617,
  betaNebulaExpansionPayloadPathsV617,
  betaNebulaExpansionRecordSummaryV617,
  betaNebulaExpansionReceiptLabelV617,
  betaNebulaExpansionRightsReviewCountV617,
  betaNebulaExpansionRightsLabelV617,
  betaNebulaExpansionRowsV617,
  betaNebulaExpansionSourceSummaryV617,
  betaNebulaExpansionHasUniqueSourcesV617,
  betaNebulaExpansionSummaryV617,
  filterBetaNebulaExpansionV617,
  validateBetaNebulaExpansionPackV617,
  type BetaNebulaExpansionPackV617,
} from "./mainlineABetaNebulaExpansionV617";

const pack = packJson as unknown as BetaNebulaExpansionPackV617;

describe("Mainline A Beta nebula expansion V617", () => {
  it("validates six expansion candidates and the 24 candidate total", () => {
    expect(validateBetaNebulaExpansionPackV617(pack)).toBe(true);
    expect(betaNebulaExpansionRowsV617(pack)).toHaveLength(6);
    expect(betaNebulaExpansionSummaryV617(pack)).toMatchObject({ baseCandidates: 18, expansionCandidates: 6, candidateTotal: 24, runtimeAdmitted: 0 });
    expect(betaNebulaExpansionOpenGateV617(pack)).toBe(true);
    expect(betaNebulaExpansionBoundaryLabelV617(pack)).toContain("24 条候选已登记");
    expect(betaNebulaExpansionCandidateIdsV617(pack)).toEqual(["ring-nebula", "dumbbell-nebula", "california-nebula", "bubble-nebula", "cats-eye-nebula", "omega-nebula"]);
  });

  it("distinguishes California payload from five metadata-only records", () => {
    const california = pack.records.find((record) => record.candidateId === "california-nebula")!;
    const pending = pack.records.filter((record) => betaNebulaExpansionIsMetadataOnlyV617(record));
    expect(betaNebulaExpansionHasPayloadV617(california)).toBe(true);
    expect(pending).toHaveLength(5);
    expect(pending.every((record) => !betaNebulaExpansionHasPayloadV617(record))).toBe(true);
    expect(betaNebulaExpansionPayloadCountLabelV617(pack)).toBe("1/6 payload 已落盘 · 5/6 待采集");
  });

  it("keeps every expansion candidate out of runtime and science payload admission", () => {
    expect(pack.records.every((record) => betaNebulaExpansionCanAdmitV617(record) === false)).toBe(true);
    expect(pack.records.every((record) => record.runtime.candidateOnly && !record.runtime.visualAssetAdmitted && !record.runtime.scienceImagePayloadAllowed)).toBe(true);
    expect(betaNebulaExpansionCompletionV617(pack)).toBe(0);
  });

  it("filters by payload, blocker, and source identity", () => {
    expect(filterBetaNebulaExpansionV617(pack, { payloadState: "local-payload-present" })).toHaveLength(1);
    expect(filterBetaNebulaExpansionV617(pack, { payloadState: "payload-acquisition-pending" })).toHaveLength(5);
    expect(filterBetaNebulaExpansionV617(pack, { blocker: "rights-review-pending" })).toHaveLength(6);
    expect(filterBetaNebulaExpansionV617(pack, { query: "PIA23650" })[0]?.candidateId).toBe("california-nebula");
  });

  it("exposes next actions and source labels", () => {
    const california = pack.records.find((record) => record.candidateId === "california-nebula")!;
    const ring = pack.records.find((record) => record.candidateId === "ring-nebula")!;
    expect(betaNebulaExpansionRecordSummaryV617(california)).toContain("california-nebula");
    expect(betaNebulaExpansionSourceSummaryV617(california)).toContain("PIA23650");
    expect(betaNebulaExpansionRightsLabelV617(california)).toBe("权利待审核");
    expect(betaNebulaExpansionNextActionV617(california)).toContain("权利页");
    expect(betaNebulaExpansionNextActionV617(ring)).toContain("单次 HTTPS");
  });

  it("keeps source, receipt, payload, and rights summaries deterministic", () => {
    const california = pack.records.find((record) => record.candidateId === "california-nebula")!;
    expect(betaNebulaExpansionHasUniqueSourcesV617(pack)).toBe(true);
    expect(betaNebulaExpansionBlockerCountV617(pack)).toBeGreaterThan(0);
    expect(betaNebulaExpansionBlockedIdsV617(pack)).toHaveLength(6);
    expect(betaNebulaExpansionRightsReviewCountV617(pack)).toBe(6);
    expect(betaNebulaExpansionPayloadPathsV617(pack)).toHaveLength(1);
    expect(betaNebulaExpansionReceiptLabelV617(california)).toContain("metadata");
    expect(betaNebulaExpansionAcquisitionLabelV617(california)).toContain("采集资格");
    expect(betaNebulaExpansionAdmissionStatementV617(pack)).toContain("0 条运行时准入");
    expect(betaNebulaExpansionMetadataOnlyIdsV617(pack)).toHaveLength(5);
    expect(betaNebulaExpansionLocalPayloadBytesV617(pack)).toBeGreaterThan(0);
    expect(betaNebulaExpansionAllCreditsPresentV617(pack)).toBe(true);
    expect(betaNebulaExpansionAllPolicyUrlsV617(pack)).toBe(true);
    expect(pack.sourceBoundary.legalDecision).toBe("not-granted");
  });
});
