import type { AtlasScaleBand } from "./atlasRuntimeStateV256";
import { atlasScaleBandOpacityV268, type AtlasScaleJourneyV268 } from "./atlasScaleJourneyV268";

export const ATLAS_SCALE_PRESENTATION_VERSION_V273 = "v273-five-band-presentation-v1" as const;

export type AtlasScaleLayerV273 = AtlasScaleBand;
export type AtlasScaleLayerSnapshotV273 = {
  version: typeof ATLAS_SCALE_PRESENTATION_VERSION_V273;
  current: AtlasScaleBand;
  journeyRequestId: number;
  opacities: Readonly<Record<AtlasScaleLayerV273, number>>;
};

export const ATLAS_SCALE_ORBIT_LIMITS_V273: Readonly<Record<AtlasScaleBand, { minDistance: number; maxDistance: number }>> = {
  solar: { minDistance: 0.05, maxDistance: 2_400 },
  stellar: { minDistance: 80, maxDistance: 2_400 },
  galactic: { minDistance: 500, maxDistance: 6_000 },
  "local-group": { minDistance: 2_000, maxDistance: 12_000 },
  "near-universe": { minDistance: 4_000, maxDistance: 20_000 },
};

export function atlasScaleLayerOpacityV273(
  layer: AtlasScaleLayerV273,
  current: AtlasScaleBand,
  journey: AtlasScaleJourneyV268,
): number {
  return atlasScaleBandOpacityV268(layer, current, journey);
}

export function createAtlasScaleLayerSnapshotV273(
  current: AtlasScaleBand,
  journey: AtlasScaleJourneyV268,
): AtlasScaleLayerSnapshotV273 {
  return {
    version: ATLAS_SCALE_PRESENTATION_VERSION_V273,
    current,
    journeyRequestId: journey.requestId,
    opacities: {
      solar: atlasScaleLayerOpacityV273("solar", current, journey),
      stellar: atlasScaleLayerOpacityV273("stellar", current, journey),
      galactic: atlasScaleLayerOpacityV273("galactic", current, journey),
      "local-group": atlasScaleLayerOpacityV273("local-group", current, journey),
      "near-universe": atlasScaleLayerOpacityV273("near-universe", current, journey),
    },
  };
}
