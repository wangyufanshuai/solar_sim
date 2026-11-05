import { createKerrInstrumentLabSnapshotV362, type KerrInstrumentLabSnapshotV362 } from "./kerrInstrumentLabV362";
import { loadDetectorCalibrationInspectV361 } from "./detectorCalibrationAdmissionServerV361";
import { loadKerrDetectorBreakEvenV360 } from "./kerrDetectorBreakEvenServerV360";
import { loadKerrObservablePhotonUncertaintyV358 } from "./kerrObservablePhotonUncertaintyServerV358";
import { loadKerrPhotonCountingNoiseBudgetV359 } from "./kerrPhotonCountingNoiseBudgetServerV359";
import { loadKerrSpectralConfidenceScaleV357 } from "./kerrSpectralConfidenceScaleServerV357";
import { loadKerrSpectralEnvelopeV356 } from "./kerrSpectralEnvelopeServerV356";

let cache: Promise<KerrInstrumentLabSnapshotV362> | null = null;

export async function loadKerrInstrumentLabSnapshotV362(root = process.cwd()): Promise<KerrInstrumentLabSnapshotV362> {
  if (!cache) cache = Promise.all([
    loadKerrSpectralEnvelopeV356(root),
    loadKerrSpectralConfidenceScaleV357(root),
    loadKerrObservablePhotonUncertaintyV358(root),
    loadKerrPhotonCountingNoiseBudgetV359(root),
    loadKerrDetectorBreakEvenV360(root),
    loadDetectorCalibrationInspectV361(root),
  ]).then(([v356, v357, v358, v359, v360, v361]) => createKerrInstrumentLabSnapshotV362({ v356, v357, v358, v359, v360, v361 }));
  try {
    return await cache;
  } catch (error) {
    cache = null;
    throw error;
  }
}

export function resetKerrInstrumentLabServerV362CacheForTests(): void {
  cache = null;
}
