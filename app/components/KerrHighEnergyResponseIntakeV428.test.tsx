import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("v428 response intake runtime surface", () => {
  it("renders after v427 with a zero-submission authority firewall and no Canvas", () => {
    const source = readFileSync("app/components/KerrHighEnergyResponseIntakeV428.tsx", "utf8");
    const observatory = readFileSync("app/components/KerrEvidenceObservatoryV405.tsx", "utf8");
    expect(source).toContain("Response intake firewall");
    expect(source).toContain('data-atlas-v428-measured-submission-count="0"');
    expect(source).toContain('data-atlas-v428-measured-import-attempt-count="0"');
    expect(source).toContain('data-atlas-v428-measured-response-authority="false"');
    expect(source).not.toContain("Math.random(");
    expect(source).not.toContain("<canvas");
    expect(observatory.indexOf("<KerrHighEnergyResponseIntakeV428 />")).toBeGreaterThan(observatory.indexOf("<KerrHighEnergyResponseAcquisitionV427 />"));
  });
});
