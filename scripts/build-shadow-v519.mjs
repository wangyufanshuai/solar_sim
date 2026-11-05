import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

for (const [command, args] of [
  ["python", ["scripts/run-kerr-fixed-band-radiometry-oracle-v519.py"]],
  [process.execPath, [resolve("node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-fixed-band-radiometry-runtime-v519.ts"]],
]) {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    encoding: "utf8",
    stdio: "inherit",
  });
  if (result.status !== 0) throw new Error(`v519-build-exit-${result.status}:${command}`);
}

await import("./build-shadow-candidate-v519.mjs");
