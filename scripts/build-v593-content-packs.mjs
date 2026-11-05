import { createHash } from "node:crypto";
import { copyFile, link, lstat, mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";

const root = resolve(process.cwd());
const outputRoot = resolve(root, "dist/content-packs/v593");
const generatedAt = "2026-08-21T00:00:00.000Z";
const MIB = 1024 * 1024;
const baselineBudget = Object.freeze({
  lite: 85_970_228,
  full: 783_308_519,
  liteTarget: 78 * MIB,
  fullTarget: 720 * MIB,
});
const packSpecs = Object.freeze([
  Object.freeze({
    id: "v593-lite-surface-detail",
    deliveryTier: "vercel-lite",
    residency: "focus-demand",
    focusFamilies: Object.freeze(["moon", "venus", "bennu", "mars"]),
    roots: Object.freeze([
      "public/textures/candidate-v591/moon/lite",
      "public/textures/candidate-v591/venus/lite",
      "public/textures/candidate-v591/bennu/lite",
      "public/textures/candidate-v591/mars/lite",
    ]),
  }),
  Object.freeze({
    id: "v593-deep-field-observations",
    deliveryTier: "standalone-full",
    residency: "focus-demand",
    focusFamilies: Object.freeze(["galaxies", "clusters"]),
    roots: Object.freeze([
      "public/textures/candidate-v592/deep-space-v592/full",
    ]),
  }),
]);

function within(parent, candidate) {
  const result = relative(parent, candidate);
  return result === "" || (!result.startsWith("..") && !isAbsolute(result));
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
}

function canonicalSha(value) {
  return createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
}

async function fileSha(path) {
  return createHash("sha256").update(await readFile(path)).digest("hex");
}

async function walkFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walkFiles(path));
    else if (entry.isFile()) files.push(path);
  }
  return files;
}

async function materialize(source, destination) {
  await mkdir(dirname(destination), { recursive: true });
  try {
    await link(source, destination);
  } catch (error) {
    if (error?.code !== "EXDEV" && error?.code !== "EPERM" && error?.code !== "EACCES") throw error;
    await copyFile(source, destination);
  }
}

if (!within(root, outputRoot) || outputRoot === root) throw new Error("v593-content-pack-output-boundary");
try {
  const info = await lstat(outputRoot);
  if (info.isSymbolicLink()) throw new Error("v593-content-pack-output-link-refused");
} catch (error) {
  if (error?.code !== "ENOENT") throw error;
}
await rm(outputRoot, { recursive: true, force: true });
await mkdir(outputRoot, { recursive: true });

const manifests = [];
for (const spec of packSpecs) {
  const files = [];
  for (const relativeRoot of spec.roots) {
    const sourceRoot = resolve(root, relativeRoot);
    if (!within(root, sourceRoot)) throw new Error(`v593-content-pack-source-boundary:${relativeRoot}`);
    for (const source of await walkFiles(sourceRoot)) {
      const sourceRelative = relative(root, source).replaceAll("\\", "/");
      const publicRelative = sourceRelative.startsWith("public/") ? sourceRelative.slice("public/".length) : sourceRelative;
      const info = await stat(source);
      const entry = Object.freeze({
        path: publicRelative,
        sourcePath: sourceRelative,
        bytes: info.size,
        sha256: await fileSha(source),
        baselineIdentity: sourceRelative.includes("candidate-v591") ? "v591-readonly" : "v592-readonly",
      });
      await materialize(source, resolve(outputRoot, "files", spec.id, publicRelative));
      files.push(entry);
    }
  }
  files.sort((left, right) => left.path.localeCompare(right.path));
  const installedBytes = files.reduce((sum, file) => sum + file.bytes, 0);
  const manifest = {
    version: "v593-optional-content-pack-manifest-v1",
    generatedAt,
    id: spec.id,
    status: "materialized-readonly-baseline-assets",
    deliveryTier: spec.deliveryTier,
    residency: spec.residency,
    focusFamilies: spec.focusFamilies,
    mountRoot: "public",
    sourceMutationAllowed: false,
    installedBytes,
    fileCount: files.length,
    files,
  };
  manifest.manifestSha256 = canonicalSha(manifest);
  const manifestPath = resolve(outputRoot, `${spec.id}.manifest.json`);
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  manifests.push(Object.freeze({
    id: manifest.id,
    path: relative(root, manifestPath).replaceAll("\\", "/"),
    deliveryTier: manifest.deliveryTier,
    installedBytes,
    fileCount: files.length,
    manifestSha256: manifest.manifestSha256,
  }));
}

const liteExternalizedBytes = manifests.find((manifest) => manifest.id === "v593-lite-surface-detail")?.installedBytes ?? 0;
const fullExternalizedBytes = manifests.find((manifest) => manifest.id === "v593-deep-field-observations")?.installedBytes ?? 0;
const liteProjectedBytes = baselineBudget.lite - liteExternalizedBytes;
const fullProjectedBytes = baselineBudget.full - fullExternalizedBytes;
const budget = Object.freeze({
  liteShell: Object.freeze({
    inheritedBytes: baselineBudget.lite,
    externalizedBytes: liteExternalizedBytes,
    projectedBytes: liteProjectedBytes,
    maximumBytes: baselineBudget.liteTarget,
    headroomBytes: baselineBudget.liteTarget - liteProjectedBytes,
    status: liteProjectedBytes <= baselineBudget.liteTarget ? "passed" : "blocked",
  }),
  observatoryDefault: Object.freeze({
    inheritedBytes: baselineBudget.full,
    externalizedBytes: fullExternalizedBytes,
    projectedBytes: fullProjectedBytes,
    maximumBytes: baselineBudget.fullTarget,
    headroomBytes: baselineBudget.fullTarget - fullProjectedBytes,
    status: fullProjectedBytes <= baselineBudget.fullTarget ? "passed" : "blocked",
  }),
});
if (budget.liteShell.status !== "passed" || budget.observatoryDefault.status !== "passed") {
  throw new Error(`v593-content-pack-budget:${JSON.stringify(budget)}`);
}

const index = {
  version: "v593-content-pack-index-v1",
  generatedAt,
  status: "passed-p0-content-pack-projection-and-materialization",
  baseline: Object.freeze({
    candidate: "v592-readonly",
    manifestSha256: "8e0b9c8db57ed8bcdfce10d7246083cc640a0639c1418e034647b2e5b1b4a6ba",
  }),
  delivery: Object.freeze({
    liteShell: "initial",
    observatoryDefault: "initial",
    optionalPacks: "focus-demand",
    maximumResidentHighResolutionBodyPacks: 1,
  }),
  budget,
  packs: manifests,
  sourceMutationAllowed: false,
};
index.indexSha256 = canonicalSha(index);
await writeFile(resolve(outputRoot, "index.json"), `${JSON.stringify(index, null, 2)}\n`, "utf8");
console.log(JSON.stringify({
  status: index.status,
  indexSha256: index.indexSha256,
  packs: manifests.map(({ id, installedBytes, fileCount }) => ({ id, installedBytes, fileCount })),
  budget,
}, null, 2));
