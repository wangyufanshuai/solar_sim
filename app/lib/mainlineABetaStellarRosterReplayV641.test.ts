import { describe, expect, it } from "vitest";
import packJson from "../data/mainlineABetaStellarRosterV641.generated.json";
import { explainRosterRowV641, replayFieldMatrixV641, replayMainlineABetaStellarRosterV641, rosterReplaySummaryV641 } from "./mainlineABetaStellarRosterReplayV641";
import type { MainlineABetaStellarRosterPackV641 } from "./mainlineABetaStellarRosterV641";

const pack = packJson as unknown as MainlineABetaStellarRosterPackV641;

describe("V641 roster replay", () => {
  it("replays all 24 rows while preserving the review queue", () => {
    const replay = replayMainlineABetaStellarRosterV641(pack);
    expect(replay.total).toBe(24);
    expect(replay.runtimeReady).toHaveLength(20);
    expect(replay.reviewQueue).toEqual(expect.arrayContaining(["acrux", "spica", "regulus", "polaris"]));
    expect(replay.writeback).toBe(false);
  });

  it("keeps gate states explicit", () => {
    const summary = rosterReplaySummaryV641(pack);
    expect(summary.runtimeReady).toBe(20);
    expect(summary.pendingIds).toEqual(["acrux", "spica", "regulus", "polaris"]);
    expect(summary.gates).toEqual(expect.arrayContaining(["component:pending:0/24", "rights:pending:0/24", "writeback:closed:24/24"]));
  });

  it("produces a six-field matrix with source coverage for every row", () => {
    const matrix = replayFieldMatrixV641(pack);
    expect(matrix).toHaveLength(24);
    expect(matrix.every((row) => row.fields.length === 6)).toBe(true);
    expect(matrix.find((row) => row.id === "polaris")?.fields).toHaveLength(6);
    expect(matrix.find((row) => row.id === "polaris")?.sourceCoverage).toBe("4/4");
  });

  it("explains why pending candidates cannot be admitted", () => {
    const polaris = pack.records.find((row) => row.id === "polaris")!;
    const reasons = explainRosterRowV641(polaris);
    expect(reasons).toEqual(expect.arrayContaining(["候选行仍处于 hold", "组件身份未解决", "scientificPayloadWriteback=false"]));
  });
});
