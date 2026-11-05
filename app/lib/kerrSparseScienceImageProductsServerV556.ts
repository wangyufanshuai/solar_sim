import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { canonicalKerrSparseScienceImageProductsV556, parseKerrSparseScienceImageProductsV556, type KerrSparseScienceImageProductsArtifactV556 } from "./kerrSparseScienceImageProductsV556";

const FILES = Object.freeze({ manifest: "dist/science/kerr-sparse-science-image-products-v556/manifest.json", png: "dist/science/kerr-sparse-science-image-products-v556/sparse-authority-v556.png", fits: "dist/science/kerr-sparse-science-image-products-v556/sparse-authority-v556.fits", receipt: "dist/science/kerr-sparse-science-image-products-v556/validation-receipt.json", validator: "dist/science/kerr-sparse-science-image-products-v556/orbit-atlas-v556-sparse-science-image-validator.py" });
const LIMITS = Object.freeze({ manifest: 128 * 1024, png: 1024 * 1024, fits: 512 * 1024, receipt: 64 * 1024, validator: 64 * 1024 });
const CONTENT = Object.freeze({ manifest: "application/json; charset=utf-8", png: "image/png", fits: "application/fits", receipt: "application/json; charset=utf-8", validator: "text/x-python; charset=utf-8" });
const NAMES = Object.freeze({ manifest: "orbit-atlas-kerr-sparse-science-products-v556.json", png: "orbit-atlas-kerr-sparse-authority-v556.png", fits: "orbit-atlas-kerr-sparse-authority-v556.fits", receipt: "orbit-atlas-kerr-sparse-validation-v556.json", validator: "orbit-atlas-v556-sparse-science-image-validator.py" });
export type KerrSparseScienceImageProductsExportIdV556 = keyof typeof FILES;
type ExportV556 = Readonly<{ name: string; bytes: Uint8Array; fileSha256: string; contentType: string }>;
export type LoadedKerrSparseScienceImageProductsV556 = Readonly<{ artifact: KerrSparseScienceImageProductsArtifactV556; exports: Readonly<Record<KerrSparseScienceImageProductsExportIdV556, ExportV556>> }>;
let cache: Readonly<{ fingerprint: string; promise: Promise<LoadedKerrSparseScienceImageProductsV556> }> | null = null;
const sha = (value: Uint8Array | string) => createHash("sha256").update(value).digest("hex");

export async function loadKerrSparseScienceImageProductsV556(root = process.cwd()): Promise<LoadedKerrSparseScienceImageProductsV556> {
  const ids = Object.keys(FILES) as KerrSparseScienceImageProductsExportIdV556[];
  const entries = await Promise.all(ids.map(async (id) => { const path = resolve(root, FILES[id]), metadata = await stat(path); if (!metadata.isFile() || metadata.size <= 0 || metadata.size > LIMITS[id]) throw new Error(`v556-product-size:${id}`); const bytes = new Uint8Array(await readFile(path)); return { id, metadata, bytes, fileSha256: sha(bytes) }; }));
  const fingerprint = entries.map(({ id, metadata, fileSha256 }) => `${id}:${metadata.mtimeMs}:${metadata.size}:${fileSha256}`).join("|");
  if (cache?.fingerprint === fingerprint) return cache.promise;
  const promise = Promise.resolve().then(() => {
    const byId = Object.fromEntries(entries.map((entry) => [entry.id, entry])) as Record<KerrSparseScienceImageProductsExportIdV556, (typeof entries)[number]>;
    const artifact = parseKerrSparseScienceImageProductsV556(JSON.parse(Buffer.from(byId.manifest.bytes).toString("utf8")));
    const png = artifact.products.find((product) => product.id === "png")!, fits = artifact.products.find((product) => product.id === "fits")!;
    if (sha(canonicalKerrSparseScienceImageProductsV556(artifact)) !== artifact.artifactSha256 || byId.png.fileSha256 !== png.fileSha256 || byId.fits.fileSha256 !== fits.fileSha256 || byId.receipt.fileSha256 !== artifact.validation.receiptFileSha256 || byId.validator.fileSha256 !== artifact.source.validatorFileSha256) throw new Error("v556-product-integrity");
    return Object.freeze({ artifact, exports: Object.freeze(Object.fromEntries(ids.map((id) => [id, Object.freeze({ name: NAMES[id], bytes: byId[id].bytes, fileSha256: byId[id].fileSha256, contentType: CONTENT[id] })])) as Record<KerrSparseScienceImageProductsExportIdV556, ExportV556>) });
  });
  cache = Object.freeze({ fingerprint, promise });
  try { return await promise; } catch (error) { if (cache?.promise === promise) cache = null; throw error; }
}

export function resetKerrSparseScienceImageProductsServerCacheForTestsV556(): void { cache = null; }
