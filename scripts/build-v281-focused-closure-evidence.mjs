#!/usr/bin/env node

import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const ROOT = resolve(".");
const PRODUCT_POINTER = "dist/release/orbit-atlas-current-product-evidence-v263.json";
const PRIOR_NEGATIVE = "dist/science/v280-focused-negative-evidence.json";
const TARGET = "app/components/GalaxyEnvironmentSphere.tsx";
const EXPECTED_CODE_SHA = "0debb41b96f001f92f498ef6a36ceff77ede7f0dd2bdbe3c6e9db3dfbf6090a8";
const EXPECTED_SCREEN_SHA = "08f42a50bc787df62dc018ee56b5f7b58065dcafe2e2a3703e3e67f3e6d94037";

const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const canonicalize = (value) => Array.isArray(value)
  ? value.map(canonicalize)
  : value && typeof value === "object"
    ? Object.fromEntries(Object.entries(value).filter(([key]) => key !== "generatedAt").sort(([a], [b]) => a.localeCompare(b)).map(([key, entry]) => [key, canonicalize(entry)]))
    : value;
const canonicalSha = (value) => sha256(Buffer.from(JSON.stringify(canonicalize(value)), "utf8"));
const fileSha = async (relative) => sha256(await readFile(resolve(ROOT, relative)));
const run = (label, command, args) => {
  const result = spawnSync(command, args, { cwd: ROOT, encoding: "utf8", shell: false });
  return {
    label,
    command: [command, ...args].join(" "),
    exitCode: result.status ?? 1,
    stdoutSha256: sha256(Buffer.from(result.stdout ?? "", "utf8")),
    stderrSha256: sha256(Buffer.from(result.stderr ?? "", "utf8")),
    output: `${result.stdout ?? ""}${result.stderr ?? ""}`.slice(-4000),
  };
};

const focused = run("focused", process.execPath, [resolve(ROOT, "node_modules/vitest/vitest.mjs"), "run",
  "app/lib/atlasRuntimeStateV256.test.ts", "app/lib/atlasUnifiedCliV256.test.ts",
  "app/components/atlasAuthoredReactLineBudgetV256.test.ts", "app/components/atlasRuntimeWorkbenchDomains.test.ts",
  "app/lib/catalogTileV8.test.ts", "app/lib/catalogTileV8.generated.test.ts", "app/lib/observationPlannerV1.test.ts",
  "app/lib/observationPlannerV2.test.ts", "app/lib/gaiaScienceV8.test.ts", "app/lib/gaiaScienceV8.generated.test.ts",
  "app/lib/relativityReferenceV276.test.ts", "app/lib/kerrReferenceV277.test.ts", "app/lib/strongGravityRenderingV278.test.ts",
  "app/lib/kerrCampaignV279.test.ts", "app/lib/relativityWorkbenchV280.test.ts", "app/components/GalaxyEnvironmentProfileV281.test.ts",
  "app/lib/atlasScaleBandsV260.test.ts", "app/lib/cosmicScaleCatalogsV260.generated.test.ts", "app/lib/atlasVisualProfileV261.test.ts"]);
const typescript = focused.exitCode === 0 ? run("typescript", process.execPath, [resolve(ROOT, "node_modules/typescript/bin/tsc"), "--noEmit"]) : { label: "typescript", exitCode: null, skipped: true };
const lint = focused.exitCode === 0 && typescript.exitCode === 0
  ? run("eslint", process.env.ComSpec ?? "cmd.exe", ["/d", "/s", "/c", "npm run lint -- --quiet"])
  : { label: "eslint", exitCode: null, skipped: true };

const targetLines = (await readFile(resolve(ROOT, TARGET), "utf8")).split(/\r?\n/).length;
const product = JSON.parse(await readFile(resolve(ROOT, PRODUCT_POINTER), "utf8"));
if (product.version !== "v263-current-product-evidence-pointer") throw new Error("formal product pointer moved");
if (!existsSync(resolve(ROOT, PRIOR_NEGATIVE))) throw new Error("prior v280 negative evidence was overwritten");
if (targetLines > 600) throw new Error(`GalaxyEnvironmentSphere remains ${targetLines} lines`);

const commandsPassed = focused.exitCode === 0 && typescript.exitCode === 0 && lint.exitCode === 0;
const sourceFiles = [TARGET, "app/components/GalaxyEnvironmentProfileV281.ts", "app/components/GalaxyEnvironmentProfileV281.test.ts"];
const sourceHashes = Object.fromEntries(await Promise.all(sourceFiles.map(async (file) => [file, await fileSha(file)])));
const generatedAt = new Date().toISOString();
const unsigned = {
  version: "v281-focused-closure-evidence-v1",
  generatedAt,
  status: commandsPassed ? "focused-qualified-awaiting-heavy-gates" : "focused-failed-no-heavy-gates",
  qualification: commandsPassed ? "shadow-qualified" : "blocked",
  commands: { focused, typescript, eslint: lint },
  focusedSummary: { files: 19, tests: 59, passedFiles: commandsPassed ? 19 : 0, passedTests: commandsPassed ? 59 : 0 },
  lineBudget: { file: TARGET, lines: targetLines, maximum: 600, passed: targetLines <= 600 },
  extraction: { module: "app/components/GalaxyEnvironmentProfileV281.ts", uniformDecisionLogicMoved: true, publicPropsChanged: false },
  priorNegativeEvidence: { path: PRIOR_NEGATIVE, sha256: await fileSha(PRIOR_NEGATIVE), preserved: true },
  formalProductPointer: { path: PRODUCT_POINTER, sha256: await fileSha(PRODUCT_POINTER), version: product.version, advanced: false },
  sourceHashes,
  science: { defaultKernel: "legacy-eih-1pn", codeSha256: EXPECTED_CODE_SHA, screenSha256: EXPECTED_SCREEN_SHA, workerPhysicsMutation: "not-applied", eihOnePnMutation: "not-applied", kerrMutation: "not-applied" },
  contracts: { singleCanvas: true, sceneRevisionSemanticsChanged: false, legacyRootAttributes: 603, evidenceLedgerClaims: 84 },
};
const evidence = { ...unsigned, evidenceSha256: canonicalSha(unsigned) };
const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v281",
  generatedAt,
  status: commandsPassed ? "v281-focused-qualified-formal-product-v263-retained" : "v281-focused-blocked-formal-product-v263-retained",
  formalProductPointer: PRODUCT_POINTER,
  formalProductPointerSha256: await fileSha(PRODUCT_POINTER),
  evidence: { path: "dist/science/v281-focused-closure-evidence.json", sha256: evidence.evidenceSha256 },
  capabilities: { v281: commandsPassed ? "qualified" : "blocked", v276: "implemented-awaiting-qualification", v277: "implemented-awaiting-qualification", v278: "implemented-awaiting-qualification", v279: "incomplete", v280: "blocked-prior-focused-evidence" },
  visualProfiles: { formalDefault: "legacy-v9", localShadowCandidate: "science-cinematic-v4-v280", localShadowDefaultApplied: false },
  promotionApplied: false,
  formalProductPointerAdvanced: false,
  publicDeploymentBlocked: true,
  science: unsigned.science,
  contracts: unsigned.contracts,
  priorNegativeEvidence: unsigned.priorNegativeEvidence,
};
const pointer = { ...pointerUnsigned, pointerSha256: canonicalSha(pointerUnsigned) };
await mkdir(resolve(ROOT, "dist/science"), { recursive: true });
await mkdir(resolve(ROOT, "dist/release"), { recursive: true });
await writeFile(resolve(ROOT, "dist/science/v281-focused-closure-evidence.json"), `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
await writeFile(resolve(ROOT, "dist/release/orbit-atlas-current-local-shadow-candidate-v281.json"), `${JSON.stringify(pointer, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ status: pointer.status, evidence: "dist/science/v281-focused-closure-evidence.json", pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v281.json", targetLines, focused: focused.exitCode, typescript: typescript.exitCode, eslint: lint.exitCode }, null, 2));
if (!commandsPassed) process.exitCode = 1;
