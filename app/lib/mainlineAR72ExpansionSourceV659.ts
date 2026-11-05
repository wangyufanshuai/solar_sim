export const R72_SOURCE_SCHEMA_V659 =
  "mainline-a-r72-expansion-overlay-v659" as const;
export const R72_SOURCE_ROUTE_V659 =
  "/api/atlas/mainline-a-r72-source";

export type R72PinV659 = Readonly<{
  path: string;
  bytes: number;
  sha256: string;
}>;

export type R72SourceRowV659 = Readonly<{
  id: string;
  nasaId: string;
  title: string;
  rank: number;
  expectedCredit: string;
  pageKind: "photojournal" | "library-shell";
  pageUrl: string;
  imageUrl: string;
  imageAcquisitionAllowed: boolean;
  blockers: readonly string[];
  status: string;
  pageIdentityVerified: boolean;
  pageRaw: R72PinV659 | null;
  searchRaw: R72PinV659 | null;
  assetRaw: R72PinV659 | null;
  structuredSourceIdentityVerified: boolean;
  currentStructuredCreditVerified: boolean;
  currentStructuredCreditLimitation: string | null;
  imageRaw: R72PinV659 | null;
  imageRequestExecuted: boolean;
  imageSkipReason: string | null;
  imageAttemptCount: number;
  originalWidth: number | null;
  originalHeight: number | null;
  rawByteIdentical: boolean;
  decodedPixelIdentical: boolean;
  rightsStatus: "pending";
  runtimeAdmission: "candidate-only";
  hold: true;
  notAdmitted: true;
  scientificPayloadWriteback: false;
}>;

export type R72SourceOverlayV659 = Readonly<{
  schema: typeof R72_SOURCE_SCHEMA_V659;
  status: string;
  audit: R72PinV659;
  counts: Readonly<{
    targets: number;
    structuredSearchVerified: number;
    assetManifestsVerified: number;
    photojournalPageIdentities: number;
    genericLibraryPageShells: number;
    imagesCaptured: number;
    blockedImageRequestsUnexecuted: number;
    decodedPixelMatches: number;
    rawByteMatches: number;
    rightsSigned: number;
    runtimeAdmitted: number;
  }>;
  rows: readonly R72SourceRowV659[];
  boundary: Readonly<{
    candidateOnly: true;
    hold: true;
    notAdmitted: true;
    scientificPayloadWriteback: false;
    rightsSignoff: "pending";
    publicWebRelease: "blocked";
  }>;
}>;

const SHA = /^[a-f0-9]{64}$/;
const TARGETS = new Map([
  ["ring-nebula", { nasaId: "GSFC_20171208_Archive_e001464",
    title: "Hubble reveals the Ring Nebula’s true shape",
    credit: "NASA Goddard", pageKind: "library-shell" }],
  ["dumbbell-nebula", { nasaId: "PIA04249",
    title: "Close-up of M27, the Dumbbell Nebula",
    credit: "NASA/JPL/STScI", pageKind: "photojournal" }],
  ["california-nebula", { nasaId: "PIA23650",
    title: "Spitzer California Nebula Mosaic",
    credit: "NASA/JPL-Caltech/Palomar Digitized Sky Survey",
    pageKind: "photojournal" }],
  ["bubble-nebula", { nasaId: "GSFC_20171208_Archive_e000382",
    title: "Hubble Sees a Star ‘Inflating’ a Giant Bubble",
    credit: "NASA Goddard", pageKind: "library-shell" }],
  ["cats-eye-nebula", { nasaId: "GSFC_20171208_Archive_e002155",
    title: "Cat's Eye Nebula", credit: "NASA Goddard",
    pageKind: "library-shell" }],
  ["omega-nebula", { nasaId: "PIA23409",
    title: "SOFIA Reveals How the Swan Nebula Hatched",
    credit: "NASA/SOFIA/Lim, De Buizer, & Radomski et al.; ESA/Herschel; NASA/JPL-Caltech",
    pageKind: "photojournal" }],
]);

function pinValid(pin: R72PinV659 | null, prefix: string) {
  return Boolean(pin && pin.path.startsWith(prefix)
    && !pin.path.includes("\\")
    && !pin.path.split("/").includes("..")
    && SHA.test(pin.sha256)
    && Number.isInteger(pin.bytes) && pin.bytes > 100);
}

function imageUrl(nasaId: string) {
  return `https://images-assets.nasa.gov/image/${nasaId}/${nasaId}~orig.jpg`;
}

function rowValid(row: R72SourceRowV659, index: number) {
  const expected = TARGETS.get(row?.id);
  if (!expected || row.nasaId !== expected.nasaId
    || row.title !== expected.title || row.expectedCredit !== expected.credit
    || row.rank !== index + 1 || row.pageKind !== expected.pageKind
    || row.imageUrl !== imageUrl(expected.nasaId)
    || row.rightsStatus !== "pending"
    || row.runtimeAdmission !== "candidate-only"
    || row.hold !== true || row.notAdmitted !== true
    || row.scientificPayloadWriteback !== false
    || row.structuredSourceIdentityVerified !== true
    || !pinValid(row.pageRaw,
      `docs/release/v607/nebula-r72-v659/raw/${row.id}-page-`)
    || !pinValid(row.searchRaw,
      `docs/release/v607/nebula-r72-v659/raw/${row.id}-search-`)
    || !pinValid(row.assetRaw,
      `docs/release/v607/nebula-r72-v659/raw/${row.id}-asset-`)
    || !Array.isArray(row.blockers)
    || !row.blockers.includes("rights-review-pending")) return false;
  if (expected.pageKind === "photojournal"
    && (!row.pageIdentityVerified
      || !row.pageUrl.startsWith("https://science.nasa.gov/photojournal/")
      || !row.currentStructuredCreditVerified)) return false;
  if (expected.pageKind === "library-shell"
    && (row.pageIdentityVerified
      || row.pageUrl !== `https://images.nasa.gov/details/${expected.nasaId}`
      || row.currentStructuredCreditVerified
      || row.currentStructuredCreditLimitation
        !== "current-structured-record-omits-item-credit")) return false;
  const california = row.id === "california-nebula";
  if (california) {
    return row.imageAcquisitionAllowed === true
      && row.status === "source-and-image-captured-candidate"
      && row.imageRequestExecuted === true
      && row.imageSkipReason === null && row.imageAttemptCount === 1
      && pinValid(row.imageRaw,
        `docs/release/v607/nebula-r72-v659/raw/${row.id}-image-`)
      && Number.isInteger(row.originalWidth) && row.originalWidth! > 0
      && Number.isInteger(row.originalHeight) && row.originalHeight! > 0
      && row.rawByteIdentical === true
      && row.decodedPixelIdentical === true;
  }
  return row.imageAcquisitionAllowed === false
    && row.status === "structured-source-captured-image-hold"
    && row.imageRequestExecuted === false
    && row.imageSkipReason === "item-license-or-suitability-review-blocked"
    && row.imageAttemptCount === 0 && row.imageRaw === null
    && row.originalWidth === null && row.originalHeight === null
    && row.rawByteIdentical === false
    && row.decodedPixelIdentical === false;
}

export function inspectR72SourceOverlayV659(pack: R72SourceOverlayV659) {
  const issues: string[] = [];
  const rows = Array.isArray(pack?.rows) ? pack.rows : [];
  if (pack?.schema !== R72_SOURCE_SCHEMA_V659
    || pack?.status
      !== "verified-six-structured-one-image-five-policy-holds-candidate"
    || rows.length !== 6
    || new Set(rows.map((row) => row?.id)).size !== 6
    || !pinValid(pack?.audit,
      "docs/release/v607/mainline-a-r72-source-audit-")) {
    issues.push("overlay-identity-or-coverage-invalid");
  }
  for (const [index, row] of rows.entries()) {
    if (!rowValid(row, index)) {
      issues.push(`${row?.id ?? index}:source-policy-or-boundary-invalid`);
    }
  }
  if (pack?.counts?.targets !== 6
    || pack.counts.structuredSearchVerified !== 6
    || pack.counts.assetManifestsVerified !== 6
    || pack.counts.photojournalPageIdentities !== 3
    || pack.counts.genericLibraryPageShells !== 3
    || pack.counts.imagesCaptured !== 1
    || pack.counts.blockedImageRequestsUnexecuted !== 5
    || pack.counts.decodedPixelMatches !== 1
    || pack.counts.rawByteMatches !== 1
    || pack.counts.rightsSigned !== 0
    || pack.counts.runtimeAdmitted !== 0
    || pack.boundary?.candidateOnly !== true
    || pack.boundary.hold !== true
    || pack.boundary.notAdmitted !== true
    || pack.boundary.scientificPayloadWriteback !== false
    || pack.boundary.rightsSignoff !== "pending"
    || pack.boundary.publicWebRelease !== "blocked") {
    issues.push("counts-or-release-boundary-invalid");
  }
  return Object.freeze({ ok: issues.length === 0,
    issues: Object.freeze(issues),
    imageCount: rows.filter((row) => row.imageRaw).length,
    policyHolds: rows.filter((row) => !row.imageAcquisitionAllowed).length,
    creditLimited: rows.filter((row) =>
      !row.currentStructuredCreditVerified).length });
}

export function selectR72SourceImageV659(pack: R72SourceOverlayV659,
  id: string) {
  if (!inspectR72SourceOverlayV659(pack).ok
    || id !== "california-nebula") return null;
  const row = pack.rows.find((item) => item.id === id);
  if (!row?.imageRaw || !row.imageAcquisitionAllowed) return null;
  return Object.freeze({ row, pin: row.imageRaw,
    contentType: "image/jpeg" as const,
    route: `${R72_SOURCE_ROUTE_V659}/${id}` });
}

export type R72SourceFilterV659 = "all" | "image-available"
  | "policy-hold" | "credit-limited";

export function visibleR72SourceRowsV659(
  rows: readonly R72SourceRowV659[], filter: R72SourceFilterV659,
  query: string,
) {
  const needle = query.trim().toLocaleLowerCase();
  return rows.filter((row) => {
    if (filter === "image-available" && !row.imageRaw) return false;
    if (filter === "policy-hold" && row.imageAcquisitionAllowed) return false;
    if (filter === "credit-limited"
      && row.currentStructuredCreditVerified) return false;
    return !needle || [row.id, row.nasaId, row.title,
      row.expectedCredit].some((value) =>
      value.toLocaleLowerCase().includes(needle));
  });
}
