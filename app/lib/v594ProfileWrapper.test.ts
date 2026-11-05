import { describe, expect, it } from "vitest";

import {
  V594_BUILD_RECEIPT_VERSION,
  V594_BUILD_TIMESTAMP_POLICY,
  V594_REQUIRED_CLOSURE_PATHS,
  createV594BuildReceipt,
  deriveV594DeploymentId,
  deriveV594NextBuildId,
  loadV594ProfileIdentity,
  serializeV594BuildReceipt,
  v594ProfileInvocation,
} from "../../scripts/build-atlas-v594-profile.mjs";
import { canonicalShaV594 } from "../../scripts/build-v594-stellar-relativity-candidate.mjs";
import { resolveAtlasNextBuildId } from "../../next.config.mjs";

const SOURCE_SHA = "a".repeat(64);
const CANDIDATE_SHA = "b".repeat(64);
const DELIVERY_TIERS: readonly ("standalone-full" | "vercel-lite")[] = [
  "standalone-full",
  "vercel-lite",
];

function fixtureIdentity(requested: "standalone-full" | "vercel-lite") {
  const buildFingerprint = canonicalShaV594({
    version: "v594-profile-wrapper-test-fingerprint-v1",
    requested,
  });
  const suffix = requested === "standalone-full" ? "standalone" : "lite";
  return Object.freeze({
    source: Object.freeze({
      generatedAt: "2026-08-25T00:00:00.000Z",
      receiptSha256: SOURCE_SHA,
      closureSourcePaths: Object.freeze(V594_REQUIRED_CLOSURE_PATHS.map((path) => Object.freeze({
        path,
        state: "present",
        bytes: 1,
        sha256: "c".repeat(64),
      }))),
    }),
    manifest: Object.freeze({ manifestSha256: CANDIDATE_SHA }),
    requested,
    suffix,
    deploymentId: deriveV594DeploymentId(SOURCE_SHA, CANDIDATE_SHA),
    buildFingerprint,
    buildId: deriveV594NextBuildId(buildFingerprint),
    closureSlot: `${SOURCE_SHA.slice(0, 12)}-${CANDIDATE_SHA.slice(0, 12)}`,
    pendingClosurePaths: Object.freeze([]),
  });
}

describe("v594 profile wrapper", () => {
  it("derives a v594-only generic profile invocation", () => {
    const identity = fixtureIdentity("standalone-full");
    const invocation = v594ProfileInvocation(identity);
    expect(identity.deploymentId).toMatch(/^v594-[0-9a-f]{12}-[0-9a-f]{12}$/);
    expect(invocation.args[0]).toBe("scripts/build-atlas-profile.mjs");
    expect(invocation.args).toContain("standalone-full");
    expect(invocation.args.join(" ")).toContain(".next-atlas-v594-standalone-");
    expect(invocation.args.join(" ")).not.toContain("v593");
    expect(invocation.env.ATLAS_BUILD_RECEIPT_NAME).toBe("atlas-v594-standalone-build-resource.json");
    expect(invocation.unsetEnv).toContain("NEXT_DEPLOYMENT_ID");
    expect(Object.hasOwn(invocation.env, "NEXT_DEPLOYMENT_ID")).toBe(false);
    expect(invocation.env.NEXT_PUBLIC_ATLAS_V594_SOURCE_MANIFEST_SHA256)
      .toBe(identity.source.receiptSha256);
    expect(invocation.env.NEXT_PUBLIC_ATLAS_V594_CANDIDATE_MANIFEST_SHA256)
      .toBe(identity.manifest.manifestSha256);
    expect(invocation.env.NEXT_PUBLIC_ATLAS_V594_BUILD_FINGERPRINT)
      .toBe(identity.buildFingerprint);
    expect(invocation.env.NEXT_PUBLIC_ATLAS_V594_DEPLOYMENT_ID)
      .toBe(identity.deploymentId);
    expect(Object.values(invocation.env).join(" ")).not.toContain("v593");
  });

  it.each(DELIVERY_TIERS)(
    "seals a deterministic %s build receipt",
    (requested) => {
      const identity = fixtureIdentity(requested);
      const profileWrapper = Object.freeze({
        path: "scripts/build-atlas-v594-profile.mjs",
        bytes: 123,
        sha256: "d".repeat(64),
      });
      const first = createV594BuildReceipt(identity, { profileWrapper });
      const second = createV594BuildReceipt(identity, { profileWrapper });
      const unsigned = Object.fromEntries(
        Object.entries(first).filter(([key]) => key !== "receiptSha256"),
      );

      expect(first.version).toBe(V594_BUILD_RECEIPT_VERSION);
      expect(first.timestampPolicy).toBe(V594_BUILD_TIMESTAMP_POLICY);
      expect(first.deliveryTier).toBe(requested);
      expect(first.buildId).toBe(`v594b-${identity.buildFingerprint}`);
      expect(first.receiptSha256).toBe(canonicalShaV594(unsigned));
      expect(serializeV594BuildReceipt(first)).toBe(serializeV594BuildReceipt(second));
    },
  );

  it("rejects invalid configured build IDs and preserves the framework fallback", () => {
    const valid = `v594b-${"e".repeat(64)}`;
    expect(resolveAtlasNextBuildId({ NODE_ENV: "test" })).toBeNull();
    expect(resolveAtlasNextBuildId({ NODE_ENV: "test", ATLAS_NEXT_BUILD_ID: `  ${valid}  ` }))
      .toBe(valid);
    expect(() => resolveAtlasNextBuildId({
      NODE_ENV: "test",
      ATLAS_NEXT_BUILD_ID: "build-TfctsWXpff2fKS",
    }))
      .toThrow("Invalid ATLAS_NEXT_BUILD_ID");
    expect(() => resolveAtlasNextBuildId({
      NODE_ENV: "test",
      ATLAS_NEXT_BUILD_ID: `v594b-${"E".repeat(64)}`,
    }))
      .toThrow("Invalid ATLAS_NEXT_BUILD_ID");
  });

  it("fails closed until convergence and reserved closure tooling are complete", () => {
    let provisional: ReturnType<typeof loadV594ProfileIdentity>;
    try {
      provisional = loadV594ProfileIdentity({ requireReady: false, requested: "vercel-lite" });
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      if (!(error instanceof Error)) throw error;
      expect(error.message).toMatch(/^v594-build-source-(?:drift|missing):/);
      return;
    }
    if (provisional.pendingClosurePaths.length > 0) {
      expect(() => loadV594ProfileIdentity({ requireReady: true, requested: "vercel-lite" }))
        .toThrow("v594-build-closure-source-pending");
    } else if (provisional.manifest.relativity.adaptiveConvergenceQualified !== true) {
      expect(() => loadV594ProfileIdentity({ requireReady: true, requested: "vercel-lite" }))
        .toThrow("v594-build-kerr-adaptive-convergence-not-qualified");
    } else {
      expect(() => loadV594ProfileIdentity({ requireReady: true, requested: "vercel-lite" }))
        .not.toThrow();
    }
  });

  it("rejects malformed and non-v594 identities", () => {
    expect(() => deriveV594DeploymentId("bad", "a".repeat(64))).toThrow("v594-build-source-sha");
    expect(() => deriveV594DeploymentId("a".repeat(64), "bad")).toThrow("v594-build-manifest-sha");
    expect(() => loadV594ProfileIdentity({ requireReady: false, requested: "local-shadow" }))
      .toThrow("v594-build-delivery-tier");
  });
});
