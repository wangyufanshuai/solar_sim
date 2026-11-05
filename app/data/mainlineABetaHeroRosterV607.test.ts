import { describe, expect, it } from "vitest";
import { MAINLINE_A_BETA_HERO_COVERAGE, MAINLINE_A_BETA_HERO_ROSTER } from "./mainlineABetaHeroRosterV607";

describe("Mainline A Beta hero roster boundary", () => {
  it("tracks all 24 source heroes without admitting pending evidence", () => {
    expect(MAINLINE_A_BETA_HERO_COVERAGE).toEqual({ sourceCount: 24, runtimeCleared: 20, evidencePending: 4 });
    expect(MAINLINE_A_BETA_HERO_ROSTER.filter((hero) => hero.status === "runtime-cleared").every((hero) => hero.evidenceGate === "A4-current")).toBe(true);
    expect(MAINLINE_A_BETA_HERO_ROSTER.filter((hero) => hero.status === "evidence-pending").every((hero) => hero.evidenceGate === "A4-source-intake")).toBe(true);
  });
});
