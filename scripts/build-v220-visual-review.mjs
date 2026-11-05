import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { createHash } from "node:crypto";

const root = process.cwd();
const sourceRoot = path.join(root, "output/playwright/v197-visual-candidates");
const outputRoot = path.join(root, "output/playwright/v220-visual-review");
const journeys = ["overview", "inspect", "stellar-exoplanet", "launch", "relativity", "scene-lab"];
const keyframes = ["entry", "hero", "exit"];
const viewports = {
  "desktop-1440x900": { tileWidth: 360, tileHeight: 225 },
  "mobile-390x844": { tileWidth: 195, tileHeight: 422 },
};

await mkdir(outputRoot, { recursive: true });
const artifacts = [];
for (const [viewport, tile] of Object.entries(viewports)) {
  const inputs = journeys.flatMap((journey) =>
    keyframes.map((keyframe) => ({
      journey,
      keyframe,
      file: path.join(sourceRoot, viewport, `${journey}-${keyframe}.png`),
    })),
  );
  const composites = await Promise.all(inputs.map(async (item, index) => ({
    input: await sharp(item.file)
      .resize(tile.tileWidth, tile.tileHeight, { fit: "cover", position: "centre" })
      .png()
      .toBuffer(),
    left: (index % 3) * tile.tileWidth,
    top: Math.floor(index / 3) * tile.tileHeight,
  })));
  const output = path.join(outputRoot, `${viewport}-36-frame-review.png`);
  await sharp({
    create: {
      width: tile.tileWidth * 3,
      height: tile.tileHeight * journeys.length,
      channels: 3,
      background: "#030303",
    },
  }).composite(composites).png().toFile(output);
  const bytes = await readFile(output);
  artifacts.push({
    viewport,
    file: path.relative(root, output).replaceAll("\\", "/"),
    sha256: createHash("sha256").update(bytes).digest("hex"),
    frameOrder: inputs.map(({ journey, keyframe }) => `${journey}:${keyframe}`),
  });
}

const manifest = {
  version: "v220-six-journey-visual-review",
  source: "fresh-v217-production-candidate-matrix",
  frameCount: 36,
  baselineUpdated: process.env.ATLAS_UPDATE_VISUAL_BASELINES === "1",
  layout: "rows-are-journeys-columns-are-entry-hero-exit",
  artifacts,
  boundary: "review-artifact-only-no-runtime-asset-or-v9-mutation",
};
await writeFile(path.join(outputRoot, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(JSON.stringify(manifest, null, 2));
