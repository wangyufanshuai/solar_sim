import { lstat, mkdir, symlink } from "node:fs/promises";
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

const root = process.cwd();
const distDir = argumentValue(
  "--dist-dir",
  process.env.ATLAS_NEXT_DIST_DIR?.trim() || ".next-atlas-v592-standalone-current",
);

// v590 owns the SHA-locked CSP-compatible Basis transcoder that the additive
// v591/v592 KTX2 lanes consume read-only. The generic standalone trace only
// guarantees /basis, so mount the historical identity explicitly without
// copying or mutating it.
await ensureDirectoryJunction(
  join(root, "public", "basis-v590"),
  join(root, distDir, "standalone", "public", "basis-v590"),
);

await import("./start-atlas-standalone.mjs");
