import { describe, expect, it } from "vitest";
import { nebulaBatchSelectionV624 } from "./mainlineANebulaBatchViewV624";
import { nebulaBatchBoundaryValidV624, nebulaBatchFilterMatchV624, nebulaBatchHasCaptureV624, nebulaBatchQueryMatchV624, nebulaBatchSummaryV624, nebulaBatchVisibleRowsV624, type NebulaBatchPackV624 } from "./mainlineANebulaBatchViewV624";
import batch from "../data/mainlineANebulaBatchV624.generated.json";

const pack = batch as unknown as NebulaBatchPackV624;

describe("R64 nebula batch view model", () => {
  it("keeps the details in the visible search result and clears an empty result", () => {
    const visible = nebulaBatchVisibleRowsV624(pack, "all", "soul-nebula");
    expect(nebulaBatchSelectionV624(visible, "heart-nebula")?.id).toBe("soul-nebula");
    expect(nebulaBatchSelectionV624([], "heart-nebula")).toBeNull();
  });
  it("summarizes real capture and historical evidence separately", () => {
    const summary = nebulaBatchSummaryV624(pack);
    expect(summary.total).toBe(6);
    expect(summary.captured).toBeGreaterThan(0);
    expect(summary.historical).toBe(6);
    expect(summary.rightsPending).toBe(6);
    expect(summary.scienceWriteback).toBe(false);
  });
  it("keeps boundary closed", () => expect(nebulaBatchBoundaryValidV624(pack)).toBe(true));
  it("filters captured and historical rows", () => {
    expect(nebulaBatchVisibleRowsV624(pack, "captured", "").length).toBe(pack.counts.captured);
    expect(nebulaBatchVisibleRowsV624(pack, "historical", "").length).toBe(6);
    expect(nebulaBatchFilterMatchV624(pack.rows[0], "rights")).toBe(true);
  });
  it("matches query over source and blockers", () => {
    expect(nebulaBatchQueryMatchV624(pack.rows[0], pack.rows[0].source.credit)).toBe(true);
    expect(nebulaBatchQueryMatchV624(pack.rows[0], "no-such-nebula")).toBe(false);
  });
  it("requires an artifact-backed successful attempt", () => {
    const captured = pack.rows.find(nebulaBatchHasCaptureV624);
    expect(captured?.network.artifact?.sha256).toHaveLength(64);
    expect(captured?.network.attempts.some((attempt) => attempt.responseCaptured === 1)).toBe(true);
  });
});
