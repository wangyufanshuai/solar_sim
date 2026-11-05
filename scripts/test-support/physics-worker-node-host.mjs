// Execute the ACTUAL browser worker handler in a separate Node worker thread.
// This adapter provides only message transport, not a substitute integrator.
import { parentPort } from "node:worker_threads";
import { require as tsxRequire } from "tsx/cjs/api";

globalThis.self = { postMessage: (message) => parentPort.postMessage(message) };
tsxRequire("../../app/workers/physics.worker.ts", import.meta.url);
parentPort.on("message", (data) => globalThis.self.onmessage({ data }));
