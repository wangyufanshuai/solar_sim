import { describe, expect, it } from "vitest";

import {
  assertPageBuildIdentityV591,
  derivePageBuildFingerprintV591,
} from "./v591-page-build-identity.mjs";

const sourceManifestSha256 = "a".repeat(64);

describe("v591 page-origin build identity", () => {
  it("derives a deterministic profile-specific fingerprint", () => {
    const standalone = derivePageBuildFingerprintV591({ sourceManifestSha256, deliveryTier: "standalone-full" });
    expect(standalone).toMatch(/^[a-f0-9]{64}$/);
    expect(derivePageBuildFingerprintV591({ sourceManifestSha256, deliveryTier: "standalone-full" })).toBe(standalone);
    expect(derivePageBuildFingerprintV591({ sourceManifestSha256, deliveryTier: "vercel-lite" })).not.toBe(standalone);
  });

  it("rejects malformed source and delivery identities", () => {
    expect(() => derivePageBuildFingerprintV591({ sourceManifestSha256: "bad", deliveryTier: "standalone-full" })).toThrow("v591-page-build-source-sha");
    expect(() => derivePageBuildFingerprintV591({ sourceManifestSha256, deliveryTier: "other" })).toThrow("v591-page-build-delivery-tier");
  });

  it("accepts only the identity exported by the running page", () => {
    const deliveryTier = "standalone-full";
    const buildFingerprint = derivePageBuildFingerprintV591({ sourceManifestSha256, deliveryTier });
    const state = {
      "data-atlas-v591-page-source-manifest-sha": sourceManifestSha256,
      "data-atlas-v591-page-delivery-tier": deliveryTier,
      "data-atlas-v591-page-build-fingerprint": buildFingerprint,
    };
    expect(() => assertPageBuildIdentityV591(state, { sourceManifestSha256, deliveryTier, buildFingerprint }, "replay-0")).not.toThrow();
    expect(() => assertPageBuildIdentityV591({ ...state, "data-atlas-v591-page-source-manifest-sha": "b".repeat(64) }, { sourceManifestSha256, deliveryTier, buildFingerprint }, "replay-0")).toThrow("v591-page-build-source-mismatch:replay-0");
    expect(() => assertPageBuildIdentityV591({ ...state, "data-atlas-v591-page-delivery-tier": "vercel-lite" }, { sourceManifestSha256, deliveryTier, buildFingerprint }, "replay-0")).toThrow("v591-page-build-tier-mismatch:replay-0");
    expect(() => assertPageBuildIdentityV591({ ...state, "data-atlas-v591-page-build-fingerprint": "c".repeat(64) }, { sourceManifestSha256, deliveryTier, buildFingerprint }, "replay-0")).toThrow("v591-page-build-fingerprint-mismatch:replay-0");
  });
});
