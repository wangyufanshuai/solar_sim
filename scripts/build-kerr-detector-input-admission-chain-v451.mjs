import { spawnSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const temp = resolve(root, "dist/temp/v451");
mkdirSync(temp, { recursive: true });
const result = spawnSync(
  process.execPath,
  [
    resolve(root, "node_modules/tsx/dist/cli.mjs"),
    "scripts/build-kerr-detector-input-admission-v451.ts",
  ],
  {
    cwd: root,
    stdio: "inherit",
    shell: false,
    env: { ...process.env, TEMP: temp, TMP: temp },
  },
);
if (result.error) throw result.error;
if (result.status !== 0) throw new Error(`v451 admission failed with ${result.status}`);
