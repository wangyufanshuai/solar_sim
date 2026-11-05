import { createHash } from "node:crypto";

export const V591_PAGE_BUILD_IDENTITY_VERSION = "v591-page-build-identity-v1";
export const V591_PAGE_DELIVERY_TIERS = Object.freeze(["standalone-full", "vercel-lite"]);

const SHA256_PATTERN = /^[a-f0-9]{64}$/;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

export function derivePageBuildFingerprintV591({ sourceManifestSha256, deliveryTier }) {
  assert(SHA256_PATTERN.test(sourceManifestSha256 ?? ""), "v591-page-build-source-sha");
  assert(V591_PAGE_DELIVERY_TIERS.includes(deliveryTier), "v591-page-build-delivery-tier");
  return createHash("sha256")
    .update(`${V591_PAGE_BUILD_IDENTITY_VERSION}\n${sourceManifestSha256}\n${deliveryTier}`, "utf8")
    .digest("hex");
}

export function assertPageBuildIdentityV591(state, expected, label = "state") {
  assert(state && typeof state === "object", `v591-page-build-state:${label}`);
  assert(
    state["data-atlas-v591-page-source-manifest-sha"] === expected.sourceManifestSha256,
    `v591-page-build-source-mismatch:${label}`,
  );
  assert(
    state["data-atlas-v591-page-delivery-tier"] === expected.deliveryTier,
    `v591-page-build-tier-mismatch:${label}`,
  );
  assert(
    state["data-atlas-v591-page-build-fingerprint"] === expected.buildFingerprint,
    `v591-page-build-fingerprint-mismatch:${label}`,
  );
}
