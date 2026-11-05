import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("v391 curvature relay", () => {
  it("shows trust radii without promoting the stress grid", () => {
    const source = readFileSync(
      "app/components/KerrTemperatureCurvatureRelayV391.tsx",
      "utf8",
    );
    const workbench = readFileSync(
      "app/components/RelativityResearchWorkbenchV280.tsx",
      "utf8",
    );
    expect(source).toContain(
      "/api/atlas/relativity-evidence/v391/trust-region",
    );
    expect(source).toContain("Curvature relay");
    expect(source).toContain('data-atlas-v391-analytic-curvature="true"');
    expect(source).toContain('data-atlas-v391-linear-trust-qualified="true"');
    expect(source).toContain(
      'data-atlas-v391-quadratic-trust-qualified="true"',
    );
    expect(source).toContain(
      'data-atlas-v391-stress-grid-physical-uncertainty="false"',
    );
    expect(source).toContain('data-atlas-v391-probability-content="false"');
    expect(source).toContain(
      'data-atlas-v391-physical-systematic-vector-admitted="false"',
    );
    expect(source).toContain('data-atlas-v391-covariance-projection="false"');
    expect(source).toContain(
      'data-atlas-v391-absolute-temperature-authority="false"',
    );
    expect(source).toContain('data-atlas-v391-science-payload-mutation="false"');
    expect(source).toContain('data-atlas-v391-cinematic-consumer="false"');
    expect(source).not.toContain("Math.random");
    expect(source).not.toContain("<canvas");
    expect(workbench).toContain("<KerrTemperatureCurvatureRelayV391 />");
  });
});
