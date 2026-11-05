import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const oracle = spawnSync("python", ["scripts/run-kerr-bandpass-shift-jacobian-oracle-v535.py"], {
  cwd: process.cwd(), encoding: "utf8", stdio: "inherit",
});
if (oracle.status !== 0) throw new Error(`v535-python-oracle-exit-${oracle.status}`);
const build = spawnSync(process.execPath, [resolve("node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-bandpass-shift-jacobian-v535.ts"], {
  cwd: process.cwd(), encoding: "utf8", stdio: "inherit",
});
if (build.status !== 0) throw new Error(`v535-authority-exit-${build.status}`);
