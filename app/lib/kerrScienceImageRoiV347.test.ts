import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { buildAllKerrScienceImageRoisV347, parseKerrScienceImageRoiArtifactV347, serializeKerrScienceImageRoiCsvV347, serializeKerrScienceImageRoiJsonV347, summarizeKerrScienceImageRoiV347 } from "./kerrScienceImageRoiV347";
import { parseKerrScienceImagePixelProbeArtifactV346 } from "./kerrScienceImagePixelProbeV346";

const probe = parseKerrScienceImagePixelProbeArtifactV346(JSON.parse(readFileSync(resolve(process.cwd(), "dist/science/kerr-image-probe-v346/probe.json"), "utf8")));
const artifact = parseKerrScienceImageRoiArtifactV347(JSON.parse(readFileSync(resolve(process.cwd(), "dist/science/kerr-image-roi-v347/roi.json"), "utf8")));
const sha = (value: string) => createHash("sha256").update(value).digest("hex");

describe("v347 deterministic indexed ROI science", () => {
  it("enumerates thirty single-band contiguous ROIs with conservative interval propagation", () => {
    const summaries = buildAllKerrScienceImageRoisV347(probe); expect(summaries).toHaveLength(30); expect(new Set(summaries.map((summary) => summary.roiId)).size).toBe(30); expect(summaries).toEqual(artifact.summaries);
    for (const summary of summaries) { expect(summary.radianceLowerSumWM2Sr).toBeLessThanOrEqual(summary.radianceSumWM2Sr); expect(summary.radianceSumWM2Sr).toBeLessThanOrEqual(summary.radianceUpperSumWM2Sr); expect(summary.uncertaintyCombination).toBe("componentwise-linear-interval-no-independence-assumed"); expect(summary.apertureFlux).toBe("unavailable-no-solid-angle-or-celestial-wcs"); }
    const visible = summarizeKerrScienceImageRoiV347(probe, "visible", 12, 15); expect(visible).toMatchObject({ sampleCount: 4, rayIndices: [12, 13, 14, 15], summation: "neumaier-float64", celestialWcs: "unavailable" });
  });

  it("produces deterministic sanitized JSON and CSV exports", () => {
    const summary = artifact.summaries.find((entry) => entry.roiId === artifact.canonicalExport.roiId); expect(summary).toBeDefined(); const json = serializeKerrScienceImageRoiJsonV347(summary!, probe.artifactSha256); const csv = serializeKerrScienceImageRoiCsvV347(summary!, probe.artifactSha256);
    expect(sha(json)).toBe(artifact.canonicalExport.jsonSha256); expect(new TextEncoder().encode(json)).toHaveLength(artifact.canonicalExport.jsonBytes); expect(sha(csv)).toBe(artifact.canonicalExport.csvSha256); expect(new TextEncoder().encode(csv)).toHaveLength(artifact.canonicalExport.csvBytes); expect(`${json}${csv}`).not.toMatch(/(?:absolutePath|host|pid|rayBuffer)/);
  });
});
