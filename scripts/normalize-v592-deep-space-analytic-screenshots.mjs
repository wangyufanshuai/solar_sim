import { mkdir, readdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import sharp from "sharp";

const root = process.cwd();
const inputRoot = resolve(root, "tmp/v592-deep-space-analytic-matrix");
const outputRoot = resolve(root, "docs/release/v592/screenshots/deep-space-analytic-matrix");

await mkdir(outputRoot, { recursive: true });
const files = (await readdir(inputRoot)).filter((name) => name.endsWith(".png")).sort();
if (files.length !== 24) throw new Error(`v592-analytic-screenshot-count:${files.length}`);

const output = [];
for (const file of files) {
  const inputPath = join(inputRoot, file);
  const outputPath = join(outputRoot, file.replace(/\.png$/i, ".jpg"));
  const bytes = await sharp(await readFile(inputPath), { limitInputPixels: false })
    .jpeg({ quality: 92, progressive: false, chromaSubsampling: "4:4:4" })
    .toBuffer();
  await writeFile(`${outputPath}.part`, bytes);
  await rm(outputPath, { force: true });
  await rename(`${outputPath}.part`, outputPath);
  const metadata = await sharp(bytes).metadata();
  output.push({
    inputPath: inputPath.replace(`${root}\\`, "").replaceAll("\\", "/"),
    outputPath: outputPath.replace(`${root}\\`, "").replaceAll("\\", "/"),
    bytes: bytes.byteLength,
    width: metadata.width,
    height: metadata.height,
    format: metadata.format,
  });
}

console.log(JSON.stringify({ status: "normalized", count: output.length, output }, null, 2));
