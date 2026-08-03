import { KERR_CORRECTED_AUTHORITY_EVIDENCE_SHA256_V312 } from "./kerrAuthorityV312";
import { KERR_POLARIZATION_AUTHORITY_EVIDENCE_SHA256_V313 } from "./kerrAuthorityV313";
import { KERR_CORRECTED_DENSE_RAY_PLAN_SHA256_V314 } from "./kerrCampaignV314";
import {
  KERR_GEOMETRY_EVIDENCE_SHA256_V301,
  KERR_POLARIZATION_EVIDENCE_SHA256_V301,
  KERR_RAY_PLAN_SHA256_V301,
} from "./kerrObserverEmitterReplayV301";
import {
  KERR_CLASSIFICATION_V299,
  validateKerrScienceTransferPayloadV299,
  type KerrScienceTransferPayloadV299,
} from "./strongGravityRenderingV299";

export const KERR_SCIENCE_OBSERVABLES_VERSION_V306 = "v306-kerr-sparse-science-observables-v1" as const;

export type KerrScienceClassificationV306 = "capture" | "escape" | "disk-hit";

export type KerrCanonicalScienceRayV306 = Readonly<{
  rayIndex: number;
  rayId: string;
  stratum: string;
  alphaM: number;
  betaM: number;
  spinA: number;
}>;

export type KerrScienceObservableRecordV306 = Readonly<{
  rayIndex: number;
  rayId: string;
  alphaM: number;
  betaM: number;
  spinA: number;
  classification: KerrScienceClassificationV306;
  emissionRadiusM: number | null;
  redshiftFactor: number | null;
  imageOrder: number | null;
  walkerPenroseEvpaDeg: number | null;
  parallelTransportEvpaDeg: number | null;
  evpaDifferenceDeg: number | null;
  intensity: number | null;
  applicability: Readonly<{
    redshift: boolean;
    imageOrder: boolean;
    polarization: boolean;
  }>;
  geometryBudget: Readonly<{
    carterMassShellResidual: number;
    carterConstantResidual: number;
    kerrSchildMassShellResidual: number;
    metricPullbackResidual: number;
    covectorRoundtripResidual: number;
    metricDerivativeAuditResidual: number;
    carterTetradResidual: number;
    kerrSchildTetradResidual: number;
    diskRadiusDifferenceM: number | null;
    redshiftDifference: number | null;
  }>;
  polarizationBudget: Readonly<{
    nullResidual: number | null;
    orthogonalityResidual: number | null;
    normResidual: number | null;
    walkerPenroseInvariantDrift: number | null;
    endpointResidual: number | null;
    screenDirectionResidual: number | null;
  }>;
}>;

export type KerrScienceObservablesViewV306 = Readonly<{
  version: typeof KERR_SCIENCE_OBSERVABLES_VERSION_V306;
  status: "qualified-sparse-authority";
  authority: Readonly<{
    kind: "v296-v297-short-gate-sparse" | "v312-v313-short-gate-sparse";
    geometryEvidenceSha256: typeof KERR_GEOMETRY_EVIDENCE_SHA256_V301 | typeof KERR_CORRECTED_AUTHORITY_EVIDENCE_SHA256_V312;
    polarizationEvidenceSha256: typeof KERR_POLARIZATION_EVIDENCE_SHA256_V301 | typeof KERR_POLARIZATION_AUTHORITY_EVIDENCE_SHA256_V313;
    rayPlanSha256: typeof KERR_RAY_PLAN_SHA256_V301 | typeof KERR_CORRECTED_DENSE_RAY_PLAN_SHA256_V314;
    denseAggregateSha256: null;
  }>;
  counts: Readonly<{
    sampleCount: 16;
    capture: 6;
    escape: 6;
    diskHit: 4;
    redshiftApplicable: 4;
    imageOrderApplicable: 4;
    polarizationApplicable: 4;
  }>;
  records: readonly KerrScienceObservableRecordV306[];
  policy: Readonly<{
    missingObservableEncoding: "null-not-zero";
    uncertaintyCombination: "componentwise-no-rss-no-scalar-total";
    displayAuthority: "cpu-v296-geometry+v297-polarization" | "cpu-v312-geometry+v313-polarization";
    denseQualificationAccepted: false;
  }>;
  boundary: "16-canonical-rays-not-dense-transfer-map";
}>;

const SHA256 = /^[a-f0-9]{64}$/;

function classificationName(value: number): KerrScienceClassificationV306 {
  if (value === KERR_CLASSIFICATION_V299.capture) return "capture";
  if (value === KERR_CLASSIFICATION_V299.escape) return "escape";
  if (value === KERR_CLASSIFICATION_V299["disk-hit"]) return "disk-hit";
  throw new Error("v306-classification-invalid");
}

function applicableValue(applicable: number, value: number, label: string): number | null {
  if (applicable === 0) return null;
  if (applicable !== 1 || !Number.isFinite(value)) throw new Error(`v306-${label}-invalid`);
  return value;
}

export function createKerrScienceObservablesViewV306(
  payload: KerrScienceTransferPayloadV299,
  canonicalRays: readonly KerrCanonicalScienceRayV306[],
): KerrScienceObservablesViewV306 {
  const validation = validateKerrScienceTransferPayloadV299(payload);
  if (!validation.passed) throw new Error(`v306-payload-invalid:${validation.failures.join(",")}`);
  const legacyAuthority = payload.authorityKind === "v296-v297-short-gate-sparse"
    && payload.geometryEvidenceSha256 === KERR_GEOMETRY_EVIDENCE_SHA256_V301
    && payload.polarizationEvidenceSha256 === KERR_POLARIZATION_EVIDENCE_SHA256_V301
    && payload.rayPlanSha256 === KERR_RAY_PLAN_SHA256_V301;
  const correctedAuthority = payload.authorityKind === "v312-v313-short-gate-sparse"
    && payload.geometryEvidenceSha256 === KERR_CORRECTED_AUTHORITY_EVIDENCE_SHA256_V312
    && payload.polarizationEvidenceSha256 === KERR_POLARIZATION_AUTHORITY_EVIDENCE_SHA256_V313
    && payload.rayPlanSha256 === KERR_CORRECTED_DENSE_RAY_PLAN_SHA256_V314;
  if ((!legacyAuthority && !correctedAuthority)
    || payload.denseCampaignComplete
    || payload.denseAggregateSha256 !== null
    || payload.sampleCount !== 16
    || canonicalRays.length !== 16) throw new Error("v306-sparse-authority-boundary");

  const counts = { capture: 0, escape: 0, diskHit: 0, redshift: 0, imageOrder: 0, polarization: 0 };
  const records = canonicalRays.map((ray, index): KerrScienceObservableRecordV306 => {
    if (ray.rayIndex !== index || ray.stratum !== "canonical"
      || Math.abs(ray.alphaM - payload.alphaM[index]) > 1e-12
      || Math.abs(ray.betaM - payload.betaM[index]) > 1e-12
      || Math.abs(ray.spinA - payload.spinA[index]) > 1e-12) throw new Error("v306-ray-plan-payload-mismatch");
    const classification = classificationName(payload.classification[index]);
    if (classification === "capture") counts.capture += 1;
    else if (classification === "escape") counts.escape += 1;
    else counts.diskHit += 1;
    counts.redshift += payload.redshiftApplicable[index];
    counts.imageOrder += payload.imageOrderApplicable[index];
    counts.polarization += payload.evpaApplicable[index];
    const diskHit = classification === "disk-hit";
    return Object.freeze({
      rayIndex: index,
      rayId: ray.rayId,
      alphaM: payload.alphaM[index],
      betaM: payload.betaM[index],
      spinA: payload.spinA[index],
      classification,
      emissionRadiusM: diskHit ? payload.emissionRadiusM[index] : null,
      redshiftFactor: applicableValue(payload.redshiftApplicable[index], payload.redshiftFactor[index], "redshift"),
      imageOrder: applicableValue(payload.imageOrderApplicable[index], payload.imageOrder[index], "image-order"),
      walkerPenroseEvpaDeg: applicableValue(payload.evpaApplicable[index], payload.evpaDeg[index], "wp-evpa"),
      parallelTransportEvpaDeg: applicableValue(payload.evpaApplicable[index], payload.parallelTransportEvpaDeg[index], "pt-evpa"),
      evpaDifferenceDeg: applicableValue(payload.evpaApplicable[index], payload.evpaDifferenceDeg[index], "evpa-difference"),
      intensity: diskHit ? payload.intensity[index] : null,
      applicability: Object.freeze({
        redshift: payload.redshiftApplicable[index] === 1,
        imageOrder: payload.imageOrderApplicable[index] === 1,
        polarization: payload.evpaApplicable[index] === 1,
      }),
      geometryBudget: Object.freeze({
        carterMassShellResidual: payload.massShellResidualNormalized[index],
        carterConstantResidual: payload.carterResidualNormalized[index],
        kerrSchildMassShellResidual: payload.kerrSchildMassShellResidualNormalized[index],
        metricPullbackResidual: payload.metricPullbackResidual[index],
        covectorRoundtripResidual: payload.covectorRoundtripResidual[index],
        metricDerivativeAuditResidual: payload.metricDerivativeAuditResidual[index],
        carterTetradResidual: payload.tetradResidual[index],
        kerrSchildTetradResidual: payload.kerrSchildTetradResidual[index],
        diskRadiusDifferenceM: diskHit ? payload.geometryDiskRadiusDifferenceM[index] : null,
        redshiftDifference: diskHit ? payload.geometryRedshiftDifference[index] : null,
      }),
      polarizationBudget: Object.freeze({
        nullResidual: applicableValue(payload.evpaApplicable[index], payload.polarizationNullResidualNormalized[index], "polarization-null"),
        orthogonalityResidual: applicableValue(payload.evpaApplicable[index], payload.polarizationOrthogonalityResidualNormalized[index], "polarization-orthogonality"),
        normResidual: applicableValue(payload.evpaApplicable[index], payload.polarizationNormResidual[index], "polarization-norm"),
        walkerPenroseInvariantDrift: applicableValue(payload.evpaApplicable[index], payload.walkerPenroseInvariantDrift[index], "wp-drift"),
        endpointResidual: applicableValue(payload.evpaApplicable[index], payload.polarizationEndpointResidual[index], "endpoint"),
        screenDirectionResidual: applicableValue(payload.evpaApplicable[index], payload.screenDirectionResidual[index], "screen-direction"),
      }),
    });
  });
  if (counts.capture !== 6 || counts.escape !== 6 || counts.diskHit !== 4
    || counts.redshift !== 4 || counts.imageOrder !== 4 || counts.polarization !== 4) {
    throw new Error("v306-observable-count-conservation");
  }
  return Object.freeze({
    version: KERR_SCIENCE_OBSERVABLES_VERSION_V306,
    status: "qualified-sparse-authority",
    authority: Object.freeze({
      kind: correctedAuthority ? "v312-v313-short-gate-sparse" : "v296-v297-short-gate-sparse",
      geometryEvidenceSha256: payload.geometryEvidenceSha256,
      polarizationEvidenceSha256: payload.polarizationEvidenceSha256,
      rayPlanSha256: payload.rayPlanSha256,
      denseAggregateSha256: null,
    }),
    counts: Object.freeze({
      sampleCount: 16,
      capture: 6,
      escape: 6,
      diskHit: 4,
      redshiftApplicable: 4,
      imageOrderApplicable: 4,
      polarizationApplicable: 4,
    }),
    records: Object.freeze(records),
    policy: Object.freeze({
      missingObservableEncoding: "null-not-zero",
      uncertaintyCombination: "componentwise-no-rss-no-scalar-total",
      displayAuthority: correctedAuthority ? "cpu-v312-geometry+v313-polarization" : "cpu-v296-geometry+v297-polarization",
      denseQualificationAccepted: false,
    }),
    boundary: "16-canonical-rays-not-dense-transfer-map",
  });
}

type UnknownRecord = Record<string, unknown>;

function object(value: unknown, label: string): UnknownRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`v306-${label}-invalid`);
  return value as UnknownRecord;
}

function finite(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) throw new Error(`v306-${label}-non-finite`);
  return value;
}

function nonnegative(value: unknown, label: string): number {
  const result = finite(value, label);
  if (result < 0) throw new Error(`v306-${label}-negative`);
  return result;
}

function nullableFinite(value: unknown, label: string): number | null {
  return value === null ? null : finite(value, label);
}

function nullableNonnegative(value: unknown, label: string): number | null {
  return value === null ? null : nonnegative(value, label);
}

export function parseKerrScienceObservablesViewV306(value: unknown): KerrScienceObservablesViewV306 {
  const source = object(value, "view");
  const authority = object(source.authority, "authority");
  const counts = object(source.counts, "counts");
  const policy = object(source.policy, "policy");
  const rows = Array.isArray(source.records) ? source.records : [];
  const legacyAuthority = authority.kind === "v296-v297-short-gate-sparse"
    && authority.geometryEvidenceSha256 === KERR_GEOMETRY_EVIDENCE_SHA256_V301
    && authority.polarizationEvidenceSha256 === KERR_POLARIZATION_EVIDENCE_SHA256_V301
    && authority.rayPlanSha256 === KERR_RAY_PLAN_SHA256_V301
    && policy.displayAuthority === "cpu-v296-geometry+v297-polarization";
  const correctedAuthority = authority.kind === "v312-v313-short-gate-sparse"
    && authority.geometryEvidenceSha256 === KERR_CORRECTED_AUTHORITY_EVIDENCE_SHA256_V312
    && authority.polarizationEvidenceSha256 === KERR_POLARIZATION_AUTHORITY_EVIDENCE_SHA256_V313
    && authority.rayPlanSha256 === KERR_CORRECTED_DENSE_RAY_PLAN_SHA256_V314
    && policy.displayAuthority === "cpu-v312-geometry+v313-polarization";
  if (source.version !== KERR_SCIENCE_OBSERVABLES_VERSION_V306
    || source.status !== "qualified-sparse-authority"
    || source.boundary !== "16-canonical-rays-not-dense-transfer-map"
    || (!legacyAuthority && !correctedAuthority)
    || authority.denseAggregateSha256 !== null
    || ![authority.geometryEvidenceSha256, authority.polarizationEvidenceSha256, authority.rayPlanSha256].every((entry) => typeof entry === "string" && SHA256.test(entry))
    || counts.sampleCount !== 16 || counts.capture !== 6 || counts.escape !== 6 || counts.diskHit !== 4
    || counts.redshiftApplicable !== 4 || counts.imageOrderApplicable !== 4 || counts.polarizationApplicable !== 4
    || policy.missingObservableEncoding !== "null-not-zero"
    || policy.uncertaintyCombination !== "componentwise-no-rss-no-scalar-total"
    || policy.denseQualificationAccepted !== false
    || "scalarCombinedUncertainty" in policy
    || rows.length !== 16) throw new Error("v306-view-contract-invalid");

  const records = rows.map((entry, index): KerrScienceObservableRecordV306 => {
    const row = object(entry, `record-${index}`);
    const applicability = object(row.applicability, `applicability-${index}`);
    const geometry = object(row.geometryBudget, `geometry-budget-${index}`);
    const polarization = object(row.polarizationBudget, `polarization-budget-${index}`);
    if (row.rayIndex !== index || typeof row.rayId !== "string" || row.rayId.length < 1
      || !["capture", "escape", "disk-hit"].includes(String(row.classification))
      || typeof applicability.redshift !== "boolean" || typeof applicability.imageOrder !== "boolean" || typeof applicability.polarization !== "boolean") {
      throw new Error("v306-record-identity-invalid");
    }
    const diskHit = row.classification === "disk-hit";
    const redshift = nullableFinite(row.redshiftFactor, `redshift-${index}`);
    const imageOrder = nullableFinite(row.imageOrder, `image-order-${index}`);
    const wpEvpa = nullableFinite(row.walkerPenroseEvpaDeg, `wp-evpa-${index}`);
    const ptEvpa = nullableFinite(row.parallelTransportEvpaDeg, `pt-evpa-${index}`);
    const evpaDifference = nullableNonnegative(row.evpaDifferenceDeg, `evpa-difference-${index}`);
    if (diskHit !== applicability.redshift || diskHit !== applicability.imageOrder || diskHit !== applicability.polarization
      || diskHit !== (redshift !== null) || diskHit !== (imageOrder !== null)
      || diskHit !== (wpEvpa !== null) || diskHit !== (ptEvpa !== null) || diskHit !== (evpaDifference !== null)) {
      throw new Error("v306-observable-applicability-invalid");
    }
    const record = {
      rayIndex: index,
      rayId: row.rayId,
      alphaM: finite(row.alphaM, `alpha-${index}`),
      betaM: finite(row.betaM, `beta-${index}`),
      spinA: finite(row.spinA, `spin-${index}`),
      classification: row.classification,
      emissionRadiusM: nullableFinite(row.emissionRadiusM, `emission-radius-${index}`),
      redshiftFactor: redshift,
      imageOrder,
      walkerPenroseEvpaDeg: wpEvpa,
      parallelTransportEvpaDeg: ptEvpa,
      evpaDifferenceDeg: evpaDifference,
      intensity: nullableFinite(row.intensity, `intensity-${index}`),
      applicability: {
        redshift: applicability.redshift,
        imageOrder: applicability.imageOrder,
        polarization: applicability.polarization,
      },
      geometryBudget: {
        carterMassShellResidual: nonnegative(geometry.carterMassShellResidual, `carter-mass-${index}`),
        carterConstantResidual: nonnegative(geometry.carterConstantResidual, `carter-constant-${index}`),
        kerrSchildMassShellResidual: nonnegative(geometry.kerrSchildMassShellResidual, `ks-mass-${index}`),
        metricPullbackResidual: nonnegative(geometry.metricPullbackResidual, `metric-pullback-${index}`),
        covectorRoundtripResidual: nonnegative(geometry.covectorRoundtripResidual, `covector-${index}`),
        metricDerivativeAuditResidual: nonnegative(geometry.metricDerivativeAuditResidual, `metric-derivative-${index}`),
        carterTetradResidual: nonnegative(geometry.carterTetradResidual, `carter-tetrad-${index}`),
        kerrSchildTetradResidual: nonnegative(geometry.kerrSchildTetradResidual, `ks-tetrad-${index}`),
        diskRadiusDifferenceM: nullableNonnegative(geometry.diskRadiusDifferenceM, `disk-radius-difference-${index}`),
        redshiftDifference: nullableNonnegative(geometry.redshiftDifference, `redshift-difference-${index}`),
      },
      polarizationBudget: {
        nullResidual: nullableNonnegative(polarization.nullResidual, `polarization-null-${index}`),
        orthogonalityResidual: nullableNonnegative(polarization.orthogonalityResidual, `polarization-orthogonality-${index}`),
        normResidual: nullableNonnegative(polarization.normResidual, `polarization-norm-${index}`),
        walkerPenroseInvariantDrift: nullableNonnegative(polarization.walkerPenroseInvariantDrift, `wp-drift-${index}`),
        endpointResidual: nullableNonnegative(polarization.endpointResidual, `endpoint-${index}`),
        screenDirectionResidual: nullableNonnegative(polarization.screenDirectionResidual, `screen-direction-${index}`),
      },
    } as KerrScienceObservableRecordV306;
    if (Math.abs(record.spinA) > 0.998
      || diskHit !== (record.emissionRadiusM !== null) || diskHit !== (record.intensity !== null)
      || (record.emissionRadiusM !== null && record.emissionRadiusM <= 0)
      || (record.redshiftFactor !== null && record.redshiftFactor <= 0)
      || (record.imageOrder !== null && (!Number.isSafeInteger(record.imageOrder) || record.imageOrder < 0))
      || (record.intensity !== null && record.intensity < 0)) throw new Error("v306-disk-observable-invalid");
    return Object.freeze(record);
  });
  const actualCounts = records.reduce((result, entry) => {
    result[entry.classification] += 1;
    if (entry.applicability.redshift) result.redshift += 1;
    if (entry.applicability.imageOrder) result.imageOrder += 1;
    if (entry.applicability.polarization) result.polarization += 1;
    return result;
  }, { capture: 0, escape: 0, "disk-hit": 0, redshift: 0, imageOrder: 0, polarization: 0 });
  if (actualCounts.capture !== 6 || actualCounts.escape !== 6 || actualCounts["disk-hit"] !== 4
    || actualCounts.redshift !== 4 || actualCounts.imageOrder !== 4 || actualCounts.polarization !== 4) {
    throw new Error("v306-record-count-conservation");
  }
  return Object.freeze({
    version: KERR_SCIENCE_OBSERVABLES_VERSION_V306,
    status: "qualified-sparse-authority",
    authority: Object.freeze(authority) as KerrScienceObservablesViewV306["authority"],
    counts: Object.freeze(counts) as KerrScienceObservablesViewV306["counts"],
    records: Object.freeze(records),
    policy: Object.freeze(policy) as KerrScienceObservablesViewV306["policy"],
    boundary: "16-canonical-rays-not-dense-transfer-map",
  });
}
