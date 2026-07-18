import { createHash } from "node:crypto";
import { readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  ATLAS_RELEASE_SOURCE_POLICY_V241_VERSION,
  EXCLUDED_PROJECT_PREFIXES_V241,
  FROZEN_V9_SHA256_V241,
  PROJECT_SOURCE_FILES_V241,
  PROJECT_SOURCE_ROOTS_V241,
  PROJECT_SOURCE_TOP_LEVEL_PATTERNS_V241,
  sourceCategoryV241,
} from "./release-source-policy-v241.mjs";

const root = process.cwd();
const checkOnly = process.argv.includes("--check");
const outputFile = path.join(
  root,
  "dist",
  "release",
  "orbit-atlas-release-source-inventory-v241.json",
);
const posix = (value) => value.replaceAll("\\", "/");
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

async function exists(relative) {
  try {
    await stat(path.join(root, relative));
    return true;
  } catch {
    return false;
  }
}

async function walk(relativeRoot) {
  const absoluteRoot = path.resolve(root, relativeRoot);
  const relativeBoundary = `${posix(relativeRoot).replace(/\/$/, "")}/`;
  if (!absoluteRoot.startsWith(`${path.resolve(root)}${path.sep}`)) {
    throw new Error(`allowlist root escapes project boundary: ${relativeRoot}`);
  }
  const files = [];
  const entries = await readdir(absoluteRoot, { withFileTypes: true });
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const relative = posix(path.join(relativeRoot, entry.name));
    if (entry.isSymbolicLink()) {
      throw new Error(`symlink/reparse source entry is not allowed: ${relative}`);
    }
    if (entry.isDirectory()) files.push(...await walk(relative));
    else if (entry.isFile()) files.push(relative);
  }
  if (files.some((file) => !file.startsWith(relativeBoundary))) {
    throw new Error(`walk escaped allowlist root: ${relativeRoot}`);
  }
  return files;
}

async function topLevelFiles() {
  const entries = await readdir(root, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((file) => PROJECT_SOURCE_TOP_LEVEL_PATTERNS_V241.some((pattern) => pattern.test(file)))
    .sort();
}

async function hashFile(relative) {
  const absolute = path.resolve(root, relative);
  if (!absolute.startsWith(`${path.resolve(root)}${path.sep}`)) {
    throw new Error(`source file escapes project boundary: ${relative}`);
  }
  const value = await readFile(absolute);
  return {
    path: posix(relative),
    category: sourceCategoryV241(relative),
    bytes: value.byteLength,
    sha256: sha256(value),
  };
}

const missingRoots = [];
const files = [];
for (const entry of PROJECT_SOURCE_ROOTS_V241) {
  if (!await exists(entry.path)) {
    missingRoots.push(entry.path);
    continue;
  }
  files.push(...await walk(entry.path));
}
if (missingRoots.length > 0) {
  throw new Error(`required source roots are missing: ${missingRoots.join(", ")}`);
}
for (const file of PROJECT_SOURCE_FILES_V241) {
  if (!await exists(file)) throw new Error(`required source file is missing: ${file}`);
  files.push(file);
}
files.push(...await topLevelFiles());

const uniqueFiles = [...new Set(files.map(posix))].sort();
for (const file of uniqueFiles) {
  const forbidden = EXCLUDED_PROJECT_PREFIXES_V241.find(
    (prefix) => file === prefix.replace(/\/$/, "") || file.startsWith(prefix),
  );
  if (forbidden) throw new Error(`excluded path entered release allowlist: ${file}`);
  if (file === ".env.local" || file.endsWith(".log") || file.endsWith(".tsbuildinfo")) {
    throw new Error(`local or generated file entered release allowlist: ${file}`);
  }
}

const entries = [];
for (const file of uniqueFiles) entries.push(await hashFile(file));
const entryMap = new Map(entries.map((entry) => [entry.path, entry]));

for (const [file, expected] of Object.entries(FROZEN_V9_SHA256_V241)) {
  const actual = entryMap.get(file)?.sha256;
  if (actual !== expected) {
    throw new Error(`frozen V9 hash mismatch: ${file} expected=${expected} actual=${actual ?? "missing"}`);
  }
}

const liteManifest = JSON.parse(
  await readFile(path.join(root, "public", "atlas-lite", "manifest.json"), "utf8"),
);
if (liteManifest.fileCount !== 595 || liteManifest.files?.length !== 595) {
  throw new Error(
    `Lite manifest contract mismatch: fileCount=${liteManifest.fileCount} entries=${liteManifest.files?.length}`,
  );
}
for (const asset of liteManifest.files) {
  const file = `public/atlas-lite/${posix(asset.path)}`;
  const actual = entryMap.get(file);
  if (!actual || actual.bytes !== asset.bytes || actual.sha256 !== asset.sha256) {
    throw new Error(`Lite asset mismatch: ${file}`);
  }
}
const liteEntries = entries.filter((entry) => entry.path.startsWith("public/atlas-lite/"));
if (liteEntries.length !== 596) {
  throw new Error(`Lite allowlist must contain 595 assets plus manifest; found ${liteEntries.length}`);
}

const categories = Object.fromEntries(
  [...new Set(entries.map((entry) => entry.category))].sort().map((category) => {
    const categoryEntries = entries.filter((entry) => entry.category === category);
    return [category, {
      fileCount: categoryEntries.length,
      bytes: categoryEntries.reduce((total, entry) => total + entry.bytes, 0),
    }];
  }),
);
const inventoryCore = {
  version: ATLAS_RELEASE_SOURCE_POLICY_V241_VERSION,
  projectRoot: "solar_sim/next-web",
  gitScope: "project-only-no-parent-or-sibling-projects",
  entries,
  categories,
  totals: {
    fileCount: entries.length,
    bytes: entries.reduce((total, entry) => total + entry.bytes, 0),
  },
  contracts: {
    liteAssetCount: liteManifest.fileCount,
    liteAllowlistFileCount: liteEntries.length,
    liteInstalledBytes: liteManifest.installedBytes,
    frozenV9Sha256: FROZEN_V9_SHA256_V241,
    excludedPrefixes: EXCLUDED_PROJECT_PREFIXES_V241,
    excludesOtherProjectsUnderGitRoot: true,
    containsResearchCache: false,
    containsBuildOutput: false,
    containsLocalSecrets: false,
  },
};
const manifest = {
  ...inventoryCore,
  manifestSha256: sha256(JSON.stringify(inventoryCore)),
};
const serialized = `${JSON.stringify(manifest, null, 2)}\n`;

if (checkOnly) {
  const existing = await readFile(outputFile, "utf8");
  if (existing !== serialized) {
    throw new Error("v241 source inventory is stale; rebuild it before the science freeze");
  }
  console.log(JSON.stringify({ ok: true, output: posix(path.relative(root, outputFile)), manifestSha256: manifest.manifestSha256 }));
} else {
  await writeFile(outputFile, serialized);
  console.log(JSON.stringify({
    ok: true,
    output: posix(path.relative(root, outputFile)),
    fileCount: manifest.totals.fileCount,
    bytes: manifest.totals.bytes,
    liteAllowlistFiles: liteEntries.length,
    manifestSha256: manifest.manifestSha256,
  }));
}

