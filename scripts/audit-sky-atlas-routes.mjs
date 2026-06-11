import { existsSync, readFileSync } from "node:fs";

const failures = [];
const requiredFiles = [
  "app/lib/skyAtlas.ts",
  "app/lib/skyAtlasStorage.ts",
  "app/components/SkyAtlasExplorer.tsx",
  "public/data/atlas-demo/deep-sky-flight-route-v2.json",
  "public/data/atlas-demo/sky-atlas-map-demo.json",
];

for (const file of requiredFiles) {
  if (!existsSync(file)) failures.push(`Missing required file: ${file}`);
}

const skyAtlas = existsSync("app/lib/skyAtlas.ts") ? readFileSync("app/lib/skyAtlas.ts", "utf8") : "";
for (const token of [
  "SkyAtlasProjection",
  "SkyAtlasMapState",
  "SkyAtlasCustomRoute",
  "SkyAtlasRouteExport",
  "SkyAtlasTargetNarrative",
  "projectSkyAtlasObject",
  "nearestSkyAtlasObject",
  "createSkyAtlasCustomRoute",
  "skyAtlasRouteToJson",
  "skyAtlasRouteToMarkdown",
  "skyAtlasTargetNarrative",
]) {
  if (!skyAtlas.includes(token)) failures.push(`Missing Sky Atlas route/map interface: ${token}`);
}

const storage = existsSync("app/lib/skyAtlasStorage.ts") ? readFileSync("app/lib/skyAtlasStorage.ts", "utf8") : "";
for (const token of ["customRoutes", "upsertCustomRoute", "sanitizeSkyAtlasStorage"]) {
  if (!storage.includes(token)) failures.push(`Missing Sky Atlas storage support: ${token}`);
}

const explorer = existsSync("app/components/SkyAtlasExplorer.tsx") ? readFileSync("app/components/SkyAtlasExplorer.tsx", "utf8") : "";
for (const token of [
  "data-solar-atlas-map",
  "data-solar-atlas-route-builder",
  'data-solar-action="atlas-route-add"',
  'data-solar-action="atlas-route-export-json"',
  'data-solar-action="atlas-route-export-md"',
  "Why visit",
]) {
  if (!explorer.includes(token)) failures.push(`Missing Sky Atlas v2 UI marker/copy: ${token}`);
}

for (const file of ["public/data/atlas-demo/deep-sky-flight-route-v2.json", "public/data/atlas-demo/sky-atlas-map-demo.json"]) {
  if (!existsSync(file)) continue;
  const json = JSON.parse(readFileSync(file, "utf8"));
  if (!json.boundary || !/Curated Sky Atlas/i.test(json.boundary)) failures.push(`${file} missing boundary`);
  if (!Array.isArray(json.stops ?? json.projections)) failures.push(`${file} missing route stops or projection samples`);
}

if (failures.length) {
  console.error(failures.map((failure) => `FAIL ${failure}`).join("\n"));
  process.exit(1);
}

console.log("PASS Sky Atlas v2 route builder, map, exports, and storage audit.");
