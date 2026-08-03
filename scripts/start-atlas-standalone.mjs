import { lstat, mkdir, readFile, symlink } from "node:fs/promises";
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

const sourcePublicRoot = join(root, "public");
const standalonePublicRoot = join(standaloneRoot, "public");
await ensureDirectoryJunction(sourcePublicRoot, standalonePublicRoot);
// Next's standalone trace can materialize a partial public directory (for
// example, a server-referenced OpenNGC payload). In that case the root mount
// above intentionally leaves the generated directory intact, so mount the
// self-contained Lite asset tree explicitly before the server starts.
await ensureDirectoryJunction(
  join(sourcePublicRoot, "atlas-lite"),
  join(standalonePublicRoot, "atlas-lite"),
);
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
