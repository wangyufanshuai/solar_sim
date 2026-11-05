import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

for (const [command, args, label] of [
  ["python", ["scripts/export-kerr-response-aware-sparse-fits-v537.py"], "fits-authority"],
  ["python", ["-m", "pytest", "scripts/test-kerr-response-aware-sparse-fits-v537.py", "-q", "-o", "asyncio_default_fixture_loop_scope=function"], "fits-tests"],
  [process.execPath, [resolve("node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-response-aware-sparse-fits-runtime-v537.ts"], "runtime"],
]) {
  const result = spawnSync(command, args, { cwd: process.cwd(), encoding: "utf8", stdio: "inherit" });
  if (result.status !== 0) throw new Error(`v537-${label}-exit-${result.status}`);
}
await import("./build-shadow-candidate-v537.mjs");
