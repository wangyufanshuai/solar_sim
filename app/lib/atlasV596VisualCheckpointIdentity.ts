import { sha256Utf8HexV566 } from "./sha256BrowserV566";

export const ATLAS_V596_VISUAL_CHECKPOINT_IDENTITY_VERSION =
  "v596-staging-visual-checkpoint-identity-v1" as const;
export const ATLAS_V596_VISUAL_CHECKPOINT_FORMAL_PRODUCT_POINTER = "v263" as const;
export const ATLAS_V596_VISUAL_CHECKPOINT_PARENT_V595 = Object.freeze({
  sourceManifestSha256:
    "e06febbe18cd65ad8d24bb618d09c93032ca7fa02d5d69e2d916ea3b8f802186",
  candidateManifestSha256:
    "332b5ce6a0b5f26a4f9553d44cb9d0eb8d5cc169ae3242b4cd83259b669abae1",
  buildId:
    "v595b-97bcb089ed86374e7c4440f20458652d20ce571479de7e4170e74d38a5193ca4",
  deploymentId: "v595-e06febbe18cd-332b5ce6a0b5",
  finalStatus: "passed-readonly-qualified-additive-v595-stellar-relativity-candidate",
  relationship: "immutable-visual-baseline" as const,
});

const SHA256_PATTERN = /^[0-9a-f]{64}$/;
const CHECKPOINT_ID_PATTERN = /^v596-checkpoint-[0-9a-f]{12}-[0-9a-f]{12}$/;

export type AtlasV596VisualCheckpointRuntimeTier =
  | "development-webpack"
  | "staging-standalone"
  | "standalone-full"
  | "vercel-lite";
export type AtlasV596VisualCheckpointBindingStatus =
  | "bound"
  | "unbound-development"
  | "unbound-production";

export type AtlasV596VisualCheckpointIdentityInput = Readonly<{
  sourceSetSha256?: string;
  buildFingerprint?: string;
  checkpointId?: string;
  runtimeTier?: string;
  nodeEnv?: string;
}>;

export type AtlasV596VisualCheckpointIdentity = Readonly<{
  version: typeof ATLAS_V596_VISUAL_CHECKPOINT_IDENTITY_VERSION;
  formalProductPointer: typeof ATLAS_V596_VISUAL_CHECKPOINT_FORMAL_PRODUCT_POINTER;
  parentV595: typeof ATLAS_V596_VISUAL_CHECKPOINT_PARENT_V595;
  sourceSetSha256: string;
  buildFingerprint: string;
  checkpointId: string;
  runtimeTier: AtlasV596VisualCheckpointRuntimeTier | AtlasV596VisualCheckpointBindingStatus;
  bindingStatus: AtlasV596VisualCheckpointBindingStatus;
  formalEvidence: false;
  promotion: "none";
  supplementalOnly: true;
}>;

export function deriveAtlasV596VisualCheckpointBuildFingerprint(
  sourceSetSha256: string,
): string {
  if (!SHA256_PATTERN.test(sourceSetSha256)) {
    throw new Error("v596-checkpoint-source-set-sha");
  }
  return sha256Utf8HexV566(JSON.stringify({
    version: "v596-visual-checkpoint-build-fingerprint-v1",
    sourceSetSha256,
    parentV595: ATLAS_V596_VISUAL_CHECKPOINT_PARENT_V595,
    formalEvidence: false,
    promotion: "none",
    supplementalOnly: true,
  }));
}

export function deriveAtlasV596VisualCheckpointId(
  sourceSetSha256: string,
  buildFingerprint: string,
): string {
  if (!SHA256_PATTERN.test(sourceSetSha256) || !SHA256_PATTERN.test(buildFingerprint)) {
    throw new Error("v596-checkpoint-id-sha");
  }
  return `v596-checkpoint-${sourceSetSha256.slice(0, 12)}-${buildFingerprint.slice(0, 12)}`;
}

export function createAtlasV596VisualCheckpointIdentity(
  input: AtlasV596VisualCheckpointIdentityInput,
): AtlasV596VisualCheckpointIdentity {
  const unbound = input.nodeEnv === "production"
    ? "unbound-production" as const
    : "unbound-development" as const;
  const value = (candidate: string | undefined) => candidate?.trim() || unbound;
  const sourceSetSha256 = value(input.sourceSetSha256);
  const buildFingerprint = value(input.buildFingerprint);
  const checkpointId = value(input.checkpointId);
  const runtimeTier = input.runtimeTier === "development-webpack"
    || input.runtimeTier === "staging-standalone"
    || input.runtimeTier === "standalone-full"
    || input.runtimeTier === "vercel-lite"
    ? input.runtimeTier
    : unbound;
  const fieldsValid = SHA256_PATTERN.test(sourceSetSha256)
    && SHA256_PATTERN.test(buildFingerprint)
    && CHECKPOINT_ID_PATTERN.test(checkpointId)
    && (runtimeTier === "development-webpack"
      || runtimeTier === "staging-standalone"
      || runtimeTier === "standalone-full"
      || runtimeTier === "vercel-lite");
  const buildBound = fieldsValid
    && buildFingerprint === deriveAtlasV596VisualCheckpointBuildFingerprint(sourceSetSha256);
  const idBound = fieldsValid
    && checkpointId === deriveAtlasV596VisualCheckpointId(sourceSetSha256, buildFingerprint);
  return Object.freeze({
    version: ATLAS_V596_VISUAL_CHECKPOINT_IDENTITY_VERSION,
    formalProductPointer: ATLAS_V596_VISUAL_CHECKPOINT_FORMAL_PRODUCT_POINTER,
    parentV595: ATLAS_V596_VISUAL_CHECKPOINT_PARENT_V595,
    sourceSetSha256,
    buildFingerprint,
    checkpointId,
    runtimeTier,
    bindingStatus: buildBound && idBound ? "bound" : unbound,
    formalEvidence: false,
    promotion: "none",
    supplementalOnly: true,
  });
}

export const ATLAS_V596_VISUAL_CHECKPOINT_IDENTITY =
  createAtlasV596VisualCheckpointIdentity({
    sourceSetSha256: process.env.NEXT_PUBLIC_ATLAS_V596_CHECKPOINT_SOURCE_SET_SHA256,
    buildFingerprint: process.env.NEXT_PUBLIC_ATLAS_V596_CHECKPOINT_BUILD_FINGERPRINT,
    checkpointId: process.env.NEXT_PUBLIC_ATLAS_V596_CHECKPOINT_ID,
    runtimeTier: process.env.NEXT_PUBLIC_ATLAS_V596_CHECKPOINT_RUNTIME_TIER,
    nodeEnv: process.env.NODE_ENV,
  });
