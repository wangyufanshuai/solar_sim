import { spawnSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const node = process.execPath;
const temporary = resolve(root, "dist/temp/v430");
mkdirSync(temporary, { recursive: true });
const run = (label, command, args) => {
  const result = spawnSync(command, args, { cwd: root, stdio: "inherit", shell: false, env: { ...process.env, TEMP: temporary, TMP: temporary } });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${label} failed with ${result.status}`);
};
run("v430 count likelihood chain", node, ["scripts/build-kerr-high-energy-count-likelihood-chain-v430.mjs"]);
run("v430 evidence and capability pointer", node, ["scripts/build-shadow-candidate-v430.mjs"]);
