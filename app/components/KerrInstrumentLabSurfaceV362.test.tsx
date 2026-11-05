import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("v362 Instrument Lab runtime surface", () => {
  it("is profile-gated, deterministic and cannot mutate scientific buffers", () => {
    const source = readFileSync("app/components/KerrInstrumentLabSurfaceV362.tsx", "utf8");
    const workbench = readFileSync("app/components/RelativityResearchWorkbenchV280.tsx", "utf8");
    expect(source).toContain("profile !== ATLAS_VISUAL_PROFILE_CANDIDATE_V362");
    expect(source).toContain("KerrInstrumentLabSurfaceV362");
    expect(source).toContain("tokens.uncertaintyGridOpacity");
    expect(source).toContain("tokens.calibrationAlertOpacity");
    expect(source).toContain("tokens.provenanceStripeOpacity");
    expect(source).toContain("data-atlas-instrument-lab-science-buffer-mutation=\"false\"");
    expect(source).toContain("data-atlas-instrument-lab-cinematic-color-input=\"false\"");
    expect(source).not.toContain("Math.random");
    expect(source).not.toContain("<canvas");
    expect(source).not.toMatch(/redshiftFactor\[|walkerPenroseEvpa\[|classification\[|intensity\[/u);
    expect(workbench).toContain("<KerrInstrumentLabSurfaceV362 />");
  });
});
