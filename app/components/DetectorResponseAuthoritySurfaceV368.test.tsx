import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("v368 detector response surface", () => {
  it("is V9/local-shadow intent gated and never exposes a synthetic measured fallback", () => {
    const source = readFileSync("app/components/DetectorResponseAuthoritySurfaceV368.tsx", "utf8");
    const workbench = readFileSync("app/components/RelativityResearchWorkbenchV280.tsx", "utf8");
    expect(source).toContain("profile !== ATLAS_VISUAL_PROFILE_CANDIDATE_V362");
    expect(source).toContain("data-atlas-v368-synthetic-fallback=\"false\"");
    expect(source).toContain("data-atlas-v368-science-buffer-mutation=\"false\"");
    expect(source).not.toContain("Math.random");
    expect(source).not.toContain("<canvas");
    expect(workbench).toContain("<DetectorResponseAuthoritySurfaceV368 />");
  });
});
