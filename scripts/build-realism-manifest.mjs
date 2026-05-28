import { readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const deepSkyDir = path.join(root, "public", "textures", "deep-sky");
const sourceManifestPath = path.join(deepSkyDir, "nasa-image-manifest.json");
const outputPath = path.join(deepSkyDir, "realism-manifest.json");

const targets = [
  ["m42", "Orion Nebula", "orion-nebula-pia04227.jpg", 209.0, -19.4, "core"],
  ["ic434", "Horsehead Nebula", "horsehead-nebula-pia04215.jpg", 206.8, -16.5, "core"],
  ["ngc2237", "Rosette Nebula", "rosette-nebula-pia09268.jpg", 206.3, -2.1, "core"],
  ["m8", "Lagoon Nebula", "lagoon-nebula-gsfc.jpg", 6.0, -1.3, "core"],
  ["m16", "Eagle Nebula", "eagle-nebula.jpg", 17.0, 0.8, "core"],
  ["m17", "Omega Nebula", "omega-nebula.jpg", 15.0, -0.7, "core"],
  ["m20", "Trifid Nebula", "trifid-nebula.jpg", 7.0, -0.2, "core"],
  ["ngc3372", "Carina Nebula", "carina-nebula.jpg", 287.6, -0.6, "core"],
  ["ngc7000", "North America Nebula", "north-america-nebula.jpg", 84.0, -0.8, "core"],
  ["m45", "Pleiades", "pleiades.jpg", 166.6, -23.5, "core"],
  ["m31", "Andromeda Galaxy", "andromeda-galaxy.jpg", 121.2, -21.6, "deferred"],
  ["veil", "Veil Nebula", "veil-nebula.jpg", 74.0, -8.6, "deferred"],
  ["m1", "Crab Nebula", "crab-nebula.jpg", 184.6, -5.8, "deferred"],
  ["m57", "Ring Nebula", "ring-nebula.jpg", 63.2, 13.9, "deferred"],
  ["m27", "Dumbbell Nebula", "dumbbell-nebula.jpg", 60.8, -3.7, "deferred"],
  ["m33", "Triangulum Galaxy", "triangulum-galaxy.jpg", 133.6, -31.3, "highQuality"],
  ["ngc5139", "Omega Centauri", "omega-centauri.jpg", 309.1, 14.9, "highQuality"],
  ["ngc104", "47 Tucanae", "47-tucanae.jpg", 305.9, -44.9, "highQuality"],
];

const rawSource = JSON.parse((await readFile(sourceManifestPath, "utf8")).replace(/^\uFEFF/, ""));
const sourceByFile = new Map(rawSource.map((entry) => [entry.file, entry]));

const items = [];
for (const [id, name, file, galLonDeg, galLatDeg, tier] of targets) {
  const source = sourceByFile.get(file);
  const filePath = path.join(deepSkyDir, file);
  let bytes = source?.bytes ?? null;
  try {
    bytes = (await stat(filePath)).size;
  } catch {
    // Keep manifest generation non-fatal when optional high-quality assets are absent.
  }
  items.push({
    id,
    name,
    file,
    publicUrl: `/textures/deep-sky/${file}`,
    bytes,
    source: source?.source ?? "Project curated public astronomy asset",
    sourceUrl: source?.assetUrl ?? null,
    credit: source?.source ?? "NASA/ESA/ESO public outreach image where available",
    galactic: { lonDeg: galLonDeg, latDeg: galLatDeg },
    renderTier: tier,
    renderMode: "anchored sky-sphere decal",
  });
}

await writeFile(
  outputPath,
  `${JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      coordinateFrame: "galactic lon/lat degrees, approximate visual alignment",
      performancePolicy: "core assets first, deferred assets on idle, highQuality assets only when enabled",
      items,
    },
    null,
    2,
  )}\n`,
  "utf8",
);

console.log(`Wrote ${path.relative(root, outputPath)} (${items.length} entries)`);
