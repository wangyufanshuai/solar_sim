import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import { acquireAtlasResource } from "./atlasResourceLifecycle";
import { createAtlasResourceScopeV308 } from "./atlasResourceScopeV308";
import {
  getAtlasStrongGravityTelemetrySnapshotV309,
  publishKerrScienceRasterTelemetryV309,
  publishKerrScienceBandRasterTelemetryV321,
  registerAtlasResourceScopeBaselineV317,
  releaseAtlasResourceScopeV309,
  resetAtlasStrongGravityTelemetryV309ForTests,
  subscribeAtlasStrongGravityTelemetryV309,
} from "./atlasStrongGravityTelemetryV309";
import type { KerrScienceRasterV307 } from "./kerrScienceRasterV307";
import type { KerrScienceBandRasterIntegrityV321, KerrScienceBandRasterV321 } from "./kerrScienceBandRasterV321";

const rasterFixture = (): KerrScienceRasterV307 => ({
  version: "v307-kerr-sparse-science-raster-v1",
  width: 256,
  height: 256,
  rgba: new Uint8Array(new ArrayBuffer(256 ** 2 * 4)),
  summary: { sampleCount: 16, captureCount: 6, escapeCount: 6, diskHitCount: 4, evpaGlyphCount: 4, imageOrderGlyphCount: 4, imageOrderCappedCount: 0 },
  encoding: {
    classification: "fixed-shape-and-v299-color",
    redshift: "fixed-v299-disk-color",
    evpa: "zamo-screen-180deg-line",
    imageOrder: "square-radius-min-11-exact-value-in-v306-workbench",
    intensity: "exact-v306-workbench-only-not-rasterized",
    sourcePayloadMutationAllowed: false,
    cinematicBufferShared: false,
  },
  boundary: "sparse-authority-visualization-not-dense-transfer-map",
});

describe("v309 strong-gravity browser telemetry", () => {
  beforeEach(() => resetAtlasStrongGravityTelemetryV309ForTests());

  it("publishes bounded science raster identity without React state", () => {
    let notifications = 0;
    const unsubscribe = subscribeAtlasStrongGravityTelemetryV309(() => { notifications += 1; });
    publishKerrScienceRasterTelemetryV309(rasterFixture());
    expect(getAtlasStrongGravityTelemetrySnapshotV309()).toMatchObject({
      scienceRasterVersion: "v307-kerr-sparse-science-raster-v1",
      scienceRasterBoundary: "sparse-authority-visualization-not-dense-transfer-map",
      scienceRasterSampleCount: 16,
      scienceRasterEvpaGlyphCount: 4,
      scienceRasterImageOrderGlyphCount: 4,
      revision: 1,
    });
    expect(notifications).toBe(1);
    unsubscribe();
    publishKerrScienceRasterTelemetryV309(rasterFixture());
    expect(notifications).toBe(1);
  });

  it("publishes v317 immutable-buffer digests and dense-incomplete boundary", () => {
    publishKerrScienceRasterTelemetryV309(rasterFixture(), {
      version: "v317-kerr-science-buffer-integrity-v1",
      before: {
        version: "v317-kerr-science-buffer-integrity-v1",
        digestAlgorithm: "sha-256-field-framed-byte-exact",
        digestSha256: "a".repeat(64),
        typedArrayCount: 67,
        uniqueBufferCount: 67,
        totalByteLength: 4096,
        internalBuffersDisjoint: true,
        denseBoundary: "sparse-authority-dense-incomplete",
      },
      after: {
        version: "v317-kerr-science-buffer-integrity-v1",
        digestAlgorithm: "sha-256-field-framed-byte-exact",
        digestSha256: "a".repeat(64),
        typedArrayCount: 67,
        uniqueBufferCount: 67,
        totalByteLength: 4096,
        internalBuffersDisjoint: true,
        denseBoundary: "sparse-authority-dense-incomplete",
      },
      sourcePayloadUnchanged: true,
      rasterDigestSha256: "b".repeat(64),
      rasterBufferDisjoint: true,
      denseBoundary: "sparse-authority-dense-incomplete",
    });
    expect(getAtlasStrongGravityTelemetrySnapshotV309()).toMatchObject({
      sciencePayloadDigestSha256: "a".repeat(64),
      scienceRasterDigestSha256: "b".repeat(64),
      sciencePayloadUnchanged: true,
      scienceBuffersDisjoint: true,
      scienceDenseBoundary: "sparse-authority-dense-incomplete",
    });
  });

  it("publishes v321 band authority, normalization and immutable-view telemetry", () => {
    const baseSnapshot = {
      version: "v317-kerr-science-buffer-integrity-v1" as const,
      digestAlgorithm: "sha-256-field-framed-byte-exact" as const,
      digestSha256: "a".repeat(64),
      typedArrayCount: 67 as const,
      uniqueBufferCount: 67 as const,
      totalByteLength: 4096,
      internalBuffersDisjoint: true as const,
      denseBoundary: "sparse-authority-dense-incomplete" as const,
    };
    const raster = {
      version: "v321-kerr-fixed-band-sparse-science-raster-v1",
      width: 256,
      height: 256,
      rgba: new Uint8Array(new ArrayBuffer(256 ** 2 * 4)),
      sourceRasterVersion: "v307-kerr-sparse-science-raster-v1",
      sourceBandViewVersion: "v320-kerr-fixed-band-science-imaging-v1",
      sourceBandArtifactSha256: "e2bd5957a1dd53a0942d5f7cd519d7b1dd84af1db7f476eb0f9dda0a65c5a460",
      sourceFullShortAuthoritySha256: "99e591c0a8fd1f342ef622239301d04cf9f5cd33cbe1c45f1159e0804f2e81a6",
      summary: { ...rasterFixture().summary, fixedBandColoredDiskRayCount: 4, fixedBandCount: 3, explicitSaturationFlagCount: 12, saturatedChannelCount: 0 },
      encoding: { classification: "fixed-v307-shapes", diskHitColor: "v320-fixed-reference-linear-rgb", physicalBandRadiance: "exact-si-in-v320-artifact-not-encoded-as-scalar-raster", redshift: "included-in-v320-observer-band-integral", evpa: "zamo-screen-180deg-line", imageOrder: "v307-square-contour", normalization: "fixed-physical-reference-no-data-adaptive-rescale", transferFunction: "linear-rgb-clamp-per-channel-explicit-saturation", sourcePayloadMutationAllowed: false, sourceBandViewMutationAllowed: false, cinematicBufferShared: false },
      boundary: "sparse-authority-fixed-band-visualization-not-dense-transfer-map",
    } as KerrScienceBandRasterV321;
    const integrity = {
      version: "v321-kerr-science-band-raster-integrity-v1",
      payloadBefore: baseSnapshot,
      payloadAfter: baseSnapshot,
      payloadUnchanged: true,
      bandViewDigestBeforeSha256: "b".repeat(64),
      bandViewDigestAfterSha256: "b".repeat(64),
      bandViewUnchanged: true,
      bandArtifactSha256: "e2bd5957a1dd53a0942d5f7cd519d7b1dd84af1db7f476eb0f9dda0a65c5a460",
      rasterDigestSha256: "c".repeat(64),
      rasterBufferDisjoint: true,
      cinematicBufferShared: false,
      denseBoundary: "sparse-authority-dense-incomplete",
    } as KerrScienceBandRasterIntegrityV321;
    publishKerrScienceBandRasterTelemetryV321(raster, integrity);
    expect(getAtlasStrongGravityTelemetrySnapshotV309()).toMatchObject({
      scienceRasterVersion: "v321-kerr-fixed-band-sparse-science-raster-v1",
      scienceBandArtifactSha256: integrity.bandArtifactSha256,
      scienceBandViewDigestSha256: "b".repeat(64),
      scienceBandViewUnchanged: true,
      scienceBandCount: 3,
      scienceBandSaturationCount: 0,
      scienceBandNormalization: "fixed-physical-reference-no-data-adaptive-rescale",
      scienceCinematicBufferShared: false,
    });
  });

  it("records each scope once even when React cleanup repeats", () => {
    const scope = createAtlasResourceScopeV308("v309-scope-fixture");
    scope.add("texture", () => undefined);
    scope.add("payload", () => undefined);
    releaseAtlasResourceScopeV309(scope, "v309-scope-fixture", "effect-cleanup");
    releaseAtlasResourceScopeV309(scope, "v309-scope-fixture", "cleanup-replay");
    expect(getAtlasStrongGravityTelemetrySnapshotV309()).toMatchObject({
      scopeReleaseCount: 1,
      releasedResourceCount: 2,
      scopeFailureCount: 0,
      lastScopeLabel: "v309-scope-fixture",
      lastScopeReason: "effect-cleanup",
      revision: 1,
    });
  });

  it("includes resources released early by a one-shot Worker completion", () => {
    const scope = createAtlasResourceScopeV308("v309-worker-fixture");
    const releaseWorker = scope.add("worker", () => undefined);
    scope.add("texture", () => undefined);
    releaseWorker();
    const report = releaseAtlasResourceScopeV309(scope, "v309-worker-fixture", "effect-cleanup");
    expect(report.releasedCount).toBe(1);
    expect(getAtlasStrongGravityTelemetrySnapshotV309()).toMatchObject({ scopeReleaseCount: 1, releasedResourceCount: 2 });
  });

  it("surfaces finalizer failures while preserving complete rollback", () => {
    let released = false;
    const scope = createAtlasResourceScopeV308("v309-failure-fixture");
    scope.add("survivor", () => { released = true; });
    scope.add("broken", () => { throw new Error("dispose-failed"); });
    const report = releaseAtlasResourceScopeV309(scope, "v309-failure-fixture", "materialization-failed");
    expect(released).toBe(true);
    expect(report).toMatchObject({ releasedCount: 2, failures: [{ label: "broken", message: "dispose-failed" }] });
    expect(getAtlasStrongGravityTelemetrySnapshotV309()).toMatchObject({ scopeReleaseCount: 1, releasedResourceCount: 2, scopeFailureCount: 1 });
  });

  it("records resource-registry baseline and exact return digest", () => {
    const scope = createAtlasResourceScopeV308("v317-baseline-fixture");
    const baseline = registerAtlasResourceScopeBaselineV317(scope);
    scope.add("tracked-cache", acquireAtlasResource("typed-array-cache", "kerr", "v317-baseline-fixture", { owner: "v317-test", estimatedBytes: 32 }));
    releaseAtlasResourceScopeV309(scope, "v317-baseline-fixture", "effect-cleanup");
    expect(getAtlasStrongGravityTelemetrySnapshotV309()).toMatchObject({
      lifecycleBaselineDigest: baseline,
      lifecycleReturnDigest: baseline,
      lifecycleReturnedToBaseline: true,
    });
  });

  it("keeps the telemetry registry independent of React", () => {
    const source = readFileSync(resolve(process.cwd(), "app/lib/atlasStrongGravityTelemetryV309.ts"), "utf8");
    expect(source).not.toMatch(/from ["']react["']/);
    expect(source).toContain("new WeakSet<AtlasResourceScopeV308>()");
    expect(source).toContain("listeners = new Set<() => void>()");
  });
});
