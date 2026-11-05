import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import {
  createKerrInstrumentAuthorityMatrixSummaryV511,
  parseKerrInstrumentAuthorityMatrixArtifactV511,
  type KerrInstrumentAuthorityMatrixArtifactV511,
  type KerrInstrumentAuthorityMatrixSummaryV511,
} from "./kerrInstrumentAuthorityMatrixV511";

const RELATIVE_PATH =
  "dist/science/kerr-instrument-authority-matrix-v511/matrix.json";
const MAX_BYTES = 128 * 1024;

export type KerrInstrumentAuthorityMatrixLoadedV511 = Readonly<{
  artifact: KerrInstrumentAuthorityMatrixArtifactV511;
  summary: KerrInstrumentAuthorityMatrixSummaryV511;
  export: Readonly<{
    name: "orbit-atlas-kerr-instrument-authority-matrix-v511.json";
    bytes: Uint8Array;
    fileSha256: string;
    contentType: "application/json; charset=utf-8";
  }>;
}>;

let cache: Readonly<{
  fingerprint: string;
  promise: Promise<KerrInstrumentAuthorityMatrixLoadedV511>;
}> | null = null;

const digest = (bytes: Uint8Array): string =>
  createHash("sha256").update(bytes).digest("hex");

export async function loadKerrInstrumentAuthorityMatrixV511(
  root = process.cwd(),
): Promise<KerrInstrumentAuthorityMatrixLoadedV511> {
  const target = resolve(root, RELATIVE_PATH);
  const metadata = await stat(target);
  if (!metadata.isFile() || metadata.size <= 0 || metadata.size > MAX_BYTES) {
    throw new Error("v511-matrix-size");
  }
  const bytes = new Uint8Array(await readFile(target));
  const fingerprint = `${metadata.mtimeMs}:${metadata.size}:${digest(bytes)}`;
  if (cache?.fingerprint === fingerprint) return cache.promise;
  const promise = Promise.resolve().then(() => {
    const artifact = parseKerrInstrumentAuthorityMatrixArtifactV511(
      JSON.parse(new TextDecoder().decode(bytes)),
    );
    return Object.freeze({
      artifact,
      summary: createKerrInstrumentAuthorityMatrixSummaryV511(artifact),
      export: Object.freeze({
        name: "orbit-atlas-kerr-instrument-authority-matrix-v511.json" as const,
        bytes,
        fileSha256: digest(bytes),
        contentType: "application/json; charset=utf-8" as const,
      }),
    });
  });
  cache = Object.freeze({ fingerprint, promise });
  try {
    return await promise;
  } catch (error) {
    if (cache?.promise === promise) cache = null;
    throw error;
  }
}

export function resetKerrInstrumentAuthorityMatrixServerCacheForTestsV511(): void {
  cache = null;
}
