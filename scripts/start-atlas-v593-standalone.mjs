import { copyFile, link, lstat, mkdir, readdir, stat, symlink } from "node:fs/promises";
import { join } from "node:path";

function argumentValue(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}
async function ensureDirectoryJunction(source, destination) {
  try {
    await lstat(destination);
  } catch {
    await mkdir(join(destination, ".."), { recursive: true });
    await symlink(source, destination, "junction");
  }
}

async function ensureRuntimeFile(source, destination) {
  try {
    const [sourceInfo, destinationInfo] = await Promise.all([stat(source), stat(destination)]);
    if (!destinationInfo.isFile() || sourceInfo.size !== destinationInfo.size) {
      throw new Error(`v593-runtime-file-mismatch:${destination}`);
    }
    return;
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  await mkdir(join(destination, ".."), { recursive: true });
  try {
    await link(source, destination);
  } catch (error) {
    if (error?.code !== "EXDEV" && error?.code !== "EPERM" && error?.code !== "EACCES") throw error;
    await copyFile(source, destination);
  }
}

async function ensureRuntimeTree(source, destination) {
  const sourceInfo = await lstat(source);
  if (!sourceInfo.isDirectory()) throw new Error(`v593-runtime-tree-source:${source}`);
  try {
    const destinationInfo = await lstat(destination);
    if (destinationInfo.isSymbolicLink()) return;
    if (!destinationInfo.isDirectory()) throw new Error(`v593-runtime-tree-destination:${destination}`);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
    await ensureDirectoryJunction(source, destination);
    return;
  }
  for (const entry of await readdir(source, { withFileTypes: true })) {
    const sourceEntry = join(source, entry.name);
    const destinationEntry = join(destination, entry.name);
    if (entry.isDirectory()) await ensureRuntimeTree(sourceEntry, destinationEntry);
    else if (entry.isFile()) await ensureRuntimeFile(sourceEntry, destinationEntry);
  }
}

const root = process.cwd();
const distDir = argumentValue(
  "--dist-dir",
  process.env.ATLAS_NEXT_DIST_DIR?.trim() || ".next-atlas-v593-standalone-current",
);
await ensureDirectoryJunction(
  join(root, "public", "basis-v590"),
  join(root, distDir, "standalone", "public", "basis-v590"),
);
// Next can leave a real but partial public/textures directory in a standalone
// trace. A simple existence check then hides every untraced presentation asset
// from the runtime. Recursively fill only missing entries, using directory
// junctions whenever a whole subtree is absent. Existing traced files are kept
// and size-checked; source bytes remain owned by the sealed public tree.
await ensureRuntimeTree(
  join(root, "public", "textures"),
  join(root, distDir, "standalone", "public", "textures"),
);
await ensureRuntimeTree(
  join(root, "public", "models"),
  join(root, distDir, "standalone", "public", "models"),
);
await import("./start-atlas-standalone.mjs");
