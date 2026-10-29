import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";

import {
  createKerrDetectorInputAdmissionSummaryV451,
  parseKerrDetectorInputAdmissionArtifactV451,
  type KerrDetectorInputAdmissionArtifactV451,
  type KerrDetectorInputAdmissionSummaryV451,
} from "./kerrDetectorInputAdmissionV451";

const ROOT = "dist/science/kerr-detector-input-admission-v451";
const FILE = Object.freeze({
  name: "input-admission-qualification.json",
  maxBytes: 128 * 1024,
  contentType: "application/json; charset=utf-8",
});

export type KerrDetectorInputAdmissionLoadedV451 = Readonly<{
  artifact: KerrDetectorInputAdmissionArtifactV451;
  summary: KerrDetectorInputAdmissionSummaryV451;
  export: Readonly<{
    name: string;
    bytes: Uint8Array;
    fileSha256: string;
    contentType: string;
  }>;
}>;

const sha = (value: Uint8Array): string =>
  createHash("sha256").update(value).digest("hex");
let cache: Readonly<{
  fingerprint: string;
  promise: Promise<KerrDetectorInputAdmissionLoadedV451>;
}> | null = null;

export async function loadKerrDetectorInputAdmissionV451(
  root = process.cwd(),
): Promise<KerrDetectorInputAdmissionLoadedV451> {
  const path = resolve(root, ROOT, FILE.name);
  const metadata = await stat(path);
  if (!metadata.isFile() || metadata.size <= 0 || metadata.size > FILE.maxBytes) {
    throw new Error("v451-admission-size");
  }
  const first = new Uint8Array(await readFile(path));
  const fingerprint = `${path}:${metadata.mtimeMs}:${metadata.size}:${sha(first)}`;
  if (cache?.fingerprint === fingerprint) return cache.promise;
  const promise = Promise.resolve().then(async () => {
    const bytes = new Uint8Array(await readFile(path));
    const artifact = parseKerrDetectorInputAdmissionArtifactV451(
      JSON.parse(new TextDecoder().decode(bytes)),
    );
    return Object.freeze({
      artifact,
      summary: createKerrDetectorInputAdmissionSummaryV451(artifact),
      export: Object.freeze({
        name: FILE.name,
        bytes,
        fileSha256: sha(bytes),
        contentType: FILE.contentType,
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

export function resetKerrDetectorInputAdmissionServerCacheForTestsV451(): void {
  cache = null;
}
