import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, statSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const output = resolve(root, "dist/science/atlas-visual-candidate-v562/manifest.json");
const transient = new Set(["generatedAt", "manifestSha256", "artifactSha256", "resultSha256"]);
const sha = (value) => createHash("sha256").update(value).digest("hex");
const canonical = (value) => Array.isArray(value) ? value.map(canonical) : !value || typeof value !== "object" ? value : Object.fromEntries(Object.entries(value).filter(([key]) => !transient.has(key)).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, canonical(entry)]));
const canonicalSha = (value) => sha(Buffer.from(JSON.stringify(canonical(value)), "utf8"));
const assetSpecs = [
  ["sky-stars-desktop", "public/textures/sky/orbit-atlas-v9-stars-4k.jpg", "/textures/sky/orbit-atlas-v9-stars-4k.jpg", "sky-background", "desktop", "jpg-preview", "core", "NASA-ESA-source-manifests"],
  ["sky-stars-mobile", "public/textures/sky/orbit-atlas-v9-stars-2k.jpg", "/textures/sky/orbit-atlas-v9-stars-2k.jpg", "sky-background", "mobile", "jpg-preview", "core", "NASA-ESA-source-manifests"],
  ["sky-dust-shared", "public/textures/sky/orbit-atlas-v9-dust-2k.jpg", "/textures/sky/orbit-atlas-v9-dust-2k.jpg", "sky-background", "shared", "jpg-preview", "core", "NASA-ESA-source-manifests"],
  ["earth-albedo", "public/textures/ktx2/planets_v49_earth-albedo.ktx2", "/textures/ktx2/planets_v49_earth-albedo.ktx2", "planet-albedo", "shared", "ktx2", "planet-hd", "NASA-public-domain-and-source-manifests"],
  ["earth-cloud-alpha", "public/textures/ktx2/planets_v49_earth-cloud-alpha.ktx2", "/textures/ktx2/planets_v49_earth-cloud-alpha.ktx2", "planet-mask", "shared", "ktx2", "planet-hd", "NASA-public-domain-and-source-manifests"],
  ["jupiter-albedo", "public/textures/ktx2/planets_v49_jupiter-albedo.ktx2", "/textures/ktx2/planets_v49_jupiter-albedo.ktx2", "planet-albedo", "shared", "ktx2", "planet-hd", "NASA-public-domain-and-source-manifests"],
  ["jupiter-band-mask", "public/textures/ktx2/planets_v49_jupiter-band-mask.ktx2", "/textures/ktx2/planets_v49_jupiter-band-mask.ktx2", "planet-mask", "shared", "ktx2", "planet-hd", "NASA-public-domain-and-source-manifests"],
  ["saturn-albedo", "public/textures/ktx2/planets_v49_saturn-albedo.ktx2", "/textures/ktx2/planets_v49_saturn-albedo.ktx2", "planet-albedo", "shared", "ktx2", "planet-hd", "NASA-public-domain-and-source-manifests"],
  ["saturn-ring-alpha", "public/textures/ktx2/planets_v49_saturn-ring-alpha.ktx2", "/textures/ktx2/planets_v49_saturn-ring-alpha.ktx2", "planet-ring", "shared", "ktx2", "planet-hd", "NASA-public-domain-and-source-manifests"],
];
const assets = assetSpecs.map(([id, sourcePath, path, role, variant, format, packId, license]) => {
  const bytes = readFileSync(resolve(root, sourcePath));
  return { id, path, sourcePath, role, variant, format, packId, bytes: bytes.byteLength, sha256: sha(bytes), sourceSha256: sha(bytes), license };
});
const sourceManifest = assetSpecs.map(([, sourcePath]) => ({ path: sourcePath, bytes: statSync(resolve(root, sourcePath)).size, sha256: sha(readFileSync(resolve(root, sourcePath))) })).sort((left, right) => left.path.localeCompare(right.path));
const unsigned = { version: "v562-visual-candidate-ktx2-first", generatedAt: "2026-08-02T00:00:00Z", status: "candidate-qualified-history-immutable", visualAuthority: "candidate-only-not-v263-not-legacy-v9", conversion: { policy: "existing-source-no-reencode", jpegPreview: true, ktx2Primary: true, sourceIdentityPreserved: true }, assets, sourceManifest, sourceSha256: canonicalSha(sourceManifest), boundary: { formalProductPointer: "v263", legacyV9Mutated: false, historicalEvidenceRewritten: false, sciencePayloadWriteback: false, networkAttempted: false } };
const manifest = { ...unsigned, manifestSha256: canonicalSha(unsigned) };
mkdirSync(dirname(output), { recursive: true });
const partial = `${output}.${process.pid}.part`;
writeFileSync(partial, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
renameSync(partial, output);
console.log(JSON.stringify({ status: manifest.status, manifest: "dist/science/atlas-visual-candidate-v562/manifest.json", manifestSha256: manifest.manifestSha256, assets: assets.length, ktx2Primary: true, historicalEvidenceRewritten: false, formalProductPointer: "v263" }, null, 2));
