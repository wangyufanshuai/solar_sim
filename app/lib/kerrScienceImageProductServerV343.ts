import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { parseKerrScienceImageProductManifestV343, type KerrScienceImageProductManifestV343 } from "./kerrScienceImageProductsV343";

const MANIFEST = "dist/science/kerr-observation-images-v343/manifest.json";
const MANIFEST_LIMIT = 64 * 1024;
const PRODUCT_LIMIT = 1024 * 1024;
let manifestCache: { fingerprint: string; promise: Promise<KerrScienceImageProductManifestV343> } | null = null;
const productCache = new Map<string, { fingerprint: string; promise: Promise<Uint8Array> }>();
function canonicalize(value: unknown): unknown { if (Array.isArray(value)) return value.map(canonicalize); if (!value || typeof value !== "object") return value; return Object.fromEntries(Object.entries(value as Record<string, unknown>).filter(([key]) => !["generatedAt", "artifactSha256", "manifestSha256"].includes(key)).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, canonicalize(entry)])); }
function sha(value: Uint8Array | string): string { return createHash("sha256").update(value).digest("hex"); }
export async function loadKerrScienceImageProductManifestV343(root = process.cwd()): Promise<KerrScienceImageProductManifestV343> {
  const path = resolve(root, MANIFEST); const metadata = await stat(path);
  if (!metadata.isFile() || metadata.size <= 0 || metadata.size > MANIFEST_LIMIT) throw new Error("v343-manifest-size");
  const fingerprint = `${metadata.size}:${metadata.mtimeMs}`;
  if (manifestCache?.fingerprint === fingerprint) return manifestCache.promise;
  const promise = readFile(path).then((bytes) => {
    if (bytes.byteLength !== metadata.size) throw new Error("v343-manifest-race");
    const manifest = parseKerrScienceImageProductManifestV343(JSON.parse(bytes.toString("utf8")));
    if (sha(JSON.stringify(canonicalize(manifest))) !== manifest.manifestSha256) throw new Error("v343-manifest-canonical-sha");
    return manifest;
  });
  manifestCache = { fingerprint, promise };
  try { return await promise; } catch (error) { if (manifestCache?.promise === promise) manifestCache = null; throw error; }
}
export async function loadKerrScienceImageProductBytesV343(productId: "fits" | "png", root = process.cwd()): Promise<Readonly<{ bytes: Uint8Array; mimeType: string; filename: string; sha256: string }>> {
  const manifest = await loadKerrScienceImageProductManifestV343(root);
  const entry = manifest.products.find((product) => product.id === productId);
  if (!entry) throw new Error("v343-product-not-allowed");
  const path = resolve(root, entry.path); const metadata = await stat(path);
  if (!metadata.isFile() || metadata.size !== entry.bytes || metadata.size <= 0 || metadata.size > PRODUCT_LIMIT) throw new Error("v343-product-size");
  const fingerprint = `${entry.sha256}:${metadata.size}:${metadata.mtimeMs}`;
  const cached = productCache.get(productId);
  let promise = cached?.fingerprint === fingerprint ? cached.promise : null;
  if (!promise) { promise = readFile(path).then((bytes) => { if (bytes.byteLength !== entry.bytes || sha(bytes) !== entry.sha256) throw new Error("v343-product-sha"); return new Uint8Array(bytes); }); productCache.set(productId, { fingerprint, promise }); }
  try { const bytes = await promise; return { bytes, mimeType: entry.mimeType, filename: productId === "fits" ? "orbit-atlas-kerr-sparse-v343.fits" : "orbit-atlas-kerr-sparse-v343.png", sha256: entry.sha256 }; } catch (error) { if (productCache.get(productId)?.promise === promise) productCache.delete(productId); throw error; }
}
export function resetKerrScienceImageProductServerV343CacheForTests(): void { manifestCache = null; productCache.clear(); }
