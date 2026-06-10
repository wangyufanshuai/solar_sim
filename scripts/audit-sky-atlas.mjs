import { existsSync, readFileSync } from "node:fs";

const requiredFiles = [
  "app/lib/skyAtlas.ts",
  "app/lib/skyAtlasStorage.ts",
  "app/components/SkyAtlasExplorer.tsx",
  "app/components/SkyAtlasFlightHud.tsx",
  "public/textures/deep-sky/combined-resource-manifest.json",
];

const failures = [];
for (const file of requiredFiles) {
  if (!existsSync(file)) failures.push(`Missing required Sky Atlas file: ${file}`);
}

const skyAtlasSource = existsSync("app/lib/skyAtlas.ts")
  ? readFileSync("app/lib/skyAtlas.ts", "utf8")
  : "";
for (const token of [
  "export type SkyAtlasObject",
  "export type SkyAtlasRoute",
  "buildSkyAtlasCatalog",
  "searchSkyAtlasObjects",
  "skyAtlasObjectToDirection",
  "defaultSkyAtlasRoute",
  "solar-sim:sky-atlas:v1",
]) {
  if (!skyAtlasSource.includes(token) && !readFileSync("app/lib/skyAtlasStorage.ts", "utf8").includes(token)) {
    failures.push(`Sky Atlas implementation missing token: ${token}`);
  }
}

for (const routeToken of ["m42", "m45", "m1", "carina", "m57", "b0833-45", "alpha-centauri", "vega"]) {
  if (!skyAtlasSource.includes(routeToken)) failures.push(`Default route target missing: ${routeToken}`);
}

const explorerSource = existsSync("app/components/SkyAtlasExplorer.tsx")
  ? readFileSync("app/components/SkyAtlasExplorer.tsx", "utf8")
  : "";
for (const token of [
  'data-solar-panel="sky-atlas"',
  'data-solar-action="atlas-cover"',
  'data-solar-action="atlas-route-play"',
  "data-solar-atlas-target-card",
  "data-solar-atlas-search-results",
]) {
  if (!explorerSource.includes(token)) failures.push(`Sky Atlas UI marker missing: ${token}`);
}

if (existsSync("public/textures/deep-sky/combined-resource-manifest.json")) {
  const manifest = JSON.parse(readFileSync("public/textures/deep-sky/combined-resource-manifest.json", "utf8"));
  const items = Array.isArray(manifest.deepSky) ? manifest.deepSky : [];
  if (items.length < 20) failures.push(`Expected at least 20 deep-sky manifest entries, found ${items.length}`);
  for (const item of items) {
    if (!item.id || !item.name) failures.push(`Deep-sky item missing id/name: ${JSON.stringify(item)}`);
    if (!item.previewUrl && !item.qualityUrl) failures.push(`Deep-sky item missing preview/quality URL: ${item.id}`);
    if (!item.credit) failures.push(`Deep-sky item missing credit: ${item.id}`);
    if (!item.renderTier) failures.push(`Deep-sky item missing renderTier: ${item.id}`);
  }
}

if (failures.length) {
  console.error(failures.map((failure) => `FAIL ${failure}`).join("\n"));
  process.exit(1);
}

console.log("PASS Sky Atlas catalog, route, UI markers, and manifest provenance are present.");
