import { describe, expect, it } from "vitest";
import offlinePack from "../data/mainlineANebulaBatchV628.offline.generated.json";
import {
  nebulaBatchAttemptDurationV628,
  nebulaBatchBoundaryValidV628,
  nebulaBatchFilterMatchV628,
  nebulaBatchGateSummaryV628,
  nebulaBatchIntegrityFindingsV628,
  nebulaBatchIsNotRunV628,
  nebulaBatchSummaryV628,
  nebulaBatchToneV628,
  nebulaBatchVisibleRowsV628,
  normalizeNebulaBatchV628,
} from "./mainlineANebulaBatchV628";

const pack = normalizeNebulaBatchV628(offlinePack);

describe("mainline A V628 batch model", () => {
  it("normalizes the six-candidate offline ledger without opening the boundary", () => {
    expect(pack.rows).toHaveLength(6);
    expect(pack.rows.every((row) => row.network.responseCaptured === 0)).toBe(true);
    expect(pack.rows.every((row) => row.runtimeAdmission === "candidate-only")).toBe(true);
    expect(pack.rows.every((row) => row.measurementAdmission === "not-admitted")).toBe(true);
    expect(pack.rows.every((row) => row.scientificPayloadWriteback === false)).toBe(true);
    expect(nebulaBatchBoundaryValidV628(pack)).toBe(true);
  });

  it("separates offline rows from failed network rows", () => {
    const first = pack.rows[0];
    expect(first).toBeDefined();
    expect(nebulaBatchIsNotRunV628(first!)).toBe(true);
    expect(nebulaBatchToneV628(first!)).toBe("not-run");
    expect(nebulaBatchFilterMatchV628(first!, "not-run")).toBe(true);
    expect(nebulaBatchFilterMatchV628(first!, "failed")).toBe(false);
  });

  it("computes summary and seven gates from rows rather than trusting counters", () => {
    const summary = nebulaBatchSummaryV628(pack);
    expect(summary.total).toBe(6);
    expect(summary.notRun).toBe(6);
    expect(summary.captured).toBe(0);
    expect(summary.rightsPending).toBe(6);
    expect(summary.executed).toBe(0);
    expect(nebulaBatchGateSummaryV628(pack)).toHaveLength(7);
    expect(nebulaBatchGateSummaryV628(pack).find((gate) => gate.id === "raw-artifact")?.status).toBe("hold");
  });

  it("matches query terms across errors, URLs, IDs, and blockers", () => {
    expect(nebulaBatchVisibleRowsV628(pack, "all", "jellyfish")).toHaveLength(1);
    expect(nebulaBatchVisibleRowsV628(pack, "all", "network-not-run")).toHaveLength(6);
    expect(nebulaBatchVisibleRowsV628(pack, "rights", "")).toHaveLength(6);
    expect(nebulaBatchVisibleRowsV628(pack, "captured", "")).toHaveLength(0);
  });

  it("reports no integrity findings for the generated offline ledger", () => {
    expect(nebulaBatchIntegrityFindingsV628(pack)).toEqual([]);
  });

  it("rejects an opened writeback or malformed capture telemetry", () => {
    const opened = normalizeNebulaBatchV628({ ...offlinePack, boundary: { ...offlinePack.boundary, scientificPayloadWriteback: true } });
    expect(nebulaBatchBoundaryValidV628(opened)).toBe(false);
    const malformed = normalizeNebulaBatchV628({ ...offlinePack, rows: [{ ...offlinePack.rows[0], network: { ...offlinePack.rows[0].network, responseCaptured: 1, artifact: null } }, ...offlinePack.rows.slice(1)] });
    expect(nebulaBatchIntegrityFindingsV628(malformed).some((finding) => finding.includes("response captured without artifact"))).toBe(true);
  });

  it("returns null for unfinished timestamps and measures completed attempts", () => {
    const attempt = pack.rows[0].network.attempts[0];
    expect(nebulaBatchAttemptDurationV628(attempt)).toBeGreaterThanOrEqual(0);
    expect(nebulaBatchAttemptDurationV628({ ...attempt, endedAt: null })).toBeNull();
  });
});
