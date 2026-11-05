import { describe, expect, it } from "vitest";
import { loadKerrInstrumentLabSnapshotV362, resetKerrInstrumentLabServerV362CacheForTests } from "./kerrInstrumentLabServerV362";
import { parseKerrInstrumentLabSnapshotV362 } from "./kerrInstrumentLabV362";

describe("v362 Instrument Lab summary", () => {
  it("sanitizes six source artifacts and preserves the measured-calibration blocker", async () => {
    resetKerrInstrumentLabServerV362CacheForTests();
    const first = await loadKerrInstrumentLabSnapshotV362();
    const second = await loadKerrInstrumentLabSnapshotV362();
    expect(parseKerrInstrumentLabSnapshotV362(first)).toMatchObject({
      stageCount: 6,
      syntheticQualifiedCount: 5,
      measuredQualifiedCount: 0,
      measuredCalibration: { status: "blocked-measured-calibration-input-unavailable", missingRequirementCount: 11, attemptConsumed: false, networkAttempted: false },
      scienceBufferMutationAllowed: false,
      cinematicColorInputAllowed: false,
      denseCampaignStatus: "incomplete-0-of-49",
    });
    expect(first).toBe(second);
    expect(JSON.stringify(first)).not.toMatch(/[A-Z]:\\|processId|generatedAt|absolutePath/i);
  });
});
