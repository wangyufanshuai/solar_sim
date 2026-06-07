import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const cacheDir = join(root, ".cache", "space-resource-pack");
const deepSkyOutDir = join(root, "public", "textures", "deep-sky", "pack-v2");
const spacecraftOutDir = join(root, "public", "models", "spacecraft", "nasa-v2");
const deepSkyManifestPath = join(root, "public", "textures", "deep-sky", "pack-v2-manifest.json");
const spacecraftManifestPath = join(spacecraftOutDir, "manifest.json");
const MAX_FILE_BYTES = 95 * 1024 * 1024;

const DRY_RUN = process.argv.includes("--dry-run");
const SKIP_IMAGES = process.argv.includes("--skip-images");
const SKIP_MODELS = process.argv.includes("--skip-models");
const IMAGE_LIMIT = Number(process.env.SOLAR_RESOURCE_IMAGE_LIMIT || "84");

const DEEP_SKY_TARGETS = [
  ["m42_v2", "Orion Nebula Hubble", "Orion Nebula Hubble", 209.0, -19.4, "core", 680, -0.18, 0.56],
  ["m31_v2", "Andromeda Galaxy", "Andromeda Galaxy NASA", 121.2, -21.6, "core", 820, 0.18, 0.4],
  ["carina_v2", "Carina Nebula", "Carina Nebula JWST NASA", 287.6, -0.6, "core", 760, 0.24, 0.5],
  ["m16_v2", "Eagle Nebula", "Eagle Nebula Pillars of Creation NASA", 17.0, 0.8, "core", 560, 0.18, 0.48],
  ["m8_v2", "Lagoon Nebula", "Lagoon Nebula NASA", 6.0, -1.3, "core", 600, -0.35, 0.48],
  ["m20_v2", "Trifid Nebula", "Trifid Nebula NASA", 7.0, -2.4, "core", 520, 0.32, 0.46],
  ["ngc7000_v2", "North America Nebula", "North America Nebula NASA", 85.0, -1.0, "core", 720, -0.12, 0.4],
  ["m45_v2", "Pleiades", "Pleiades NASA", 166.6, -23.5, "core", 560, 0.12, 0.42],
  ["rosette_v2", "Rosette Nebula", "Rosette Nebula NASA", 206.3, -2.1, "core", 630, 0.08, 0.48],
  ["horsehead_v2", "Horsehead Nebula", "Horsehead Nebula NASA", 206.8, -16.5, "core", 480, 0.2, 0.42],
  ["helix_v2", "Helix Nebula", "Helix Nebula NASA", 34.0, -56.7, "deferred", 460, 0.1, 0.46],
  ["m57_v2", "Ring Nebula", "Ring Nebula NASA", 63.3, 13.9, "deferred", 330, 0, 0.5],
  ["m27_v2", "Dumbbell Nebula", "Dumbbell Nebula NASA", 59.6, -3.6, "deferred", 390, -0.22, 0.46],
  ["m1_v2", "Crab Nebula", "Crab Nebula NASA", 184.6, -5.8, "deferred", 410, 0.16, 0.48],
  ["veil_v2", "Veil Nebula", "Veil Nebula NASA", 70.0, 2.0, "deferred", 760, -0.32, 0.36],
  ["m33_v2", "Triangulum Galaxy", "Triangulum Galaxy NASA", 133.6, -31.3, "deferred", 560, -0.1, 0.36],
  ["rho_oph_v2", "Rho Ophiuchi", "Rho Ophiuchi NASA", 353.0, 17.0, "deferred", 560, -0.12, 0.4],
  ["ngc6543_v2", "Cat's Eye Nebula", "Cat's Eye Nebula NASA", 96.4, 32.7, "deferred", 340, 0, 0.48],
  ["ngc6302_v2", "Butterfly Nebula", "Butterfly Nebula NASA", 350.0, -4.0, "deferred", 430, 0.18, 0.48],
  ["ngc2024_v2", "Flame Nebula", "Flame Nebula NASA", 206.5, -16.4, "deferred", 420, 0.12, 0.42],
  ["ngc7023_v2", "Iris Nebula", "Iris Nebula NASA", 104.1, 14.2, "deferred", 450, -0.12, 0.4],
  ["ngc281_v2", "Pacman Nebula", "Pacman Nebula NASA", 123.1, -6.3, "deferred", 500, 0.22, 0.4],
  ["ngc2174_v2", "Monkey Head Nebula", "Monkey Head Nebula NASA", 190.3, 0.5, "deferred", 470, -0.2, 0.4],
  ["ic1396_v2", "Elephant's Trunk Nebula", "Elephant Trunk Nebula NASA", 99.3, 3.7, "deferred", 610, 0.08, 0.38],
  ["omega_cen_v2", "Omega Centauri", "Omega Centauri NASA", 309.1, 15.0, "deferred", 450, 0, 0.42],
  ["47_tuc_v2", "47 Tucanae", "47 Tucanae NASA", 305.9, -44.9, "deferred", 420, 0.06, 0.4],
  ["cen_a_v2", "Centaurus A", "Centaurus A NASA", 309.5, 19.4, "deferred", 500, -0.28, 0.36],
  ["ngc3603_v2", "NGC 3603", "NGC 3603 Nebula NASA", 291.6, -0.5, "deferred", 390, 0.12, 0.38],
  ["ngc3372_jwst", "Carina Cliffs", "Cosmic Cliffs Carina JWST", 287.6, -0.6, "highQuality", 720, -0.1, 0.42],
  ["pillars_creation", "Pillars of Creation", "Pillars of Creation JWST", 17.0, 0.8, "highQuality", 520, 0.24, 0.44],
  ["tarantula_v2", "Tarantula Nebula", "Tarantula Nebula JWST", 279.5, -31.7, "highQuality", 700, 0.1, 0.42],
  ["ngc346_v2", "NGC 346", "NGC 346 JWST NASA", 302.1, -44.9, "highQuality", 560, 0.18, 0.4],
  ["m51_v2", "Whirlpool Galaxy", "Whirlpool Galaxy NASA", 104.9, 68.6, "highQuality", 540, 0.08, 0.36],
  ["m101_v2", "Pinwheel Galaxy", "Pinwheel Galaxy NASA", 102.0, 59.8, "highQuality", 540, -0.05, 0.34],
  ["m82_v2", "Cigar Galaxy", "Cigar Galaxy NASA", 141.4, 40.6, "highQuality", 500, 0.22, 0.34],
  ["sombrero_v2", "Sombrero Galaxy", "Sombrero Galaxy NASA", 298.5, 51.1, "highQuality", 520, -0.1, 0.34],
  ["antennae_v2", "Antennae Galaxies", "Antennae Galaxies NASA", 286.9, 42.4, "highQuality", 520, 0.28, 0.34],
  ["cartwheel_v2", "Cartwheel Galaxy", "Cartwheel Galaxy JWST", 341.2, -30.9, "highQuality", 500, 0.06, 0.34],
  ["stephans_v2", "Stephan's Quintet", "Stephan's Quintet JWST", 93.7, -40.7, "highQuality", 560, -0.16, 0.34],
  ["webb_deep_field", "Webb Deep Field", "Webb Deep Field SMACS 0723", 284.2, -31.5, "highQuality", 520, 0.0, 0.3],
  ["ngc602_v2", "NGC 602", "NGC 602 JWST NASA", 302.0, -44.5, "highQuality", 520, 0.12, 0.36],
  ["ngc1333_v2", "NGC 1333", "NGC 1333 JWST NASA", 158.0, -20.6, "highQuality", 520, -0.08, 0.36],
  ["westerlund2_v2", "Westerlund 2", "Westerlund 2 Hubble NASA", 284.3, -0.3, "highQuality", 520, 0.18, 0.36],
  ["rcw49_v2", "RCW 49", "RCW 49 NASA", 284.0, -0.5, "deferred", 500, 0.1, 0.36],
  ["sh2_106_v2", "Sharpless 2-106", "Sharpless 2-106 NASA", 76.4, -0.6, "deferred", 480, 0.1, 0.38],
  ["california_v2", "California Nebula", "California Nebula NASA", 160.6, -12.0, "deferred", 600, -0.16, 0.34],
  ["cone_v2", "Cone Nebula", "Cone Nebula NASA", 202.9, 2.2, "deferred", 460, 0.12, 0.38],
  ["bubble_v2", "Bubble Nebula", "Bubble Nebula NASA", 112.2, 0.2, "deferred", 460, 0.12, 0.4],
  ["crescent_v2", "Crescent Nebula", "Crescent Nebula NASA", 78.5, 1.8, "deferred", 460, -0.16, 0.38],
  ["eta_carinae_v2", "Eta Carinae", "Eta Carinae Nebula NASA", 287.6, -0.7, "deferred", 480, 0.2, 0.38],
  ["supernova1987a_v2", "Supernova 1987A", "Supernova 1987A NASA", 279.7, -31.9, "highQuality", 420, 0.1, 0.36],
  ["cas_a_v2", "Cassiopeia A", "Cassiopeia A NASA", 111.7, -2.1, "highQuality", 450, 0.12, 0.36],
  ["vela_snr_v2", "Vela Supernova Remnant", "Vela Supernova Remnant NASA", 263.9, -3.3, "highQuality", 700, -0.2, 0.32],
  ["orion_barnard_v2", "Barnard's Loop", "Barnard's Loop NASA", 206.0, -14.0, "deferred", 760, -0.12, 0.3],
  ["heart_v2", "Heart Nebula", "Heart Nebula NASA", 134.7, 0.4, "deferred", 620, 0.08, 0.34],
  ["soul_v2", "Soul Nebula", "Soul Nebula NASA", 135.0, 0.9, "deferred", 620, -0.08, 0.34],
  ["war_peace_v2", "War and Peace Nebula", "NGC 6357 NASA", 353.0, 1.0, "deferred", 500, 0.1, 0.34],
  ["cats_paw_v2", "Cat's Paw Nebula", "Cat's Paw Nebula NASA", 351.3, 0.7, "deferred", 500, 0.12, 0.34],
  ["ngc604_v2", "NGC 604", "NGC 604 NASA", 134.0, -33.6, "highQuality", 430, 0.1, 0.34],
  ["m13_v2", "Hercules Cluster", "M13 globular cluster NASA", 59.0, 40.9, "deferred", 420, 0, 0.36],
  ["m3_v2", "M3 Globular Cluster", "M3 globular cluster NASA", 42.2, 78.7, "deferred", 420, 0, 0.34],
  ["m5_v2", "M5 Globular Cluster", "M5 globular cluster NASA", 3.9, 46.8, "deferred", 420, 0, 0.34],
  ["m11_v2", "Wild Duck Cluster", "M11 star cluster NASA", 27.1, -2.8, "deferred", 390, 0, 0.32],
  ["m35_v2", "M35 Cluster", "M35 star cluster NASA", 186.6, 2.2, "deferred", 390, 0, 0.32],
  ["ngc2264_v2", "Christmas Tree Cluster", "NGC 2264 NASA", 202.9, 2.2, "deferred", 430, 0.14, 0.34],
  ["ngc3324_v2", "NGC 3324", "NGC 3324 NASA", 286.2, -0.2, "deferred", 460, 0.12, 0.34],
  ["ngc1365_v2", "NGC 1365", "NGC 1365 NASA", 237.9, -54.6, "highQuality", 500, 0.16, 0.32],
  ["ngc1300_v2", "NGC 1300", "NGC 1300 NASA", 236.7, -51.5, "highQuality", 500, -0.1, 0.32],
  ["ngc4258_v2", "NGC 4258", "NGC 4258 NASA", 138.3, 68.8, "highQuality", 500, 0.16, 0.32],
  ["ngc1672_v2", "NGC 1672", "NGC 1672 NASA", 266.8, -38.5, "highQuality", 500, -0.16, 0.32],
  ["ngc3627_v2", "NGC 3627", "NGC 3627 NASA", 241.5, 64.4, "highQuality", 500, 0.08, 0.32],
  ["ngc628_v2", "NGC 628", "NGC 628 NASA", 138.6, -45.7, "highQuality", 500, -0.08, 0.32],
  ["ngc7496_v2", "NGC 7496", "NGC 7496 JWST NASA", 348.2, -63.8, "highQuality", 500, 0.08, 0.32],
  ["ic5332_v2", "IC 5332", "IC 5332 JWST NASA", 42.5, -74.9, "highQuality", 500, -0.08, 0.32],
].slice(0, IMAGE_LIMIT);

const SPACECRAFT_TARGETS = [
  ["apollo-lunar-module", "Apollo Lunar Module", "/models/spacecraft/apollo-lunar-module.glb", "https://science.nasa.gov/3d-resources/apollo-lunar-module/", 1.0],
  ["apollo-soyuz", "Apollo Soyuz", "/models/spacecraft/apollo-soyuz.glb", "https://science.nasa.gov/3d-resources/apollo-soyuz/", 1.0],
  ["gateway-core", "Gateway Core", "/models/spacecraft/gateway-core.glb", "https://science.nasa.gov/3d-resources/gateway-lunar-space-station/", 0.38],
  ["hubble-space-telescope-b", "Hubble Space Telescope", null, "https://science.nasa.gov/3d-resources/hubble-space-telescope-b/", 1.1],
  ["voyager-probe-a", "Voyager Probe", null, "https://science.nasa.gov/3d-resources/voyager-probe-a/", 1.2],
  ["cassini-huygens-b", "Cassini-Huygens", null, "https://science.nasa.gov/3d-resources/cassini-huygens-b/", 1.2],
  ["mars-2020-perseverance-rover", "Mars 2020 Perseverance", null, "https://science.nasa.gov/3d-resources/mars-2020-perseverance-rover/", 0.52],
  ["deep-impact", "Deep Impact / EPOXI", null, "https://science.nasa.gov/3d-resources/deep-impact/", 1.0],
  ["lunar-reconnaissance-orbiter-b", "Lunar Reconnaissance Orbiter", null, "https://science.nasa.gov/3d-resources/lunar-reconnaissance-orbiter-b/", 1.0],
  ["polar", "Polar", null, "https://science.nasa.gov/3d-resources/polar/", 1.1],
];

const SPACECRAFT_METADATA = {
  "apollo-lunar-module": [1969, "lunar", "Apollo LM", "Crewed lunar lander used for Apollo Moon surface operations."],
  "apollo-soyuz": [1975, "crewed", "Apollo-Soyuz", "Crewed docking spacecraft from the Apollo-Soyuz Test Project."],
  "gateway-core": [2020, "space-station", "Gateway", "Lunar Gateway core stack concept for cislunar operations."],
  "hubble-space-telescope-b": [1990, "telescope", "Hubble", "Low Earth orbit observatory for ultraviolet, visible, and near-infrared astronomy."],
  "voyager-probe-a": [1977, "outer-planet", "Voyager", "Outer planet and interstellar probe with high-gain antenna and RTG boom."],
  "cassini-huygens-b": [1997, "outer-planet", "Cassini", "Saturn orbiter and Huygens probe mission spacecraft."],
  "mars-2020-perseverance-rover": [2020, "mars", "Perseverance", "Mars rover built for Jezero crater exploration and sample caching."],
  "deep-impact": [2005, "comet", "Deep Impact", "Comet mission spacecraft later used for EPOXI extended observations."],
  "lunar-reconnaissance-orbiter-b": [2009, "lunar", "LRO", "Lunar polar orbiter for high-resolution mapping and resource reconnaissance."],
  "polar": [1996, "earth-orbit", "Polar", "Magnetospheric research spacecraft for Earth's polar plasma environment."],
};

function slugFile(id, suffix = "jpg") {
  return `${id.replace(/[^a-z0-9_-]/gi, "-").toLowerCase()}.${suffix}`;
}

async function ensureDirs() {
  await mkdir(cacheDir, { recursive: true });
  await mkdir(deepSkyOutDir, { recursive: true });
  await mkdir(spacecraftOutDir, { recursive: true });
}

async function fetchJson(url) {
  const res = await fetch(url, { headers: { "User-Agent": "solar-sim-resource-fetcher/1.0" } });
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  return res.json();
}

async function fetchText(url) {
  const res = await fetch(url, { headers: { "User-Agent": "solar-sim-resource-fetcher/1.0" } });
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  return res.text();
}

async function download(url, dest) {
  const res = await fetch(url, { headers: { "User-Agent": "solar-sim-resource-fetcher/1.0" } });
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  const size = Number(res.headers.get("content-length") ?? "0");
  if (size > MAX_FILE_BYTES) throw new Error(`skip >95MB source (${size} bytes): ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length > MAX_FILE_BYTES) throw new Error(`download exceeded ${MAX_FILE_BYTES} bytes: ${url}`);
  await writeFile(dest, buf);
}

async function checksum(path) {
  const buf = await readFile(path);
  return createHash("sha256").update(buf).digest("hex");
}

async function fileBytes(path) {
  return (await stat(path)).size;
}

function runPython(args, input) {
  return new Promise((resolve, reject) => {
    const child = spawn("python", args, { cwd: root, stdio: ["pipe", "pipe", "pipe"] });
    let out = "";
    let err = "";
    child.stdout.on("data", (d) => { out += d; });
    child.stderr.on("data", (d) => { err += d; });
    child.on("exit", (code) => {
      if (code === 0) resolve(out.trim());
      else reject(new Error(err || out || `python exited ${code}`));
    });
    if (input) child.stdin.write(input);
    child.stdin.end();
  });
}

async function compressImage(src, previewDest, qualityDest) {
  const py = `
import json, sys
from PIL import Image, ImageOps
src, preview, quality = sys.argv[1:4]
img = Image.open(src)
img = ImageOps.exif_transpose(img).convert("RGB")
def save_fit(path, max_side, q):
    im = img.copy()
    w, h = im.size
    scale = min(1.0, max_side / max(w, h))
    if scale < 1.0:
        im = im.resize((max(1, int(w*scale)), max(1, int(h*scale))), Image.Resampling.LANCZOS)
    im.save(path, "JPEG", quality=q, optimize=True, progressive=True)
    return im.size
preview_size = save_fit(preview, 768, 76)
quality_size = save_fit(quality, 3072, 86)
print(json.dumps({"preview": preview_size, "quality": quality_size}))
`;
  const tmp = join(cacheDir, "_compress_image.py");
  await writeFile(tmp, py, "utf8");
  const raw = await runPython([tmp, src, previewDest, qualityDest]);
  return JSON.parse(raw);
}

function pickAssetUrl(assetItems, fallback) {
  const jpgs = assetItems
    .map((item) => typeof item.href === "string" ? item.href : "")
    .filter((href) => /\.(jpe?g)(\?|$)/i.test(href))
    .filter((href) => !/thumb|small/i.test(href));
  return jpgs.find((href) => /~large/i.test(href)) ?? jpgs.find((href) => /~orig/i.test(href)) ?? jpgs[0] ?? fallback;
}

async function fetchDeepSkyTarget(target) {
  const [id, name, query, lonDeg, latDeg, tier, size, rotation, opacity] = target;
  const searchUrl = `https://images-api.nasa.gov/search?media_type=image&q=${encodeURIComponent(query)}`;
  const search = await fetchJson(searchUrl);
  const first = search.collection?.items?.[0];
  const nasaId = first?.data?.[0]?.nasa_id ?? null;
  const title = first?.data?.[0]?.title ?? name;
  const assetHref = first?.href;
  const linkFallback = first?.links?.find((link) => link.href)?.href;
  if (!assetHref && !linkFallback) throw new Error(`no image result for ${query}`);
  let sourceUrl = linkFallback;
  if (assetHref) {
    const asset = await fetchJson(assetHref);
    sourceUrl = pickAssetUrl(asset.collection?.items ?? [], linkFallback);
  }
  if (!sourceUrl) throw new Error(`no downloadable image for ${query}`);
  const rawPath = join(cacheDir, `${id}${extname(new URL(sourceUrl).pathname) || ".jpg"}`);
  const previewFile = slugFile(`${id}-preview`);
  const qualityFile = slugFile(`${id}-quality`);
  const previewPath = join(deepSkyOutDir, previewFile);
  const qualityPath = join(deepSkyOutDir, qualityFile);
  let dimensions = {};
  if (!DRY_RUN) {
    await download(sourceUrl, rawPath);
    dimensions = await compressImage(rawPath, previewPath, qualityPath);
  }
  return {
    id,
    name,
    file: qualityFile,
    previewUrl: `/textures/deep-sky/pack-v2/${previewFile}`,
    qualityUrl: `/textures/deep-sky/pack-v2/${qualityFile}`,
    nasaId,
    sourceUrl,
    credit: "NASA Image and Video Library",
    bytes: {
      preview: DRY_RUN ? 0 : await fileBytes(previewPath),
      quality: DRY_RUN ? 0 : await fileBytes(qualityPath),
    },
    dimensions,
    checksum: {
      preview: DRY_RUN ? "" : await checksum(previewPath),
      quality: DRY_RUN ? "" : await checksum(qualityPath),
    },
    galactic: { lonDeg, latDeg },
    visual: { size, rotation, opacity },
    renderTier: tier,
    renderMode: "anchored sky-sphere decal",
  };
}

function firstGlbHref(html, pageUrl) {
  const matches = Array.from(html.matchAll(/https:\/\/assets\.science\.nasa\.gov\/[^"'<> ]+?\.glb/gi)).map((m) => m[0]);
  if (matches.length) return decodeURI(matches[0]);
  const hrefMatches = Array.from(html.matchAll(/href=["']([^"']+?\.glb)["']/gi)).map((m) => new URL(m[1], pageUrl).href);
  return hrefMatches[0] ? decodeURI(hrefMatches[0]) : null;
}

async function fetchSpacecraftTarget(target) {
  const [id, title, existingLocalPath, pageUrl, modelScale] = target;
  let localPath = existingLocalPath;
  let originUrl = existingLocalPath ? new URL(existingLocalPath, "file://existing").pathname : null;
  const outFile = `${id}.glb`;
  const outPath = join(spacecraftOutDir, outFile);
  if (existingLocalPath) {
    const src = join(root, "public", existingLocalPath.replace(/^\//, ""));
    if (!DRY_RUN) await copyFile(src, outPath);
    localPath = `/models/spacecraft/nasa-v2/${outFile}`;
  } else {
    const page = await fetchText(pageUrl);
    const glb = firstGlbHref(page, pageUrl);
    if (!glb) throw new Error(`no GLB found on ${pageUrl}`);
    originUrl = glb;
    if (!DRY_RUN) await download(glb, outPath);
    localPath = `/models/spacecraft/nasa-v2/${outFile}`;
  }
  const bytes = DRY_RUN ? 0 : await fileBytes(outPath);
  if (bytes > MAX_FILE_BYTES) throw new Error(`${id} exceeds file limit after download`);
  const metadata = SPACECRAFT_METADATA[id] ?? [null, "probe", title, `${title} NASA 3D model.`];
  return {
    id,
    title,
    localPath,
    originUrl,
    sourcePage: pageUrl,
    credit: "NASA Science 3D Resources",
    bytes,
    checksum: DRY_RUN ? "" : await checksum(outPath),
    modelScale,
    previewTier: id === "gateway-core" ? "gallery" : "core",
    missionYear: metadata[0],
    category: metadata[1],
    scaleLabel: metadata[2],
    description: metadata[3],
    sourceCreditShort: "NASA 3D",
  };
}

async function main() {
  await ensureDirs();
  const deepSky = [];
  if (!SKIP_IMAGES) {
    for (const target of DEEP_SKY_TARGETS) {
      try {
        process.stdout.write(`image ${target[0]} ... `);
        const item = await fetchDeepSkyTarget(target);
        deepSky.push(item);
        console.log("ok");
      } catch (err) {
        console.log(`skip (${err.message})`);
      }
    }
    await writeFile(deepSkyManifestPath, `${JSON.stringify({
      generatedAt: new Date().toISOString(),
      source: "NASA Image and Video Library",
      license: "NASA media usage guidelines",
      performancePolicy: "core preview first, deferred on idle, quality only for Showcase/Quality",
      deepSky,
    }, null, 2)}\n`, "utf8");
  }

  const spacecraft = [];
  if (!SKIP_MODELS) {
    for (const target of SPACECRAFT_TARGETS) {
      try {
        process.stdout.write(`model ${target[0]} ... `);
        const item = await fetchSpacecraftTarget(target);
        spacecraft.push(item);
        console.log("ok");
      } catch (err) {
        console.log(`skip (${err.message})`);
      }
    }
    await writeFile(spacecraftManifestPath, `${JSON.stringify({
      generatedAt: new Date().toISOString(),
      source: "NASA Science 3D Resources",
      license: "NASA media usage guidelines",
      performancePolicy: "Gallery models load on demand and are not part of first paint",
      spacecraft,
    }, null, 2)}\n`, "utf8");
  }

  console.log(`done: ${deepSky.length} deep-sky items, ${spacecraft.length} spacecraft models`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
