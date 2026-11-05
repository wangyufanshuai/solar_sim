import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import sharp from "sharp";

const root = process.cwd();
const generatedAt = process.env.ATLAS_V590_GENERATED_AT ?? "2026-08-10T00:00:00Z";
const sourcePath = resolve(root, "public/vendor/celestial-art-v589/sources/earth-height-21600x10800.png");
const sourceUrl = "https://eoimages.gsfc.nasa.gov/images/imagerecords/73000/73934/gebco_08_rev_elev_21600x10800.png";
const sourceSha256 = "4a70590d40dd7b9c69b9ab359d1dc4475ce97c1d2d13625223b248364112c699";
const outputRoot = resolve(root, "public/textures/candidate-v590/full");
const temporaryRoot = resolve(root, "tmp/v590-full-assets");
const receiptPath = resolve(root, "public/data/celestial-rendering-v590/full-asset-overlay.json");
const toktx = resolve(root, "tools/ktx/4.4.2/bin/toktx.exe");

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
}

function canonicalSha(value) {
  return sha256(Buffer.from(JSON.stringify(canonicalize(value)), "utf8"));
}

function atomicWrite(path, bytes) {
  mkdirSync(dirname(path), { recursive: true });
  const partial = `${path}.${process.pid}.part`;
  writeFileSync(partial, bytes);
  rmSync(path, { force: true });
  renameSync(partial, path);
}

function runTool(command, args, label) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
    windowsHide: true,
    maxBuffer: 16 * 1024 * 1024,
  });
  if (result.status !== 0) {
    throw new Error(`${label}:${result.status ?? "signal"}:${result.stderr || result.stdout}`);
  }
}

function outputRecord(path, url, width, height, format, compression) {
  const bytes = readFileSync(path);
  return {
    url,
    bytes: bytes.byteLength,
    sha256: sha256(bytes),
    width,
    height,
    format,
    colorSpace: "linear",
    compression,
  };
}

async function buildEarthNormal() {
  const sourceBytes = readFileSync(sourcePath);
  if (sha256(sourceBytes) !== sourceSha256) throw new Error("v590-earth-height-source-drift");

  const width = 4096;
  const height = 2048;
  const { data, info } = await sharp(sourceBytes, { limitInputPixels: false })
    .resize(width, height, { fit: "fill", kernel: sharp.kernel.lanczos3 })
    .greyscale()
    .normalise()
    .raw({ depth: "uchar" })
    .toBuffer({ resolveWithObject: true });
  if (info.width !== width || info.height !== height || info.channels !== 1) {
    throw new Error("v590-earth-normal-source-layout");
  }

  const normal = Buffer.allocUnsafe(width * height * 3);
  const sample = (x, y) => data[Math.max(0, Math.min(height - 1, y)) * width + ((x + width) % width)];
  const strength = 1.35;
  for (let y = 0; y < height; y += 1) {
    const latitude = Math.abs((y / (height - 1) - 0.5) * Math.PI);
    const longitudeScale = 1 / Math.max(0.25, Math.cos(latitude));
    for (let x = 0; x < width; x += 1) {
      const dx = (sample(x + 1, y) - sample(x - 1, y)) / 510 * longitudeScale;
      const dy = (sample(x, y + 1) - sample(x, y - 1)) / 510;
      const nx = -dx * strength;
      const ny = dy * strength;
      const inverseLength = 1 / Math.hypot(nx, ny, 1);
      const offset = (y * width + x) * 3;
      normal[offset] = Math.round((nx * inverseLength * 0.5 + 0.5) * 255);
      normal[offset + 1] = Math.round((ny * inverseLength * 0.5 + 0.5) * 255);
      normal[offset + 2] = Math.round((inverseLength * 0.5 + 0.5) * 255);
    }
  }

  mkdirSync(temporaryRoot, { recursive: true });
  const normalPngPath = resolve(temporaryRoot, "earth-normal-4096x2048.png");
  await sharp(normal, { raw: { width, height, channels: 3 } }).png({ compressionLevel: 9 }).toFile(normalPngPath);

  const desktopPath = resolve(outputRoot, "ktx2/earth-normal.ktx2");
  mkdirSync(dirname(desktopPath), { recursive: true });
  const desktopPartial = `${desktopPath}.${process.pid}.part`;
  rmSync(desktopPartial, { force: true });
  runTool(toktx, [
    "--t2", "--encode", "uastc", "--uastc_quality", "2", "--zcmp", "10",
    "--genmipmap", "--assign_oetf", "linear", desktopPartial, normalPngPath,
  ], "v590-earth-normal-ktx2");
  rmSync(desktopPath, { force: true });
  renameSync(desktopPartial, desktopPath);

  const mobileBytes = await sharp(normalPngPath)
    .resize(2048, 1024, { fit: "fill", kernel: sharp.kernel.lanczos3 })
    .webp({ lossless: true, effort: 6 })
    .toBuffer();
  const mobilePath = resolve(outputRoot, "mobile/earth-normal.webp");
  atomicWrite(mobilePath, mobileBytes);

  return {
    id: "earth-normal",
    body: "earth",
    role: "normal",
    source: {
      path: "public/vendor/celestial-art-v589/sources/earth-height-21600x10800.png",
      url: sourceUrl,
      host: "eoimages.gsfc.nasa.gov",
      license: { id: "NASA-public-domain", url: "https://visibleearth.nasa.gov/images/73934/topography" },
      bytes: sourceBytes.byteLength,
      sha256: sourceSha256,
    },
    derivation: {
      tool: "sharp+v590-geodetic-gradient+KTX-Software",
      version: `sharp-${sharp.versions.sharp};ktx-4.4.2`,
      parameters: "4096x2048 geodetic central gradient; longitude cos(latitude) compensation; strength=1.35; UASTC q2 zstd10 mipmapped; 2048x1024 lossless WebP mobile",
    },
    variants: {
      fullDesktop: outputRecord(
        desktopPath,
        "/textures/candidate-v590/full/ktx2/earth-normal.ktx2",
        4096,
        2048,
        "ktx2",
        "uastc-q2-zstd10-mipmapped",
      ),
      fullMobile: outputRecord(
        mobilePath,
        "/textures/candidate-v590/full/mobile/earth-normal.webp",
        2048,
        1024,
        "webp",
        "webp-lossless",
      ),
    },
  };
}

const asset = await buildEarthNormal();
const unsignedReceipt = {
  version: "v590-full-asset-overlay-v1",
  generatedAt,
  status: "derived-assets-complete",
  sourceCachePolicy: "read-only-existing-admitted-source",
  assets: [asset],
};
const receipt = { ...unsignedReceipt, receiptSha256: canonicalSha(unsignedReceipt) };
atomicWrite(receiptPath, Buffer.from(`${JSON.stringify(receipt, null, 2)}\n`, "utf8"));
rmSync(temporaryRoot, { recursive: true, force: true });

console.log(JSON.stringify({
  status: receipt.status,
  receiptSha256: receipt.receiptSha256,
  asset: asset.id,
  desktopBytes: asset.variants.fullDesktop.bytes,
  mobileBytes: asset.variants.fullMobile.bytes,
}, null, 2));
