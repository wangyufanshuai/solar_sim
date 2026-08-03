import { createHash } from "node:crypto";

import {
  parseKerrPolarimeterNonlinearObservablesArtifactV417,
  type KerrPolarimeterNonlinearObservablesArtifactV417,
  type KerrPolarimeterNonlinearRayV417,
} from "./kerrPolarimeterNonlinearObservablesV417";
import {
  parseKerrSciencePhotonBandViewV328,
  type KerrSciencePhotonBandViewV328,
} from "./kerrSciencePhotonBandsV328";

export const KERR_SPARSE_POLARIMETRIC_PRODUCT_VERSION_V418 =
  "v418-kerr-sparse-polarimetric-diagnostic-product-v1" as const;
export const KERR_SPARSE_POLARIMETRIC_ARTIFACT_VERSION_V418 =
  "v418-kerr-sparse-polarimetric-diagnostic-artifact-v1" as const;
export const KERR_SPARSE_POLARIMETRIC_SUMMARY_VERSION_V418 =
  "v418-kerr-sparse-polarimetric-diagnostic-summary-v1" as const;
export const KERR_SPARSE_POLARIMETRIC_RESPONSE_VERSION_V418 =
  "v418-kerr-sparse-polarimetric-diagnostic-response-v1" as const;
export const KERR_POLARIZATION_EVIDENCE_SHA256_V297 =
  "a3ac11de0ad8dc48c742507f8aee169c53a3c983cb7a38fbf41eb580b4d58854" as const;
export const KERR_PHOTON_RADIANCE_ARTIFACT_SHA256_V328 =
  "16a8d7ff382203a24ee4565101b8fb5580e046af99f47612269f66655bb8a91e" as const;
export const KERR_NONLINEAR_OBSERVABLES_ARTIFACT_SHA256_V417 =
  "723b8b71c97b3cb2cfc0706e8d242083d7449cbe33bce087ef097975198e1e61" as const;

type Matrix = readonly (readonly number[])[];
type NoiseFamily = "counting" | "calibration";

export type KerrStandardizedConfidenceEllipseV418 = Readonly<{
  family: NoiseFamily;
  confidenceProbability: number;
  marginalSigmaPL: number;
  marginalSigmaEvpaRad: number;
  marginalSigmaEvpaDeg: number;
  correlationPLWithEvpa: number;
  standardizedSemiMajorSigma: number;
  standardizedSemiMinorSigma: number;
  standardizedRotationDeg: 45 | -45;
  maximumOneSigmaCoverageAbsoluteError: number;
  semantic: "joint-68-percent-standardized-pL-EVPA-fixture-ellipse";
}>;

export type KerrSparsePolarimetricRowV418 = Readonly<{
  rayIndex: 12 | 13 | 14 | 15;
  rayId: "disk-00" | "disk-01" | "disk-02" | "disk-03";
  spinA: number;
  classification: "disk-hit";
  emissionRadiusM: number;
  redshiftFactor: number;
  effectiveTemperatureK: number;
  authorityPolarization: Readonly<{
    walkerPenroseEvpaDeg: number;
    parallelTransportEvpaDeg: number;
    evpaDifferenceDeg: number;
    applicability: "applicable-disk-hit";
    source: "v297-release-branch-A";
  }>;
  instrumentFixture: Readonly<{
    fixturePL: number;
    fixturePC: number;
    fixtureEvpaDeg: number;
    counting: KerrStandardizedConfidenceEllipseV418;
    calibration: KerrStandardizedConfidenceEllipseV418;
    observedPolarization: "unavailable";
    measuredDetectorAuthority: "unavailable";
    authorityEvpaReplacementAllowed: false;
  }>;
  imagePlane: Readonly<{
    alpha: null;
    beta: null;
    status: "unavailable";
    reason: "v297-and-v328-do-not-provide-image-plane-coordinates";
  }>;
}>;

export type KerrSparsePolarimetricProductViewV418 = Readonly<{
  version: typeof KERR_SPARSE_POLARIMETRIC_PRODUCT_VERSION_V418;
  status: "qualified-four-ray-authority-diagnostic-product-not-a-polarimetric-image";
  source: Readonly<{
    v297PolarizationEvidenceSha256: typeof KERR_POLARIZATION_EVIDENCE_SHA256_V297;
    v328PhotonRadianceArtifactSha256: typeof KERR_PHOTON_RADIANCE_ARTIFACT_SHA256_V328;
    v417NonlinearObservablesArtifactSha256: typeof KERR_NONLINEAR_OBSERVABLES_ARTIFACT_SHA256_V417;
  }>;
  counts: Readonly<{
    diagnosticRowCount: 4;
    authorityEvpaCount: 4;
    instrumentFixtureEllipseCount: 8;
    imagePlaneCoordinateCount: 0;
  }>;
  rows: readonly KerrSparsePolarimetricRowV418[];
  products: Readonly<{
    json: "available-science-diagnostic-table";
    csv: "available-science-diagnostic-table";
    fitsBinaryTable: "available-science-diagnostic-table-not-image-HDU";
    png: "available-diagnostic-strip-only-not-science-image";
    fitsImage: "unavailable-dense-and-screen-coordinate-boundary";
    scienceImageMap: "unavailable-dense-and-screen-coordinate-boundary";
  }>;
  renderingBoundary: Readonly<{
    science: "linear-deterministic-authority-strip-no-bloom-no-noise-no-grade";
    cinematic: "seeded-presentation-may-style-strip-but-cannot-mutate-authority-fields";
    scienceBufferMutationAllowed: false;
    cinematicAuthorityMutationAllowed: false;
  }>;
  measuredPolarization: "unavailable";
  denseCampaignStatus: "incomplete-0-of-49";
  browserQualification: "not-run";
  boundary: "four-ray-authority-diagnostic-strip-with-instrument-fixture-precision-not-observed-polarimetric-image";
}>;

export type KerrSparsePolarimetricArtifactV418 = Readonly<{
  version: typeof KERR_SPARSE_POLARIMETRIC_ARTIFACT_VERSION_V418;
  generatedAt: string;
  status: KerrSparsePolarimetricProductViewV418["status"];
  sourceFiles: Readonly<{
    v297FileSha256: string;
    v328FileSha256: string;
    v417FileSha256: string;
  }>;
  view: KerrSparsePolarimetricProductViewV418;
  deterministicReplay: true;
  networkAttempted: false;
  denseShardExecuted: false;
  scienceImageGenerated: false;
  browserQualification: "not-run";
  artifactSha256: string;
}>;

export type KerrSparsePolarimetricSummaryV418 = Readonly<{
  version: typeof KERR_SPARSE_POLARIMETRIC_SUMMARY_VERSION_V418;
  status: KerrSparsePolarimetricProductViewV418["status"];
  artifactSha256: string;
  rows: readonly Readonly<{
    rayIndex: 12 | 13 | 14 | 15;
    rayId: KerrSparsePolarimetricRowV418["rayId"];
    spinA: number;
    emissionRadiusM: number;
    redshiftFactor: number;
    authorityEvpaDeg: number;
    parallelTransportEvpaDeg: number;
    calibrationSigmaEvpaDeg: number;
    calibrationConfidenceEllipse: Readonly<{
      semiMajorSigma: number;
      semiMinorSigma: number;
      rotationDeg: 45 | -45;
      semantic: "joint-68-percent-standardized-pL-EVPA-fixture-ellipse";
    }>;
    imagePlaneStatus: "unavailable";
  }>[];
  products: KerrSparsePolarimetricProductViewV418["products"];
  measuredPolarization: "unavailable";
  denseCampaignStatus: "incomplete-0-of-49";
  fullArtifactAvailable: true;
  boundary: "bounded-four-row-summary-no-covariance-matrices-in-react-state";
}>;

export type KerrSparsePolarimetricResponseV418 = Readonly<{
  version: typeof KERR_SPARSE_POLARIMETRIC_RESPONSE_VERSION_V418;
  available: boolean;
  reason: "ready" | "lite-boundary" | "local-shadow-only" | "evidence-corrupt" | "request-failed";
  summary: KerrSparsePolarimetricSummaryV418 | null;
}>;

type V297Payload = Readonly<{
  rayId: KerrSparsePolarimetricRowV418["rayId"];
  spin: number;
  toleranceClass: "release" | "internal";
  branch: "A" | "B";
  emissionRadiusM: number;
  walkerPenroseEvpaDeg: number;
  parallelTransportEvpaDeg: number;
  evpaDifferenceDeg: number;
  applicability: "applicable-disk-hit";
  passed: boolean;
}>;
type V297Artifact = Readonly<{
  version: string;
  status: string;
  qualified: boolean;
  evidenceSha256: string;
  uniqueDiskRayCount: number;
  applicableExecutionCount: number;
  captureEscapeNotApplicableCount: number;
  payloads: readonly V297Payload[];
}>;

const SHA = /^[a-f0-9]{64}$/;
const RAY_IDS = ["disk-00", "disk-01", "disk-02", "disk-03"] as const;
const RAY_INDICES = [12, 13, 14, 15] as const;
const JOINT_68_PROBABILITY = 0.6826894921370859;
const RAD_TO_DEG = 180 / Math.PI;
const transient = new Set(["generatedAt", "artifactSha256"]);

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([key]) => !transient.has(key))
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, canonicalize(entry)]),
  );
}
export const canonicalShaV418 = (value: unknown): string =>
  createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");

function parseV297(value: unknown): V297Artifact {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value as Partial<V297Artifact> : null;
  if (
    !source ||
    source.version !== "v297-kerr-disk-polarization-short-gate-v1" ||
    source.status !== "full-kerr-short-authority-qualified" ||
    source.qualified !== true ||
    source.evidenceSha256 !== KERR_POLARIZATION_EVIDENCE_SHA256_V297 ||
    source.uniqueDiskRayCount !== 4 ||
    source.applicableExecutionCount !== 16 ||
    source.captureEscapeNotApplicableCount !== 96 ||
    !Array.isArray(source.payloads) ||
    source.payloads.length !== 16
  ) throw new Error("v418-v297-authority-lock");
  return value as V297Artifact;
}

function statistics(ray: KerrPolarimeterNonlinearRayV417, family: NoiseFamily, observable: "pL" | "evpa") {
  const rows = family === "counting" ? ray.countingStatistics : ray.calibrationStatistics;
  const result = rows.find((row) => row.observable === observable);
  if (!result) throw new Error(`v418-${family}-${observable}-statistics`);
  return result;
}

function ellipse(ray: KerrPolarimeterNonlinearRayV417, family: NoiseFamily): KerrStandardizedConfidenceEllipseV418 {
  const covariance = (family === "counting" ? ray.countingObservableCovariance : ray.calibrationObservableCovariance) as Matrix;
  const pL = statistics(ray, family, "pL");
  const evpa = statistics(ray, family, "evpa");
  const sigmaPL = Math.sqrt(covariance[0][0]);
  const sigmaEvpa = Math.sqrt(covariance[2][2]);
  const correlation = covariance[0][2] / (sigmaPL * sigmaEvpa);
  if (![sigmaPL, sigmaEvpa, correlation].every(Number.isFinite) || sigmaPL <= 0 || sigmaEvpa <= 0 || Math.abs(correlation) >= 1) {
    throw new Error(`v418-${family}-ellipse`);
  }
  const radius = Math.sqrt(-2 * Math.log(1 - JOINT_68_PROBABILITY));
  return Object.freeze({
    family,
    confidenceProbability: JOINT_68_PROBABILITY,
    marginalSigmaPL: sigmaPL,
    marginalSigmaEvpaRad: sigmaEvpa,
    marginalSigmaEvpaDeg: sigmaEvpa * RAD_TO_DEG,
    correlationPLWithEvpa: correlation,
    standardizedSemiMajorSigma: radius * Math.sqrt(1 + Math.abs(correlation)),
    standardizedSemiMinorSigma: radius * Math.sqrt(1 - Math.abs(correlation)),
    standardizedRotationDeg: correlation >= 0 ? 45 : -45,
    maximumOneSigmaCoverageAbsoluteError: Math.max(pL.coverageOneSigmaAbsoluteError, evpa.coverageOneSigmaAbsoluteError),
    semantic: "joint-68-percent-standardized-pL-EVPA-fixture-ellipse",
  });
}

export function createKerrSparsePolarimetricProductV418(
  polarizationValue: unknown,
  photonValue: unknown,
  nonlinearValue: unknown,
): KerrSparsePolarimetricProductViewV418 {
  const polarization = parseV297(polarizationValue);
  const photonOuter = photonValue as { artifactSha256?: unknown; view?: unknown };
  if (photonOuter.artifactSha256 !== KERR_PHOTON_RADIANCE_ARTIFACT_SHA256_V328) throw new Error("v418-v328-artifact-lock");
  const photon: KerrSciencePhotonBandViewV328 = parseKerrSciencePhotonBandViewV328(photonOuter.view);
  const nonlinear: KerrPolarimeterNonlinearObservablesArtifactV417 =
    parseKerrPolarimeterNonlinearObservablesArtifactV417(nonlinearValue);
  if (nonlinear.artifactSha256 !== KERR_NONLINEAR_OBSERVABLES_ARTIFACT_SHA256_V417) {
    throw new Error("v418-v417-artifact-lock");
  }
  const rows = RAY_INDICES.map((rayIndex, offset): KerrSparsePolarimetricRowV418 => {
    const rayId = RAY_IDS[offset];
    const authority = polarization.payloads.find(
      (entry) => entry.rayId === rayId && entry.toleranceClass === "release" && entry.branch === "A",
    );
    const photonRay = photon.rays.find((entry) => entry.rayIndex === rayIndex);
    const instrumentRay = nonlinear.view.rays.find((entry) => entry.rayIndex === rayIndex);
    if (!authority || !photonRay || !instrumentRay || !authority.passed || authority.applicability !== "applicable-disk-hit") {
      throw new Error(`v418-row-source:${rayIndex}`);
    }
    if (authority.spin !== photonRay.spinA) throw new Error(`v418-spin-map:${rayIndex}`);
    return Object.freeze({
      rayIndex,
      rayId,
      spinA: authority.spin,
      classification: "disk-hit",
      emissionRadiusM: authority.emissionRadiusM,
      redshiftFactor: photonRay.redshiftFactor,
      effectiveTemperatureK: photonRay.effectiveTemperatureK,
      authorityPolarization: Object.freeze({
        walkerPenroseEvpaDeg: authority.walkerPenroseEvpaDeg,
        parallelTransportEvpaDeg: authority.parallelTransportEvpaDeg,
        evpaDifferenceDeg: authority.evpaDifferenceDeg,
        applicability: "applicable-disk-hit",
        source: "v297-release-branch-A",
      }),
      instrumentFixture: Object.freeze({
        fixturePL: nonlinear.view.truth.pL,
        fixturePC: nonlinear.view.truth.pC,
        fixtureEvpaDeg: nonlinear.view.truth.evpaDeg,
        counting: ellipse(instrumentRay, "counting"),
        calibration: ellipse(instrumentRay, "calibration"),
        observedPolarization: "unavailable",
        measuredDetectorAuthority: "unavailable",
        authorityEvpaReplacementAllowed: false,
      }),
      imagePlane: Object.freeze({
        alpha: null,
        beta: null,
        status: "unavailable",
        reason: "v297-and-v328-do-not-provide-image-plane-coordinates",
      }),
    });
  });
  return Object.freeze({
    version: KERR_SPARSE_POLARIMETRIC_PRODUCT_VERSION_V418,
    status: "qualified-four-ray-authority-diagnostic-product-not-a-polarimetric-image",
    source: Object.freeze({
      v297PolarizationEvidenceSha256: KERR_POLARIZATION_EVIDENCE_SHA256_V297,
      v328PhotonRadianceArtifactSha256: KERR_PHOTON_RADIANCE_ARTIFACT_SHA256_V328,
      v417NonlinearObservablesArtifactSha256: KERR_NONLINEAR_OBSERVABLES_ARTIFACT_SHA256_V417,
    }),
    counts: Object.freeze({ diagnosticRowCount: 4, authorityEvpaCount: 4, instrumentFixtureEllipseCount: 8, imagePlaneCoordinateCount: 0 }),
    rows: Object.freeze(rows),
    products: Object.freeze({
      json: "available-science-diagnostic-table",
      csv: "available-science-diagnostic-table",
      fitsBinaryTable: "available-science-diagnostic-table-not-image-HDU",
      png: "available-diagnostic-strip-only-not-science-image",
      fitsImage: "unavailable-dense-and-screen-coordinate-boundary",
      scienceImageMap: "unavailable-dense-and-screen-coordinate-boundary",
    }),
    renderingBoundary: Object.freeze({
      science: "linear-deterministic-authority-strip-no-bloom-no-noise-no-grade",
      cinematic: "seeded-presentation-may-style-strip-but-cannot-mutate-authority-fields",
      scienceBufferMutationAllowed: false,
      cinematicAuthorityMutationAllowed: false,
    }),
    measuredPolarization: "unavailable",
    denseCampaignStatus: "incomplete-0-of-49",
    browserQualification: "not-run",
    boundary: "four-ray-authority-diagnostic-strip-with-instrument-fixture-precision-not-observed-polarimetric-image",
  });
}

export function createKerrSparsePolarimetricSummaryV418(value: unknown): KerrSparsePolarimetricSummaryV418 {
  const artifact = parseKerrSparsePolarimetricArtifactV418(value);
  return Object.freeze({
    version: KERR_SPARSE_POLARIMETRIC_SUMMARY_VERSION_V418,
    status: artifact.status,
    artifactSha256: artifact.artifactSha256,
    rows: Object.freeze(artifact.view.rows.map((row) => Object.freeze({
      rayIndex: row.rayIndex,
      rayId: row.rayId,
      spinA: row.spinA,
      emissionRadiusM: row.emissionRadiusM,
      redshiftFactor: row.redshiftFactor,
      authorityEvpaDeg: row.authorityPolarization.walkerPenroseEvpaDeg,
      parallelTransportEvpaDeg: row.authorityPolarization.parallelTransportEvpaDeg,
      calibrationSigmaEvpaDeg: row.instrumentFixture.calibration.marginalSigmaEvpaDeg,
      calibrationConfidenceEllipse: Object.freeze({
        semiMajorSigma: row.instrumentFixture.calibration.standardizedSemiMajorSigma,
        semiMinorSigma: row.instrumentFixture.calibration.standardizedSemiMinorSigma,
        rotationDeg: row.instrumentFixture.calibration.standardizedRotationDeg,
        semantic: row.instrumentFixture.calibration.semantic,
      }),
      imagePlaneStatus: row.imagePlane.status,
    }))),
    products: artifact.view.products,
    measuredPolarization: "unavailable",
    denseCampaignStatus: "incomplete-0-of-49",
    fullArtifactAvailable: true,
    boundary: "bounded-four-row-summary-no-covariance-matrices-in-react-state",
  });
}

export function parseKerrSparsePolarimetricArtifactV418(value: unknown): KerrSparsePolarimetricArtifactV418 {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value as Partial<KerrSparsePolarimetricArtifactV418> : null;
  const rows = source?.view?.rows ?? [];
  if (
    !source ||
    source.version !== KERR_SPARSE_POLARIMETRIC_ARTIFACT_VERSION_V418 ||
    source.status !== "qualified-four-ray-authority-diagnostic-product-not-a-polarimetric-image" ||
    !SHA.test(source.sourceFiles?.v297FileSha256 ?? "") ||
    !SHA.test(source.sourceFiles?.v328FileSha256 ?? "") ||
    !SHA.test(source.sourceFiles?.v417FileSha256 ?? "") ||
    source.view?.version !== KERR_SPARSE_POLARIMETRIC_PRODUCT_VERSION_V418 ||
    source.view.counts.diagnosticRowCount !== 4 ||
    source.view.counts.imagePlaneCoordinateCount !== 0 ||
    rows.length !== 4 ||
    rows.some((row, index) => row.rayIndex !== RAY_INDICES[index] || row.rayId !== RAY_IDS[index] || row.imagePlane.alpha !== null || row.imagePlane.beta !== null || row.instrumentFixture.authorityEvpaReplacementAllowed !== false) ||
    source.view.products.fitsImage !== "unavailable-dense-and-screen-coordinate-boundary" ||
    source.view.products.scienceImageMap !== "unavailable-dense-and-screen-coordinate-boundary" ||
    source.view.renderingBoundary.scienceBufferMutationAllowed !== false ||
    source.view.renderingBoundary.cinematicAuthorityMutationAllowed !== false ||
    source.view.measuredPolarization !== "unavailable" ||
    source.view.denseCampaignStatus !== "incomplete-0-of-49" ||
    source.deterministicReplay !== true ||
    source.networkAttempted !== false ||
    source.denseShardExecuted !== false ||
    source.scienceImageGenerated !== false ||
    source.browserQualification !== "not-run" ||
    !SHA.test(source.artifactSha256 ?? "")
  ) throw new Error("v418-artifact-identity");
  return value as KerrSparsePolarimetricArtifactV418;
}

export function parseKerrSparsePolarimetricSummaryV418(value: unknown): KerrSparsePolarimetricSummaryV418 {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value as Partial<KerrSparsePolarimetricSummaryV418> : null;
  if (!source || source.version !== KERR_SPARSE_POLARIMETRIC_SUMMARY_VERSION_V418 || !SHA.test(source.artifactSha256 ?? "") || source.rows?.length !== 4 || source.rows.some((row) => row.calibrationConfidenceEllipse.semantic !== "joint-68-percent-standardized-pL-EVPA-fixture-ellipse" || !(row.calibrationConfidenceEllipse.semiMajorSigma > row.calibrationConfidenceEllipse.semiMinorSigma)) || source.measuredPolarization !== "unavailable" || source.denseCampaignStatus !== "incomplete-0-of-49" || source.boundary !== "bounded-four-row-summary-no-covariance-matrices-in-react-state") {
    throw new Error("v418-summary-identity");
  }
  return value as KerrSparsePolarimetricSummaryV418;
}

export function parseKerrSparsePolarimetricResponseV418(value: unknown): KerrSparsePolarimetricResponseV418 {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value as Partial<KerrSparsePolarimetricResponseV418> : null;
  if (!source || source.version !== KERR_SPARSE_POLARIMETRIC_RESPONSE_VERSION_V418) throw new Error("v418-response-version");
  if (source.available === true && source.reason === "ready" && source.summary) return Object.freeze({ ...source, summary: parseKerrSparsePolarimetricSummaryV418(source.summary) }) as KerrSparsePolarimetricResponseV418;
  if (source.available === false && source.summary === null && ["lite-boundary", "local-shadow-only", "evidence-corrupt", "request-failed"].includes(source.reason ?? "")) return source as KerrSparsePolarimetricResponseV418;
  throw new Error("v418-response-identity");
}

const csvCell = (value: string | number | null) => value === null ? "" : String(value).includes(",") ? `"${String(value).replaceAll('"', '""')}"` : String(value);
export function serializeKerrSparsePolarimetricCsvV418(view: KerrSparsePolarimetricProductViewV418): string {
  const header = ["ray_index", "ray_id", "spin_a", "classification", "emission_radius_M", "redshift_factor", "effective_temperature_K", "authority_wp_evpa_deg", "authority_pt_evpa_deg", "authority_evpa_difference_deg", "fixture_pL", "fixture_pC", "counting_sigma_pL", "counting_sigma_evpa_deg", "calibration_sigma_pL", "calibration_sigma_evpa_deg", "image_alpha", "image_beta", "image_plane_status"];
  const rows = view.rows.map((row) => [row.rayIndex, row.rayId, row.spinA, row.classification, row.emissionRadiusM, row.redshiftFactor, row.effectiveTemperatureK, row.authorityPolarization.walkerPenroseEvpaDeg, row.authorityPolarization.parallelTransportEvpaDeg, row.authorityPolarization.evpaDifferenceDeg, row.instrumentFixture.fixturePL, row.instrumentFixture.fixturePC, row.instrumentFixture.counting.marginalSigmaPL, row.instrumentFixture.counting.marginalSigmaEvpaDeg, row.instrumentFixture.calibration.marginalSigmaPL, row.instrumentFixture.calibration.marginalSigmaEvpaDeg, null, null, row.imagePlane.status]);
  return `${[header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n")}\n`;
}
