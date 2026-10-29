import { resolve } from "node:path";
import { Worker } from "node:worker_threads";

export type GaiaScienceRecordQueryResultV275 = {
  row: Record<string, unknown> | null;
  sourceSha256: string;
  retrievedAt: string;
};

type WorkerMessage = ({ id: number; ok: true } & GaiaScienceRecordQueryResultV275)
  | { id: number; ok: false; error: string };
type Pending = {
  resolve: (result: GaiaScienceRecordQueryResultV275) => void;
  reject: (error: Error) => void;
  timeout: ReturnType<typeof setTimeout>;
};

export type GaiaScienceRecordQueryServiceContractV275 = {
  query(sourceId: string, timeoutMs?: number): Promise<GaiaScienceRecordQueryResultV275>;
};

class GaiaScienceRecordQueryServiceV275 {
  readonly #worker: Worker;
  readonly #pending = new Map<number, Pending>();
  #nextId = 0;
  #failed = false;

  constructor() {
    const projectRoot = process.env.ATLAS_PROJECT_ROOT?.trim() || process.cwd();
    const workerRoot = process.env.ATLAS_SERVER_WORKER_ROOT?.trim() || resolve(projectRoot, "app/workers");
    this.#worker = new Worker(resolve(workerRoot, "gaiaScienceRecordQuery.worker.mjs"), {
      name: "orbit-atlas-gaia-science-record-v275",
    });
    this.#worker.on("message", (message: WorkerMessage) => {
      const pending = this.#pending.get(message.id);
      if (!pending) return;
      clearTimeout(pending.timeout);
      this.#pending.delete(message.id);
      if (message.ok) pending.resolve({ row: message.row, sourceSha256: message.sourceSha256, retrievedAt: message.retrievedAt });
      else pending.reject(new Error("Frozen Gaia record worker is unavailable"));
    });
    const fail = () => {
      this.#failed = true;
      for (const pending of this.#pending.values()) {
        clearTimeout(pending.timeout);
        pending.reject(new Error("Frozen Gaia record worker is unavailable"));
      }
      this.#pending.clear();
    };
    this.#worker.once("error", fail);
    this.#worker.once("exit", fail);
  }

  query(sourceId: string, timeoutMs = 3_000): Promise<GaiaScienceRecordQueryResultV275> {
    if (this.#failed) return Promise.reject(new Error("Frozen Gaia record worker is unavailable"));
    const id = ++this.#nextId;
    return new Promise((resolvePromise, reject) => {
      const timeout = setTimeout(() => {
        this.#pending.delete(id);
        reject(new Error("Frozen Gaia record query timed out"));
      }, timeoutMs);
      this.#pending.set(id, { resolve: resolvePromise, reject, timeout });
      this.#worker.postMessage({ id, sourceId });
    });
  }

  async dispose(): Promise<void> {
    if (this.#failed) return;
    this.#failed = true;
    for (const pending of this.#pending.values()) {
      clearTimeout(pending.timeout);
      pending.reject(new Error("Frozen Gaia record worker was disposed"));
    }
    this.#pending.clear();
    await this.#worker.terminate();
  }
}

const serviceSymbol = Symbol.for("orbit-atlas.gaia-science-record-service-v275");
type GlobalWithService = typeof globalThis & { [serviceSymbol]?: GaiaScienceRecordQueryServiceV275 };

export function getGaiaScienceRecordQueryServiceV275(): GaiaScienceRecordQueryServiceContractV275 {
  const target = globalThis as GlobalWithService;
  target[serviceSymbol] ??= new GaiaScienceRecordQueryServiceV275();
  return target[serviceSymbol];
}

export async function disposeGaiaScienceRecordQueryServiceV275ForTests(): Promise<void> {
  const target = globalThis as GlobalWithService;
  const service = target[serviceSymbol];
  delete target[serviceSymbol];
  await service?.dispose();
}
