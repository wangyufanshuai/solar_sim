export const ATLAS_V595_FORMAL_PRODUCT_POINTER = "v263" as const;
export const ATLAS_V595_PARENT_V594_IDENTITY = Object.freeze({
  sourceManifestSha256:
    "6599398a6fab78a1367b234d3a3e9ed428027879a1df4838f76b97ff279b981f",
  candidateManifestSha256:
    "e92484940ba9a812d0936bbd67b29c4cb3c3ac20d9477cd04a949e35efd33bad",
  releaseDossierSha256:
    "a70645f4a124b6fb6d1eb3a061eb15cf66618154c1a2884acc1730cb41bd3865",
  resealReceiptSha256:
    "406bb72a58aade66c877c75f4bea220e8b42181217efee1e4d9a1d20b46e4664",
  deploymentId: "v594-6599398a6fab-e92484940ba9",
  formalProductPointer: ATLAS_V595_FORMAL_PRODUCT_POINTER,
  relationship: "sealed-parent-not-current-build" as const,
});

const SHA256_PATTERN = /^[0-9a-f]{64}$/;
const BUILD_ID_PATTERN = /^v595b-[0-9a-f]{64}$/;
const DEPLOYMENT_PATTERN = /^v595-[0-9a-f]{12}-[0-9a-f]{12}$/;

export type AtlasV595IdentityBindingStatus =
  | "bound"
  | "unbound-development"
  | "unbound-production";

export type AtlasV595DeliveryTier = "standalone-full" | "vercel-lite";

export type AtlasV595BuildIdentityInput = Readonly<{
  sourceManifestSha256?: string;
  candidateManifestSha256?: string;
  buildFingerprint?: string;
  buildId?: string;
  deploymentId?: string;
  deliveryTier?: string;
  nodeEnv?: string;
}>;

export type AtlasV595BuildIdentity = Readonly<{
  formalProductPointer: typeof ATLAS_V595_FORMAL_PRODUCT_POINTER;
  sourceManifestSha256: string;
  candidateManifestSha256: string;
  buildFingerprint: string;
  buildId: string;
  deploymentId: string;
  deliveryTier: AtlasV595DeliveryTier | AtlasV595IdentityBindingStatus;
  bindingStatus: AtlasV595IdentityBindingStatus;
}>;

export function deriveAtlasV595BuildId(buildFingerprint: string): string {
  if (!SHA256_PATTERN.test(buildFingerprint)) throw new Error("v595-build-fingerprint-sha");
  return `v595b-${buildFingerprint}`;
}

export const deriveAtlasV595NextBuildId = deriveAtlasV595BuildId;

export function deriveAtlasV595DeploymentId(
  sourceManifestSha256: string,
  candidateManifestSha256: string,
): string {
  if (!SHA256_PATTERN.test(sourceManifestSha256) || !SHA256_PATTERN.test(candidateManifestSha256)) {
    throw new Error("v595-deployment-identity-sha");
  }
  return `v595-${sourceManifestSha256.slice(0, 12)}-${candidateManifestSha256.slice(0, 12)}`;
}

export function createAtlasV595BuildIdentity(
  input: AtlasV595BuildIdentityInput,
): AtlasV595BuildIdentity {
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
    && buildId === deriveAtlasV595BuildId(buildFingerprint);
  const deploymentBoundToCandidate = identityFieldsValid
    && deploymentId === deriveAtlasV595DeploymentId(sourceManifestSha256, candidateManifestSha256);
  return Object.freeze({
    formalProductPointer: ATLAS_V595_FORMAL_PRODUCT_POINTER,
    sourceManifestSha256,
    candidateManifestSha256,
    buildFingerprint,
    buildId,
    deploymentId,
    deliveryTier,
    bindingStatus: buildIdBoundToFingerprint && deploymentBoundToCandidate ? "bound" : unbound,
  });
}

export const ATLAS_V595_BUILD_IDENTITY = createAtlasV595BuildIdentity({
  sourceManifestSha256: process.env.NEXT_PUBLIC_ATLAS_V595_SOURCE_MANIFEST_SHA256,
  candidateManifestSha256: process.env.NEXT_PUBLIC_ATLAS_V595_CANDIDATE_MANIFEST_SHA256,
  buildFingerprint: process.env.NEXT_PUBLIC_ATLAS_V595_BUILD_FINGERPRINT,
  buildId: process.env.NEXT_PUBLIC_ATLAS_V595_BUILD_ID,
  deploymentId: process.env.NEXT_PUBLIC_ATLAS_V595_DEPLOYMENT_ID,
  deliveryTier: process.env.NEXT_PUBLIC_ATLAS_CELESTIAL_DELIVERY_TIER,
  nodeEnv: process.env.NODE_ENV,
});
