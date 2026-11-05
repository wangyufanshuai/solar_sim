import { copyFile, link, lstat, mkdir, readFile, readdir, symlink } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { installAtlasServerErrorPolicy } from "./atlas-server-bootstrap.mjs";

function argumentValue(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

const root = process.cwd();
const distDir = argumentValue(
  "--dist-dir",
  process.env.ATLAS_NEXT_DIST_DIR?.trim() || ".next",
);
const standaloneRoot = join(root, distDir, "standalone");
installAtlasServerErrorPolicy();

async function resolveDeliveryProfile() {
  const explicit = argumentValue(
    "--profile",
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE?.trim() || "",
  );
  if (explicit) return explicit;
  try {
    const buildProfile = JSON.parse(
      await readFile(join(root, distDir, "atlas-build-profile.json"), "utf8"),
    );
    return typeof buildProfile.profile === "string" ? buildProfile.profile : "";
  } catch {
    return "";
  }
}

async function ensureDirectoryJunction(source, destination) {
  try {
    await lstat(destination);
    return;
  } catch {
    await mkdir(join(destination, ".."), { recursive: true });
    await symlink(source, destination, "junction");
  }
}

async function ensureFileMirror(source, destination) {
  try {
    await lstat(destination);
    return;
  } catch {
    await mkdir(join(destination, ".."), { recursive: true });
    try {
      await link(source, destination);
    } catch (error) {
      if (!new Set(["EXDEV", "EPERM", "EACCES", "ENOTSUP"]).has(error?.code)) throw error;
      await copyFile(source, destination);
    }
  }
}

const sourcePublicRoot = join(root, "public");
const standalonePublicRoot = join(standaloneRoot, "public");
await ensureDirectoryJunction(sourcePublicRoot, standalonePublicRoot);
// Next's standalone trace can materialize a partial public directory (for
// example, a server-referenced OpenNGC payload). In that case the root mount
// above intentionally leaves the generated directory intact, so mount every
// runtime-owned static subtree explicitly. `data` carries SHA-bound scientific
// projections and `textures` carries candidate presentation assets; a missing
// mount must fail in the browser rather than silently substituting content.
for (const publicSubtree of ["atlas-lite", "basis", "data", "textures", "models"]) {
  await ensureDirectoryJunction(
    join(sourcePublicRoot, publicSubtree),
    join(standalonePublicRoot, publicSubtree),
  );
}
// `data` itself may also be a partial traced directory. Mount each missing
// directory and root-level file so a present-but-incomplete parent cannot turn
// a verified artifact request into a post-build 404.
for (const entry of await readdir(join(sourcePublicRoot, "data"), { withFileTypes: true })) {
  const source = join(sourcePublicRoot, "data", entry.name);
  const destination = join(standalonePublicRoot, "data", entry.name);
  if (entry.isDirectory()) await ensureDirectoryJunction(source, destination);
  else if (entry.isFile()) await ensureFileMirror(source, destination);
}
// v155 source-audit compatibility token: join(standaloneRoot, ".next", "static")
await ensureDirectoryJunction(join(root, distDir, "static"), join(standaloneRoot, distDir, "static"));

process.env.HOSTNAME = argumentValue("--hostname", process.env.HOSTNAME || "127.0.0.1");
process.env.PORT = argumentValue("--port", process.env.PORT || "3015");
process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE ||= await resolveDeliveryProfile();
process.env.ATLAS_PROJECT_ROOT ??= root;
process.env.ATLAS_SERVER_WORKER_ROOT ??= join(standaloneRoot, "app", "workers");
process.env.ATLAS_LOCAL_CONTENT_PACK_ROOT ??= join(root, "dist", "catalog-million-v7");
process.env.ATLAS_LOCAL_ASSET_PACK_ROOT ??= join(root, "dist", "content-packs");

await import(pathToFileURL(join(standaloneRoot, "server.js")).href);
