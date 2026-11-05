import { NEBULA_CLOSURE_VISUAL_ASSETS_V592 } from "./nebulaClosureVisualAssetsV592.generated";
import { NEBULA_EXTENDED_VISUAL_ASSETS_V592 } from "./nebulaExtendedVisualAssetsV592.generated";
import { NEBULA_VISUAL_ASSETS_V592 } from "./nebulaVisualAssetsV592.generated";
import { MAINLINE_A3_NEBULA_ASSET_CANDIDATES } from "./mainlineAFirstSetNebulaCandidatesV607";
import { MAINLINE_A1_NEBULAE } from "./mainlineAMetadataV607";
import { getMainlineANebulaVisualAssetV607 } from "./mainlineANebulaVisualAssetsV607.generated";
import { MAINLINE_A3_NEBULA_VISUAL_ASSETS_ALL } from "./mainlineANebulaVisualAssetsV607.all.generated";
import { MAINLINE_A_WEB_NEBULA_PREVIEWS_V648, mainlineAWebNebulaPreviewV648 } from "../lib/mainlineAWebNebulaPreviewV648";

type ManifestRow = { target?: string; catalogName?: string; source?: { license?: string; credit?: string } };
const manifestRows = [
  ...NEBULA_VISUAL_ASSETS_V592,
  ...NEBULA_EXTENDED_VISUAL_ASSETS_V592,
  ...NEBULA_CLOSURE_VISUAL_ASSETS_V592,
] as readonly ManifestRow[];

// The historical A1 classifier retains its old source-license labels. Current
// A3 coverage below uses the canonical V648 candidate preview and pending signoff.
export const isMainlineAExplicitlyClearedLicenseV607 = (license: string | undefined): boolean =>
  Boolean(license && /^(CC0|CC BY(?:-SA)?(?: 4\.0)?|public-domain)$/i.test(license.trim()));

export type MainlineAAssetCoverageV607 = {
  objectId: string;
  catalogName: string;
  status: "catalog-marker" | "manifest-candidate" | "licensed";
  manifestTarget?: string;
  license?: string;
  credit?: string;
};

export const MAINLINE_A1_NEBULA_ASSET_COVERAGE: readonly MainlineAAssetCoverageV607[] = Object.freeze(
  MAINLINE_A1_NEBULAE.map((nebula) => {
    const manifest = manifestRows.find((candidate) => candidate.catalogName === nebula.catalogName);
    const sourceCandidate = MAINLINE_A3_NEBULA_ASSET_CANDIDATES.find((candidate) => candidate.objectId === nebula.id);
    const delivered = getMainlineANebulaVisualAssetV607(nebula.id);
    return {
      objectId: nebula.id,
      catalogName: nebula.catalogName,
      status: delivered?.rightsStatus === "cleared" || (manifest && isMainlineAExplicitlyClearedLicenseV607(manifest.source?.license))
        ? ("licensed" as const)
        : manifest || sourceCandidate ? ("manifest-candidate" as const) : ("catalog-marker" as const),
      ...(delivered?.localPath ? { manifestTarget: delivered.localPath } : manifest?.target ? { manifestTarget: manifest.target } : {}),
      ...(delivered?.license ? { license: delivered.license } : manifest?.source?.license ? { license: manifest.source.license } : sourceCandidate ? { license: sourceCandidate.rightsStatus } : {}),
      ...(delivered?.credit ? { credit: delivered.credit } : manifest?.source?.credit ? { credit: manifest.source.credit } : sourceCandidate ? { credit: sourceCandidate.credit } : {}),
    };
  }),
);

export const MAINLINE_A1_ASSET_COVERAGE_SUMMARY = Object.freeze({
  total: MAINLINE_A1_NEBULA_ASSET_COVERAGE.length,
  catalogMarkers: MAINLINE_A1_NEBULA_ASSET_COVERAGE.filter((row) => row.status === "catalog-marker").length,
  manifestCandidates: MAINLINE_A1_NEBULA_ASSET_COVERAGE.filter((row) => row.status === "manifest-candidate").length,
  licensed: MAINLINE_A1_NEBULA_ASSET_COVERAGE.filter((row) => row.status === "licensed").length,
  manifestInventory: manifestRows.length,
});

/** Current A3 local preview coverage, separate from the historical A1 license labels. */
export const MAINLINE_A3_NEBULA_ASSET_COVERAGE: readonly MainlineAAssetCoverageV607[] = Object.freeze(
  MAINLINE_A3_NEBULA_VISUAL_ASSETS_ALL.map((asset) => {
    const preview = mainlineAWebNebulaPreviewV648(asset.objectId);
    return {
      objectId: asset.objectId,
      catalogName: MAINLINE_A1_NEBULAE.find((nebula) => nebula.id === asset.objectId)?.catalogName ?? asset.objectId,
      status: MAINLINE_A_WEB_NEBULA_PREVIEWS_V648.valid && preview?.available ? ("manifest-candidate" as const) : ("catalog-marker" as const),
      ...(MAINLINE_A_WEB_NEBULA_PREVIEWS_V648.valid && preview?.available ? { manifestTarget: asset.localPath } : {}),
      license: asset.license,
      credit: asset.credit,
    };
  }),
);

export const MAINLINE_A3_ASSET_COVERAGE_SUMMARY = Object.freeze({
  total: MAINLINE_A3_NEBULA_ASSET_COVERAGE.length,
  licensed: MAINLINE_A3_NEBULA_ASSET_COVERAGE.filter((row) => row.status === "licensed").length,
  catalogMarkers: MAINLINE_A3_NEBULA_ASSET_COVERAGE.filter((row) => row.status === "catalog-marker").length,
  manifestCandidates: MAINLINE_A3_NEBULA_ASSET_COVERAGE.filter((row) => row.status === "manifest-candidate").length,
  localPreviewAvailable: MAINLINE_A_WEB_NEBULA_PREVIEWS_V648.counts.available,
  humanRightsSigned: MAINLINE_A_WEB_NEBULA_PREVIEWS_V648.counts.humanRightsSigned,
});
