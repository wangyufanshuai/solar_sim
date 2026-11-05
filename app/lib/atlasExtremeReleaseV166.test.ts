import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { createAtlasExtremeReleaseV166Summary } from "./atlasExtremeReleaseV166";

describe("v166 extreme integration release", () => {
  it("connects actual v160-v165 capabilities and remains truthful about QA", () => {
    const summary = createAtlasExtremeReleaseV166Summary();
    expect(summary.assetDeliveryVersion).toContain("v160");
    expect(summary.runtimeArchitectureVersion).toContain("v161");
    expect(summary.stellarMaterialVersion).toContain("v162");
    expect(summary.orbitDirectorVersion).toContain("v163");
    expect(summary.launchVersion).toContain("v164");
    expect(summary.scienceVersion).toContain("v165");
    expect(summary.releaseStatus).toBe("blocked-pending-v166-runtime-qa");
    expect(summary.defaultScientificKernel).toBe("legacy-eih-1pn");
  });

  it("keeps the historical v166 boundary while current docs advance to v167", () => {
    const readme = readFileSync("README.md", "utf8");
    const overview = readFileSync("docs/TECHNICAL_OVERVIEW.md", "utf8");
    expect(readme).toContain("product-rc-verified-science-shadow-retained");
    expect(readme).toContain("不是完整数值相对论程序");
    expect(overview).toContain("v160-v166 Extreme Convergence");
    expect(overview).toContain("v167 Product Release Evidence Closure");
    expect(overview).toContain("legacy-eih-1pn");
  });
});
