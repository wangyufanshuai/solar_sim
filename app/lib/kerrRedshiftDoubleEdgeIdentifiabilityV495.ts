export const KERR_REDSHIFT_DOUBLE_EDGE_IDENTIFIABILITY_VERSION_V495 = "v495-kerr-redshift-double-edge-identifiability-artifact-v1" as const;
export const KERR_REDSHIFT_DOUBLE_EDGE_IDENTIFIABILITY_API_VERSION_V495 = "v495-kerr-redshift-double-edge-identifiability-api-v1" as const;

export interface KerrRedshiftDoubleEdgePredictionV495 { edgeIndex: number; edgeId: string; predictedLogContrast: number; sourceLogContrast: number; absoluteResidual: number }
export interface KerrRedshiftDoubleEdgeCaseV495 {
  caseId: string; removedEdgeIndices: readonly number[]; removedEdgeIds: readonly string[]; removalClass: "adjacent" | "disjoint";
  retainedEdgeCount: 4; connected: true; belowMinimumEdgeCut: true; laplacianRank: 3; gaugeNullity: 1; cycleSpaceDimension: 1;
  eigenvalues: readonly number[]; numericalEigenvalues: readonly number[]; eigenvalueResidual: number; nonzeroConditionNumber: number; expectedConditionNumber: 2 | 4;
  nodeResidual: number; retainedEdgeResidual: number; maximumRemovedEdgePredictionResidual: number; removedEdgePredictions: readonly KerrRedshiftDoubleEdgePredictionV495[]; penroseResidual: number;
  nodeUncertaintyUpperBounds: readonly number[]; uncertaintyCombinationPolicy: "linear-absolute-weight-sum-cross-edge-correlation-unknown";
  incidence: readonly (number[])[]; laplacian: readonly (number[])[]; pseudoinverse: readonly (number[])[]; uncertaintyOperator: readonly (number[])[]; reconstructed: readonly number[];
}
export interface KerrRedshiftDoubleEdgeIdentifiabilityArtifactV495 {
  version: typeof KERR_REDSHIFT_DOUBLE_EDGE_IDENTIFIABILITY_VERSION_V495;
  status: "double-edge-identifiability-qualified-statistical-robustness-blocked-browser-pending";
  contract: Readonly<{ nodeCount: 4; fullEdgeCount: 6; removedEdgeCountPerCase: 2; retainedEdgeCountPerCase: 4; deletionCaseCount: 15; adjacentCaseCount: 12; disjointCaseCount: 3; minimumEdgeCut: 3; deletionBelowMinimumCut: true; deletionRank: 3; deletionGaugeNullity: 1; deletionCycleSpaceDimension: 1; adjacentSpectrum: readonly number[]; adjacentNonzeroConditionNumber: 4; disjointSpectrum: readonly number[]; disjointNonzeroConditionNumber: 2; deterministicIdentifiabilityOnly: true; statisticalJackknifeAuthorityGranted: false; noiseRobustnessAuthorityGranted: false; uncertaintyCombinationPolicy: "linear-absolute-weight-sum-cross-edge-correlation-unknown"; rssAllowed: false; maximumResponseBytes: number; localShadowOnly: true; formalProductPointer: "v263" }>;
  deletionCases: readonly KerrRedshiftDoubleEdgeCaseV495[];
  payloadSha256: string;
  vectorDiagnostic: Readonly<{ path: string; mediaType: "image/svg+xml; charset=utf-8"; width: 1440; height: 1120; fileSha256: string; deterministic: true; linearDisplay: true; bloomIntensity: 0; colorGradeIntensity: 0; scientificFieldMutationAllowed: false }>;
  audit: Readonly<{ connectedCaseCount: 15; adjacentCaseCount: 12; disjointCaseCount: 3; maximumEigenvalueResidual: number; maximumNodeResidual: number; maximumRetainedEdgeResidual: number; maximumRemovedEdgePredictionResidual: number; maximumPenroseResidual: number; maximumConditionResidual: number; detailedMatrixElementCount: number; summaryMatrixElementCount: 0; detectorObservableRows: 0; observedIntensityRows: 0; sciencePixelRows: 0; fitsProducts: 0; pngProducts: 0 }>;
  boundary: Readonly<{ doubleEdgeIdentifiabilityAuthorityGranted: true; belowMinimumCutConnectivityAuthorityGranted: true; heldEdgePredictionAuthorityGranted: true; statisticalJackknifeAuthorityGranted: false; noiseRobustnessAuthorityGranted: false; crossEdgeStatisticalCovarianceAuthorityGranted: false; absoluteCalibrationAuthorityGranted: false; physicalBandpassAuthorityGranted: false; observedIntensityAuthorityGranted: false; statisticalLikelihoodAuthorityGranted: false; scienceRasterAuthorityGranted: false; denseCampaignStatus: "incomplete-0-of-49"; browserQualification: "not-run" }>;
  sourceSha256: string; artifactSha256: string; formalProductPointer: "v263"; formalDefaultKernel: "legacy-eih-1pn";
}
export type KerrRedshiftDoubleEdgeIdentifiabilitySummaryV495 = Readonly<{
  version: typeof KERR_REDSHIFT_DOUBLE_EDGE_IDENTIFIABILITY_VERSION_V495;
  status: KerrRedshiftDoubleEdgeIdentifiabilityArtifactV495["status"];
  deletionCases: readonly Omit<KerrRedshiftDoubleEdgeCaseV495, "incidence" | "laplacian" | "pseudoinverse" | "uncertaintyOperator" | "reconstructed">[];
  payloadSha256: string; artifactSha256: string; svgSha256: string; svgHref: string;
  audit: KerrRedshiftDoubleEdgeIdentifiabilityArtifactV495["audit"];
  boundary: KerrRedshiftDoubleEdgeIdentifiabilityArtifactV495["boundary"];
}>;
export type KerrRedshiftDoubleEdgeIdentifiabilityApiV495 = Readonly<{ version: typeof KERR_REDSHIFT_DOUBLE_EDGE_IDENTIFIABILITY_API_VERSION_V495; available: boolean; reason: string; summary: KerrRedshiftDoubleEdgeIdentifiabilitySummaryV495 | null }>;

const record = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === "object" && !Array.isArray(value);
const isSha = (value: unknown): value is string => typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
const finite = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
const expectedSpectrum = (kind: unknown, value: unknown): boolean => {
  const expected = kind === "adjacent" ? [0, 1, 3, 4] : kind === "disjoint" ? [0, 2, 2, 4] : null;
  return Boolean(expected) && Array.isArray(value) && value.length === 4 && value.every((entry, index) => entry === expected?.[index]);
};
const validCase = (value: unknown): boolean => record(value) && (value.removalClass === "adjacent" || value.removalClass === "disjoint") && value.retainedEdgeCount === 4 && value.connected === true && value.belowMinimumEdgeCut === true && value.laplacianRank === 3 && value.gaugeNullity === 1 && value.cycleSpaceDimension === 1 && expectedSpectrum(value.removalClass, value.eigenvalues) && Array.isArray(value.numericalEigenvalues) && value.numericalEigenvalues.length === 4 && value.numericalEigenvalues.every(finite) && finite(value.eigenvalueResidual) && value.eigenvalueResidual <= 5e-15 && finite(value.nonzeroConditionNumber) && finite(value.expectedConditionNumber) && Math.abs(value.nonzeroConditionNumber - value.expectedConditionNumber) <= 5e-15 && finite(value.nodeResidual) && value.nodeResidual <= 1e-15 && finite(value.retainedEdgeResidual) && value.retainedEdgeResidual <= 1e-15 && finite(value.maximumRemovedEdgePredictionResidual) && value.maximumRemovedEdgePredictionResidual <= 1e-15 && Array.isArray(value.removedEdgePredictions) && value.removedEdgePredictions.length === 2 && finite(value.penroseResidual) && value.penroseResidual <= 1e-15 && value.uncertaintyCombinationPolicy === "linear-absolute-weight-sum-cross-edge-correlation-unknown";

export function canonicalKerrRedshiftDoubleEdgeIdentifiabilityV495(value: unknown): string {
  const transient = new Set(["generatedAt", "artifactSha256", "payloadSha256", "stageChainSha256", "evidenceSha256", "pointerSha256"]);
  const normalize = (entry: unknown): unknown => Array.isArray(entry) ? entry.map(normalize) : !record(entry) ? entry : Object.fromEntries(Object.entries(entry).filter(([key]) => !transient.has(key)).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([key, nested]) => [key, normalize(nested)]));
  return JSON.stringify(normalize(value));
}

export function parseKerrRedshiftDoubleEdgeIdentifiabilityArtifactV495(value: unknown): KerrRedshiftDoubleEdgeIdentifiabilityArtifactV495 {
  if (!record(value) || value.version !== KERR_REDSHIFT_DOUBLE_EDGE_IDENTIFIABILITY_VERSION_V495 || value.status !== "double-edge-identifiability-qualified-statistical-robustness-blocked-browser-pending" || !record(value.contract) || value.contract.deletionCaseCount !== 15 || value.contract.adjacentCaseCount !== 12 || value.contract.disjointCaseCount !== 3 || value.contract.minimumEdgeCut !== 3 || value.contract.statisticalJackknifeAuthorityGranted !== false || value.contract.noiseRobustnessAuthorityGranted !== false || value.contract.rssAllowed !== false || !Array.isArray(value.deletionCases) || value.deletionCases.length !== 15 || !value.deletionCases.every(validCase) || !isSha(value.payloadSha256) || !isSha(value.artifactSha256) || !record(value.vectorDiagnostic) || !isSha(value.vectorDiagnostic.fileSha256) || !record(value.audit) || value.audit.connectedCaseCount !== 15 || value.audit.adjacentCaseCount !== 12 || value.audit.disjointCaseCount !== 3 || !finite(value.audit.maximumEigenvalueResidual) || value.audit.maximumEigenvalueResidual > 5e-15 || !finite(value.audit.maximumRemovedEdgePredictionResidual) || value.audit.maximumRemovedEdgePredictionResidual > 1e-15 || value.audit.summaryMatrixElementCount !== 0 || value.audit.sciencePixelRows !== 0 || !record(value.boundary) || value.boundary.doubleEdgeIdentifiabilityAuthorityGranted !== true || value.boundary.statisticalJackknifeAuthorityGranted !== false || value.boundary.noiseRobustnessAuthorityGranted !== false || value.boundary.scienceRasterAuthorityGranted !== false || value.boundary.denseCampaignStatus !== "incomplete-0-of-49" || value.boundary.browserQualification !== "not-run" || value.formalProductPointer !== "v263" || value.formalDefaultKernel !== "legacy-eih-1pn") throw new Error("v495-double-edge-boundary");
  return value as unknown as KerrRedshiftDoubleEdgeIdentifiabilityArtifactV495;
}

export function createKerrRedshiftDoubleEdgeIdentifiabilitySummaryV495(value: unknown): KerrRedshiftDoubleEdgeIdentifiabilitySummaryV495 {
  const artifact = parseKerrRedshiftDoubleEdgeIdentifiabilityArtifactV495(value);
  const deletionCases = artifact.deletionCases.map(({ incidence, laplacian, pseudoinverse, uncertaintyOperator, reconstructed, ...entry }) => { void incidence; void laplacian; void pseudoinverse; void uncertaintyOperator; void reconstructed; return entry; });
  return Object.freeze({ version: artifact.version, status: artifact.status, deletionCases, payloadSha256: artifact.payloadSha256, artifactSha256: artifact.artifactSha256, svgSha256: artifact.vectorDiagnostic.fileSha256, svgHref: "/api/atlas/relativity-evidence/v495/redshift-double-edge-identifiability?format=svg", audit: artifact.audit, boundary: artifact.boundary });
}

export function parseKerrRedshiftDoubleEdgeIdentifiabilitySummaryV495(value: unknown): KerrRedshiftDoubleEdgeIdentifiabilitySummaryV495 {
  if (!record(value) || value.version !== KERR_REDSHIFT_DOUBLE_EDGE_IDENTIFIABILITY_VERSION_V495 || !Array.isArray(value.deletionCases) || value.deletionCases.length !== 15 || !isSha(value.payloadSha256) || !isSha(value.artifactSha256) || !isSha(value.svgSha256) || value.svgHref !== "/api/atlas/relativity-evidence/v495/redshift-double-edge-identifiability?format=svg" || !record(value.audit) || value.audit.summaryMatrixElementCount !== 0 || !record(value.boundary) || value.boundary.scienceRasterAuthorityGranted !== false) throw new Error("v495-summary-boundary");
  return value as unknown as KerrRedshiftDoubleEdgeIdentifiabilitySummaryV495;
}

export function parseKerrRedshiftDoubleEdgeIdentifiabilityApiV495(value: unknown): KerrRedshiftDoubleEdgeIdentifiabilityApiV495 {
  if (!record(value) || value.version !== KERR_REDSHIFT_DOUBLE_EDGE_IDENTIFIABILITY_API_VERSION_V495 || typeof value.available !== "boolean" || typeof value.reason !== "string") throw new Error("v495-api-shape");
  if (value.available) parseKerrRedshiftDoubleEdgeIdentifiabilitySummaryV495(value.summary); else if (value.summary !== null) throw new Error("v495-api-unavailable-summary");
  return value as unknown as KerrRedshiftDoubleEdgeIdentifiabilityApiV495;
}
