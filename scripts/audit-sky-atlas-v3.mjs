import { existsSync, readFileSync } from "node:fs";

const failures = [];
const requiredFiles = [
  "app/lib/skyAtlas.ts",
  "app/lib/skyAtlasPlayback.ts",
  "app/lib/skyAtlasAlbum.ts",
  "app/lib/skyAtlasStorage.ts",
  "app/components/SkyAtlasExplorer.tsx",
  "app/UniversePage.tsx",
];

for (const file of requiredFiles) {
  if (!existsSync(file)) failures.push(`Missing required Atlas v3 file: ${file}`);
}

const atlas = readFileSync("app/lib/skyAtlas.ts", "utf8");
for (const token of [
  "SkyAtlasMode",
  "SkyAtlasMapCluster",
  "SkyAtlasSearchScore",
  "SkyAtlasPlaybackState",
  "SkyAtlasComparison",
  "rankSkyAtlasObjects",
  "clusterSkyAtlasObjects",
  "compareSkyAtlasObjects",
]) {
  if (!atlas.includes(token)) failures.push(`Missing Atlas v3 interface: ${token}`);
}

const playback = readFileSync("app/lib/skyAtlasPlayback.ts", "utf8");
for (const token of ["pause", "resume", "previous", "next", "speed", "progress"]) {
  if (!playback.includes(`\"${token}\"`)) failures.push(`Playback controller missing ${token}`);
}

const album = readFileSync("app/lib/skyAtlasAlbum.ts", "utf8");
for (const token of ["SkyAtlasAlbumRecord", "indexedDB.open", "MAX_RECORDS = 12", "thumbnailWebp"]) {
  if (!album.includes(token)) failures.push(`Atlas album missing ${token}`);
}

const storage = readFileSync("app/lib/skyAtlasStorage.ts", "utf8");
for (const token of ["comparisonIds", "preferredMode", "sanitizeSkyAtlasStorage"]) {
  if (!storage.includes(token)) failures.push(`Atlas v3 storage compatibility missing ${token}`);
}

const explorer = readFileSync("app/components/SkyAtlasExplorer.tsx", "utf8");
for (const token of [
  "data-solar-atlas-mode",
  "data-solar-atlas-clustered",
  "data-solar-atlas-playback",
  "data-solar-atlas-comparison",
  "data-solar-atlas-album",
  'data-solar-action="atlas-mode-toggle"',
]) {
  if (!explorer.includes(token)) failures.push(`Atlas v3 UI marker missing ${token}`);
}

const page = readFileSync("app/UniversePage.tsx", "utf8");
if (!page.includes('skyAtlasMode === "immersive"')) failures.push("Immersive HUD suppression missing");
if (!page.includes('dispatchSkyAtlasPlayback({ type: "pause" })')) failures.push("User camera input does not pause Atlas playback");

const readme = readFileSync("README.md", "utf8");
if (!/curated visual explorer/i.test(readme) || !/not a complete SpaceEngine|not.*SpaceEngine/i.test(readme)) {
  failures.push("README missing Atlas v3 SpaceEngine/planetarium boundary");
}

if (failures.length) {
  console.error(failures.map((failure) => `FAIL ${failure}`).join("\n"));
  process.exit(1);
}

console.log("PASS Sky Atlas v3 immersive mode, ranked search, playback, comparison, album, and boundary audit.");
