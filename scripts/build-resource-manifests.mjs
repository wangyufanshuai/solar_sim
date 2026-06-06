import { readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const deepSkyDir = path.join(root, "public", "textures", "deep-sky");
const existingPath = path.join(deepSkyDir, "realism-manifest.json");
const legacyImagePath = path.join(deepSkyDir, "nasa-image-manifest.json");
const packPath = path.join(deepSkyDir, "pack-v2-manifest.json");
const outPath = path.join(deepSkyDir, "combined-resource-manifest.json");

const LEGACY_VISUALS = {
  "orion-nebula-pia04227.jpg": ["m42", "Orion Nebula", 209.0, -19.4, "core", 620, -0.18, 0.58],
  "horsehead-nebula-pia04215.jpg": ["ic434", "Horsehead Nebula", 206.8, -16.5, "core", 430, 0.2, 0.46],
  "rosette-nebula-pia09268.jpg": ["ngc2237", "Rosette Nebula", 206.3, -2.1, "core", 580, 0.08, 0.52],
  "lagoon-nebula-gsfc.jpg": ["m8", "Lagoon Nebula", 6.0, -1.3, "core", 520, -0.35, 0.5],
  "eagle-nebula.jpg": ["m16", "Eagle Nebula", 17.0, 0.8, "core", 470, 0.18, 0.48],
  "omega-nebula.jpg": ["m17", "Omega Nebula", 15.0, -0.7, "core", 470, -0.2, 0.46],
  "trifid-nebula.jpg": ["m20", "Trifid Nebula", 7.0, -2.4, "core", 430, 0.32, 0.48],
  "north-america-nebula.jpg": ["ngc7000", "North America Nebula", 85.0, -1.0, "core", 680, -0.12, 0.42],
  "helix-nebula.jpg": ["ngc7293", "Helix Nebula", 34.0, -56.7, "core", 430, 0.1, 0.48],
  "ring-nebula.jpg": ["m57", "Ring Nebula", 63.3, 13.9, "core", 300, 0, 0.52],
  "dumbbell-nebula.jpg": ["m27", "Dumbbell Nebula", 59.6, -3.6, "deferred", 360, -0.22, 0.48],
  "crab-nebula.jpg": ["m1", "Crab Nebula", 184.6, -5.8, "deferred", 360, 0.16, 0.5],
  "veil-nebula.jpg": ["ngc6960", "Veil Nebula", 70.0, 2.0, "deferred", 720, -0.32, 0.38],
  "carina-nebula.jpg": ["carina", "Carina Nebula", 287.6, -0.6, "deferred", 700, 0.26, 0.48],
  "pleiades.jpg": ["m45", "Pleiades", 166.6, -23.5, "deferred", 520, 0.12, 0.45],
  "rho-ophiuchi.jpg": ["rho_oph", "Rho Ophiuchi", 353.0, 17.0, "deferred", 520, -0.12, 0.42],
  "cats-eye-nebula.jpg": ["ngc6543", "Cat's Eye Nebula", 96.4, 32.7, "deferred", 320, 0, 0.5],
  "butterfly-nebula.jpg": ["ngc6302", "Butterfly Nebula", 350.0, -4.0, "deferred", 390, 0.18, 0.5],
  "flame-nebula.jpg": ["ngc2024", "Flame Nebula", 206.5, -16.4, "deferred", 380, 0.12, 0.44],
  "iris-nebula.jpg": ["ngc7023", "Iris Nebula", 104.1, 14.2, "deferred", 410, -0.12, 0.42],
  "pacman-nebula.jpg": ["ngc281", "Pacman Nebula", 123.1, -6.3, "deferred", 470, 0.22, 0.42],
  "monkey-head-nebula.jpg": ["ngc2174", "Monkey Head Nebula", 190.3, 0.5, "deferred", 430, -0.2, 0.42],
  "elephants-trunk-nebula.jpg": ["ic1396", "Elephant's Trunk Nebula", 99.3, 3.7, "deferred", 560, 0.08, 0.4],
  "omega-centauri.jpg": ["omega_cen", "Omega Centauri", 309.1, 15.0, "deferred", 420, 0, 0.44],
  "47-tucanae.jpg": ["47_tuc", "47 Tucanae", 305.9, -44.9, "deferred", 390, 0.06, 0.42],
  "centaurus-a.jpg": ["cen_a", "Centaurus A", 309.5, 19.4, "deferred", 460, -0.28, 0.38],
  "andromeda-galaxy.jpg": ["m31", "Andromeda Galaxy", 121.2, -21.6, "deferred", 760, 0.18, 0.36],
  "triangulum-galaxy.jpg": ["m33", "Triangulum Galaxy", 133.6, -31.3, "deferred", 500, -0.1, 0.36],
};

function normalizeLegacyImage(item) {
  const visual = LEGACY_VISUALS[item.file];
  if (!visual) return null;
  const [id, name, lonDeg, latDeg, tier, size, rotation, opacity] = visual;
  return {
    id,
    name,
    file: item.file,
    previewUrl: `/textures/deep-sky/${item.file}`,
    qualityUrl: `/textures/deep-sky/${item.file}`,
    sourceUrl: item.assetUrl ?? null,
    credit: item.source ?? "NASA Images API",
    bytes: { preview: item.bytes ?? 0, quality: item.bytes ?? 0 },
    dimensions: {},
    checksum: { preview: "legacy", quality: "legacy" },
    galactic: { lonDeg, latDeg },
    visual: { size, rotation, opacity },
    renderTier: tier,
    renderMode: "anchored sky-sphere decal",
  };
}

function normalizeExisting(item) {
  return {
    id: item.id,
    name: item.name,
    file: item.file,
    previewUrl: item.publicUrl,
    qualityUrl: item.publicUrl,
    sourceUrl: item.sourceUrl,
    credit: item.credit ?? item.source ?? "Project curated public astronomy asset",
    bytes: { preview: item.bytes ?? 0, quality: item.bytes ?? 0 },
    dimensions: {},
    checksum: { preview: "legacy", quality: "legacy" },
    galactic: item.galactic,
    visual: {
      size: item.name?.includes("Andromeda") ? 760 : item.renderTier === "core" ? 560 : 430,
      rotation: 0,
      opacity: item.renderTier === "core" ? 0.46 : 0.36,
    },
    renderTier: item.renderTier === "highQuality" ? "highQuality" : item.renderTier === "core" ? "core" : "deferred",
    renderMode: "anchored sky-sphere decal",
  };
}

async function readJsonIfExists(file) {
  try {
    return JSON.parse((await readFile(file, "utf8")).replace(/^\uFEFF/, ""));
  } catch {
    return null;
  }
}

const existing = await readJsonIfExists(existingPath);
const legacy = await readJsonIfExists(legacyImagePath);
const pack = await readJsonIfExists(packPath);
const deepSky = [
  ...(existing?.items ?? []).map(normalizeExisting),
  ...(legacy ?? []).map(normalizeLegacyImage).filter(Boolean),
  ...(pack?.deepSky ?? []),
].filter((item, index, arr) => arr.findIndex((other) => other.id === item.id) === index);

for (const item of deepSky) {
  for (const slot of ["previewUrl", "qualityUrl"]) {
    const local = path.join(root, "public", item[slot].replace(/^\//, ""));
    try {
      await stat(local);
    } catch {
      item.missing = [...(item.missing ?? []), slot];
    }
  }
}

await writeFile(outPath, `${JSON.stringify({
  generatedAt: new Date().toISOString(),
  source: "Solar Sim combined deep-sky resources",
  license: "NASA media usage guidelines and existing project public astronomy assets",
  performancePolicy: "core preview first, deferred after idle, highQuality only under Quality/Showcase",
  deepSky,
}, null, 2)}\n`, "utf8");

console.log(`Wrote ${path.relative(root, outPath)} (${deepSky.length} deep-sky items)`);
