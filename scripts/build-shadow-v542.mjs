import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const commands = [
  ["python", ["scripts/build-kerr-replay-compatibility-v542.py"], "compatibility-authority"],
  ["python", ["-m", "pytest", "scripts/test-kerr-replay-compatibility-v542.py", "-q", "-o", "asyncio_default_fixture_loop_scope=function"], "compatibility-tests"],
  [process.execPath, [resolve("node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-replay-compatibility-runtime-v542.ts"], "runtime"],
];
for (const [command, args, label] of commands) { const result = spawnSync(command, args, { cwd: process.cwd(), encoding: "utf8", stdio: "inherit" }); if (result.status !== 0) throw new Error(`v542-${label}-exit-${result.status}`); }
await import("./build-shadow-candidate-v542.mjs");
