export const KERR_UNCERTAINTY_REPLAY_WITNESS_VERSION_V516 =
  "v516-kerr-uncertainty-replay-witness-chain-v1" as const;
export const KERR_UNCERTAINTY_REPLAY_WITNESS_API_VERSION_V516 =
  "v516-kerr-uncertainty-replay-witness-chain-api-v1" as const;

export type KerrUncertaintyTransitionWitnessV516 = Readonly<{
  index: number;
  mode: "science" | "cinematic";
  revision: number;
  witnessSha256: string;
}>;

export type KerrUncertaintyReplayCheckpointV516 = Readonly<{
  transitionIndex: number;
  mode: "science" | "cinematic";
  revision: number;
  witnessSha256: string;
}>;

export type KerrUncertaintyReplayWitnessArtifactV516 = Readonly<{
  version: typeof KERR_UNCERTAINTY_REPLAY_WITNESS_VERSION_V516;
  generatedAt: string;
  status: "uncertainty-replay-witness-chain-qualified-512-transitions";
  source: Readonly<{
    v515ReplayArtifactSha256: string;
    v513ArtifactSha256: string;
    v514VisualAuditSha256: string;
    scientificPayloadKey: string;
  }>;
  basis: Readonly<{
    scientificRowCount: 9;
    scientificRowsSha256: string;
    scienceVisualSignatureSha256: string;
    cinematicVisualSignatureSha256: string;
    numericStyleInputCount: 0;
    scientificMutationAllowed: false;
  }>;
  chain: Readonly<{
    transitionCount: 512;
    passCount: 2;
    witnessCount: 512;
    checkpointInterval: 64;
    checkpointCount: 8;
    genesisSha256: string;
    headSha256: string;
    repeatHeadSha256: string;
    mismatchCount: 0;
    alternationMismatchCount: 0;
    revisionMismatchCount: 0;
    scientificDigestMismatchCount: 0;
    visualDigestMismatchCount: 0;
    numericStyleViolationCount: 0;
    scientificMutationCount: 0;
    notificationCountPerPass: 512;
    finalMode: "science";
    finalModeRevision: 512;
  }>;
  witnesses: readonly KerrUncertaintyTransitionWitnessV516[];
  checkpoints: readonly KerrUncertaintyReplayCheckpointV516[];
  lifecycle: Readonly<{
    peakSubscriptionCount: 1;
    finalSubscriptionCount: 0;
    finalResourceStatus: "baseline";
    identityChanged: false;
    ownerChanged: false;
    objectUrlCount: 0;
    canvasCreated: false;
    sceneRevisionDelta: 0;
  }>;
  boundary: Readonly<{
    fullTransitionPayloadEmbedded: false;
    scientificFieldMutationAllowed: false;
    uncertaintyDrivenPresentationAllowed: false;
    detectorAuthorityAvailable: false;
    denseCampaignStatus: "incomplete-0-of-49";
    browserQualification: "not-run";
    formalProductPointer: "v263";
    formalDefaultKernel: "legacy-eih-1pn";
  }>;
  sourceManifest: readonly Readonly<{ path: string; sha256: string }>[];
  sourceSha256: string;
  artifactSha256: string;
}>;

export type KerrUncertaintyReplayWitnessSummaryV516 = Pick<
  KerrUncertaintyReplayWitnessArtifactV516,
  | "version"
  | "status"
  | "source"
  | "basis"
  | "chain"
  | "checkpoints"
  | "lifecycle"
  | "boundary"
  | "artifactSha256"
>;

export type KerrUncertaintyReplayWitnessApiV516 = Readonly<{
  version: typeof KERR_UNCERTAINTY_REPLAY_WITNESS_API_VERSION_V516;
  available: boolean;
  reason: "ready" | "lite-boundary" | "local-shadow-only" | "evidence-corrupt";
  summary: KerrUncertaintyReplayWitnessSummaryV516 | null;
}>;

const SHA = /^[a-f0-9]{64}$/;
const transient = new Set([
  "generatedAt",
  "artifactSha256",
  "evidenceSha256",
  "pointerSha256",
]);
const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);
const canonicalize = (value: unknown): unknown =>
  Array.isArray(value)
    ? value.map(canonicalize)
    : !isRecord(value)
      ? value
      : Object.fromEntries(
          Object.entries(value)
            .filter(([key]) => !transient.has(key))
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, entry]) => [key, canonicalize(entry)]),
        );

export const canonicalKerrUncertaintyReplayWitnessV516 = (value: unknown) =>
  JSON.stringify(canonicalize(value));

export function parseKerrUncertaintyReplayWitnessArtifactV516(
  value: unknown,
): KerrUncertaintyReplayWitnessArtifactV516 {
  if (!isRecord(value)) throw new Error("v516-witness-shape");
  const artifact = value as Partial<KerrUncertaintyReplayWitnessArtifactV516>;
  const shaFields = [
    artifact.source?.v515ReplayArtifactSha256,
    artifact.source?.v513ArtifactSha256,
    artifact.source?.v514VisualAuditSha256,
    artifact.source?.scientificPayloadKey,
    artifact.basis?.scientificRowsSha256,
    artifact.basis?.scienceVisualSignatureSha256,
    artifact.basis?.cinematicVisualSignatureSha256,
    artifact.chain?.genesisSha256,
    artifact.chain?.headSha256,
    artifact.chain?.repeatHeadSha256,
    artifact.sourceSha256,
    artifact.artifactSha256,
  ];
  if (
    artifact.version !== KERR_UNCERTAINTY_REPLAY_WITNESS_VERSION_V516 ||
    artifact.status !== "uncertainty-replay-witness-chain-qualified-512-transitions" ||
    shaFields.some((entry) => !SHA.test(entry ?? "")) ||
    artifact.basis?.scientificRowCount !== 9 ||
    artifact.basis.numericStyleInputCount !== 0 ||
    artifact.basis.scientificMutationAllowed !== false ||
    artifact.chain?.transitionCount !== 512 ||
    artifact.chain.passCount !== 2 ||
    artifact.chain.witnessCount !== 512 ||
    artifact.chain.checkpointInterval !== 64 ||
    artifact.chain.checkpointCount !== 8 ||
    artifact.chain.headSha256 !== artifact.chain.repeatHeadSha256 ||
    artifact.chain.mismatchCount !== 0 ||
    artifact.chain.alternationMismatchCount !== 0 ||
    artifact.chain.revisionMismatchCount !== 0 ||
    artifact.chain.scientificDigestMismatchCount !== 0 ||
    artifact.chain.visualDigestMismatchCount !== 0 ||
    artifact.chain.numericStyleViolationCount !== 0 ||
    artifact.chain.scientificMutationCount !== 0 ||
    artifact.chain.notificationCountPerPass !== 512 ||
    artifact.chain.finalMode !== "science" ||
    artifact.chain.finalModeRevision !== 512 ||
    !Array.isArray(artifact.witnesses) ||
    artifact.witnesses.length !== 512 ||
    artifact.witnesses.some(
      (witness, index) =>
        witness.index !== index ||
        witness.revision !== index + 1 ||
        witness.mode !== (index % 2 === 0 ? "cinematic" : "science") ||
        !SHA.test(witness.witnessSha256),
    ) ||
    artifact.witnesses.at(-1)?.witnessSha256 !== artifact.chain.headSha256 ||
    !Array.isArray(artifact.checkpoints) ||
    artifact.checkpoints.length !== 8 ||
    artifact.checkpoints.some((checkpoint, index) => {
      const transitionIndex = (index + 1) * 64 - 1;
      const witness = artifact.witnesses?.[transitionIndex];
      return (
        checkpoint.transitionIndex !== transitionIndex ||
        checkpoint.revision !== transitionIndex + 1 ||
        checkpoint.mode !== "science" ||
        checkpoint.witnessSha256 !== witness?.witnessSha256
      );
    }) ||
    artifact.lifecycle?.peakSubscriptionCount !== 1 ||
    artifact.lifecycle.finalSubscriptionCount !== 0 ||
    artifact.lifecycle.finalResourceStatus !== "baseline" ||
    artifact.lifecycle.identityChanged !== false ||
    artifact.lifecycle.ownerChanged !== false ||
    artifact.lifecycle.objectUrlCount !== 0 ||
    artifact.lifecycle.canvasCreated !== false ||
    artifact.lifecycle.sceneRevisionDelta !== 0 ||
    artifact.boundary?.fullTransitionPayloadEmbedded !== false ||
    artifact.boundary.scientificFieldMutationAllowed !== false ||
    artifact.boundary.uncertaintyDrivenPresentationAllowed !== false ||
    artifact.boundary.detectorAuthorityAvailable !== false ||
    artifact.boundary.denseCampaignStatus !== "incomplete-0-of-49" ||
    artifact.boundary.browserQualification !== "not-run" ||
    artifact.boundary.formalProductPointer !== "v263" ||
    artifact.boundary.formalDefaultKernel !== "legacy-eih-1pn" ||
    !Array.isArray(artifact.sourceManifest) ||
    artifact.sourceManifest.some((entry) => !entry.path || !SHA.test(entry.sha256))
  ) {
    throw new Error("v516-witness-boundary");
  }
  return artifact as KerrUncertaintyReplayWitnessArtifactV516;
}

export function createKerrUncertaintyReplayWitnessSummaryV516(
  value: unknown,
): KerrUncertaintyReplayWitnessSummaryV516 {
  const artifact = parseKerrUncertaintyReplayWitnessArtifactV516(value);
  return Object.freeze({
    version: artifact.version,
    status: artifact.status,
    source: artifact.source,
    basis: artifact.basis,
    chain: artifact.chain,
    checkpoints: artifact.checkpoints,
    lifecycle: artifact.lifecycle,
    boundary: artifact.boundary,
    artifactSha256: artifact.artifactSha256,
  });
}

function validateSummary(value: unknown) {
  if (!isRecord(value)) throw new Error("v516-summary-shape");
  const checkpointHashes = new Map<number, string>();
  if (Array.isArray(value.checkpoints)) {
    for (const checkpoint of value.checkpoints) {
      if (
        isRecord(checkpoint) &&
        typeof checkpoint.transitionIndex === "number" &&
        typeof checkpoint.witnessSha256 === "string"
      ) {
        checkpointHashes.set(checkpoint.transitionIndex, checkpoint.witnessSha256);
      }
    }
  }
  parseKerrUncertaintyReplayWitnessArtifactV516({
    ...value,
    generatedAt: "summary",
    witnesses: Array.from({ length: 512 }, (_, index) => ({
      index,
      mode: index % 2 === 0 ? "cinematic" : "science",
      revision: index + 1,
      witnessSha256: checkpointHashes.get(index) ?? "0".repeat(64),
    })),
    sourceManifest: [],
    sourceSha256: "0".repeat(64),
  });
}

export function parseKerrUncertaintyReplayWitnessApiV516(
  value: unknown,
): KerrUncertaintyReplayWitnessApiV516 {
  if (
    !isRecord(value) ||
    value.version !== KERR_UNCERTAINTY_REPLAY_WITNESS_API_VERSION_V516 ||
    typeof value.available !== "boolean" ||
    !["ready", "lite-boundary", "local-shadow-only", "evidence-corrupt"].includes(
      String(value.reason),
    )
  ) {
    throw new Error("v516-api-boundary");
  }
  if (value.available) validateSummary(value.summary);
  else if (value.summary !== null) throw new Error("v516-api-unavailable-summary");
  return value as unknown as KerrUncertaintyReplayWitnessApiV516;
}
