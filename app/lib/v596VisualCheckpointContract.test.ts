import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  ATLAS_V596_VISUAL_CHECKPOINT_PARENT_V595,
  createAtlasV596VisualCheckpointIdentity,
  deriveAtlasV596VisualCheckpointBuildFingerprint,
  deriveAtlasV596VisualCheckpointId,
} from "./atlasV596VisualCheckpointIdentity";
import {
  V596_VISUAL_CHECKPOINT_SETTLE_POLICY,
  canonicalShaV596VisualCheckpoint,
  createV596StellarRenderProfile,
  createV596VisualCheckpointConsumerReceipt,
  createV596VisualCheckpointRuntimeRequest,
  resolveV596VisualCheckpointEligibility,
  resolveV596VisualCheckpointSearch,
} from "./v596VisualCheckpointContract";
import { resolveV596VisualCheckpointSelection } from "./v596VisualCheckpointSelection";

const SOURCE_SET_SHA = "a".repeat(64);
const BUILD_FINGERPRINT = deriveAtlasV596VisualCheckpointBuildFingerprint(SOURCE_SET_SHA);
const CHECKPOINT_ID = deriveAtlasV596VisualCheckpointId(
  SOURCE_SET_SHA,
  BUILD_FINGERPRINT,
);
const IDENTITY = createAtlasV596VisualCheckpointIdentity({
  sourceSetSha256: SOURCE_SET_SHA,
  buildFingerprint: BUILD_FINGERPRINT,
  checkpointId: CHECKPOINT_ID,
  runtimeTier: "staging-standalone",
  nodeEnv: "production",
});
const SOURCE_BINDING_SHA = "d".repeat(64);
const MORPHOLOGY_SHA = "e".repeat(64);

function request() {
  return createV596VisualCheckpointRuntimeRequest({
    targetId: "sirius-a",
    archetype: "hot-radiative",
    mode: "cinematic",
    identity: IDENTITY,
  });
}

function mountedSnapshot(candidateNodes = 4) {
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
      stellarContractSha256s: Object.freeze([SOURCE_BINDING_SHA]),
    }),
    workers: 1,
  });
}

function cameraState(captureRequest = request(), distance = 920) {
  return Object.freeze({
    preset: captureRequest.frame.cameraPreset,
    position: Object.freeze([0, 0, distance] as const),
    target: Object.freeze([0, 0, 0] as const),
    quaternion: Object.freeze([0, 0, 0, 1] as const),
    projection: Object.freeze({ fov: 42, near: 0.01, far: 1e9 }),
  });
}

function receipt() {
  const captureRequest = request();
  const snapshot = mountedSnapshot();
  const snapshotSha256 = canonicalShaV596VisualCheckpoint(snapshot);
  return createV596VisualCheckpointConsumerReceipt({
    request: captureRequest,
    cameraState: cameraState(captureRequest),
    candidateNodeIds: Object.freeze([
      "v596:stellar:sirius-a:root",
      "v596:stellar:sirius-a:surface",
      "v596:stellar:sirius-a:corona",
      "v596:stellar:sirius-a:halo",
    ]),
    sourceBindingSha256: SOURCE_BINDING_SHA,
    morphologySha256: MORPHOLOGY_SHA,
    snapshot,
    settle: Object.freeze({
      version: "v596-visual-checkpoint-settle-proof-v1" as const,
      stableForMilliseconds: 1_100,
      stableFrameSampleCount: 4,
      censusFingerprintSha256: snapshotSha256,
      snapshotSha256,
      optionalTextureCache: Object.freeze({
        status: "active" as const,
        entries: 4,
        pending: 0,
        referenced: 4,
        retainedTextures: 4,
        registeredTextures: 4,
      }),
    }),
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

describe("v596 staging visual checkpoint", () => {
  it.each([
    ["", "inactive", "absent"],
    ["?v595ExactAb=1", "inactive", "absent"],
    ["?v596VisualCheckpoint=1", "active", "exact-one"],
    ["?v596VisualCheckpoint=1&v596VisualCheckpoint=1", "invalid", "duplicate"],
    ["?v596VisualCheckpoint=0", "invalid", "unknown-value"],
  ] as const)("resolves %s fail closed", (search, status, reason) => {
    expect(resolveV596VisualCheckpointSearch(search)).toEqual({ status, reason });
  });

  it("binds a staging-only child identity to immutable sealed v595", () => {
    expect(IDENTITY.bindingStatus).toBe("bound");
    expect(IDENTITY.parentV595).toEqual(ATLAS_V596_VISUAL_CHECKPOINT_PARENT_V595);
    expect(IDENTITY.parentV595.sourceManifestSha256)
      .toBe("e06febbe18cd65ad8d24bb618d09c93032ca7fa02d5d69e2d916ea3b8f802186");
    expect(IDENTITY.parentV595.candidateManifestSha256)
      .toBe("332b5ce6a0b5f26a4f9553d44cb9d0eb8d5cc169ae3242b4cd83259b669abae1");
    expect(IDENTITY).toMatchObject({
      formalEvidence: false,
      promotion: "none",
      supplementalOnly: true,
      formalProductPointer: "v263",
    });
    expect(createAtlasV596VisualCheckpointIdentity({ nodeEnv: "production" }).bindingStatus)
      .toBe("unbound-production");
  });

  it("locks day zero, pause, camera and the V596 renderer profile", () => {
    const captureRequest = request();
    expect(captureRequest.frame).toMatchObject({
      candidate: "v596",
      simDays: 0,
      paused: true,
      cameraDistanceSceneUnits: 920,
      cameraFovDegrees: 42,
      cameraNear: 0.01,
      cameraFar: 1_000_000_000,
    });
    expect(createV596StellarRenderProfile(captureRequest)).toMatchObject({
      version: "v596-stellar-render-profile-v1",
      rendererContractVersion: "v596-stellar-portrait-render-contract-v1",
      candidate: "v596",
      targetId: "sirius-a",
      checkpointId: CHECKPOINT_ID,
    });
  });

  it("requires a selected stellar hero and rejects conflicting capture queries", () => {
    expect(resolveV596VisualCheckpointSelection("stellar-hero:sirius-a", "science"))
      .toMatchObject({ targetId: "sirius-a", archetype: "hot-radiative", mode: "science" });
    expect(resolveV596VisualCheckpointSelection("sun", "science")).toBeNull();
    const ready = {
      active: true,
      identityBound: true,
      conflictFree: true,
      paused: true,
      simDays: 0,
      assetReady: true,
      selectedTargetReady: true,
    };
    expect(resolveV596VisualCheckpointEligibility(ready)).toEqual({
      eligible: true,
      reason: "ready",
    });
    expect(resolveV596VisualCheckpointEligibility({ ...ready, conflictFree: false }).reason)
      .toBe("conflicting-capture-query");
    expect(resolveV596VisualCheckpointEligibility({ ...ready, identityBound: false }).reason)
      .toBe("identity-unbound");
    expect(resolveV596VisualCheckpointEligibility({ ...ready, simDays: Number.NaN }).reason)
      .toBe("simulation-day-not-zero");
  });

  it("seals a single-Canvas receipt with every authority and writeback false", () => {
    const value = receipt();
    expect(value.canvas).toMatchObject({
      identity: "atlas-main-r3f-canvas-v1",
      singleCanvasPolicy: "shared-main-canvas",
    });
    expect(value.snapshot.canvas).toEqual({ count: 1, connected: 1 });
    expect(value.render.candidateNodeCount).toBe(4);
    expect(value.render.contractState).toMatchObject({
      presentationAuthority: "none",
      relativityAuthority: "shadow-only",
      scientificAuthority: false,
      measuredAuthority: false,
      gpuAuthority: false,
      resolvedSurfaceAuthority: false,
      observationTextureAuthority: false,
      radiativeTransferAuthority: false,
      grmhdAuthority: false,
      formalEvidence: false,
      promotion: "none",
      supplementalOnly: true,
      defaultKernel: "legacy-eih-1pn",
      scientificPayloadWriteback: false,
      formalProductPointer: "v263",
    });
    expect(value.receiptSha256).toMatch(/^[0-9a-f]{64}$/);
  });

  it("rejects camera drift and any renderer census above one connected Canvas", () => {
    const captureRequest = request();
    const snapshot = mountedSnapshot();
    const snapshotSha256 = canonicalShaV596VisualCheckpoint(snapshot);
    const common = {
      request: captureRequest,
      candidateNodeIds: Object.freeze([
        "v596:stellar:sirius-a:root",
        "v596:stellar:sirius-a:surface",
        "v596:stellar:sirius-a:corona",
        "v596:stellar:sirius-a:halo",
      ]),
      sourceBindingSha256: SOURCE_BINDING_SHA,
      morphologySha256: MORPHOLOGY_SHA,
      settle: Object.freeze({
        version: "v596-visual-checkpoint-settle-proof-v1" as const,
        stableForMilliseconds: V596_VISUAL_CHECKPOINT_SETTLE_POLICY.minimumStableMilliseconds,
        stableFrameSampleCount: V596_VISUAL_CHECKPOINT_SETTLE_POLICY.minimumStableFrameSamples,
        censusFingerprintSha256: snapshotSha256,
        snapshotSha256,
        optionalTextureCache: Object.freeze({
          status: "active" as const,
          entries: 0,
          pending: 0,
          referenced: 0,
          retainedTextures: 0,
          registeredTextures: 0,
        }),
      }),
      frameClock: Object.freeze({
        requestedAtFrameSequence: 10,
        consumedAtFrameSequence: 11,
        settledAtFrameSequence: 75,
        requestedAtMonotonicMs: 100,
        consumedAtMonotonicMs: 101,
        settledAtMonotonicMs: 1_101,
      }),
    };
    expect(() => createV596VisualCheckpointConsumerReceipt({
      ...common,
      cameraState: cameraState(captureRequest, 919),
      snapshot,
    })).toThrow("v596-checkpoint-camera-binding");
    const extraCanvasSnapshot = {
      ...snapshot,
      canvas: Object.freeze({ count: 2, connected: 2 }),
    };
    const extraCanvasSha = canonicalShaV596VisualCheckpoint(extraCanvasSnapshot);
    expect(() => createV596VisualCheckpointConsumerReceipt({
      ...common,
      cameraState: cameraState(captureRequest),
      snapshot: extraCanvasSnapshot,
      settle: Object.freeze({
        ...common.settle,
        censusFingerprintSha256: extraCanvasSha,
        snapshotSha256: extraCanvasSha,
      }),
    })).toThrow("v596-checkpoint-snapshot-binding");
  });

  it("is wired into the main Workbench, shared Canvas and versioned renderer", () => {
    const workbench = readFileSync("app/components/AtlasRuntimeWorkbenchSurface.tsx", "utf8");
    const runtime = readFileSync("app/components/AtlasUniverseSceneRuntime.tsx", "utf8");
    const proxy = readFileSync("app/components/SelectedSkyTargetProxy.tsx", "utf8");
    expect(workbench).toContain("resolveV596VisualCheckpointSearch");
    expect(workbench).toContain("ATLAS_V596_VISUAL_CHECKPOINT_IDENTITY");
    expect(workbench).toContain("createV596StellarRenderProfile");
    expect(workbench).toContain("<V596VisualCheckpointDomSurface");
    expect(workbench).toContain("captureQueryConflict");
    expect(runtime).toContain("V596VisualCheckpointR3fConsumer");
    expect(runtime).toContain("enableDamping={!captureRequestActive}");
    expect(runtime).toContain("enabled={!captureRequestActive}");
    expect(runtime).toContain('document.querySelector<HTMLElement>("[data-atlas-v594-lifecycle-root]")');
    expect(runtime.match(/data-atlas-v594-lifecycle-root/g)?.length ?? 0).toBeGreaterThanOrEqual(2);
    expect(proxy).toContain("v596:stellar:${checkpointProfile.targetId}:root");
    expect(proxy).toContain("hero && exactProfile && !checkpointProfile");
    expect(proxy).toContain("hero && (!exactProfile || checkpointProfile)");
  });
});
