import { lstat, mkdir, symlink } from "node:fs/promises";
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

async function ensureDirectoryJunction(source, destination) {
  try {
    await lstat(destination);
    return;
  } catch {
    await mkdir(join(destination, ".."), { recursive: true });
    await symlink(source, destination, "junction");
  }
}

await ensureDirectoryJunction(join(root, "public"), join(standaloneRoot, "public"));
// v155 source-audit compatibility token: join(standaloneRoot, ".next", "static")
await ensureDirectoryJunction(join(root, distDir, "static"), join(standaloneRoot, distDir, "static"));

process.env.HOSTNAME = argumentValue("--hostname", process.env.HOSTNAME || "127.0.0.1");
process.env.PORT = argumentValue("--port", process.env.PORT || "3015");
process.env.ATLAS_LOCAL_CONTENT_PACK_ROOT ??= join(root, "dist", "catalog-million-v7");
process.env.ATLAS_LOCAL_ASSET_PACK_ROOT ??= join(root, "dist", "content-packs");

await import(pathToFileURL(join(standaloneRoot, "server.js")).href);
