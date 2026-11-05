import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";

import {
  canonicalKerrPhotonMetrologyCockpitV485,
  createKerrPhotonMetrologyCockpitSummaryV485,
  parseKerrPhotonMetrologyCockpitArtifactV485,
  type KerrPhotonMetrologyCockpitArtifactV485,
  type KerrPhotonMetrologyCockpitSummaryV485,
} from "./kerrPhotonMetrologyCockpitV485";

const ROOT = "dist/science/kerr-photon-metrology-cockpit-v485";
const FILE = Object.freeze({ name: "cockpit.json", maxBytes: 128 * 1024 });
const digest = (value: Uint8Array | string) =>
  createHash("sha256").update(value).digest("hex");

export type KerrPhotonMetrologyCockpitLoadedV485 = Readonly<{
  artifact: KerrPhotonMetrologyCockpitArtifactV485;
  summary: KerrPhotonMetrologyCockpitSummaryV485;
  export: Readonly<{
    name: string;
    bytes: Uint8Array;
    fileSha256: string;
    contentType: "application/json; charset=utf-8";
  }>;
}>;

let cache: Readonly<{
  fingerprint: string;
  promise: Promise<KerrPhotonMetrologyCockpitLoadedV485>;
}> | null = null;

export async function loadKerrPhotonMetrologyCockpitV485(
  root = process.cwd(),
): Promise<KerrPhotonMetrologyCockpitLoadedV485> {
  const target = resolve(root, ROOT, FILE.name);
  const metadata = await stat(target);
  if (!metadata.isFile() || metadata.size <= 0 || metadata.size > FILE.maxBytes) {
    throw new Error("v485-cockpit-size");
  }
  const bytes = new Uint8Array(await readFile(target));
  const fileSha256 = digest(bytes);
  const fingerprint = [target, metadata.mtimeMs, metadata.size, fileSha256].join(":");
  if (cache?.fingerprint === fingerprint) return cache.promise;
  const promise = Promise.resolve().then(() => {
    const artifact = parseKerrPhotonMetrologyCockpitArtifactV485(
      JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)),
    );
    if (digest(canonicalKerrPhotonMetrologyCockpitV485(artifact)) !== artifact.artifactSha256) {
      throw new Error("v485-cockpit-canonical-sha");
    }
    if (digest(canonicalKerrPhotonMetrologyCockpitV485(artifact.stages)) !== artifact.stageChainSha256) {
      throw new Error("v485-stage-chain-sha");
    }
    return Object.freeze({
      artifact,
      summary: createKerrPhotonMetrologyCockpitSummaryV485(artifact),
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

export function resetKerrPhotonMetrologyCockpitServerCacheForTestsV485(): void {
  cache = null;
}
