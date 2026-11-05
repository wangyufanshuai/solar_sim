import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import {
  createKerrFixedBandStokesSummaryV520,
  parseKerrFixedBandStokesArtifactV520,
  type KerrFixedBandStokesArtifactV520,
  type KerrFixedBandStokesSummaryV520,
} from "./kerrFixedBandStokesV520";

const RELATIVE = "dist/science/kerr-fixed-band-stokes-v520/stokes-payload.json";
const MAX_BYTES = 128 * 1024;
const digest = (bytes: Uint8Array) =>
  createHash("sha256").update(bytes).digest("hex");
let cache: Readonly<{
  fingerprint: string;
  promise: Promise<KerrFixedBandStokesLoadedV520>;
}> | null = null;

export type KerrFixedBandStokesLoadedV520 = Readonly<{
  artifact: KerrFixedBandStokesArtifactV520;
  summary: KerrFixedBandStokesSummaryV520;
  export: Readonly<{
    name: "orbit-atlas-kerr-fixed-band-stokes-v520.json";
    bytes: Uint8Array;
    fileSha256: string;
    contentType: "application/json; charset=utf-8";
  }>;
}>;

export async function loadKerrFixedBandStokesV520(
  root = process.cwd(),
): Promise<KerrFixedBandStokesLoadedV520> {
  const target = resolve(root, RELATIVE);
  const metadata = await stat(target);
  if (!metadata.isFile() || metadata.size <= 0 || metadata.size > MAX_BYTES) {
    throw new Error("v520-stokes-size");
  }
  const bytes = new Uint8Array(await readFile(target));
  const fingerprint = `${metadata.mtimeMs}:${metadata.size}:${digest(bytes)}`;
  if (cache?.fingerprint === fingerprint) return cache.promise;
  const promise = Promise.resolve().then(() => {
    const artifact = parseKerrFixedBandStokesArtifactV520(
      JSON.parse(new TextDecoder().decode(bytes)),
    );
    return Object.freeze({
      artifact,
      summary: createKerrFixedBandStokesSummaryV520(artifact),
      export: Object.freeze({
        name: "orbit-atlas-kerr-fixed-band-stokes-v520.json" as const,
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

export function resetKerrFixedBandStokesServerCacheForTestsV520() {
  cache = null;
}
