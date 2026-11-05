export const ATLAS_V596_FORMAL_PRODUCT_POINTER = "v263" as const;
export const ATLAS_V596_PARENT_V595_IDENTITY = Object.freeze({
  sourceManifestSha256:
    "e06febbe18cd65ad8d24bb618d09c93032ca7fa02d5d69e2d916ea3b8f802186",
  candidateManifestSha256:
    "332b5ce6a0b5f26a4f9553d44cb9d0eb8d5cc169ae3242b4cd83259b669abae1",
  releaseDossierSha256:
    "ea6a5247cf9708162df26acead217e23159f0d8793466dd98071888831866765",
  resealReceiptSha256:
    "ccf9c5cbfc0418c25295a51fde4efdb1364d9a7206dfa056eb004fb53b5c9a13",
  buildId:
    "v595b-97bcb089ed86374e7c4440f20458652d20ce571479de7e4170e74d38a5193ca4",
  deploymentId: "v595-e06febbe18cd-332b5ce6a0b5",
  formalProductPointer: ATLAS_V596_FORMAL_PRODUCT_POINTER,
  relationship: "sealed-parent-not-current-build" as const,
});

const SHA256_PATTERN = /^[0-9a-f]{64}$/;
const BUILD_ID_PATTERN = /^v596b-[0-9a-f]{64}$/;
const DEPLOYMENT_PATTERN = /^v596-[0-9a-f]{12}-[0-9a-f]{12}$/;

export type AtlasV596IdentityBindingStatus =
  | "bound"
  | "unbound-development"
  | "unbound-production";

export type AtlasV596DeliveryTier = "standalone-full" | "vercel-lite";

export type AtlasV596BuildIdentityInput = Readonly<{
  sourceManifestSha256?: string;
  candidateManifestSha256?: string;
  buildFingerprint?: string;
  buildId?: string;
  deploymentId?: string;
  deliveryTier?: string;
  nodeEnv?: string;
}>;

export type AtlasV596BuildIdentity = Readonly<{
  formalProductPointer: typeof ATLAS_V596_FORMAL_PRODUCT_POINTER;
  sourceManifestSha256: string;
  candidateManifestSha256: string;
  buildFingerprint: string;
  buildId: string;
  deploymentId: string;
  deliveryTier: AtlasV596DeliveryTier | AtlasV596IdentityBindingStatus;
  bindingStatus: AtlasV596IdentityBindingStatus;
}>;

export function deriveAtlasV596BuildId(buildFingerprint: string): string {
  if (!SHA256_PATTERN.test(buildFingerprint)) throw new Error("v596-build-fingerprint-sha");
  return `v596b-${buildFingerprint}`;
}

export const deriveAtlasV596NextBuildId = deriveAtlasV596BuildId;

export function deriveAtlasV596DeploymentId(
  sourceManifestSha256: string,
  candidateManifestSha256: string,
): string {
  if (!SHA256_PATTERN.test(sourceManifestSha256) || !SHA256_PATTERN.test(candidateManifestSha256)) {
    throw new Error("v596-deployment-identity-sha");
  }
  return `v596-${sourceManifestSha256.slice(0, 12)}-${candidateManifestSha256.slice(0, 12)}`;
}

export function createAtlasV596BuildIdentity(
  input: AtlasV596BuildIdentityInput,
): AtlasV596BuildIdentity {
  const unbound = input.nodeEnv === "production"
    ? "unbound-production" as const
    : "unbound-development" as const;
  const value = (candidate: string | undefined) => candidate?.trim() || unbound;
  const sourceManifestSha256 = value(input.sourceManifestSha256);
  const candidateManifestSha256 = value(input.candidateManifestSha256);
  const buildFingerprint = value(input.buildFingerprint);
  const buildId = value(input.buildId);
  const deploymentId = value(input.deploymentId);
  const deliveryTier = input.deliveryTier === "standalone-full" || input.deliveryTier === "vercel-lite"
    ? input.deliveryTier
    : unbound;
  const identityFieldsValid = SHA256_PATTERN.test(sourceManifestSha256)
    && SHA256_PATTERN.test(candidateManifestSha256)
    && SHA256_PATTERN.test(buildFingerprint)
    && BUILD_ID_PATTERN.test(buildId)
    && DEPLOYMENT_PATTERN.test(deploymentId)
    && (deliveryTier === "standalone-full" || deliveryTier === "vercel-lite");
  const buildIdBoundToFingerprint = identityFieldsValid
    && buildId === deriveAtlasV596BuildId(buildFingerprint);
  const deploymentBoundToCandidate = identityFieldsValid
    && deploymentId === deriveAtlasV596DeploymentId(sourceManifestSha256, candidateManifestSha256);
  return Object.freeze({
    formalProductPointer: ATLAS_V596_FORMAL_PRODUCT_POINTER,
    sourceManifestSha256,
    candidateManifestSha256,
    buildFingerprint,
    buildId,
    deploymentId,
    deliveryTier,
    bindingStatus: buildIdBoundToFingerprint && deploymentBoundToCandidate ? "bound" : unbound,
  });
}

export const ATLAS_V596_BUILD_IDENTITY = createAtlasV596BuildIdentity({
  sourceManifestSha256: process.env.NEXT_PUBLIC_ATLAS_V596_SOURCE_MANIFEST_SHA256,
  candidateManifestSha256: process.env.NEXT_PUBLIC_ATLAS_V596_CANDIDATE_MANIFEST_SHA256,
  buildFingerprint: process.env.NEXT_PUBLIC_ATLAS_V596_BUILD_FINGERPRINT,
  buildId: process.env.NEXT_PUBLIC_ATLAS_V596_BUILD_ID,
  deploymentId: process.env.NEXT_PUBLIC_ATLAS_V596_DEPLOYMENT_ID,
  deliveryTier: process.env.NEXT_PUBLIC_ATLAS_V596_DELIVERY_TIER
    ?? process.env.NEXT_PUBLIC_ATLAS_CELESTIAL_DELIVERY_TIER,
  nodeEnv: process.env.NODE_ENV,
});
