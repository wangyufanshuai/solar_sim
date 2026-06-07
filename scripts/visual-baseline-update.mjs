import { copyFileSync, cpSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const runDir = resolve(".visual-runs/baseline-update");
const baselineDir = resolve("scripts/visual-baselines");
const command = process.platform === "win32" ? process.env.ComSpec ?? "cmd.exe" : "npm";
const args = process.platform === "win32"
  ? ["/d", "/s", "/c", "npm run visual:acceptance"]
  : ["run", "visual:acceptance"];
const result = spawnSync(command, args, {
  cwd: process.cwd(),
  stdio: "inherit",
  env: { ...process.env, SOLAR_VISUAL_TEST: "1", SOLAR_VISUAL_OUT_DIR: runDir },
});
if (result.status !== 0) process.exit(result.status ?? 1);
const summaryPath = resolve(runDir, "visual-summary.json");
if (!existsSync(summaryPath)) throw new Error(`Missing visual summary: ${summaryPath}`);
const summary = JSON.parse(readFileSync(summaryPath, "utf8"));
mkdirSync(baselineDir, { recursive: true });
for (const scenario of summary.scenarios) {
  copyFileSync(resolve(runDir, scenario.screenshotFile), resolve(baselineDir, scenario.screenshotFile));
}
cpSync(summaryPath, resolve(baselineDir, "visual-summary.json"));
console.log(`Updated ${summary.scenarios.length} visual baselines in ${baselineDir}`);
