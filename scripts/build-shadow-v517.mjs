import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

for (const script of [
  "scripts/verify-kerr-uncertainty-replay-witness-v517.ts",
  "scripts/build-kerr-uncertainty-independent-verification-runtime-v517.ts",
]) {
  const result = spawnSync(
    process.execPath,
    [resolve("node_modules/tsx/dist/cli.mjs"), script],
    { cwd: process.cwd(), encoding: "utf8", stdio: "inherit" },
  );
  if (result.status !== 0) throw new Error(`v517-build-exit-${result.status}:${script}`);
}

await import("./build-shadow-candidate-v517.mjs");
