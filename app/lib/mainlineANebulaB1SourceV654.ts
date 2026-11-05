export type B1SourceRowV654 = Readonly<{
  id: string;
  nasaId: string;
  title: string;
  officialPageUrl: string;
  officialCredit: string;
  pageRawSha256: string;
  officialJpegUrl: string;
  officialRawSha256: string;
  candidateRawSha256: string;
  rawByteIdentical: boolean;
  decodedPixelIdentical: boolean;
  width: number;
  height: number;
  pixelSha256: string;
  status: "source-and-pixels-verified-candidate";
  rightsStatus: "pending";
  runtimeAdmission: "candidate-only";
  scientificPayloadWriteback: false;
}>;

export type B1SourceOverlayV654 = Readonly<{
  schema: string;
  evidenceClass: string;
  sourceAuditSha256: string;
  imageAuditSha256: string;
  rows: readonly B1SourceRowV654[];
  counts: Readonly<{
    total: number;
    officialPagesVerified: number;
    officialJpegsCaptured: number;
    rawByteIdentical: number;
    decodedPixelIdentical: number;
    rightsSigned: number;
  }>;
  boundary: Readonly<{
    candidateOnly: boolean;
    hold: boolean;
    notAdmitted: boolean;
    scientificPayloadWriteback: boolean;
    runtimePromotion: string;
  }>;
  claims: Readonly<{
    copyrightApproval: boolean;
    scientificValidity: boolean;
    publicWebReleaseApproved: boolean;
    realUserValidation: boolean;
  }>;
}>;

export type B1SourceSelectionV654 = Readonly<{
  status: "verified-local-candidate" | "invalid";
  issues: readonly string[];
  rows: readonly B1SourceRowV654[];
  counts: B1SourceOverlayV654["counts"];
}>;

const SHA = /^[a-f0-9]{64}$/;
const NASA_ID = /^PIA\d{5}$/;
const SAME = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

function officialPage(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:"
      && parsed.hostname === "science.nasa.gov"
      && parsed.port === "" && parsed.username === ""
      && parsed.password === "" && parsed.search === ""
      && parsed.hash === ""
      && /^\/photojournal\/[a-z0-9-]+\/$/.test(parsed.pathname);
  } catch {
    return false;
  }
}

function officialJpeg(url: string, nasaId: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:"
      && parsed.hostname === "assets.science.nasa.gov"
      && parsed.port === "" && parsed.username === ""
      && parsed.password === "" && parsed.search === ""
      && parsed.hash === ""
      && parsed.pathname.endsWith(`/${nasaId}.jpg`)
      && parsed.pathname.toLowerCase().includes(
        `/pia${nasaId.slice(3, 5)}/${nasaId.toLowerCase()}/`);
  } catch {
    return false;
  }
}

export function inspectB1SourceOverlayV654(overlay: B1SourceOverlayV654,
  imageBatch: { rows?: readonly {
    id: string; title?: string; source?: { credit?: string };
    network?: { artifact?: { sha256?: string } };
  }[] }): B1SourceSelectionV654 {
  const issues: string[] = [];
  const rows = Array.isArray(overlay?.rows) ? overlay.rows : [];
  if (overlay?.schema !== "mainline-a-nebula-b1-source-v654"
    || overlay.evidenceClass !== "verified-local-external-source-overlay"
    || !SHA.test(overlay.sourceAuditSha256 ?? "")
    || !SHA.test(overlay.imageAuditSha256 ?? "")) {
    issues.push("overlay-identity-invalid");
  }
  if (rows.length !== 6 || imageBatch?.rows?.length !== 6
    || new Set(rows.map((row) => row.id)).size !== 6
    || new Set(rows.map((row) => row.nasaId)).size !== 6) {
    issues.push("six-candidate-coverage-invalid");
  }
  if (overlay?.boundary?.candidateOnly !== true
    || overlay.boundary.hold !== true
    || overlay.boundary.notAdmitted !== true
    || overlay.boundary.scientificPayloadWriteback !== false
    || overlay.boundary.runtimePromotion !== "closed"
    || overlay.claims?.copyrightApproval !== false
    || overlay.claims.scientificValidity !== false
    || overlay.claims.publicWebReleaseApproved !== false
    || overlay.claims.realUserValidation !== false) {
    issues.push("release-boundary-promoted");
  }
  for (const [index, row] of rows.entries()) {
    const candidate = imageBatch?.rows?.[index];
    if (row.id !== candidate?.id || row.title !== candidate?.title
      || row.officialCredit !== candidate?.source?.credit
      || row.candidateRawSha256
        !== candidate?.network?.artifact?.sha256) {
      issues.push(`${row.id}:candidate-binding-invalid`);
    }
    if (!NASA_ID.test(row.nasaId) || !officialPage(row.officialPageUrl)
      || !officialJpeg(row.officialJpegUrl, row.nasaId)
      || !SHA.test(row.pageRawSha256)
      || !SHA.test(row.officialRawSha256)
      || !SHA.test(row.candidateRawSha256)
      || !SHA.test(row.pixelSha256)
      || !Number.isInteger(row.width) || row.width <= 0
      || !Number.isInteger(row.height) || row.height <= 0) {
      issues.push(`${row.id}:source-and-raster-invalid`);
    }
    if (row.status !== "source-and-pixels-verified-candidate"
      || row.decodedPixelIdentical !== true
      || row.rawByteIdentical
        !== (row.officialRawSha256 === row.candidateRawSha256)
      || row.rightsStatus !== "pending"
      || row.runtimeAdmission !== "candidate-only"
      || row.scientificPayloadWriteback !== false) {
      issues.push(`${row.id}:admission-or-comparison-invalid`);
    }
  }
  const actualCounts = {
    total: rows.length,
    officialPagesVerified: rows.filter((row) =>
      row.status === "source-and-pixels-verified-candidate").length,
    officialJpegsCaptured: rows.length,
    rawByteIdentical: rows.filter((row) => row.rawByteIdentical).length,
    decodedPixelIdentical: rows.filter((row) =>
      row.decodedPixelIdentical).length,
    rightsSigned: rows.filter((row) =>
      row.rightsStatus !== "pending").length,
  };
  if (!SAME(overlay?.counts, actualCounts)
    || actualCounts.rightsSigned !== 0
    || actualCounts.decodedPixelIdentical !== 6) {
    issues.push("declared-counts-invalid");
  }
  return Object.freeze({ status: issues.length === 0
    ? "verified-local-candidate" : "invalid",
    issues: Object.freeze(issues), rows: Object.freeze([...rows]),
    counts: overlay.counts });
}

export function filterB1SourceRowsV654(rows: readonly B1SourceRowV654[],
  query: string): readonly B1SourceRowV654[] {
  const needle = query.trim().toLocaleLowerCase();
  if (!needle) return rows;
  return rows.filter((row) => [row.id, row.nasaId, row.title,
    row.officialCredit].some((value) =>
    value.toLocaleLowerCase().includes(needle)));
}

export function selectB1SourceRowV654(rows: readonly B1SourceRowV654[],
  selectedId: string): B1SourceRowV654 | null {
  return rows.find((row) => row.id === selectedId) ?? rows[0] ?? null;
}
