import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, statSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import sharp from "sharp";

const root = process.cwd();
const output = resolve(root, "dist/science/atlas-visual-candidate-v562/manifest.json");
const catalog = JSON.parse(readFileSync(resolve(root, "app/data/atlasVisualCandidateAssetsV562.json"), "utf8"));
const transient = new Set(["generatedAt", "manifestSha256", "artifactSha256", "resultSha256"]);
const sha = (value) => createHash("sha256").update(value).digest("hex");
const canonical = (value) => Array.isArray(value) ? value.map(canonical) : !value || typeof value !== "object" ? value : Object.fromEntries(Object.entries(value).filter(([key]) => !transient.has(key)).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, canonical(entry)]));
const canonicalSha = (value) => sha(Buffer.from(JSON.stringify(canonical(value)), "utf8"));

function ktx2Dimensions(bytes) {
  const identifier = bytes.subarray(0, 12).toString("hex");
  if (identifier !== "ab4b5458203230bb0d0a1a0a" || bytes.byteLength < 80) throw new Error("invalid-ktx2-header");
  return { width: bytes.readUInt32LE(20), height: bytes.readUInt32LE(24) };
}

async function dimensions(spec, bytes) {
  if (spec.format === "ktx2") return ktx2Dimensions(bytes);
  const metadata = await sharp(bytes).metadata();
  if (!metadata.width || !metadata.height || metadata.format !== "jpeg") throw new Error(`invalid-jpeg:${spec.id}`);
  return { width: metadata.width, height: metadata.height };
}

const assets = [];
for (const spec of catalog) {
  if (!spec.url.startsWith("/textures/candidate-v562/") || !spec.sourcePath.startsWith("public/textures/candidate-v562/")) throw new Error(`candidate-namespace:${spec.id}`);
  const sourceBytes = readFileSync(resolve(root, spec.sourcePath));
  const originalBytes = readFileSync(resolve(root, spec.originalSourcePath));
  const observedDimensions = await dimensions(spec, sourceBytes);
  if (observedDimensions.width !== spec.expectedDimensions.width || observedDimensions.height !== spec.expectedDimensions.height) throw new Error(`candidate-dimensions:${spec.id}`);
  const sourceSha256 = sha(sourceBytes);
  const originalSourceSha256 = sha(originalBytes);
  if (sourceSha256 !== originalSourceSha256) throw new Error(`candidate-byte-copy-drift:${spec.id}`);
  assets.push({
    ...spec,
    path: spec.url,
    packId: "visual-candidate-v562",
    bytes: sourceBytes.byteLength,
    sha256: sourceSha256,
    sourceSha256,
    originalSourceSha256,
    dimensions: observedDimensions,
  });
}

const sourcePaths = [...new Set(catalog.flatMap((spec) => [spec.sourcePath, spec.originalSourcePath]))].sort((left, right) => left.localeCompare(right));
const sourceManifest = sourcePaths.map((path) => ({ path, bytes: statSync(resolve(root, path)).size, sha256: sha(readFileSync(resolve(root, path))) }));
const unsigned = {
  version: "v562-visual-candidate-ktx2-first",
  generatedAt: "2026-08-04T00:00:00Z",
  status: "candidate-qualified-history-immutable",
  visualAuthority: "candidate-only-not-v263-not-legacy-v9",
  authorityNamespace: "candidate-v562",
  conversion: {
    policy: "byte-copy-new-authority-namespace",
    jpegPreview: true,
    ktx2Primary: true,
    contentBytesPreserved: true,
    authorityIdentityPreserved: false,
  },
  assets,
  sourceManifest,
  sourceSha256: canonicalSha(sourceManifest),
  boundary: {
    formalProductPointer: "v263",
    legacyV9Mutated: false,
    candidateInheritsLegacyAuthority: false,
    historicalEvidenceRewritten: false,
    sciencePayloadWriteback: false,
    networkAttempted: false,
  },
};
const manifest = { ...unsigned, manifestSha256: canonicalSha(unsigned) };
mkdirSync(dirname(output), { recursive: true });
const partial = `${output}.${process.pid}.part`;
writeFileSync(partial, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
renameSync(partial, output);
console.log(JSON.stringify({ status: manifest.status, manifest: "dist/science/atlas-visual-candidate-v562/manifest.json", manifestSha256: manifest.manifestSha256, assets: assets.length, authorityNamespace: manifest.authorityNamespace, historicalEvidenceRewritten: false, formalProductPointer: "v263" }, null, 2));
