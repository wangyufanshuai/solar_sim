import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { resolveKerrPhotonMetrologyObservatoryIntentV538 } from "./kerrPhotonMetrologyObservatoryIntentV538";
import { canonicalKerrResponseAwareFitsColumnSchemaV538, compareKerrResponseAwareFitsColumnSchemaHudEncodingsV538, createKerrResponseAwareFitsColumnSchemaHudEncodingV538, createKerrResponseAwareFitsColumnSchemaSummaryV538, parseKerrResponseAwareFitsColumnSchemaArtifactV538 } from "./kerrResponseAwareFitsColumnSchemaV538";

const artifact = parseKerrResponseAwareFitsColumnSchemaArtifactV538(JSON.parse(readFileSync("dist/science/kerr-response-aware-fits-column-schema-v538/atlas.json", "utf8")));
const digest = (value: unknown) => createHash("sha256").update(canonicalKerrResponseAwareFitsColumnSchemaV538(value)).digest("hex");
describe("v538 FITS column semantics", () => {
  it("is canonical with 17 independently addressed columns", () => { expect(digest(artifact)).toBe(artifact.artifactSha256); expect(artifact.columns).toHaveLength(17); expect(artifact.columns.every((column) => digest(column) === column.columnSha256)).toBe(true); expect(new Set(artifact.columns.map((column) => column.columnSha256)).size).toBe(17); });
  it("separates absence from numeric zero", () => { expect(artifact.invariants).toMatchObject({ continuousCoordinatesArePixelSamples: false, physicalUncertaintyFalseMeansZeroUncertainty: false, pixelFalseMeansZeroValuedPixel: false }); expect(artifact.counts).toMatchObject({ physicalUncertaintyValueCount: 0, pixelSampleCount: 0, rasterPixelCount: 0, fitsImageHduCount: 0 }); expect(artifact.qualification).toMatchObject({ columnSchemaQualified: true, physicalUncertaintyQualified: false, scienceImageQualified: false }); });
  it("keeps Science and Cinematic on identical column semantics", () => { const summary = createKerrResponseAwareFitsColumnSchemaSummaryV538(artifact); expect(compareKerrResponseAwareFitsColumnSchemaHudEncodingsV538(createKerrResponseAwareFitsColumnSchemaHudEncodingV538(summary, "science"), createKerrResponseAwareFitsColumnSchemaHudEncodingV538(summary, "cinematic"))).toMatchObject({ columnSchemaStable: true, qualifiedColumnCount: 17, physicalUncertaintyValueCount: 0, scientificFieldMutation: false }); });
  it("authorizes the 40-detail catalog only after explicit local-shadow intent", () => { expect(resolveKerrPhotonMetrologyObservatoryIntentV538("local-shadow", true)).toMatchObject({ observatoryImportAuthorized: true, detailComponentCatalogSize: 40, concurrentDetailSurfaceBudget: 1 }); expect(resolveKerrPhotonMetrologyObservatoryIntentV538("standalone-full", true)).toMatchObject({ observatoryImportAuthorized: false, concurrentDetailSurfaceBudget: 0 }); expect(resolveKerrPhotonMetrologyObservatoryIntentV538("vercel-lite", true)).toMatchObject({ reason: "lite-boundary" }); });
});
