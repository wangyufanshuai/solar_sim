import type { KerrNormalizedFrequencyRowV478 } from "./kerrNormalizedFrequencyChartV478";

export const KERR_FREQUENCY_PROVENANCE_ARTIFACT_VERSION_V479 =
  "v479-kerr-frequency-provenance-viewer-artifact-v1" as const;
export const KERR_FREQUENCY_PROVENANCE_SUMMARY_VERSION_V479 =
  "v479-kerr-frequency-provenance-viewer-summary-v1" as const;
export const KERR_FREQUENCY_PROVENANCE_API_VERSION_V479 =
  "v479-kerr-frequency-provenance-viewer-api-v1" as const;

const SHA256 = /^[a-f0-9]{64}$/;
const TRANSIENT = new Set([
  "generatedAt",
  "artifactSha256",
  "evidenceSha256",
  "pointerSha256",
  "provenanceSha256",
  "frequencyBufferSha256",
  "payloadSha256",
  "rowSha256",
]);
const SCIENTIFIC_FIELDS = new Set([
  "rayId",
  "sourceRowSha256",
  "redshiftFactor",
  "shiftClass",
  "coordinateSystem",
  "samples",
  "observerEnvelope",
  "physicalApplicability",
  "rowSha256",
  "frequencyBufferSha256",
  "sourceChain",
  "formulaIds",
  "uncertaintyArtifactSha256",
  "sampleIndices",
]);
const freezeDeep = <T>(value: T): T => {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) freezeDeep(child);
  }
  return value;
};
const canonicalize = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !TRANSIENT.has(key))
      .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
      .map(([key, entry]) => [key, canonicalize(entry)]),
  );
};
export const canonicalKerrFrequencyProvenanceViewerV479 = (value: unknown): string =>
  JSON.stringify(canonicalize(value));

export function countKerrFrequencyPresentationScientificFieldsV479(value: unknown): number {
  if (Array.isArray(value)) {
    return value.reduce(
      (count, entry) => count + countKerrFrequencyPresentationScientificFieldsV479(entry),
      0,
    );
  }
  if (!value || typeof value !== "object") return 0;
  return Object.entries(value).reduce(
    (count, [key, entry]) =>
      count +
      (SCIENTIFIC_FIELDS.has(key) ? 1 : 0) +
      countKerrFrequencyPresentationScientificFieldsV479(entry),
    0,
  );
}

export type KerrFrequencyProvenanceRowV479 = Readonly<{
  rayId: "disk-00" | "disk-01" | "disk-02" | "disk-03";
  sourceRowSha256: string;
  sampleIndices: readonly [0, 1, 2, 3, 4];
  formulaIds: readonly [
    "redshift-factor",
    "normalized-frequency-forward",
    "normalized-frequency-inverse",
    "first-order-redshift-uncertainty"
  ];
  uncertaintyArtifactSha256: string;
  physicalApplicability: "normalized-coordinate-only-absolute-bandpass-unavailable";
}>;

export type KerrFrequencyPresentationV479 = Readonly<{
  mode: "science" | "cinematic";
  linearDisplay: boolean;
  exposure: number;
  bloomIntensity: number;
  colorGradeIntensity: number;
  grain: number;
  chromaticAberration: number;
  seed: string | null;
  scientificFieldMutation: false;
  scienceWritebackAllowed: false;
}>;

export type KerrFrequencyProvenanceArtifactV479 = Readonly<{
  version: typeof KERR_FREQUENCY_PROVENANCE_ARTIFACT_VERSION_V479;
  generatedAt: string;
  status: "frequency-provenance-viewer-qualified-bandpass-blocked-browser-pending";
  source: Readonly<Record<string, string>>;
  sourceChain: readonly Readonly<{
    id: "v466" | "v473" | "v475" | "v477" | "v478";
    role: string;
    artifactSha256: string;
    fileSha256: string;
  }>[];
  contract: Readonly<{
    frequencyBufferRowCount: 4;
    frequencyBufferSampleCount: 20;
    provenanceRowCount: 4;
    provenanceSampleCount: 20;
    sourceChainCount: 5;
    viewerModeCount: 2;
    presentationFieldCount: 7;
    presentationCannotContainScientificFields: true;
    sharedFrequencyBufferIdentityRequired: true;
    stableViewerCacheRequired: true;
    scienceWritebackForbidden: true;
    normalizedCoordinatesOnly: true;
    physicalBandpassAuthorityRequired: true;
    unavailableIsNotZero: true;
    boundedSummaryOnly: true;
    maximumResponseBytes: 131072;
    localShadowOnly: true;
    formalProductPointer: "v263";
  }>;
  frequencyBuffer: readonly KerrNormalizedFrequencyRowV478[];
  frequencyBufferSha256: string;
  provenance: readonly KerrFrequencyProvenanceRowV479[];
  provenanceSha256: string;
  presentation: Readonly<{
    science: KerrFrequencyPresentationV479;
    cinematic: KerrFrequencyPresentationV479;
  }>;
  audit: Readonly<{
    sourceChainComplete: true;
    frequencyBufferCanonicalIdentityShared: true;
    scienceViewFrequencyBufferSha256: string;
    cinematicViewFrequencyBufferSha256: string;
    presentationScientificFieldCount: 0;
    frequencyBufferMutationCount: 0;
    scienceWritebackCount: 0;
    scienceEffectsZero: true;
    cinematicSeedDeterministic: true;
    absoluteFrequencyRows: 0;
    physicalBandpassRows: 0;
    sciencePixelRows: 0;
  }>;
  lifecycle: Readonly<{
    existingCanvasCount: 1;
    newCanvasCreated: false;
    sceneRevisionDelta: 0;
    workers: 0;
    gpuBuffers: 0;
    pipelines: 0;
    textures: 0;
    renderTargets: 0;
    typedArrayCaches: 0;
    objectUrls: 0;
    cameraLeases: 0;
    subscriptions: 0;
    allResourcesAtBaseline: true;
  }>;
  boundary: Readonly<{
    normalizedFrequencyAuthorityGranted: true;
    absoluteFrequencyAuthorityGranted: false;
    physicalBandpassAuthorityGranted: false;
    bandIntegratedRadianceAuthorityGranted: false;
    productionPayloadAllowed: false;
    sciencePixelRows: 0;
    imageProductsGenerated: false;
    frequencyBufferMutationAllowed: false;
    cinematicScienceWritebackAllowed: false;
    networkAttempted: false;
    automaticRetryApplied: false;
    denseShardRunAllowed: false;
    browserQualification: "not-run";
    visualMatrixQualification: "not-run";
    soakQualification: "not-run";
    rtxWebGpuQualification: "not-run";
  }>;
  formalProductPointer: "v263";
  formalDefaultKernel: "legacy-eih-1pn";
  artifactSha256: string;
}>;

export type KerrFrequencyProvenanceSummaryV479 = Readonly<{
  version: typeof KERR_FREQUENCY_PROVENANCE_SUMMARY_VERSION_V479;
  status: KerrFrequencyProvenanceArtifactV479["status"];
  artifactSha256: string;
  frequencyBufferSha256: string;
  provenanceSha256: string;
  sourceChain: KerrFrequencyProvenanceArtifactV479["sourceChain"];
  contract: KerrFrequencyProvenanceArtifactV479["contract"];
  frequencyBuffer: KerrFrequencyProvenanceArtifactV479["frequencyBuffer"];
  provenance: KerrFrequencyProvenanceArtifactV479["provenance"];
  presentation: KerrFrequencyProvenanceArtifactV479["presentation"];
  audit: KerrFrequencyProvenanceArtifactV479["audit"];
  lifecycle: KerrFrequencyProvenanceArtifactV479["lifecycle"];
  boundary: KerrFrequencyProvenanceArtifactV479["boundary"];
}>;

export type KerrFrequencyViewerViewV479 = Readonly<{
  mode: "science" | "cinematic";
  frequencyBuffer: KerrFrequencyProvenanceArtifactV479["frequencyBuffer"];
  frequencyBufferSha256: string;
  presentation: KerrFrequencyPresentationV479;
  scientificFieldMutation: false;
  scienceWritebackAllowed: false;
}>;

export type KerrFrequencyProvenanceApiV479 = Readonly<{
  version: typeof KERR_FREQUENCY_PROVENANCE_API_VERSION_V479;
  available: boolean;
  reason: "ready" | "lite-boundary" | "local-shadow-only" | "evidence-corrupt" | "request-failed";
  summary: KerrFrequencyProvenanceSummaryV479 | null;
}>;

const viewCache = new WeakMap<
  KerrFrequencyProvenanceArtifactV479["frequencyBuffer"],
  Readonly<Record<"science" | "cinematic", KerrFrequencyViewerViewV479>>
>();

export function resolveKerrFrequencyViewerViewV479(
  summary: KerrFrequencyProvenanceSummaryV479,
  mode: "science" | "cinematic",
): KerrFrequencyViewerViewV479 {
  let views = viewCache.get(summary.frequencyBuffer);
  if (!views) {
    views = Object.freeze({
      science: Object.freeze({
        mode: "science" as const,
        frequencyBuffer: summary.frequencyBuffer,
        frequencyBufferSha256: summary.frequencyBufferSha256,
        presentation: summary.presentation.science,
        scientificFieldMutation: false as const,
        scienceWritebackAllowed: false as const,
      }),
      cinematic: Object.freeze({
        mode: "cinematic" as const,
        frequencyBuffer: summary.frequencyBuffer,
        frequencyBufferSha256: summary.frequencyBufferSha256,
        presentation: summary.presentation.cinematic,
        scientificFieldMutation: false as const,
        scienceWritebackAllowed: false as const,
      }),
    });
    viewCache.set(summary.frequencyBuffer, views);
  }
  return views[mode];
}

export function parseKerrFrequencyProvenanceArtifactV479(
  value: unknown,
): KerrFrequencyProvenanceArtifactV479 {
  const artifact =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Partial<KerrFrequencyProvenanceArtifactV479>)
      : null;
  const sourceChain = artifact?.sourceChain ?? [];
  const frequencyBuffer = artifact?.frequencyBuffer ?? [];
  const provenance = artifact?.provenance ?? [];
  if (
    !artifact ||
    artifact.version !== KERR_FREQUENCY_PROVENANCE_ARTIFACT_VERSION_V479 ||
    artifact.status !== "frequency-provenance-viewer-qualified-bandpass-blocked-browser-pending" ||
    !artifact.source ||
    Object.values(artifact.source).some((sha) => !SHA256.test(sha)) ||
    sourceChain.length !== 5 ||
    sourceChain.some((entry) => !SHA256.test(entry.artifactSha256) || !SHA256.test(entry.fileSha256)) ||
    artifact.contract?.frequencyBufferRowCount !== 4 ||
    artifact.contract.frequencyBufferSampleCount !== 20 ||
    artifact.contract.provenanceRowCount !== 4 ||
    artifact.contract.provenanceSampleCount !== 20 ||
    artifact.contract.sourceChainCount !== 5 ||
    artifact.contract.viewerModeCount !== 2 ||
    artifact.contract.presentationFieldCount !== 7 ||
    artifact.contract.presentationCannotContainScientificFields !== true ||
    artifact.contract.sharedFrequencyBufferIdentityRequired !== true ||
    artifact.contract.stableViewerCacheRequired !== true ||
    artifact.contract.scienceWritebackForbidden !== true ||
    artifact.contract.normalizedCoordinatesOnly !== true ||
    artifact.contract.physicalBandpassAuthorityRequired !== true ||
    artifact.contract.unavailableIsNotZero !== true ||
    artifact.contract.boundedSummaryOnly !== true ||
    artifact.contract.maximumResponseBytes !== 131072 ||
    artifact.contract.localShadowOnly !== true ||
    artifact.contract.formalProductPointer !== "v263" ||
    frequencyBuffer.length !== 4 ||
    provenance.length !== 4 ||
    !SHA256.test(artifact.frequencyBufferSha256 ?? "") ||
    !SHA256.test(artifact.provenanceSha256 ?? "") ||
    provenance.some(
      (entry) =>
        !SHA256.test(entry.sourceRowSha256) ||
        JSON.stringify(entry.sampleIndices) !== JSON.stringify([0, 1, 2, 3, 4]) ||
        JSON.stringify(entry.formulaIds) !==
          JSON.stringify([
            "redshift-factor",
            "normalized-frequency-forward",
            "normalized-frequency-inverse",
            "first-order-redshift-uncertainty",
          ]) ||
        !SHA256.test(entry.uncertaintyArtifactSha256) ||
        entry.physicalApplicability !== "normalized-coordinate-only-absolute-bandpass-unavailable",
    ) ||
    artifact.presentation?.science.mode !== "science" ||
    artifact.presentation.science.linearDisplay !== true ||
    artifact.presentation.science.exposure !== 1 ||
    artifact.presentation.science.bloomIntensity !== 0 ||
    artifact.presentation.science.colorGradeIntensity !== 0 ||
    artifact.presentation.science.grain !== 0 ||
    artifact.presentation.science.chromaticAberration !== 0 ||
    artifact.presentation.science.seed !== null ||
    artifact.presentation.science.scientificFieldMutation !== false ||
    artifact.presentation.science.scienceWritebackAllowed !== false ||
    artifact.presentation.cinematic.mode !== "cinematic" ||
    !artifact.presentation.cinematic.seed ||
    artifact.presentation.cinematic.scientificFieldMutation !== false ||
    artifact.presentation.cinematic.scienceWritebackAllowed !== false ||
    countKerrFrequencyPresentationScientificFieldsV479(artifact.presentation) !== 0 ||
    artifact.audit?.sourceChainComplete !== true ||
    artifact.audit.frequencyBufferCanonicalIdentityShared !== true ||
    artifact.audit.scienceViewFrequencyBufferSha256 !== artifact.frequencyBufferSha256 ||
    artifact.audit.cinematicViewFrequencyBufferSha256 !== artifact.frequencyBufferSha256 ||
    artifact.audit.presentationScientificFieldCount !== 0 ||
    artifact.audit.frequencyBufferMutationCount !== 0 ||
    artifact.audit.scienceWritebackCount !== 0 ||
    artifact.audit.scienceEffectsZero !== true ||
    artifact.audit.cinematicSeedDeterministic !== true ||
    artifact.audit.absoluteFrequencyRows !== 0 ||
    artifact.audit.physicalBandpassRows !== 0 ||
    artifact.audit.sciencePixelRows !== 0 ||
    artifact.lifecycle?.existingCanvasCount !== 1 ||
    artifact.lifecycle.newCanvasCreated !== false ||
    artifact.lifecycle.sceneRevisionDelta !== 0 ||
    artifact.lifecycle.allResourcesAtBaseline !== true ||
    artifact.boundary?.normalizedFrequencyAuthorityGranted !== true ||
    artifact.boundary.absoluteFrequencyAuthorityGranted !== false ||
    artifact.boundary.physicalBandpassAuthorityGranted !== false ||
    artifact.boundary.bandIntegratedRadianceAuthorityGranted !== false ||
    artifact.boundary.productionPayloadAllowed !== false ||
    artifact.boundary.sciencePixelRows !== 0 ||
    artifact.boundary.imageProductsGenerated !== false ||
    artifact.boundary.frequencyBufferMutationAllowed !== false ||
    artifact.boundary.cinematicScienceWritebackAllowed !== false ||
    artifact.boundary.networkAttempted !== false ||
    artifact.boundary.automaticRetryApplied !== false ||
    artifact.boundary.denseShardRunAllowed !== false ||
    artifact.boundary.browserQualification !== "not-run" ||
    artifact.formalProductPointer !== "v263" ||
    artifact.formalDefaultKernel !== "legacy-eih-1pn" ||
    !SHA256.test(artifact.artifactSha256 ?? "")
  ) {
    throw new Error("v479-frequency-provenance-identity");
  }
  return freezeDeep(value as KerrFrequencyProvenanceArtifactV479);
}

export function createKerrFrequencyProvenanceSummaryV479(
  value: unknown,
): KerrFrequencyProvenanceSummaryV479 {
  const artifact = parseKerrFrequencyProvenanceArtifactV479(value);
  return freezeDeep({
    version: KERR_FREQUENCY_PROVENANCE_SUMMARY_VERSION_V479,
    status: artifact.status,
    artifactSha256: artifact.artifactSha256,
    frequencyBufferSha256: artifact.frequencyBufferSha256,
    provenanceSha256: artifact.provenanceSha256,
    sourceChain: artifact.sourceChain,
    contract: artifact.contract,
    frequencyBuffer: artifact.frequencyBuffer,
    provenance: artifact.provenance,
    presentation: artifact.presentation,
    audit: artifact.audit,
    lifecycle: artifact.lifecycle,
    boundary: artifact.boundary,
  });
}

export function parseKerrFrequencyProvenanceApiV479(value: unknown): KerrFrequencyProvenanceApiV479 {
  const api =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Partial<KerrFrequencyProvenanceApiV479>)
      : null;
  if (
    !api ||
    api.version !== KERR_FREQUENCY_PROVENANCE_API_VERSION_V479 ||
    typeof api.available !== "boolean" ||
    !["ready", "lite-boundary", "local-shadow-only", "evidence-corrupt", "request-failed"].includes(api.reason ?? "") ||
    (api.available && (!api.summary || api.reason !== "ready")) ||
    (!api.available && api.summary !== null)
  ) {
    throw new Error("v479-frequency-provenance-api-identity");
  }
  return freezeDeep(value as KerrFrequencyProvenanceApiV479);
}
