import { resolve } from "node:path";
import { Worker } from "node:worker_threads";
import type { GaiaResearchPayloadV271, GaiaResearchQueryV271 } from "./gaiaResearchWorkbenchV271";

export type GaiaResearchQueryResultV271 = {
  id: number;
  ok: true;
  payload: GaiaResearchPayloadV271;
  provenance: {
    manifestSha256: string;
    aggregateSha256: string;
    scienceSourceSha256: string;
    motherCatalogSha256: string;
    generatedAt: string;
  };
};

type WorkerFailure = { id: number; ok: false; error: string };
type WorkerResult = GaiaResearchQueryResultV271 | WorkerFailure;
type Pending = {
  resolve: (value: GaiaResearchQueryResultV271) => void;
  reject: (error: Error) => void;
  timeout: ReturnType<typeof setTimeout>;
};

export type GaiaResearchQueryServiceContractV271 = {
  query(query: GaiaResearchQueryV271, timeoutMs?: number): Promise<GaiaResearchQueryResultV271>;
};

class GaiaResearchQueryServiceV271 {
  readonly #worker: Worker;
  readonly #pending = new Map<number, Pending>();
  #nextId = 0;
  #failed = false;

  constructor() {
    const projectRoot = process.env.ATLAS_PROJECT_ROOT?.trim() || process.cwd();
    const workerRoot = process.env.ATLAS_SERVER_WORKER_ROOT?.trim() || resolve(projectRoot, "app/workers");
    this.#worker = new Worker(resolve(workerRoot, "gaiaResearchQuery.worker.mjs"), {
      name: "orbit-atlas-gaia-research-query-v271",
    });
    this.#worker.on("message", (message: WorkerResult) => {
      const pending = this.#pending.get(message.id);
      if (!pending) return;
      clearTimeout(pending.timeout);
      this.#pending.delete(message.id);
      if (message.ok) pending.resolve(message);
      else pending.reject(new Error(message.error));
    });
    const fail = () => {
      this.#failed = true;
      for (const pending of this.#pending.values()) {
        clearTimeout(pending.timeout);
        pending.reject(new Error("Gaia research query worker is unavailable"));
      }
      this.#pending.clear();
    };
    this.#worker.once("error", fail);
    this.#worker.once("exit", fail);
  }

  query(query: GaiaResearchQueryV271, timeoutMs = 5_000): Promise<GaiaResearchQueryResultV271> {
    if (this.#failed) return Promise.reject(new Error("Gaia research query worker is unavailable"));
    const id = ++this.#nextId;
    return new Promise((resolvePromise, reject) => {
      const timeout = setTimeout(() => {
        this.#pending.delete(id);
        reject(new Error("Gaia research query timed out"));
      }, timeoutMs);
      this.#pending.set(id, { resolve: resolvePromise, reject, timeout });
      this.#worker.postMessage({ id, query });
    });
  }

  async dispose(): Promise<void> {
    if (this.#failed) return;
    this.#failed = true;
    for (const pending of this.#pending.values()) {
      clearTimeout(pending.timeout);
      pending.reject(new Error("Gaia research query worker was disposed"));
    }
    this.#pending.clear();
    await this.#worker.terminate();
  }
}

const serviceSymbol = Symbol.for("orbit-atlas.gaia-research-query-service-v271");
type GlobalWithService = typeof globalThis & { [serviceSymbol]?: GaiaResearchQueryServiceV271 };

export function getGaiaResearchQueryServiceV271(): GaiaResearchQueryServiceContractV271 {
  const target = globalThis as GlobalWithService;
  target[serviceSymbol] ??= new GaiaResearchQueryServiceV271();
  return target[serviceSymbol];
}

export async function disposeGaiaResearchQueryServiceV271ForTests(): Promise<void> {
  const target = globalThis as GlobalWithService;
  const service = target[serviceSymbol];
  delete target[serviceSymbol];
  await service?.dispose();
}
