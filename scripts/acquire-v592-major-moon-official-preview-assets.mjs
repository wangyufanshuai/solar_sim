import { createHash } from "node:crypto";
import { existsSync, mkdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import sharp from "sharp";

const root = process.cwd();
const generatedAt = process.env.ATLAS_V592_GENERATED_AT ?? "2026-08-20T00:00:00Z";
const receiptPath = resolve(root, "docs/release/v592/acquisition-receipt-major-moon-official-preview-assets-v592.json");
const allowedHost = "astrogeology.usgs.gov";
const assets = Object.freeze([
  {
    target: "io",
    nasaId: "USGS-IO-GALILEO-VOYAGER-GLOBAL-MOSAIC",
    url: "https://astrogeology.usgs.gov/ckan/dataset/f6924861-ce9c-490d-8a4b-7812a20f2de5/resource/a9fab679-8081-4144-9f58-45848836c8f5/download/full.jpg",
    outputPath: "source-cache/v592/major-moons/official-preview/io-global-mosaic-1024.jpg",
  },
  {
    target: "europa",
    nasaId: "USGS-EUROPA-VOYAGER-GALILEO-GLOBAL-MOSAIC",
    url: "https://astrogeology.usgs.gov/ckan/dataset/4080036f-afc5-422e-abe9-1c0c8e4f98ea/resource/3647e7b3-425e-4dcf-951b-cc4a22fb0129/download/europa_voyager_galileossi_global_mosaic_500m_1024.jpg",
    outputPath: "source-cache/v592/major-moons/official-preview/europa-global-mosaic-1024.jpg",
  },
  {
    target: "ganymede",
    nasaId: "USGS-GANYMEDE-VOYAGER-GALILEO-GLOBAL-MOSAIC",
    url: "https://astrogeology.usgs.gov/ckan/dataset/e1422336-3291-4b65-b903-c942d53de073/resource/eb32abd7-fee2-47d1-9f96-9d7d8824cc3a/download/ganymede_voyager_galileossi_global_clrmosaic_1024.jpg",
    outputPath: "source-cache/v592/major-moons/official-preview/ganymede-global-mosaic-1024.jpg",
  },
  {
    target: "callisto",
    nasaId: "USGS-CALLISTO-VOYAGER-GALILEO-GLOBAL-MOSAIC",
    url: "https://astrogeology.usgs.gov/ckan/dataset/a80abd68-7ed9-440e-829a-76376779164f/resource/ac628525-cb1c-4742-928b-5a0a60f372cd/download/callisto_voyager_galileossi_global_mosaic_1024.jpg",
    outputPath: "source-cache/v592/major-moons/official-preview/callisto-global-mosaic-1024.jpg",
  },
  {
    target: "iapetus",
    nasaId: "USGS-IAPETUS-VOYAGER-AIRBRUSH-GLOBAL-MOSAIC",
    url: "https://astrogeology.usgs.gov/ckan/dataset/65d92f60-6239-46ca-b3e1-14a757c64f62/resource/4c9c3bbe-f43e-4a33-83bc-eb529098d7cd/download/full.jpg",
    outputPath: "source-cache/v592/major-moons/official-preview/iapetus-global-mosaic-1024.jpg",
  },
  {
    target: "charon",
    nasaId: "USGS-CHARON-NEW-HORIZONS-GLOBAL-MOSAIC",
    url: "https://astrogeology.usgs.gov/ckan/dataset/93827f6c-8feb-42b6-98e6-b0ce57c7d2c8/resource/1abf318c-3290-4aa0-932e-a34f32d7f6ad/download/charon_newhorizons_global_mosaic_300m_jul2017_1024.jpg",
    outputPath: "source-cache/v592/major-moons/official-preview/charon-global-mosaic-1024.jpg",
  },
]);

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
}
const canonicalSha = (value) => sha256(Buffer.from(JSON.stringify(canonicalize(value)), "utf8"));
function atomicWrite(path, bytes) {
  mkdirSync(dirname(path), { recursive: true });
  const partial = path + ".part";
  writeFileSync(partial, bytes, { flag: "wx" });
  rmSync(path, { force: true });
  renameSync(partial, path);
}
function assertUrl(raw) {
  const url = new URL(raw);
  if (url.protocol !== "https:" || url.username || url.password || url.port || url.hostname !== allowedHost) {
    throw new Error("v592-major-moon-preview-url:" + raw);
  }
  return url;
}

if (existsSync(receiptPath)) throw new Error("v592-major-moon-preview-receipt-exists-no-repeat");
for (const asset of assets) {
  if (existsSync(resolve(root, asset.outputPath)) || existsSync(resolve(root, asset.outputPath + ".part"))) {
    throw new Error("v592-major-moon-preview-output-exists-no-repeat:" + asset.target);
  }
}

const acquired = [];
const failures = [];
for (const asset of assets) {
  const url = assertUrl(asset.url);
  try {
    const response = await fetch(url, {
      redirect: "manual",
      headers: { "user-agent": "Orbit-Atlas-v592-" + asset.target + "-visual-acquisition/1.0" },
      signal: AbortSignal.timeout(45_000),
    });
    if (response.status >= 300 && response.status < 400) {
      failures.push({ target: asset.target, url: url.href, httpStatus: response.status, redirectLocation: response.headers.get("location"), requestCount: 1, automaticRetryPerformed: false, automaticReplacementPerformed: false, error: "redirect-not-followed" });
      continue;
    }
    const bytes = Buffer.from(await response.arrayBuffer());
    const contentType = response.headers.get("content-type");
    const metadata = await sharp(bytes).metadata().catch(() => null);
    if (response.status !== 200 || response.url !== url.href || !contentType?.toLowerCase().includes("image/jpeg") || metadata?.format !== "jpeg" || (metadata.width ?? 0) < 512 || (metadata.height ?? 0) < 256) {
      failures.push({ target: asset.target, url: url.href, httpStatus: response.status, finalUrl: response.url, contentType, bytes: bytes.byteLength, requestCount: 1, automaticRetryPerformed: false, automaticReplacementPerformed: false, error: "visual-preview-response-contract" });
      continue;
    }
    atomicWrite(resolve(root, asset.outputPath), bytes);
    acquired.push({
      target: asset.target,
      nasaId: asset.nasaId,
      url: url.href,
      finalUrl: response.url,
      host: url.hostname,
      contentType,
      outputPath: asset.outputPath,
      bytes: bytes.byteLength,
      sha256: sha256(bytes),
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      license: "USGS Astrogeology/NASA-PDS public-domain mission-map preview with source credit",
      licenseUrl: "https://astrogeology.usgs.gov/",
      requestCount: 1,
      automaticRetryPerformed: false,
      automaticReplacementPerformed: false,
      payloadDownloaded: true,
      scientificPayload: false,
      presentationOnly: true,
    });
  } catch (error) {
    failures.push({ target: asset.target, url: url.href, requestCount: 1, automaticRetryPerformed: false, automaticReplacementPerformed: false, error: error instanceof Error ? error.message : String(error) });
  }
}

const unsigned = {
  version: "v592-major-moon-official-preview-visual-acquisition-v1",
  generatedAt,
  status: failures.length === 0 ? "six-official-preview-assets-acquired-single-request-each" : "partial-" + acquired.length + "-of-six-official-preview-assets-no-retry",
  requestCount: assets.length,
  requestCountPerUrl: 1,
  automaticRetryPerformed: false,
  automaticReplacementPerformed: false,
  redirectFollowed: false,
  assets: acquired,
  failures,
  policy: {
    metadataOnly: false,
    payloadDownloaded: true,
    scientificPayloadDownloaded: false,
    visualAssetAdmissionGranted: false,
    proceduralFallbackAllowed: false,
    noInpainting: true,
    noSyntheticCoverageFill: true,
    scientificAuthorityGranted: false,
    scientificPayloadWriteback: false,
  },
};
const document = { ...unsigned, receiptSha256: canonicalSha(unsigned) };
atomicWrite(receiptPath, Buffer.from(JSON.stringify(document, null, 2) + "\n", "utf8"));
console.log(JSON.stringify({ status: document.status, acquiredCount: acquired.length, failureCount: failures.length, receiptSha256: document.receiptSha256 }, null, 2));
