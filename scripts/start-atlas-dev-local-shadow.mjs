import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const nextBin = process.platform === "win32"
  ? path.join(root, "node_modules", ".bin", "next.cmd")
  : path.join(root, "node_modules", ".bin", "next");
const args = ["dev", "--webpack", "-H", "127.0.0.1", "-p", "3018", ...process.argv.slice(2)];
const child = spawn(nextBin, args, {
  cwd: root,
  shell: process.platform === "win32",
  env: {
    ...process.env,
    NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE: process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE?.trim() || "local-shadow",
    ATLAS_LOCAL_ASSET_PACK_ROOT: process.env.ATLAS_LOCAL_ASSET_PACK_ROOT?.trim() || path.join(root, "dist", "content-packs"),
  },
  stdio: "inherit",
});

const forward = (signal) => child.kill(signal);
process.on("SIGINT", () => forward("SIGINT"));
process.on("SIGTERM", () => forward("SIGTERM"));
child.on("exit", (code, signal) => process.exit(code ?? (signal ? 1 : 0)));
