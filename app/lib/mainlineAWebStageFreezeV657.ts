import { inspectCandidateReviewPackV655,
  type CandidateReviewPackV655 } from "./mainlineANebulaReviewAssetV655";
import { coveragePackValidationErrorsV622,
  type CoveragePackV622 } from "./mainlineACanonicalCoverageV622";
import { inspectWebSkyAtlasV656,
  type WebSkyAtlasPackV656 } from "./mainlineAWebSkyV656";

export const WEB_STAGE_SCHEMA_V657 = "mainline-a-web-stage-freeze-v657" as const;
export const WEB_STAGE_MIN_LONGRUN_MS_V657 = 30 * 60 * 1000;

export type WebStageCandidateV657 = Readonly<{
  id: string;
  batchId: "B1" | "B2";
  nasaId: string;
  title: string;
  sourcePageUrl: string;
  sourceCredit: string;
  officialJpegUrl: string;
  sourcePageSha256: string;
  candidateRawSha256: string;
  officialRawSha256: string;
  pixelSha256: string;
  rawByteIdentical: boolean;
  decodedPixelIdentical: true;
  originalDimensions: readonly [number, number];
  localRoutes: Readonly<{ thumb: string; detail: string; raw: string }>;
  rightsStatus: "pending";
  runtimeAdmission: "candidate-only";
  scientificPayloadWriteback: false;
}>;

export type WebStageFreezeDataV657 = Readonly<{
  schema: typeof WEB_STAGE_SCHEMA_V657;
  status: "candidate-data-valid" | "invalid";
  evidenceScope: "static-local-manifest";
  rows: readonly WebStageCandidateV657[];
  counts: Readonly<{
    candidateImages: number;
    sourcePages: number;
    officialJpegs: number;
    decodedPixelMatches: number;
    rawByteMatches: number;
    canonicalStars: number;
    canonicalNebulae: number;
    canonicalConstellations: number;
    betaStars: number;
    runtimeExistingStars: number;
    identityHoldStars: number;
    componentIdentitySigned: number;
    imageRightsSigned: number;
  }>;
  issues: readonly string[];
  gates: Readonly<{
    localCandidateData: "valid" | "invalid";
    technicalFreeze: "pending-runtime-evidence";
    rights: "pending-0-of-12";
    componentIdentity: "pending-0-of-4";
    publicRelease: "blocked";
    rootAlignment: "out-of-scope-web-only";
    physicalMobile: "not-run";
  }>;
  boundary: Readonly<{
    candidateOnly: true;
    hold: true;
    notAdmitted: true;
    scientificPayloadWriteback: false;
    runtimePromotion: "closed";
  }>;
}>;

export type WebStageRuntimeEvidenceV657 = Readonly<{
  sourceSha256: string;
  buildSourceSha256: string;
  buildStatus: "passed" | "failed";
  homeStatus: number;
  healthStatus: number;
  skyMetadataStatus: number;
  servedCandidateVariants: number;
  servedCandidateShaMatches: number;
  canonicalSelections: number;
  candidateDetailsOpened: number;
  browserPageErrors: number;
  objectUrlsAfterClose: number;
  longRuns: readonly Readonly<{
    device: "desktop" | "mobile-viewport";
    durationMs: number;
    visibilityInterruptions: number;
    resourceRestored: boolean;
    sourceSha256: string;
  }>[];
}>;

export type WebStageTechnicalDecisionV657 = Readonly<{
  status: "technical-candidate-ready" | "technical-evidence-incomplete";
  reasons: readonly string[];
  publicReleaseApproved: false;
  copyrightApproved: false;
  scientificValidityApproved: false;
  productionPerformanceApproved: false;
  candidateOnly: true;
  scientificPayloadWriteback: false;
}>;

const SHA = /^[a-f0-9]{64}$/;
const REVIEW_ROUTE = "/api/atlas/mainline-a-nebula-review";
const unique = (values: readonly string[]) => new Set(values).size === values.length;

export function buildWebStageFreezeDataV657(
  review: CandidateReviewPackV655,
  sky: WebSkyAtlasPackV656,
  canonical: CoveragePackV622,
): WebStageFreezeDataV657 {
  const issues: string[] = [];
  const reviewCheck = inspectCandidateReviewPackV655(review);
  const skyCheck = inspectWebSkyAtlasV656(sky);
  issues.push(...reviewCheck.issues.map((item) => `images:${item}`));
  issues.push(...skyCheck.issues.map((item) => `sky:${item}`));
  issues.push(...coveragePackValidationErrorsV622(canonical)
    .map((item) => `canonical:${item}`));
  const candidateRows = Array.isArray(review?.rows) ? review.rows : [];
  const canonicalRows = Array.isArray(canonical?.records) ? canonical.records : [];
  const skyStars = Array.isArray(sky?.stars) ? sky.stars : [];
  const skyConstellations = Array.isArray(sky?.constellations)
    ? sky.constellations : [];
  const rows = candidateRows.map((row): WebStageCandidateV657 => ({
    id: row.id, batchId: row.batchId, nasaId: row.nasaId, title: row.title,
    sourcePageUrl: row.sourcePageUrl, sourceCredit: row.sourceCredit,
    officialJpegUrl: row.officialJpegUrl,
    sourcePageSha256: row.sourcePageSha256,
    candidateRawSha256: row.candidateRaw.sha256,
    officialRawSha256: row.officialRaw.sha256,
    pixelSha256: row.pixelSha256,
    rawByteIdentical: row.rawByteIdentical,
    decodedPixelIdentical: true,
    originalDimensions: [row.originalWidth, row.originalHeight],
    localRoutes: {
      thumb: `${REVIEW_ROUTE}/${row.id}/thumb`,
      detail: `${REVIEW_ROUTE}/${row.id}/detail`,
      raw: `${REVIEW_ROUTE}/${row.id}/raw`,
    },
    rightsStatus: "pending", runtimeAdmission: "candidate-only",
    scientificPayloadWriteback: false,
  }));
  const counts = {
    candidateImages: rows.length,
    sourcePages: rows.filter((row) => SHA.test(row.sourcePageSha256)).length,
    officialJpegs: rows.filter((row) => SHA.test(row.officialRawSha256)).length,
    decodedPixelMatches: rows.filter((row) => row.decodedPixelIdentical).length,
    rawByteMatches: rows.filter((row) => row.rawByteIdentical).length,
    canonicalStars: canonicalRows.filter((row) => row.kind === "star").length,
    canonicalNebulae: canonicalRows.filter((row) => row.kind === "nebula").length,
    canonicalConstellations: canonicalRows.filter((row) =>
      row.kind === "constellation").length,
    betaStars: skyStars.length,
    runtimeExistingStars: skyStars.filter((row) =>
      row.phase === "runtime-existing").length,
    identityHoldStars: skyStars.filter((row) =>
      row.phase === "candidate-hold").length,
    componentIdentitySigned: skyStars.filter((row) =>
      row.componentReview === "confirmed").length,
    imageRightsSigned: candidateRows.filter((row) =>
      row.rightsStatus !== "pending").length,
  };
  if (!unique(rows.map((row) => row.id))
    || !unique(rows.map((row) => row.nasaId))
    || counts.candidateImages !== 12
    || counts.sourcePages !== 12 || counts.officialJpegs !== 12
    || counts.decodedPixelMatches !== 12
    || counts.canonicalStars !== 12
    || counts.canonicalNebulae !== 12
    || counts.canonicalConstellations !== 12
    || skyConstellations.length !== 12
    || counts.betaStars !== 24
    || counts.runtimeExistingStars !== 20
    || counts.identityHoldStars !== 4
    || counts.componentIdentitySigned !== 0
    || counts.imageRightsSigned !== 0) {
    issues.push("cross-track-count-or-admission-drift");
  }
  if (rows.some((row) => !row.sourcePageUrl.startsWith(
    "https://science.nasa.gov/photojournal/")
    || !row.officialJpegUrl.startsWith("https://assets.science.nasa.gov/")
    || !SHA.test(row.candidateRawSha256)
    || !SHA.test(row.pixelSha256))) {
    issues.push("source-link-or-raw-pin-drift");
  }
  return Object.freeze({
    schema: WEB_STAGE_SCHEMA_V657,
    status: issues.length === 0 ? "candidate-data-valid" : "invalid",
    evidenceScope: "static-local-manifest",
    rows: Object.freeze(rows), counts: Object.freeze(counts),
    issues: Object.freeze(issues),
    gates: Object.freeze({
      localCandidateData: issues.length === 0 ? "valid" : "invalid",
      technicalFreeze: "pending-runtime-evidence",
      rights: "pending-0-of-12", componentIdentity: "pending-0-of-4",
      publicRelease: "blocked", rootAlignment: "out-of-scope-web-only",
      physicalMobile: "not-run",
    }),
    boundary: Object.freeze({ candidateOnly: true, hold: true,
      notAdmitted: true, scientificPayloadWriteback: false,
      runtimePromotion: "closed" }),
  });
}

export function evaluateWebStageRuntimeEvidenceV657(
  data: WebStageFreezeDataV657,
  evidence: WebStageRuntimeEvidenceV657,
): WebStageTechnicalDecisionV657 {
  const reasons: string[] = [];
  if (data.status !== "candidate-data-valid" || data.issues.length !== 0)
    reasons.push("candidate-data-invalid");
  if (!SHA.test(evidence.sourceSha256)
    || evidence.sourceSha256 !== evidence.buildSourceSha256
    || evidence.buildStatus !== "passed")
    reasons.push("build-source-identity-mismatch");
  if (evidence.homeStatus !== 200 || evidence.healthStatus !== 200
    || evidence.skyMetadataStatus !== 200)
    reasons.push("web-route-http-incomplete");
  if (evidence.servedCandidateVariants !== 36
    || evidence.servedCandidateShaMatches !== 36)
    reasons.push("candidate-image-bytes-incomplete");
  if (evidence.canonicalSelections !== 72
    || evidence.candidateDetailsOpened !== 24)
    reasons.push("browser-route-coverage-incomplete");
  if (evidence.browserPageErrors !== 0
    || evidence.objectUrlsAfterClose !== 0)
    reasons.push("browser-error-or-resource-leak");
  if (evidence.longRuns.length !== 2
    || !unique(evidence.longRuns.map((row) => row.device))
    || !evidence.longRuns.some((row) => row.device === "desktop")
    || !evidence.longRuns.some((row) => row.device === "mobile-viewport")
    || evidence.longRuns.some((row) =>
      row.durationMs < WEB_STAGE_MIN_LONGRUN_MS_V657
      || row.visibilityInterruptions !== 0
      || row.resourceRestored !== true
      || row.sourceSha256 !== evidence.sourceSha256))
    reasons.push("current-source-longruns-incomplete");
  return Object.freeze({
    status: reasons.length === 0
      ? "technical-candidate-ready" : "technical-evidence-incomplete",
    reasons: Object.freeze(reasons), publicReleaseApproved: false,
    copyrightApproved: false, scientificValidityApproved: false,
    productionPerformanceApproved: false, candidateOnly: true,
    scientificPayloadWriteback: false,
  });
}
