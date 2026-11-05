import { describe, expect, it } from "vitest";

import {
  ATLAS_V595_FORMAL_PRODUCT_POINTER,
  ATLAS_V595_PARENT_V594_IDENTITY,
  createAtlasV595BuildIdentity,
  deriveAtlasV595BuildId,
  deriveAtlasV595DeploymentId,
} from "./atlasV595BuildIdentity";

const source = "a".repeat(64);
const candidate = "b".repeat(64);
const fingerprint = "c".repeat(64);

describe("atlas v595 build identity", () => {
  it("derives independently bound build and deployment identities", () => {
    const identity = createAtlasV595BuildIdentity({
      sourceManifestSha256: source,
      candidateManifestSha256: candidate,
      buildFingerprint: fingerprint,
      buildId: deriveAtlasV595BuildId(fingerprint),
      deploymentId: deriveAtlasV595DeploymentId(source, candidate),
      deliveryTier: "standalone-full",
      nodeEnv: "production",
    });
    expect(identity.formalProductPointer).toBe(ATLAS_V595_FORMAL_PRODUCT_POINTER);
    expect(identity.bindingStatus).toBe("bound");
    expect(ATLAS_V595_PARENT_V594_IDENTITY.relationship).toBe("sealed-parent-not-current-build");
    expect(ATLAS_V595_PARENT_V594_IDENTITY.formalProductPointer).toBe("v263");
  });

  it("fails closed for mismatched bindings and invalid hashes", () => {
    const identity = createAtlasV595BuildIdentity({
      sourceManifestSha256: source,
      candidateManifestSha256: candidate,
      buildFingerprint: fingerprint,
      buildId: "v595b-" + "d".repeat(64),
      deploymentId: "v595-aaaaaaaaaaaa-bbbbbbbbbbbb",
      deliveryTier: "vercel-lite",
      nodeEnv: "production",
    });
    expect(identity.bindingStatus).toBe("unbound-production");
    expect(() => deriveAtlasV595BuildId("bad")).toThrow("v595-build-fingerprint-sha");
    expect(() => deriveAtlasV595DeploymentId("bad", candidate)).toThrow("v595-deployment-identity-sha");
  });

  it("uses explicit development and production unbound states", () => {
    expect(createAtlasV595BuildIdentity({ nodeEnv: "development" }).bindingStatus).toBe("unbound-development");
    expect(createAtlasV595BuildIdentity({ nodeEnv: "production" }).bindingStatus).toBe("unbound-production");
  });
});
