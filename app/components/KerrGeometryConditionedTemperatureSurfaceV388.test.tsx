import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("v388 geometry-conditioned temperature surface", () => {
  it("shows the rank-2 replay without promoting absolute temperature authority", () => {
    const source = readFileSync(
      "app/components/KerrGeometryConditionedTemperatureSurfaceV388.tsx",
      "utf8",
    );
    const workbench = readFileSync(
      "app/components/RelativityResearchWorkbenchV280.tsx",
      "utf8",
    );
    expect(source).toContain(
      "/api/atlas/relativity-evidence/v388/conditioned-temperature",
    );
    expect(source).toContain("Geodesic prior key");
    expect(source).toContain('data-atlas-v388-spectral-rank="1"');
    expect(source).toContain('data-atlas-v388-conditioned-rank="2"');
    expect(source).toContain('data-atlas-v388-conditional-replay="true"');
    expect(source).toContain(
      'data-atlas-v388-absolute-temperature-authority="false"',
    );
    expect(source).toContain('data-atlas-v388-rss="false"');
    expect(source).toContain('data-atlas-v388-unknown-as-zero="false"');
    expect(source).toContain('data-atlas-v388-science-payload-mutation="false"');
    expect(source).toContain('data-atlas-v388-cinematic-consumer="false"');
    expect(source).not.toContain("Math.random");
    expect(source).not.toContain("<canvas");
    expect(workbench).toContain(
      "<KerrGeometryConditionedTemperatureSurfaceV388 />",
    );
  });
});
