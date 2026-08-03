import type { AtlasVisualRendererProfileV299 } from "./atlasVisualProfileV299";
import type { AtlasStrongGravityTelemetrySnapshotV309 } from "./atlasStrongGravityTelemetryV309";

export const KERR_SCIENCE_BAND_HUD_VERSION_V322 = "v322-kerr-science-band-hud-v1" as const;

export type KerrScienceBandHudModelV322 = Readonly<{
  version: typeof KERR_SCIENCE_BAND_HUD_VERSION_V322;
  status: "ready" | "pending-authority" | "hidden-cinematic";
  mode: "science" | "cinematic";
  profileId: AtlasVisualRendererProfileV299["id"];
  tokenSource: "v7" | "v6" | "v5" | "legacy";
  displayTransform: "linear-no-grade" | "unavailable";
  rasterVersion: string;
  diskRayCount: number;
  bandCount: number;
  saturationCount: number;
  normalization: "fixed-physical-reference-no-data-adaptive-rescale" | "unavailable";
  payloadDigestSha256: string | null;
  bandArtifactSha256: string | null;
  bandViewDigestSha256: string | null;
  payloadUnchanged: boolean | null;
  bandViewUnchanged: boolean | null;
  buffersDisjoint: boolean | null;
  cinematicBufferShared: boolean | null;
  denseBoundary: "sparse-authority-dense-incomplete" | "unavailable";
  boundary: "measurement-hud-read-only-telemetry-no-science-mutation";
}>;

const SHA256 = /^[a-f0-9]{64}$/;

export function createKerrScienceBandHudModelV322(
  telemetry: AtlasStrongGravityTelemetrySnapshotV309,
  profile: AtlasVisualRendererProfileV299,
  mode: "science" | "cinematic",
): KerrScienceBandHudModelV322 {
  const tokenSource = profile.runtimeTokens.strongGravityV7 ? "v7"
    : profile.runtimeTokens.strongGravityV6 ? "v6"
      : profile.runtimeTokens.strongGravityV5 ? "v5" : "legacy";
  const displayTransform = profile.runtimeTokens.strongGravity.scienceDisplayTransform === "linear-no-grade"
    ? "linear-no-grade" : "unavailable";
  const scienceReady = mode === "science"
    && telemetry.scienceRasterVersion === "v321-kerr-fixed-band-sparse-science-raster-v1"
    && telemetry.scienceBandCount === 3
    && telemetry.scienceBandViewUnchanged === true
    && telemetry.sciencePayloadUnchanged === true
    && telemetry.scienceBuffersDisjoint === true
    && telemetry.scienceCinematicBufferShared === false
    && telemetry.scienceDenseBoundary === "sparse-authority-dense-incomplete"
    && telemetry.scienceBandNormalization === "fixed-physical-reference-no-data-adaptive-rescale"
    && SHA256.test(telemetry.scienceBandArtifactSha256 ?? "")
    && SHA256.test(telemetry.scienceBandViewDigestSha256 ?? "")
    && displayTransform === "linear-no-grade";
  return Object.freeze({
    version: KERR_SCIENCE_BAND_HUD_VERSION_V322,
    status: mode === "cinematic" ? "hidden-cinematic" : scienceReady ? "ready" : "pending-authority",
    mode,
    profileId: profile.id,
    tokenSource,
    displayTransform,
    rasterVersion: telemetry.scienceRasterVersion ?? "unavailable",
    diskRayCount: telemetry.scienceRasterVersion === "v321-kerr-fixed-band-sparse-science-raster-v1" ? 4 : 0,
    bandCount: Math.max(0, Math.min(3, telemetry.scienceBandCount)),
    saturationCount: Math.max(0, Math.min(12, telemetry.scienceBandSaturationCount)),
    normalization: telemetry.scienceBandNormalization === "fixed-physical-reference-no-data-adaptive-rescale"
      ? telemetry.scienceBandNormalization : "unavailable",
    payloadDigestSha256: telemetry.sciencePayloadDigestSha256,
    bandArtifactSha256: telemetry.scienceBandArtifactSha256,
    bandViewDigestSha256: telemetry.scienceBandViewDigestSha256,
    payloadUnchanged: telemetry.sciencePayloadUnchanged,
    bandViewUnchanged: telemetry.scienceBandViewUnchanged,
    buffersDisjoint: telemetry.scienceBuffersDisjoint,
    cinematicBufferShared: telemetry.scienceCinematicBufferShared,
    denseBoundary: telemetry.scienceDenseBoundary === "sparse-authority-dense-incomplete"
      ? telemetry.scienceDenseBoundary : "unavailable",
    boundary: "measurement-hud-read-only-telemetry-no-science-mutation",
  });
}
