import type { AtlasV596BuildIdentity } from "./atlasV596BuildIdentity";
import {
  V596_VISUAL_CHECKPOINT_CONSUMER_RECEIPT_VERSION,
  canonicalShaV596VisualCheckpoint,
  type V596VisualCheckpointConsumerReceipt,
} from "./v596VisualCheckpointContract";

export const V596_FORMAL_EVIDENCE_VERSION =
  "v596-stellar-visible-leap-formal-app-evidence-v1" as const;
export const V596_FORMAL_EVIDENCE_RECEIPT_VERSION =
  "v596-stellar-visible-leap-formal-app-consumer-receipt-v1" as const;

export type V596FormalEvidenceReceipt = Readonly<{
  version: typeof V596_FORMAL_EVIDENCE_RECEIPT_VERSION;
  evidenceVersion: typeof V596_FORMAL_EVIDENCE_VERSION;
  identity: AtlasV596BuildIdentity;
  sourceConsumer: Readonly<{
    version: typeof V596_VISUAL_CHECKPOINT_CONSUMER_RECEIPT_VERSION;
    receiptSha256: string;
    captureRequestId: string;
    sourceBindingSha256: string;
    morphologySha256: string;
  }>;
  frame: V596VisualCheckpointConsumerReceipt["frame"];
  cameraStateSha256: string;
  simulationStateSha256: string;
  render: Readonly<{
    candidate: "v596";
    revision: 596;
    contractSha256: string;
    stateSha256: string;
    candidateNodeCount: number;
    candidateNodeIds: readonly string[];
  }>;
  canvas: Readonly<{
    identity: "atlas-main-r3f-canvas-v1";
    singleCanvasPolicy: "shared-main-canvas";
    count: 1;
    connected: 1;
  }>;
  authority: Readonly<{
    formalProductPointer: "v263";
    defaultKernel: "legacy-eih-1pn";
    v2Mode: "shadow-only";
    scientificAuthority: false;
    measuredAuthority: false;
    gpuAuthority: false;
    resolvedSurfaceAuthority: false;
    observationTextureAuthority: false;
    radiativeTransferAuthority: false;
    grmhdAuthority: false;
    scientificPayloadWriteback: false;
    promotion: "none";
    productionPromotionAllowed: false;
  }>;
  evidence: Readonly<{
    formalEvidence: true;
    supplementalOnly: false;
    identityBound: true;
    runtimeConsumerReuse: "checkpoint-consumer-promoted-only-by-current-formal-wrapper";
    checkpointDecisionInherited: false;
    priorChallengeReused: false;
  }>;
  receiptSha256: string;
}>;

const SHA256_PATTERN = /^[0-9a-f]{64}$/;

export function createV596FormalEvidenceReceipt(
  source: V596VisualCheckpointConsumerReceipt,
  identity: AtlasV596BuildIdentity,
): V596FormalEvidenceReceipt {
  if (identity.bindingStatus !== "bound"
    || identity.formalProductPointer !== "v263"
    || !SHA256_PATTERN.test(identity.sourceManifestSha256)
    || !SHA256_PATTERN.test(identity.candidateManifestSha256)
    || !SHA256_PATTERN.test(identity.buildFingerprint)
    || !/^v596b-[0-9a-f]{64}$/.test(identity.buildId)
    || !/^v596-[0-9a-f]{12}-[0-9a-f]{12}$/.test(identity.deploymentId)
    || !new Set(["standalone-full", "vercel-lite"]).has(identity.deliveryTier)
  ) throw new Error("v596-formal-evidence-identity");

  const sourceUnsigned = { ...source } as Record<string, unknown>;
  delete sourceUnsigned.receiptSha256;
  if (source.version !== V596_VISUAL_CHECKPOINT_CONSUMER_RECEIPT_VERSION
    || source.receiptSha256 !== canonicalShaV596VisualCheckpoint(sourceUnsigned)
    || source.identity.bindingStatus !== "bound"
    || source.render.candidate !== "v596"
    || source.render.contractState.candidate !== "v596"
    || source.render.contractState.formalEvidence !== false
    || source.render.contractState.supplementalOnly !== true
    || source.render.contractState.promotion !== "none"
    || source.render.contractState.presentationAuthority !== "none"
    || source.render.contractState.relativityAuthority !== "shadow-only"
    || source.render.contractState.defaultKernel !== "legacy-eih-1pn"
    || source.render.contractState.formalProductPointer !== "v263"
    || source.render.contractState.scientificAuthority !== false
    || source.render.contractState.measuredAuthority !== false
    || source.render.contractState.gpuAuthority !== false
    || source.render.contractState.resolvedSurfaceAuthority !== false
    || source.render.contractState.observationTextureAuthority !== false
    || source.render.contractState.radiativeTransferAuthority !== false
    || source.render.contractState.grmhdAuthority !== false
    || source.render.contractState.scientificPayloadWriteback !== false
    || source.canvas.identity !== "atlas-main-r3f-canvas-v1"
    || source.canvas.singleCanvasPolicy !== "shared-main-canvas"
    || source.snapshot.canvas.count !== 1
    || source.snapshot.canvas.connected !== 1
  ) throw new Error("v596-formal-evidence-source-consumer");

  const unsigned = {
    version: V596_FORMAL_EVIDENCE_RECEIPT_VERSION,
    evidenceVersion: V596_FORMAL_EVIDENCE_VERSION,
    identity,
    sourceConsumer: Object.freeze({
      version: source.version,
      receiptSha256: source.receiptSha256,
      captureRequestId: source.captureRequestId,
      sourceBindingSha256: source.render.contractState.sourceBindingSha256,
      morphologySha256: source.render.contractState.morphologySha256,
    }),
    frame: source.frame,
    cameraStateSha256: source.cameraStateSha256,
    simulationStateSha256: source.simulationStateSha256,
    render: Object.freeze({
      candidate: "v596" as const,
      revision: 596 as const,
      contractSha256: source.render.contractSha256,
      stateSha256: source.render.stateSha256,
      candidateNodeCount: source.render.candidateNodeCount,
      candidateNodeIds: source.render.candidateNodeIds,
    }),
    canvas: Object.freeze({
      identity: "atlas-main-r3f-canvas-v1" as const,
      singleCanvasPolicy: "shared-main-canvas" as const,
      count: 1 as const,
      connected: 1 as const,
    }),
    authority: Object.freeze({
      formalProductPointer: "v263" as const,
      defaultKernel: "legacy-eih-1pn" as const,
      v2Mode: "shadow-only" as const,
      scientificAuthority: false as const,
      measuredAuthority: false as const,
      gpuAuthority: false as const,
      resolvedSurfaceAuthority: false as const,
      observationTextureAuthority: false as const,
      radiativeTransferAuthority: false as const,
      grmhdAuthority: false as const,
      scientificPayloadWriteback: false as const,
      promotion: "none" as const,
      productionPromotionAllowed: false as const,
    }),
    evidence: Object.freeze({
      formalEvidence: true as const,
      supplementalOnly: false as const,
      identityBound: true as const,
      runtimeConsumerReuse:
        "checkpoint-consumer-promoted-only-by-current-formal-wrapper" as const,
      checkpointDecisionInherited: false as const,
      priorChallengeReused: false as const,
    }),
  };
  return Object.freeze({
    ...unsigned,
    receiptSha256: canonicalShaV596VisualCheckpoint(unsigned),
  });
}

