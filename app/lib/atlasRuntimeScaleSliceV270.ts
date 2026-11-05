import type { AtlasScaleBand } from "./atlasRuntimeStateV256";
import {
  advanceAtlasScaleJourneyV268,
  atlasScaleObjectAvailabilityV273,
  createAtlasScaleJourneyV268,
  createIdleAtlasScaleJourneyV268,
  type AtlasScaleJourneyV268,
} from "./atlasScaleJourneyV268";

export const ATLAS_RUNTIME_SCALE_SLICE_VERSION = "v270-runtime-scale-slice-v1" as const;

type AtlasRuntimeScaleSliceStateV270 = {
  scaleBand: AtlasScaleBand;
  scaleJourney: AtlasScaleJourneyV268;
  selectedObjectId: string;
};

type AtlasRuntimeScaleSliceHostV270 = {
  getState: () => AtlasRuntimeScaleSliceStateV270;
  patchState: (patch: Partial<AtlasRuntimeScaleSliceStateV270>) => void;
};

export function createAtlasRuntimeScaleSliceV270(host: AtlasRuntimeScaleSliceHostV270) {
  const setScaleBand = (scaleBand: AtlasScaleBand): void => {
    const state = host.getState();
    host.patchState({
      scaleBand,
      scaleJourney: createIdleAtlasScaleJourneyV268(
        scaleBand,
        state.scaleJourney.requestId + 1,
        state.scaleJourney.returnPath,
        {
          selectedObjectId: state.selectedObjectId,
          positionStatus: atlasScaleObjectAvailabilityV273(state.selectedObjectId, scaleBand),
        },
      ),
    });
  };

  const requestScaleJourney = (
    target: AtlasScaleBand,
    nowMs = typeof performance === "undefined" ? Date.now() : performance.now(),
    reducedMotion = false,
  ): AtlasScaleJourneyV268 => {
    const state = host.getState();
    const journey = createAtlasScaleJourneyV268({
      requestId: state.scaleJourney.requestId + 1,
      from: state.scaleBand,
      to: target,
      selectedObjectId: state.selectedObjectId,
      returnPath: state.scaleJourney.returnPath,
      requestedAtMs: nowMs,
      reducedMotion,
    });
    if (journey.lifecycle !== "idle") host.patchState({ scaleJourney: journey });
    return journey;
  };

  const completeScaleJourneyStep = (requestId: number, nowMs: number): void => {
    const state = host.getState();
    const journey = state.scaleJourney;
    if (journey.lifecycle !== "transition" || journey.requestId !== requestId) return;
    host.patchState({ scaleBand: journey.to, scaleJourney: advanceAtlasScaleJourneyV268(journey, nowMs) });
  };

  const cancelScaleJourney = (requestId?: number): void => {
    const state = host.getState();
    if (requestId !== undefined && state.scaleJourney.requestId !== requestId) return;
    host.patchState({
      scaleJourney: createIdleAtlasScaleJourneyV268(
        state.scaleBand,
        state.scaleJourney.requestId + 1,
        state.scaleJourney.returnPath,
        {
          selectedObjectId: state.scaleJourney.selectedObjectId || state.selectedObjectId,
          positionStatus: atlasScaleObjectAvailabilityV273(state.scaleJourney.selectedObjectId || state.selectedObjectId, state.scaleBand),
        },
      ),
    });
  };

  return { setScaleBand, requestScaleJourney, completeScaleJourneyStep, cancelScaleJourney };
}
