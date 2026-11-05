import { describe, expect, it } from "vitest";
import { createAtlasV594BuildIdentity } from "./atlasV594BuildIdentity";
import { readFileSync } from "node:fs";
import {
  V594_EXACT_AB_CANVAS_IDENTITY,
  V594_EXACT_AB_RELATIVITY_OBSERVATION_VERSION,
  V594_EXACT_AB_SETTLE_POLICY,
  canonicalShaV594Exact,
  createV594ExactAbConsumerReceipt,
  createV594ExactAbRuntimeRequest,
  createV594ExactAbSoakObservability,
  resolveV594ExactAbRequestEligibility,
  resolveV594ExactAbSearch,
} from "./v594ExactAbContract";
import { shouldOpenV594ValidationConsole } from "./v594ExactAbSelection";

const SOURCE_SHA = "a".repeat(64);
const CANDIDATE_SHA = "b".repeat(64);
const FINGERPRINT = "c".repeat(64);
const IDENTITY = createAtlasV594BuildIdentity({
  sourceManifestSha256: SOURCE_SHA,
  candidateManifestSha256: CANDIDATE_SHA,
  buildFingerprint: FINGERPRINT,
  buildId: `v594b-${FINGERPRINT}`,
  deploymentId: `v594-${SOURCE_SHA.slice(0, 12)}-${CANDIDATE_SHA.slice(0, 12)}`,
  deliveryTier: "standalone-full",
  nodeEnv: "production",
});

function exactRequest() {
  return createV594ExactAbRuntimeRequest({
    lane: "candidate-v594",
    targetId: "sirius-a",
    archetype: "hot-radiative",
    mode: "cinematic",
    identity: IDENTITY,
  });
}

function mountedSnapshot({
  candidateNodes = 1,
  stellar = true,
}: Readonly<{ candidateNodes?: number; stellar?: boolean }> = {}) {
  return Object.freeze({
    captureKind: "mounted-renderer" as const,
    canvas: Object.freeze({ count: 1, connected: 1 }),
    renderer: Object.freeze({
      active: 1 as const,
      textures: 4,
      geometries: 3,
      programs: 2,
      resourceCountersSource: "three.webglrenderer.info" as const,
      renderTargets: 1,
    }),
    registry: Object.freeze({
      total: 8,
      workers: 1,
      renderTargets: 1,
      textures: 4,
      subscriptions: 2,
      typedArrays: 0,
      estimatedBytes: 1024,
    }),
    scene: Object.freeze({
      active: 1 as const,
      objects: 12,
      candidateNodes,
      stellarHeroIds: Object.freeze(stellar ? ["sirius-a"] : []),
      stellarArchetypes: Object.freeze(stellar ? ["hot-radiative"] : []),
      stellarContractSha256s: Object.freeze(stellar ? ["d".repeat(64)] : []),
    }),
    workers: 1,
  });
}

function settleProof(
  snapshot: ReturnType<typeof mountedSnapshot>,
  overrides: Readonly<Record<string, unknown>> = {},
) {
  return {
    stableForMilliseconds: V594_EXACT_AB_SETTLE_POLICY.minimumStableMilliseconds,
    stableFrameSampleCount: V594_EXACT_AB_SETTLE_POLICY.minimumStableFrameSamples,
    censusFingerprintSha256: canonicalShaV594Exact(snapshot),
    optionalTextureCache: {
      status: "active" as const,
      entries: 4,
      pending: 0,
      referenced: 4,
      retainedTextures: 4,
      registeredTextures: 4,
    },
    ...overrides,
  };
}

describe("v594 Exact A/B app contract", () => {
  it("keeps the real object selection API reachable in Exact validation mode", () => {
    expect(shouldOpenV594ValidationConsole(true)).toBe(false);
    expect(shouldOpenV594ValidationConsole(false)).toBe(true);
    const surface = readFileSync("app/components/AtlasRuntimeWorkbenchSurface.tsx", "utf8");
    expect(surface).toContain("!orbitAtlas || atlasToolsOpen || exactAbActive");
    expect(surface).toContain("onBodyFocus={onBodyFocusFromList}");
  });

  it.each([
    ["", "inactive", "absent"],
    ["?visualDiagnostics=1", "inactive", "absent"],
    ["?v594ExactAb=1", "active", "exact-one"],
    ["?v594ExactAb=1&v594ExactAb=1", "invalid", "duplicate"],
    ["?v594ExactAb=1&v594ExactAb=0", "invalid", "duplicate"],
    ["?v594ExactAb=0", "invalid", "unknown-value"],
    ["?v594ExactAb=true", "invalid", "unknown-value"],
  ] as const)("resolves %s fail closed", (search, status, reason) => {
    expect(resolveV594ExactAbSearch(search)).toEqual({ status, reason });
  });

  it("requires bound identity, paused day zero, ready assets/target and collapsed controls", () => {
    const ready = {
      active: true,
      identityBound: true,
      paused: true,
      simDays: 0,
      assetReady: true,
      selectedTargetReady: true,
      controlsCollapsed: true,
    };
    expect(resolveV594ExactAbRequestEligibility(ready)).toEqual({ eligible: true, reason: "ready" });
    expect(resolveV594ExactAbRequestEligibility({ ...ready, paused: false }).reason)
      .toBe("simulation-playing");
    expect(resolveV594ExactAbRequestEligibility({ ...ready, simDays: Number.NaN }).reason)
      .toBe("simulation-day-not-zero");
    expect(resolveV594ExactAbRequestEligibility({ ...ready, simDays: 0.0001 }).reason)
      .toBe("simulation-day-not-zero");
    expect(resolveV594ExactAbRequestEligibility({ ...ready, controlsCollapsed: false }).reason)
      .toBe("controls-expanded");
    expect(resolveV594ExactAbRequestEligibility({ ...ready, identityBound: false }).reason)
      .toBe("identity-unbound");
  });

  it("seals a settled app-owned receipt with mounted renderer census", () => {
    const request = exactRequest();
    const snapshot = mountedSnapshot();
    const soakObservability = createV594ExactAbSoakObservability({
      request,
      rendererIdentity: Object.freeze({
        canvasIdentity: V594_EXACT_AB_CANVAS_IDENTITY,
        renderer: "WebGLRenderer" as const,
        context: "webgl2" as const,
      }),
      snapshot,
      settle: settleProof(snapshot),
    });
    const receipt = createV594ExactAbConsumerReceipt({
      request,
      cameraState: Object.freeze({
        preset: request.frame.cameraPreset,
        position: Object.freeze([0, 0, 28] as const),
        target: Object.freeze([0, 0, 0] as const),
        quaternion: Object.freeze([0, 0, 0, 1] as const),
        projection: Object.freeze({ fov: 42, near: 0.01, far: 1e9 }),
      }),
      candidateNodeIds: Object.freeze(["v594:stellar:sirius-a:surface"]),
      sourceBindingSha256: "d".repeat(64),
      soakObservability,
      frameClock: Object.freeze({
        requestedAtFrameSequence: 10,
        consumedAtFrameSequence: 11,
        settledAtFrameSequence: 75,
        requestedAtMonotonicMs: 100,
        consumedAtMonotonicMs: 101,
        settledAtMonotonicMs: 1_201,
      }),
    });
    const unsigned = Object.fromEntries(
      Object.entries(receipt).filter(([key]) => key !== "receiptSha256"),
    );
    expect(receipt.receiptSha256).toBe(canonicalShaV594Exact(unsigned));
    expect(receipt.soakObservability.version).toBe("v594-cdp-soak-app-observability-v3");
    expect(receipt.soakObservability.snapshot.renderer.resourceCountersSource)
      .toBe("three.webglrenderer.info");
    expect(receipt.soakObservability.profileKey).toBe("hot-radiative");
    expect(receipt.soakObservability.profile).toEqual({
      key: "hot-radiative",
      targetId: "sirius-a",
      archetype: "hot-radiative",
      kind: "stellar",
      stable: true,
    });
    expect(receipt.soakObservability.settle).toEqual({
      policy: V594_EXACT_AB_SETTLE_POLICY,
      ...settleProof(snapshot),
    });
    expect(receipt.soakObservability.relativityObservation).toEqual({
      version: V594_EXACT_AB_RELATIVITY_OBSERVATION_VERSION,
      active: false,
      targetId: null,
      workbenchMode: "none",
      authority: "none",
      defaultKernel: "legacy-eih-1pn",
      scientificPayloadWriteback: false,
    });
    expect(receipt.soakObservability.relativityObservationSha256)
      .toBe(canonicalShaV594Exact(receipt.soakObservability.relativityObservation));
    expect(receipt.frameClock.requestedAtFrameSequence)
      .toBeLessThan(receipt.frameClock.consumedAtFrameSequence);
    expect(receipt.frameClock.consumedAtFrameSequence)
      .toBeLessThanOrEqual(receipt.frameClock.settledAtFrameSequence);
  });

  it("rejects same-frame request/consume and zero candidate census", () => {
    const request = exactRequest();
    const invalidSnapshot = {
      captureKind: "mounted-renderer" as const,
      canvas: { count: 1, connected: 1 },
      renderer: { active: 1 as const, textures: 0, geometries: 0, programs: 0, resourceCountersSource: "three.webglrenderer.info" as const, renderTargets: 0 },
      registry: { total: 0, workers: 0, renderTargets: 0, textures: 0, subscriptions: 0, typedArrays: 0, estimatedBytes: 0 },
      scene: { active: 1 as const, objects: 1, candidateNodes: 0, stellarHeroIds: [], stellarArchetypes: [], stellarContractSha256s: [] },
      workers: 0,
    };
    expect(() => createV594ExactAbSoakObservability({
      request,
      rendererIdentity: {
        canvasIdentity: V594_EXACT_AB_CANVAS_IDENTITY,
        renderer: "WebGLRenderer",
        context: "webgl2",
      },
      snapshot: invalidSnapshot,
      settle: settleProof(invalidSnapshot as ReturnType<typeof mountedSnapshot>),
    })).toThrow("v594-exact-soak-observability");

    expect(() => createV594ExactAbSoakObservability({
      request,
      rendererIdentity: {
        canvasIdentity: V594_EXACT_AB_CANVAS_IDENTITY,
        renderer: "WebGLRenderer",
        context: "webgl2",
      },
      snapshot: {
        ...invalidSnapshot,
        renderer: { ...invalidSnapshot.renderer, resourceCountersSource: "synthetic-zero" },
        scene: { ...invalidSnapshot.scene, candidateNodes: 1 },
      } as never,
      settle: settleProof(invalidSnapshot as ReturnType<typeof mountedSnapshot>),
    })).toThrow("v594-exact-soak-observability");
  });

  it("fails closed until textures and the mounted census are observably stable", () => {
    const request = exactRequest();
    const snapshot = mountedSnapshot();
    const create = (overrides: Readonly<Record<string, unknown>>) =>
      createV594ExactAbSoakObservability({
        request,
        rendererIdentity: {
          canvasIdentity: V594_EXACT_AB_CANVAS_IDENTITY,
          renderer: "WebGLRenderer",
          context: "webgl2",
        },
        snapshot,
        settle: settleProof(snapshot, overrides) as never,
      });
    expect(() => create({ stableForMilliseconds: 999.999 })).toThrow("v594-exact-settle-proof");
    expect(() => create({ stableFrameSampleCount: 2 })).toThrow("v594-exact-settle-proof");
    expect(() => create({ censusFingerprintSha256: "e".repeat(64) })).toThrow("v594-exact-settle-proof");
    expect(() => create({ optionalTextureCache: {
      ...settleProof(snapshot).optionalTextureCache,
      pending: 1,
    } })).toThrow("v594-exact-settle-proof");
    expect(() => create({ optionalTextureCache: {
      ...settleProof(snapshot).optionalTextureCache,
      status: "disposed",
    } })).toThrow("v594-exact-settle-proof");
  });

  it("publishes an explicit sealed relativity workbench observation marker", () => {
    const request = createV594ExactAbRuntimeRequest({
      lane: "candidate-v594",
      targetId: "sun",
      archetype: "relativity-workbench",
      mode: "validation",
      identity: IDENTITY,
    });
    const snapshot = mountedSnapshot({ stellar: false });
    const soak = createV594ExactAbSoakObservability({
      request,
      rendererIdentity: {
        canvasIdentity: V594_EXACT_AB_CANVAS_IDENTITY,
        renderer: "WebGLRenderer",
        context: "webgl2",
      },
      snapshot,
      settle: settleProof(snapshot),
    });
    expect(soak.relativityObservation).toEqual({
      version: V594_EXACT_AB_RELATIVITY_OBSERVATION_VERSION,
      active: true,
      targetId: "sun",
      workbenchMode: "validation",
      authority: "shadow-only",
      defaultKernel: "legacy-eih-1pn",
      scientificPayloadWriteback: false,
    });
    expect(soak.relativityObservationSha256)
      .toBe(canonicalShaV594Exact(soak.relativityObservation));
  });
});
