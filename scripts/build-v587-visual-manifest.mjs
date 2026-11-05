import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, statSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import sharp from "sharp";
import * as THREE from "three";
import { KTX2Exporter } from "three/examples/jsm/exporters/KTX2Exporter.js";

const root = process.cwd();
const generatedAt = process.env.V587_GENERATED_AT ?? "2026-08-05T00:00:00Z";
const outputRoot = resolve(root, "public", "textures", "candidate-v587");
const previewRoot = resolve(outputRoot, "preview");
const ktxRoot = resolve(outputRoot, "ktx2");
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const canonicalize = (value) => Array.isArray(value)
  ? value.map(canonicalize)
  : value === null || typeof value !== "object"
    ? value
    : Object.fromEntries(Object.keys(value).sort((a, b) => a.localeCompare(b)).map((key) => [key, canonicalize(value[key])]));
const canonicalSha = (value) => sha256(Buffer.from(JSON.stringify(canonicalize(value)), "utf8"));

mkdirSync(previewRoot, { recursive: true });
mkdirSync(ktxRoot, { recursive: true });

const variants = [
  {
    id: "observatory-cinematic-desktop",
    variant: "desktop",
    sourcePath: "public/textures/candidate-v587/source/orbit-atlas-kerr-cinematic-v587.png",
    width: 1600,
    height: 900,
    colorSpace: "srgb",
    compression: "ktx2-uncompressed-reference",
  },
  {
    id: "observatory-cinematic-mobile",
    variant: "mobile",
    sourcePath: "public/textures/candidate-v587/source/orbit-atlas-kerr-cinematic-v587.png",
    width: 960,
    height: 540,
    colorSpace: "srgb",
    compression: "ktx2-uncompressed-reference",
  },
];

const exporter = new KTX2Exporter();
const assets = [];
for (const spec of variants) {
  const sourceAbsolute = resolve(root, spec.sourcePath);
  const sourceBytes = readFileSync(sourceAbsolute);
  const resized = await sharp(sourceBytes)
    .resize(spec.width, spec.height, { fit: "fill" })
    .jpeg({ quality: 88, progressive: false, chromaSubsampling: "4:4:4" })
    .toBuffer();
  const raw = await sharp(resized).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const texture = new THREE.DataTexture(raw.data, raw.info.width, raw.info.height, THREE.RGBAFormat, THREE.UnsignedByteType);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  const ktxBytes = await exporter.parse(texture);
  texture.dispose();
  const ktxBuffer = Buffer.from(ktxBytes.buffer, ktxBytes.byteOffset, ktxBytes.byteLength);
  const previewPath = resolve(previewRoot, `${spec.id}.jpg`);
  const ktxPath = resolve(ktxRoot, `${spec.id}.ktx2`);
  writeFileSync(previewPath, resized);
  writeFileSync(ktxPath, ktxBuffer);
  assets.push({
    id: spec.id,
    variant: spec.variant,
    role: "cinematic-hero-background-layer",
    ktx2: `/textures/candidate-v587/ktx2/${spec.id}.ktx2`,
    preview: `/textures/candidate-v587/preview/${spec.id}.jpg`,
    sourcePath: spec.sourcePath,
    sourceBytes: sourceBytes.byteLength,
    sourceSha256: sha256(sourceBytes),
    output: {
      ktx2Bytes: ktxBuffer.byteLength,
      ktx2Sha256: sha256(ktxBuffer),
      previewBytes: resized.byteLength,
      previewSha256: sha256(resized),
      dimensions: { width: raw.info.width, height: raw.info.height },
      colorSpace: spec.colorSpace,
      compression: spec.compression,
    },
    license: {
      id: "openai-image-generation-user-directed-presentation-output",
      url: "https://openai.com/policies/terms-of-use/",
    },
    provenance: {
      relationship: "selected-concept-reference-to-clean-cinematic-hero-then-deterministic-resize-and-ktx2-packaging",
      sourceReferenceSha256: "28fa32af6b30c24248b2ddb0de5fd584504814e7e1eab8b9422920e251851f54",
      generationModel: "gpt-image-2",
      historicalAuthorityInherited: false,
      scientificPayload: false,
    },
  });
}

const unsigned = {
  version: "v587-visual-candidate-ktx2-first-v1",
  generatedAt,
  status: "candidate-only-presentation-layer",
  authorityNamespace: "candidate-v587",
  visualAuthority: "not-v263-not-legacy-v9-not-v562",
  conversion: {
    policy: "new-namespace-derived-presentation-copy",
    ktx2Primary: true,
    jpegCompatibilityPreview: true,
    desktopMaxDimension: 1600,
    mobileMaxDimension: 960,
    scientificFloatFieldsCompressed: false,
  },
  assets,
  boundary: {
    formalProductPointer: "v263",
    historicalV9Rewritten: false,
    v562Rewritten: false,
    sciencePayloadWriteback: false,
    cinematicOnlyConsumption: true,
    productionPromotionAllowed: false,
  },
};
const manifest = { ...unsigned, manifestSha256: canonicalSha(unsigned) };
const manifestPath = resolve(root, "public", "data", "kerr-observation-v587", "visual-manifest.json");
mkdirSync(resolve(manifestPath, ".."), { recursive: true });
const part = `${manifestPath}.${process.pid}.part`;
writeFileSync(part, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
renameSync(part, manifestPath);
console.log(JSON.stringify({
  status: manifest.status,
  manifestSha256: manifest.manifestSha256,
  assets: assets.map((asset) => ({ id: asset.id, ktx2Bytes: asset.output.ktx2Bytes, ktx2Sha256: asset.output.ktx2Sha256 })),
  manifestBytes: statSync(manifestPath).size,
  formalProductPointer: "v263",
}, null, 2));
