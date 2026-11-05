import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { resolveKerrPhotonMetrologyObservatoryIntentV539 } from "./kerrPhotonMetrologyObservatoryIntentV539";
import { canonicalKerrResponseAwarePortableCrateV539, compareKerrResponseAwarePortableCrateHudEncodingsV539, createKerrResponseAwarePortableCrateHudEncodingV539, createKerrResponseAwarePortableCrateSummaryV539, parseKerrResponseAwarePortableCrateArtifactV539 } from "./kerrResponseAwarePortableCrateV539";

const artifact = parseKerrResponseAwarePortableCrateArtifactV539(JSON.parse(readFileSync("dist/science/kerr-response-aware-portable-crate-v539/atlas.json", "utf8")));
describe("v539 portable science crate", () => {
  it("is canonical and content-addresses all nine members", () => { expect(createHash("sha256").update(canonicalKerrResponseAwarePortableCrateV539(artifact)).digest("hex")).toBe(artifact.artifactSha256); expect(artifact.members).toHaveLength(9); expect(new Set(artifact.members.map((member) => member.sha256)).size).toBe(9); expect(artifact.members.reduce((sum, member) => sum + member.bytes, 0)).toBe(artifact.crate.totalUncompressedBytes); });
  it("keeps portable packaging separate from image and production claims", () => { expect(artifact.counts).toMatchObject({ fitsBinaryTableCount: 1, fitsImageHduCount: 0, pixelSampleCount: 0, rasterPixelCount: 0, physicalUncertaintyValueCount: 0, pngImageCount: 0 }); expect(artifact.qualification).toMatchObject({ portableCrateQualified: true, scienceImageQualified: false, physicalUncertaintyQualified: false, productionPackageQualified: false }); });
  it("keeps Science and Cinematic on the identical crate inventory", () => { const summary = createKerrResponseAwarePortableCrateSummaryV539(artifact); expect(compareKerrResponseAwarePortableCrateHudEncodingsV539(createKerrResponseAwarePortableCrateHudEncodingV539(summary, "science"), createKerrResponseAwarePortableCrateHudEncodingV539(summary, "cinematic"))).toMatchObject({ portableCrateStable: true, memberInventoryStable: true, memberCount: 9, imageHduCount: 0, scientificFieldMutation: false }); });
  it("authorizes the 41-detail catalog only after explicit local-shadow intent", () => { expect(resolveKerrPhotonMetrologyObservatoryIntentV539("local-shadow", true)).toMatchObject({ observatoryImportAuthorized: true, detailComponentCatalogSize: 41, concurrentDetailSurfaceBudget: 1 }); expect(resolveKerrPhotonMetrologyObservatoryIntentV539("standalone-full", true)).toMatchObject({ observatoryImportAuthorized: false, concurrentDetailSurfaceBudget: 0 }); expect(resolveKerrPhotonMetrologyObservatoryIntentV539("vercel-lite", true)).toMatchObject({ reason: "lite-boundary" }); });
});
