import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { integrateKerrPhaseSpace, type KerrConstantsOfMotion, type KerrPhaseSpaceState } from "./kerrPhaseSpaceV2";

const constants: KerrConstantsOfMotion = { kind: "null", spinA: 0.72, energy: 1, axialAngularMomentum: 2.1, carterQ: 5.5 };
const initial: KerrPhaseSpaceState = { lambda: 0, t: 0, r: 14, theta: 1.15, phi: 0, radialDirection: -1, polarDirection: 1 };

describe("v145 Kerr invariant evidence", () => {
  it("continues through non-equatorial turning points and writes a generated report", () => {
    const result = integrateKerrPhaseSpace(initial, constants, { step: 0.001, maxSteps: 20_000, escapeRadiusM: 80 });
    const report = {
      version: "v145-kerr-invariant-evidence-v4",
      generatedAt: new Date().toISOString(),
      maxHamiltonianDrift: result.report.maxHamiltonianDrift,
      maxCarterDrift: result.report.maxCarterDrift,
      turningPointCount: result.turningPoints.length,
      turningPointContinuationPassed: result.turningPoints.length > 0 && result.samples.length > result.turningPoints.length + 10,
      status: result.report.status,
      sampleCount: result.report.sampleCount,
      boundary: result.report.boundary,
    };
    expect(report.maxHamiltonianDrift).toBeLessThan(1e-8);
    expect(report.maxCarterDrift).toBeLessThan(1e-10);
    expect(report.turningPointContinuationPassed).toBe(true);
    const directory = resolve(process.cwd(), "dist/science");
    mkdirSync(directory, { recursive: true });
    writeFileSync(resolve(directory, "kerr-v4-report.json"), JSON.stringify(report, null, 2));
  });
});
