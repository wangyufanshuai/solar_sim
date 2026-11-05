"use client";

import { acquireKerrThinDiskBandViewV321 } from "./kerrThinDiskBandClientV321";
import { createKerrScienceBandUncertaintyViewV325, type KerrScienceBandUncertaintyViewV325 } from "./kerrScienceBandUncertaintyV325";
import { createKerrScienceBandUncertaintyProvenanceV326, type KerrScienceBandUncertaintyProvenanceV326 } from "./kerrScienceBandUncertaintyProvenanceV326";
import { createKerrScienceCinematicABViewV327, type KerrScienceCinematicABViewV327 } from "./kerrScienceCinematicABV327";
import { createKerrSciencePhotonBandViewV328, type KerrSciencePhotonBandViewV328 } from "./kerrSciencePhotonBandsV328";

export const KERR_SCIENCE_OBSERVATORY_STORE_VERSION_V329 = "v329-kerr-science-observatory-single-flight-store-v1" as const;

export type KerrScienceObservatorySnapshotV329 = Readonly<{
  version: typeof KERR_SCIENCE_OBSERVATORY_STORE_VERSION_V329;
  status: "idle" | "loading" | "ready" | "unavailable";
  consumerCount: number;
  acquisitionCount: number;
  derivationCount: number;
  revision: number;
  uncertainty: KerrScienceBandUncertaintyViewV325 | null;
  provenance: KerrScienceBandUncertaintyProvenanceV326 | null;
  cinematicAB: KerrScienceCinematicABViewV327 | null;
  photonBands: KerrSciencePhotonBandViewV328 | null;
  boundary: "single-v321-acquisition-bounded-derived-models-release-on-last-consumer";
}>;

type Listener = () => void;

let consumerCount = 0;
let acquisitionCount = 0;
let derivationCount = 0;
let revision = 0;
let generation = 0;
let loadController: AbortController | null = null;
let loadPromise: Promise<void> | null = null;
let releaseAcquiredView: (() => void) | null = null;
const listeners = new Set<Listener>();

function snapshot(
  status: KerrScienceObservatorySnapshotV329["status"],
  models: Pick<KerrScienceObservatorySnapshotV329, "uncertainty" | "provenance" | "cinematicAB" | "photonBands">,
): KerrScienceObservatorySnapshotV329 {
  return Object.freeze({
    version: KERR_SCIENCE_OBSERVATORY_STORE_VERSION_V329,
    status,
    consumerCount,
    acquisitionCount,
    derivationCount,
    revision,
    ...models,
    boundary: "single-v321-acquisition-bounded-derived-models-release-on-last-consumer",
  });
}

const EMPTY_MODELS = Object.freeze({ uncertainty: null, provenance: null, cinematicAB: null, photonBands: null });
let current = snapshot("idle", EMPTY_MODELS);

function publish(nextStatus: KerrScienceObservatorySnapshotV329["status"], models = {
  uncertainty: current.uncertainty,
  provenance: current.provenance,
  cinematicAB: current.cinematicAB,
  photonBands: current.photonBands,
}): void {
  revision += 1;
  current = snapshot(nextStatus, models);
  for (const listener of listeners) listener();
}

function resetToIdle(): void {
  loadController?.abort();
  loadController = null;
  loadPromise = null;
  releaseAcquiredView?.();
  releaseAcquiredView = null;
  publish("idle", EMPTY_MODELS);
}

function beginLoad(): void {
  if (loadPromise || current.status === "ready") return;
  const controller = new AbortController();
  const loadGeneration = generation;
  loadController = controller;
  acquisitionCount += 1;
  publish("loading", EMPTY_MODELS);
  loadPromise = acquireKerrThinDiskBandViewV321(controller.signal).then(async (acquired) => {
    if (controller.signal.aborted || loadGeneration !== generation || consumerCount === 0) {
      acquired.release();
      return;
    }
    releaseAcquiredView = acquired.release;
    const uncertainty = createKerrScienceBandUncertaintyViewV325(acquired.view);
    const cinematicAB = createKerrScienceCinematicABViewV327(acquired.view);
    const photonBands = createKerrSciencePhotonBandViewV328(acquired.view);
    const provenance = await createKerrScienceBandUncertaintyProvenanceV326(uncertainty);
    if (controller.signal.aborted || loadGeneration !== generation || consumerCount === 0) return;
    derivationCount += 1;
    publish("ready", { uncertainty, provenance, cinematicAB, photonBands });
  }).catch((error: unknown) => {
    if (controller.signal.aborted || error instanceof DOMException && error.name === "AbortError") return;
    releaseAcquiredView?.();
    releaseAcquiredView = null;
    publish("unavailable", EMPTY_MODELS);
  }).finally(() => {
    if (loadController === controller) loadController = null;
    loadPromise = null;
  });
}

export function getKerrScienceObservatorySnapshotV329(): KerrScienceObservatorySnapshotV329 {
  return current;
}

export function subscribeKerrScienceObservatoryV329(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function retainKerrScienceObservatoryV329(): () => void {
  consumerCount += 1;
  if (consumerCount === 1) beginLoad();
  else publish(current.status);
  let released = false;
  return () => {
    if (released) return;
    released = true;
    consumerCount = Math.max(0, consumerCount - 1);
    if (consumerCount === 0) {
      generation += 1;
      resetToIdle();
    } else {
      publish(current.status);
    }
  };
}

export function resetKerrScienceObservatoryStoreV329ForTests(): void {
  generation += 1;
  consumerCount = 0;
  acquisitionCount = 0;
  derivationCount = 0;
  revision = 0;
  loadController?.abort();
  loadController = null;
  loadPromise = null;
  releaseAcquiredView?.();
  releaseAcquiredView = null;
  current = snapshot("idle", EMPTY_MODELS);
  listeners.clear();
}
