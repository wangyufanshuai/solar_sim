import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import sharp from "sharp";
import MainlineAStellarPortraitV607 from "../app/components/MainlineAStellarPortraitV607";
import { MAINLINE_A_CURRENT_STARS } from "../app/data/mainlineAMetadataV607";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDir = path.join(root, "docs/release/v607/visuals");
const escape = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
const sha256 = (bytes: Buffer) => createHash("sha256").update(bytes).digest("hex");

async function main() {
  mkdirSync(outputDir, { recursive: true });
  const panels: { input: Buffer; left: number; top: number }[] = [];
  const columns = 3;
  const rowHeight = 364;
  const topInset = 64;
  const stars = MAINLINE_A_CURRENT_STARS;
  for (const [index, star] of stars.entries()) {
    const markup = renderToStaticMarkup(createElement(MainlineAStellarPortraitV607, { objectId: star.id, title: star.displayName, profile: star.artDirection }));
    const innerSvg = markup.match(/<svg[^>]*>([\s\S]*?)<\/svg>/)?.[1];
    if (!innerSvg) throw new Error(`No rendered portrait SVG for ${star.id}`);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="344" viewBox="0 0 360 344"><rect width="360" height="344" fill="#070c13"/><g font-family="sans-serif" fill="#d8dfeb"><text x="20" y="30" font-size="18">${escape(star.displayName)}</text><text x="20" y="49" font-size="11" fill="#8797aa">${escape(star.science.spectralType ?? "")} · PARAMETRIC PHOTOSPHERE</text></g><g transform="translate(0 55)">${innerSvg}</g><text x="180" y="331" text-anchor="middle" font-family="sans-serif" font-size="10" fill="#8e9bae">ILLUSTRATION · NORMALIZED SIZE · EQUATORIAL VIEW</text></svg>`;
    const svgPath = path.join(outputDir, `stellar-${star.id}.svg`);
    writeFileSync(svgPath, svg);
    panels.push({ input: await sharp(Buffer.from(svg)).png().toBuffer(), left: (index % columns) * 380 + 20, top: Math.floor(index / columns) * rowHeight + topInset });
  }
  const rowCount = Math.ceil(stars.length / columns);
  const canvasHeight = topInset + rowCount * rowHeight + 20;
  const title = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1160" height="55"><text x="24" y="33" fill="#e8dcc3" font-family="sans-serif" font-size="22">STELLAR ATLAS / ${stars.length} PARAMETRIC PORTRAITS</text></svg>`);
  const outputPath = path.join(outputDir, "stellar-portraits-v607.png");
  await sharp({ create: { width: 1160, height: canvasHeight, channels: 4, background: "#111821" } }).composite([{ input: title, left: 0, top: 0 }, ...panels]).png().toFile(outputPath);
  const bytes = readFileSync(outputPath);
  const sourcePaths = [
    "app/components/MainlineAStellarPortraitV607.tsx", "app/data/mainlineAMetadataV607.ts",
    "app/data/mainlineAStellarEvidenceV607.ts", "app/data/mainlineABetaStellarProjectionV607.generated.ts",
    "app/data/mainlineABetaStellarNarrativesV607.ts", "app/data/stellarHeroesV592.generated.ts",
    "scripts/render-mainline-a4-portraits.ts",
  ];
  const receipt = {
    schema: "mainline-a4-static-portrait-render-v1",
    renderer: "React SSR SVG + sharp/libvips",
    scope: "static-portrait-rasterization-only-not-browser-or-interaction-validation",
    objects: stars.map((star) => star.id),
    image: { path: "docs/release/v607/visuals/stellar-portraits-v607.png", width: 1160, height: canvasHeight, bytes: bytes.length, sha256: sha256(bytes) },
    sources: sourcePaths.map((file) => ({ path: file, sha256: sha256(readFileSync(path.join(root, file))) })),
  };
  writeFileSync(path.join(outputDir, "stellar-portraits-render.json"), `${JSON.stringify(receipt, null, 2)}\n`);
  console.log(JSON.stringify(receipt, null, 2));
}

void main().catch((error: unknown) => { console.error(error); process.exitCode = 1; });
