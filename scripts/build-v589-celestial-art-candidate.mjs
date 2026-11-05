import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, relative, resolve } from "node:path";
import sharp from "sharp";

const root = process.cwd();
const generatedAt = process.env.V589_GENERATED_AT ?? "2026-08-09T08:30:00Z";
const dataRoot = resolve(root, "public/data/celestial-art-v589");
const textureRoot = resolve(root, "public/textures/candidate-v589/lite");
const docsRoot = resolve(root, "docs/release/v589");
const tempRoot = resolve(root, "tmp/v589-celestial-art-build");
const manifestPath = resolve(dataRoot, "manifest.json");
const generatedConstantsPath = resolve(root, "app/data/celestialArtManifestV589.generated.ts");
const toktx = resolve(root, "tools/ktx/4.4.2/bin/toktx.exe");
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
}

const canonicalSha = (value) => sha256(Buffer.from(JSON.stringify(canonical(value)), "utf8"));

function atomicWrite(path, bytes) {
  mkdirSync(dirname(path), { recursive: true });
  const partial = `${path}.${process.pid}.part`;
  writeFileSync(partial, bytes);
  renameSync(partial, path);
}

function fileRecord(path) {
  if (!existsSync(path)) return { exists: false, bytes: 0, sha256: null };
  const bytes = readFileSync(path);
  return { exists: true, bytes: bytes.byteLength, sha256: sha256(bytes) };
}

function readGlbJson(path) {
  const bytes = readFileSync(path);
  if (bytes.byteLength < 20 || bytes.readUInt32LE(0) !== 0x46546c67 || bytes.readUInt32LE(4) !== 2) {
    throw new Error(`v589-glb-header:${path}`);
  }
  let offset = 12;
  while (offset + 8 <= bytes.byteLength) {
    const chunkLength = bytes.readUInt32LE(offset);
    const chunkType = bytes.readUInt32LE(offset + 4);
    offset += 8;
    if (offset + chunkLength > bytes.byteLength) throw new Error(`v589-glb-chunk:${path}`);
    if (chunkType === 0x4e4f534a) {
      return JSON.parse(bytes.subarray(offset, offset + chunkLength).toString("utf8").replace(/\u0000+$/g, ""));
    }
    offset += chunkLength;
  }
  throw new Error(`v589-glb-json:${path}`);
}

function inspectGlb(path, lod) {
  const bytes = readFileSync(path);
  const json = readGlbJson(path);
  const accessors = Array.isArray(json.accessors) ? json.accessors : [];
  let vertexCount = 0;
  let triangleCount = 0;
  let normalAttributeCount = 0;
  const min = [Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY];
  const max = [Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY];
  for (const mesh of json.meshes ?? []) {
    for (const primitive of mesh.primitives ?? []) {
      const positionIndex = primitive.attributes?.POSITION;
      const position = positionIndex === undefined ? null : accessors[positionIndex];
      if (!position || !Number.isFinite(position.count)) throw new Error(`v589-glb-position:${path}`);
      vertexCount += Number(position.count);
      if (primitive.attributes?.NORMAL !== undefined) normalAttributeCount += 1;
      const indexAccessor = primitive.indices === undefined ? null : accessors[primitive.indices];
      const elementCount = Number(indexAccessor?.count ?? position.count);
      if ((primitive.mode ?? 4) === 4) triangleCount += Math.floor(elementCount / 3);
      const normalizedDivisor = position.normalized === true
        ? ({ 5120: 127, 5121: 255, 5122: 32767, 5123: 65535 }[position.componentType] ?? 1)
        : 1;
      for (let axis = 0; axis < 3; axis += 1) {
        const lo = Math.max(-1, Number(position.min?.[axis]) / normalizedDivisor);
        const hi = Math.min(1, Number(position.max?.[axis]) / normalizedDivisor);
        if (Number.isFinite(lo)) min[axis] = Math.min(min[axis], lo);
        if (Number.isFinite(hi)) max[axis] = Math.max(max[axis], hi);
      }
    }
  }
  if (vertexCount <= 0 || triangleCount <= 0 || normalAttributeCount === 0) throw new Error(`v589-glb-geometry:${path}`);
  const extensions = new Set([...(json.extensionsUsed ?? []), ...(json.extensionsRequired ?? [])]);
  if (!extensions.has("EXT_meshopt_compression")) throw new Error(`v589-glb-meshopt:${path}`);
  if (!min.every(Number.isFinite) || !max.every(Number.isFinite)) throw new Error(`v589-glb-bounds:${path}`);
  if (Math.max(...max.map((value) => Math.abs(value)), ...min.map((value) => Math.abs(value))) > 1.01) {
    throw new Error(`v589-glb-normalized-bounds:${path}`);
  }
  return {
    path: relative(root, path).replaceAll("\\", "/"),
    bytes: bytes.byteLength,
    sha256: sha256(bytes),
    lod,
    vertexCount,
    triangleCount,
    normals: true,
    meshopt: true,
    bounds: [min, max],
    pivot: "bounds-midpoint",
    units: "normalized-diameter-2",
    rotationAxis: "source-frame-y-up",
  };
}

function buildBennuModelAssets() {
  const acquisitionPath = resolve(docsRoot, "acquisition-receipt-v589.json");
  const acquisition = JSON.parse(readFileSync(acquisitionPath, "utf8"));
  const sourceResult = (acquisition.results ?? []).find((entry) => entry.id === "bennu-model-source" && ["acquired", "existing-verified-no-network"].includes(entry.status));
  if (!sourceResult) return { assets: [], receipt: null };
  const sourcePath = resolve(root, sourceResult.destination);
  const sourceRecord = fileRecord(sourcePath);
  if (!sourceRecord.exists || sourceRecord.bytes !== sourceResult.bytes || sourceRecord.sha256 !== sourceResult.sha256) {
    throw new Error("v589-bennu-source-receipt-mismatch");
  }
  const modelRoot = resolve(root, "public/models/candidate-v589/bennu");
  const lodPaths = [0, 1, 2].map((lod) => resolve(modelRoot, `bennu-lod${lod}.glb`));
  const lods = lodPaths.map((path, lod) => inspectGlb(path, lod));
  const unsignedReceipt = {
    version: "v589-bennu-lod-receipt-v1",
    body: "bennu",
    source: {
      url: sourceResult.finalUrl ?? "https://svs.gsfc.nasa.gov/5069/",
      path: sourceResult.destination,
      bytes: sourceRecord.bytes,
      sha256: sourceRecord.sha256,
      license: sourceResult.license,
      licenseUrl: sourceResult.licenseUrl,
    },
    pipeline: {
      import: "trimesh",
      importVersion: "4.12.2",
      transform: "glTF-Transform",
      transformVersion: "4.4.2",
      operations: ["weld", "simplify", "meshopt", "quantize"],
      deterministic: true,
      stablePivot: "bounds-midpoint",
      generatedNormals: true,
    },
    lods,
    presentationOnly: true,
  };
  const receipt = { ...unsignedReceipt, receiptSha256: canonicalSha(unsignedReceipt) };
  const receiptPath = resolve(docsRoot, "bennu-lod-receipt-v589.json");
  atomicWrite(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`);
  const modelVariants = Object.fromEntries(lods.map((lod) => [`lod${lod.lod}`, {
    url: `/models/candidate-v589/bennu/bennu-lod${lod.lod}.glb`,
    bytes: lod.bytes,
    sha256: lod.sha256,
    width: 1,
    height: 1,
    format: "glb",
    colorSpace: "not-applicable",
    compression: "meshopt+quantized",
    lod: lod.lod,
  }]));
  const asset = {
    id: "bennu-model",
    body: "bennu",
    role: "model-glb-screen-space-lod",
    sourceUrl: sourceResult.finalUrl ?? "https://svs.gsfc.nasa.gov/5069/",
    sourceHost: "svs.gsfc.nasa.gov",
    license: { id: "NASA-public-domain", url: sourceResult.licenseUrl },
    sourceBytes: sourceRecord.bytes,
    sourceSha256: sourceRecord.sha256,
    derivation: {
      tool: "trimesh+glTF-Transform",
      version: "trimesh-4.12.2;gltf-transform-4.4.2",
      parameters: `LOD0/1/2; meshopt+quantized; normals=true; pivot=bounds-midpoint; receipt=${receipt.receiptSha256}`,
    },
    variants: {
      fullDesktop: modelVariants.lod0,
      fullMobile: modelVariants.lod1,
      liteDesktop: modelVariants.lod1,
      liteMobile: modelVariants.lod2,
    },
    presentationOnly: true,
  };
  return { assets: [asset], receipt };
}

function runTool(executable, args, label) {
  const result = spawnSync(executable, args, { cwd: root, encoding: "utf8", windowsHide: true, maxBuffer: 32 * 1024 * 1024 });
  if (result.status !== 0) throw new Error(`${label}:${result.status}:${result.stderr || result.stdout}`);
}

function parseConstellations() {
  const source = readFileSync(resolve(root, "app/data/constellationCatalog.ts"), "utf8");
  const rows = [];
  const objectPattern = /\{\s*iauCode:\s*"([^"]+)"[\s\S]*?name:\s*"([^"]+)"[\s\S]*?waypoints:\s*\[([\s\S]*?)\]\s*\}/g;
  for (const match of source.matchAll(objectPattern)) {
    const waypoints = [...match[3].matchAll(/\[\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\]/g)]
      .map((point) => [Number(point[1]), Number(point[2])]);
    if (waypoints.length > 0) rows.push({ iauCode: match[1], name: match[2], waypoints });
  }
  if (rows.length !== 88 || rows.reduce((sum, entry) => sum + entry.waypoints.length, 0) !== 484) {
    throw new Error(`v589-constellation-catalog:${rows.length}:${rows.reduce((sum, entry) => sum + entry.waypoints.length, 0)}`);
  }
  return rows;
}

function unitVector(raDeg, decDeg) {
  const ra = raDeg * Math.PI / 180;
  const dec = decDeg * Math.PI / 180;
  return [Math.cos(dec) * Math.cos(ra), Math.sin(dec), Math.cos(dec) * Math.sin(ra)];
}

function angularDistance(left, right) {
  const cosine = Math.max(-1, Math.min(1, left[0] * right[0] + left[1] * right[1] + left[2] * right[2]));
  return Math.acos(cosine) * 180 / Math.PI;
}

function buildGaiaAndBindings() {
  const sourcePath = resolve(root, "public/data/gaia-dr3-nearby-46000-v255.json");
  const sourceBytes = readFileSync(sourcePath);
  const stars = JSON.parse(sourceBytes.toString("utf8"));
  if (!Array.isArray(stars) || stars.length !== 46_000) throw new Error("v589-gaia-lite-row-count");
  const binary = Buffer.alloc(stars.length * 24);
  const directions = new Array(stars.length);
  stars.forEach((star, index) => {
    const offset = index * 24;
    const sourceId = BigInt(star.sourceId);
    const ra = ((Number(star.raDeg) % 360) + 360) % 360;
    const dec = Math.max(-90, Math.min(90, Number(star.decDeg)));
    const mag = Math.max(-5, Math.min(60.535, Number(star.magG)));
    const color = star.colorBpRp == null || !Number.isFinite(Number(star.colorBpRp))
      ? -0x8000
      : Math.max(-0x7fff, Math.min(0x7fff, Math.round(Number(star.colorBpRp) * 1000)));
    binary.writeBigUInt64LE(sourceId, offset);
    binary.writeUInt32LE(Math.min(0xffff_ffff, Math.floor(ra / 360 * 0x1_0000_0000)), offset + 8);
    binary.writeUInt32LE(Math.round((dec + 90) / 180 * 0xffff_ffff), offset + 12);
    binary.writeUInt16LE(Math.round((mag + 5) * 1000), offset + 16);
    binary.writeInt16LE(color, offset + 18);
    binary.writeFloatLE(Number.isFinite(Number(star.parallaxMas)) ? Number(star.parallaxMas) : Number.NaN, offset + 20);
    directions[index] = unitVector(ra, dec);
  });
  const binaryPath = resolve(dataRoot, "gaia-lite-46000-v589.bin");
  atomicWrite(binaryPath, binary);

  const constellations = parseConstellations();
  const allDistances = [];
  const bindings = constellations.map((constellation) => ({
    iauCode: constellation.iauCode,
    name: constellation.name,
    presentationOnly: true,
    waypoints: constellation.waypoints.map(([raDeg, decDeg], waypointIndex) => {
      const target = unitVector(raDeg, decDeg);
      let bestIndex = -1;
      let bestDistance = Number.POSITIVE_INFINITY;
      for (let starIndex = 0; starIndex < stars.length; starIndex += 1) {
        const distance = angularDistance(target, directions[starIndex]);
        if (distance < bestDistance) {
          bestDistance = distance;
          bestIndex = starIndex;
        }
      }
      if (bestIndex < 0 || bestDistance > 1.5) throw new Error(`v589-constellation-anchor:${constellation.iauCode}:${waypointIndex}:${bestDistance}`);
      const star = stars[bestIndex];
      allDistances.push(bestDistance);
      return {
        waypointIndex,
        sourceId: String(star.sourceId),
        inputRaDeg: raDeg,
        inputDecDeg: decDeg,
        anchorRaDeg: Number(star.raDeg),
        anchorDecDeg: Number(star.decDeg),
        angularDistanceDeg: Number(bestDistance.toFixed(9)),
      };
    }),
  }));
  const sortedDistances = [...allDistances].sort((left, right) => left - right);
  const unsigned = {
    version: "v589-constellation-gaia-binding-v1",
    generatedAt,
    sourceCatalog: {
      path: "public/data/gaia-dr3-nearby-46000-v255.json",
      rows: stars.length,
      bytes: sourceBytes.byteLength,
      sha256: sha256(sourceBytes),
    },
    binaryCatalog: {
      path: "/data/celestial-art-v589/gaia-lite-46000-v589.bin",
      recordBytes: 24,
      rows: stars.length,
      bytes: binary.byteLength,
      sha256: sha256(binary),
    },
    constellationCount: bindings.length,
    waypointCount: allDistances.length,
    maximumAngularDistanceDeg: Math.max(...allDistances),
    medianAngularDistanceDeg: sortedDistances[Math.floor(sortedDistances.length / 2)],
    thresholdDeg: 1.5,
    bindings,
    presentationOnly: true,
  };
  const sealed = { ...unsigned, bindingSha256: canonicalSha(unsigned) };
  const bindingPath = resolve(dataRoot, "constellation-gaia-bindings-v589.json");
  atomicWrite(bindingPath, `${JSON.stringify(sealed, null, 2)}\n`);
  return {
    sourceBytes,
    binary,
    binarySha256: sha256(binary),
    bindingBytes: readFileSync(bindingPath),
    bindingSha256: sealed.bindingSha256,
    maximumAngularDistanceDeg: unsigned.maximumAngularDistanceDeg,
    medianAngularDistanceDeg: unsigned.medianAngularDistanceDeg,
  };
}

const REUSED_V588_IDS = [
  "earth-albedo", "earth-roughness", "earth-clouds", "earth-cloud-alpha", "earth-night", "earth-night-mask",
  "mars-albedo", "mars-roughness",
  "jupiter-albedo", "jupiter-band-mask", "jupiter-roughness",
  "saturn-albedo", "saturn-band-mask", "saturn-ring-color", "saturn-ring-alpha", "saturn-roughness",
];

async function buildTextureVariants() {
  const manifest = JSON.parse(readFileSync(resolve(root, "public/data/visual-restoration-v588/manifest.json"), "utf8"));
  const built = [];
  for (const id of REUSED_V588_IDS) {
    const source = manifest.assets.find((asset) => asset.id === id);
    if (!source) throw new Error(`v589-v588-source-missing:${id}`);
    const sourcePath = resolve(root, "public", source.fallback.desktop.url.slice(1).replaceAll("/", "\\"));
    const sourceBytes = readFileSync(sourcePath);
    const colorSpace = source.colorSpace === "linear" ? "linear" : "srgb";
    const variants = {};
    for (const [variantName, width] of [["liteDesktop", 1024], ["liteMobile", 512]]) {
      const image = sharp(sourceBytes).resize({ width, withoutEnlargement: true, kernel: sharp.kernel.lanczos3 });
      const output = colorSpace === "linear"
        ? await image.webp({ lossless: true, effort: 6 }).toBuffer()
        : await image.webp({ quality: 88, effort: 6, smartSubsample: true }).toBuffer();
      const outputPath = resolve(textureRoot, variantName === "liteDesktop" ? "desktop" : "mobile", `${id}.webp`);
      atomicWrite(outputPath, output);
      const metadata = await sharp(output).metadata();
      variants[variantName] = {
        url: `/textures/candidate-v589/lite/${variantName === "liteDesktop" ? "desktop" : "mobile"}/${id}.webp`,
        bytes: output.byteLength,
        sha256: sha256(output),
        width: metadata.width,
        height: metadata.height,
        format: "webp",
        colorSpace,
        compression: colorSpace === "linear" ? "webp-lossless" : "webp-quality-88",
      };
    }
    const pngPath = resolve(tempRoot, `${id}.png`);
    mkdirSync(dirname(pngPath), { recursive: true });
    await sharp(sourceBytes).resize({ width: 1024, withoutEnlargement: true }).png().toFile(pngPath);
    const ktxPath = resolve(textureRoot, "ktx2", `${id}.ktx2`);
    mkdirSync(dirname(ktxPath), { recursive: true });
    const partial = `${ktxPath}.${process.pid}.part`;
    const args = colorSpace === "linear"
      ? ["--t2", "--encode", "uastc", "--uastc_quality", "2", "--zcmp", "10", "--genmipmap", "--assign_oetf", "linear", partial, pngPath]
      : ["--t2", "--encode", "etc1s", "--qlevel", "164", "--genmipmap", "--assign_oetf", "srgb", partial, pngPath];
    runTool(toktx, args, `v589-ktx2:${id}`);
    renameSync(partial, ktxPath);
    const ktxBytes = readFileSync(ktxPath);
    const pngMetadata = await sharp(pngPath).metadata();
    variants.fullDesktop = {
      url: `/textures/candidate-v589/lite/ktx2/${id}.ktx2`,
      bytes: ktxBytes.byteLength,
      sha256: sha256(ktxBytes),
      width: pngMetadata.width,
      height: pngMetadata.height,
      format: "ktx2",
      colorSpace,
      compression: colorSpace === "linear" ? "uastc-zstd-mipmapped" : "etc1s-mipmapped",
    };
    built.push({
      id,
      body: source.body,
      role: source.role,
      sourceUrl: `local-admitted-v588://${id}`,
      sourceHost: "local-admitted-v588",
      license: {
        id: "NASA-public-domain",
        url: source.license.url,
      },
      sourceBytes: sourceBytes.byteLength,
      sourceSha256: sha256(sourceBytes),
      derivation: {
        tool: "sharp+KTX-Software",
        version: `sharp-${sharp.versions.sharp};ktx-4.4.2`,
        parameters: colorSpace === "linear" ? "1024/512 WebP lossless; UASTC q2 zstd10" : "1024/512 WebP q88; ETC1S q164",
      },
      variants,
      presentationOnly: true,
    });
  }
  return built;
}

async function buildAcquiredTextures() {
  const receiptPath = resolve(docsRoot, "acquisition-receipt-v589.json");
  if (!existsSync(receiptPath)) return [];
  const receipt = JSON.parse(readFileSync(receiptPath, "utf8"));
  const registry = JSON.parse(readFileSync(resolve(root, "scripts/v589-visual-sources.json"), "utf8"));
  const built = [];
  for (const result of receipt.results ?? []) {
    if (!["acquired", "existing-verified-no-network"].includes(result.status)) continue;
    const sourceSpec = registry.sources.find((source) => source.id === result.id);
    if (!sourceSpec || !["albedo", "regolith-diffuse", "regolith-normal", "regolith-roughness"].includes(sourceSpec.role)) continue;
    const sourcePath = resolve(root, sourceSpec.destination);
    const sourceBytes = readFileSync(sourcePath);
    const id = sourceSpec.role === "regolith-diffuse"
      ? "regolith-cc0"
      : sourceSpec.role === "regolith-normal"
        ? "regolith-normal-cc0"
        : sourceSpec.role === "regolith-roughness"
          ? "regolith-roughness-cc0"
          : `${sourceSpec.body}-${sourceSpec.role}`;
    const isLinear = sourceSpec.role === "height" || sourceSpec.role === "regolith-normal" || sourceSpec.role === "regolith-roughness";
    const isDiffuse = sourceSpec.role === "regolith-diffuse";
    const variants = {};
    for (const [variantName, width] of [["liteDesktop", 1024], ["liteMobile", 512]]) {
      const deliveryWidth = sourceSpec.role === "regolith-normal" && variantName === "liteDesktop" ? 992 : width;
      const output = await sharp(sourceBytes)
        .resize({ width: deliveryWidth, withoutEnlargement: true, kernel: sharp.kernel.lanczos3 })
        .webp(isLinear ? { lossless: true, effort: 6 } : { quality: isDiffuse ? 92 : 90, effort: 6, smartSubsample: true })
        .toBuffer();
      const outputPath = resolve(textureRoot, variantName === "liteDesktop" ? "desktop" : "mobile", `${id}.webp`);
      atomicWrite(outputPath, output);
      const metadata = await sharp(output).metadata();
      variants[variantName] = {
        url: `/textures/candidate-v589/lite/${variantName === "liteDesktop" ? "desktop" : "mobile"}/${id}.webp`,
        bytes: output.byteLength,
        sha256: sha256(output),
        width: metadata.width,
        height: metadata.height,
        format: "webp",
        colorSpace: isLinear ? "linear" : "srgb",
        compression: isLinear ? "webp-lossless" : `webp-quality-${isDiffuse ? 92 : 90}`,
      };
    }
    const ktxInput = resolve(tempRoot, `${id}-acquired.png`);
    await sharp(sourceBytes).resize({ width: 1024, withoutEnlargement: true, kernel: sharp.kernel.lanczos3 }).png().toFile(ktxInput);
    const ktxOutput = resolve(textureRoot, "ktx2", `${id}.ktx2`);
    mkdirSync(dirname(ktxOutput), { recursive: true });
    const ktxPartial = `${ktxOutput}.${process.pid}.part`;
    const ktxArgs = isLinear
      ? ["--t2", "--encode", "uastc", "--uastc_quality", "2", "--zcmp", "10", "--genmipmap", "--assign_oetf", "linear", ktxPartial, ktxInput]
      : ["--t2", "--encode", "etc1s", "--qlevel", "164", "--genmipmap", "--assign_oetf", "srgb", ktxPartial, ktxInput];
    runTool(toktx, ktxArgs, `v589-acquired-ktx2:${id}`);
    renameSync(ktxPartial, ktxOutput);
    const ktxBytes = readFileSync(ktxOutput);
    const ktxMetadata = await sharp(ktxInput).metadata();
    variants.fullDesktop = {
      url: `/textures/candidate-v589/lite/ktx2/${id}.ktx2`,
      bytes: ktxBytes.byteLength,
      sha256: sha256(ktxBytes),
      width: ktxMetadata.width,
      height: ktxMetadata.height,
      format: "ktx2",
      colorSpace: isLinear ? "linear" : "srgb",
      compression: isLinear ? "uastc-q2-zstd10-mipmapped" : "etc1s-q164-mipmapped",
    };
    built.push({
      id,
      body: sourceSpec.body,
      role: sourceSpec.role,
      sourceUrl: sourceSpec.url,
      sourceHost: new URL(sourceSpec.url).hostname,
      license: { id: sourceSpec.license, url: sourceSpec.licenseUrl },
      sourceBytes: sourceBytes.byteLength,
      sourceSha256: sha256(sourceBytes),
      derivation: { tool: "sharp", version: sharp.versions.sharp, parameters: "1024/512 deterministic WebP variants" },
      variants,
      presentationOnly: true,
    });
  }

  const heightDerivations = [
    { body: "moon", sourceId: "moon-height-source", normalStrength: 3.2, deriveRoughness: true },
    { body: "earth", sourceId: "earth-height-source", normalStrength: 2.2, deriveRoughness: false },
  ];
  for (const heightSpec of heightDerivations) {
    const heightResult = (receipt.results ?? []).find((entry) => entry.id === heightSpec.sourceId && ["acquired", "existing-verified-no-network"].includes(entry.status));
    const heightSource = registry.sources.find((entry) => entry.id === heightSpec.sourceId);
    if (!heightResult || !heightSource) continue;
    const heightPath = resolve(root, heightSource.destination);
    const sourceBytes = readFileSync(heightPath);
    const { data, info } = await sharp(sourceBytes)
      .resize(1024, 512, { fit: "fill", kernel: sharp.kernel.lanczos3 })
      .greyscale()
      .normalise()
      .raw({ depth: "uchar" })
      .toBuffer({ resolveWithObject: true });
    const normal = Buffer.alloc(info.width * info.height * 3);
    const roughness = Buffer.alloc(info.width * info.height);
    const sample = (x, y) => data[((y + info.height) % info.height) * info.width * info.channels + ((x + info.width) % info.width) * info.channels];
    for (let y = 0; y < info.height; y += 1) {
      for (let x = 0; x < info.width; x += 1) {
        const dx = (sample(x + 1, y) - sample(x - 1, y)) / 255;
        const dy = (sample(x, y + 1) - sample(x, y - 1)) / 255;
        const nx = -dx * heightSpec.normalStrength;
        const ny = dy * heightSpec.normalStrength;
        const nz = 1;
        const length = Math.hypot(nx, ny, nz);
        const pixel = y * info.width + x;
        normal[pixel * 3] = Math.round((nx / length * 0.5 + 0.5) * 255);
        normal[pixel * 3 + 1] = Math.round((ny / length * 0.5 + 0.5) * 255);
        normal[pixel * 3 + 2] = Math.round((nz / length * 0.5 + 0.5) * 255);
        roughness[pixel] = Math.round(Math.max(196, Math.min(248, 216 + Math.hypot(dx, dy) * 120)));
      }
    }
    const derived = [
      { id: `${heightSpec.body}-normal`, role: "normal", buffer: normal, channels: 3 },
      ...(heightSpec.deriveRoughness ? [{ id: `${heightSpec.body}-roughness`, role: "roughness", buffer: roughness, channels: 1 }] : []),
    ];
    for (const spec of derived) {
      const sourcePng = await sharp(spec.buffer, { raw: { width: info.width, height: info.height, channels: spec.channels } }).png().toBuffer();
      const variants = {};
      for (const [variantName, width] of [["liteDesktop", 1024], ["liteMobile", 512]]) {
        const output = await sharp(sourcePng).resize({ width, withoutEnlargement: true, kernel: sharp.kernel.lanczos3 }).webp({ lossless: true, effort: 6 }).toBuffer();
        const outputPath = resolve(textureRoot, variantName === "liteDesktop" ? "desktop" : "mobile", `${spec.id}.webp`);
        atomicWrite(outputPath, output);
        const metadata = await sharp(output).metadata();
        variants[variantName] = {
          url: `/textures/candidate-v589/lite/${variantName === "liteDesktop" ? "desktop" : "mobile"}/${spec.id}.webp`,
          bytes: output.byteLength,
          sha256: sha256(output),
          width: metadata.width,
          height: metadata.height,
          format: "webp",
          colorSpace: "linear",
          compression: "webp-lossless",
        };
      }
      const inputPath = resolve(tempRoot, `${spec.id}.png`);
      atomicWrite(inputPath, sourcePng);
      const ktxPath = resolve(textureRoot, "ktx2", `${spec.id}.ktx2`);
      const partial = `${ktxPath}.${process.pid}.part`;
      runTool(toktx, ["--t2", "--encode", "uastc", "--uastc_quality", "2", "--zcmp", "10", "--genmipmap", "--assign_oetf", "linear", partial, inputPath], `v589-derived-ktx2:${spec.id}`);
      renameSync(partial, ktxPath);
      const ktxBytes = readFileSync(ktxPath);
      variants.fullDesktop = {
        url: `/textures/candidate-v589/lite/ktx2/${spec.id}.ktx2`,
        bytes: ktxBytes.byteLength,
        sha256: sha256(ktxBytes),
        width: info.width,
        height: info.height,
        format: "ktx2",
        colorSpace: "linear",
        compression: "uastc-q2-zstd10-mipmapped",
      };
      built.push({
        id: spec.id,
        body: heightSpec.body,
        role: spec.role,
        sourceUrl: heightSource.url,
        sourceHost: new URL(heightSource.url).hostname,
        license: { id: heightSource.license, url: heightSource.licenseUrl },
        sourceBytes: sourceBytes.byteLength,
        sourceSha256: sha256(sourceBytes),
        derivation: { tool: "sharp+v589-sobel-normal+KTX-Software", version: `sharp-${sharp.versions.sharp};ktx-4.4.2`, parameters: spec.role === "normal" ? `central-gradient strength=${heightSpec.normalStrength}; 1024x512; UASTC q2` : "DEM gradient roughness 196..248; 1024x512; UASTC q2" },
        variants,
        presentationOnly: true,
      });
    }
  }
  return built;
}

function buildFreezeBefore() {
  const previousPath = resolve(root, "docs/release/v588/freeze-after-v588.json");
  const previousBytes = readFileSync(previousPath);
  const previous = JSON.parse(previousBytes.toString("utf8"));
  for (const expected of previous.frozenSnapshot) {
    const observed = fileRecord(resolve(root, expected.path));
    if (observed.exists !== expected.exists || observed.bytes !== expected.bytes || observed.sha256 !== expected.sha256) {
      throw new Error(`v589-frozen-history-drift:${expected.path}`);
    }
  }
  const additivePaths = [
    "docs/release/v588/freeze-after-v588.json",
    "docs/release/v588/capability-report-v588.json",
    "public/data/visual-restoration-v588/manifest.json",
    "app/lib/visualRestorationV588.ts",
    "app/lib/useV588Texture.ts",
    "app/components/VisualRestorationStageV588.tsx",
    "app/components/OrbitAtlasVisualRestorationV588.tsx",
    "app/local-shadow-v588/page.tsx",
    "docs/release/v587/current-state-receipt-v587.json",
    "public/data/kerr-observation-v587/manifest.json",
  ];
  const additiveSnapshot = additivePaths.map((path) => ({ path, ...fileRecord(resolve(root, path)) }));
  const unsigned = {
    version: "v589-frozen-boundary-before-v1",
    generatedAt,
    status: "passed-v263-v9-v559-v560-v562-v587-v588-byte-identical-before-v589",
    priorFreezeAfter: { path: "docs/release/v588/freeze-after-v588.json", bytes: previousBytes.byteLength, sha256: sha256(previousBytes) },
    formalProductPointer: "v263",
    defaultKernel: "legacy-eih-1pn",
    historicalEvidenceRewritten: false,
    inheritedFrozenSnapshot: previous.frozenSnapshot,
    additiveSnapshot,
  };
  const receipt = { ...unsigned, snapshotSha256: canonicalSha(unsigned) };
  atomicWrite(resolve(docsRoot, "freeze-before-v589.json"), `${JSON.stringify(receipt, null, 2)}\n`);
  return receipt;
}

function validateAssetHosts(assets) {
  const allowed = new Set(["local-admitted-v588", "assets.science.nasa.gov", "eoimages.gsfc.nasa.gov", "neo.gsfc.nasa.gov", "svs.gsfc.nasa.gov", "planetarymaps.usgs.gov", "astrogeology.usgs.gov", "pds.nasa.gov", "nasa3d.arc.nasa.gov", "polyhaven.com", "dl.polyhaven.org", "local-existing-gaia"]);
  for (const asset of assets) {
    if (!allowed.has(asset.sourceHost)) throw new Error(`v589-asset-host:${asset.id}:${asset.sourceHost}`);
    if (!["NASA-public-domain", "USGS-public-domain", "PDS-public-domain", "Poly-Haven-CC0", "Gaia-existing-admission"].includes(asset.license.id)) {
      throw new Error(`v589-asset-license:${asset.id}:${asset.license.id}`);
    }
  }
}

rmSync(tempRoot, { recursive: true, force: true });
mkdirSync(tempRoot, { recursive: true });
const freeze = buildFreezeBefore();
const gaia = buildGaiaAndBindings();
const bennuModels = buildBennuModelAssets();
const textureAssets = [...await buildTextureVariants(), ...await buildAcquiredTextures()];
const gaiaSourcePath = resolve(root, "public/data/gaia-dr3-nearby-46000-v255.json");
const gaiaAsset = {
  id: "gaia-lite-46000",
  body: "stars",
  role: "catalog",
  sourceUrl: "local-existing-gaia://gaia-dr3-nearby-46000-v255",
  sourceHost: "local-existing-gaia",
  license: { id: "Gaia-existing-admission", url: "https://www.cosmos.esa.int/web/gaia-users/license" },
  sourceBytes: statSync(gaiaSourcePath).size,
  sourceSha256: sha256(readFileSync(gaiaSourcePath)),
  derivation: { tool: "node-buffer", version: process.version, parameters: "24-byte Gaia v9-compatible record; deterministic order" },
  variants: {
    liteDesktop: { url: "/data/celestial-art-v589/gaia-lite-46000-v589.bin", bytes: gaia.binary.byteLength, sha256: gaia.binarySha256, width: 46_000, height: 1, format: "bin", colorSpace: "not-applicable", compression: "packed-24-byte-record" },
    liteMobile: { url: "/data/celestial-art-v589/gaia-lite-46000-v589.bin", bytes: gaia.binary.byteLength, sha256: gaia.binarySha256, width: 46_000, height: 1, format: "bin", colorSpace: "not-applicable", compression: "packed-24-byte-record" },
  },
  presentationOnly: true,
};
const gaiaFullManifestPath = resolve(root, "public/data/gaia-dr3-presentation-10000000-v9/manifest.json");
const gaiaFullManifestBytes = readFileSync(gaiaFullManifestPath);
const gaiaFullManifest = JSON.parse(gaiaFullManifestBytes.toString("utf8"));
if (gaiaFullManifest.id !== "gaia-dr3-presentation-10000000-v9" || gaiaFullManifest.counts?.presentation !== 10_000_000 || gaiaFullManifest.runtime?.standaloneIntentRequired !== true) {
  throw new Error("v589-gaia-full-manifest-contract");
}
const gaiaFullAsset = {
  id: "gaia-full-10m-range-manifest",
  body: "stars",
  role: "standalone-range-catalog-manifest",
  sourceUrl: "local-existing-gaia://gaia-dr3-presentation-10000000-v9",
  sourceHost: "local-existing-gaia",
  license: { id: "Gaia-existing-admission", url: "https://www.cosmos.esa.int/web/gaia-users/license" },
  sourceBytes: gaiaFullManifestBytes.byteLength,
  sourceSha256: sha256(gaiaFullManifestBytes),
  derivation: { tool: "gaiaPresentationStream.worker.ts", version: "v589-range-adapter", parameters: "HEALPix NESTED order-6/8 indexes, HTTP Range, CRC32 archive segments, CPU presentation-only" },
  variants: {
    fullDesktop: { url: "/data/gaia-dr3-presentation-10000000-v9/manifest.json", bytes: gaiaFullManifestBytes.byteLength, sha256: sha256(gaiaFullManifestBytes), width: 1, height: 1, format: "json", colorSpace: "not-applicable", compression: "manifest-plus-range-indexes" },
  },
  presentationOnly: true,
};
const constellationAsset = {
  id: "constellation-gaia-bindings",
  body: "constellations",
  role: "gaia-source-id-binding",
  sourceUrl: "local-existing-gaia://constellation-catalog-and-gaia-46000",
  sourceHost: "local-existing-gaia",
  license: { id: "Gaia-existing-admission", url: "https://www.cosmos.esa.int/web/gaia-users/license" },
  sourceBytes: gaia.bindingBytes.byteLength,
  sourceSha256: sha256(gaia.bindingBytes),
  derivation: { tool: "deterministic-nearest-neighbor", version: "v589", parameters: "484 waypoints; maximum separation 1.5deg" },
  variants: {
    liteDesktop: { url: "/data/celestial-art-v589/constellation-gaia-bindings-v589.json", bytes: gaia.bindingBytes.byteLength, sha256: sha256(gaia.bindingBytes), width: 484, height: 1, format: "bin", colorSpace: "not-applicable", compression: "json-canonical-receipt" },
  },
  presentationOnly: true,
};
const assets = [
  {
    id: "milky-way-v588-readonly",
    body: "sky",
    role: "milky-way-background-readonly-dependency",
    sourceUrl: "local-admitted-v588://milky-way",
    sourceHost: "local-admitted-v588",
    license: { id: "NASA-public-domain", url: "https://svs.gsfc.nasa.gov/4851/" },
    sourceBytes: statSync(resolve(root, "public/textures/candidate-v588/sky/milky-way-desktop.ktx2")).size,
    sourceSha256: sha256(readFileSync(resolve(root, "public/textures/candidate-v588/sky/milky-way-desktop.ktx2"))),
    derivation: { tool: "none", version: "v588-frozen-readonly", parameters: "visual baseline dependency; no byte copy; no identity rewrite" },
    variants: {
      fullDesktop: { url: "/textures/candidate-v588/sky/milky-way-desktop.ktx2", bytes: statSync(resolve(root, "public/textures/candidate-v588/sky/milky-way-desktop.ktx2")).size, sha256: sha256(readFileSync(resolve(root, "public/textures/candidate-v588/sky/milky-way-desktop.ktx2"))), width: 8192, height: 4096, format: "ktx2", colorSpace: "srgb", compression: "etc1s-mipmapped" },
      liteDesktop: { url: "/textures/candidate-v588/sky/milky-way-desktop.jpg", bytes: statSync(resolve(root, "public/textures/candidate-v588/sky/milky-way-desktop.jpg")).size, sha256: sha256(readFileSync(resolve(root, "public/textures/candidate-v588/sky/milky-way-desktop.jpg"))), width: 8192, height: 4096, format: "jpeg", colorSpace: "srgb", compression: "frozen-v9-jpeg" },
      liteMobile: { url: "/textures/candidate-v588/sky/milky-way-mobile.jpg", bytes: statSync(resolve(root, "public/textures/candidate-v588/sky/milky-way-mobile.jpg")).size, sha256: sha256(readFileSync(resolve(root, "public/textures/candidate-v588/sky/milky-way-mobile.jpg"))), width: 4096, height: 2048, format: "jpeg", colorSpace: "srgb", compression: "frozen-v9-jpeg" },
    },
    presentationOnly: true,
  },
  gaiaAsset,
  gaiaFullAsset,
  constellationAsset,
  ...bennuModels.assets,
  ...textureAssets,
];
validateAssetHosts(assets);

const rolesByBody = new Map();
for (const asset of assets) {
  if (!["sky", "stars", "constellations"].includes(asset.body)) {
    const set = rolesByBody.get(asset.body) ?? new Set();
    set.add(asset.id);
    rolesByBody.set(asset.body, set);
  }
}
const requirements = {
  sun: ["sun-albedo"], mercury: ["mercury-albedo", "mercury-normal", "mercury-roughness"], venus: ["venus-surface", "venus-clouds"],
  earth: ["earth-albedo", "earth-normal", "earth-roughness", "earth-clouds", "earth-cloud-alpha", "earth-night", "earth-night-mask"],
  moon: ["moon-albedo", "moon-normal", "moon-roughness"], mars: ["mars-albedo", "mars-normal", "mars-roughness"],
  jupiter: ["jupiter-albedo", "jupiter-band-mask"], saturn: ["saturn-albedo", "saturn-band-mask", "saturn-ring-color", "saturn-ring-alpha"],
  uranus: [], neptune: [], ceres: ["ceres-model", "regolith-cc0"], vesta: ["vesta-model", "regolith-cc0"], bennu: ["bennu-model", "regolith-cc0"],
  eros: ["eros-model", "regolith-cc0"], kleopatra: ["kleopatra-model", "regolith-cc0"], "tempel-1": ["tempel-1-model", "regolith-cc0"],
};
const heroBodies = Object.fromEntries(Object.entries(requirements).map(([body, required]) => [
  body,
  (body === "uranus" || body === "neptune" || required.every((id) => assets.some((asset) => asset.id === id))) ? "admitted" : "asset-blocked",
]));
const liteIncrementBytes = [...new Set(assets.flatMap((asset) => Object.entries(asset.variants)
  .filter(([key, file]) => key.startsWith("lite") && (file.url.startsWith("/textures/candidate-v589/") || file.url.startsWith("/models/candidate-v589/") || file.url.startsWith("/data/celestial-art-v589/")))
  .map(([, file]) => file.url)))]
  .reduce((sum, url) => sum + statSync(resolve(root, "public", url.slice(1).replaceAll("/", "\\"))).size, 0);
if (liteIncrementBytes > 9 * 1024 * 1024) throw new Error(`v589-lite-increment-budget:${liteIncrementBytes}`);

const unsignedManifest = {
  version: "v589-celestial-art-candidate-v1",
  authorityNamespace: "candidate-v589-celestial-art",
  generatedAt,
  status: Object.values(heroBodies).every((status) => status === "admitted") ? "all-heroes-admitted" : "candidate-partial-asset-blocked",
  assets,
  heroBodies,
  starfield: {
    standaloneCatalog: "gaia-dr3-presentation-10000000-v9-range-worker",
    standaloneManifestUrl: "/data/gaia-dr3-presentation-10000000-v9/manifest.json",
    standaloneRows: 10_000_000,
    liteCatalog: "gaia-lite-46000-v589",
    desktopBudgets: { full: 60_000, lite: 30_000 },
    mobileBudgets: { full: 18_000, lite: 10_000 },
    layers: ["faint", "catalog", "bright-psf"],
    randomTwinkle: false,
  },
  constellations: {
    count: 88,
    waypointCount: 484,
    maximumAngularDistanceDeg: gaia.maximumAngularDistanceDeg,
    medianAngularDistanceDeg: gaia.medianAngularDistanceDeg,
    thresholdDeg: 1.5,
    desktopDefaultCount: 12,
    mobileDefaultCount: 8,
    depthOcclusion: true,
  },
  modelPipeline: bennuModels.receipt ? {
    bennuReceiptPath: "docs/release/v589/bennu-lod-receipt-v589.json",
    bennuReceiptSha256: bennuModels.receipt.receiptSha256,
    lodCount: bennuModels.receipt.lods.length,
    normals: bennuModels.receipt.lods.every((entry) => entry.normals === true),
    meshopt: bennuModels.receipt.lods.every((entry) => entry.meshopt === true),
    stablePivot: bennuModels.receipt.lods.every((entry) => entry.pivot === "bounds-midpoint"),
  } : null,
  boundaries: {
    formalProductPointer: "v263",
    v588Rewritten: false,
    historicalEvidenceRewritten: false,
    scientificPayloadWriteback: false,
    singleCanvasRequired: true,
    productionPromotionAllowed: false,
  },
  budgets: {
    fullCompressedBytesMaximum: 750 * 1024 * 1024,
    liteIncrementBytesMaximum: 9 * 1024 * 1024,
    liteTotalBytesMaximum: 82 * 1024 * 1024,
    observedLiteIncrementBytes: liteIncrementBytes,
  },
  freezeBeforeSnapshotSha256: freeze.snapshotSha256,
};
const sealedManifest = { ...unsignedManifest, manifestSha256: canonicalSha(unsignedManifest) };
atomicWrite(manifestPath, `${JSON.stringify(sealedManifest, null, 2)}\n`);
atomicWrite(generatedConstantsPath, `// Generated by scripts/build-v589-celestial-art-candidate.mjs.\nexport const CELESTIAL_ART_MANIFEST_SHA256_V589 =\n  "${sealedManifest.manifestSha256}" as const;\n\nexport const CELESTIAL_ART_CONSTELLATION_BINDING_SHA256_V589 =\n  "${gaia.bindingSha256}" as const;\n\nexport const CELESTIAL_ART_GAIA_LITE_SHA256_V589 =\n  "${gaia.binarySha256}" as const;\n`);
const candidatePointerUnsigned = {
  version: "v589-current-research-visual-candidate-pointer-v1",
  generatedAt,
  status: "additive-candidate-only",
  route: "/local-shadow-v589",
  candidate: "v589-celestial-art-candidate-v1",
  manifestSha256: sealedManifest.manifestSha256,
  formalProductPointer: "v263",
  scientificPayloadSha256: "784ddb4c94aa836b3dc6e517fa559178ae626f6aa5210b52b5ff8cd771785674",
  scientificPayloadWriteback: false,
  productionPromotionAllowed: false,
};
const candidatePointer = { ...candidatePointerUnsigned, pointerSha256: canonicalSha(candidatePointerUnsigned) };
atomicWrite(resolve(root, "dist/release/orbit-atlas-current-celestial-art-candidate-v589.json"), `${JSON.stringify(candidatePointer, null, 2)}\n`);
rmSync(tempRoot, { recursive: true, force: true });
console.log(JSON.stringify({
  status: sealedManifest.status,
  manifestSha256: sealedManifest.manifestSha256,
  gaiaLiteSha256: gaia.binarySha256,
  constellationBindingSha256: gaia.bindingSha256,
  heroBodies,
  liteIncrementBytes,
  formalProductPointer: "v263",
}, null, 2));
