import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getAtlasResourceSnapshot } from "./atlasResourceLifecycle";
import { acquireKerrSciencePayloadV299 } from "./kerrSciencePayloadClientV299";
import {
  createKerrCanonicalRayViewV315,
  createKerrScienceGeometrySourceViewV315,
  createKerrSciencePolarizationSourceViewV315,
} from "./kerrSciencePayloadV315";

const geometry = createKerrScienceGeometrySourceViewV315(JSON.parse(readFileSync(resolve(process.cwd(), "dist/science/kerr-reference-v312/geometry-redshift-tolerance-short-gate.json"), "utf8")));
const polarization = createKerrSciencePolarizationSourceViewV315(JSON.parse(readFileSync(resolve(process.cwd(), "dist/science/kerr-reference-v313/polarization-short-gate.json"), "utf8")));
const canonicalRayView = createKerrCanonicalRayViewV315(JSON.parse(readFileSync(resolve(process.cwd(), "dist/science/kerr-campaign-v314/ray-plan.json"), "utf8")));

function artifactDocument(input: string | URL | Request): unknown {
  const value = String(input);
  return value.includes("v315-corrected-geometry-source")
    ? geometry
    : value.includes("v315-corrected-polarization-source")
      ? polarization
      : canonicalRayView;
}

function artifactResponse(input: string | URL | Request): Response {
  return {
    ok: true,
    json: async () => structuredClone(artifactDocument(input)),
  } as Response;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("v299 science payload client isolation", () => {
  it("isolates writable TypedArrays between consumers and releases every registry entry", async () => {
    const baseline = getAtlasResourceSnapshot();
    vi.stubGlobal("fetch", vi.fn(async (input: string | URL | Request) => artifactResponse(input)));

    const first = await acquireKerrSciencePayloadV299();
    const second = await acquireKerrSciencePayloadV299();
    try {
      expect(first.payload).toMatchObject({
        authorityKind: "v312-v313-short-gate-sparse",
        errorBudgetVersion: "v315-sparse-release-residual-budget-v1",
        denseCampaignComplete: false,
        denseAggregateSha256: null,
      });
      expect(first.payload.classification).not.toBe(second.payload.classification);
      const authoritativeValue = second.payload.classification[0];
      first.payload.classification[0] = authoritativeValue === 1 ? 3 : 1;
      expect(second.payload.classification[0]).toBe(authoritativeValue);
      expect(getAtlasResourceSnapshot().typedArrayCaches - baseline.typedArrayCaches).toBe(3);
    } finally {
      first.release();
      second.release();
    }
    expect(getAtlasResourceSnapshot()).toMatchObject({
      total: baseline.total,
      typedArrayCaches: baseline.typedArrayCaches,
      estimatedBytes: baseline.estimatedBytes,
      estimatedGpuBytes: baseline.estimatedGpuBytes,
    });
  });

  it("allows one pending consumer to cancel without aborting another", async () => {
    const baseline = getAtlasResourceSnapshot();
    let releaseNetwork: () => void = () => undefined;
    const networkGate = new Promise<void>((resolve) => { releaseNetwork = resolve; });
    const internalSignals: AbortSignal[] = [];
    vi.stubGlobal("fetch", vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const signal = init?.signal;
      if (signal) internalSignals.push(signal);
      await networkGate;
      if (signal?.aborted) throw new DOMException("aborted", "AbortError");
      return artifactResponse(input);
    }));
    const firstController = new AbortController();
    const secondController = new AbortController();
    const firstPromise = acquireKerrSciencePayloadV299({ signal: firstController.signal });
    const secondPromise = acquireKerrSciencePayloadV299({ signal: secondController.signal });
    firstController.abort();
    releaseNetwork();
    await expect(firstPromise).rejects.toMatchObject({ name: "AbortError" });
    const second = await secondPromise;
    expect(internalSignals).toHaveLength(3);
    expect(internalSignals.every((signal) => !signal.aborted)).toBe(true);
    second.release();
    expect(getAtlasResourceSnapshot()).toMatchObject({
      total: baseline.total,
      typedArrayCaches: baseline.typedArrayCaches,
      estimatedBytes: baseline.estimatedBytes,
    });
  });

  it("aborts the shared fetch when the only pending consumer disappears and can recover", async () => {
    const baseline = getAtlasResourceSnapshot();
    const internalSignals: AbortSignal[] = [];
    vi.stubGlobal("fetch", vi.fn((_: string | URL | Request, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
      const signal = init?.signal;
      if (signal) {
        internalSignals.push(signal);
        signal.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")), { once: true });
      }
    })));
    const controller = new AbortController();
    const cancelled = acquireKerrSciencePayloadV299({ signal: controller.signal });
    controller.abort();
    await expect(cancelled).rejects.toMatchObject({ name: "AbortError" });
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(internalSignals).toHaveLength(3);
    expect(internalSignals.every((signal) => signal.aborted)).toBe(true);
    expect(getAtlasResourceSnapshot()).toMatchObject({
      total: baseline.total,
      typedArrayCaches: baseline.typedArrayCaches,
      estimatedBytes: baseline.estimatedBytes,
    });

    vi.stubGlobal("fetch", vi.fn(async (input: string | URL | Request) => artifactResponse(input)));
    const recovered = await acquireKerrSciencePayloadV299();
    recovered.release();
    expect(getAtlasResourceSnapshot().total).toBe(baseline.total);
  });
});
