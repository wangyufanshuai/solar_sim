import {
  KERR_DENSE_RAY_PLAN_FILE_SHA256_V298R1,
  KERR_DENSE_RAY_PLAN_SHA256_V298R1,
  type KerrDenseRayPlanEntryV298R1,
} from "./kerrCampaignV298R1";
import {
  KERR_CORRECTED_DENSE_RAY_PLAN_FILE_SHA256_V314,
  KERR_CORRECTED_DENSE_RAY_PLAN_SHA256_V314,
  KERR_FULL_SHORT_AUTHORITY_SHA256_V314,
  type KerrCorrectedDenseRayPlanEntryV314,
} from "./kerrCampaignV314";
import {
  KERR_CORRECTED_AUTHORITY_EVIDENCE_SHA256_V312,
  parseKerrCorrectedAuthorityV312,
} from "./kerrAuthorityV312";
import {
  KERR_GEOMETRY_AUTHORITY_EVIDENCE_SHA256_V313,
  KERR_POLARIZATION_AUTHORITY_EVIDENCE_SHA256_V313,
  parseKerrPolarizationRequalificationV313,
} from "./kerrAuthorityV313";
import {
  KERR_SCIENCE_OBSERVER_SOURCE_SHA256_V299,
  createSparseKerrSciencePayloadV299,
  validateKerrScienceTransferPayloadV299,
  type KerrScienceTransferPayloadV299,
} from "./strongGravityRenderingV299";

export const KERR_SCIENCE_PAYLOAD_VERSION_V315 = "v315-kerr-corrected-sparse-science-payload-v1" as const;
export const KERR_SCIENCE_GEOMETRY_SOURCE_VERSION_V315 = "v315-kerr-corrected-geometry-source-view-v1" as const;
export const KERR_SCIENCE_POLARIZATION_SOURCE_VERSION_V315 = "v315-kerr-corrected-polarization-source-view-v1" as const;
export const KERR_CANONICAL_RAY_VIEW_VERSION_V315 = "v315-kerr-v314-canonical-ray-view-v1" as const;
export const KERR_SCIENCE_PAYLOAD_AUTHORITY_SHA256_V315 = KERR_FULL_SHORT_AUTHORITY_SHA256_V314;

const CARTER_V312 = "carter-mino-dop853-constraint-stabilized-v312";
const KS_V312 = "cartesian-kerr-schild-hamiltonian-dop853-v312";
const CARTER_V296_COMPAT = "carter-mino-dop853-constraint-stabilized-v296";
const KS_V292_COMPAT = "cartesian-kerr-schild-hamiltonian-dop853-v292";

export type KerrScienceGeometrySourceViewV315 = Readonly<{
  version: typeof KERR_SCIENCE_GEOMETRY_SOURCE_VERSION_V315;
  geometryRedshiftQualified: true;
  evidenceSha256: typeof KERR_CORRECTED_AUTHORITY_EVIDENCE_SHA256_V312;
  observerSourceSha256: typeof KERR_SCIENCE_OBSERVER_SOURCE_SHA256_V299;
  executions: readonly Readonly<Record<string, unknown>>[];
  boundary: "release-a-only-16-carter-16-kerr-schild-no-trajectory-arrays";
}>;

export type KerrSciencePolarizationSourceViewV315 = Readonly<{
  version: typeof KERR_SCIENCE_POLARIZATION_SOURCE_VERSION_V315;
  qualified: true;
  evidenceSha256: typeof KERR_POLARIZATION_AUTHORITY_EVIDENCE_SHA256_V313;
  geometryEvidenceSha256: typeof KERR_GEOMETRY_AUTHORITY_EVIDENCE_SHA256_V313;
  science: Readonly<Record<string, unknown>>;
  payloads: readonly Readonly<Record<string, unknown>>[];
  boundary: "release-a-only-four-disk-rays-capture-escape-not-applicable";
}>;

export type KerrCanonicalRayViewV315 = Readonly<{
  version: typeof KERR_CANONICAL_RAY_VIEW_VERSION_V315;
  planSha256: typeof KERR_CORRECTED_DENSE_RAY_PLAN_SHA256_V314;
  planFileSha256: typeof KERR_CORRECTED_DENSE_RAY_PLAN_FILE_SHA256_V314;
  fullShortAuthoritySha256: typeof KERR_FULL_SHORT_AUTHORITY_SHA256_V314;
  canonicalRays: readonly KerrCorrectedDenseRayPlanEntryV314[];
  denseCampaignStatus: "incomplete-0-of-49";
  denseAggregateSha256: null;
}>;

function record(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`v315-${label}-invalid`);
  return value as Record<string, unknown>;
}
function rows(value: unknown, label: string): Readonly<Record<string, unknown>>[] {
  if (!Array.isArray(value)) throw new Error(`v315-${label}-invalid`);
  return value.map((entry) => record(entry, label));
}

function validateReleaseGeometryRowsV315(executions: readonly Readonly<Record<string, unknown>>[]): void {
  if (executions.length !== 32) throw new Error("v315-geometry-release-a-count");
  const identities = new Set<string>();
  let carterCount = 0;
  let ksCount = 0;
  for (const execution of executions) {
    const formulation = execution.formulation;
    const rayId = execution.rayId;
    if ((formulation !== CARTER_V312 && formulation !== KS_V312)
      || execution.toleranceClass !== "release" || execution.branch !== "A"
      || typeof rayId !== "string" || !rayId) throw new Error("v315-geometry-release-a-identity");
    if (formulation === CARTER_V312) carterCount += 1;
    else ksCount += 1;
    identities.add(`${formulation}:${rayId}`);
  }
  if (carterCount !== 16 || ksCount !== 16 || identities.size !== 32) throw new Error("v315-geometry-formulation-conservation");
}

function validateReleasePolarizationRowsV315(payloads: readonly Readonly<Record<string, unknown>>[]): void {
  if (payloads.length !== 4) throw new Error("v315-polarization-release-a-count");
  const rayIds = new Set<string>();
  for (const payload of payloads) {
    if (payload.toleranceClass !== "release" || payload.branch !== "A"
      || payload.applicability !== "applicable-disk-hit" || payload.passed !== true
      || typeof payload.rayId !== "string") throw new Error("v315-polarization-release-a-identity");
    rayIds.add(payload.rayId);
  }
  if (rayIds.size !== 4 || [...rayIds].some((rayId) => !/^disk-0[0-3]$/.test(rayId))) {
    throw new Error("v315-polarization-disk-ray-conservation");
  }
}

export function createKerrScienceGeometrySourceViewV315(value: unknown): KerrScienceGeometrySourceViewV315 {
  parseKerrCorrectedAuthorityV312(value);
  const source = record(value, "geometry-authority");
  const authorityInputs = record(source.authorityInputs, "geometry-authority-inputs");
  if (authorityInputs.v291SourceSha256 !== KERR_SCIENCE_OBSERVER_SOURCE_SHA256_V299) {
    throw new Error("v315-observer-authority-source-mismatch");
  }
  const executions = rows(source.executions, "geometry-execution")
    .filter((execution) => execution.toleranceClass === "release" && execution.branch === "A");
  validateReleaseGeometryRowsV315(executions);
  return Object.freeze({
    version: KERR_SCIENCE_GEOMETRY_SOURCE_VERSION_V315,
    geometryRedshiftQualified: true,
    evidenceSha256: KERR_CORRECTED_AUTHORITY_EVIDENCE_SHA256_V312,
    observerSourceSha256: KERR_SCIENCE_OBSERVER_SOURCE_SHA256_V299,
    executions: Object.freeze(executions.map((execution) => Object.freeze({ ...execution }))),
    boundary: "release-a-only-16-carter-16-kerr-schild-no-trajectory-arrays",
  });
}

export function parseKerrScienceGeometrySourceViewV315(value: unknown): KerrScienceGeometrySourceViewV315 {
  const source = record(value, "geometry-source-view");
  if (source.version !== KERR_SCIENCE_GEOMETRY_SOURCE_VERSION_V315
    || source.geometryRedshiftQualified !== true
    || source.evidenceSha256 !== KERR_CORRECTED_AUTHORITY_EVIDENCE_SHA256_V312
    || source.observerSourceSha256 !== KERR_SCIENCE_OBSERVER_SOURCE_SHA256_V299
    || source.boundary !== "release-a-only-16-carter-16-kerr-schild-no-trajectory-arrays") {
    throw new Error("v315-geometry-source-view-identity");
  }
  const executions = rows(source.executions, "geometry-source-execution");
  validateReleaseGeometryRowsV315(executions);
  return value as KerrScienceGeometrySourceViewV315;
}

export function createKerrSciencePolarizationSourceViewV315(value: unknown): KerrSciencePolarizationSourceViewV315 {
  parseKerrPolarizationRequalificationV313(value);
  const source = record(value, "polarization-authority");
  const science = record(source.science, "polarization-science");
  const payloads = rows(source.payloads, "polarization-payload")
    .filter((payload) => payload.toleranceClass === "release" && payload.branch === "A");
  validateReleasePolarizationRowsV315(payloads);
  return Object.freeze({
    version: KERR_SCIENCE_POLARIZATION_SOURCE_VERSION_V315,
    qualified: true,
    evidenceSha256: KERR_POLARIZATION_AUTHORITY_EVIDENCE_SHA256_V313,
    geometryEvidenceSha256: KERR_GEOMETRY_AUTHORITY_EVIDENCE_SHA256_V313,
    science: Object.freeze({ ...science }),
    payloads: Object.freeze(payloads.map((payload) => Object.freeze({ ...payload }))),
    boundary: "release-a-only-four-disk-rays-capture-escape-not-applicable",
  });
}

export function parseKerrSciencePolarizationSourceViewV315(value: unknown): KerrSciencePolarizationSourceViewV315 {
  const source = record(value, "polarization-source-view");
  if (source.version !== KERR_SCIENCE_POLARIZATION_SOURCE_VERSION_V315
    || source.qualified !== true
    || source.evidenceSha256 !== KERR_POLARIZATION_AUTHORITY_EVIDENCE_SHA256_V313
    || source.geometryEvidenceSha256 !== KERR_GEOMETRY_AUTHORITY_EVIDENCE_SHA256_V313
    || source.boundary !== "release-a-only-four-disk-rays-capture-escape-not-applicable") {
    throw new Error("v315-polarization-source-view-identity");
  }
  const science = record(source.science, "polarization-source-science");
  if (science.emitterModel !== "projected-disk-normal"
    || science.walkerPenroseModel !== "standard-complex-kerr-walker-penrose"
    || science.parallelTransportModel !== "independent-cartesian-kerr-schild-hamiltonian-dop853") {
    throw new Error("v315-polarization-source-model");
  }
  const payloads = rows(source.payloads, "polarization-source-payload");
  validateReleasePolarizationRowsV315(payloads);
  return value as KerrSciencePolarizationSourceViewV315;
}

export function createKerrCanonicalRayViewV315(value: unknown): KerrCanonicalRayViewV315 {
  const source = record(value, "ray-plan");
  const authority = record(source.authority, "ray-plan-authority");
  const planRays = rows(source.rays, "ray-plan-ray") as unknown as KerrCorrectedDenseRayPlanEntryV314[];
  if (source.version !== "v314-kerr-corrected-dense-ray-plan-v1"
    || source.planSha256 !== KERR_CORRECTED_DENSE_RAY_PLAN_SHA256_V314
    || source.rayCount !== 3097 || source.shardCount !== 49 || source.executionsPerRay !== 8
    || planRays.length !== 3097
    || authority.fullShortAuthoritySha256 !== KERR_FULL_SHORT_AUTHORITY_SHA256_V314
    || authority.geometryCanonicalSha256 !== KERR_CORRECTED_AUTHORITY_EVIDENCE_SHA256_V312
    || authority.polarizationCanonicalSha256 !== KERR_POLARIZATION_AUTHORITY_EVIDENCE_SHA256_V313) {
    throw new Error("v315-v314-ray-plan-authority");
  }
  const canonicalRays = planRays.slice(0, 16);
  if (canonicalRays.some((ray, index) => ray.rayIndex !== index || ray.stratum !== "canonical"
    || typeof ray.rayId !== "string" || !Number.isFinite(ray.alphaM) || !Number.isFinite(ray.betaM)
    || !Number.isFinite(ray.spinA) || !["capture", "escape", "disk-hit"].includes(ray.expectedFamily))) {
    throw new Error("v315-canonical-ray-conservation");
  }
  return Object.freeze({
    version: KERR_CANONICAL_RAY_VIEW_VERSION_V315,
    planSha256: KERR_CORRECTED_DENSE_RAY_PLAN_SHA256_V314,
    planFileSha256: KERR_CORRECTED_DENSE_RAY_PLAN_FILE_SHA256_V314,
    fullShortAuthoritySha256: KERR_FULL_SHORT_AUTHORITY_SHA256_V314,
    canonicalRays: Object.freeze(canonicalRays.map((ray) => Object.freeze({ ...ray }))),
    denseCampaignStatus: "incomplete-0-of-49",
    denseAggregateSha256: null,
  });
}

export function parseKerrCanonicalRayViewV315(value: unknown): KerrCanonicalRayViewV315 {
  const source = record(value, "canonical-ray-view");
  if (source.version !== KERR_CANONICAL_RAY_VIEW_VERSION_V315
    || source.planSha256 !== KERR_CORRECTED_DENSE_RAY_PLAN_SHA256_V314
    || source.planFileSha256 !== KERR_CORRECTED_DENSE_RAY_PLAN_FILE_SHA256_V314
    || source.fullShortAuthoritySha256 !== KERR_FULL_SHORT_AUTHORITY_SHA256_V314
    || source.denseCampaignStatus !== "incomplete-0-of-49" || source.denseAggregateSha256 !== null) {
    throw new Error("v315-canonical-ray-view-identity");
  }
  const canonicalRays = rows(source.canonicalRays, "canonical-ray") as unknown as KerrCorrectedDenseRayPlanEntryV314[];
  if (canonicalRays.length !== 16 || canonicalRays.some((ray, index) => ray.rayIndex !== index
    || ray.stratum !== "canonical" || typeof ray.rayId !== "string" || !Number.isFinite(ray.alphaM)
    || !Number.isFinite(ray.betaM) || !Number.isFinite(ray.spinA)
    || !["capture", "escape", "disk-hit"].includes(ray.expectedFamily))) {
    throw new Error("v315-canonical-ray-view-conservation");
  }
  return value as KerrCanonicalRayViewV315;
}

export function createSparseKerrSciencePayloadV315(
  geometrySourceValue: unknown,
  polarizationSourceValue: unknown,
  canonicalRayViewValue: unknown,
): KerrScienceTransferPayloadV299 {
  const geometry = parseKerrScienceGeometrySourceViewV315(geometrySourceValue);
  const polarization = parseKerrSciencePolarizationSourceViewV315(polarizationSourceValue);
  const canonicalRayView = parseKerrCanonicalRayViewV315(canonicalRayViewValue);
  const compatibilityGeometry = {
    geometryRedshiftQualified: true,
    evidenceSha256: geometry.evidenceSha256,
    baseAuthoritySource: "scripts/run-kerr-authority-v291.py",
    baseAuthoritySourceSha256: geometry.observerSourceSha256,
    executions: geometry.executions.map((execution) => ({
      ...execution,
      formulation: execution.formulation === CARTER_V312 ? CARTER_V296_COMPAT : KS_V292_COMPAT,
    })),
  };
  const compatibilityPolarization = {
    qualified: true,
    evidenceSha256: polarization.evidenceSha256,
    science: polarization.science,
    payloads: polarization.payloads,
  };
  const compatibilityCanonicalRayView = {
    version: "v299-kerr-canonical-ray-view-v1",
    planSha256: KERR_DENSE_RAY_PLAN_SHA256_V298R1,
    planFileSha256: KERR_DENSE_RAY_PLAN_FILE_SHA256_V298R1,
    canonicalRays: canonicalRayView.canonicalRays as readonly KerrDenseRayPlanEntryV298R1[],
  };
  const compatibilityPayload = createSparseKerrSciencePayloadV299(
    compatibilityGeometry,
    compatibilityPolarization,
    compatibilityCanonicalRayView,
  );
  const payload: KerrScienceTransferPayloadV299 = Object.freeze({
    ...compatibilityPayload,
    authorityKind: "v312-v313-short-gate-sparse",
    geometryEvidenceSha256: KERR_CORRECTED_AUTHORITY_EVIDENCE_SHA256_V312,
    polarizationEvidenceSha256: KERR_POLARIZATION_AUTHORITY_EVIDENCE_SHA256_V313,
    rayPlanSha256: KERR_CORRECTED_DENSE_RAY_PLAN_SHA256_V314,
    denseAggregateSha256: null,
    errorBudgetVersion: "v315-sparse-release-residual-budget-v1",
    denseCampaignComplete: false,
  });
  const validation = validateKerrScienceTransferPayloadV299(payload);
  if (!validation.passed) throw new Error(`invalid v315 science payload: ${validation.failures.join(",")}`);
  return payload;
}
