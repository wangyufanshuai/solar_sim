import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  ATLAS_VISUAL_PROFILE_CANDIDATE_V370,
  ATLAS_VISUAL_PROFILE_CANDIDATE_V377,
  resolveAtlasInitialVisualProfileV299,
  resolveAtlasVisualProfileV299,
} from "./atlasVisualProfileV299";

const digest = (value: unknown) =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex");

describe("Science Cinematic V11 Measurement Lab", () => {
  it("freezes V10 and exposes stable V11 measurement tokens", () => {
    const v10 = resolveAtlasVisualProfileV299(ATLAS_VISUAL_PROFILE_CANDIDATE_V370);
    const v11 = resolveAtlasVisualProfileV299(ATLAS_VISUAL_PROFILE_CANDIDATE_V377);

    expect(digest(v10)).toBe(
      "a09915bed5280a76afbc4ee2398e28f3cc12b2a2956dbbd835c632df5c74a022",
    );
    expect(digest(v11)).toBe(
      "8e8ac9dd5d1bd7a8446349211d90ac311b27755c01edf03aa97aab904d30ea9c",
    );
    expect(v11).not.toBe(v10);
    expect(resolveAtlasVisualProfileV299(ATLAS_VISUAL_PROFILE_CANDIDATE_V377)).toBe(v11);
    expect(v11).toMatchObject({
      id: "science-cinematic-v11-v377",
      v10TokensApplied: false,
      v11TokensApplied: true,
      defaultApplied: false,
      localShadowDefaultEligible: false,
      scienceBufferIsolation: "immutable-ray-payload",
      cinematicDecoration: "seeded-only",
    });
    expect(v11.runtimeTokens.hud.measurementLabV11).toEqual({
      panelOpacity: 0.94,
      metrologyGridOpacity: 0.26,
      electronColumnOpacity: 0.7,
      uncertaintyHaloOpacity: 0.38,
      shaRailOpacity: 0.56,
      authorityGateLuminance: 0.92,
      unavailableScanOpacity: 0.64,
      detailSeed: 377,
    });
    expect(v11.runtimeTokens.strongGravityV11).toMatchObject({
      scienceExposure: 1,
      scienceBloom: 0,
      scienceNoise: 0,
      diskDetailSeed: 377,
      varianceLayerOpacity: 0.62,
    });
  });

  it("keeps Legacy V9 default and V11 local-shadow manual-only", () => {
    expect(resolveAtlasInitialVisualProfileV299({ build: "formal" })).toMatchObject({
      profile: "legacy-v9",
      v11MeasurementLabManualAbAvailable: false,
      localShadowDefaultApplied: false,
    });
    expect(resolveAtlasInitialVisualProfileV299({ build: "standalone-full" })).toMatchObject({
      profile: "legacy-v9",
      v11MeasurementLabManualAbAvailable: false,
      localShadowDefaultApplied: false,
    });
    expect(resolveAtlasInitialVisualProfileV299({ build: "vercel-lite" })).toMatchObject({
      profile: "legacy-v9",
      v11MeasurementLabManualAbAvailable: false,
      localShadowDefaultApplied: false,
    });
    expect(resolveAtlasInitialVisualProfileV299({ build: "local-shadow" })).toMatchObject({
      profile: "legacy-v9",
      v11MeasurementLabManualAbAvailable: true,
      localShadowDefaultApplied: false,
    });

    const control = readFileSync("app/components/AtlasVisualABControlV261.tsx", "utf8");
    expect(control).toContain("V11 Measurement Lab · Shadow");
    expect(control).toContain('data-atlas-v11-measurement-lab-default-applied="false"');
    expect(control).toContain("id !== ATLAS_VISUAL_PROFILE_CANDIDATE_V377 || localShadow");
    expect(control).toContain("Local visual A/B: Legacy, V1-V12 and V12 Observation Hub Shadow");
  });

  it("keeps decorative presentation separate from immutable Science payloads", () => {
    const surface = readFileSync("app/components/MeasurementLabSurfaceV377.tsx", "utf8");
    expect(surface).toContain('data-atlas-v377-science-display="identity-linear-float64"');
    expect(surface).toContain('data-atlas-v377-science-buffer-mutation="false"');
    expect(surface).toContain('data-atlas-v377-cinematic-buffer-mutation="false"');
    expect(surface).toContain("decorative scan / no pixel payload");
    expect(surface).not.toContain("Math.random");
    expect(surface).not.toContain("\uFFFD");
    expect(surface).not.toContain("<canvas");
  });
});
