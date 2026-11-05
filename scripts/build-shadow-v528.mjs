import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

for (const [command, args] of [
  ["python", ["scripts/run-kerr-calibration-cost-sensitivity-v528.py"]],
  [
    process.execPath,
    [
      resolve("node_modules/tsx/dist/cli.mjs"),
      "scripts/build-kerr-calibration-cost-sensitivity-runtime-v528.ts",
    ],
  ],
]) {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    encoding: "utf8",
    stdio: "inherit",
  });
  if (result.status !== 0) throw new Error(`v528-build-exit-${result.status}:${command}`);
}
await import("./build-shadow-candidate-v528.mjs");
