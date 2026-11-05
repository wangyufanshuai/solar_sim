import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("v427 response acquisition runtime surface", () => {
  it("renders after v426 with an explicit zero-measurement authority firewall and no Canvas", () => {
    const source = readFileSync("app/components/KerrHighEnergyResponseAcquisitionV427.tsx", "utf8");
    const observatory = readFileSync("app/components/KerrEvidenceObservatoryV405.tsx", "utf8");
    expect(source).toContain("Response acquisition clean room");
    expect(source).toContain('data-atlas-v427-measurement-template-rows="0"');
    expect(source).toContain('data-atlas-v427-measured-response-authority="false"');
    expect(source).toContain('data-atlas-v427-science-response-applications="0"');
    expect(source).toContain("空白采集包");
    expect(source).not.toContain("Math.random(");
    expect(source).not.toContain("<canvas");
    expect(observatory.indexOf("<KerrHighEnergyResponseAcquisitionV427 />")).toBeGreaterThan(observatory.indexOf("<KerrHighEnergyInstrumentResponseV426 />"));
  });
});
