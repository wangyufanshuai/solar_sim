import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { canonicalOrbitRelativityEngineImportV561, parseOrbitRelativityEngineImportV561, type OrbitRelativityEngineImportV561 } from "./orbitRelativityEngineV561";

const FILES = Object.freeze({ manifest: "dist/science/orbit-relativity-engine-v561/import-manifest.json", summary: "dist/science/orbit-relativity-engine-v561/summary.json", fits: "dist/science/orbit-relativity-engine-v561/observables.fits", image: "dist/science/orbit-relativity-engine-v561/image.png", transportSummary: "dist/science/orbit-relativity-engine-v561/transport-summary.json", transportFits: "dist/science/orbit-relativity-engine-v561/polarization-observables.fits" });
const LIMITS = Object.freeze({ manifest: 128 * 1024, summary: 128 * 1024, fits: 4 * 1024 * 1024, image: 1024 * 1024, transportSummary: 256 * 1024, transportFits: 4 * 1024 * 1024 });
const IMPORT_PATHS = Object.freeze({ summary: "summary.json", fits: "observables.fits", image: "image.png", transportSummary: "transport-summary.json", transportFits: "polarization-observables.fits" });
export type OrbitRelativityEngineExportIdV561 = keyof typeof FILES;
type ExportFile = Readonly<{ name: string; bytes: Uint8Array; fileSha256: string; contentType: string }>;
export type LoadedOrbitRelativityEngineV561 = Readonly<{ artifact: OrbitRelativityEngineImportV561; exports: Readonly<Record<OrbitRelativityEngineExportIdV561, ExportFile>> }>;
let cache: Readonly<{ fingerprint: string; promise: Promise<LoadedOrbitRelativityEngineV561> }> | null = null;
const sha = (value: Uint8Array | string): string => createHash("sha256").update(value).digest("hex");

export async function loadOrbitRelativityEngineV561(root = process.cwd()): Promise<LoadedOrbitRelativityEngineV561> {
  const ids = Object.keys(FILES) as OrbitRelativityEngineExportIdV561[];
  const entries = await Promise.all(ids.map(async (id) => {
    const path = resolve(root, FILES[id]);
    const metadata = await stat(path);
    if (!metadata.isFile() || metadata.size <= 0 || metadata.size > LIMITS[id]) throw new Error(`v561-engine-size:${id}`);
    const bytes = new Uint8Array(await readFile(path));
    return { id, metadata, bytes, fileSha256: sha(bytes) };
  }));
  const fingerprint = entries.map(({ id, metadata, fileSha256 }) => `${id}:${metadata.mtimeMs}:${metadata.size}:${fileSha256}`).join("|");
  if (cache?.fingerprint === fingerprint) return cache.promise;
  const promise = Promise.resolve().then(() => {
    const byId = Object.fromEntries(entries.map((entry) => [entry.id, entry])) as Record<OrbitRelativityEngineExportIdV561, (typeof entries)[number]>;
    const artifact = parseOrbitRelativityEngineImportV561(JSON.parse(Buffer.from(byId.manifest.bytes).toString("utf8")));
    if (sha(canonicalOrbitRelativityEngineImportV561(artifact)) !== artifact.artifactSha256) throw new Error("v561-engine-canonical-sha");
    for (const id of ids.filter((entry): entry is Exclude<OrbitRelativityEngineExportIdV561, "manifest"> => entry !== "manifest")) if (!artifact.importedFiles.some((entry) => entry.path === IMPORT_PATHS[id] && entry.sha256 === byId[id].fileSha256)) throw new Error(`v561-engine-file-sha:${id}`);
    return Object.freeze({
      artifact,
      exports: Object.freeze({
        manifest: Object.freeze({ name: "orbit-atlas-engine-v561-import-manifest.json", bytes: byId.manifest.bytes, fileSha256: byId.manifest.fileSha256, contentType: "application/json; charset=utf-8" }),
        summary: Object.freeze({ name: "orbit-atlas-engine-v561-summary.json", bytes: byId.summary.bytes, fileSha256: byId.summary.fileSha256, contentType: "application/json; charset=utf-8" }),
        fits: Object.freeze({ name: "orbit-atlas-engine-v561-observables.fits", bytes: byId.fits.bytes, fileSha256: byId.fits.fileSha256, contentType: "application/fits" }),
        image: Object.freeze({ name: "orbit-atlas-engine-v561-reference.png", bytes: byId.image.bytes, fileSha256: byId.image.fileSha256, contentType: "image/png" }),
        transportSummary: Object.freeze({ name: "orbit-atlas-engine-v561-transport-summary.json", bytes: byId.transportSummary.bytes, fileSha256: byId.transportSummary.fileSha256, contentType: "application/json; charset=utf-8" }),
        transportFits: Object.freeze({ name: "orbit-atlas-engine-v561-polarization-observables.fits", bytes: byId.transportFits.bytes, fileSha256: byId.transportFits.fileSha256, contentType: "application/fits" }),
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

export function resetOrbitRelativityEngineServerCacheForTestsV561(): void { cache = null; }
