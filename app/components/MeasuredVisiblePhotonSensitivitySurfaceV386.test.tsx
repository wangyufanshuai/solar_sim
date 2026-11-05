import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("v386 visible photon sensitivity surface", () => {
  it("renders a V11 spectral response bus without projecting missing covariance", () => {
    const source = readFileSync(
      "app/components/MeasuredVisiblePhotonSensitivitySurfaceV386.tsx",
      "utf8",
    );
    const workbench = readFileSync(
      "app/components/RelativityResearchWorkbenchV280.tsx",
      "utf8",
    );
    expect(source).toContain(
      "/api/atlas/relativity-evidence/v386/visible-photon-sensitivity",
    );
    expect(source).toContain("Spectral breaker bus");
    expect(source).toContain('data-atlas-v386-sensitivity-qualified="true"');
    expect(source).toContain('data-atlas-v386-source-rank="1"');
    expect(source).toContain('data-atlas-v386-covariance-available="false"');
    expect(source).toContain('data-atlas-v386-uncertainty-projection="false"');
    expect(source).toContain('data-atlas-v386-unknown-as-zero="false"');
    expect(source).toContain('data-atlas-v386-science-payload-mutation="false"');
    expect(source).toContain('data-atlas-v386-cinematic-consumer="false"');
    expect(source).not.toContain("Math.random");
    expect(source).not.toContain("<canvas");
    expect(workbench).toContain(
      "<MeasuredVisiblePhotonSensitivitySurfaceV386 />",
    );
  });
});
