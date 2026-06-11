import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = path.join(root, "public", "models", "spacecraft", "nasa-v2", "manifest.json");
const outDir = path.join(root, "public", "data", "gallery-demo");

const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const item = [...(manifest.spacecraft ?? [])].sort((a, b) => a.bytes - b.bytes)[0];
if (!item) throw new Error("No spacecraft item available for Gallery cover demo");

const metadata = {
  kind: "solar-sim-gallery-cover",
  version: 3,
  spacecraftId: item.id,
  title: item.title,
  scaleLabel: item.scaleLabel,
  sourceCredit: item.sourceCreditShort,
  category: item.category,
  renderProfile: "gallery-v3-studio",
  capturedAt: "demo-export",
  boundary: "Gallery v3 cover metadata is a local WebGL showcase artifact, not a certified spacecraft material or scale model record.",
};

await mkdir(outDir, { recursive: true });
await writeFile(path.join(outDir, "gallery-cover-v3-demo.json"), `${JSON.stringify(metadata, null, 2)}\n`);
await writeFile(
  path.join(outDir, "gallery-cover-v3-demo.md"),
  [
    "# Gallery Cover v3 Demo",
    "",
    `- Spacecraft: ${metadata.title}`,
    `- Scale: ${metadata.scaleLabel}`,
    `- Source: ${metadata.sourceCredit}`,
    `- Render profile: ${metadata.renderProfile}`,
    `- Boundary: ${metadata.boundary}`,
    "",
  ].join("\n"),
);

console.log(`Wrote Gallery cover v3 demo metadata for ${item.id}.`);
