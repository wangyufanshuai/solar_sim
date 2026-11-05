import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

for (const script of [
  "scripts/build-kerr-uncertainty-replay-v515.ts",
  "scripts/build-kerr-uncertainty-replay-runtime-v515.ts",
]) {
  const result = spawnSync(
    process.execPath,
    [resolve("node_modules/tsx/dist/cli.mjs"), script],
    { cwd: process.cwd(), encoding: "utf8", stdio: "inherit" },
  );
  if (result.status !== 0) {
    throw new Error(`v515-build-exit-${result.status}:${script}`);
  }
}

await import("./build-shadow-candidate-v515.mjs");
