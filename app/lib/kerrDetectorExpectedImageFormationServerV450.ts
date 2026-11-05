import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";

import {
  createKerrDetectorExpectedImageSummaryV450,
  parseKerrDetectorExpectedImageArtifactV450,
  type KerrDetectorExpectedImageArtifactV450,
  type KerrDetectorExpectedImageSummaryV450,
} from "./kerrDetectorExpectedImageFormationV450";

const ROOT = "dist/science/kerr-detector-image-formation-v450";
const FILES = Object.freeze({
  qualification: Object.freeze({
    name: "image-formation-qualification.json",
    maxBytes: 256 * 1024,
    contentType: "application/json; charset=utf-8",
  }),
  fixture: Object.freeze({
    name: "typescript-formation.json",
    maxBytes: 256 * 1024,
    contentType: "application/json; charset=utf-8",
  }),
  oracle: Object.freeze({
    name: "python-oracle.json",
    maxBytes: 256 * 1024,
    contentType: "application/json; charset=utf-8",
  }),
});
type ExportId = keyof typeof FILES;

export type KerrDetectorExpectedImageLoadedV450 = Readonly<{
  artifact: KerrDetectorExpectedImageArtifactV450;
  summary: KerrDetectorExpectedImageSummaryV450;
  exports: Readonly<
    Record<
      ExportId,
      Readonly<{
        name: string;
        bytes: Uint8Array;
        fileSha256: string;
        contentType: string;
      }>
    >
  >;
}>;

const sha = (value: Uint8Array): string =>
  createHash("sha256").update(value).digest("hex");
let cache: Readonly<{
  fingerprint: string;
  promise: Promise<KerrDetectorExpectedImageLoadedV450>;
}> | null = null;

export async function loadKerrDetectorExpectedImageV450(
  root = process.cwd(),
): Promise<KerrDetectorExpectedImageLoadedV450> {
  const target = resolve(root, ROOT, FILES.qualification.name);
  const metadata = await stat(target);
  if (
    !metadata.isFile() ||
    metadata.size <= 0 ||
    metadata.size > FILES.qualification.maxBytes
  ) {
    throw new Error("v450-qualification-size");
  }
  const first = new Uint8Array(await readFile(target));
  const fingerprint = `${target}:${metadata.mtimeMs}:${metadata.size}:${sha(first)}`;
  if (cache?.fingerprint === fingerprint) return cache.promise;
  const promise = Promise.resolve().then(async () => {
    const entries = await Promise.all(
      (Object.keys(FILES) as ExportId[]).map(async (id) => {
        const spec = FILES[id];
        const path = resolve(root, ROOT, spec.name);
        const info = await stat(path);
        if (!info.isFile() || info.size <= 0 || info.size > spec.maxBytes) {
          throw new Error(`v450-${id}-size`);
        }
        const bytes = new Uint8Array(await readFile(path));
        return [
          id,
          Object.freeze({
            name: spec.name,
            bytes,
            fileSha256: sha(bytes),
            contentType: spec.contentType,
          }),
        ] as const;
      }),
    );
    const exports = Object.freeze(
      Object.fromEntries(entries),
    ) as KerrDetectorExpectedImageLoadedV450["exports"];
    const artifact = parseKerrDetectorExpectedImageArtifactV450(
      JSON.parse(new TextDecoder().decode(exports.qualification.bytes)),
    );
    return Object.freeze({
      artifact,
      summary: createKerrDetectorExpectedImageSummaryV450(artifact),
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

export function resetKerrDetectorExpectedImageServerCacheForTestsV450(): void {
  cache = null;
}
