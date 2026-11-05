import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

for (const [command, args] of [
  ["python", ["scripts/run-kerr-allocation-regret-v530.py"]],
  [
    process.execPath,
    [
      resolve("node_modules/tsx/dist/cli.mjs"),
      "scripts/build-kerr-allocation-regret-runtime-v530.ts",
    ],
  ],
]) {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    encoding: "utf8",
    stdio: "inherit",
  });
  if (result.status !== 0) throw new Error(`v530-build-exit-${result.status}:${command}`);
}
await import("./build-shadow-candidate-v530.mjs");
