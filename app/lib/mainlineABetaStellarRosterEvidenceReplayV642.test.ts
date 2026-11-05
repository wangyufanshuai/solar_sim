import { describe, expect, it } from "vitest";
import packJson from "../data/mainlineABetaStellarRosterEvidenceV642.generated.json";
import {
  allRequiredObservedV642,
  classProgressV642,
  deriveEvidenceGatesV642,
  evidenceReplaySummaryV642,
  hasUnsafeClaimV642,
  pendingEvidenceRecordsV642,
  replayMainlineABetaStellarRosterEvidenceV642,
  reportBoundaryV642,
} from "./mainlineABetaStellarRosterEvidenceReplayV642";
import type { MainlineABetaStellarEvidencePackV642 } from "./mainlineABetaStellarRosterEvidenceV642";

const pack = packJson as unknown as MainlineABetaStellarEvidencePackV642;

describe("V642 evidence replay", () => {
  it("keeps every required gate open or held in the plan-only pack", () => {
    const replay = replayMainlineABetaStellarRosterEvidenceV642(pack);
    expect(replay.total).toBe(11);
    expect(replay.required).toBe(10);
    expect(replay.observed).toBe(0);
    expect(replay.buildBound).toBe(false);
    expect(replay.candidateBoundaryClosed).toBe(true);
    expect(replay.reportable).toBe(false);
    expect(replay.openGateIds).toEqual(["static", "http", "visual", "browser", "performance", "external-source"]);
  });

  it("explains the static, browser and external blockers independently", () => {
    const gates = deriveEvidenceGatesV642(pack);
    expect(gates.find((gate) => gate.evidenceClass === "static")?.status).toBe("open");
    expect(gates.find((gate) => gate.evidenceClass === "browser")?.blockers).toContain("planned-observation-present");
    expect(gates.find((gate) => gate.evidenceClass === "external-source")?.status).toBe("held");
    expect(gates.find((gate) => gate.evidenceClass === "external-source")?.blockers).toContain("external-source-review-required");
  });

  it("does not call blocked or not-run records successful", () => {
    expect(allRequiredObservedV642(pack)).toBe(false);
    expect(hasUnsafeClaimV642(pack)).toBe(false);
    expect(pendingEvidenceRecordsV642(pack)).toHaveLength(11);
    expect(classProgressV642(pack, "http")).toMatchObject({ observed: 0, required: 3, status: "open" });
    expect(reportBoundaryV642(pack)).toContain("scientificPayloadWriteback=false");
    expect(evidenceReplaySummaryV642(pack).reportable).toBe(false);
  });
});
