import { getAtlasResourceSnapshot } from "./atlasResourceLifecycle";
import type { AtlasResourceScopeReleaseReportV308, AtlasResourceScopeV308 } from "./atlasResourceScopeV308";
import type { KerrScienceBufferIntegrityV317 } from "./kerrScienceBufferIntegrityV317";
import type { KerrScienceRasterV307 } from "./kerrScienceRasterV307";
import type { KerrScienceBandRasterIntegrityV321, KerrScienceBandRasterV321 } from "./kerrScienceBandRasterV321";

export const ATLAS_STRONG_GRAVITY_TELEMETRY_VERSION_V309 = "v309-atlas-strong-gravity-telemetry" as const;

export type AtlasStrongGravityTelemetrySnapshotV309 = Readonly<{
  version: typeof ATLAS_STRONG_GRAVITY_TELEMETRY_VERSION_V309;
  scienceRasterVersion: string | null;
  scienceRasterBoundary: string | null;
  scienceRasterSampleCount: number;
  scienceRasterEvpaGlyphCount: number;
  scienceRasterImageOrderGlyphCount: number;
  sciencePayloadDigestSha256: string | null;
  scienceRasterDigestSha256: string | null;
  sciencePayloadUnchanged: boolean | null;
  scienceBuffersDisjoint: boolean | null;
  scienceDenseBoundary: string | null;
  scienceBandArtifactSha256: string | null;
  scienceBandViewDigestSha256: string | null;
  scienceBandViewUnchanged: boolean | null;
  scienceBandCount: number;
  scienceBandSaturationCount: number;
  scienceBandNormalization: string | null;
  scienceCinematicBufferShared: boolean | null;
  interactiveAuthoritySha256: string | null;
  interactiveBuffersDisjoint: boolean | null;
  scopeReleaseCount: number;
  releasedResourceCount: number;
  scopeFailureCount: number;
  lastScopeLabel: string | null;
  lastScopeReason: string | null;
  lifecycleBaselineDigest: string | null;
  lifecycleReturnDigest: string | null;
  lifecycleReturnedToBaseline: boolean | null;
  revision: number;
}>;

const listeners = new Set<() => void>();
let reportedScopes = new WeakSet<AtlasResourceScopeV308>();
let scopeBaselines = new WeakMap<AtlasResourceScopeV308, string>();
let snapshot: AtlasStrongGravityTelemetrySnapshotV309 = Object.freeze({
  version: ATLAS_STRONG_GRAVITY_TELEMETRY_VERSION_V309,
  scienceRasterVersion: null,
  scienceRasterBoundary: null,
  scienceRasterSampleCount: 0,
  scienceRasterEvpaGlyphCount: 0,
  scienceRasterImageOrderGlyphCount: 0,
  sciencePayloadDigestSha256: null,
  scienceRasterDigestSha256: null,
  sciencePayloadUnchanged: null,
  scienceBuffersDisjoint: null,
  scienceDenseBoundary: null,
  scienceBandArtifactSha256: null,
  scienceBandViewDigestSha256: null,
  scienceBandViewUnchanged: null,
  scienceBandCount: 0,
  scienceBandSaturationCount: 0,
  scienceBandNormalization: null,
  scienceCinematicBufferShared: null,
  interactiveAuthoritySha256: null,
  interactiveBuffersDisjoint: null,
  scopeReleaseCount: 0,
  releasedResourceCount: 0,
  scopeFailureCount: 0,
  lastScopeLabel: null,
  lastScopeReason: null,
  lifecycleBaselineDigest: null,
  lifecycleReturnDigest: null,
  lifecycleReturnedToBaseline: null,
  revision: 0,
});

const publish = (next: AtlasStrongGravityTelemetrySnapshotV309): void => {
  snapshot = Object.freeze(next);
  for (const listener of listeners) listener();
};

export function getAtlasStrongGravityTelemetrySnapshotV309(): AtlasStrongGravityTelemetrySnapshotV309 {
  return snapshot;
}

export function subscribeAtlasStrongGravityTelemetryV309(listener: () => void): () => void {
  listeners.add(listener);
  let active = true;
  return () => {
    if (!active) return;
    active = false;
    listeners.delete(listener);
  };
}

export function registerAtlasResourceScopeBaselineV317(scope: AtlasResourceScopeV308): string {
  const digest = getAtlasResourceSnapshot().identityDigest;
  scopeBaselines.set(scope, digest);
  return digest;
}

export function publishKerrScienceRasterTelemetryV309(
  raster: KerrScienceRasterV307,
  integrity?: KerrScienceBufferIntegrityV317,
): void {
  publish({
    ...snapshot,
    scienceRasterVersion: raster.version,
    scienceRasterBoundary: raster.boundary,
    scienceRasterSampleCount: raster.summary.sampleCount,
    scienceRasterEvpaGlyphCount: raster.summary.evpaGlyphCount,
    scienceRasterImageOrderGlyphCount: raster.summary.imageOrderGlyphCount,
    sciencePayloadDigestSha256: integrity?.after.digestSha256 ?? snapshot.sciencePayloadDigestSha256,
    scienceRasterDigestSha256: integrity?.rasterDigestSha256 ?? snapshot.scienceRasterDigestSha256,
    sciencePayloadUnchanged: integrity?.sourcePayloadUnchanged ?? snapshot.sciencePayloadUnchanged,
    scienceBuffersDisjoint: integrity?.rasterBufferDisjoint ?? snapshot.scienceBuffersDisjoint,
    scienceDenseBoundary: integrity?.denseBoundary ?? snapshot.scienceDenseBoundary,
    revision: snapshot.revision + 1,
  });
}

export function publishKerrScienceBandRasterTelemetryV321(
  raster: KerrScienceBandRasterV321,
  integrity: KerrScienceBandRasterIntegrityV321,
): void {
  publish({
    ...snapshot,
    scienceRasterVersion: raster.version,
    scienceRasterBoundary: raster.boundary,
    scienceRasterSampleCount: raster.summary.sampleCount,
    scienceRasterEvpaGlyphCount: raster.summary.evpaGlyphCount,
    scienceRasterImageOrderGlyphCount: raster.summary.imageOrderGlyphCount,
    sciencePayloadDigestSha256: integrity.payloadAfter.digestSha256,
    scienceRasterDigestSha256: integrity.rasterDigestSha256,
    sciencePayloadUnchanged: integrity.payloadUnchanged,
    scienceBuffersDisjoint: integrity.rasterBufferDisjoint,
    scienceDenseBoundary: integrity.denseBoundary,
    scienceBandArtifactSha256: integrity.bandArtifactSha256,
    scienceBandViewDigestSha256: integrity.bandViewDigestAfterSha256,
    scienceBandViewUnchanged: integrity.bandViewUnchanged,
    scienceBandCount: raster.summary.fixedBandCount,
    scienceBandSaturationCount: raster.summary.saturatedChannelCount,
    scienceBandNormalization: raster.encoding.normalization,
    scienceCinematicBufferShared: integrity.cinematicBufferShared,
    revision: snapshot.revision + 1,
  });
}

export function publishKerrInteractiveBufferTelemetryV317(
  authoritySha256: string | null,
  buffersDisjoint: boolean | null,
): void {
  publish({
    ...snapshot,
    interactiveAuthoritySha256: authoritySha256,
    interactiveBuffersDisjoint: buffersDisjoint,
    revision: snapshot.revision + 1,
  });
}

export function releaseAtlasResourceScopeV309(
  scope: AtlasResourceScopeV308,
  scopeLabel: string,
  reason: string,
): AtlasResourceScopeReleaseReportV308 {
  const report = scope.releaseAll(reason);
  if (reportedScopes.has(scope)) return report;
  reportedScopes.add(scope);
  const scopeSnapshot = scope.snapshot();
  const baselineDigest = scopeBaselines.get(scope) ?? null;
  const returnDigest = getAtlasResourceSnapshot().identityDigest;
  publish({
    ...snapshot,
    scopeReleaseCount: snapshot.scopeReleaseCount + 1,
    releasedResourceCount: snapshot.releasedResourceCount + scopeSnapshot.releasedCount,
    scopeFailureCount: snapshot.scopeFailureCount + scopeSnapshot.failureCount,
    lastScopeLabel: scopeLabel.slice(0, 128),
    lastScopeReason: reason.slice(0, 128),
    lifecycleBaselineDigest: baselineDigest,
    lifecycleReturnDigest: returnDigest,
    lifecycleReturnedToBaseline: baselineDigest === null ? null : baselineDigest === returnDigest,
    revision: snapshot.revision + 1,
  });
  return report;
}

export function resetAtlasStrongGravityTelemetryV309ForTests(): void {
  reportedScopes = new WeakSet<AtlasResourceScopeV308>();
  scopeBaselines = new WeakMap<AtlasResourceScopeV308, string>();
  snapshot = Object.freeze({
    version: ATLAS_STRONG_GRAVITY_TELEMETRY_VERSION_V309,
    scienceRasterVersion: null,
    scienceRasterBoundary: null,
    scienceRasterSampleCount: 0,
    scienceRasterEvpaGlyphCount: 0,
    scienceRasterImageOrderGlyphCount: 0,
    sciencePayloadDigestSha256: null,
    scienceRasterDigestSha256: null,
    sciencePayloadUnchanged: null,
    scienceBuffersDisjoint: null,
    scienceDenseBoundary: null,
    scienceBandArtifactSha256: null,
    scienceBandViewDigestSha256: null,
    scienceBandViewUnchanged: null,
    scienceBandCount: 0,
    scienceBandSaturationCount: 0,
    scienceBandNormalization: null,
    scienceCinematicBufferShared: null,
    interactiveAuthoritySha256: null,
    interactiveBuffersDisjoint: null,
    scopeReleaseCount: 0,
    releasedResourceCount: 0,
    scopeFailureCount: 0,
    lastScopeLabel: null,
    lastScopeReason: null,
    lifecycleBaselineDigest: null,
    lifecycleReturnDigest: null,
    lifecycleReturnedToBaseline: null,
    revision: 0,
  });
}
