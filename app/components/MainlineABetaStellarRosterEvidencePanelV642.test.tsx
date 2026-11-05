import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync("app/components/MainlineABetaStellarRosterEvidencePanelV642.tsx", "utf8");

describe("V642 evidence panel contract", () => {
  it("exposes build binding, evidence class and report boundary markers", () => {
    expect(source).toContain('data-mainline-a-beta-stellar-evidence="v642"');
    expect(source).toContain("data-mainline-a-beta-stellar-evidence-gates");
    expect(source).toContain("data-mainline-a-beta-stellar-evidence-row");
    expect(source).toContain("data-mainline-a-beta-stellar-evidence-boundary");
  });

  it("renders the limits that keep local observations from becoming external claims", () => {
    expect(source).toContain("不等于真实用户验证、生产性能、科学有效性或版权批准");
    expect(source).toContain("reportable=false");
    expect(source).toContain("scientificPayloadWriteback=false");
  });
});

