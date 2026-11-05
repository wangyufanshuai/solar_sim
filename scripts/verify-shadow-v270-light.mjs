import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const ROOT = resolve(".");
const OUTPUT = "dist/science/v267-v270-shadow-light-validation.json";
const EXPECTED_CODE_SHA = "0debb41b96f001f92f498ef6a36ceff77ede7f0dd2bdbe3c6e9db3dfbf6090a8";
const EXPECTED_SCREEN_SHA = "08f42a50bc787df62dc018ee56b5f7b58065dcafe2e2a3703e3e67f3e6d94037";
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const canonicalize = (value) => Array.isArray(value)
  ? value.map(canonicalize)
  : value && typeof value === "object"
    ? Object.fromEntries(Object.entries(value).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, canonicalize(entry)]))
    : value;

const focusedFiles = [
  "app/lib/gaiaResearchWorkbenchV267.test.ts",
  "app/lib/atlasScaleJourneyV268.test.ts",
  "app/lib/atlasVisualProfileV269.test.ts",
  "app/lib/atlasApiRateLimitV270.test.ts",
  "app/lib/atlasApiSecurityV270.test.ts",
  "app/lib/atlasApiRoutesV270.test.ts",
  "app/lib/atlasRuntimeStore.test.ts",
  "app/lib/observationPlannerV2.test.ts",
  "app/lib/atlasRuntimeStateV256.test.ts",
  "app/lib/evidenceLedger.test.ts",
  "app/lib/atlasUnifiedCliV256.test.ts",
];

function execute(id, command, args) {
  const started = performance.now();
  const result = spawnSync(command, args, {
    cwd: ROOT,
    encoding: "utf8",
    shell: false,
    maxBuffer: 8 * 1024 * 1024,
  });
  return {
    id,
    command: [command, ...args].join(" "),
    exitCode: result.status ?? 1,
    durationMs: Math.round(performance.now() - started),
    signal: result.signal ?? null,
    stdoutSha256: sha256(result.stdout ?? ""),
    stderrSha256: sha256(result.stderr ?? ""),
    error: result.error?.message ?? "",
  };
}

const startedAt = new Date().toISOString();
const focused = execute("focused", process.execPath, [
  resolve(ROOT, "node_modules/vitest/vitest.mjs"),
  "run",
  ...focusedFiles,
]);
const typescript = focused.exitCode === 0
  ? execute("typescript", process.execPath, [resolve(ROOT, "node_modules/typescript/bin/tsc"), "--noEmit"])
  : { id: "typescript", command: "not-run-after-focused-failure", exitCode: null, durationMs: 0, signal: null, stdoutSha256: null, stderrSha256: null, error: "" };

const [progress, productPointer, v263] = await Promise.all([
  readFile(resolve(ROOT, "dist/science/kerr-dense-campaign-progress-v8.json"), "utf8").then(JSON.parse),
  readFile(resolve(ROOT, "dist/release/orbit-atlas-current-product-evidence-v263.json"), "utf8").then(JSON.parse),
  readFile(resolve(ROOT, "dist/release/orbit-atlas-v263-local-validation-evidence.json"), "utf8").then(JSON.parse),
]);

const scienceFrozen = progress.codeSha256 === EXPECTED_CODE_SHA
  && progress.finiteObserverScreenManifestSha256 === EXPECTED_SCREEN_SHA;
const contractsFrozen = v263.contracts?.legacyRootAttributes === 603
  && v263.contracts?.legacyRootKeySha256 === "ac6470fcc517e1b2ba2c6618f530f7af57d1a0caa52fffae0af7232f912f9867"
  && v263.contracts?.evidenceLedgerClaims === 84
  && v263.contracts?.evidenceLedgerCanonicalSha256 === "e7d7e2984983714d80cc726e621b7d4fdb171622917ff8e052c57836d0a18dec";
const productPointerFrozen = productPointer.version === "v263-current-product-evidence-pointer";

const result = {
  version: "v267-v270-shadow-light-validation-v1",
  startedAt,
  endedAt: new Date().toISOString(),
  status: focused.exitCode === 0 && typescript.exitCode === 0 && scienceFrozen && contractsFrozen && productPointerFrozen
    ? "passed-lightweight-shadow-validation"
    : "failed-lightweight-shadow-validation",
  commands: [focused, typescript],
  focusedFiles,
  scienceFrozen,
  contractsFrozen,
  productPointerFrozen,
  defaultKernel: "legacy-eih-1pn",
  mutation: { workerPhysics: "not-applied", eihOnePn: "not-applied", kerr: "not-applied" },
  heavyValidationApplied: false,
  correctedV266Applied: false,
  v265DownloadResumed: false,
};
result.resultSha256 = sha256(JSON.stringify(canonicalize(result)));
await mkdir(resolve(ROOT, "dist/science"), { recursive: true });
await writeFile(resolve(ROOT, OUTPUT), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify({ output: OUTPUT, status: result.status, resultSha256: result.resultSha256 }, null, 2));
if (result.status !== "passed-lightweight-shadow-validation") process.exitCode = 1;
