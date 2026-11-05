import { describe, expect, it } from "vitest";

import {
  ATLAS_V596_FORMAL_PRODUCT_POINTER,
  ATLAS_V596_PARENT_V595_IDENTITY,
  createAtlasV596BuildIdentity,
  deriveAtlasV596BuildId,
  deriveAtlasV596DeploymentId,
} from "./atlasV596BuildIdentity";

const source = "a".repeat(64);
const candidate = "b".repeat(64);
const fingerprint = "c".repeat(64);

describe("atlas v596 build identity", () => {
  it("derives independently bound build and deployment identities", () => {
    const identity = createAtlasV596BuildIdentity({
      sourceManifestSha256: source,
      candidateManifestSha256: candidate,
      buildFingerprint: fingerprint,
      buildId: deriveAtlasV596BuildId(fingerprint),
      deploymentId: deriveAtlasV596DeploymentId(source, candidate),
      deliveryTier: "standalone-full",
      nodeEnv: "production",
    });
    expect(identity.formalProductPointer).toBe(ATLAS_V596_FORMAL_PRODUCT_POINTER);
    expect(identity.bindingStatus).toBe("bound");
    expect(ATLAS_V596_PARENT_V595_IDENTITY.relationship).toBe("sealed-parent-not-current-build");
    expect(ATLAS_V596_PARENT_V595_IDENTITY.formalProductPointer).toBe("v263");
    expect(ATLAS_V596_PARENT_V595_IDENTITY.deploymentId).toBe("v595-e06febbe18cd-332b5ce6a0b5");
  });

  it("fails closed for mismatched bindings and invalid hashes", () => {
    const identity = createAtlasV596BuildIdentity({
      sourceManifestSha256: source,
      candidateManifestSha256: candidate,
      buildFingerprint: fingerprint,
      buildId: "v596b-" + "d".repeat(64),
      deploymentId: "v596-aaaaaaaaaaaa-bbbbbbbbbbbb",
      deliveryTier: "vercel-lite",
      nodeEnv: "production",
    });
    expect(identity.bindingStatus).toBe("unbound-production");
    expect(() => deriveAtlasV596BuildId("bad")).toThrow("v596-build-fingerprint-sha");
    expect(() => deriveAtlasV596DeploymentId("bad", candidate)).toThrow("v596-deployment-identity-sha");
  });

  it("uses explicit development and production unbound states", () => {
    expect(createAtlasV596BuildIdentity({ nodeEnv: "development" }).bindingStatus).toBe("unbound-development");
    expect(createAtlasV596BuildIdentity({ nodeEnv: "production" }).bindingStatus).toBe("unbound-production");
  });
});
