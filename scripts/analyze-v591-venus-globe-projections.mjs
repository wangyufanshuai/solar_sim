import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import sharp from "sharp";

const root = process.cwd();
const inputs = Object.freeze([
  { id: "venus-magellan-0e", longitudeEastDeg: 0, path: "source-cache/celestial-convergence-v591/venus/PIA00257~orig.jpg" },
  { id: "venus-magellan-90e", longitudeEastDeg: 90, path: "source-cache/celestial-convergence-v591/venus/PIA00270~orig.jpg" },
  { id: "venus-magellan-180e-grid-reference", longitudeEastDeg: 180, path: "source-cache/celestial-convergence-v591/venus/PIA00478~orig.jpg" },
  { id: "venus-magellan-270e", longitudeEastDeg: 270, path: "source-cache/celestial-convergence-v591/venus/S91-50688~orig.jpg" },
]);

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

function foreground(r, g, b) {
  return Math.max(r, g, b) >= 18 && r + g + b >= 42;
}

function widestForegroundRun(data, width, y) {
  let bestStart = -1;
  let bestEnd = -1;
  let start = -1;
  for (let x = 0; x <= width; x += 1) {
    const active = x < width && foreground(data[(y * width + x) * 3], data[(y * width + x) * 3 + 1], data[(y * width + x) * 3 + 2]);
    if (active && start < 0) start = x;
    if ((!active || x === width) && start >= 0) {
      const end = x - 1;
      if (end - start > bestEnd - bestStart) {
        bestStart = start;
        bestEnd = end;
      }
      start = -1;
    }
  }
  return { start: bestStart, end: bestEnd, length: bestEnd >= bestStart ? bestEnd - bestStart + 1 : 0 };
}

function widestForegroundColumnRun(data, width, height, x) {
  let bestStart = -1;
  let bestEnd = -1;
  let start = -1;
  for (let y = 0; y <= height; y += 1) {
    const offset = (y * width + x) * 3;
    const active = y < height && foreground(data[offset], data[offset + 1], data[offset + 2]);
    if (active && start < 0) start = y;
    if ((!active || y === height) && start >= 0) {
      const end = y - 1;
      if (end - start > bestEnd - bestStart) {
        bestStart = start;
        bestEnd = end;
      }
      start = -1;
    }
  }
  return { start: bestStart, end: bestEnd, length: bestEnd >= bestStart ? bestEnd - bestStart + 1 : 0 };
}

const records = [];
for (const input of inputs) {
  const absolute = resolve(root, input.path);
  const bytes = readFileSync(absolute);
  const { data, info } = await sharp(bytes, { limitInputPixels: false }).removeAlpha().toColourspace("srgb").raw().toBuffer({ resolveWithObject: true });
  if (info.channels !== 3) throw new Error(`v591-venus-projection-channels:${input.id}:${info.channels}`);
  const rows = [];
  for (let y = 0; y < info.height; y += 1) rows.push({ y, ...widestForegroundRun(data, info.width, y) });
  const widestRow = rows.reduce((best, row) => row.length > best.length ? row : best, rows[0]);
  const usefulRows = rows.filter((row) => row.length >= widestRow.length * 0.10);
  const columns = [];
  for (let x = 0; x < info.width; x += 1) columns.push({ x, ...widestForegroundColumnRun(data, info.width, info.height, x) });
  const tallestColumn = columns.reduce((best, column) => column.length > best.length ? column : best, columns[0]);
  const usefulColumns = columns.filter((column) => column.length >= tallestColumn.length * 0.10);
  const minX = Math.min(...usefulRows.map((row) => row.start));
  const maxX = Math.max(...usefulRows.map((row) => row.end));
  const minY = Math.min(...usefulColumns.map((column) => column.start));
  const maxY = Math.max(...usefulColumns.map((column) => column.end));
  records.push({
    ...input,
    bytes: bytes.byteLength,
    sha256: sha256(bytes),
    width: info.width,
    height: info.height,
    foregroundThreshold: "max>=18 and rgb-sum>=42",
    bbox: { minX, minY, maxX, maxY },
    center: { x: (minX + maxX) / 2, y: (minY + maxY) / 2 },
    radius: { x: (maxX - minX + 1) / 2, y: (maxY - minY + 1) / 2 },
    widestRow,
    tallestColumn,
  });
}

console.log(JSON.stringify({ version: "v591-venus-globe-projection-analysis-v1", records }, null, 2));
