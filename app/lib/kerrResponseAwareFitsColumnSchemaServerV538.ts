import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";

import { canonicalKerrResponseAwareFitsColumnSchemaV538, createKerrResponseAwareFitsColumnSchemaSummaryV538, parseKerrResponseAwareFitsColumnSchemaArtifactV538, type KerrResponseAwareFitsColumnSchemaArtifactV538, type KerrResponseAwareFitsColumnSchemaSummaryV538 } from "./kerrResponseAwareFitsColumnSchemaV538";

const ROOT = "dist/science/kerr-response-aware-fits-column-schema-v538";
const ATLAS = `${ROOT}/atlas.json`;
const CSV = `${ROOT}/column-schema.csv`;
export const KERR_RESPONSE_AWARE_FITS_COLUMN_SCHEMA_MAX_BYTES_V538 = 256 * 1024;
type LoadedV538 = Readonly<{ artifact: KerrResponseAwareFitsColumnSchemaArtifactV538; summary: KerrResponseAwareFitsColumnSchemaSummaryV538; exports: Readonly<{ atlas: Readonly<{ name: "orbit-atlas-kerr-response-aware-fits-column-schema-v538.json"; bytes: Uint8Array; fileSha256: string; contentType: "application/json; charset=utf-8" }>; csv: Readonly<{ name: "orbit-atlas-kerr-response-aware-fits-column-schema-v538.csv"; bytes: Uint8Array; fileSha256: string; contentType: "text/csv; charset=utf-8" }> }> }>;
let cache: Readonly<{ fingerprint: string; promise: Promise<LoadedV538> }> | null = null;
const sha = (value: Uint8Array | string) => createHash("sha256").update(value).digest("hex");

export async function loadKerrResponseAwareFitsColumnSchemaV538(root = process.cwd()): Promise<LoadedV538> {
  const atlasPath = resolve(root, ATLAS);
  const csvPath = resolve(root, CSV);
  const [atlasMetadata, csvMetadata] = await Promise.all([stat(atlasPath), stat(csvPath)]);
  if (!atlasMetadata.isFile() || atlasMetadata.size <= 0 || atlasMetadata.size > KERR_RESPONSE_AWARE_FITS_COLUMN_SCHEMA_MAX_BYTES_V538) throw new Error("v538-atlas-size");
  if (!csvMetadata.isFile() || csvMetadata.size <= 0 || csvMetadata.size > KERR_RESPONSE_AWARE_FITS_COLUMN_SCHEMA_MAX_BYTES_V538) throw new Error("v538-csv-size");
  const [atlasBuffer, csvBuffer] = await Promise.all([readFile(atlasPath), readFile(csvPath)]);
  const atlasFileSha256 = sha(atlasBuffer);
  const csvFileSha256 = sha(csvBuffer);
  const fingerprint = `${atlasMetadata.mtimeMs}:${atlasMetadata.size}:${atlasFileSha256}:${csvMetadata.mtimeMs}:${csvMetadata.size}:${csvFileSha256}`;
  if (cache?.fingerprint === fingerprint) return cache.promise;
  const promise = Promise.resolve().then(() => {
    const artifact = parseKerrResponseAwareFitsColumnSchemaArtifactV538(JSON.parse(atlasBuffer.toString("utf8")));
    if (sha(canonicalKerrResponseAwareFitsColumnSchemaV538(artifact)) !== artifact.artifactSha256 || artifact.export.csvFileSha256 !== csvFileSha256) throw new Error("v538-artifact-integrity");
    const csvText = csvBuffer.toString("utf8");
    if (!csvText.startsWith("ordinal,name,fits_format,fits_unit,unit_semantic,") || csvText.trimEnd().split("\n").length !== 18) throw new Error("v538-csv-contract");
    return Object.freeze({ artifact, summary: createKerrResponseAwareFitsColumnSchemaSummaryV538(artifact), exports: Object.freeze({ atlas: Object.freeze({ name: "orbit-atlas-kerr-response-aware-fits-column-schema-v538.json" as const, bytes: new Uint8Array(atlasBuffer), fileSha256: atlasFileSha256, contentType: "application/json; charset=utf-8" as const }), csv: Object.freeze({ name: "orbit-atlas-kerr-response-aware-fits-column-schema-v538.csv" as const, bytes: new Uint8Array(csvBuffer), fileSha256: csvFileSha256, contentType: "text/csv; charset=utf-8" as const }) }) });
  });
  cache = Object.freeze({ fingerprint, promise });
  try { return await promise; } catch (error) { if (cache?.promise === promise) cache = null; throw error; }
}
export function resetKerrResponseAwareFitsColumnSchemaServerCacheForTestsV538(): void { cache = null; }
