import { spawnSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const temp = resolve(root, "dist/temp/v450");
mkdirSync(temp, { recursive: true });

function run(label, command, args) {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: "inherit",
    shell: false,
    env: { ...process.env, TEMP: temp, TMP: temp },
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${label} failed with ${result.status}`);
}

run("v450 TypeScript sparse fixture", process.execPath, [
  resolve(root, "node_modules/tsx/dist/cli.mjs"),
  "scripts/build-kerr-detector-image-formation-fixture-v450.ts",
]);
run("v450 Python Decimal oracle", "python", [
  "scripts/run-kerr-detector-image-formation-oracle-v450.py",
]);
run("v450 image formation qualification", process.execPath, [
  resolve(root, "node_modules/tsx/dist/cli.mjs"),
  "scripts/build-kerr-detector-image-formation-v450.ts",
]);
