#!/usr/bin/env node

import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { readFileSync, statfsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { freemem } from "node:os";
import { resolve } from "node:path";

const ROOT = resolve(".");
const OUT = resolve(ROOT, "dist/science/v290-low-memory-validation.json");
const PRODUCT = resolve(ROOT, "dist/release/orbit-atlas-current-product-evidence-v263.json");
const V284 = resolve(ROOT, "dist/science/kerr-campaign-v284/campaign-state.json");
const V287 = resolve(ROOT, "dist/science/relativity-reference-v282r2/fetch-checkpoint.json");
const V288 = resolve(ROOT, "dist/science/kerr-reference-v288/short-gate-evidence.json");
const CAMPAIGN = resolve(ROOT, "dist/science/kerr-campaign-v288r1/campaign-state.json");
const ASSETS = resolve(ROOT, "dist/science-cinematic-v4-v289-assets/manifest.json");
const TRUTH = resolve(ROOT, "dist/science/scientific-evidence-truth-audit-v286.json");
const python = process.platform === "win32" ? resolve(ROOT, ".venv-science/Scripts/python.exe") : resolve(ROOT, ".venv-science/bin/python");
const sha = (value) => createHash("sha256").update(value).digest("hex");
const canonical = (value) => Array.isArray(value) ? value.map(canonical) : value && typeof value === "object" ? Object.fromEntries(Object.entries(value).filter(([key]) => !["generatedAt", "host", "pid", "absolutePath"].includes(key)).sort(([a], [b]) => a.localeCompare(b)).map(([key, entry]) => [key, canonical(entry)])) : value;
const valueSha = (value) => sha(Buffer.from(JSON.stringify(canonical(value)), "utf8"));

function execute(id, command, args, expectedExitCodes = [0]) {
  const started = Date.now();
  const result = spawnSync(command, args, { cwd: ROOT, encoding: "utf8", shell: false, maxBuffer: 12 * 1024 * 1024 });
  const exitCode = result.status ?? 1;
  return {
    id, command: [command, ...args].join(" "), exitCode, expectedExitCodes, passed: expectedExitCodes.includes(exitCode),
    durationMs: Date.now() - started, stdoutSha256: sha(Buffer.from(result.stdout ?? "", "utf8")),
    stderrSha256: sha(Buffer.from(result.stderr ?? "", "utf8")), outputTail: `${result.stdout ?? ""}${result.stderr ?? ""}`.slice(-2400),
  };
}

const oldV284Before = readFileSync(V284);
const commands = [
  execute("focused", process.execPath, [resolve(ROOT, "scripts/atlas.mjs"), "test", "focused"]),
  execute("typescript", process.execPath, [resolve(ROOT, "node_modules/typescript/bin/tsc"), "--noEmit"]),
  execute("eslint", process.execPath, [resolve(ROOT, "node_modules/eslint/bin/eslint.js"), "app", "proxy.ts", "next.config.mjs", "scripts", "tests", "--quiet"]),
  execute("v287-python-tests", python, ["-m", "unittest", "scripts/test-relativity-reference-v287.py"]),
  execute("v288-python-tests", python, ["-m", "unittest", "scripts/test-kerr-authority-v288.py"]),
  execute("v287-inspect-no-network", python, ["scripts/fetch-relativity-reference-v287.py", "--inspect"]),
  execute("v288-status-blocked-expected", python, ["scripts/run-kerr-dense-campaign-v288r1.py", "--status"], [2]),
];
const oldV284After = readFileSync(V284);
const [product, v287, v288, campaign, assets, truth] = [PRODUCT, V287, V288, CAMPAIGN, ASSETS, TRUTH].map((path) => JSON.parse(readFileSync(path, "utf8")));
const disk = statfsSync("E:\\");
const freeDiskBytes = Number(disk.bavail) * Number(disk.bsize);
const oldV284Unchanged = sha(oldV284Before) === sha(oldV284After);
const invariantsPassed = product.version === "v263-current-product-evidence-pointer"
  && v287.status === "identity-cache-partial-1-of-9" && v287.requestAttempted === true
  && v288.gatePassed === false && v288.executionCount === 128 && v288.criticalBracketCount === 40
  && campaign.status === "blocked-short-gate" && campaign.completedShardCount === 0
  && truth.v283.status === "structural-gate-passed-science-qualification-withdrawn"
  && truth.v284.status === "quarantined-nonauthoritative-1-of-49"
  && assets.id === "science-cinematic-v4-v289-assets" && assets.entries.length === 2
  && oldV284Unchanged;
const unsigned = {
  version: "v290-low-memory-validation-evidence-v1", generatedAt: new Date().toISOString(),
  status: commands.every((entry) => entry.passed) && invariantsPassed ? "passed-low-memory-validation-science-blocked-v288" : "failed-low-memory-validation",
  commands,
  resources: { freePhysicalMemoryBytes: freemem(), freePhysicalMemoryGiB: Number((freemem() / 2 ** 30).toFixed(2)), eDriveFreeBytes: freeDiskBytes, eDriveFreeGiB: Number((freeDiskBytes / 2 ** 30).toFixed(2)), heavyQualificationAuthorized: false },
  capabilities: {
    v286: truth.status, v287: v287.status,
    v288ShortGate: { status: v288.status, gatePassed: false, executionCount: v288.executionCount, criticalBracketCount: v288.criticalBracketCount, failureReasons: v288.failureReasons },
    v288Campaign: { status: campaign.status, completedShardCount: campaign.completedShardCount, shardAttempted: false },
    v289: { assetCount: assets.entries.length, canonicalSha256: assets.canonicalSha256, networkDownloadApplied: false },
  },
  preservation: { oldV284Unchanged, formalProductPointerAdvanced: false, localShadowDefaultApplied: false },
  science: { defaultKernel: "legacy-eih-1pn", codeSha256: "0debb41b96f001f92f498ef6a36ceff77ede7f0dd2bdbe3c6e9db3dfbf6090a8", screenSha256: "08f42a50bc787df62dc018ee56b5f7b58065dcafe2e2a3703e3e67f3e6d94037", workerPhysicsMutation: "not-applied", eihOnePnMutation: "not-applied", legacyKerrMutation: "not-applied" },
  skippedHeavyGates: ["resource-stability-18-samples", "full-regression", "rust", "standalone-build", "lite-build", "local-shadow-build", "browser-matrix", "visual-matrix", "ui-soak", "kerr-compute-soak", "rtx-webgpu"],
};
const evidence = { ...unsigned, evidenceSha256: valueSha(unsigned) };
await mkdir(resolve(ROOT, "dist/science"), { recursive: true });
await writeFile(OUT, `${JSON.stringify(evidence, null, 2)}\n`);
console.log(JSON.stringify({ status: evidence.status, commands: commands.map(({ id, exitCode, passed }) => ({ id, exitCode, passed })), v287: v287.status, v288: v288.status, campaign: campaign.status, output: "dist/science/v290-low-memory-validation.json" }, null, 2));
if (evidence.status === "failed-low-memory-validation") process.exitCode = 1;
