import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const result = spawnSync(
  process.execPath,
  [path.join(root, "scripts", "build-deep-universe-manifest.mjs")],
  { cwd: root, stdio: "inherit" },
);

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

console.log("Deep Universe v4 resource pack is built from committed compressed NASA/JWST/Hubble-derived assets.");
console.log("Runtime remains offline: no external API is called by the app.");
