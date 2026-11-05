export type CandidateReviewVariantV655 = "thumb" | "detail" | "raw";

export type CandidateReviewPinV655 = Readonly<{
  path: string;
  bytes: number;
  sha256: string;
  width?: number;
  height?: number;
  mimeType?: string;
}>;

export type CandidateReviewRowV655 = Readonly<{
  batchId: "B1" | "B2";
  id: string;
  nasaId: string;
  title: string;
  sourcePageUrl: string;
  officialJpegUrl: string;
  sourceCredit: string;
  sourcePageSha256: string;
  candidateRaw: CandidateReviewPinV655;
  officialRaw: CandidateReviewPinV655;
  rawByteIdentical: boolean;
  decodedPixelIdentical: boolean;
  pixelSha256: string;
  originalWidth: number;
  originalHeight: number;
  preview: Readonly<{
    thumb: CandidateReviewPinV655;
    detail: CandidateReviewPinV655;
  }>;
  rightsStatus: "pending";
  runtimeAdmission: "candidate-only";
  hold: true;
  notAdmitted: true;
  scientificPayloadWriteback: false;
}>;

export type CandidateReviewPackV655 = Readonly<{
  schema: string;
  evidenceClass: string;
  rows: readonly CandidateReviewRowV655[];
  counts: Readonly<{
    total: number;
    B1: number;
    B2: number;
    sourcePagesVerified: number;
    candidateRawVerified: number;
    previewPairs: number;
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
    localReviewOnly: boolean;
  }>;
  claims: Readonly<{
    copyrightApproval: boolean;
    scientificValidity: boolean;
    publicWebReleaseApproved: boolean;
    realUserValidation: boolean;
  }>;
}>;

const SHA = /^[a-f0-9]{64}$/;
const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const NASA = /^PIA\d{5}$/;
const RAW_BASE = "docs/release/v607/nebula-image-artifacts/";
const DERIVED_BASE = "docs/release/v607/nebula-review-derivatives/v655/";

export function inspectCandidateReviewPackV655(pack: CandidateReviewPackV655) {
  const issues: string[] = [];
  if (pack?.schema !== "mainline-a-nebula-candidate-review-v655"
    || pack.evidenceClass !== "local-derived-review-only"
    || !Array.isArray(pack.rows) || pack.rows.length !== 12) {
    issues.push("review-pack-identity-invalid");
  }
  if (pack?.boundary?.candidateOnly !== true
    || pack.boundary.hold !== true
    || pack.boundary.notAdmitted !== true
    || pack.boundary.scientificPayloadWriteback !== false
    || pack.boundary.runtimePromotion !== "closed"
    || pack.boundary.localReviewOnly !== true
    || pack.claims?.copyrightApproval !== false
    || pack.claims.scientificValidity !== false
    || pack.claims.publicWebReleaseApproved !== false
    || pack.claims.realUserValidation !== false) {
    issues.push("review-pack-boundary-promoted");
  }
  const rows = Array.isArray(pack?.rows) ? pack.rows : [];
  for (const [index, row] of rows.entries()) {
    const prefix = `${row?.id ?? index}:`;
    if (!ID.test(row?.id ?? "") || !NASA.test(row?.nasaId ?? "")
      || !["B1", "B2"].includes(row?.batchId)
      || !/^https:\/\/science\.nasa\.gov\/photojournal\//.test(
        row?.sourcePageUrl ?? "")
      || !/^https:\/\/assets\.science\.nasa\.gov\//.test(
        row?.officialJpegUrl ?? "")
      || !row?.sourceCredit || !SHA.test(row?.sourcePageSha256 ?? "")
      || !SHA.test(row?.pixelSha256 ?? "")
      || row?.originalWidth <= 0 || row?.originalHeight <= 0) {
      issues.push(`${prefix}source-identity-invalid`);
    }
    if (row?.rightsStatus !== "pending"
      || row.runtimeAdmission !== "candidate-only"
      || row.hold !== true || row.notAdmitted !== true
      || row.scientificPayloadWriteback !== false
      || row.decodedPixelIdentical !== true
      || row.rawByteIdentical !== (row.candidateRaw?.sha256
        === row.officialRaw?.sha256)) {
      issues.push(`${prefix}candidate-admission-invalid`);
    }
    for (const [kind, pin, base, mime] of [
      ["raw", row?.candidateRaw, RAW_BASE, "image/jpeg"],
      ["thumb", row?.preview?.thumb, DERIVED_BASE, "image/webp"],
      ["detail", row?.preview?.detail, DERIVED_BASE, "image/webp"],
    ] as const) {
      if (!pin || !pin.path.startsWith(base)
        || !ID.test(row.id)
        || !SHA.test(pin.sha256 ?? "")
        || !Number.isInteger(pin.bytes) || pin.bytes < 100
        || (kind === "raw" && !pin.path.endsWith(".jpg"))
        || (kind !== "raw" && (pin.mimeType !== mime
          || pin.width! < 1 || pin.height! < 1
          || pin.path !== `${DERIVED_BASE}${row.id}-${kind}-${pin.sha256}.webp`))) {
        issues.push(`${prefix}${kind}-pin-invalid`);
      }
    }
  }
  const counts = { total: rows.length,
    B1: rows.filter((row) => row.batchId === "B1").length,
    B2: rows.filter((row) => row.batchId === "B2").length,
    sourcePagesVerified: rows.length,
    candidateRawVerified: rows.length,
    previewPairs: rows.length,
    rawByteIdentical: rows.filter((row) => row.rawByteIdentical).length,
    decodedPixelIdentical: rows.filter((row) =>
      row.decodedPixelIdentical).length,
    rightsSigned: rows.filter((row) =>
      row.rightsStatus !== "pending").length };
  if (new Set(rows.map((row) => row.id)).size !== 12
    || new Set(rows.map((row) => row.nasaId)).size !== 12
    || counts.B1 !== 6 || counts.B2 !== 6
    || JSON.stringify(pack?.counts) !== JSON.stringify(counts)
    || counts.rightsSigned !== 0) {
    issues.push("review-pack-coverage-or-counts-invalid");
  }
  return Object.freeze({ ok: issues.length === 0,
    issues: Object.freeze(issues), counts: Object.freeze(counts) });
}

export function selectCandidateReviewAssetV655(pack: CandidateReviewPackV655,
  id: string, variant: string) {
  const inspected = inspectCandidateReviewPackV655(pack);
  if (!inspected.ok || !ID.test(id)
    || !["thumb", "detail", "raw"].includes(variant)) return null;
  const row = pack.rows.find((item) => item.id === id);
  if (!row) return null;
  const pin = variant === "raw" ? row.candidateRaw
    : row.preview[variant as "thumb" | "detail"];
  return Object.freeze({ id, variant: variant as CandidateReviewVariantV655,
    pin, row, mimeType: variant === "raw" ? "image/jpeg" : "image/webp" });
}

export function isLocalReviewRequestV655(request: Request,
  enabled = false) {
  if (!enabled || request.method !== "GET") return false;
  let url: URL;
  try { url = new URL(request.url); } catch { return false; }
  const loopback = (value: string) => ["127.0.0.1", "localhost", "[::1]", "::1"]
    .includes(value.toLowerCase());
  const declaredHost = request.headers.get("host") ?? "";
  const forwardedHost = request.headers.get("x-forwarded-host");
  const origin = request.headers.get("origin");
  if (!loopback(url.hostname) || url.protocol !== "http:"
    || !declaredHost || !loopback(declaredHost.split(":")[0])
    || (forwardedHost && !loopback(forwardedHost.split(":")[0]))
    || (origin && origin !== url.origin)) return false;
  return true;
}
