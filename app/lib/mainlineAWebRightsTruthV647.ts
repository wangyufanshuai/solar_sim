import canonicalCoverage from "../data/mainlineACanonicalCoverageV622.generated.json";
import {
  MAINLINE_A3_NEBULA_VISUAL_ASSETS_ALL,
  type MainlineANebulaVisualAssetV607All,
} from "../data/mainlineANebulaVisualAssetsV607.all.generated";
import type { CoveragePackV622, CoverageRowV622 } from "./mainlineACanonicalCoverageV622";

export type WebNebulaRightsStateV647 = "pending" | "source-missing" | "mismatch";

export type WebNebulaRightsRowV647 = Readonly<{
  id: string;
  displayName: string;
  sourceId: string;
  sourcePage: string;
  sourceLicenseLabel: string;
  sourceCredit: string | null;
  sourceHash: string;
  localPreviewPath: string | null;
  localPreviewSha256: string | null;
  canonicalRowHash: string;
  canonicalStatus: CoverageRowV622["status"];
  canonicalPendingReasons: readonly string[];
  localPreviewAvailable: boolean;
  rightsState: WebNebulaRightsStateV647;
  releaseAdmission: "candidate-only";
  humanRightsSignoff: "pending";
  scientificPayloadWriteback: false;
  issues: readonly string[];
}>;

export type WebNebulaRightsBookV647 = Readonly<{
  schema: "mainline-a-web-nebula-rights-truth-v647";
  canonicalManifestDigest: string;
  rows: readonly WebNebulaRightsRowV647[];
  counts: Readonly<{
    total: number;
    localPreviewAvailable: number;
    sourceLicenseRecorded: number;
    rightsPending: number;
    rightsApproved: 0;
    releaseAdmitted: 0;
    mismatched: number;
  }>;
  valid: boolean;
  issues: readonly string[];
}>;

const SHA256 = /^[a-f0-9]{64}$/;
const PREVIEW_PATH = /^\/textures\/mainline-a\/[a-z0-9][a-z0-9_-]*\.(?:jpg|jpeg|png|webp|avif)$/i;
const canonicalPack = canonicalCoverage as unknown as CoveragePackV622;

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function sourceIsUsable(row: CoverageRowV622): boolean {
  if (!hasText(row.source.sourceId) || !hasText(row.source.license)) return false;
  if (!SHA256.test(row.sourceHash)) return false;
  try {
    const url = new URL(row.source.sourceUrl);
    return url.protocol === "https:" && !url.username && !url.password;
  } catch {
    return false;
  }
}

function previewPathMatches(asset: MainlineANebulaVisualAssetV607All): boolean {
  return PREVIEW_PATH.test(asset.src)
    && asset.localPath === `public${asset.src}`
    && SHA256.test(asset.sha256)
    && Number.isSafeInteger(asset.byteSize)
    && asset.byteSize > 0
    && Number.isSafeInteger(asset.dimensions.width)
    && asset.dimensions.width > 0
    && Number.isSafeInteger(asset.dimensions.height)
    && asset.dimensions.height > 0;
}

function matchCanonicalSource(row: CoverageRowV622, asset: MainlineANebulaVisualAssetV607All): boolean {
  return row.source.sourceId === asset.imageId
    && row.source.sourceUrl === asset.sourcePage
    && row.source.license === asset.license
    && row.source.credit === asset.credit;
}

function matchCanonicalRoute(row: CoverageRowV622, asset: MainlineANebulaVisualAssetV607All): boolean {
  return row.route.assetId === asset.objectId
    && row.route.assetPath === asset.localPath
    && row.route.assetHash === asset.sha256
    && row.route.route === "mainline-a3-nebula-visual";
}

function canonicalBoundaryHeld(row: CoverageRowV622): boolean {
  return row.candidateOnly === true
    && row.runtimeAdmission === "candidate-only"
    && row.measurementAdmission === "not-admitted"
    && row.scientificPayloadWriteback === false
    && row.status === "rights-pending"
    && row.pendingReasons.includes("rights-pending");
}

export function inspectWebNebulaRightsRowV647(
  row: CoverageRowV622,
  asset: MainlineANebulaVisualAssetV607All | undefined,
): WebNebulaRightsRowV647 {
  const issues: string[] = [];
  if (row.kind !== "nebula") issues.push("canonical-kind-mismatch");
  if (!sourceIsUsable(row)) issues.push("canonical-source-invalid");
  if (!SHA256.test(row.rowHash)) issues.push("canonical-row-hash-invalid");
  if (!canonicalBoundaryHeld(row)) issues.push("canonical-rights-boundary-opened");
  if (!asset) issues.push("local-preview-missing");
  if (asset && !previewPathMatches(asset)) issues.push("local-preview-metadata-invalid");
  if (asset && !matchCanonicalSource(row, asset)) issues.push("source-record-mismatch");
  if (asset && !matchCanonicalRoute(row, asset)) issues.push("route-record-mismatch");
  if (asset && asset.objectId !== row.id) issues.push("object-id-mismatch");
  const localPreviewAvailable = Boolean(asset && previewPathMatches(asset) && matchCanonicalRoute(row, asset));
  const rightsState: WebNebulaRightsStateV647 = issues.length
    ? issues.includes("canonical-source-invalid") ? "source-missing" : "mismatch"
    : "pending";
  return Object.freeze({
    id: row.id,
    displayName: row.displayName,
    sourceId: row.source.sourceId,
    sourcePage: row.source.sourceUrl,
    sourceLicenseLabel: row.source.license,
    sourceCredit: row.source.credit,
    sourceHash: row.sourceHash,
    localPreviewPath: localPreviewAvailable ? asset!.src : null,
    localPreviewSha256: localPreviewAvailable ? asset!.sha256 : null,
    canonicalRowHash: row.rowHash,
    canonicalStatus: row.status,
    canonicalPendingReasons: Object.freeze([...row.pendingReasons]),
    localPreviewAvailable,
    rightsState,
    releaseAdmission: "candidate-only" as const,
    humanRightsSignoff: "pending" as const,
    scientificPayloadWriteback: false as const,
    issues: Object.freeze(issues),
  });
}

export function buildWebNebulaRightsBookV647(
  pack: CoveragePackV622,
  assets: readonly MainlineANebulaVisualAssetV607All[],
): WebNebulaRightsBookV647 {
  const issues: string[] = [];
  if (pack.schema !== "mainline-a-canonical-coverage-v622") issues.push("canonical-schema-invalid");
  if (!SHA256.test(pack.manifestDigest)) issues.push("canonical-digest-invalid");
  const canonicalRows = pack.records.filter((row) => row.kind === "nebula");
  if (canonicalRows.length !== 12 || pack.counts.nebulae !== 12) issues.push("canonical-nebula-count-invalid");
  if (assets.length !== 12) issues.push("preview-asset-count-invalid");
  const rowIds = canonicalRows.map((row) => row.id);
  const assetIds = assets.map((asset) => asset.objectId);
  if (new Set(rowIds).size !== rowIds.length) issues.push("canonical-duplicate-id");
  if (new Set(assetIds).size !== assetIds.length) issues.push("preview-duplicate-id");
  for (const id of assetIds) if (!rowIds.includes(id)) issues.push(`preview-without-canonical:${id}`);
  const rows = canonicalRows.map((row) => inspectWebNebulaRightsRowV647(
    row,
    assets.find((asset) => asset.objectId === row.id),
  ));
  for (const row of rows) for (const issue of row.issues) issues.push(`${row.id}:${issue}`);
  const counts = Object.freeze({
    total: rows.length,
    localPreviewAvailable: rows.filter((row) => row.localPreviewAvailable).length,
    sourceLicenseRecorded: rows.filter((row) => hasText(row.sourceLicenseLabel)).length,
    rightsPending: rows.filter((row) => row.rightsState === "pending").length,
    rightsApproved: 0 as const,
    releaseAdmitted: 0 as const,
    mismatched: rows.filter((row) => row.issues.length > 0).length,
  });
  return Object.freeze({
    schema: "mainline-a-web-nebula-rights-truth-v647",
    canonicalManifestDigest: pack.manifestDigest,
    rows: Object.freeze(rows),
    counts,
    valid: issues.length === 0,
    issues: Object.freeze(issues),
  });
}

export const MAINLINE_A_WEB_NEBULA_RIGHTS_V647 = buildWebNebulaRightsBookV647(
  canonicalPack,
  MAINLINE_A3_NEBULA_VISUAL_ASSETS_ALL,
);

export function webNebulaRightsRowV647(id: string): WebNebulaRightsRowV647 | null {
  return MAINLINE_A_WEB_NEBULA_RIGHTS_V647.rows.find((row) => row.id === id) ?? null;
}
