import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("v389 exact interval loom surface", () => {
  it("shows separate numerical/model intervals without authority promotion", () => {
    const source = readFileSync(
      "app/components/KerrConditionalTemperatureIntervalSurfaceV389.tsx",
      "utf8",
    );
    const workbench = readFileSync(
      "app/components/RelativityResearchWorkbenchV280.tsx",
      "utf8",
    );
    expect(source).toContain(
      "/api/atlas/relativity-evidence/v389/temperature-interval",
    );
    expect(source).toContain("Interval loom");
    expect(source).toContain("Numerical");
    expect(source).toContain("Page–Thorne");
    expect(source).toContain(
      'data-atlas-v389-exact-endpoint-propagation="true"',
    );
    expect(source).toContain('data-atlas-v389-confidence-interval="false"');
    expect(source).toContain('data-atlas-v389-probability-content="false"');
    expect(source).toContain(
      'data-atlas-v389-absolute-temperature-authority="false"',
    );
    expect(source).toContain('data-atlas-v389-rss="false"');
    expect(source).toContain('data-atlas-v389-science-payload-mutation="false"');
    expect(source).toContain('data-atlas-v389-cinematic-consumer="false"');
    expect(source).not.toContain("Math.random");
    expect(source).not.toContain("<canvas");
    expect(workbench).toContain(
      "<KerrConditionalTemperatureIntervalSurfaceV389 />",
    );
  });
});
