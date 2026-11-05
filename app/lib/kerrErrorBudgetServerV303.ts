import {
  createSparseKerrSciencePayloadV299,
  validateKerrScienceTransferPayloadV299,
} from "./strongGravityRenderingV299";
import {
  KERR_CAMPAIGN_STATE_FILE_SHA256_V303,
  KERR_CAMPAIGN_STATE_SHA256_V303,
  KERR_ERROR_BUDGET_VERSION_V303,
  KERR_ERROR_COMPONENT_IDS_V303,
  KERR_SHARD0_AUDIT_FILE_SHA256_V303,
  KERR_SHARD0_AUDIT_SHA256_V303,
  createKerrErrorBudgetComponentV303,
  parseKerrLayeredErrorBudgetViewV303,
  type KerrErrorComponentIdV303,
  type KerrLayeredErrorBudgetViewV303,
} from "./kerrErrorBudgetV303";
import {
  KERR_GEOMETRY_EVIDENCE_SHA256_V301,
  KERR_GEOMETRY_FILE_SHA256_V301,
  KERR_POLARIZATION_EVIDENCE_SHA256_V301,
  KERR_POLARIZATION_FILE_SHA256_V301,
  KERR_RAY_PLAN_FILE_SHA256_V301,
  KERR_RAY_PLAN_SHA256_V301,
} from "./kerrObserverEmitterReplayV301";

type UnknownRecord = Record<string, unknown>;

function record(value: unknown, label: string): UnknownRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`v303-server-${label}-invalid`);
  return value as UnknownRecord;
}

function finite(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) throw new Error(`v303-server-${label}-invalid`);
  return value;
}

function maximum(values: Iterable<number>, label: string): number {
  const finiteValues = [...values].filter(Number.isFinite);
  if (finiteValues.length === 0) throw new Error(`v303-server-${label}-empty`);
  return Math.max(...finiteValues);
}

function polarizationResidualMaximum(rows: unknown[], toleranceClass: "release" | "internal"): number {
  const values: number[] = [];
  rows.map((entry) => record(entry, "polarization-row"))
    .filter((row) => row.toleranceClass === toleranceClass)
    .forEach((row) => {
      const transport = record(row.parallelTransport, "parallel-transport");
      const emitter = record(row.emitterResiduals, "emitter-residuals");
      for (const value of [
        transport.nullResidualNormalized,
        transport.orthogonalityResidualNormalized,
        transport.normResidual,
        transport.walkerPenroseInvariantDrift,
        transport.endpointResidual,
        transport.finalKsNormResidual,
        row.screenDirectionResidual,
        emitter.waveOrthogonality,
        emitter.emitterOrthogonality,
        emitter.norm,
      ]) values.push(finite(value, "polarization-residual"));
    });
  return maximum(values, `${toleranceClass}-polarization-residual`);
}

export function createKerrLayeredErrorBudgetViewV303(
  geometryDocument: unknown,
  polarizationDocument: unknown,
  rayPlanDocument: unknown,
  shardAuditDocument: unknown,
  campaignStateDocument: unknown,
): KerrLayeredErrorBudgetViewV303 {
  const geometry = record(geometryDocument, "geometry");
  const polarization = record(polarizationDocument, "polarization");
  const rayPlan = record(rayPlanDocument, "ray-plan");
  const shardAudit = record(shardAuditDocument, "shard-audit");
  const campaignState = record(campaignStateDocument, "campaign-state");
  if (geometry.evidenceSha256 !== KERR_GEOMETRY_EVIDENCE_SHA256_V301
    || polarization.evidenceSha256 !== KERR_POLARIZATION_EVIDENCE_SHA256_V301
    || rayPlan.planSha256 !== KERR_RAY_PLAN_SHA256_V301
    || shardAudit.auditSha256 !== KERR_SHARD0_AUDIT_SHA256_V303
    || campaignState.stateSha256 !== KERR_CAMPAIGN_STATE_SHA256_V303) throw new Error("v303-server-authority-lock-mismatch");
  if (!Array.isArray(rayPlan.rays) || rayPlan.rays.length !== 3097) throw new Error("v303-server-ray-plan-conservation-failed");
  const canonicalRayView = {
    version: "v299-kerr-canonical-ray-view-v1",
    planSha256: KERR_RAY_PLAN_SHA256_V301,
    planFileSha256: KERR_RAY_PLAN_FILE_SHA256_V301,
    canonicalRays: rayPlan.rays.slice(0, 16),
  };
  const payload = createSparseKerrSciencePayloadV299(geometry, polarization, canonicalRayView);
  const payloadValidation = validateKerrScienceTransferPayloadV299(payload);
  if (!payloadValidation.passed) throw new Error(`v303-server-sparse-payload-failed:${payloadValidation.failures.join(",")}`);
  const geometryThresholds = record(geometry.thresholds, "geometry-thresholds");
  const polarizationThresholds = record(polarization.thresholds, "polarization-thresholds");
  const polarizationRows = Array.isArray(polarization.payloads) ? polarization.payloads : [];
  if (geometry.executionCount !== 128 || polarization.applicableExecutionCount !== 16 || polarizationRows.length !== 16) {
    throw new Error("v303-server-short-authority-count-mismatch");
  }
  const sparseObserved: Record<KerrErrorComponentIdV303, number> = {
    massShellNormalized: maximum([...payload.massShellResidualNormalized, ...payload.kerrSchildMassShellResidualNormalized], "mass-shell"),
    carterFirstIntegralNormalized: maximum(payload.carterResidualNormalized, "carter"),
    metricDerivativeAudit: maximum(payload.metricDerivativeAuditResidual, "metric-derivative"),
    metricPullback: maximum(payload.metricPullbackResidual, "metric-pullback"),
    covectorRoundtrip: maximum(payload.covectorRoundtripResidual, "covector-roundtrip"),
    tetrad: maximum([...payload.tetradResidual, ...payload.kerrSchildTetradResidual], "tetrad"),
    redshiftFormulaDifference: maximum(payload.geometryRedshiftDifference, "redshift-difference"),
    intensityInvariant: finite(geometryThresholds.maxIntensityInvariantResidual, "intensity-invariant"),
    releaseEvpaDifference: finite(polarizationThresholds.maxReleaseEvpaDifferenceDeg, "release-evpa"),
    internalEvpaDifference: finite(polarizationThresholds.maxInternalEvpaDifferenceDeg, "internal-evpa"),
    releasePolarizationResidual: polarizationResidualMaximum(polarizationRows, "release"),
    internalPolarizationResidual: polarizationResidualMaximum(polarizationRows, "internal"),
  };
  const sparseSources: Record<KerrErrorComponentIdV303, string> = {
    massShellNormalized: "v299 sparse payload Carter/KS mass-shell maxima",
    carterFirstIntegralNormalized: "v299 sparse payload Carter first-integral maximum",
    metricDerivativeAudit: "v299 sparse payload analytic-vs-finite-difference derivative audit",
    metricPullback: "v299 sparse payload BL-to-KS metric pullback",
    covectorRoundtrip: "v299 sparse payload BL/KS covector roundtrip",
    tetrad: "v299 sparse payload Carter/KS observer tetrad residuals",
    redshiftFormulaDifference: "v299 sparse payload Carter-vs-KS disk redshift pairs",
    intensityInvariant: "v296 geometry authority Liouville intensity invariant",
    releaseEvpaDifference: "v297 release Walker-Penrose-vs-parallel-transport EVPA",
    internalEvpaDifference: "v297 internal Walker-Penrose-vs-parallel-transport EVPA",
    releasePolarizationResidual: "v297 release emitter/transport/endpoint residual maximum",
    internalPolarizationResidual: "v297 internal emitter/transport/endpoint residual maximum",
  };
  const sparseComponents = KERR_ERROR_COMPONENT_IDS_V303.map((id) => createKerrErrorBudgetComponentV303(id, sparseObserved[id], sparseSources[id]));

  const qualification = record(shardAudit.qualification, "shard-qualification");
  const denseBudget = record(shardAudit.errorBudget, "dense-budget");
  const denseComponentSource = record(denseBudget.components, "dense-components");
  if (shardAudit.version !== "v298r1-kerr-dense-shard-science-audit-v1"
    || shardAudit.status !== "shard-structural-qualified"
    || shardAudit.aggregateEligible !== false
    || shardAudit.partialAggregate !== true
    || qualification.scope !== "shard"
    || qualification.statisticalGatesApplied !== false
    || denseBudget.scope !== "shard"
    || denseBudget.independenceAssumption !== "not-established"
    || denseBudget.combinationPolicy !== "componentwise-reporting-no-rss-no-cross-dimension-sum") {
    throw new Error("v303-server-dense-shard-boundary-mismatch");
  }
  const denseComponents = KERR_ERROR_COMPONENT_IDS_V303.map((id) => {
    const component = record(denseComponentSource[id], `dense-component-${id}`);
    const created = createKerrErrorBudgetComponentV303(id, finite(component.observed, `dense-observed-${id}`), String(component.source));
    if (component.threshold !== created.threshold || component.unit !== created.unit) {
      throw new Error(`v303-server-dense-component-contract-mismatch:${id}`);
    }
    return created;
  });
  if (campaignState.status !== "incomplete-1-of-49"
    || campaignState.completedShardCount !== 1
    || campaignState.plannedShardCount !== 49
    || campaignState.aggregateAvailable !== false
    || campaignState.partialAggregate !== false) throw new Error("v303-server-campaign-boundary-mismatch");
  const utilization = (components: typeof sparseComponents) => Math.max(...components.map((component) => component.observed / component.threshold));
  const unreported = record(denseBudget.unreportedComponents, "unreported-components");

  return parseKerrLayeredErrorBudgetViewV303({
    version: KERR_ERROR_BUDGET_VERSION_V303,
    status: "sparse-qualified-dense-incomplete",
    authority: {
      geometryEvidenceSha256: KERR_GEOMETRY_EVIDENCE_SHA256_V301,
      geometryFileSha256: KERR_GEOMETRY_FILE_SHA256_V301,
      polarizationEvidenceSha256: KERR_POLARIZATION_EVIDENCE_SHA256_V301,
      polarizationFileSha256: KERR_POLARIZATION_FILE_SHA256_V301,
      rayPlanSha256: KERR_RAY_PLAN_SHA256_V301,
      rayPlanFileSha256: KERR_RAY_PLAN_FILE_SHA256_V301,
      shard0AuditSha256: KERR_SHARD0_AUDIT_SHA256_V303,
      shard0AuditFileSha256: KERR_SHARD0_AUDIT_FILE_SHA256_V303,
      campaignStateSha256: KERR_CAMPAIGN_STATE_SHA256_V303,
      campaignStateFileSha256: KERR_CAMPAIGN_STATE_FILE_SHA256_V303,
    },
    policy: {
      independenceAssumption: "not-established",
      combinationPolicy: "componentwise-reporting-no-rss-no-cross-dimension-sum",
      scalarCombinedUncertainty: "forbidden",
    },
    sparse: {
      status: "qualified-short-authority",
      scope: "complete-v296-v297-short-authority",
      geometryExecutionCount: 128,
      polarizationExecutionCount: 16,
      canonicalRayCount: 16,
      components: sparseComponents,
    },
    dense: {
      status: "incomplete-1-of-49",
      scope: "shard-0-structural-audit-only",
      completedShardCount: 1,
      plannedShardCount: 49,
      auditedRayCount: qualification.rayCount,
      auditedExecutionCount: qualification.executionCount,
      statisticalGatesApplied: false,
      aggregateEligible: false,
      campaignPartialAggregate: false,
      denseAggregateSha256: null,
      components: denseComponents,
    },
    unreportedComponents: unreported,
    maxima: {
      sparseThresholdUtilization: utilization(sparseComponents),
      denseShardThresholdUtilization: utilization(denseComponents),
    },
    boundary: "shard-budget-is-not-dense-aggregate-qualification",
  });
}
