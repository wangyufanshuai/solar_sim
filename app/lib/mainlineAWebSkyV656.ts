import { MAINLINE_A_CURRENT_CONSTELLATIONS, MAINLINE_A_CURRENT_STARS } from "../data/mainlineAMetadataV607";
import { MAINLINE_A_CONSTELLATION_FIGURES_V607 } from "../data/mainlineAConstellationFiguresV607";
import { MAINLINE_A_BETA_STELLAR_IDS_V641, MAINLINE_A_BETA_STELLAR_PENDING_IDS_V641 } from "./mainlineABetaStellarRosterV641";
import { STELLAR_HERO_BY_ID_V592 } from "./stellarHeroesV592";
import { selectCelestialCatalogEntry } from "./celestialCatalog";
import { stellarAtlasFocusTarget } from "./mainlineAStellarAtlasV608";

export type WebSkyStarV656 = Readonly<{
  id: string;
  displayName: string;
  phase: "runtime-existing" | "candidate-hold";
  canFocusScene: boolean;
  focusCatalogId: string | null;
  visualState: "existing-parametric-photosphere" | "identity-hold-placeholder";
  componentReview: string;
  componentReason: string | null;
  sourcePageUrl: string;
  sourceClass: string;
  rightsStatus: string;
  sourceSnapshotSha256: string;
  sourceFingerprint: string;
  candidateOnly: true;
  notAdmitted: true;
  scientificPayloadWriteback: false;
}>;

export type WebSkyConstellationV656 = Readonly<{
  code: string;
  displayName: string;
  routeCatalogId: string;
  reviewState: "signoff-pending";
  sourcePageUrl: string;
  sourceCredit: string;
  sourceHash: string;
  coverageRowHash: string;
  candidateOnly: true;
  notAdmitted: true;
  scientificPayloadWriteback: false;
}>;

export type WebSkyAtlasPackV656 = Readonly<{
  schema: "mainline-a-web-sky-atlas-v656";
  evidenceClass: "candidate-web-navigation-only";
  generatedFrom: Readonly<Record<string, Readonly<{
    path: string; bytes: number; sha256: string;
  }>>>;
  counts: Readonly<{
    stars: 24;
    runtimeExisting: 20;
    candidateHold: 4;
    componentConfirmed: 0;
    constellations: 12;
    constellationSignoff: 0;
  }>;
  boundary: Readonly<{
    candidateOnly: true;
    hold: true;
    notAdmitted: true;
    scientificPayloadWriteback: false;
    runtimeMutation: false;
    measurementMutation: false;
    publicReleaseApproved: false;
  }>;
  stars: readonly WebSkyStarV656[];
  constellations: readonly WebSkyConstellationV656[];
}>;

export type WebSkyKindV656 = "stars" | "constellations";
export type WebSkyStarFilterV656 = "all" | "runtime-existing" | "candidate-hold";
export type WebSkyFocusTargetV656 = Readonly<{
  direction: [number, number, number];
  catalogId: string;
}>;

const SHA = /^[a-f0-9]{64}$/;
const HTTPS = /^https:\/\//;
const SOURCE_PATHS: Readonly<Record<string, string>> = {
  roster: "app/data/mainlineABetaStellarRosterV641.generated.json",
  coverage: "app/data/mainlineACanonicalCoverageV622.generated.json",
  heroes: "app/data/stellarHeroesV592.generated.ts",
  figures: "app/data/mainlineAConstellationFiguresV607.ts",
};
const unique = (values: readonly string[]) => new Set(values).size === values.length;
const sameIds = (actual: readonly string[], expected: readonly string[]) =>
  actual.length === expected.length && expected.every((id) => actual.includes(id));

export function inspectWebSkyAtlasV656(pack: WebSkyAtlasPackV656) {
  const issues: string[] = [];
  if (pack?.schema !== "mainline-a-web-sky-atlas-v656"
    || pack.evidenceClass !== "candidate-web-navigation-only"
    || !Array.isArray(pack.stars) || !Array.isArray(pack.constellations)) {
    issues.push("pack-schema-or-rows-invalid");
  }
  if (pack?.boundary?.candidateOnly !== true || pack.boundary.hold !== true
    || pack.boundary.notAdmitted !== true
    || pack.boundary.scientificPayloadWriteback !== false
    || pack.boundary.runtimeMutation !== false
    || pack.boundary.measurementMutation !== false
    || pack.boundary.publicReleaseApproved !== false) {
    issues.push("pack-boundary-promoted");
  }
  const starRows = Array.isArray(pack?.stars) ? pack.stars : [];
  const constellationRows = Array.isArray(pack?.constellations)
    ? pack.constellations : [];
  const runtimeIds = MAINLINE_A_CURRENT_STARS.map((star) => star.id);
  const constellationIds = MAINLINE_A_CURRENT_CONSTELLATIONS.map((row) => row.id);
  const pendingIds = MAINLINE_A_BETA_STELLAR_PENDING_IDS_V641 as readonly string[];
  if (!sameIds(starRows.map((row) => row.id), MAINLINE_A_BETA_STELLAR_IDS_V641)
    || !unique(starRows.map((row) => row.id))
    || !sameIds(starRows.filter((row) => row.phase === "runtime-existing")
      .map((row) => row.id), runtimeIds)
    || !sameIds(starRows.filter((row) => row.phase === "candidate-hold")
      .map((row) => row.id), pendingIds)) {
    issues.push("star-coverage-or-phase-drift");
  }
  for (const row of starRows) {
    const hold = row.phase === "candidate-hold";
    if (!row.displayName || row.displayName !== STELLAR_HERO_BY_ID_V592[row.id as keyof typeof STELLAR_HERO_BY_ID_V592]?.name
      || !HTTPS.test(row.sourcePageUrl)
      || !SHA.test(row.sourceSnapshotSha256)
      || !SHA.test(row.sourceFingerprint)
      || !row.sourceClass || !row.rightsStatus || !row.componentReview
      || row.candidateOnly !== true || row.notAdmitted !== true
      || row.scientificPayloadWriteback !== false
      || row.canFocusScene !== !hold
      || row.focusCatalogId !== (hold ? null : `stellar-hero:${row.id}`)
      || row.visualState !== (hold ? "identity-hold-placeholder"
        : "existing-parametric-photosphere")
      || (hold && (!row.componentReason || row.componentReview === "confirmed"))) {
      issues.push(`star-boundary:${row.id}`);
    }
  }
  if (!sameIds(constellationRows.map((row) => row.code), constellationIds)
    || !unique(constellationRows.map((row) => row.code))) {
    issues.push("constellation-coverage-drift");
  }
  for (const row of constellationRows) {
    const figure = MAINLINE_A_CONSTELLATION_FIGURES_V607[row.code];
    if (!row.displayName || row.routeCatalogId !== `constellation:${row.code}`
      || row.reviewState !== "signoff-pending"
      || !HTTPS.test(row.sourcePageUrl) || !row.sourceCredit
      || !SHA.test(row.sourceHash) || !SHA.test(row.coverageRowHash)
      || row.candidateOnly !== true || row.notAdmitted !== true
      || row.scientificPayloadWriteback !== false || !figure
      || figure.name !== row.displayName
      || !selectCelestialCatalogEntry(row.routeCatalogId)) {
      issues.push(`constellation-route:${row.code}`);
    }
  }
  const counts = {
    stars: starRows.length,
    runtimeExisting: starRows.filter((row) => row.phase === "runtime-existing").length,
    candidateHold: starRows.filter((row) => row.phase === "candidate-hold").length,
    componentConfirmed: starRows.filter((row) => row.componentReview === "confirmed").length,
    constellations: constellationRows.length,
    constellationSignoff: constellationRows.filter((row) =>
      row.reviewState !== "signoff-pending").length,
  };
  if (JSON.stringify(counts) !== JSON.stringify(pack?.counts)
    || counts.stars !== 24 || counts.runtimeExisting !== 20
    || counts.candidateHold !== 4 || counts.componentConfirmed !== 0
    || counts.constellations !== 12 || counts.constellationSignoff !== 0) {
    issues.push("pack-counts-invalid");
  }
  const pins = pack?.generatedFrom;
  const expected = Object.keys(SOURCE_PATHS);
  if (!pins || !sameIds(Object.keys(pins), expected)
    || expected.some((key) => pins[key]?.path !== SOURCE_PATHS[key]
      || !Number.isInteger(pins[key].bytes) || pins[key].bytes < 100
      || !SHA.test(pins[key].sha256))) {
    issues.push("input-pins-invalid");
  }
  return Object.freeze({ ok: issues.length === 0,
    issues: Object.freeze(issues), counts: Object.freeze(counts) });
}

export function filterWebSkyStarsV656(
  rows: readonly WebSkyStarV656[], query: string, filter: WebSkyStarFilterV656,
) {
  const needle = query.trim().toLocaleLowerCase();
  return rows.filter((row) => (filter === "all" || row.phase === filter)
    && (!needle || [row.id, row.displayName, row.phase,
      row.sourceClass, row.componentReview].some((value) =>
      value.toLocaleLowerCase().includes(needle))));
}

export function filterWebSkyConstellationsV656(
  rows: readonly WebSkyConstellationV656[], query: string,
) {
  const needle = query.trim().toLocaleLowerCase();
  return rows.filter((row) => !needle || [row.code,
    row.displayName, MAINLINE_A_CONSTELLATION_FIGURES_V607[row.code]?.nameCn ?? "",
    row.sourceCredit].some((value) => value.toLocaleLowerCase().includes(needle)));
}

function directionV656(raDeg: number, decDeg: number): [number, number, number] | null {
  if (!Number.isFinite(raDeg) || !Number.isFinite(decDeg)
    || raDeg < 0 || raDeg >= 360 || decDeg < -90 || decDeg > 90) return null;
  const ra = raDeg * Math.PI / 180;
  const dec = decDeg * Math.PI / 180;
  return [Math.cos(dec) * Math.cos(ra), Math.sin(dec),
    Math.cos(dec) * Math.sin(ra)];
}

export function focusWebSkyStarV656(row: WebSkyStarV656): WebSkyFocusTargetV656 | null {
  if (row.phase !== "runtime-existing" || !row.canFocusScene
    || row.focusCatalogId !== `stellar-hero:${row.id}`) return null;
  const metadata = MAINLINE_A_CURRENT_STARS.find((star) => star.id === row.id);
  if (!metadata) return null;
  const target = stellarAtlasFocusTarget(metadata);
  return target.catalogId === row.focusCatalogId ? target : null;
}

export function focusWebSkyConstellationV656(
  row: WebSkyConstellationV656,
): WebSkyFocusTargetV656 | null {
  if (row.routeCatalogId !== `constellation:${row.code}`
    || row.reviewState !== "signoff-pending") return null;
  const figure = MAINLINE_A_CONSTELLATION_FIGURES_V607[row.code];
  const catalog = selectCelestialCatalogEntry(row.routeCatalogId);
  if (!figure?.sourceComplete || !figure.segments.length || !catalog
    || catalog.raHours === null || catalog.decDeg === null) return null;
  const direction = directionV656(catalog.raHours * 15, catalog.decDeg);
  return direction ? { direction, catalogId: row.routeCatalogId } : null;
}

export function focusWebSkyCatalogEntryV656(catalogId: string): WebSkyFocusTargetV656 | null {
  const catalog = selectCelestialCatalogEntry(catalogId);
  if (!catalog || catalog.raHours === null || catalog.decDeg === null) return null;
  const direction = directionV656(catalog.raHours * 15, catalog.decDeg);
  return direction ? { direction, catalogId } : null;
}
