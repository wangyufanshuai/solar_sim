import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getAtlasResourceSnapshot } from "./atlasResourceLifecycle";
import { resetKerrThinDiskBandClientV321ForTests } from "./kerrThinDiskBandClientV321";
import {
  getKerrScienceObservatorySnapshotV329,
  resetKerrScienceObservatoryStoreV329ForTests,
  retainKerrScienceObservatoryV329,
  subscribeKerrScienceObservatoryV329,
} from "./kerrScienceObservatoryStoreV329";

const view = JSON.parse(readFileSync(resolve(process.cwd(), "dist/science/kerr-thin-disk-v320/fixed-band-imaging.json"), "utf8")).view;

function waitForReady(): Promise<void> {
  if (getKerrScienceObservatorySnapshotV329().status === "ready") return Promise.resolve();
  return new Promise((resolveReady, reject) => {
    const timeout = setTimeout(() => { unsubscribe(); reject(new Error("v329-store-ready-timeout")); }, 2_000);
    const unsubscribe = subscribeKerrScienceObservatoryV329(() => {
      if (getKerrScienceObservatorySnapshotV329().status !== "ready") return;
      clearTimeout(timeout);
      unsubscribe();
      resolveReady();
    });
  });
}

afterEach(() => {
  resetKerrScienceObservatoryStoreV329ForTests();
  resetKerrThinDiskBandClientV321ForTests();
  vi.unstubAllGlobals();
});

describe("v329 Science observatory single-flight store", () => {
  it("loads and derives once for three consumers, then returns all resources and models to baseline", async () => {
    const baseline = getAtlasResourceSnapshot();
    const fetchMock = vi.fn(async () => new Response(JSON.stringify(view), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const releaseFirst = retainKerrScienceObservatoryV329();
    const releaseSecond = retainKerrScienceObservatoryV329();
    const releaseThird = retainKerrScienceObservatoryV329();
    await waitForReady();
    const ready = getKerrScienceObservatorySnapshotV329();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(ready).toMatchObject({ status: "ready", consumerCount: 3, acquisitionCount: 1, derivationCount: 1 });
    expect(ready.uncertainty?.counts.bandMeasurementCount).toBe(12);
    expect(ready.provenance?.rows).toHaveLength(12);
    expect(ready.cinematicAB?.swatches).toHaveLength(4);
    expect(ready.photonBands?.counts.bandMeasurementCount).toBe(12);
    expect(getAtlasResourceSnapshot().typedArrayCaches).toBe(baseline.typedArrayCaches + 1);
    releaseFirst();
    releaseSecond();
    expect(getKerrScienceObservatorySnapshotV329()).toMatchObject({ status: "ready", consumerCount: 1 });
    releaseThird();
    releaseThird();
    expect(getKerrScienceObservatorySnapshotV329()).toMatchObject({ status: "idle", consumerCount: 0, uncertainty: null, provenance: null, cinematicAB: null, photonBands: null });
    expect(getAtlasResourceSnapshot()).toMatchObject({ total: baseline.total, typedArrayCaches: baseline.typedArrayCaches, estimatedBytes: baseline.estimatedBytes });
  });
});
