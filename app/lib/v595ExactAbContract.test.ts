import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { createAtlasV595BuildIdentity } from "./atlasV595BuildIdentity";
import {
  V595_EXACT_AB_CANVAS_IDENTITY,
  V595_EXACT_AB_RELATIVITY_OBSERVATION_VERSION,
  V595_EXACT_AB_SETTLE_POLICY,
  canonicalShaV595Exact,
  createV595ExactAbConsumerReceipt,
  createV595ExactAbRuntimeRequest,
  createV595ExactAbSoakObservability,
  createV595StellarRenderProfile,
  exactCandidateForLaneV595,
  resolveV595ExactAbRequestEligibility,
  resolveV595ExactAbSearch,
  type V595ExactAbLane,
} from "./v595ExactAbContract";
import {
  resolveV595ExactAbSelection,
  shouldOpenV595ValidationConsole,
} from "./v595ExactAbSelection";

const SOURCE_SHA = "a".repeat(64);
const CANDIDATE_SHA = "b".repeat(64);
const FINGERPRINT = "c".repeat(64);
const IDENTITY = createAtlasV595BuildIdentity({
  sourceManifestSha256: SOURCE_SHA,
  candidateManifestSha256: CANDIDATE_SHA,
  buildFingerprint: FINGERPRINT,
  buildId: `v595b-${FINGERPRINT}`,
  deploymentId: `v595-${SOURCE_SHA.slice(0, 12)}-${CANDIDATE_SHA.slice(0, 12)}`,
  deliveryTier: "standalone-full",
  nodeEnv: "production",
});

function exactRequest(lane: V595ExactAbLane = "candidate-v595") {
  return createV595ExactAbRuntimeRequest({
    lane,
    targetId: "sirius-a",
    archetype: "hot-radiative",
    mode: "cinematic",
    identity: IDENTITY,
  });
}

function mountedSnapshot(candidateNodes = 1) {
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
      stellarHeroIds: Object.freeze(["sirius-a"]),
      stellarArchetypes: Object.freeze(["hot-radiative"]),
      stellarContractSha256s: Object.freeze(["d".repeat(64)]),
    }),
    workers: 1,
  });
}

function receiptFor(lane: V595ExactAbLane) {
  const request = exactRequest(lane);
  const snapshot = mountedSnapshot();
  const soakObservability = createV595ExactAbSoakObservability({
    request,
    rendererIdentity: {
      canvasIdentity: V595_EXACT_AB_CANVAS_IDENTITY,
      renderer: "WebGLRenderer",
      context: "webgl2",
    },
    snapshot,
    settle: {
      stableForMilliseconds: 1_100,
      stableFrameSampleCount: 4,
      censusFingerprintSha256: canonicalShaV595Exact(snapshot),
      optionalTextureCache: {
        status: "active",
        entries: 4,
        pending: 0,
        referenced: 4,
        retainedTextures: 4,
        registeredTextures: 4,
      },
    },
  });
  return createV595ExactAbConsumerReceipt({
    request,
    cameraState: Object.freeze({
      preset: request.frame.cameraPreset,
      position: Object.freeze([0, 0, 28] as const),
      target: Object.freeze([0, 0, 0] as const),
      quaternion: Object.freeze([0, 0, 0, 1] as const),
      projection: Object.freeze({ fov: 42, near: 0.01, far: 1e9 }),
    }),
    candidateNodeIds: Object.freeze([`${exactCandidateForLaneV595(lane)}:stellar:sirius-a:root`]),
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
}

describe("v595 Exact A/B version boundary", () => {
  it.each([
    ["", "inactive", "absent"],
    ["?v594ExactAb=1", "inactive", "absent"],
    ["?v595ExactAb=1", "active", "exact-one"],
    ["?v595ExactAb=1&v595ExactAb=1", "invalid", "duplicate"],
    ["?v595ExactAb=0", "invalid", "unknown-value"],
  ] as const)("resolves %s without accepting a v594 query", (search, status, reason) => {
    expect(resolveV595ExactAbSearch(search)).toEqual({ status, reason });
  });

  it("binds only AtlasV595BuildIdentity and the v594/v595 lanes", () => {
    const request = exactRequest();
    expect(request.version).toBe("v595-stellar-relativity-exact-ab-v1");
    expect(request.identity.formalProductPointer).toBe("v263");
    expect(request.identity.buildId).toBe(`v595b-${FINGERPRINT}`);
    expect(request.frame.lane).toBe("candidate-v595");
    expect(request.frame.cameraPreset).toBe("v595-exact-hot-radiative-camera-v1");
    expect(exactCandidateForLaneV595("baseline-v594")).toBe("v594");
    expect(exactCandidateForLaneV595("candidate-v595")).toBe("v595");
    expect(createV595StellarRenderProfile(request)).toMatchObject({
      version: "v595-stellar-render-profile-v1",
      rendererContractVersion: "v594-stellar-portrait-render-contract-v1",
      candidate: "v595",
    });
  });

  it("publishes independent seals and exact revisions for both lanes", () => {
    const baseline = receiptFor("baseline-v594");
    const candidate = receiptFor("candidate-v595");
    expect(baseline.render).toMatchObject({ candidate: "v594", revision: 594 });
    expect(candidate.render).toMatchObject({ candidate: "v595", revision: 595 });
    expect(candidate.version).toBe("v595-exact-ab-app-consumer-receipt-v1");
    expect(candidate.runtimeVersion).toBe("v595-stellar-relativity-exact-ab-v1");
    expect(candidate.identity).toBe(IDENTITY);
    expect(candidate.receiptSha256).toMatch(/^[0-9a-f]{64}$/);
    expect(candidate.receiptSha256).not.toBe(baseline.receiptSha256);
    expect(candidate.render.contractState).toMatchObject({
      scientificAuthority: false,
      measuredAuthority: false,
      gpuAuthority: false,
      radiativeTransferAuthority: false,
      grmhdAuthority: false,
      promotion: "none",
      defaultKernel: "legacy-eih-1pn",
      scientificPayloadWriteback: false,
    });
  });

  it("retains the fail-closed capture prerequisites and v595 selection path", () => {
    const ready = {
      active: true,
      identityBound: true,
      paused: true,
      simDays: 0,
      assetReady: true,
      selectedTargetReady: true,
      controlsCollapsed: true,
    };
    expect(resolveV595ExactAbRequestEligibility(ready)).toEqual({ eligible: true, reason: "ready" });
    expect(resolveV595ExactAbRequestEligibility({ ...ready, identityBound: false }).reason)
      .toBe("identity-unbound");
    expect(resolveV595ExactAbRequestEligibility({ ...ready, simDays: Number.NaN }).reason)
      .toBe("simulation-day-not-zero");
    expect(resolveV595ExactAbSelection("sun", "validation")).toMatchObject({
      archetype: "relativity-workbench",
      kind: "relativity",
    });
    expect(shouldOpenV595ValidationConsole(true)).toBe(false);
  });

  it("rejects a renderer census with anything other than one connected main Canvas", () => {
    const request = exactRequest();
    const snapshot = { ...mountedSnapshot(), canvas: { count: 2, connected: 2 } };
    expect(() => createV595ExactAbSoakObservability({
      request,
      rendererIdentity: {
        canvasIdentity: V595_EXACT_AB_CANVAS_IDENTITY,
        renderer: "WebGLRenderer",
        context: "webgl2",
      },
      snapshot,
      settle: {
        stableForMilliseconds: V595_EXACT_AB_SETTLE_POLICY.minimumStableMilliseconds,
        stableFrameSampleCount: V595_EXACT_AB_SETTLE_POLICY.minimumStableFrameSamples,
        censusFingerprintSha256: canonicalShaV595Exact(snapshot),
        optionalTextureCache: {
          status: "active",
          entries: 0,
          pending: 0,
          referenced: 0,
          retainedTextures: 0,
          registeredTextures: 0,
        },
      },
    })).toThrow("v595-exact-soak-observability");
  });

  it("uses v595 current markers while keeping the legacy adapter explicitly branched", () => {
    const workbench = readFileSync("app/components/AtlasRuntimeWorkbenchSurface.tsx", "utf8");
    const dom = readFileSync("app/components/V595ExactAbDomSurface.tsx", "utf8");
    const runtime = readFileSync("app/components/AtlasUniverseSceneRuntime.tsx", "utf8");
    expect(workbench).toContain("resolveV595ExactAbSearch");
    expect(workbench).toContain("ATLAS_V595_BUILD_IDENTITY");
    expect(workbench).toContain("<V595ExactAbDomSurface");
    expect(workbench).not.toContain("resolveV594ExactAbSearch");
    expect(dom).toContain("data-atlas-v595-exact-ab");
    expect(dom).not.toContain("data-atlas-v594-exact-ab");
    expect(runtime).toContain("V594_EXACT_AB_RUNTIME_VERSION");
    expect(runtime).toContain("V595_EXACT_AB_RUNTIME_VERSION");
  });

  it("marks relativity as supplemental shadow-only and never promoted", () => {
    const request = createV595ExactAbRuntimeRequest({
      lane: "candidate-v595",
      targetId: "sun",
      archetype: "relativity-workbench",
      mode: "validation",
      identity: IDENTITY,
    });
    const snapshot = mountedSnapshot();
    const observation = createV595ExactAbSoakObservability({
      request,
      rendererIdentity: {
        canvasIdentity: V595_EXACT_AB_CANVAS_IDENTITY,
        renderer: "WebGLRenderer",
        context: "webgl2",
      },
      snapshot,
      settle: {
        stableForMilliseconds: V595_EXACT_AB_SETTLE_POLICY.minimumStableMilliseconds,
        stableFrameSampleCount: V595_EXACT_AB_SETTLE_POLICY.minimumStableFrameSamples,
        censusFingerprintSha256: canonicalShaV595Exact(snapshot),
        optionalTextureCache: {
          status: "active",
          entries: 0,
          pending: 0,
          referenced: 0,
          retainedTextures: 0,
          registeredTextures: 0,
        },
      },
    });
    expect(observation.relativityObservation).toEqual({
      version: V595_EXACT_AB_RELATIVITY_OBSERVATION_VERSION,
      active: true,
      targetId: "sun",
      workbenchMode: "validation",
      authority: "shadow-only",
      referenceCandidate: "timelike-kerr-v595",
      formalEvidence: false,
      promotion: "none",
      defaultKernel: "legacy-eih-1pn",
      scientificPayloadWriteback: false,
    });
  });
});
