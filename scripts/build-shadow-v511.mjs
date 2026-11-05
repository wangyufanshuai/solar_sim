import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const root = process.cwd();
for (const [runner, script] of [
  [resolve("node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-instrument-authority-matrix-v511.ts"],
  [resolve("node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-instrument-authority-runtime-v511.ts"],
]) {
  const result = spawnSync(process.execPath, [runner, script], {
    cwd: root,
    encoding: "utf8",
    stdio: "inherit",
  });
  if (result.status !== 0) throw new Error(`v511-build-exit-${script}-${result.status}`);
}
await import("./build-shadow-candidate-v511.mjs");
