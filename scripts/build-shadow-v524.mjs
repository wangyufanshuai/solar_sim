import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

for (const [command, args] of [
  ["python", ["scripts/run-kerr-analyzer-identifiability-v524.py"]],
  [process.execPath, [resolve("node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-analyzer-identifiability-runtime-v524.ts"]],
]) {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    encoding: "utf8",
    stdio: "inherit",
  });
  if (result.status !== 0) throw new Error(`v524-build-exit-${result.status}:${command}`);
}
await import("./build-shadow-candidate-v524.mjs");
