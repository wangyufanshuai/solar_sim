import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("v390 systematics switchyard", () => {
  it("shows the qualified transfer wiring and open physical breakers", () => {
    const source = readFileSync(
      "app/components/KerrTemperatureSystematicsSwitchyardV390.tsx",
      "utf8",
    );
    const workbench = readFileSync(
      "app/components/RelativityResearchWorkbenchV280.tsx",
      "utf8",
    );
    expect(source).toContain(
      "/api/atlas/relativity-evidence/v390/systematics-transfer",
    );
    expect(source).toContain("Systematics switchyard");
    expect(source).toContain("detector covariance");
    expect(source).toContain("non-Planck spectrum");
    expect(source).toContain(
      'data-atlas-v390-transfer-operator-qualified="true"',
    );
    expect(source).toContain(
      'data-atlas-v390-physical-systematic-vector-admitted="false"',
    );
    expect(source).toContain('data-atlas-v390-covariance-projection="false"');
    expect(source).toContain('data-atlas-v390-unknown-systematics-zero="false"');
    expect(source).toContain('data-atlas-v390-rss="false"');
    expect(source).toContain('data-atlas-v390-confidence-interval="false"');
    expect(source).toContain(
      'data-atlas-v390-absolute-temperature-authority="false"',
    );
    expect(source).toContain('data-atlas-v390-science-payload-mutation="false"');
    expect(source).toContain('data-atlas-v390-cinematic-consumer="false"');
    expect(source).not.toContain("Math.random");
    expect(source).not.toContain("<canvas");
    expect(workbench).toContain("<KerrTemperatureSystematicsSwitchyardV390 />");
  });
});
