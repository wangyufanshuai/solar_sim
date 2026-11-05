import { inspectCandidateReviewPackV655,
  type CandidateReviewPackV655 } from "./mainlineANebulaReviewAssetV655";
import { inspectR71SourceOverlayV658,
  type R71SourceOverlayV658 } from "./mainlineAR71SourceV658";
import { inspectR72SourceOverlayV659,
  type R72SourceOverlayV659 } from "./mainlineAR72ExpansionSourceV659";

export const R73_CATALOG_SCHEMA_V660 = "mainline-a-r73-nebula-catalog-v660" as const;
export const R73_CATALOG_ORDER_V660 = Object.freeze([
  "heart-nebula", "soul-nebula", "witch-head-nebula",
  "flame-nebula", "pacman-nebula", "running-chicken-nebula",
  "jellyfish-nebula", "cocoon-nebula", "rho-ophiuchi-cloud",
  "cepheus-c-nebula", "dragon-lair-nebula", "monkey-head-nebula",
  "w40-nebula", "sh2-235-nebula", "flaming-star-nebula",
  "spider-nebula", "tarantula-nebula", "tadpole-nebula",
  "ring-nebula", "dumbbell-nebula", "california-nebula",
  "bubble-nebula", "cats-eye-nebula", "omega-nebula",
] as const);

export type R73CohortV660 = "B1" | "B2" | "R71" | "R72";
export type R73PinV660 = Readonly<{
  path: string;
  bytes: number;
  sha256: string;
}>;
export type R73EvidencePinV660 = R73PinV660 & Readonly<{
  role: "candidate-raw" | "official-raw" | "thumb" | "detail"
    | "page" | "search" | "asset" | "historical-raw";
}>;
export type R73DeliveryV660 = R73PinV660 & Readonly<{
  route: string;
  mimeType: "image/webp" | "image/jpeg";
  width: number;
  height: number;
  variant: "derived-preview" | "official-raw";
}>;
export type R73GalleryRowV660 = Readonly<{
  id: string;
  rank: number;
  cohort: R73CohortV660;
  title: string;
  nasaId: string;
  sourcePageUrl: string;
  sourcePageIdentity: "item-page" | "generic-shell";
  sourcePageSha256: string;
  credit: string;
  creditEvidence: "page-capture" | "structured-current" | "historical-only";
  imageState: "review-image" | "policy-hold";
  delivery: R73DeliveryV660 | null;
  rawEvidence: readonly R73EvidencePinV660[];
  sourceRawSha256: string | null;
  rawByteRelation: "identical" | "different" | "unavailable";
  decodedPixelMatch: boolean | null;
  blockers: readonly string[];
  rightsStatus: "pending";
  runtimeAdmission: "candidate-only";
  hold: true;
  notAdmitted: true;
  scientificPayloadWriteback: false;
}>;
export type R73CatalogV660 = Readonly<{
  schema: typeof R73_CATALOG_SCHEMA_V660;
  evidenceClass: "local-source-linked-web-review-candidate";
  generatedAt: string;
  inputs: readonly (R73PinV660 & Readonly<{ role: "B1B2" | "R71" | "R72" }>)[];
  rows: readonly R73GalleryRowV660[];
  counts: Readonly<{
    total: 24;
    B1: 6;
    B2: 6;
    R71: 6;
    R72: 6;
    reviewImages: 19;
    policyHolds: 5;
    itemPages: 21;
    genericShells: 3;
    rightsSigned: 0;
    runtimeAdmitted: 0;
  }>;
  boundary: Readonly<{
    candidateOnly: true;
    hold: true;
    notAdmitted: true;
    scientificPayloadWriteback: false;
    localReviewOnly: true;
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
const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const FRIENDLY: Readonly<Record<string, string>> = Object.freeze({
  "heart-nebula": "心脏星云", "soul-nebula": "灵魂星云",
  "witch-head-nebula": "女巫头星云", "flame-nebula": "火焰星云",
  "pacman-nebula": "吃豆人星云", "running-chicken-nebula": "奔鸡星云",
  "jellyfish-nebula": "水母星云", "cocoon-nebula": "茧星云",
  "rho-ophiuchi-cloud": "蛇夫座 ρ 云", "cepheus-c-nebula": "仙王座 C 云",
  "dragon-lair-nebula": "龙穴星云", "monkey-head-nebula": "猴头星云",
  "w40-nebula": "W40", "sh2-235-nebula": "Sh2-235",
  "flaming-star-nebula": "IC 405", "spider-nebula": "IC 417",
  "tarantula-nebula": "NGC 2070", "tadpole-nebula": "IC 410",
  "ring-nebula": "环状星云", "dumbbell-nebula": "哑铃星云",
  "california-nebula": "加州星云", "bubble-nebula": "气泡星云",
  "cats-eye-nebula": "猫眼星云", "omega-nebula": "欧米茄星云",
});

export function r73DisplayNameV660(row: Pick<R73GalleryRowV660, "id" | "title">) {
  return FRIENDLY[row.id] ?? row.title;
}

function pin(role: R73EvidencePinV660["role"], value: R73PinV660): R73EvidencePinV660 {
  return { role, path: value.path, bytes: value.bytes, sha256: value.sha256 };
}

export function buildR73CatalogV660(
  review: CandidateReviewPackV655,
  r71: R71SourceOverlayV658,
  r72: R72SourceOverlayV659,
  inputs: R73CatalogV660["inputs"],
  generatedAt: string,
): R73CatalogV660 {
  const checked = [inspectCandidateReviewPackV655(review),
    inspectR71SourceOverlayV658(r71), inspectR72SourceOverlayV659(r72)];
  if (checked.some((item) => !item.ok)) {
    throw new Error(`r73-source-pack-invalid:${checked.flatMap((item) => item.issues).join(",")}`);
  }
  if (!Number.isFinite(Date.parse(generatedAt)) || inputs.length !== 3) {
    throw new Error("r73-source-inputs-invalid");
  }
  const base: R73GalleryRowV660[] = review.rows.map((row, rank) => ({
    id: row.id, rank: rank + 1, cohort: row.batchId,
    title: row.title, nasaId: row.nasaId,
    sourcePageUrl: row.sourcePageUrl,
    sourcePageIdentity: "item-page",
    sourcePageSha256: row.sourcePageSha256,
    credit: row.sourceCredit, creditEvidence: "page-capture",
    imageState: "review-image",
    delivery: { ...row.preview.detail,
      route: `/api/atlas/mainline-a-nebula-review/${row.id}/detail`,
      mimeType: "image/webp", width: row.preview.detail.width!,
      height: row.preview.detail.height!, variant: "derived-preview" },
    rawEvidence: [pin("candidate-raw", row.candidateRaw),
      pin("official-raw", row.officialRaw),
      pin("thumb", row.preview.thumb), pin("detail", row.preview.detail)],
    sourceRawSha256: row.officialRaw.sha256,
    rawByteRelation: row.rawByteIdentical ? "identical" : "different",
    decodedPixelMatch: row.decodedPixelIdentical,
    blockers: ["rights-review-pending", "visual-signoff-pending",
      "runtime-candidate-only"],
    rightsStatus: "pending", runtimeAdmission: "candidate-only",
    hold: true, notAdmitted: true, scientificPayloadWriteback: false,
  }));
  const from71: R73GalleryRowV660[] = r71.rows.map((row, index) => ({
    id: row.id, rank: index + 13, cohort: "R71",
    title: row.title, nasaId: row.nasaId,
    sourcePageUrl: row.officialPageUrl,
    sourcePageIdentity: "item-page",
    sourcePageSha256: row.pageRaw!.sha256,
    credit: row.expectedCredit, creditEvidence: "page-capture",
    imageState: "review-image",
    delivery: { ...row.imageRaw!,
      route: `/api/atlas/mainline-a-r71-source/${row.id}/image`,
      mimeType: "image/jpeg", width: row.originalWidth!,
      height: row.originalHeight!, variant: "official-raw" },
    rawEvidence: [pin("page", row.pageRaw!),
      pin("official-raw", row.imageRaw!),
      pin("historical-raw", row.historicalLocalRaw!)],
    sourceRawSha256: row.imageRaw!.sha256,
    rawByteRelation: row.rawByteIdentical ? "identical" : "different",
    decodedPixelMatch: row.decodedPixelIdentical,
    blockers: ["rights-review-pending", "visual-signoff-pending",
      "runtime-candidate-only"],
    rightsStatus: "pending", runtimeAdmission: "candidate-only",
    hold: true, notAdmitted: true, scientificPayloadWriteback: false,
  }));
  const from72: R73GalleryRowV660[] = r72.rows.map((row, index) => ({
    id: row.id, rank: index + 19, cohort: "R72",
    title: row.title, nasaId: row.nasaId,
    sourcePageUrl: row.pageUrl,
    sourcePageIdentity: row.pageIdentityVerified ? "item-page" : "generic-shell",
    sourcePageSha256: row.pageRaw!.sha256,
    credit: row.expectedCredit,
    creditEvidence: row.currentStructuredCreditVerified
      ? "structured-current" : "historical-only",
    imageState: row.imageRaw ? "review-image" : "policy-hold",
    delivery: row.imageRaw ? { ...row.imageRaw,
      route: `/api/atlas/mainline-a-r72-source/${row.id}`,
      mimeType: "image/jpeg", width: row.originalWidth!,
      height: row.originalHeight!, variant: "official-raw" } : null,
    rawEvidence: [pin("page", row.pageRaw!),
      pin("search", row.searchRaw!), pin("asset", row.assetRaw!),
      ...(row.imageRaw ? [pin("official-raw", row.imageRaw)] : [])],
    sourceRawSha256: row.imageRaw?.sha256 ?? null,
    rawByteRelation: row.imageRaw
      ? row.rawByteIdentical ? "identical" : "different" : "unavailable",
    decodedPixelMatch: row.imageRaw ? row.decodedPixelIdentical : null,
    blockers: row.blockers,
    rightsStatus: "pending", runtimeAdmission: "candidate-only",
    hold: true, notAdmitted: true, scientificPayloadWriteback: false,
  }));
  const rows = [...base, ...from71, ...from72];
  const catalog: R73CatalogV660 = {
    schema: R73_CATALOG_SCHEMA_V660,
    evidenceClass: "local-source-linked-web-review-candidate",
    generatedAt, inputs, rows,
    counts: { total: 24, B1: 6, B2: 6, R71: 6, R72: 6,
      reviewImages: 19, policyHolds: 5, itemPages: 21,
      genericShells: 3, rightsSigned: 0, runtimeAdmitted: 0 },
    boundary: { candidateOnly: true, hold: true, notAdmitted: true,
      scientificPayloadWriteback: false, localReviewOnly: true,
      publicWebRelease: "blocked" },
    claims: { copyrightApproval: false, scientificValidity: false,
      productionPerformance: false, realUserValidation: false,
      physicalMobile: false, publicWebReleaseApproved: false },
  };
  const inspected = inspectR73CatalogV660(catalog);
  if (!inspected.ok) throw new Error(`r73-catalog-invalid:${inspected.issues.join(",")}`);
  return catalog;
}

function validPin(value: R73PinV660 | null | undefined) {
  return Boolean(value && typeof value.path === "string"
    && (value.path.startsWith("docs/release/v607/")
      || value.path.startsWith("source-cache/v592/nebulae/"))
    && !value.path.includes("\\") && !value.path.split("/").includes("..")
    && Number.isInteger(value.bytes) && value.bytes >= 100
    && SHA.test(value.sha256));
}

function expectedRoute(row: R73GalleryRowV660) {
  if (row.cohort === "B1" || row.cohort === "B2") {
    return `/api/atlas/mainline-a-nebula-review/${row.id}/detail`;
  }
  if (row.cohort === "R71") {
    return `/api/atlas/mainline-a-r71-source/${row.id}/image`;
  }
  return `/api/atlas/mainline-a-r72-source/${row.id}`;
}

export function inspectR73CatalogV660(catalog: R73CatalogV660) {
  const issues: string[] = [];
  const rows = Array.isArray(catalog?.rows) ? catalog.rows : [];
  if (catalog?.schema !== R73_CATALOG_SCHEMA_V660
    || catalog.evidenceClass !== "local-source-linked-web-review-candidate"
    || !Number.isFinite(Date.parse(catalog.generatedAt))
    || rows.length !== 24) issues.push("catalog-identity-invalid");
  if (catalog?.boundary?.candidateOnly !== true
    || catalog.boundary.hold !== true
    || catalog.boundary.notAdmitted !== true
    || catalog.boundary.scientificPayloadWriteback !== false
    || catalog.boundary.localReviewOnly !== true
    || catalog.boundary.publicWebRelease !== "blocked"
    || Object.values(catalog.claims ?? {}).some((value) => value !== false)) {
    issues.push("catalog-boundary-promoted");
  }
  const inputPaths = [
    "app/data/mainlineANebulaCandidateReviewV655.generated.json",
    "app/data/mainlineANebulaR71SourceV658.generated.json",
    "app/data/mainlineANebulaR72SourceV659.generated.json",
  ];
  if (catalog?.inputs?.length !== 3
    || ["B1B2", "R71", "R72"].some((role, index) => {
      const input = catalog.inputs[index];
      return !input || input.role !== role || input.path !== inputPaths[index]
        || !SHA.test(input.sha256)
        || !Number.isInteger(input.bytes) || input.bytes < 100;
    })) issues.push("catalog-inputs-invalid");
  const seenIds = new Set<string>();
  const seenNasa = new Set<string>();
  for (const [index, row] of rows.entries()) {
    const prefix = `${index}:${row?.id ?? "missing"}:`;
    if (!row || row.id !== R73_CATALOG_ORDER_V660[index]
      || !ID.test(row.id) || row.rank !== index + 1
      || seenIds.has(row.id) || seenNasa.has(row.nasaId)
      || !row.title || !row.nasaId || !row.credit
      || !/^https:\/\/(science\.nasa\.gov|images\.nasa\.gov)\//.test(row.sourcePageUrl)
      || !SHA.test(row.sourcePageSha256)) issues.push(`${prefix}identity-invalid`);
    if (!row) continue;
    seenIds.add(row.id);
    seenNasa.add(row.nasaId);
    const expectedCohort: R73CohortV660 = index < 6 ? "B1"
      : index < 12 ? "B2" : index < 18 ? "R71" : "R72";
    if (row?.cohort !== expectedCohort
      || row?.rightsStatus !== "pending"
      || row?.runtimeAdmission !== "candidate-only"
      || row?.hold !== true || row?.notAdmitted !== true
      || row?.scientificPayloadWriteback !== false
      || !Array.isArray(row?.blockers) || row.blockers.length === 0) {
      issues.push(`${prefix}admission-invalid`);
    }
    if (index < 18 && (row?.sourcePageIdentity !== "item-page"
      || row?.creditEvidence !== "page-capture")) {
      issues.push(`${prefix}page-or-credit-invalid`);
    }
    if (index >= 18 && row?.sourcePageIdentity === "generic-shell"
      && row.creditEvidence !== "historical-only") {
      issues.push(`${prefix}generic-page-credit-promoted`);
    }
    const evidencePins: readonly R73EvidencePinV660[] =
      Array.isArray(row.rawEvidence) ? row.rawEvidence : [];
    if (evidencePins.length < 3
      || evidencePins.some((evidence) => !validPin(evidence))
      || evidencePins.filter((evidence) =>
        evidence.role === "official-raw").length > 1) {
      issues.push(`${prefix}raw-evidence-invalid`);
    }
    const shouldLoad = index < 18 || row.id === "california-nebula";
    if (shouldLoad) {
      if (row?.imageState !== "review-image"
        || !validPin(row.delivery)
        || row.delivery?.route !== expectedRoute(row)
        || row.delivery.width < 1 || row.delivery.height < 1
        || row.delivery.mimeType !== (index < 12 ? "image/webp" : "image/jpeg")
        || row.delivery.variant !== (index < 12 ? "derived-preview" : "official-raw")
        || row.decodedPixelMatch !== true
        || !SHA.test(row.sourceRawSha256 ?? "")
        || !["identical", "different"].includes(row.rawByteRelation)
        || !evidencePins.some((evidence) => evidence.sha256 === row.sourceRawSha256)
        || !evidencePins.some((evidence) => evidence.sha256 === row.delivery?.sha256)) {
        issues.push(`${prefix}review-image-invalid`);
      }
    } else if (row?.imageState !== "policy-hold" || row.delivery !== null
      || row.sourceRawSha256 !== null || row.decodedPixelMatch !== null
      || row.rawByteRelation !== "unavailable"
      || evidencePins.some((evidence) => evidence.role === "official-raw")) {
      issues.push(`${prefix}blocked-image-promoted`);
    }
  }
  const counts = {
    total: rows.length,
    B1: rows.filter((row) => row.cohort === "B1").length,
    B2: rows.filter((row) => row.cohort === "B2").length,
    R71: rows.filter((row) => row.cohort === "R71").length,
    R72: rows.filter((row) => row.cohort === "R72").length,
    reviewImages: rows.filter((row) => row.imageState === "review-image").length,
    policyHolds: rows.filter((row) => row.imageState === "policy-hold").length,
    itemPages: rows.filter((row) => row.sourcePageIdentity === "item-page").length,
    genericShells: rows.filter((row) => row.sourcePageIdentity === "generic-shell").length,
    rightsSigned: rows.filter((row) => row.rightsStatus !== "pending").length,
    runtimeAdmitted: rows.filter((row) => row.runtimeAdmission !== "candidate-only").length,
  };
  if (JSON.stringify(counts) !== JSON.stringify(catalog?.counts)
    || counts.reviewImages !== 19 || counts.policyHolds !== 5
    || counts.itemPages !== 21 || counts.genericShells !== 3
    || counts.rightsSigned !== 0 || counts.runtimeAdmitted !== 0) {
    issues.push("catalog-counts-invalid");
  }
  return Object.freeze({ ok: issues.length === 0,
    issues: Object.freeze(issues), counts: Object.freeze(counts) });
}

export type R73GalleryFilterV660 = "all" | "review-image"
  | "policy-hold" | R73CohortV660 | "credit-limited";
export function visibleR73RowsV660(rows: readonly R73GalleryRowV660[],
  filter: R73GalleryFilterV660, query: string) {
  const needle = query.trim().toLocaleLowerCase();
  return rows.filter((row) => {
    if (filter === "review-image" && row.imageState !== "review-image") return false;
    if (filter === "policy-hold" && row.imageState !== "policy-hold") return false;
    if (filter === "credit-limited" && row.creditEvidence !== "historical-only") return false;
    if (["B1", "B2", "R71", "R72"].includes(filter)
      && row.cohort !== filter) return false;
    return !needle || [row.id, row.nasaId, row.title,
      r73DisplayNameV660(row), row.credit].some((part) =>
      part.toLocaleLowerCase().includes(needle));
  });
}
