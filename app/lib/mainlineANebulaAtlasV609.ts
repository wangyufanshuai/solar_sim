import { MAINLINE_A3_NEBULAE } from "../data/mainlineAMetadataV607";
import { MAINLINE_A_BETA_NEBULA_PROJECTION_V609 } from "../data/mainlineABetaNebulaProjectionV609.generated";
import { MAINLINE_A3_NEBULA_VISUAL_ASSETS_ALL } from "../data/mainlineANebulaVisualAssetsV607.all.generated";
import { MAINLINE_A_WEB_NEBULA_RIGHTS_V647, webNebulaRightsRowV647 } from "./mainlineAWebRightsTruthV647";
import {
  nebulaEntryMatchesFilter,
  nebulaEntryMatchesQuery,
  nebulaSourceDimensions,
  normalizeNebulaMeasurement,
  normalizeNebulaKind,
  orderNebulaEntries,
  sameNebulaCatalog,
} from "./mainlineANebulaPresentationV637";

export type NebulaAtlasTier = "current" | "candidate";
export type NebulaAtlasKind = "emission" | "reflection" | "dark" | "planetary" | "supernova-remnant" | "unknown";
export type NebulaAtlasFilter = "all" | NebulaAtlasKind | "rights-cleared" | "rights-review" | "rights-missing" | "license-recorded";
export type NebulaAtlasOrder = "catalog" | "angular-size" | "distance" | "name";

export type CandidateAsset = {
  target: string;
  nasaId: string;
  catalogName: string;
  source: { url: string; localPath: string; path?: string; bytes: number; sha256: string; width: number; height: number; license: string; licenseUrl?: string; credit: string };
};

export type NebulaAtlasEntry = {
  id: string;
  displayName: string;
  catalogName: string;
  kind: NebulaAtlasKind;
  subtitleCn: string;
  tier: NebulaAtlasTier;
  sourceTarget: string | null;
  sourcePage: string | null;
  sourceImagePath: string | null;
  sourceCredit: string | null;
  sourceLicense: string | null;
  sourceLicenseUrl: string | null;
  sourceBytes: number | null;
  sourceDimensions: { width: number; height: number } | null;
  sourceSha256: string | null;
  rights: "cleared" | "review" | "missing";
  runtimeAdmission: "current" | "candidate-only";
  releaseAdmission: "candidate-only" | "approved";
  humanRightsSignoff: "pending" | "signed";
  rightsReviewState: "pending" | "source-missing" | "mismatch";
  canonicalRowHash: string | null;
  rightsIssues: readonly string[];
  scienceAuthority: false;
  catalogMatchedId: string | null;
  galLonDeg: number | null;
  galLatDeg: number | null;
  distancePc: number | null;
  sizeArcmin: number | null;
  color: string;
};

const candidateAssets: readonly CandidateAsset[] = [
  ...(MAINLINE_A_BETA_NEBULA_PROJECTION_V609 as unknown as readonly CandidateAsset[]),
];

function rightsFor(asset: CandidateAsset | undefined): NebulaAtlasEntry["rights"] {
  if (!asset) return "missing";
  // A license label is a review input, never a signed approval for a candidate.
  return "review";
}

function candidateId(asset: CandidateAsset): string {
  return asset.target.replace(/-nebula$/, "").replace(/[^a-z0-9]+/g, "-");
}

function catalogFor(asset: CandidateAsset) {
  const matches = MAINLINE_A3_NEBULAE.filter((entry) => sameNebulaCatalog(entry.catalogName, asset.catalogName));
  return matches.length === 1 ? matches[0] : undefined;
}

export function nebulaAtlasCandidateEntry(asset: CandidateAsset): NebulaAtlasEntry {
  const catalog = catalogFor(asset);
  return {
    id: candidateId(asset), displayName: asset.target.replace(/-/g, " "),
    catalogName: asset.catalogName, kind: normalizeNebulaKind(catalog?.nebulaKind), subtitleCn: catalog?.narrative.titleCn ?? asset.target.replace(/-/g, " "),
    tier: "candidate", sourceTarget: asset.target, sourcePage: asset.source.url, sourceImagePath: asset.source.localPath ?? asset.source.path ?? null,
    sourceCredit: asset.source.credit, sourceLicense: asset.source.license, sourceBytes: asset.source.bytes,
    sourceLicenseUrl: asset.source.licenseUrl ?? null,
    sourceDimensions: nebulaSourceDimensions(asset.source.width, asset.source.height),
    sourceSha256: asset.source.sha256, rights: rightsFor(asset), runtimeAdmission: "candidate-only",
    releaseAdmission: "candidate-only", humanRightsSignoff: "pending", rightsReviewState: "pending",
    canonicalRowHash: null, rightsIssues: Object.freeze([]),
    scienceAuthority: false, catalogMatchedId: catalog?.id ?? null,
    galLonDeg: normalizeNebulaMeasurement(catalog?.science.galLonDeg, "galLonDeg"),
    galLatDeg: normalizeNebulaMeasurement(catalog?.science.galLatDeg, "galLatDeg"),
    distancePc: normalizeNebulaMeasurement(catalog?.science.distancePc, "distancePc"),
    sizeArcmin: normalizeNebulaMeasurement(catalog?.science.angularSizeArcmin, "sizeArcmin"),
    color: catalog?.presentation.palette ?? "#b77aff",
  };
}

function currentEntry(entry: typeof MAINLINE_A3_NEBULAE[number]): NebulaAtlasEntry {
  const asset = MAINLINE_A3_NEBULA_VISUAL_ASSETS_ALL.find((candidate) => candidate.objectId === entry.id && candidate.imageId === entry.presentation.assetId);
  const review = webNebulaRightsRowV647(entry.id);
  const provenance = entry.provenance[0];
  return {
    id: entry.id, displayName: entry.displayName, catalogName: entry.catalogName, kind: normalizeNebulaKind(entry.nebulaKind), subtitleCn: entry.narrative.titleCn,
    tier: "current", sourceTarget: asset?.imageId ?? null,
    sourcePage: asset?.sourcePage ?? provenance?.sourceUrl ?? null,
    sourceImagePath: asset?.src ?? null,
    sourceCredit: asset?.credit ?? provenance?.credit ?? null,
    sourceLicense: asset?.license ?? provenance?.license ?? null,
    sourceLicenseUrl: asset?.licenseUrl ?? null,
    sourceBytes: asset?.byteSize ?? null,
    sourceDimensions: asset ? nebulaSourceDimensions(asset.dimensions.width, asset.dimensions.height) : null,
    sourceSha256: asset?.sha256 ?? null,
    rights: review?.rightsState === "pending" ? "review" : "missing",
    runtimeAdmission: "current", releaseAdmission: "candidate-only", humanRightsSignoff: "pending",
    rightsReviewState: review?.rightsState ?? "mismatch", canonicalRowHash: review?.canonicalRowHash ?? null,
    rightsIssues: review?.issues ?? Object.freeze(["canonical-review-row-missing"]),
    scienceAuthority: false, catalogMatchedId: entry.id,
    galLonDeg: normalizeNebulaMeasurement(entry.science.galLonDeg, "galLonDeg"),
    galLatDeg: normalizeNebulaMeasurement(entry.science.galLatDeg, "galLatDeg"),
    distancePc: normalizeNebulaMeasurement(entry.science.distancePc, "distancePc"),
    sizeArcmin: normalizeNebulaMeasurement(entry.science.angularSizeArcmin, "sizeArcmin"),
    color: entry.presentation.palette ?? "#b77aff",
  };
}

export const MAINLINE_A_NEBULA_ATLAS_ENTRIES: readonly NebulaAtlasEntry[] = Object.freeze([
  ...MAINLINE_A3_NEBULAE.map(currentEntry),
  ...candidateAssets.map(nebulaAtlasCandidateEntry),
]);

export const MAINLINE_A_NEBULA_ATLAS_CURRENT = MAINLINE_A_NEBULA_ATLAS_ENTRIES.filter((entry) => entry.tier === "current");
export const MAINLINE_A_NEBULA_ATLAS_CANDIDATES = MAINLINE_A_NEBULA_ATLAS_ENTRIES.filter((entry) => entry.tier === "candidate");
export const MAINLINE_A_NEBULA_ATLAS_RIGHTS_BOOK = MAINLINE_A_WEB_NEBULA_RIGHTS_V647;

/** Canonical Beta queue IDs are kept separate from legacy NASA target slugs. */
export const MAINLINE_A_BETA_NEBULA_SOURCE_MAP = Object.freeze({
  m17: { sourceTarget: "dragon-lair-nebula", nasaId: "PIA13240" },
  ngc281: { sourceTarget: "pacman-nebula", nasaId: "PIA14731" },
  ngc2024: { sourceTarget: "flame-nebula", nasaId: "PIA15635" },
  ic1848: { sourceTarget: "soul-nebula", nasaId: "PIA13014" },
  ic1805: { sourceTarget: "heart-nebula", nasaId: "PIA13112" },
  rho_oph: { sourceTarget: "rho-ophiuchi-cloud", nasaId: "PIA10182" },
} as const);

export function betaNebulaSourceMapping(id: keyof typeof MAINLINE_A_BETA_NEBULA_SOURCE_MAP) {
  const mapping = MAINLINE_A_BETA_NEBULA_SOURCE_MAP[id];
  const candidate = MAINLINE_A_NEBULA_ATLAS_CANDIDATES.find((entry) => entry.sourceTarget === mapping.sourceTarget);
  return { ...mapping, candidateId: candidate?.id ?? null, candidateRights: candidate?.rights ?? "missing", candidateOnly: candidate?.runtimeAdmission === "candidate-only" };
}

export const NEBULA_ATLAS_FILTERS: readonly { id: NebulaAtlasFilter; label: string }[] = [
  { id: "all", label: "全部" }, { id: "emission", label: "发射" }, { id: "reflection", label: "反射" },
  { id: "dark", label: "暗星云" }, { id: "planetary", label: "行星状" }, { id: "supernova-remnant", label: "超新星遗迹" },
  { id: "unknown", label: "类型待核" }, { id: "license-recorded", label: "A 线许可标记已记录" },
  { id: "rights-cleared", label: "逐项版权已签署" },
  { id: "rights-review", label: "权利待复核" }, { id: "rights-missing", label: "来源缺项" },
];

export function filterNebulaAtlasEntries(entries: readonly NebulaAtlasEntry[], filter: NebulaAtlasFilter, query = ""): NebulaAtlasEntry[] {
  return entries.filter((entry) => nebulaEntryMatchesFilter(entry, filter) && nebulaEntryMatchesQuery(entry, query));
}

export function sortNebulaAtlasEntries(entries: readonly NebulaAtlasEntry[], order: NebulaAtlasOrder): NebulaAtlasEntry[] {
  return orderNebulaEntries(entries, order);
}

export function nebulaAtlasAspect(entry: NebulaAtlasEntry): number {
  const width = entry.sourceDimensions?.width ?? 1;
  const height = entry.sourceDimensions?.height ?? 1;
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return 1;
  return Math.min(2.6, Math.max(0.62, width / height));
}

export function nebulaAtlasSourceLabel(entry: NebulaAtlasEntry): string {
  if (entry.tier === "current" && entry.rights === "review") return "本地展示 · CC BY 4.0 标记 · 权利待复核";
  if (entry.tier === "current") return "本地展示 · 来源或权利记录待核";
  if (entry.rights === "review" || entry.rights === "cleared") {
    return entry.sourceLicense?.toUpperCase().includes("NASA")
      ? "候选 · NASA 使用条款待复核"
      : "候选 · 逐图权利待复核";
  }
  return "候选 · 来源或授权缺失";
}

export function nebulaAtlasSummary(entries: readonly NebulaAtlasEntry[]) {
  return Object.freeze({ total: entries.length, current: entries.filter((entry) => entry.tier === "current").length,
    candidates: entries.filter((entry) => entry.tier === "candidate").length,
    cleared: entries.filter((entry) => entry.releaseAdmission === "approved" && entry.humanRightsSignoff === "signed" && entry.rights === "cleared").length,
    licenseRecorded: entries.filter((entry) => entry.tier === "current" && Boolean(entry.sourceLicense)).length,
    review: entries.filter((entry) => nebulaEntryMatchesFilter(entry, "rights-review")).length, missing: entries.filter((entry) => entry.rights === "missing").length,
    candidateOnly: entries.filter((entry) => entry.releaseAdmission === "candidate-only").length });
}
