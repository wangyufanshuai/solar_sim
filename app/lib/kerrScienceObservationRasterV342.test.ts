import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { createKerrScienceObservationRasterAuditV342, parseKerrScienceObservationRasterV342 } from "./kerrScienceObservationRasterV342";

describe("v342 sparse observation raster", () => {
  it("keeps a four-by-three scientific grid with explicit error envelope", () => {
    const artifact = JSON.parse(readFileSync(resolve(process.cwd(), "dist/science/kerr-observation-raster-v342/raster.json"), "utf8"));
    const raster = parseKerrScienceObservationRasterV342(artifact.raster);
    expect(artifact.artifactSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(raster.counts).toMatchObject({ rowCount: 4, columnCount: 3, cellCount: 12 });
    expect(raster.scienceCells.every((cell) => cell.lowerAuditEnvelopeWM2Sr <= cell.observedEnergyRadianceWM2Sr && cell.upperAuditEnvelopeWM2Sr >= cell.observedEnergyRadianceWM2Sr)).toBe(true);
    expect(raster.scienceCells.every((cell) => cell.evpaDifferenceDeg < 0.5)).toBe(true);
    expect(raster.authority.denseCampaignStatus).toBe("incomplete-0-of-49");
  });

  it("keeps Science profile invariant and Cinematic copies seeded and distinct", () => {
    const artifact = JSON.parse(readFileSync(resolve(process.cwd(), "dist/science/kerr-observation-raster-v342/raster.json"), "utf8"));
    const audit = createKerrScienceObservationRasterAuditV342(artifact.raster);
    expect(audit.scienceProfileInvariant).toBe(true);
    expect(audit.physicalValuesBeforeAfterIdentical).toBe(true);
    expect(audit.cinematicPhysicalFieldsExcluded).toBe(true);
    expect(new Set(Object.values(audit.cinematicDigests)).size).toBe(3);
  });

  it("fails closed when a partial raster is relabeled as dense", () => {
    const artifact = JSON.parse(readFileSync(resolve(process.cwd(), "dist/science/kerr-observation-raster-v342/raster.json"), "utf8"));
    expect(() => parseKerrScienceObservationRasterV342({ ...artifact.raster, authority: { ...artifact.raster.authority, denseCampaignStatus: "complete-49-of-49" } })).toThrow(/v342-raster-identity/);
  });
});
