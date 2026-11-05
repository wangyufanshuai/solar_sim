import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { canonicalKerrDualRenderPayloadV475 } from "../app/lib/kerrDualRenderBoundaryV475";
import {
  canonicalKerrFrequencyProvenanceViewerV479,
  parseKerrFrequencyProvenanceArtifactV479,
} from "../app/lib/kerrFrequencyProvenanceViewerV479";
import {
  canonicalKerrPhotonEvidenceWorkbenchV480,
  KERR_PHOTON_EVIDENCE_WORKBENCH_ARTIFACT_VERSION_V480,
  parseKerrPhotonEvidenceWorkbenchArtifactV480,
  type KerrPhotonEvidenceProductV480,
  type KerrPhotonEvidenceProvenanceV480,
} from "../app/lib/kerrPhotonEvidenceWorkbenchV480";
import {
  canonicalKerrScienceProductAdmissionV476,
  parseKerrScienceProductAdmissionArtifactV476,
} from "../app/lib/kerrScienceProductAdmissionV476";

type Json = Record<string, unknown>;
const root = process.cwd();
const paths = Object.freeze({
  v475: "dist/science/kerr-dual-render-boundary-v475/dual-render.json",
  v476: "dist/science/kerr-science-product-admission-v476/admission.json",
  v479: "dist/science/kerr-frequency-provenance-viewer-v479/provenance-viewer.json",
  dense: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  output: "dist/science/kerr-photon-evidence-workbench-v480/workbench.json",
});

const read = (path: string): Json =>
  JSON.parse(readFileSync(resolve(root, path), "utf8")) as Json;
const digest = (value: string | Uint8Array) =>
  createHash("sha256").update(value).digest("hex");
const fileSha = (path: string) => digest(readFileSync(resolve(root, path)));
const canonicalSha = (value: unknown) =>
  digest(canonicalKerrPhotonEvidenceWorkbenchV480(value));
const nested = (value: Json, key: string) => (value[key] ?? {}) as Json;
const atomic = (path: string, value: unknown) => {
  const target = resolve(root, path);
  mkdirSync(dirname(target), { recursive: true });
  const part = `${target}.${process.pid}.part`;
  writeFileSync(part, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  renameSync(part, target);
};

const v475 = read(paths.v475);
const v476 = parseKerrScienceProductAdmissionArtifactV476(read(paths.v476));
const v479 = parseKerrFrequencyProvenanceArtifactV479(read(paths.v479));
const dense = read(paths.dense);
const formal = read(paths.formal);
const formalEvidence = read(String(formal.source));
const formalScience = nested(formalEvidence, "science");
const formalContracts = nested(formalEvidence, "contracts");

if (
  v475.status !== "dual-render-boundary-qualified-browser-pending" ||
  digest(canonicalKerrDualRenderPayloadV475(v475)) !== v475.artifactSha256 ||
  digest(canonicalKerrScienceProductAdmissionV476(v476)) !== v476.artifactSha256 ||
  digest(canonicalKerrFrequencyProvenanceViewerV479(v479)) !== v479.artifactSha256 ||
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
  throw new Error("v480-upstream-boundary");
}

const products = Object.freeze(
  v476.products.map(
    (product): KerrPhotonEvidenceProductV480 =>
      Object.freeze({
        id: product.id,
        label: product.label,
        status: product.status,
        available: product.available,
        recordCount: product.recordCount,
        blockedBy: product.blockedBy,
        placeholderAllowed: false,
        presentationFallbackAllowed: false,
      }),
  ),
);
const provenance = Object.freeze(
  v479.provenance.map(
    (row): KerrPhotonEvidenceProvenanceV480 =>
      Object.freeze({
        rayId: row.rayId,
        sourceRowSha256: row.sourceRowSha256,
        sampleCount: 5,
        formulaCount: 4,
        uncertaintyArtifactSha256: row.uncertaintyArtifactSha256,
        applicability: row.physicalApplicability,
      }),
  ),
);

const stages = Object.freeze([
  Object.freeze({
    id: "v475-dual-render-boundary" as const,
    status: String(v475.status),
    artifactSha256: String(v475.artifactSha256),
    fileSha256: fileSha(paths.v475),
    qualification: "qualified-browser-pending" as const,
    scienceWritebackAllowed: false as const,
  }),
  Object.freeze({
    id: "v476-product-admission" as const,
    status: v476.status,
    artifactSha256: v476.artifactSha256,
    fileSha256: fileSha(paths.v476),
    qualification: "qualified-browser-pending" as const,
    scienceWritebackAllowed: false as const,
  }),
  Object.freeze({
    id: "v479-frequency-provenance" as const,
    status: v479.status,
    artifactSha256: v479.artifactSha256,
    fileSha256: fileSha(paths.v479),
    qualification: "qualified-browser-pending" as const,
    scienceWritebackAllowed: false as const,
  }),
]);

const unsigned = {
  version: KERR_PHOTON_EVIDENCE_WORKBENCH_ARTIFACT_VERSION_V480,
  generatedAt: "2026-07-30T00:00:00Z",
  status: "photon-evidence-workbench-qualified-production-blocked-browser-pending" as const,
  source: {
    v475: fileSha(paths.v475),
    v476: fileSha(paths.v476),
    v479: fileSha(paths.v479),
    dense: fileSha(paths.dense),
    formal: fileSha(paths.formal),
  },
  contract: {
    stageCount: 3 as const,
    productCount: 9 as const,
    allowedProductCount: 2 as const,
    blockedProductCount: 7 as const,
    provenanceRowCount: 4 as const,
    normalizedFrequencySampleCount: 20 as const,
    provenanceSourceChainCount: 5 as const,
    viewerModeCount: 2 as const,
    separateScienceAndFrequencyBufferIdentities: true as const,
    sharedFrequencyBufferAcrossViews: true as const,
    noLargeExecutionArraysInReactState: true as const,
    boundedSummaryOnly: true as const,
    maximumResponseBytes: 131072 as const,
    localShadowOnly: true as const,
    formalProductPointer: "v263" as const,
  },
  stages,
  buffers: {
    sparseScienceBufferSha256: v476.scienceBufferSha256,
    normalizedFrequencyBufferSha256: v479.frequencyBufferSha256,
    provenanceSha256: v479.provenanceSha256,
    identitiesIntentionallyDistinct: true as const,
    scienceViewFrequencyBufferSha256: v479.frequencyBufferSha256,
    cinematicViewFrequencyBufferSha256: v479.frequencyBufferSha256,
    scienceViewAndCinematicViewShareFrequencyBuffer: true as const,
  },
  products,
  provenance,
  presentation: v479.presentation,
  audit: {
    allowedProducts: 2 as const,
    blockedProducts: 7 as const,
    normalizedFrequencyRows: 4 as const,
    normalizedFrequencySamples: 20 as const,
    absoluteFrequencyRows: 0 as const,
    physicalBandpassRows: 0 as const,
    observedIntensityRows: 0 as const,
    measuredStokesRows: 0 as const,
    sciencePixelRows: 0 as const,
    imageProducts: 0 as const,
    presentationScientificFieldCount: 0 as const,
    scienceBufferMutationCount: 0 as const,
    frequencyBufferMutationCount: 0 as const,
    scienceWritebackCount: 0 as const,
  },
  lifecycle: v479.lifecycle,
  boundary: {
    sparseAuthorityGranted: true as const,
    normalizedFrequencyAuthorityGranted: true as const,
    absoluteFrequencyAuthorityGranted: false as const,
    physicalBandpassAuthorityGranted: false as const,
    observedIntensityAuthorityGranted: false as const,
    measuredStokesAuthorityGranted: false as const,
    denseAggregateAuthorityGranted: false as const,
    scienceRasterAuthorityGranted: false as const,
    fitsWriteAllowed: false as const,
    pngWriteAllowed: false as const,
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

const artifact = parseKerrPhotonEvidenceWorkbenchArtifactV480({
  ...unsigned,
  artifactSha256: canonicalSha(unsigned),
});
atomic(paths.output, artifact);
console.log(
  JSON.stringify(
    {
      status: artifact.status,
      artifactSha256: artifact.artifactSha256,
      sparseScienceBufferSha256: artifact.buffers.sparseScienceBufferSha256,
      normalizedFrequencyBufferSha256: artifact.buffers.normalizedFrequencyBufferSha256,
      provenanceSha256: artifact.buffers.provenanceSha256,
      stages: artifact.stages.length,
      products: `${artifact.audit.allowedProducts}/${artifact.contract.productCount} allowed`,
      provenance: `${artifact.provenance.length} rows / ${artifact.audit.normalizedFrequencySamples} samples`,
      denseCampaign: artifact.boundary.denseCampaignStatus,
      browserQualification: artifact.boundary.browserQualification,
      formalProductPointer: artifact.formalProductPointer,
    },
    null,
    2,
  ),
);
