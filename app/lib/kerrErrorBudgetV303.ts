import {
  KERR_GEOMETRY_EVIDENCE_SHA256_V301,
  KERR_GEOMETRY_FILE_SHA256_V301,
  KERR_POLARIZATION_EVIDENCE_SHA256_V301,
  KERR_POLARIZATION_FILE_SHA256_V301,
  KERR_RAY_PLAN_FILE_SHA256_V301,
  KERR_RAY_PLAN_SHA256_V301,
} from "./kerrObserverEmitterReplayV301";

export const KERR_ERROR_BUDGET_VERSION_V303 = "v303-kerr-layered-error-budget-view-v1" as const;
export const KERR_SHARD0_AUDIT_SHA256_V303 = "ff0240a5e18889dd0bd02c5adf197780357f1504dece54ed4bbb12b5e8c902bd" as const;
export const KERR_SHARD0_AUDIT_FILE_SHA256_V303 = "b200132232c84884ce9e7492df0f480eb6e4363e50f3a23861f347cc341a40ca" as const;
export const KERR_CAMPAIGN_STATE_SHA256_V303 = "2bb8fbd88f66c2064fb93152f13d73f879174ad53f2c409050f9876a49597fe2" as const;
export const KERR_CAMPAIGN_STATE_FILE_SHA256_V303 = "28f920370690c5fe47dde4ee8b8a562eac73cacdd701697c44cfea35fe22a70f" as const;

export const KERR_ERROR_COMPONENT_IDS_V303 = Object.freeze([
  "massShellNormalized",
  "carterFirstIntegralNormalized",
  "metricDerivativeAudit",
  "metricPullback",
  "covectorRoundtrip",
  "tetrad",
  "redshiftFormulaDifference",
  "intensityInvariant",
  "releaseEvpaDifference",
  "internalEvpaDifference",
  "releasePolarizationResidual",
  "internalPolarizationResidual",
] as const);

export type KerrErrorComponentIdV303 = typeof KERR_ERROR_COMPONENT_IDS_V303[number];

const COMPONENT_CONTRACT = Object.freeze({
  massShellNormalized: { threshold: 1e-10, unit: "dimensionless" },
  carterFirstIntegralNormalized: { threshold: 1e-10, unit: "dimensionless" },
  metricDerivativeAudit: { threshold: 1e-8, unit: "dimensionless" },
  metricPullback: { threshold: 1e-12, unit: "dimensionless" },
  covectorRoundtrip: { threshold: 1e-12, unit: "dimensionless" },
  tetrad: { threshold: 1e-12, unit: "dimensionless" },
  redshiftFormulaDifference: { threshold: 0.005, unit: "dimensionless" },
  intensityInvariant: { threshold: 1e-12, unit: "dimensionless" },
  releaseEvpaDifference: { threshold: 0.5, unit: "deg" },
  internalEvpaDifference: { threshold: 0.1, unit: "deg" },
  releasePolarizationResidual: { threshold: 1e-10, unit: "dimensionless" },
  internalPolarizationResidual: { threshold: 1e-11, unit: "dimensionless" },
} as const);

export type KerrErrorBudgetComponentV303 = Readonly<{
  id: KerrErrorComponentIdV303;
  observed: number;
  threshold: number;
  unit: "dimensionless" | "deg";
  comparison: "maximum-exclusive";
  passed: true;
  source: string;
}>;

export type KerrLayeredErrorBudgetViewV303 = Readonly<{
  version: typeof KERR_ERROR_BUDGET_VERSION_V303;
  status: "sparse-qualified-dense-incomplete";
  authority: Readonly<{
    geometryEvidenceSha256: typeof KERR_GEOMETRY_EVIDENCE_SHA256_V301;
    geometryFileSha256: typeof KERR_GEOMETRY_FILE_SHA256_V301;
    polarizationEvidenceSha256: typeof KERR_POLARIZATION_EVIDENCE_SHA256_V301;
    polarizationFileSha256: typeof KERR_POLARIZATION_FILE_SHA256_V301;
    rayPlanSha256: typeof KERR_RAY_PLAN_SHA256_V301;
    rayPlanFileSha256: typeof KERR_RAY_PLAN_FILE_SHA256_V301;
    shard0AuditSha256: typeof KERR_SHARD0_AUDIT_SHA256_V303;
    shard0AuditFileSha256: typeof KERR_SHARD0_AUDIT_FILE_SHA256_V303;
    campaignStateSha256: typeof KERR_CAMPAIGN_STATE_SHA256_V303;
    campaignStateFileSha256: typeof KERR_CAMPAIGN_STATE_FILE_SHA256_V303;
  }>;
  policy: Readonly<{
    independenceAssumption: "not-established";
    combinationPolicy: "componentwise-reporting-no-rss-no-cross-dimension-sum";
    scalarCombinedUncertainty: "forbidden";
  }>;
  sparse: Readonly<{
    status: "qualified-short-authority";
    scope: "complete-v296-v297-short-authority";
    geometryExecutionCount: 128;
    polarizationExecutionCount: 16;
    canonicalRayCount: 16;
    components: readonly KerrErrorBudgetComponentV303[];
  }>;
  dense: Readonly<{
    status: "incomplete-1-of-49";
    scope: "shard-0-structural-audit-only";
    completedShardCount: 1;
    plannedShardCount: 49;
    auditedRayCount: 64;
    auditedExecutionCount: 512;
    statisticalGatesApplied: false;
    aggregateEligible: false;
    campaignPartialAggregate: false;
    denseAggregateSha256: null;
    components: readonly KerrErrorBudgetComponentV303[];
  }>;
  unreportedComponents: Readonly<{
    uReference: string;
    uInitialState: string;
    uFit: string;
    uConstants: string;
    uModel: string;
  }>;
  maxima: Readonly<{
    sparseThresholdUtilization: number;
    denseShardThresholdUtilization: number;
  }>;
  boundary: "shard-budget-is-not-dense-aggregate-qualification";
}>;

type UnknownRecord = Record<string, unknown>;

function record(value: unknown, label: string): UnknownRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`v303-${label}-invalid`);
  return value as UnknownRecord;
}

function parseComponents(value: unknown, layer: "sparse" | "dense"): readonly KerrErrorBudgetComponentV303[] {
  if (!Array.isArray(value) || value.length !== KERR_ERROR_COMPONENT_IDS_V303.length) {
    throw new Error(`v303-${layer}-component-count-invalid`);
  }
  const components = value.map((entry, index) => {
    const candidate = record(entry, `${layer}-component-${index}`);
    const id = KERR_ERROR_COMPONENT_IDS_V303[index];
    const contract = COMPONENT_CONTRACT[id];
    if (candidate.id !== id
      || typeof candidate.observed !== "number" || !Number.isFinite(candidate.observed) || candidate.observed < 0
      || candidate.threshold !== contract.threshold
      || candidate.unit !== contract.unit
      || candidate.comparison !== "maximum-exclusive"
      || candidate.passed !== true
      || candidate.observed >= contract.threshold
      || typeof candidate.source !== "string" || candidate.source.length < 3 || candidate.source.length > 160) {
      throw new Error(`v303-${layer}-component-contract-failed`);
    }
    return Object.freeze({
      id,
      observed: candidate.observed,
      threshold: contract.threshold,
      unit: contract.unit,
      comparison: "maximum-exclusive" as const,
      passed: true as const,
      source: candidate.source,
    });
  });
  return Object.freeze(components);
}

const utilization = (components: readonly KerrErrorBudgetComponentV303[]) => Math.max(...components.map((component) => component.observed / component.threshold));

export function parseKerrLayeredErrorBudgetViewV303(source: unknown): KerrLayeredErrorBudgetViewV303 {
  const candidate = record(source, "view");
  const authority = record(candidate.authority, "authority");
  const policy = record(candidate.policy, "policy");
  const sparseSource = record(candidate.sparse, "sparse");
  const denseSource = record(candidate.dense, "dense");
  if (candidate.version !== KERR_ERROR_BUDGET_VERSION_V303
    || candidate.status !== "sparse-qualified-dense-incomplete"
    || candidate.boundary !== "shard-budget-is-not-dense-aggregate-qualification"
    || authority.geometryEvidenceSha256 !== KERR_GEOMETRY_EVIDENCE_SHA256_V301
    || authority.geometryFileSha256 !== KERR_GEOMETRY_FILE_SHA256_V301
    || authority.polarizationEvidenceSha256 !== KERR_POLARIZATION_EVIDENCE_SHA256_V301
    || authority.polarizationFileSha256 !== KERR_POLARIZATION_FILE_SHA256_V301
    || authority.rayPlanSha256 !== KERR_RAY_PLAN_SHA256_V301
    || authority.rayPlanFileSha256 !== KERR_RAY_PLAN_FILE_SHA256_V301
    || authority.shard0AuditSha256 !== KERR_SHARD0_AUDIT_SHA256_V303
    || authority.shard0AuditFileSha256 !== KERR_SHARD0_AUDIT_FILE_SHA256_V303
    || authority.campaignStateSha256 !== KERR_CAMPAIGN_STATE_SHA256_V303
    || authority.campaignStateFileSha256 !== KERR_CAMPAIGN_STATE_FILE_SHA256_V303
    || policy.independenceAssumption !== "not-established"
    || policy.combinationPolicy !== "componentwise-reporting-no-rss-no-cross-dimension-sum"
    || policy.scalarCombinedUncertainty !== "forbidden") {
    throw new Error("v303-error-budget-authority-lock-mismatch");
  }
  if (sparseSource.status !== "qualified-short-authority"
    || sparseSource.scope !== "complete-v296-v297-short-authority"
    || sparseSource.geometryExecutionCount !== 128
    || sparseSource.polarizationExecutionCount !== 16
    || sparseSource.canonicalRayCount !== 16) throw new Error("v303-sparse-scope-conservation-failed");
  if (denseSource.status !== "incomplete-1-of-49"
    || denseSource.scope !== "shard-0-structural-audit-only"
    || denseSource.completedShardCount !== 1
    || denseSource.plannedShardCount !== 49
    || denseSource.auditedRayCount !== 64
    || denseSource.auditedExecutionCount !== 512
    || denseSource.statisticalGatesApplied !== false
    || denseSource.aggregateEligible !== false
    || denseSource.campaignPartialAggregate !== false
    || denseSource.denseAggregateSha256 !== null) throw new Error("v303-dense-partial-boundary-failed");
  const sparseComponents = parseComponents(sparseSource.components, "sparse");
  const denseComponents = parseComponents(denseSource.components, "dense");
  const maxima = Object.freeze({
    sparseThresholdUtilization: utilization(sparseComponents),
    denseShardThresholdUtilization: utilization(denseComponents),
  });
  const sourceMaxima = record(candidate.maxima, "maxima");
  if (sourceMaxima.sparseThresholdUtilization !== maxima.sparseThresholdUtilization
    || sourceMaxima.denseShardThresholdUtilization !== maxima.denseShardThresholdUtilization) {
    throw new Error("v303-error-budget-maxima-conservation-failed");
  }
  const unreported = record(candidate.unreportedComponents, "unreported-components");
  const unreportedKeys = ["uReference", "uInitialState", "uFit", "uConstants", "uModel"] as const;
  if (unreportedKeys.some((key) => typeof unreported[key] !== "string" || String(unreported[key]).length < 3)) {
    throw new Error("v303-unreported-component-contract-failed");
  }
  return Object.freeze({
    version: KERR_ERROR_BUDGET_VERSION_V303,
    status: "sparse-qualified-dense-incomplete",
    authority: Object.freeze({
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
    }),
    policy: Object.freeze({
      independenceAssumption: "not-established",
      combinationPolicy: "componentwise-reporting-no-rss-no-cross-dimension-sum",
      scalarCombinedUncertainty: "forbidden",
    }),
    sparse: Object.freeze({
      status: "qualified-short-authority",
      scope: "complete-v296-v297-short-authority",
      geometryExecutionCount: 128,
      polarizationExecutionCount: 16,
      canonicalRayCount: 16,
      components: sparseComponents,
    }),
    dense: Object.freeze({
      status: "incomplete-1-of-49",
      scope: "shard-0-structural-audit-only",
      completedShardCount: 1,
      plannedShardCount: 49,
      auditedRayCount: 64,
      auditedExecutionCount: 512,
      statisticalGatesApplied: false,
      aggregateEligible: false,
      campaignPartialAggregate: false,
      denseAggregateSha256: null,
      components: denseComponents,
    }),
    unreportedComponents: Object.freeze(Object.fromEntries(unreportedKeys.map((key) => [key, String(unreported[key])])) as KerrLayeredErrorBudgetViewV303["unreportedComponents"]),
    maxima,
    boundary: "shard-budget-is-not-dense-aggregate-qualification",
  });
}

export function createKerrErrorBudgetComponentV303(
  id: KerrErrorComponentIdV303,
  observed: number,
  source: string,
): KerrErrorBudgetComponentV303 {
  const contract = COMPONENT_CONTRACT[id];
  return Object.freeze({
    id,
    observed,
    threshold: contract.threshold,
    unit: contract.unit,
    comparison: "maximum-exclusive",
    passed: true,
    source,
  });
}
