import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const MAX_PACK_BYTES = 1024 * 1024 * 1024;
const failures = [];

function fail(message) {
  failures.push(message);
}

function read(file) {
  return readFileSync(path.join(root, file), "utf8");
}

function json(file) {
  return JSON.parse(read(file).replace(/^\uFEFF/, ""));
}

function requireToken(file, token) {
  const source = read(file);
  if (!source.includes(token)) fail(`${file} missing ${token}`);
}

const packDir = path.join(root, "public", "textures", "deep-sky", "pack-v3");
const manifestPath = "public/textures/deep-sky/pack-v3-manifest.json";
if (!existsSync(packDir)) fail("pack-v3 directory missing");
if (!existsSync(path.join(root, manifestPath))) fail("pack-v3 manifest missing");

if (existsSync(path.join(root, manifestPath))) {
  const manifest = json(manifestPath);
  if (manifest.packVersion !== "pack-v3") fail("pack-v3 manifest missing packVersion");
  if (!/preview/i.test(manifest.performancePolicy ?? "") || !/quality lazy/i.test(manifest.performancePolicy ?? "")) {
    fail("pack-v3 performance policy must state preview-first quality-lazy loading");
  }
  const items = Array.isArray(manifest.deepSky) ? manifest.deepSky : [];
  if (items.length < 24) fail(`expected at least 24 pack-v3 deep-sky resources, saw ${items.length}`);
  let total = 0;
  for (const item of items) {
    for (const key of ["previewUrl", "qualityUrl"]) {
      if (!item[key]) fail(`${item.id} missing ${key}`);
      const local = path.join(root, "public", item[key]?.replace(/^\//, "") ?? "");
      if (!existsSync(local)) fail(`${item.id} ${key} file missing`);
    }
    if (!item.credit || !item.sourceCredit || !item.sourceUrl) fail(`${item.id} missing source/credit metadata`);
    if (!item.checksum?.preview || !item.checksum?.quality) fail(`${item.id} missing checksums`);
    if (!Number.isFinite(item.galactic?.lonDeg) || !Number.isFinite(item.galactic?.latDeg)) fail(`${item.id} missing galactic position`);
    if (!item.visual?.dustPreserve || !item.visual?.shellOpacity) fail(`${item.id} missing v4 visual tuning`);
    if (item.renderProfile !== "deep-universe-v4-observational") fail(`${item.id} missing render profile`);
    total += Number(item.bytes?.preview ?? 0) + Number(item.bytes?.quality ?? 0);
  }
  if (total > MAX_PACK_BYTES) fail(`pack-v3 exceeds 1GB: ${total}`);
  const actualBytes = existsSync(packDir)
    ? readdirSync(packDir).reduce((sum, file) => sum + statSync(path.join(packDir, file)).size, 0)
    : 0;
  if (actualBytes > MAX_PACK_BYTES) fail(`pack-v3 files exceed 1GB: ${actualBytes}`);
}

requireToken("app/lib/deepUniverseTypes.ts", "DeepUniverseResourceManifest");
requireToken("app/lib/deepUniverseTypes.ts", "DeepSkyResourceV3");
requireToken("app/lib/deepUniverseTypes.ts", "DeepUniverseRenderProfile");
requireToken("app/lib/deepUniverseTypes.ts", "StarfieldRenderProfile");
requireToken("app/lib/deepUniverseTypes.ts", "DeepUniverseCoverMetadata");
requireToken("app/lib/deepUniverseProfile.ts", "deep-universe-v4-observational");
requireToken("app/components/UniverseSandboxHud.tsx", "data-solar-action=\"deep-universe-preset\"");
requireToken("app/components/SkyAtlasExplorer.tsx", "data-solar-action=\"atlas-deep-universe-preset\"");
requireToken("app/components/SkyAtlasExplorer.tsx", "resourcePack: \"pack-v3\"");
requireToken("app/components/DeepSkyImageSprites.tsx", "deep-universe-v4-preview-ready");
requireToken("app/components/DeepSkyImageSprites.tsx", "deep-universe-v4-quality-ready");
requireToken("app/components/GalaxyEnvironmentSphere.tsx", "uDustLaneContrast");
requireToken("app/components/GalaxyEnvironmentSphere.tsx", "uCoreCompression");

for (const file of ["app/components/NebulaMilkyWay.tsx", "app/components/GaiaStarField.tsx"]) {
  const source = read(file);
  if (source.includes("Math.random()")) fail(`${file} must not use nondeterministic Math.random()`);
  if (!source.includes("seededRandom")) fail(`${file} missing seeded deterministic generator`);
}

for (const id of [
  "deep-universe-showcase-v4",
  "milky-way-core-v4",
  "deep-sky-nebula-quality-v4",
  "starfield-density-v4",
  "atlas-deep-universe-route-v4",
  "solar-system-deep-sky-blend-v4",
  "mobile-deep-universe-v4",
]) {
  requireToken("scripts/visual-acceptance.mjs", id);
}

requireToken("scripts/perf-profile.mjs", "deep-universe-preset");
requireToken("scripts/perf-profile.mjs", "atlas-deep-universe-route");
requireToken("scripts/perf-baseline.json", "deepUniversePresetMaxTaskMs");
requireToken("scripts/perf-baseline.json", "atlasDeepUniverseRouteMaxTaskMs");
requireToken("README.md", "Deep Universe v4");
requireToken("README.md", "not a complete SpaceEngine");
requireToken("README.md", "not a certified planetarium");
requireToken("README.md", "not a scientific astrometry");

if (failures.length) {
  console.error(`Deep Universe audit failed (${failures.length})`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Deep Universe v4 audit passed");
