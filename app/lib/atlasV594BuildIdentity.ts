export const ATLAS_V594_FORMAL_PRODUCT_POINTER = "v263" as const;

const SHA256_PATTERN = /^[0-9a-f]{64}$/;
const BUILD_ID_PATTERN = /^v594b-[0-9a-f]{64}$/;
const DEPLOYMENT_PATTERN = /^v594-[0-9a-f]{12}-[0-9a-f]{12}$/;

export type AtlasV594IdentityBindingStatus =
  | "bound"
  | "unbound-development"
  | "unbound-production";

export type AtlasV594DeliveryTier = "standalone-full" | "vercel-lite";

export type AtlasV594BuildIdentityInput = Readonly<{
  sourceManifestSha256?: string;
  candidateManifestSha256?: string;
  buildFingerprint?: string;
  buildId?: string;
  deploymentId?: string;
  deliveryTier?: string;
  nodeEnv?: string;
}>;

export type AtlasV594BuildIdentity = Readonly<{
  formalProductPointer: typeof ATLAS_V594_FORMAL_PRODUCT_POINTER;
  sourceManifestSha256: string;
  candidateManifestSha256: string;
  buildFingerprint: string;
  buildId: string;
  deploymentId: string;
  deliveryTier: AtlasV594DeliveryTier | AtlasV594IdentityBindingStatus;
  bindingStatus: AtlasV594IdentityBindingStatus;
}>;

export function deriveAtlasV594NextBuildId(buildFingerprint: string): string {
  if (!SHA256_PATTERN.test(buildFingerprint)) throw new Error("v594-build-fingerprint-sha");
  return `v594b-${buildFingerprint}`;
}

export function createAtlasV594BuildIdentity(
  input: AtlasV594BuildIdentityInput,
): AtlasV594BuildIdentity {
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
    && buildId === deriveAtlasV594NextBuildId(buildFingerprint);
  const deploymentBoundToCandidate = identityFieldsValid
    && deploymentId === `v594-${sourceManifestSha256.slice(0, 12)}-${candidateManifestSha256.slice(0, 12)}`;
  return Object.freeze({
    formalProductPointer: ATLAS_V594_FORMAL_PRODUCT_POINTER,
    sourceManifestSha256,
    candidateManifestSha256,
    buildFingerprint,
    buildId,
    deploymentId,
    deliveryTier,
    bindingStatus: buildIdBoundToFingerprint && deploymentBoundToCandidate ? "bound" : unbound,
  });
}

export const ATLAS_V594_BUILD_IDENTITY = createAtlasV594BuildIdentity({
  sourceManifestSha256: process.env.NEXT_PUBLIC_ATLAS_V594_SOURCE_MANIFEST_SHA256,
  candidateManifestSha256: process.env.NEXT_PUBLIC_ATLAS_V594_CANDIDATE_MANIFEST_SHA256,
  buildFingerprint: process.env.NEXT_PUBLIC_ATLAS_V594_BUILD_FINGERPRINT,
  buildId: process.env.NEXT_PUBLIC_ATLAS_V594_BUILD_ID,
  deploymentId: process.env.NEXT_PUBLIC_ATLAS_V594_DEPLOYMENT_ID,
  deliveryTier: process.env.NEXT_PUBLIC_ATLAS_CELESTIAL_DELIVERY_TIER,
  nodeEnv: process.env.NODE_ENV,
});
