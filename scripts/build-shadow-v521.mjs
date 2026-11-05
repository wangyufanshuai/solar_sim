import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

for (const [command, args] of [
  ["python", ["scripts/run-kerr-fixed-band-stokes-oracle-v521.py"]],
  [
    process.execPath,
    [
      resolve("node_modules/tsx/dist/cli.mjs"),
      "scripts/build-kerr-fixed-band-stokes-oracle-runtime-v521.ts",
    ],
  ],
]) {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    encoding: "utf8",
    stdio: "inherit",
  });
  if (result.status !== 0) throw new Error(`v521-build-exit-${result.status}:${command}`);
}

await import("./build-shadow-candidate-v521.mjs");
