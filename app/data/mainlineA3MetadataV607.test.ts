import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { MAINLINE_A3_COVERAGE, MAINLINE_A3_NEBULAE } from "./mainlineAMetadataV607";
import { MAINLINE_A3_NEBULA_VISUAL_ASSETS_ALL } from "./mainlineANebulaVisualAssetsV607.all.generated";
import { MAINLINE_A3_ASSET_COVERAGE_SUMMARY } from "./mainlineAAssetCoverageV607";

describe("Mainline A3 current nebula metadata", () => {
  it("keeps every delivered image as a sourced local preview pending human signoff", () => {
    expect(MAINLINE_A3_NEBULAE).toHaveLength(12);
    expect(MAINLINE_A3_NEBULAE.every((nebula) => nebula.presentation.assetStatus === "manifest-candidate")).toBe(true);
    expect(MAINLINE_A3_NEBULAE.every((nebula) => nebula.presentation.rightsStatus === "pending-human-signoff")).toBe(true);
    expect(MAINLINE_A3_NEBULAE.every((nebula) => nebula.presentation.visualMode === "texture")).toBe(true);
    expect(MAINLINE_A3_NEBULAE.every((nebula) => nebula.presentation.assetId && nebula.provenance[0]?.license === "CC BY 4.0")).toBe(true);
    expect(MAINLINE_A3_NEBULAE.every((nebula) => nebula.observationEncoding?.bands.length)).toBe(true);
    expect(MAINLINE_A3_COVERAGE).toEqual({ constellationCount: 4, nebulaCount: 12, starCount: 6,
      localPreviewCount: 12, humanRightsSignedCount: 0, nebulaTextureRights: "12-preview-0-signed" });
  });
  it("matches every current metadata source and credit to the delivered asset", () => {
    const credits = readFileSync(new URL("../../public/textures/mainline-a/CREDITS.md", import.meta.url), "utf8");
    expect(credits.split("\n").filter((line) => line.startsWith("- ["))).toHaveLength(12);
    for (const asset of MAINLINE_A3_NEBULA_VISUAL_ASSETS_ALL) {
      const nebula = MAINLINE_A3_NEBULAE.find((row) => row.id === asset.objectId)!;
      expect(nebula.presentation.assetId, asset.objectId).toBe(asset.imageId);
      expect(nebula.provenance[0]?.sourceUrl, asset.objectId).toBe(asset.sourcePage);
      expect(nebula.provenance[0]?.credit, asset.objectId).toBe(asset.credit);
      expect(nebula.observationEncoding.bands, asset.objectId).toEqual(asset.bands);
      expect(credits).toContain(`- [${asset.imageId}](${asset.sourcePage}) — ${asset.credit}`);
    }
    expect(MAINLINE_A3_ASSET_COVERAGE_SUMMARY).toEqual({ total: 12, licensed: 0, catalogMarkers: 0,
      manifestCandidates: 12, localPreviewAvailable: 12, humanRightsSigned: 0 });
    expect(MAINLINE_A3_NEBULAE.find((row) => row.id === "m1")?.provenance.some((source) => source.sourceId === "nasa-messier-1-distance")).toBe(true);
  });
});
