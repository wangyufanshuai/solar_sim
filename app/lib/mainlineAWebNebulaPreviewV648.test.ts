import { describe, expect, it } from "vitest";
import { MAINLINE_A3_NEBULA_VISUAL_ASSETS_ALL } from "../data/mainlineANebulaVisualAssetsV607.all.generated";
import { MAINLINE_A_WEB_NEBULA_RIGHTS_V647 } from "./mainlineAWebRightsTruthV647";
import {
  MAINLINE_A_WEB_NEBULA_PREVIEWS_V648,
  buildMainlineAWebNebulaPreviewBookV648,
  inspectMainlineAWebNebulaPreviewV648,
  mainlineAWebNebulaPreviewV648,
} from "./mainlineAWebNebulaPreviewV648";

const assets = MAINLINE_A3_NEBULA_VISUAL_ASSETS_ALL;
const rights = MAINLINE_A_WEB_NEBULA_RIGHTS_V647;

describe("Mainline A V648 local nebula previews", () => {
  it("keeps twelve byte-bound local previews separate from zero human signatures", () => {
    const book = MAINLINE_A_WEB_NEBULA_PREVIEWS_V648;
    expect(book.valid).toBe(true);
    expect(book.issues).toEqual([]);
    expect(book.counts).toEqual({ total: 12, available: 12, markerOnly: 0,
      sourceLicenseLabels: 12, humanRightsSigned: 0, releaseAdmitted: 0,
      legacyClearedLabels: 12 });
    expect(book.canonicalManifestDigest).toBe(rights.canonicalManifestDigest);
    expect(book.rows.every((row) => row.available && row.displayAdmission === "candidate-preview"
      && row.humanRightsSignoff === "pending" && row.releaseAdmission === "candidate-only"
      && row.scientificPayloadWriteback === false)).toBe(true);
  });

  it("binds each preview to its canonical route, source, credit and SHA-256", () => {
    for (const asset of assets) {
      const row = mainlineAWebNebulaPreviewV648(asset.objectId)!;
      const canonical = rights.rows.find((item) => item.id === asset.objectId)!;
      expect(row.imageId).toBe(asset.imageId);
      expect(row.localPath).toBe(asset.src);
      expect(row.localSha256).toBe(asset.sha256);
      expect(row.sourcePage).toBe(asset.sourcePage);
      expect(row.sourceLicenseLabel).toBe(asset.license);
      expect(row.sourceCredit).toBe(asset.credit);
      expect(row.canonicalRowHash).toBe(canonical.canonicalRowHash);
      expect(row.legacyAssetRightsLabel).toBe("cleared");
    }
  });

  it("rejects license text as a forged human rights signoff", () => {
    const asset = assets[0];
    const review = rights.rows[0];
    const forged = { ...review, humanRightsSignoff: "signed" } as unknown as typeof review;
    const row = inspectMainlineAWebNebulaPreviewV648(asset, forged, asset.objectId);
    expect(row.available).toBe(false);
    expect(row.displayAdmission).toBe("marker-only");
    expect(row.humanRightsSignoff).toBe("pending");
    expect(row.issues).toContain("admission-boundary-invalid");
  });

  it("rejects swapped images and source credits without losing the pending boundary", () => {
    const asset = assets[0];
    const review = rights.rows[0];
    const cases = [
      { ...asset, sha256: "f".repeat(64) },
      { ...asset, sourcePage: "https://example.org/fixture" },
      { ...asset, credit: "" },
      { ...asset, imageId: "different-image" },
      { ...asset, objectId: "different-object" },
    ];
    for (const changed of cases) {
      const row = inspectMainlineAWebNebulaPreviewV648(changed, review, review.id);
      expect(row.available).toBe(false);
      expect(row.localPath).toBeNull();
      expect(row.localSha256).toBeNull();
      expect(row.releaseAdmission).toBe("candidate-only");
    }
  });

  it("fails closed on missing, duplicated or unknown canonical rows", () => {
    const absent = buildMainlineAWebNebulaPreviewBookV648(assets.slice(1), rights.rows, rights.canonicalManifestDigest);
    expect(absent.valid).toBe(false);
    expect(absent.counts.markerOnly).toBe(1);
    const duplicated = buildMainlineAWebNebulaPreviewBookV648(
      [...assets.slice(1), assets[1]], rights.rows, rights.canonicalManifestDigest,
    );
    expect(duplicated.issues).toContain("duplicate-asset-id");
    const unknown = buildMainlineAWebNebulaPreviewBookV648(
      [...assets.slice(1), { ...assets[0], objectId: "unreviewed" }],
      rights.rows, rights.canonicalManifestDigest,
    );
    expect(unknown.issues).toContain("asset-without-review:unreviewed");
    expect(unknown.counts.humanRightsSigned).toBe(0);
    expect(mainlineAWebNebulaPreviewV648("unreviewed")).toBeNull();
  });
});
