import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { MAINLINE_A3_NEBULA_ASSET_CANDIDATES } from "./mainlineAFirstSetNebulaCandidatesV607";
import { MAINLINE_A1_NEBULAE } from "./mainlineAMetadataV607";
import { MAINLINE_A3_NEBULA_VISUAL_ASSETS } from "./mainlineANebulaVisualAssetsV607.generated";

const auditSnapshot = JSON.parse(readFileSync(new URL("../../docs/release/v607/mainline-a-stage-a3-candidate-audit.json", import.meta.url), "utf8")) as {
  candidates: readonly { objectId: string; imageId: string; sourcePage: string; credit: string; bands: readonly string[]; rightsStatus: string; rightsReview: { policyId: string; status: string; fullCreditRequired: boolean; thirdPartyReviewRequired: boolean }; imageManifest: { status: string; imageUrl: string | null; localPath: string | null; byteSize: number | null; sha256: string | null; dimensions: { width: number; height: number } | null; retrievedAt: string | null } }[];
};

describe("Mainline A3 first-set nebula candidates", () => {
  it("retains the six reviewed image identities and full-credit obligations", () => {
    expect(MAINLINE_A3_NEBULA_ASSET_CANDIDATES.map((candidate) => candidate.objectId)).toEqual(["m42", "m1", "m8", "m16", "m20", "m57"]);
    expect(MAINLINE_A3_NEBULA_ASSET_CANDIDATES.every((candidate) => candidate.rightsStatus === "cleared")).toBe(true);
    expect(MAINLINE_A3_NEBULA_ASSET_CANDIDATES.every((candidate) => candidate.rightsReview.status === "cleared" && candidate.rightsReview.fullCreditRequired && candidate.rightsReview.thirdPartyReviewRequired && candidate.rightsReview.thirdPartyReviewCompleted)).toBe(true);
    expect(MAINLINE_A3_NEBULA_ASSET_CANDIDATES.every((candidate) => candidate.observationEncoding.nakedEyeRepresentationClaimed === false)).toBe(true);
    expect(MAINLINE_A3_NEBULA_ASSET_CANDIDATES.every((candidate) => candidate.sourcePage.startsWith("https://esahubble.org/images/"))).toBe(true);
  });

  it("binds every delivered JPEG to its candidate and exact local bytes", () => {
    expect(MAINLINE_A3_NEBULA_VISUAL_ASSETS).toHaveLength(6);
    expect(MAINLINE_A3_NEBULA_VISUAL_ASSETS.reduce((sum, asset) => sum + asset.byteSize, 0)).toBe(1_971_256);
    for (const candidate of MAINLINE_A3_NEBULA_ASSET_CANDIDATES) {
      const { imageManifest } = candidate;
      const asset = MAINLINE_A3_NEBULA_VISUAL_ASSETS.find((row) => row.objectId === candidate.objectId);
      expect(asset, candidate.objectId).toBeDefined();
      expect(imageManifest.status).toBe("local-asset-acquired");
      expect(imageManifest.localPath).toBe(`public/textures/mainline-a/${candidate.imageId}.jpg`);
      expect(asset).toMatchObject({ objectId: candidate.objectId, imageId: candidate.imageId, credit: candidate.credit, sourcePage: candidate.sourcePage, license: "CC BY 4.0", rightsStatus: "cleared", imageUrl: imageManifest.imageUrl, localPath: imageManifest.localPath, byteSize: imageManifest.byteSize, sha256: imageManifest.sha256, dimensions: imageManifest.dimensions, retrievedAt: imageManifest.retrievedAt });
      const bytes = readFileSync(new URL(`../../${imageManifest.localPath}`, import.meta.url));
      expect(bytes.byteLength, candidate.objectId).toBe(imageManifest.byteSize);
      expect(createHash("sha256").update(bytes).digest("hex"), candidate.objectId).toBe(imageManifest.sha256);
      expect(imageManifest.dimensions.width).toBeGreaterThan(0);
      expect(imageManifest.dimensions.height).toBeGreaterThan(0);
    }
  });

  it("keeps candidate pages aligned with first-set nebula provenance", () => {
    for (const candidate of MAINLINE_A3_NEBULA_ASSET_CANDIDATES) {
      const metadata = MAINLINE_A1_NEBULAE.find((nebula) => nebula.id === candidate.objectId);
      expect(metadata, candidate.objectId).toBeDefined();
      expect(metadata?.provenance.some((source) => source.sourceUrl === candidate.sourcePage), candidate.objectId).toBe(true);
      expect(metadata?.presentation.rightsStatus, candidate.objectId).toBe("cleared");
      expect(metadata?.presentation.assetStatus, candidate.objectId).toBe("licensed");
      expect(metadata?.provenance[0]?.license, candidate.objectId).toBe("CC BY 4.0");
    }
  });

  it("keeps the review snapshot aligned with the typed candidate register", () => {
    expect(auditSnapshot.candidates).toHaveLength(MAINLINE_A3_NEBULA_ASSET_CANDIDATES.length);
    expect(auditSnapshot.candidates.map(({ objectId, imageId, sourcePage, credit, bands, rightsStatus, rightsReview, imageManifest }) => ({ objectId, imageId, sourcePage, credit, bands, rightsStatus, rightsReview, imageManifest }))).toEqual(MAINLINE_A3_NEBULA_ASSET_CANDIDATES.map(({ objectId, imageId, sourcePage, credit, observationEncoding, rightsStatus, rightsReview, imageManifest }) => ({ objectId, imageId, sourcePage, credit, bands: observationEncoding.bands, rightsStatus, rightsReview, imageManifest })));
  });
});
