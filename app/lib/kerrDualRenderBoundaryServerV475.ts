import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";

import {
  canonicalKerrDualRenderPayloadV475,
  createKerrDualRenderSummaryV475,
  parseKerrDualRenderArtifactV475,
  type KerrDualRenderArtifactV475,
  type KerrDualRenderSummaryV475,
} from "./kerrDualRenderBoundaryV475";

const ROOT = "dist/science/kerr-dual-render-boundary-v475";
const FILE = Object.freeze({ name: "dual-render.json", maxBytes: 128 * 1024 });
const digest = (value: Uint8Array | string) =>
  createHash("sha256").update(value).digest("hex");

export type KerrDualRenderLoadedV475 = Readonly<{
  artifact: KerrDualRenderArtifactV475;
  summary: KerrDualRenderSummaryV475;
  export: Readonly<{
    name: string;
    bytes: Uint8Array;
    fileSha256: string;
    contentType: "application/json; charset=utf-8";
  }>;
}>;

let cache: Readonly<{
  fingerprint: string;
  promise: Promise<KerrDualRenderLoadedV475>;
}> | null = null;

export async function loadKerrDualRenderBoundaryV475(
  root = process.cwd(),
): Promise<KerrDualRenderLoadedV475> {
  const target = resolve(root, ROOT, FILE.name);
  const metadata = await stat(target);
  if (!metadata.isFile() || metadata.size <= 0 || metadata.size > FILE.maxBytes) {
    throw new Error("v475-dual-render-size");
  }
  const bytes = new Uint8Array(await readFile(target));
  const fileSha256 = digest(bytes);
  const fingerprint = [target, metadata.mtimeMs, metadata.size, fileSha256].join(":");
  if (cache?.fingerprint === fingerprint) return cache.promise;

  const promise = Promise.resolve().then(() => {
    const artifact = parseKerrDualRenderArtifactV475(
      JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)),
    );
    if (digest(canonicalKerrDualRenderPayloadV475(artifact)) !== artifact.artifactSha256) {
      throw new Error("v475-dual-render-canonical-sha");
    }
    if (
      digest(canonicalKerrDualRenderPayloadV475(artifact.scienceBuffer)) !==
      artifact.scienceBuffer.scienceBufferSha256
    ) {
      throw new Error("v475-science-buffer-canonical-sha");
    }
    return Object.freeze({
      artifact,
      summary: createKerrDualRenderSummaryV475(artifact),
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

export function resetKerrDualRenderBoundaryServerCacheForTestsV475(): void {
  cache = null;
}
