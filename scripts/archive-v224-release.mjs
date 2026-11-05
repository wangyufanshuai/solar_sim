import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { cp, lstat, mkdir, readdir, readFile, realpath, writeFile } from "node:fs/promises";
import path from "node:path";

const root = await realpath(process.cwd());
const archiveRoot = path.resolve(process.env.ATLAS_RELEASE_ARCHIVE_ROOT || "E:/OrbitAtlasArchives/v224");
const manifestPath = path.join(archiveRoot, "orbit-atlas-v224-archive-manifest.json");

const inputs = [
  ["next-standalone", ".next-v224"],
  ["next-lite", ".next-v224-lite"],
  ["release", "dist/release"],
  ["science", "dist/science"],
  ["content-packs", "dist/content-packs"],
  ["installers", "src-tauri/target/release/bundle"],
];

function assertOutsideWorkspace(candidate) {
  const relative = path.relative(root, candidate);
  if (!relative || (!relative.startsWith("..") && !path.isAbsolute(relative))) {
    throw new Error(`Archive root must be outside the workspace: ${candidate}`);
  }
}

async function exists(candidate) {
  try {
    await lstat(candidate);
    return true;
  } catch {
    return false;
  }
}

function sha256(file) {
  return new Promise((resolveHash, reject) => {
    const hash = createHash("sha256");
    const stream = createReadStream(file);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.once("error", reject);
    stream.once("end", () => resolveHash(hash.digest("hex")));
  });
}

async function inventoryTree(directory, prefix, files, links) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const source = path.join(directory, entry.name);
    const relative = path.posix.join(prefix, entry.name);
    const info = await lstat(source);
    if (info.isSymbolicLink()) {
      links.push({ path: relative, kind: "symbolic-link", archived: false });
      continue;
    }
    if (info.isDirectory()) {
      const resolved = await realpath(source);
      const boundary = path.relative(root, resolved);
      if (boundary.startsWith("..") || path.isAbsolute(boundary)) {
        links.push({ path: relative, kind: "junction-or-reparse-point", target: resolved, archived: false });
        continue;
      }
      await inventoryTree(source, relative, files, links);
      continue;
    }
    if (info.isFile()) {
      files.push({ source, path: relative, bytes: info.size });
    }
  }
}

assertOutsideWorkspace(archiveRoot);
await mkdir(archiveRoot, { recursive: true });

if (await exists(manifestPath)) {
  const previous = JSON.parse(await readFile(manifestPath, "utf8"));
  if (previous?.status === "verified") {
    throw new Error(`Verified archive already exists: ${manifestPath}`);
  }
}

const sourceFiles = [];
const links = [];
for (const [label, relativeSource] of inputs) {
  const source = path.resolve(root, relativeSource);
  if (!await exists(source)) throw new Error(`Missing v224 archive input: ${relativeSource}`);
  await inventoryTree(source, label, sourceFiles, links);
}

const archivedFiles = [];
for (const sourceFile of sourceFiles) {
  const destination = path.join(archiveRoot, ...sourceFile.path.split("/"));
  await mkdir(path.dirname(destination), { recursive: true });
  await cp(sourceFile.source, destination, { force: true, preserveTimestamps: true });
  const [sourceSha256, archiveSha256] = await Promise.all([
    sha256(sourceFile.source),
    sha256(destination),
  ]);
  if (sourceSha256 !== archiveSha256) {
    throw new Error(`Archive hash mismatch: ${sourceFile.path}`);
  }
  archivedFiles.push({ path: sourceFile.path, bytes: sourceFile.bytes, sha256: sourceSha256 });
}

archivedFiles.sort((left, right) => left.path.localeCompare(right.path));
links.sort((left, right) => left.path.localeCompare(right.path));
const totalBytes = archivedFiles.reduce((sum, file) => sum + file.bytes, 0);
const stable = {
  version: "orbit-atlas-v224-byte-verified-archive-v1",
  status: "verified",
  workspace: root,
  archiveRoot,
  fileCount: archivedFiles.length,
  totalBytes,
  files: archivedFiles,
  excludedLinks: links,
  reconstructionPolicy: "standalone public/static junctions are intentionally excluded and must be recreated from archived public/static payloads",
};
const canonicalSha256 = createHash("sha256").update(JSON.stringify(stable)).digest("hex");
await writeFile(manifestPath, `${JSON.stringify({ generatedAt: new Date().toISOString(), ...stable, canonicalSha256 }, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ manifestPath, fileCount: archivedFiles.length, totalBytes, canonicalSha256 }, null, 2));
