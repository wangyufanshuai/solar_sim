import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import type { AtlasRuntimeResourceSnapshot } from "./atlasResourceLifecycle";
import {
  POST_V594_SAME_REALM_LIFECYCLE_HISTORY_LIMIT,
  POST_V594_SAME_REALM_LIFECYCLE_QUERY,
  assignPostV594LifecycleObserver,
  beginPostV594SameRealmLifecycleLedger,
  createPostV594RendererSnapshot,
  createPostV594NoCanvasSnapshot,
  isPostV594SameRealmLifecycleAuditSearch,
  postV594BaselineSnapshotIsObserved,
  postV594ExitObservationIsComplete,
  postV594MountedSnapshotIsActive,
  postV594ReleaseCompletionIsComplete,
  postV594SnapshotSatisfiesReleaseContract,
  recordPostV594LifecyclePhase,
  recordPostV594LifecycleExitObservation,
  recordPostV594LifecycleSnapshot,
  resolvePostV594SameRealmLifecycleAudit,
} from "./postV594SameRealmLifecycle";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

function resourceSnapshot(
  overrides: Partial<AtlasRuntimeResourceSnapshot> = {},
): AtlasRuntimeResourceSnapshot {
  return {
    total: 0,
    workers: 0,
    gpuRenderTargets: 0,
    gpuBuffers: 0,
    gpuComputePipelines: 0,
    gpuQueries: 0,
    textures: 0,
    models: 0,
    subscriptions: 0,
    objectUrls: 0,
    typedArrayCaches: 0,
    cameraLocks: 0,
    estimatedBytes: 0,
    estimatedGpuBytes: 0,
    byOwner: {},
    byKind: {} as AtlasRuntimeResourceSnapshot["byKind"],
    byIdentity: {},
    identityDigest: "00000000",
    revision: 0,
    ...overrides,
  };
}

describe("post-v593 v594 same-realm scene-exit contract", () => {
  it("activates only for one exact lifecycleAudit value", () => {
    expect(isPostV594SameRealmLifecycleAuditSearch(
      `?lifecycleAudit=${POST_V594_SAME_REALM_LIFECYCLE_QUERY}`,
    )).toBe(true);
    expect(isPostV594SameRealmLifecycleAuditSearch(
      `?frame=sun&lifecycleAudit=${POST_V594_SAME_REALM_LIFECYCLE_QUERY}`,
    )).toBe(true);
    expect(isPostV594SameRealmLifecycleAuditSearch("?lifecycleAudit=unknown")).toBe(false);
    expect(isPostV594SameRealmLifecycleAuditSearch(
      `?lifecycleAudit=${POST_V594_SAME_REALM_LIFECYCLE_QUERY}&lifecycleAudit=${POST_V594_SAME_REALM_LIFECYCLE_QUERY}`,
    )).toBe(false);
    expect(isPostV594SameRealmLifecycleAuditSearch(
      `?lifecycleAudit=${POST_V594_SAME_REALM_LIFECYCLE_QUERY}&lifecycleAudit=unknown`,
    )).toBe(false);
    expect(resolvePostV594SameRealmLifecycleAudit()).toBe(false);
  });

  it("keeps renderer and scene unknown at a no-canvas baseline while requiring observed registry zero", () => {
    const zero = createPostV594NoCanvasSnapshot({
      canvasCount: 0,
      connectedCanvasCount: 0,
      registry: resourceSnapshot(),
      capturedAt: "2026-08-25T00:00:00.000Z",
    });
    expect(zero.renderer.active).toBeNull();
    expect(zero.renderer.renderTargets).toBe(0);
    expect(zero.renderer.renderTargetsSource).toBe("atlas-resource-registry.gpuRenderTargets");
    expect(zero.registry.renderTargets).toBe(0);
    expect(zero.scene.active).toBeNull();
    expect(postV594BaselineSnapshotIsObserved(zero)).toBe(true);
    expect(postV594SnapshotSatisfiesReleaseContract(zero)).toBe(false);

    const unknown = createPostV594NoCanvasSnapshot({
      canvasCount: 0,
      connectedCanvasCount: 0,
      registry: null,
    });
    expect(unknown.registry.total).toBeNull();
    expect(postV594BaselineSnapshotIsObserved(unknown)).toBe(false);
    expect(postV594SnapshotSatisfiesReleaseContract(unknown)).toBe(false);

    const canvasStillPresent = createPostV594NoCanvasSnapshot({
      canvasCount: 1,
      connectedCanvasCount: 1,
      registry: resourceSnapshot(),
    });
    expect(canvasStillPresent.renderer.active).toBeNull();
    expect(postV594BaselineSnapshotIsObserved(canvasStillPresent)).toBe(false);
    expect(postV594SnapshotSatisfiesReleaseContract(canvasStillPresent)).toBe(false);
  });

  it("requires observable detached fields to be finite zero while renderer.info counters remain unavailable after context loss", () => {
    const detached = createPostV594RendererSnapshot({
      captureKind: "unmounted-renderer",
      canvasCount: 0,
      connectedCanvasCount: 0,
      rendererActive: 0,
      rendererTextures: null,
      rendererGeometries: null,
      rendererPrograms: null,
      rendererResourceCountsSource: "unavailable-context-lost-stale-info",
      registry: resourceSnapshot(),
      sceneActive: 0,
      sceneObjects: 0,
      candidateNodes: 0,
      stellarHeroIds: [],
      stellarArchetypes: [],
      stellarContractSha256s: [],
    });
    expect(postV594SnapshotSatisfiesReleaseContract(detached)).toBe(true);
    expect(postV594SnapshotSatisfiesReleaseContract(createPostV594RendererSnapshot({
      ...detached,
      canvasCount: detached.canvas.count,
      connectedCanvasCount: detached.canvas.connected,
      rendererActive: detached.renderer.active,
      rendererTextures: detached.renderer.textures,
      rendererGeometries: detached.renderer.geometries,
      rendererPrograms: null,
      rendererResourceCountsSource: "three.webglrenderer.info",
      registry: resourceSnapshot(),
      sceneActive: detached.scene.active,
      sceneObjects: detached.scene.objects,
      candidateNodes: detached.scene.candidateNodes,
      stellarHeroIds: detached.scene.stellarHeroIds,
      stellarArchetypes: detached.scene.stellarArchetypes,
      stellarContractSha256s: detached.scene.stellarContractSha256s,
    }))).toBe(false);
    expect(postV594SnapshotSatisfiesReleaseContract(createPostV594RendererSnapshot({
      captureKind: "unmounted-renderer",
      canvasCount: 0,
      connectedCanvasCount: 0,
      rendererActive: 0,
      rendererTextures: 0,
      rendererGeometries: null,
      rendererPrograms: null,
      rendererResourceCountsSource: "unavailable-context-lost-stale-info",
      registry: resourceSnapshot(),
      sceneActive: 0,
      sceneObjects: 0,
      candidateNodes: 0,
      stellarHeroIds: [],
      stellarArchetypes: [],
      stellarContractSha256s: [],
    }))).toBe(false);
    expect(postV594SnapshotSatisfiesReleaseContract(createPostV594RendererSnapshot({
      captureKind: "unmounted-renderer",
      canvasCount: 0,
      connectedCanvasCount: 0,
      rendererActive: 0,
      rendererTextures: 7,
      rendererGeometries: null,
      rendererPrograms: null,
      rendererResourceCountsSource: "unavailable-context-lost-stale-info",
      registry: resourceSnapshot(),
      sceneActive: 0,
      sceneObjects: 0,
      candidateNodes: 0,
      stellarHeroIds: [],
      stellarArchetypes: [],
      stellarContractSha256s: [],
    }))).toBe(false);
    expect(postV594SnapshotSatisfiesReleaseContract(createPostV594RendererSnapshot({
      captureKind: "unmounted-renderer",
      canvasCount: 0,
      connectedCanvasCount: 0,
      rendererActive: null,
      rendererTextures: null,
      rendererGeometries: null,
      rendererPrograms: null,
      rendererResourceCountsSource: "unavailable-context-lost-stale-info",
      registry: resourceSnapshot(),
      sceneActive: 0,
      sceneObjects: 0,
      candidateNodes: 0,
      stellarHeroIds: [],
      stellarArchetypes: [],
      stellarContractSha256s: [],
    }))).toBe(false);
  });

  it("admits mounted only with one live canvas plus renderer, scene, and registry activity", () => {
    const mounted = createPostV594RendererSnapshot({
      capturedAt: "2026-08-25T00:00:00.000Z",
      captureKind: "mounted-renderer",
      canvasCount: 1,
      connectedCanvasCount: 1,
      rendererActive: 1,
      rendererTextures: 3,
      rendererGeometries: 4,
      rendererPrograms: 2,
      rendererResourceCountsSource: "three.webglrenderer.info",
      registry: resourceSnapshot({ total: 5, textures: 2, estimatedBytes: 4096 }),
      sceneActive: 1,
      sceneObjects: 12,
      candidateNodes: 1,
      stellarHeroIds: ["sirius-a"],
      stellarArchetypes: ["hot-radiative"],
      stellarContractSha256s: ["a".repeat(64)],
    });
    expect(postV594MountedSnapshotIsActive(mounted)).toBe(true);
    expect(postV594MountedSnapshotIsActive(createPostV594RendererSnapshot({
      ...{
        captureKind: "mounted-renderer" as const,
        canvasCount: 1,
        connectedCanvasCount: 1,
        rendererActive: 1,
        rendererTextures: 3,
        rendererGeometries: 4,
        rendererPrograms: 2,
        rendererResourceCountsSource: "three.webglrenderer.info",
        registry: resourceSnapshot({ total: 5 }),
        sceneActive: 1,
        sceneObjects: 12,
        candidateNodes: 0,
        stellarHeroIds: ["sirius-a"],
        stellarArchetypes: ["hot-radiative"],
        stellarContractSha256s: ["a".repeat(64)],
      },
    }))).toBe(false);
    expect(postV594MountedSnapshotIsActive(createPostV594RendererSnapshot({
      captureKind: "mounted-renderer",
      canvasCount: 1,
      connectedCanvasCount: 1,
      rendererActive: 1,
      rendererTextures: null,
      rendererGeometries: 4,
      rendererPrograms: 2,
      rendererResourceCountsSource: "three.webglrenderer.info",
      registry: resourceSnapshot({ total: 5 }),
      sceneActive: 1,
      sceneObjects: 12,
      candidateNodes: 1,
      stellarHeroIds: ["sirius-a"],
      stellarArchetypes: ["hot-radiative"],
      stellarContractSha256s: ["a".repeat(64)],
    }))).toBe(false);
  });

  it("requires every observed R3F cleanup field including forceContextLoss", () => {
    const complete = {
      renderListsDisposed: true as const,
      forceContextLossCalled: true as const,
      contextLost: true as const,
      contextLossSource: "isContextLost" as const,
      canvasDetached: true as const,
      resourceReferencesReleased: true as const,
      routeAfter: "/downloads",
      observerReleased: true as const,
    };
    expect(postV594ExitObservationIsComplete(complete)).toBe(true);
    expect(postV594ExitObservationIsComplete({ ...complete, forceContextLossCalled: null })).toBe(false);
    expect(postV594ExitObservationIsComplete({ ...complete, resourceReferencesReleased: null })).toBe(false);
    expect(postV594ExitObservationIsComplete({ ...complete, observerReleased: null })).toBe(false);
  });

  it("requires the exited snapshot to reuse the exact detached snapshot reference", () => {
    const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {},
    });
    try {
      beginPostV594SameRealmLifecycleLedger();
      const detached = createPostV594RendererSnapshot({
        captureKind: "unmounted-renderer",
        canvasCount: 0,
        connectedCanvasCount: 0,
        rendererActive: 0,
        rendererTextures: null,
        rendererGeometries: null,
        rendererPrograms: null,
        rendererResourceCountsSource: "unavailable-context-lost-stale-info",
        registry: resourceSnapshot(),
        sceneActive: 0,
        sceneObjects: 0,
        candidateNodes: 0,
        stellarHeroIds: [],
        stellarArchetypes: [],
        stellarContractSha256s: [],
      });
      recordPostV594LifecycleSnapshot("detached-stable", detached);
      const beforeInvalidExit = window.__atlasV594SameRealmSceneExitV3;
      expect(() => recordPostV594LifecycleSnapshot(
        "exited",
        structuredClone(detached),
      )).toThrow("v594-lifecycle-exited-snapshot-must-reuse-detached-reference");
      expect(window.__atlasV594SameRealmSceneExitV3).toBe(beforeInvalidExit);

      const exited = recordPostV594LifecycleSnapshot("exited", detached);
      expect(exited?.snapshots.exited).toBe(detached);
      expect(exited?.snapshots.exited).toBe(exited?.snapshots.detached);
    } finally {
      if (originalWindow) Object.defineProperty(globalThis, "window", originalWindow);
      else Reflect.deleteProperty(globalThis, "window");
    }
  });

  it("keeps a monotonic two-entry observer window across repeated same-realm releases", () => {
    const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {},
    });
    try {
      expect(POST_V594_SAME_REALM_LIFECYCLE_HISTORY_LIMIT).toBe(2);
      const initial = beginPostV594SameRealmLifecycleLedger();
      const realmToken = initial.realmToken;
      expect(realmToken).toBeTruthy();

      for (let cycle = 1; cycle <= 5; cycle += 1) {
        const observerAssignment = assignPostV594LifecycleObserver();
        expect(observerAssignment).toBe(cycle);
        recordPostV594LifecyclePhase(cycle === 5 ? "exiting" : "resetting");

        const active = window.__atlasV594SameRealmSceneExitV3;
        expect(active?.observer.nextAssignment).toBe(cycle + 1);
        expect(active?.observer.activeAssignment).toBe(cycle);
        expect(active?.observer.history.length).toBeLessThanOrEqual(
          POST_V594_SAME_REALM_LIFECYCLE_HISTORY_LIMIT,
        );
        expect(active?.observer.history.map((entry) => entry.assignment)).toEqual(
          cycle === 1 ? [1] : [cycle - 1, cycle],
        );
        expect(active?.observer.history.at(-1)?.assignment).toBe(cycle);

        const routeAfter = cycle === 5 ? "/downloads" : "/";
        for (const observation of [
          { renderListsDisposed: true as const },
          { forceContextLossCalled: true as const },
          { contextLost: true as const, contextLossSource: "isContextLost" as const },
          { canvasDetached: true as const },
          { resourceReferencesReleased: true as const },
          { routeAfter },
          { observerReleased: true as const },
        ]) {
          recordPostV594LifecycleExitObservation({ observerAssignment, ...observation });
        }

        const released = window.__atlasV594SameRealmSceneExitV3;
        expect(released?.observer).toMatchObject({
          nextAssignment: cycle + 1,
          activeAssignment: null,
        });
        expect(released?.observer.history).toHaveLength(1);
        expect(released?.observer.history[0]?.assignment).toBe(cycle);
        expect(released?.observer.history[0]?.teardown).toEqual(released?.exit);
        expect(postV594ExitObservationIsComplete(
          released?.exit ?? initial.exit,
          routeAfter,
        )).toBe(true);
        expect(postV594ReleaseCompletionIsComplete(
          released?.releaseCompletion,
          cycle === 5 ? "next-link-route-exit" : "same-realm-repeat",
          cycle === 5 ? "exited" : "baseline",
          routeAfter,
        )).toBe(true);

        if (cycle < 5) {
          const reset = beginPostV594SameRealmLifecycleLedger();
          expect(reset.realmToken).toBe(realmToken);
          expect(reset.observer.nextAssignment).toBe(cycle + 1);
          expect(reset.observer.activeAssignment).toBeNull();
          expect(reset.observer.history).toEqual(released?.observer.history);
          expect(reset.exit.renderListsDisposed).toBeNull();
          expect(reset.releaseCompletion).toEqual(released?.releaseCompletion);
        }
      }

      const finalLedger = window.__atlasV594SameRealmSceneExitV3;
      expect(() => recordPostV594LifecycleExitObservation({
        observerAssignment: 4,
        routeAfter: "/late-stale-observation",
      })).toThrow("v594-lifecycle-observer-assignment-not-active");
      expect(window.__atlasV594SameRealmSceneExitV3).toBe(finalLedger);
    } finally {
      if (originalWindow) Object.defineProperty(globalThis, "window", originalWindow);
      else Reflect.deleteProperty(globalThis, "window");
    }
  });

  it("fails atomically on incomplete release, incomplete reset, and corrupt history", () => {
    const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {},
    });
    try {
      const initial = beginPostV594SameRealmLifecycleLedger();
      const observerAssignment = assignPostV594LifecycleObserver();
      const active = window.__atlasV594SameRealmSceneExitV3;
      expect(() => recordPostV594LifecycleExitObservation({
        observerAssignment,
        observerReleased: true,
      })).toThrow("v594-lifecycle-observer-release-before-complete-teardown");
      expect(window.__atlasV594SameRealmSceneExitV3).toBe(active);
      expect(() => beginPostV594SameRealmLifecycleLedger()).toThrow(
        "v594-lifecycle-observer-reset-before-complete-teardown",
      );
      expect(window.__atlasV594SameRealmSceneExitV3).toBe(active);

      const missingHistory = Object.freeze({
        ...initial,
        observer: Object.freeze({
          nextAssignment: 2,
          activeAssignment: null,
          history: Object.freeze([]),
        }),
      });
      window.__atlasV594SameRealmSceneExitV3 = missingHistory;
      expect(() => beginPostV594SameRealmLifecycleLedger()).toThrow(
        "v594-lifecycle-observer-history-next-assignment-drift",
      );
      expect(window.__atlasV594SameRealmSceneExitV3).toBe(missingHistory);

      const duplicateEntry = Object.freeze({
        assignment: 1,
        teardown: initial.exit,
      });
      const duplicateActive = Object.freeze({
        ...initial,
        observer: Object.freeze({
          nextAssignment: 2,
          activeAssignment: 1,
          history: Object.freeze([duplicateEntry, duplicateEntry]),
        }),
      });
      window.__atlasV594SameRealmSceneExitV3 = duplicateActive;
      expect(() => beginPostV594SameRealmLifecycleLedger()).toThrow(
        "v594-lifecycle-observer-history-sequence-invalid",
      );
      expect(window.__atlasV594SameRealmSceneExitV3).toBe(duplicateActive);
    } finally {
      if (originalWindow) Object.defineProperty(globalThis, "window", originalWindow);
      else Reflect.deleteProperty(globalThis, "window");
    }
  });

  it("keeps the normal single-canvas product path and isolates the audit UI", () => {
    const workbench = read("app/components/AtlasRuntimeWorkbenchSurface.tsx");
    const sceneHost = read("app/components/AtlasSceneHost.tsx");
    expect(workbench).toContain("<AtlasRuntimeWorkbenchSurfaceNormal domains={domains} />");
    expect(workbench).toContain("const [sceneMounted, setSceneMounted] = useState(false)");
    expect(workbench).toContain("{sceneMounted ? (");
    expect(workbench).toContain("postV594BaselineSnapshotIsObserved(snapshot)");
    expect(workbench).toContain('const mountHeroId = "sirius-a"');
    expect(workbench).toContain('const replacementHeroId = "betelgeuse"');
    expect(workbench).toContain("focusStellarHero(mountHeroId)");
    expect(workbench).toContain("focusStellarHero(replacementHeroId)");
    expect(workbench).toContain('recordPostV594LifecyclePhase("replacing")');
    expect(workbench).toContain('recordPostV594LifecyclePhase("replaced")');
    expect(workbench).toContain('data-atlas-v594-lifecycle-action="mount"');
    expect(workbench).toContain('data-atlas-v594-lifecycle-action="replace"');
    expect(workbench).toContain('data-atlas-v594-lifecycle-action="detach"');
    expect(workbench).toContain('data-atlas-v594-lifecycle-action="exit"');
    expect(workbench).toContain('disabled={phase !== "replaced"}');
    expect(workbench).toContain('const V595_LIFECYCLE_CURRENT_CANDIDATE = "v595"');
    expect(workbench).toContain("v595LifecycleReplacementSelector(replacementHeroId)");
    expect(workbench).not.toContain('[data-atlas-candidate="v594"]');
    expect(workbench).toContain('data-stellar-hero-id="${heroId}"');
    expect(workbench).toContain("candidate?.dataset.stellarArchetype");
    expect(workbench).toContain("candidate?.dataset.stellarRenderContractSha256");
    expect(workbench).toContain("snapshot.scene.stellarHeroIds[0] !== mountHeroId");
    expect(workbench).toContain('href="/downloads"');
    expect(workbench).toContain("prefetch={false}");
    expect(sceneHost).toContain('data-atlas-scene-host-canvas-limit="1"');
    expect(sceneHost.match(/<UniverseCanvas\b/g)).toHaveLength(1);
    expect(workbench).not.toContain("location.href");
    expect(workbench).not.toContain("about:blank");
  });

  // Reads local, untracked Playwright runner scratch files under tmp/; skipped when they are absent.
  it.skipIf(!["tmp/v594-same-realm-lifecycle-runner.mjs", "tmp/v595-same-realm-lifecycle-runner.mjs"].every((path) => existsSync(path)))(
    "keeps the lifecycle request ledger compatible with the Playwright CLI VM", () => {
    const runner = read("tmp/v594-same-realm-lifecycle-runner.mjs");
    const currentRunner = read("tmp/v595-same-realm-lifecycle-runner.mjs");
    expect(runner).toContain("url: request.url()");
    expect(runner).not.toContain("new URL(request.url()).href");
    expect(currentRunner).toContain('V595_LIFECYCLE_CURRENT_CANDIDATE = "v595"');
    expect(currentRunner).toContain("replacementSelector: V595_LIFECYCLE_REPLACEMENT_SELECTOR");
    expect(currentRunner).not.toContain('[data-atlas-candidate="v594"][data-stellar-hero-id');
  });

  it("marks cleanup only from observed renderer calls, context state, and DOM detach", () => {
    const canvas = read("app/components/UniverseCanvas.tsx");
    expect(canvas.match(/publishExitObservation\(\{ renderListsDisposed: true \}\)/g)).toHaveLength(1);
    expect(canvas.match(/publishExitObservation\(\{ forceContextLossCalled: true \}\)/g)).toHaveLength(1);
    expect(canvas).toMatch(/wrappedRenderListsDispose[\s\S]+originalRenderListsDispose\.call\(renderLists\)[\s\S]+publishExitObservation\(\{ renderListsDisposed: true \}\)/);
    expect(canvas).toMatch(/wrappedForceContextLoss[\s\S]+originalForceContextLoss\.call\(gl\)[\s\S]+publishExitObservation\(\{ forceContextLossCalled: true \}\)/);
    expect(canvas).toContain('const POST_V595_LIFECYCLE_CANDIDATE = "v595"');
    expect(canvas).toContain("isCurrentV595LifecycleStellarCandidate(node)");
    expect(canvas).toContain("node.userData.atlasStellarRendererV594 === true");
    expect(canvas).toContain("stellarHeroIds.add(node.userData.atlasStellarHeroId)");
    expect(canvas).toContain("stellarArchetypes.add(node.userData.atlasStellarArchetype)");
    expect(canvas).toContain("stellarContractSha256s.add(node.userData.atlasStellarRenderContractSha256)");
    expect(canvas).toContain("exitObservation.forceContextLossCalled === true");
    expect(canvas).toContain("assignPostV594LifecycleObserver()");
    expect(canvas).toContain("observerAssignment, ...patch");
    expect(canvas).toMatch(/onCreated[\s\S]+installOptionalTextureRendererTeardownV594\(gl\)[\s\S]+createUniverseCanvasLifecycleAuditControllerV594/);
    expect(canvas).toContain('canvas.addEventListener("webglcontextlost"');
    expect(canvas).toContain("context.isContextLost()");
    expect(canvas).toContain("canvas.isConnected");
    expect(canvas).toContain("canvasObserver.disconnect()");
    expect(canvas).toContain("window.clearInterval(sampleTimer)");
    expect(canvas).toContain("rendererObserver = null");
    expect(canvas).toContain("publishExitObservation({ resourceReferencesReleased: true })");
    expect(canvas).toMatch(/rendererObserver = null;[\s\S]+publishExitObservation\(\{ resourceReferencesReleased: true \}\)[\s\S]+queueMicrotask/);
    expect(canvas).toContain("gl.forceContextLoss = wrappedForceContextLoss");
  });
});
