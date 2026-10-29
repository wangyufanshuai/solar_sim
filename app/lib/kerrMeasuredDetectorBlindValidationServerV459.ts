import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import {
  createKerrMeasuredDetectorBlindValidationSummaryV459,
  parseKerrMeasuredDetectorBlindValidationArtifactV459,
  type KerrMeasuredDetectorBlindValidationArtifactV459,
  type KerrMeasuredDetectorBlindValidationSummaryV459,
} from "./kerrMeasuredDetectorBlindValidationV459";

const ROOT = "dist/science/kerr-measured-detector-blind-validation-v459";
const FILES = Object.freeze({
  validation: Object.freeze({ name: "blind-validation.json", maxBytes: 128 * 1024 }),
});
type ExportId = keyof typeof FILES;
export type KerrMeasuredDetectorBlindValidationLoadedV459 = Readonly<{
  artifact: KerrMeasuredDetectorBlindValidationArtifactV459;
  summary: KerrMeasuredDetectorBlindValidationSummaryV459;
  exports: Readonly<
    Record<
      ExportId,
      Readonly<{
        name: string;
        bytes: Uint8Array;
        fileSha256: string;
        contentType: "application/json; charset=utf-8";
      }>
    >
  >;
}>;

const digest = (bytes: Uint8Array): string =>
  createHash("sha256").update(bytes).digest("hex");
let cache: Readonly<{
  fingerprint: string;
  promise: Promise<KerrMeasuredDetectorBlindValidationLoadedV459>;
}> | null = null;

export async function loadKerrMeasuredDetectorBlindValidationV459(
  root = process.cwd(),
): Promise<KerrMeasuredDetectorBlindValidationLoadedV459> {
  const target = resolve(root, ROOT, FILES.validation.name);
  const metadata = await stat(target);
  if (!metadata.isFile() || metadata.size <= 0 || metadata.size > FILES.validation.maxBytes) {
    throw new Error("v459-blind-validation-size");
  }
  const bytes = new Uint8Array(await readFile(target));
  const fingerprint = `${target}:${metadata.mtimeMs}:${metadata.size}:${digest(bytes)}`;
  if (cache?.fingerprint === fingerprint) return cache.promise;
  const promise = Promise.resolve().then(() => {
    const artifact = parseKerrMeasuredDetectorBlindValidationArtifactV459(
      JSON.parse(new TextDecoder().decode(bytes)),
    );
    const exports = Object.freeze({
      validation: Object.freeze({
        name: FILES.validation.name,
        bytes,
        fileSha256: digest(bytes),
        contentType: "application/json; charset=utf-8" as const,
      }),
    });
    return Object.freeze({
      artifact,
      summary: createKerrMeasuredDetectorBlindValidationSummaryV459(artifact),
      exports,
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

export function resetKerrMeasuredDetectorBlindValidationServerCacheForTestsV459(): void {
  cache = null;
}
