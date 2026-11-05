import { spawnSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const temporary = resolve(root, "dist/temp/v441");
mkdirSync(temporary, { recursive: true });
const env = { ...process.env, TEMP: temporary, TMP: temporary };

const run = (label, command, args) => {
  const result = spawnSync(command, args, { cwd: root, stdio: "inherit", shell: false, env });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${label} failed with ${result.status}`);
};

run("v441 Python WCS projection oracle", "python", [
  "scripts/run-kerr-wcs-projection-availability-v441.py",
]);
run("v441 TypeScript artifact builder", process.execPath, [
  resolve(root, "node_modules/tsx/dist/cli.mjs"),
  "scripts/build-kerr-wcs-projection-availability-v441.ts",
]);
