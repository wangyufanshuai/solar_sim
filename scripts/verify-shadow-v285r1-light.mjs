#!/usr/bin/env node

import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, statfsSync } from "node:fs";
import { copyFile, mkdir, writeFile } from "node:fs/promises";
import { freemem } from "node:os";
import { resolve } from "node:path";

const ROOT = resolve(".");
const OUT = resolve(ROOT, "dist/science/v285r1-low-memory-validation.json");
const V284 = resolve(ROOT, "dist/science/kerr-campaign-v284/campaign-state.json");
const V282R1 = resolve(ROOT, "dist/science/relativity-reference-v282r1/fetch-checkpoint.json");
const PRODUCT = resolve(ROOT, "dist/release/orbit-atlas-current-product-evidence-v263.json");
const PRIOR_NEGATIVE = resolve(ROOT, "dist/science/v285r1-low-memory-validation-attempt-1-negative.json");
const python = process.platform === "win32" ? resolve(ROOT, ".venv-science/Scripts/python.exe") : resolve(ROOT, ".venv-science/bin/python");
const sha = (value) => createHash("sha256").update(value).digest("hex");
const canonical = (value) => Array.isArray(value) ? value.map(canonical) : value && typeof value === "object" ? Object.fromEntries(Object.entries(value).filter(([key]) => !["generatedAt", "host", "pid", "absolutePath"].includes(key)).sort(([a], [b]) => a.localeCompare(b)).map(([key, entry]) => [key, canonical(entry)])) : value;
const valueSha = (value) => sha(Buffer.from(JSON.stringify(canonical(value)), "utf8"));
if (existsSync(OUT) && !existsSync(PRIOR_NEGATIVE)) {
  const prior = JSON.parse(readFileSync(OUT, "utf8"));
  if (prior.status === "failed-low-memory-validation") await copyFile(OUT, PRIOR_NEGATIVE);
}

function execute(id, command, args) {
  const started = Date.now();
  const result = spawnSync(command, args, { cwd: ROOT, encoding: "utf8", shell: false, maxBuffer: 8 * 1024 * 1024 });
  return {
    id, command: [command, ...args].join(" "), exitCode: result.status ?? 1, durationMs: Date.now() - started,
    stdoutSha256: sha(Buffer.from(result.stdout ?? "", "utf8")), stderrSha256: sha(Buffer.from(result.stderr ?? "", "utf8")),
    outputTail: `${result.stdout ?? ""}${result.stderr ?? ""}`.slice(-2000),
  };
}

const v284Before = readFileSync(V284);
const commands = [];
commands.push(execute("focused", process.execPath, [resolve(ROOT, "scripts/atlas.mjs"), "test", "focused"]));
commands.push(execute("typescript", process.execPath, [resolve(ROOT, "node_modules/typescript/bin/tsc"), "--noEmit"]));
commands.push(execute("eslint", process.execPath, [resolve(ROOT, "node_modules/eslint/bin/eslint.js"), "app", "proxy.ts", "next.config.mjs", "scripts", "tests", "--quiet"]));
commands.push(execute("v282r1-python-syntax", python, ["-m", "py_compile", "scripts/fetch-relativity-reference-v282r1.py"]));
commands.push(execute("v282r1-inspect-no-network", python, ["scripts/fetch-relativity-reference-v282r1.py", "--inspect"]));
const v284After = readFileSync(V284);
const v284 = JSON.parse(v284After.toString("utf8"));
const v282r1 = JSON.parse(readFileSync(V282R1, "utf8"));
const product = JSON.parse(readFileSync(PRODUCT, "utf8"));
const disk = statfsSync("E:\\");
const freeDiskBytes = Number(disk.bavail) * Number(disk.bsize);
const commandsPassed = commands.every((command) => command.exitCode === 0);
const v284Unchanged = sha(v284Before) === sha(v284After) && v284.completedShardCount === 1 && v284.nextShardIndex === 1;
const unsigned = {
  version: "v285r1-low-memory-validation-evidence-v1",
  generatedAt: new Date().toISOString(),
  status: commandsPassed && v284Unchanged && product.version === "v263-current-product-evidence-pointer" ? "passed-low-memory-validation" : "failed-low-memory-validation",
  commands,
  resourceSnapshot: { freePhysicalMemoryBytes: freemem(), freePhysicalMemoryGiB: Number((freemem() / 2 ** 30).toFixed(2)), eDriveFreeBytes: freeDiskBytes, eDriveFreeGiB: Number((freeDiskBytes / 2 ** 30).toFixed(2)), heavyQualificationAuthorized: false },
  v282r1: { status: v282r1.status, completedTargets: v282r1.completedTargets.length, attemptedTargets: v282r1.attemptedTargets.length, failedTarget: v282r1.failedTarget, automaticRetryApplied: v282r1.automaticRetryApplied },
  v284: { status: v284.status, completedShardCount: v284.completedShardCount, nextShardIndex: v284.nextShardIndex, unchangedDuringValidation: v284Unchanged, automaticExecutionApplied: false },
  formalProduct: { version: product.version, pointerAdvanced: false, sha256: sha(readFileSync(PRODUCT)) },
  science: { defaultKernel: "legacy-eih-1pn", codeSha256: "0debb41b96f001f92f498ef6a36ceff77ede7f0dd2bdbe3c6e9db3dfbf6090a8", screenSha256: "08f42a50bc787df62dc018ee56b5f7b58065dcafe2e2a3703e3e67f3e6d94037", workerPhysicsMutation: "not-applied", eihOnePnMutation: "not-applied", kerrMutation: "not-applied" },
  skippedHeavyGates: ["full-regression", "rust", "standalone-build", "lite-build", "local-shadow-build", "playwright", "visual-matrix", "soak", "rtx-webgpu"],
};
const evidence = { ...unsigned, evidenceSha256: valueSha(unsigned) };
await mkdir(resolve(ROOT, "dist/science"), { recursive: true });
await writeFile(OUT, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ status: evidence.status, commands: commands.map(({ id, exitCode }) => ({ id, exitCode })), v282r1: evidence.v282r1, v284: evidence.v284, output: "dist/science/v285r1-low-memory-validation.json" }, null, 2));
if (evidence.status !== "passed-low-memory-validation") process.exitCode = 1;
