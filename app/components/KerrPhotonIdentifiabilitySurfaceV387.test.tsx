import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("v387 photon identifiability surface", () => {
  it("renders the rank collapse and covariance lock without mutating science", () => {
    const source = readFileSync(
      "app/components/KerrPhotonIdentifiabilitySurfaceV387.tsx",
      "utf8",
    );
    const workbench = readFileSync(
      "app/components/RelativityResearchWorkbenchV280.tsx",
      "utf8",
    );
    expect(source).toContain(
      "/api/atlas/relativity-evidence/v387/photon-identifiability",
    );
    expect(source).toContain("Rank-collapse spectrometer");
    expect(source).toContain('data-atlas-v387-global-rank="1"');
    expect(source).toContain(
      'data-atlas-v387-continuum-breaks-degeneracy="false"',
    );
    expect(source).toContain('data-atlas-v387-covariance-validator="true"');
    expect(source).toContain('data-atlas-v387-covariance-pack="false"');
    expect(source).toContain('data-atlas-v387-uncertainty-projection="false"');
    expect(source).toContain('data-atlas-v387-measured-authority="false"');
    expect(source).toContain('data-atlas-v387-science-payload-mutation="false"');
    expect(source).toContain('data-atlas-v387-cinematic-consumer="false"');
    expect(source).not.toContain("Math.random");
    expect(source).not.toContain("<canvas");
    expect(workbench).toContain("<KerrPhotonIdentifiabilitySurfaceV387 />");
  });
});
