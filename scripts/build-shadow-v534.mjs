import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

for (const [command, args, label] of [
  [process.execPath, ["scripts/build-kerr-bandpass-redshift-commutator-v534.mjs"], "authority"],
  [process.execPath, [resolve("node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-bandpass-redshift-runtime-v534.ts"], "runtime"],
]) {
  const result = spawnSync(command, args, { cwd: process.cwd(), encoding: "utf8", stdio: "inherit" });
  if (result.status !== 0) throw new Error(`v534-${label}-exit-${result.status}`);
}
await import("./build-shadow-candidate-v534.mjs");
