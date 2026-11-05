import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";

import {
  canonicalKerrPhotonEvidenceWorkbenchV480,
  createKerrPhotonEvidenceWorkbenchSummaryV480,
  parseKerrPhotonEvidenceWorkbenchArtifactV480,
  type KerrPhotonEvidenceWorkbenchArtifactV480,
  type KerrPhotonEvidenceWorkbenchSummaryV480,
} from "./kerrPhotonEvidenceWorkbenchV480";

const ROOT = "dist/science/kerr-photon-evidence-workbench-v480";
const FILE = Object.freeze({ name: "workbench.json", maxBytes: 128 * 1024 });
const digest = (value: Uint8Array | string) =>
  createHash("sha256").update(value).digest("hex");

export type KerrPhotonEvidenceWorkbenchLoadedV480 = Readonly<{
  artifact: KerrPhotonEvidenceWorkbenchArtifactV480;
  summary: KerrPhotonEvidenceWorkbenchSummaryV480;
  export: Readonly<{
    name: string;
    bytes: Uint8Array;
    fileSha256: string;
    contentType: "application/json; charset=utf-8";
  }>;
}>;

let cache: Readonly<{
  fingerprint: string;
  promise: Promise<KerrPhotonEvidenceWorkbenchLoadedV480>;
}> | null = null;

export async function loadKerrPhotonEvidenceWorkbenchV480(
  root = process.cwd(),
): Promise<KerrPhotonEvidenceWorkbenchLoadedV480> {
  const target = resolve(root, ROOT, FILE.name);
  const metadata = await stat(target);
  if (!metadata.isFile() || metadata.size <= 0 || metadata.size > FILE.maxBytes) {
    throw new Error("v480-workbench-size");
  }

  const bytes = new Uint8Array(await readFile(target));
  const fileSha256 = digest(bytes);
  const fingerprint = [target, metadata.mtimeMs, metadata.size, fileSha256].join(":");
  if (cache?.fingerprint === fingerprint) return cache.promise;

  const promise = Promise.resolve().then(() => {
    const artifact = parseKerrPhotonEvidenceWorkbenchArtifactV480(
      JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)),
    );
    if (digest(canonicalKerrPhotonEvidenceWorkbenchV480(artifact)) !== artifact.artifactSha256) {
      throw new Error("v480-workbench-canonical-sha");
    }
    return Object.freeze({
      artifact,
      summary: createKerrPhotonEvidenceWorkbenchSummaryV480(artifact),
      export: Object.freeze({
        name: FILE.name,
        bytes,
        fileSha256,
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

export function resetKerrPhotonEvidenceWorkbenchServerCacheForTestsV480(): void {
  cache = null;
}
