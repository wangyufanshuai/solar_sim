import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { resolveKerrPhotonMetrologyObservatoryIntentV537 } from "./kerrPhotonMetrologyObservatoryIntentV537";
import {
  canonicalKerrResponseAwareSparseFitsV537,
  compareKerrResponseAwareSparseFitsHudEncodingsV537,
  createKerrResponseAwareSparseFitsHudEncodingV537,
  createKerrResponseAwareSparseFitsSummaryV537,
  parseKerrResponseAwareSparseFitsArtifactV537,
} from "./kerrResponseAwareSparseFitsV537";

const artifact = parseKerrResponseAwareSparseFitsArtifactV537(JSON.parse(readFileSync("dist/science/kerr-response-aware-sparse-fits-v537/atlas.json", "utf8")));
describe("v537 sparse FITS table", () => {
  it("matches its canonical artifact SHA", () => {
    expect(createHash("sha256").update(canonicalKerrResponseAwareSparseFitsV537(artifact)).digest("hex")).toBe(artifact.artifactSha256);
  });
  it("qualifies one binary table without claiming an image", () => {
    expect(artifact.fits).toMatchObject({ hduCount: 2, primaryNaxis: 0, imageHduCount: 0, binaryTableHduCount: 1, rowCount: 4, columnCount: 17, checksumValidationPassed: true, abByteIdentical: true });
    expect(artifact.counts).toMatchObject({ pixelSampleCount: 0, rasterPixelCount: 0, fitsImageHduCount: 0, pngImageCount: 0 });
    expect(artifact.qualification).toMatchObject({ fitsBinaryTableQualified: true, scienceImageQualified: false, productionImageQualified: false });
  });
  it("keeps Science and Cinematic on identical immutable table identity", () => {
    const summary = createKerrResponseAwareSparseFitsSummaryV537(artifact);
    expect(compareKerrResponseAwareSparseFitsHudEncodingsV537(createKerrResponseAwareSparseFitsHudEncodingV537(summary, "science"), createKerrResponseAwareSparseFitsHudEncodingV537(summary, "cinematic"))).toMatchObject({ binaryTableStable: true, rowCount: 4, columnCount: 17, imageHduCount: 0, scientificFieldMutation: false });
  });
  it("authorizes the 39-detail catalog only for explicit local-shadow intent", () => {
    expect(resolveKerrPhotonMetrologyObservatoryIntentV537("local-shadow", true)).toMatchObject({ observatoryImportAuthorized: true, detailComponentCatalogSize: 39, concurrentDetailSurfaceBudget: 1 });
    expect(resolveKerrPhotonMetrologyObservatoryIntentV537("standalone-full", true)).toMatchObject({ observatoryImportAuthorized: false, concurrentDetailSurfaceBudget: 0 });
    expect(resolveKerrPhotonMetrologyObservatoryIntentV537("vercel-lite", true)).toMatchObject({ observatoryImportAuthorized: false, reason: "lite-boundary" });
  });
});
