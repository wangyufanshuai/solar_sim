import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import {
  createKerrMeasuredDetectorIntakeSummaryV458,
  parseKerrMeasuredDetectorIntakeArtifactV458,
  type KerrMeasuredDetectorIntakeArtifactV458,
  type KerrMeasuredDetectorIntakeSummaryV458,
} from "./kerrMeasuredDetectorIntakeEnvelopeV458";

const ROOT = "dist/science/kerr-measured-detector-intake-v458";
const FILES = Object.freeze({
  inspect: Object.freeze({ name: "intake-inspect.json", maxBytes: 128 * 1024 }),
  contract: Object.freeze({ name: "intake-contract.json", maxBytes: 64 * 1024 }),
  schema: Object.freeze({ name: "schema-pack.json", maxBytes: 128 * 1024 }),
});
type ExportId = keyof typeof FILES;

export type KerrMeasuredDetectorIntakeLoadedV458 = Readonly<{
  artifact: KerrMeasuredDetectorIntakeArtifactV458;
  summary: KerrMeasuredDetectorIntakeSummaryV458;
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
  promise: Promise<KerrMeasuredDetectorIntakeLoadedV458>;
}> | null = null;

export async function loadKerrMeasuredDetectorIntakeV458(
  root = process.cwd(),
): Promise<KerrMeasuredDetectorIntakeLoadedV458> {
  const inspectPath = resolve(root, ROOT, FILES.inspect.name);
  const metadata = await stat(inspectPath);
  if (
    !metadata.isFile() ||
    metadata.size <= 0 ||
    metadata.size > FILES.inspect.maxBytes
  ) {
    throw new Error("v458-intake-inspect-size");
  }
  const inspectBytes = new Uint8Array(await readFile(inspectPath));
  const fingerprint = `${inspectPath}:${metadata.mtimeMs}:${metadata.size}:${digest(inspectBytes)}`;
  if (cache?.fingerprint === fingerprint) return cache.promise;
  const promise = Promise.resolve().then(async () => {
    const entries = await Promise.all(
      (Object.keys(FILES) as ExportId[]).map(async (id) => {
        const spec = FILES[id];
        const path = resolve(root, ROOT, spec.name);
        const info = await stat(path);
        if (!info.isFile() || info.size <= 0 || info.size > spec.maxBytes) {
          throw new Error(`v458-${id}-size`);
        }
        const bytes = new Uint8Array(await readFile(path));
        return [
          id,
          Object.freeze({
            name: spec.name,
            bytes,
            fileSha256: digest(bytes),
            contentType: "application/json; charset=utf-8" as const,
          }),
        ] as const;
      }),
    );
    const exports = Object.freeze(
      Object.fromEntries(entries),
    ) as KerrMeasuredDetectorIntakeLoadedV458["exports"];
    const artifact = parseKerrMeasuredDetectorIntakeArtifactV458(
      JSON.parse(new TextDecoder().decode(exports.inspect.bytes)),
    );
    const contract = JSON.parse(
      new TextDecoder().decode(exports.contract.bytes),
    ) as Record<string, unknown>;
    const schema = JSON.parse(
      new TextDecoder().decode(exports.schema.bytes),
    ) as Record<string, unknown>;
    if (
      contract.stagingRoot !== artifact.contract.stagingRoot ||
      contract.requiredFileCount !== artifact.contract.requiredFileCount ||
      schema.version !== artifact.schemaPack.version ||
      schema.schemaCount !== artifact.schemaPack.schemaCount ||
      schema.schemaPackSha256 !== artifact.schemaPack.schemaPackSha256 ||
      JSON.stringify(schema.schemas) !== JSON.stringify(artifact.schemaPack.schemas)
    ) {
      throw new Error("v458-export-linkage");
    }
    return Object.freeze({
      artifact,
      summary: createKerrMeasuredDetectorIntakeSummaryV458(artifact),
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

export function resetKerrMeasuredDetectorIntakeServerCacheForTestsV458(): void {
  cache = null;
}
