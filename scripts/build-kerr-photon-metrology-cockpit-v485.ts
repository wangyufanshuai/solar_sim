import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import {
  canonicalKerrFrequencyProvenanceViewerV479,
  parseKerrFrequencyProvenanceArtifactV479,
} from "../app/lib/kerrFrequencyProvenanceViewerV479";
import {
  canonicalKerrPhotonEvidenceWorkbenchV480,
  parseKerrPhotonEvidenceWorkbenchArtifactV480,
} from "../app/lib/kerrPhotonEvidenceWorkbenchV480";
import {
  canonicalKerrSpectralLandmarkTransportV481,
  parseKerrSpectralLandmarkArtifactV481,
} from "../app/lib/kerrSpectralLandmarkTransportV481";
import {
  canonicalKerrSpectralLandmarkCovarianceV482,
  parseKerrSpectralLandmarkCovarianceArtifactV482,
} from "../app/lib/kerrSpectralLandmarkCovarianceV482";
import {
  canonicalKerrSpectralSensitivityModesV483,
  parseKerrSpectralSensitivityArtifactV483,
} from "../app/lib/kerrSpectralSensitivityModesV483";
import {
  canonicalKerrSpectralIdentifiabilityV484,
  parseKerrSpectralIdentifiabilityArtifactV484,
} from "../app/lib/kerrSpectralIdentifiabilityV484";
import {
  canonicalKerrPhotonMetrologyCockpitV485,
  KERR_PHOTON_METROLOGY_COCKPIT_ARTIFACT_VERSION_V485,
  parseKerrPhotonMetrologyCockpitArtifactV485,
  type KerrPhotonMetrologyStageV485,
} from "../app/lib/kerrPhotonMetrologyCockpitV485";

type Json = Record<string, unknown>;
const root = process.cwd();
const paths = Object.freeze({
  v479: "dist/science/kerr-frequency-provenance-viewer-v479/provenance-viewer.json",
  v480: "dist/science/kerr-photon-evidence-workbench-v480/workbench.json",
  v481: "dist/science/kerr-spectral-landmark-transport-v481/landmarks.json",
  v482: "dist/science/kerr-spectral-landmark-covariance-v482/covariance.json",
  v483: "dist/science/kerr-spectral-sensitivity-modes-v483/sensitivity-modes.json",
  v484: "dist/science/kerr-spectral-identifiability-v484/identifiability.json",
  dense: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  output: "dist/science/kerr-photon-metrology-cockpit-v485/cockpit.json",
});
const read = (path: string): Json =>
  JSON.parse(readFileSync(resolve(root, path), "utf8")) as Json;
const digest = (value: string | Uint8Array) =>
  createHash("sha256").update(value).digest("hex");
const fileSha = (path: string) => digest(readFileSync(resolve(root, path)));
const canonicalSha = (value: unknown) => digest(canonicalKerrPhotonMetrologyCockpitV485(value));
const nested = (value: Json, key: string) => (value[key] ?? {}) as Json;
const atomic = (path: string, value: unknown) => {
  const target = resolve(root, path);
  mkdirSync(dirname(target), { recursive: true });
  const part = `${target}.${process.pid}.part`;
  writeFileSync(part, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  renameSync(part, target);
};

const v479 = parseKerrFrequencyProvenanceArtifactV479(read(paths.v479));
const v480 = parseKerrPhotonEvidenceWorkbenchArtifactV480(read(paths.v480));
const v481 = parseKerrSpectralLandmarkArtifactV481(read(paths.v481));
const v482 = parseKerrSpectralLandmarkCovarianceArtifactV482(read(paths.v482));
const v483 = parseKerrSpectralSensitivityArtifactV483(read(paths.v483));
const v484 = parseKerrSpectralIdentifiabilityArtifactV484(read(paths.v484));
const dense = read(paths.dense);
const formal = read(paths.formal);
const formalEvidence = read(String(formal.source));
const formalScience = nested(formalEvidence, "science");
const formalContracts = nested(formalEvidence, "contracts");

if (
  digest(canonicalKerrFrequencyProvenanceViewerV479(v479)) !== v479.artifactSha256 ||
  digest(canonicalKerrPhotonEvidenceWorkbenchV480(v480)) !== v480.artifactSha256 ||
  digest(canonicalKerrSpectralLandmarkTransportV481(v481)) !== v481.artifactSha256 ||
  digest(canonicalKerrSpectralLandmarkCovarianceV482(v482)) !== v482.artifactSha256 ||
  digest(canonicalKerrSpectralSensitivityModesV483(v483)) !== v483.artifactSha256 ||
  digest(canonicalKerrSpectralIdentifiabilityV484(v484)) !== v484.artifactSha256 ||
  v479.audit.sciencePixelRows !== 0 ||
  v480.products.filter((product) => product.available).length !== 2 ||
  v480.products.filter((product) => !product.available).length !== 7 ||
  v481.audit.landmarkCount !== 20 ||
  v482.audit.rankOneMatrixCount !== 4 ||
  v483.audit.projectionCount !== 20 ||
  v484.audit.identifiableDimensionCount !== 4 ||
  v484.audit.unidentifiableDimensionCount !== 16 ||
  dense.status !== "incomplete-0-of-49" ||
  dense.completedShardCount !== 0 ||
  dense.attemptConsumed !== false ||
  dense.aggregateAvailable !== false ||
  formal.version !== "v263-current-product-evidence-pointer" ||
  formalScience.defaultKernel !== "legacy-eih-1pn" ||
  formalContracts.singleCanvas !== true ||
  formalContracts.legacyRootAttributes !== 603 ||
  formalContracts.evidenceLedgerClaims !== 84
) {
  throw new Error("v485-upstream-boundary");
}

const stages = Object.freeze([
  Object.freeze({
    id: "v479-frequency-provenance" as const,
    ordinal: 1 as const,
    label: "Frequency provenance",
    status: v479.status,
    artifactSha256: v479.artifactSha256,
    fileSha256: fileSha(paths.v479),
    authorityClass: "bounded-science" as const,
    primaryMetric: "4 rays / 20 samples",
    secondaryMetric: "5-stage source chain",
    detailEndpoint: "/api/atlas/relativity-evidence/v479/frequency-provenance-viewer",
    downloadHref:
      "/api/atlas/relativity-evidence/v479/frequency-provenance-viewer?download=provenance-viewer",
    browserQualification: "not-run" as const,
    scienceWritebackAllowed: false as const,
  }),
  Object.freeze({
    id: "v480-product-admission" as const,
    ordinal: 2 as const,
    label: "Product admission",
    status: v480.status,
    artifactSha256: v480.artifactSha256,
    fileSha256: fileSha(paths.v480),
    authorityClass: "admission-ledger" as const,
    primaryMetric: "2 allowed / 7 blocked",
    secondaryMetric: "production fail-closed",
    detailEndpoint: "/api/atlas/relativity-evidence/v480/photon-evidence-workbench",
    downloadHref:
      "/api/atlas/relativity-evidence/v480/photon-evidence-workbench?download=workbench",
    browserQualification: "not-run" as const,
    scienceWritebackAllowed: false as const,
  }),
  Object.freeze({
    id: "v481-landmark-transport" as const,
    ordinal: 3 as const,
    label: "Landmark transport",
    status: v481.status,
    artifactSha256: v481.artifactSha256,
    fileSha256: fileSha(paths.v481),
    authorityClass: "bounded-science" as const,
    primaryMetric: "20 landmarks",
    secondaryMetric: "40 ratio / 16 spacing audits",
    detailEndpoint: "/api/atlas/relativity-evidence/v481/spectral-landmarks",
    downloadHref: "/api/atlas/relativity-evidence/v481/spectral-landmarks?download=landmarks",
    browserQualification: "not-run" as const,
    scienceWritebackAllowed: false as const,
  }),
  Object.freeze({
    id: "v482-correlated-uncertainty" as const,
    ordinal: 4 as const,
    label: "Correlated uncertainty",
    status: v482.status,
    artifactSha256: v482.artifactSha256,
    fileSha256: fileSha(paths.v482),
    authorityClass: "algebraic-science" as const,
    primaryMetric: "4 rank-1 matrices",
    secondaryMetric: "100 bounded elements",
    detailEndpoint: "/api/atlas/relativity-evidence/v482/spectral-landmark-covariance",
    downloadHref:
      "/api/atlas/relativity-evidence/v482/spectral-landmark-covariance?download=covariance",
    browserQualification: "not-run" as const,
    scienceWritebackAllowed: false as const,
  }),
  Object.freeze({
    id: "v483-sensitivity-modes" as const,
    ordinal: 5 as const,
    label: "Sensitivity modes",
    status: v483.status,
    artifactSha256: v483.artifactSha256,
    fileSha256: fileSha(paths.v483),
    authorityClass: "algebraic-science" as const,
    primaryMetric: "5 modes / 20 projections",
    secondaryMetric: "1 sensitive / 4 nullspace",
    detailEndpoint: "/api/atlas/relativity-evidence/v483/spectral-sensitivity-modes",
    downloadHref:
      "/api/atlas/relativity-evidence/v483/spectral-sensitivity-modes?download=sensitivity-modes",
    browserQualification: "not-run" as const,
    scienceWritebackAllowed: false as const,
  }),
  Object.freeze({
    id: "v484-identifiability" as const,
    ordinal: 6 as const,
    label: "Identifiability",
    status: v484.status,
    artifactSha256: v484.artifactSha256,
    fileSha256: fileSha(paths.v484),
    authorityClass: "algebraic-science" as const,
    primaryMetric: "1/5 identifiable",
    secondaryMetric: "16 Penrose audits",
    detailEndpoint: "/api/atlas/relativity-evidence/v484/spectral-identifiability",
    downloadHref:
      "/api/atlas/relativity-evidence/v484/spectral-identifiability?download=identifiability",
    browserQualification: "not-run" as const,
    scienceWritebackAllowed: false as const,
  }),
]) satisfies readonly KerrPhotonMetrologyStageV485[];

const unsigned = {
  version: KERR_PHOTON_METROLOGY_COCKPIT_ARTIFACT_VERSION_V485,
  generatedAt: "2026-08-01T00:00:00Z",
  status: "photon-metrology-cockpit-qualified-heavy-runtime-pending" as const,
  source: {
    v479: fileSha(paths.v479),
    v480: fileSha(paths.v480),
    v481: fileSha(paths.v481),
    v482: fileSha(paths.v482),
    v483: fileSha(paths.v483),
    v484: fileSha(paths.v484),
    dense: fileSha(paths.dense),
    formal: fileSha(paths.formal),
  },
  contract: {
    stageCount: 6 as const,
    stageMetricCount: 12 as const,
    detailEndpointCount: 6 as const,
    summaryMatrixElementCount: 0 as const,
    summaryProjectionRecordCount: 0 as const,
    summaryExecutionRecordCount: 0 as const,
    noLargeMatricesInReactState: true as const,
    noFullScientificArraysInReactState: true as const,
    detailsRemainInWhitelistedArtifacts: true as const,
    immutableStageShaChainRequired: true as const,
    boundedSummaryOnly: true as const,
    maximumResponseBytes: 131072 as const,
    localShadowOnly: true as const,
    formalProductPointer: "v263" as const,
  },
  stages,
  stageChainSha256: canonicalSha(stages),
  overview: {
    provenanceStageCount: 5 as const,
    sourceStageCount: 6 as const,
    sparseScienceRayCount: 4 as const,
    normalizedFrequencySampleCount: 20 as const,
    allowedProductCount: 2 as const,
    blockedProductCount: 7 as const,
    landmarkCount: 20 as const,
    covarianceMatrixCount: 4 as const,
    covarianceRank: 1 as const,
    sensitivityModeCount: 5 as const,
    sensitivityProjectionCount: 20 as const,
    identifiableDimension: 1 as const,
    unidentifiableDimension: 4 as const,
    penroseAuditCount: 16 as const,
    sciencePixelRows: 0 as const,
    imageProducts: 0 as const,
  },
  availability: {
    normalizedFrequencyCoordinates: "qualified" as const,
    sparseVectorProducts: "qualified-2-products" as const,
    correlatedUncertaintyUpperBound: "qualified-rank-1" as const,
    algebraicIdentifiability: "qualified-1-of-5" as const,
    physicalLineIdentity: "blocked" as const,
    absoluteFrequency: "blocked" as const,
    physicalBandpass: "blocked" as const,
    detectorResponse: "blocked" as const,
    observedIntensity: "blocked" as const,
    statisticalLikelihood: "blocked" as const,
    parameterPosterior: "blocked" as const,
    denseAggregate: "blocked-0-of-49" as const,
    scienceRaster: "blocked" as const,
  },
  presentation: {
    science: v484.presentation.science,
    cinematic: v484.presentation.cinematic,
    stageMetricsSharedAcrossViews: true as const,
    stageMetricMutationAllowed: false as const,
    scienceWritebackAllowed: false as const,
    cinematicScienceWritebackAllowed: false as const,
  },
  audit: {
    stageCount: 6 as const,
    stageShaCount: 6 as const,
    brokenStageLinks: 0 as const,
    summaryMatrixElementCount: 0 as const,
    summaryProjectionRecordCount: 0 as const,
    summaryExecutionRecordCount: 0 as const,
    presentationScientificFieldCount: 0 as const,
    stageMetricMutationCount: 0 as const,
    scienceWritebackCount: 0 as const,
    absoluteFrequencyRows: 0 as const,
    physicalBandpassRows: 0 as const,
    observedIntensityRows: 0 as const,
    sciencePixelRows: 0 as const,
    imageProducts: 0 as const,
    stageChainQualified: true as const,
    boundedSummaryQualified: true as const,
    detailArtifactsIsolated: true as const,
  },
  lifecycle: v484.lifecycle,
  boundary: {
    cockpitSummaryAuthorityGranted: true as const,
    detailedArtifactsAutoLoaded: false as const,
    physicalDetectorObservableAuthorityGranted: false as const,
    statisticalLikelihoodAuthorityGranted: false as const,
    observedSpectrumAuthorityGranted: false as const,
    scienceRasterAuthorityGranted: false as const,
    presentationMayGrantScienceAuthority: false as const,
    networkAttempted: false as const,
    automaticRetryApplied: false as const,
    denseShardRunAllowed: false as const,
    denseCampaignStatus: "incomplete-0-of-49" as const,
    browserQualification: "not-run" as const,
    visualMatrixQualification: "not-run" as const,
    soakQualification: "not-run" as const,
    rtxWebGpuQualification: "not-run" as const,
  },
  formalProductPointer: "v263" as const,
  formalDefaultKernel: "legacy-eih-1pn" as const,
};
const artifact = parseKerrPhotonMetrologyCockpitArtifactV485({
  ...unsigned,
  artifactSha256: canonicalSha(unsigned),
});
atomic(paths.output, artifact);
console.log(
  JSON.stringify(
    {
      status: artifact.status,
      artifactSha256: artifact.artifactSha256,
      stageChainSha256: artifact.stageChainSha256,
      stages: 6,
      stageMetrics: 12,
      summaryMatrixElements: 0,
      summaryProjectionRecords: 0,
      summaryExecutionRecords: 0,
      detailEndpoints: 6,
      qualifiedCapabilities: 4,
      blockedCapabilities: 9,
      sciencePixels: 0,
      denseCampaign: "0/49",
      browserQualification: "not-run",
      formalProductPointer: "v263",
    },
    null,
    2,
  ),
);
