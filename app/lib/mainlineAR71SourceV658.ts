export const R71_SOURCE_SCHEMA_V658 = "mainline-a-r71-source-overlay-v658" as const;
export const R71_SOURCE_ROUTE_V658 = "/api/atlas/mainline-a-r71-source";

export type R71PinV658 = Readonly<{
  path: string;
  sha256: string;
  bytes: number;
}>;

export type R71SourceRowV658 = Readonly<{
  id: string;
  nasaId: string;
  catalog: string;
  title: string;
  status: string;
  officialPageUrl: string;
  officialImageUrl: string;
  expectedCredit: string;
  pageRaw: R71PinV658 | null;
  imageRaw: R71PinV658 | null;
  historicalLocalRaw: R71PinV658 | null;
  originalWidth: number | null;
  originalHeight: number | null;
  rawByteIdentical: boolean;
  decodedPixelIdentical: boolean;
  pageResponseCaptured: number;
  imageResponseCaptured: number;
  pageAttemptCount: number;
  imageAttemptCount: number;
  rightsStatus: "pending";
  runtimeAdmission: "candidate-only";
  hold: true;
  notAdmitted: true;
  scientificPayloadWriteback: false;
}>;

export type R71SourceOverlayV658 = Readonly<{
  schema: typeof R71_SOURCE_SCHEMA_V658;
  status: string;
  sourceAudit: R71PinV658;
  rows: readonly R71SourceRowV658[];
  counts: Readonly<{
    targets: number;
    officialPages: number;
    officialImages: number;
    pixelMatches: number;
    rawByteMatches: number;
    pageAttemptOnly: number;
    imageAttemptOnly: number;
    rightsSigned: number;
    runtimeAdmitted: number;
  }>;
  boundary: Readonly<{
    candidateOnly: true;
    hold: true;
    notAdmitted: true;
    scientificPayloadWriteback: false;
    rightsSignoff: "pending";
    publicWebRelease: "blocked";
  }>;
  claims: Readonly<{
    copyrightApproval: false;
    scientificValidity: false;
    productionPerformance: false;
    realUserValidation: false;
    physicalMobile: false;
    publicWebReleaseApproved: false;
  }>;
}>;

const SHA = /^[a-f0-9]{64}$/;
const EXPECTED = new Map([
  ["w40-nebula", { nasaId: "PIA23121", slug: "space-butterfly",
    credit: "NASA/JPL-Caltech" }],
  ["sh2-235-nebula", { nasaId: "PIA13995",
    slug: "wise-eyes-evolution-of-massive-stars",
    credit: "NASA/JPL-Caltech/UCLA" }],
  ["flaming-star-nebula", { nasaId: "PIA13447",
    slug: "wise-catches-a-runaway-star-in-flames",
    credit: "NASA/JPL-Caltech/UCLA" }],
  ["spider-nebula", { nasaId: "PIA20357", slug: "the-spider-nebula",
    credit: "NASA/JPL-Caltech/2MASS" }],
  ["tarantula-nebula", { nasaId: "PIA23646",
    slug: "tarantula-nebula-spitzer-2-color-image",
    credit: "NASA/JPL-Caltech" }],
  ["tadpole-nebula", { nasaId: "PIA13110",
    slug: "asteroid-caught-marching-across-tadpole-nebula",
    credit: "NASA/JPL-Caltech/UCLA" }],
]);

function pinValid(pin: R71PinV658 | null, prefix: string) {
  return Boolean(pin && pin.path.startsWith(prefix)
    && !pin.path.includes("\\")
    && !pin.path.split("/").includes("..")
    && SHA.test(pin.sha256)
    && Number.isInteger(pin.bytes) && pin.bytes > 100);
}

function officialJpegForId(nasaId: string) {
  const group = nasaId.slice(0, 5).toLowerCase();
  const folder = nasaId.toLowerCase();
  return `https://assets.science.nasa.gov/content/dam/science/psd/photojournal/pia/${group}/${folder}/${nasaId}.jpg`;
}

export function inspectR71SourceOverlayV658(pack: R71SourceOverlayV658) {
  const issues: string[] = [];
  const rows = Array.isArray(pack?.rows) ? pack.rows : [];
  if (pack?.schema !== R71_SOURCE_SCHEMA_V658
    || pack.status !== "verified-six-official-page-image-pixel-links-candidate"
    || rows.length !== 6
    || new Set(rows.map((row) => row?.id)).size !== 6
    || !pinValid(pack.sourceAudit, "docs/release/v607/")) {
    issues.push("overlay-identity-or-coverage-invalid");
  }
  for (const row of rows) {
    const expected = EXPECTED.get(row.id);
    if (!expected || row.nasaId !== expected.nasaId
      || row.officialPageUrl !==
        `https://science.nasa.gov/photojournal/${expected.slug}/`
      || row.officialImageUrl !== officialJpegForId(expected.nasaId)
      || row.expectedCredit !== expected.credit
      || row.status !== "official-page-image-pixels-linked-candidate"
      || row.pageResponseCaptured !== 1
      || row.imageResponseCaptured !== 1
      || row.pageAttemptCount < 1 || row.imageAttemptCount < 1
      || !pinValid(row.pageRaw,
        `docs/release/v607/nebula-r71-v658/raw/${row.id}-page-`)
      || !pinValid(row.imageRaw,
        `docs/release/v607/nebula-r71-v658/raw/${row.id}-image-`)
      || !pinValid(row.historicalLocalRaw, "source-cache/v592/nebulae/")
      || row.originalWidth === null || row.originalWidth <= 0
      || row.originalHeight === null || row.originalHeight <= 0
      || row.decodedPixelIdentical !== true
      || row.rightsStatus !== "pending"
      || row.runtimeAdmission !== "candidate-only"
      || row.hold !== true || row.notAdmitted !== true
      || row.scientificPayloadWriteback !== false) {
      issues.push(`${row.id}:raw-link-or-boundary-invalid`);
    }
  }
  if (pack?.counts?.targets !== 6 || pack.counts.officialPages !== 6
    || pack.counts.officialImages !== 6 || pack.counts.pixelMatches !== 6
    || pack.counts.rawByteMatches !== rows.filter((row) =>
      row.rawByteIdentical).length
    || pack.counts.pageAttemptOnly !== 0
    || pack.counts.imageAttemptOnly !== 0
    || pack.counts.rightsSigned !== 0
    || pack.counts.runtimeAdmitted !== 0
    || pack.boundary?.candidateOnly !== true
    || pack.boundary.hold !== true
    || pack.boundary.notAdmitted !== true
    || pack.boundary.scientificPayloadWriteback !== false
    || pack.boundary.rightsSignoff !== "pending"
    || pack.boundary.publicWebRelease !== "blocked"
    || pack.claims?.copyrightApproval !== false
    || pack.claims.scientificValidity !== false
    || pack.claims.productionPerformance !== false
    || pack.claims.realUserValidation !== false
    || pack.claims.physicalMobile !== false
    || pack.claims.publicWebReleaseApproved !== false) {
    issues.push("counts-or-release-claims-invalid");
  }
  return Object.freeze({ ok: issues.length === 0,
    issues: Object.freeze(issues),
    linked: rows.filter((row) => row.decodedPixelIdentical).length,
    rawByteMatches: rows.filter((row) => row.rawByteIdentical).length });
}

export function selectR71SourceImageV658(pack: R71SourceOverlayV658,
  id: string) {
  if (!inspectR71SourceOverlayV658(pack).ok || !EXPECTED.has(id)) return null;
  const row = pack.rows.find((item) => item.id === id);
  if (!row?.imageRaw) return null;
  return Object.freeze({ row, pin: row.imageRaw,
    contentType: "image/jpeg" as const,
    route: `${R71_SOURCE_ROUTE_V658}/${row.id}/image` });
}

export type R71SourceFilterV658 = "all" | "raw-match" | "raw-variant";

export function visibleR71SourceRowsV658(
  rows: readonly R71SourceRowV658[],
  filter: R71SourceFilterV658,
  query: string,
) {
  const needle = query.trim().toLocaleLowerCase();
  return rows.filter((row) => {
    if (filter === "raw-match" && !row.rawByteIdentical) return false;
    if (filter === "raw-variant" && row.rawByteIdentical) return false;
    return !needle || [row.id, row.nasaId, row.catalog,
      row.title, row.expectedCredit].some((value) =>
      value.toLocaleLowerCase().includes(needle));
  });
}
