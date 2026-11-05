"use client";

import { useLayoutEffect } from "react";

type AtlasWorkerConstructorV592 = typeof Worker;

const V591_STARFIELD_WORKER = /celestialStarfieldV591/i;

function workerUrlV592(value: string | URL): string {
  return value instanceof URL ? value.href : String(value);
}

function suppressedV591StarfieldWorkerV592(): Worker {
  class SuppressedWorkerV592 extends EventTarget {
    onerror: ((this: AbstractWorker, event: ErrorEvent) => unknown) | null = null;
    onmessage: ((this: Worker, event: MessageEvent) => unknown) | null = null;
    onmessageerror: ((this: Worker, event: MessageEvent) => unknown) | null = null;

    postMessage(message: unknown): void {
      const value = message && typeof message === "object" ? message as Record<string, unknown> : {};
      const requestId = Number(value.requestId ?? 0);
      const status = value.type === "release" ? "released" : "blocked";
      queueMicrotask(() => {
        const event = new MessageEvent("message", { data: {
          type: "snapshot",
          requestId,
          status,
          catalogVersion: "superseded-by-v592-living-starfield",
          recordCount: 0,
          layerCounts: { faint: 0, catalog: 0, brightPsf: 0 },
          anchorCount: 0,
          rangeRequests: 0,
          transferredBytes: 0,
          view: value.view ?? { raDeg: 0, decDeg: 0, fovDeg: 82 },
          reason: "superseded-by-additive-v592-direct-gaia-lane",
        } });
        this.dispatchEvent(event);
        this.onmessage?.call(this as unknown as Worker, event);
      });
    }

    terminate(): void {}
  }
  return new SuppressedWorkerV592() as unknown as Worker;
}

/**
 * The frozen v591 worker intentionally selects its content-pack endpoint for
 * standalone-full. Next 16's current webpack/WASM runner cannot compile the
 * frozen Node range route, while the additive v592 worker owns the SHA-locked
 * direct Gaia lane. The inherited worker is replaced with a no-I/O status
 * adapter so it cannot double-load or double-render the same catalog.
 */
export default function CelestialWorkerPolicyBridgeV592() {
  useLayoutEffect(() => {
    const NativeWorker = window.Worker;
    const PolicyWorker = function WorkerV592(
      this: Worker,
      scriptURL: string | URL,
      options?: WorkerOptions,
    ): Worker {
      const url = workerUrlV592(scriptURL);
      if (!V591_STARFIELD_WORKER.test(url)) return new NativeWorker(scriptURL, options);
      const root = document.querySelector<HTMLElement>("section[data-atlas-v592-candidate]");
      if (root) {
        root.dataset.atlasV592GaiaWorkerPolicy = "v591-worker-superseded-no-io-by-v592";
        root.dataset.atlasV592GaiaFullLane = "v592-direct-gaia-bootstrap-supplement-pending";
      }
      return suppressedV591StarfieldWorkerV592();
    } as unknown as AtlasWorkerConstructorV592;
    PolicyWorker.prototype = NativeWorker.prototype;
    Object.setPrototypeOf(PolicyWorker, NativeWorker);
    window.Worker = PolicyWorker;
    return () => {
      if (window.Worker === PolicyWorker) window.Worker = NativeWorker;
    };
  }, []);
  return null;
}
