import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";

import {
  canonicalKerrScienceProductAdmissionV476,
  createKerrScienceProductAdmissionSummaryV476,
  parseKerrScienceProductAdmissionArtifactV476,
  type KerrScienceProductAdmissionArtifactV476,
  type KerrScienceProductAdmissionSummaryV476,
} from "./kerrScienceProductAdmissionV476";

const ROOT = "dist/science/kerr-science-product-admission-v476";
const FILE = Object.freeze({ name: "admission.json", maxBytes: 128 * 1024 });
const digest = (value: Uint8Array | string) =>
  createHash("sha256").update(value).digest("hex");

export type KerrScienceProductAdmissionLoadedV476 = Readonly<{
  artifact: KerrScienceProductAdmissionArtifactV476;
  summary: KerrScienceProductAdmissionSummaryV476;
  export: Readonly<{
    name: string;
    bytes: Uint8Array;
    fileSha256: string;
    contentType: "application/json; charset=utf-8";
  }>;
}>;

let cache: Readonly<{
  fingerprint: string;
  promise: Promise<KerrScienceProductAdmissionLoadedV476>;
}> | null = null;

export async function loadKerrScienceProductAdmissionV476(
  root = process.cwd(),
): Promise<KerrScienceProductAdmissionLoadedV476> {
  const target = resolve(root, ROOT, FILE.name);
  const metadata = await stat(target);
  if (!metadata.isFile() || metadata.size <= 0 || metadata.size > FILE.maxBytes) {
    throw new Error("v476-admission-size");
  }
  const bytes = new Uint8Array(await readFile(target));
  const fileSha256 = digest(bytes);
  const fingerprint = [target, metadata.mtimeMs, metadata.size, fileSha256].join(":");
  if (cache?.fingerprint === fingerprint) return cache.promise;

  const promise = Promise.resolve().then(() => {
    const artifact = parseKerrScienceProductAdmissionArtifactV476(
      JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)),
    );
    if (
      digest(canonicalKerrScienceProductAdmissionV476(artifact)) !== artifact.artifactSha256
    ) {
      throw new Error("v476-admission-canonical-sha");
    }
    return Object.freeze({
      artifact,
      summary: createKerrScienceProductAdmissionSummaryV476(artifact),
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

export function resetKerrScienceProductAdmissionServerCacheForTestsV476(): void {
  cache = null;
}
