import {
  MAINLINE_A3_NEBULA_VISUAL_ASSETS_ALL,
  type MainlineANebulaVisualAssetV607All,
} from "../data/mainlineANebulaVisualAssetsV607.all.generated";
import {
  MAINLINE_A_WEB_NEBULA_RIGHTS_V647,
  type WebNebulaRightsRowV647,
} from "./mainlineAWebRightsTruthV647";

export type MainlineAWebNebulaPreviewV648 = Readonly<{
  id: string;
  imageId: string;
  localPath: string | null;
  localSha256: string | null;
  sourcePage: string | null;
  sourceLicenseLabel: string | null;
  sourceCredit: string | null;
  canonicalRowHash: string | null;
  available: boolean;
  displayAdmission: "candidate-preview" | "marker-only";
  humanRightsSignoff: "pending";
  releaseAdmission: "candidate-only";
  scientificPayloadWriteback: false;
  legacyAssetRightsLabel: string | null;
  issues: readonly string[];
}>;

export type MainlineAWebNebulaPreviewBookV648 = Readonly<{
  schema: "mainline-a-web-nebula-preview-v648";
  canonicalManifestDigest: string;
  rows: readonly MainlineAWebNebulaPreviewV648[];
  counts: Readonly<{
    total: number;
    available: number;
    markerOnly: number;
    sourceLicenseLabels: number;
    humanRightsSigned: 0;
    releaseAdmitted: 0;
    legacyClearedLabels: number;
  }>;
  valid: boolean;
  issues: readonly string[];
}>;

const SHA256 = /^[a-f0-9]{64}$/;

export function inspectMainlineAWebNebulaPreviewV648(
  asset: MainlineANebulaVisualAssetV607All | undefined,
  review: WebNebulaRightsRowV647 | undefined,
  id: string,
): MainlineAWebNebulaPreviewV648 {
  const issues: string[] = [];
  if (!asset) issues.push("local-asset-missing");
  if (!review) issues.push("canonical-review-missing");
  if (asset && review) {
    if (asset.objectId !== id || review.id !== id) issues.push("object-id-mismatch");
    if (review.issues.length || review.rightsState !== "pending"
      || review.canonicalStatus !== "rights-pending") issues.push("canonical-rights-state-invalid");
    if (!review.localPreviewAvailable || review.localPreviewPath !== asset.src
      || review.localPreviewSha256 !== asset.sha256) issues.push("local-preview-binding-invalid");
    if (review.sourcePage !== asset.sourcePage
      || review.sourceLicenseLabel !== asset.license
      || review.sourceCredit !== asset.credit
      || review.sourceId !== asset.imageId) issues.push("source-binding-invalid");
    if (!SHA256.test(review.canonicalRowHash) || !SHA256.test(asset.sha256)
      || !SHA256.test(review.sourceHash)) issues.push("digest-missing");
    if (review.humanRightsSignoff !== "pending"
      || review.releaseAdmission !== "candidate-only"
      || review.scientificPayloadWriteback !== false) issues.push("admission-boundary-invalid");
  }
  const available = issues.length === 0;
  return Object.freeze({
    id, imageId: asset?.imageId ?? "",
    localPath: available ? asset!.src : null,
    localSha256: available ? asset!.sha256 : null,
    sourcePage: review?.sourcePage ?? null,
    sourceLicenseLabel: review?.sourceLicenseLabel ?? null,
    sourceCredit: review?.sourceCredit ?? null,
    canonicalRowHash: review?.canonicalRowHash ?? null,
    available,
    displayAdmission: available ? "candidate-preview" : "marker-only",
    humanRightsSignoff: "pending",
    releaseAdmission: "candidate-only",
    scientificPayloadWriteback: false,
    legacyAssetRightsLabel: asset?.rightsStatus ?? null,
    issues: Object.freeze(issues),
  });
}

export function buildMainlineAWebNebulaPreviewBookV648(
  assets: readonly MainlineANebulaVisualAssetV607All[],
  reviews: readonly WebNebulaRightsRowV647[],
  canonicalManifestDigest: string,
): MainlineAWebNebulaPreviewBookV648 {
  const issues: string[] = [];
  if (!SHA256.test(canonicalManifestDigest)) issues.push("canonical-manifest-digest-invalid");
  if (assets.length !== 12 || reviews.length !== 12) issues.push("coverage-not-twelve");
  const reviewIds = reviews.map((row) => row.id);
  const assetIds = assets.map((row) => row.objectId);
  if (new Set(reviewIds).size !== reviewIds.length) issues.push("duplicate-review-id");
  if (new Set(assetIds).size !== assetIds.length) issues.push("duplicate-asset-id");
  for (const id of assetIds) if (!reviewIds.includes(id)) issues.push(`asset-without-review:${id}`);
  const rows = reviews.map((review) => inspectMainlineAWebNebulaPreviewV648(
    assets.find((asset) => asset.objectId === review.id), review, review.id,
  ));
  for (const row of rows) for (const issue of row.issues) issues.push(`${row.id}:${issue}`);
  const counts = Object.freeze({
    total: rows.length,
    available: rows.filter((row) => row.available).length,
    markerOnly: rows.filter((row) => !row.available).length,
    sourceLicenseLabels: rows.filter((row) => Boolean(row.sourceLicenseLabel)).length,
    humanRightsSigned: 0 as const,
    releaseAdmitted: 0 as const,
    legacyClearedLabels: rows.filter((row) => row.legacyAssetRightsLabel === "cleared").length,
  });
  return Object.freeze({
    schema: "mainline-a-web-nebula-preview-v648",
    canonicalManifestDigest,
    rows: Object.freeze(rows),
    counts,
    valid: issues.length === 0,
    issues: Object.freeze(issues),
  });
}

export const MAINLINE_A_WEB_NEBULA_PREVIEWS_V648 = buildMainlineAWebNebulaPreviewBookV648(
  MAINLINE_A3_NEBULA_VISUAL_ASSETS_ALL,
  MAINLINE_A_WEB_NEBULA_RIGHTS_V647.rows,
  MAINLINE_A_WEB_NEBULA_RIGHTS_V647.canonicalManifestDigest,
);

export function mainlineAWebNebulaPreviewV648(id: string): MainlineAWebNebulaPreviewV648 | null {
  return MAINLINE_A_WEB_NEBULA_PREVIEWS_V648.rows.find((row) => row.id === id) ?? null;
}
