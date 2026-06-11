import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
let failed = false;

function fail(message) {
  failed = true;
  console.error(`FAIL ${message}`);
}

async function read(rel) {
  return readFile(path.join(root, rel), "utf8");
}

const [
  visualCalibration,
  closeupProfile,
  cameraPresets,
  planet,
  sun,
  solarBodies,
  gallery,
  metadata,
  visualAcceptance,
  readme,
] = await Promise.all([
  read("app/lib/visualCalibration.ts"),
  read("app/lib/closeupRenderProfile.ts"),
  read("app/lib/closeupCameraPresets.ts"),
  read("app/components/Planet.tsx"),
  read("app/components/SunBody.tsx"),
  read("app/components/SolarSystemBodies.tsx"),
  read("app/components/SpacecraftGalleryPanel.tsx"),
  read("app/lib/galleryCoverMetadata.ts"),
  read("scripts/visual-acceptance.mjs"),
  read("README.md"),
]);

for (const token of [
  "limbDarkening",
  "bandContrast",
  "ringPhaseContrast",
  "cloudSilverLining",
  "nightTerminatorCutoff",
]) {
  if (!visualCalibration.includes(token)) fail(`visual calibration missing ${token}`);
  if (!closeupProfile.includes(token)) fail(`closeup profile missing ${token}`);
}

for (const token of ["sun", "earth", "jupiter", "saturn"]) {
  if (!cameraPresets.includes(`${token}:`)) fail(`closeup camera preset missing ${token}`);
}

for (const token of ["uNightCutoff", "uSilverLining", "calibratedBandContrast"]) {
  if (!planet.includes(token)) fail(`Planet closeup shader/material missing ${token}`);
}

for (const token of ["uLimbDarkening", "uCoronaAlpha", "flareOpacity"]) {
  if (!sun.includes(token)) fail(`Sun closeup shader missing ${token}`);
}

for (const token of ["phaseContrast", "ringPhaseContrast"]) {
  if (!solarBodies.includes(token)) fail(`Saturn ring closeup missing ${token}`);
}

for (const token of [
  'data-solar-gallery="v3"',
  "gallery-cover-export",
  "data-solar-gallery-metadata",
  "createGalleryCoverMetadata",
]) {
  if (!gallery.includes(token)) fail(`Gallery v3 UI/export missing ${token}`);
}

if (!metadata.includes('"solar-sim-gallery-cover"') || !metadata.includes("version: 3")) {
  fail("Gallery cover metadata shape missing versioned marker");
}

for (const token of ["sun-closeup-v3", "earth-closeup-v3", "jupiter-closeup-v3", "saturn-closeup-v3", "gallery-cover-v3"]) {
  if (!visualAcceptance.includes(token)) fail(`visual acceptance missing ${token}`);
}

if (!/AAA Closeup|Gallery v3|not an offline film renderer/i.test(readme)) {
  fail("README missing AAA closeup boundary");
}

if (failed) process.exit(1);
console.log("PASS AAA closeup v3 audit: calibration, deterministic camera presets, Gallery metadata, and visual gates present.");
