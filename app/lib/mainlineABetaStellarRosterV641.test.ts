import { describe, expect, it } from "vitest";
import packJson from "../data/mainlineABetaStellarRosterV641.generated.json";
import {
  filterMainlineABetaStellarRosterV641,
  rosterFieldV641,
  rosterSummaryV641,
  rosterNegativeMutationV641,
  validateMainlineABetaStellarRosterV641,
  type MainlineABetaStellarRosterPackV641,
} from "./mainlineABetaStellarRosterV641";

const pack = packJson as unknown as MainlineABetaStellarRosterPackV641;

describe("Mainline A Beta stellar roster V641", () => {
  it("keeps the complete 24-row roster separated into 20 existing and four hold candidates", () => {
    expect(validateMainlineABetaStellarRosterV641(pack)).toEqual([]);
    expect(rosterSummaryV641(pack)).toMatchObject({ total: 24, runtimeExisting: 20, candidateHold: 4, componentConfirmed: 0 });
    expect(rosterSummaryV641(pack).pendingIds).toEqual(["acrux", "spica", "regulus", "polaris"]);
  });

  it("retains six field entries for every row and binds each field to an explicit source ref", () => {
    for (const row of pack.records) {
      expect(row.fieldLedger).toHaveLength(6);
      expect(new Set(row.fieldLedger.map((entry) => entry.field)).size).toBe(6);
      expect(row.fieldLedger.every((entry) => entry.sourceRefIds.length > 0)).toBe(true);
      expect(rosterFieldV641(row, "coordinates")).toBeTruthy();
      expect(rosterFieldV641(row, "component")).toBeTruthy();
    }
  });

  it("keeps the four raw-backed rows candidate-only even when catalogue data parsed", () => {
    const pending = pack.records.filter((row) => row.phase === "candidate-hold");
    expect(pending).toHaveLength(4);
    expect(pending.every((row) => row.decision === "hold" && row.componentReview.status === "unresolved")).toBe(true);
    expect(pending.every((row) => row.sourceRefs.some((ref) => ref.role === "raw-artifact" && ref.sha256))).toBe(true);
    expect(pending.every((row) => row.scientificPayloadWriteback === false && row.measurementAdmission === "not-admitted")).toBe(true);
  });

  it("filters by id, field value and source state without changing the pack", () => {
    expect(filterMainlineABetaStellarRosterV641(pack, "polaris").map((row) => row.id)).toEqual(["polaris"]);
    expect(filterMainlineABetaStellarRosterV641(pack, "candidate-hold")).toHaveLength(4);
    expect(filterMainlineABetaStellarRosterV641(pack, "mas/yr")).toHaveLength(24);
    expect(filterMainlineABetaStellarRosterV641(pack, "does-not-exist")).toHaveLength(0);
    expect(pack.records).toHaveLength(24);
  });

  it.each(["duplicate", "admit", "synthetic", "component-confirm"] as const)("rejects %s mutation", (mutation) => {
    expect(validateMainlineABetaStellarRosterV641(rosterNegativeMutationV641(pack, mutation)).length).toBeGreaterThan(0);
  });

  it("does not expose a runtime admission or scientific writeback flag", () => {
    expect(pack.records.some((row) => row.runtimeAdmission !== "candidate-only")).toBe(false);
    expect(pack.records.some((row) => row.measurementAdmission !== "not-admitted")).toBe(false);
    expect(pack.records.some((row) => row.scientificPayloadWriteback)).toBe(false);
    expect(pack.boundary.scientificPayloadWriteback).toBe(false);
  });
});
