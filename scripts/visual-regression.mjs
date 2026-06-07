import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { PNG } from "pngjs";
import { ssim } from "ssim.js";

const baselineDir = resolve("scripts/visual-baselines");
const runDir = resolve(".visual-runs/regression");
const summaryPath = resolve(runDir, "visual-summary.json");
const minSsim = Number(process.env.SOLAR_VISUAL_MIN_SSIM ?? 0.985);
const maxChangedRatio = Number(process.env.SOLAR_VISUAL_MAX_CHANGED_RATIO ?? 0.02);
const pixelThreshold = Number(process.env.SOLAR_VISUAL_PIXEL_THRESHOLD ?? 18);

function runAcceptance() {
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
}

function comparePng(baselinePath, currentPath, diffPath) {
  const baseline = PNG.sync.read(readFileSync(baselinePath));
  const current = PNG.sync.read(readFileSync(currentPath));
  if (baseline.width !== current.width || baseline.height !== current.height) {
    return { score: 0, changedRatio: 1, reason: "dimension mismatch" };
  }
  const diff = new PNG({ width: current.width, height: current.height });
  let changed = 0;
  const pixelCount = current.width * current.height;
  for (let index = 0; index < baseline.data.length; index += 4) {
    const delta = Math.max(
      Math.abs(baseline.data[index] - current.data[index]),
      Math.abs(baseline.data[index + 1] - current.data[index + 1]),
      Math.abs(baseline.data[index + 2] - current.data[index + 2]),
    );
    if (delta > pixelThreshold) changed += 1;
    diff.data[index] = delta > pixelThreshold ? 255 : current.data[index] * 0.18;
    diff.data[index + 1] = delta > pixelThreshold ? 32 : current.data[index + 1] * 0.18;
    diff.data[index + 2] = delta > pixelThreshold ? 96 : current.data[index + 2] * 0.18;
    diff.data[index + 3] = 255;
  }
  writeFileSync(diffPath, PNG.sync.write(diff));
  const score = ssim(
    { data: baseline.data, width: baseline.width, height: baseline.height },
    { data: current.data, width: current.width, height: current.height },
  ).mssim;
  return { score, changedRatio: changed / pixelCount };
}

runAcceptance();
if (!existsSync(summaryPath)) throw new Error(`Missing visual summary: ${summaryPath}`);
const acceptance = JSON.parse(readFileSync(summaryPath, "utf8"));
mkdirSync(runDir, { recursive: true });
const results = [];
for (const scenario of acceptance.scenarios) {
  const baselinePath = resolve(baselineDir, scenario.screenshotFile);
  const currentPath = resolve(runDir, scenario.screenshotFile);
  const diffPath = resolve(runDir, `${scenario.id}-diff.png`);
  if (!existsSync(baselinePath)) {
    results.push({ id: scenario.id, ok: false, reason: "baseline missing" });
    console.error(`FAIL ${scenario.id}: baseline missing`);
    continue;
  }
  const metrics = comparePng(baselinePath, currentPath, diffPath);
  const ok = metrics.score >= minSsim && metrics.changedRatio <= maxChangedRatio;
  results.push({ id: scenario.id, ok, ...metrics });
  console.log(
    `${ok ? "PASS" : "FAIL"} ${scenario.id}: SSIM ${metrics.score.toFixed(5)}, changed ${(metrics.changedRatio * 100).toFixed(2)}%`,
  );
}
writeFileSync(
  resolve(runDir, "visual-regression-summary.json"),
  JSON.stringify({ minSsim, maxChangedRatio, pixelThreshold, results }, null, 2),
);
if (results.some((result) => !result.ok)) process.exit(1);
