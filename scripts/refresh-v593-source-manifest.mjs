import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { mkdir, rename, writeFile } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import { V593_SOURCE_PATHS } from "./v593-source-paths.mjs";

const root = resolve(process.cwd());
const outputPath = resolve(root, "docs/release/v593/source-manifest-v593.json");
const baselineManifestSha256 = "8e0b9c8db57ed8bcdfce10d7246083cc640a0639c1418e034647b2e5b1b4a6ba";
const generatedAt = "2026-08-22T00:00:00.000Z";

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
}
const canonicalSha = (value) => sha256(Buffer.from(JSON.stringify(canonicalize(value)), "utf8"));
const fileRecord = (path) => {
  const bytes = readFileSync(path);
  return Object.freeze({
    path: relative(root, path).replaceAll("\\", "/"),
    bytes: bytes.byteLength,
    sha256: sha256(bytes),
  });
};

const unsigned = {
  version: "v593-source-manifest-v1",
  generatedAt,
  status: "complete",
  baseline: Object.freeze({ candidate: "v592-readonly", manifestSha256: baselineManifestSha256 }),
  files: V593_SOURCE_PATHS
    .map((path) => fileRecord(resolve(root, path)))
    .sort((left, right) => left.path.localeCompare(right.path)),
};
const manifest = { ...unsigned, receiptSha256: canonicalSha(unsigned) };
await mkdir(dirname(outputPath), { recursive: true });
await writeFile(`${outputPath}.part`, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
await rename(`${outputPath}.part`, outputPath);
console.log(JSON.stringify({
  status: manifest.status,
  fileCount: manifest.files.length,
  receiptSha256: manifest.receiptSha256,
}, null, 2));
