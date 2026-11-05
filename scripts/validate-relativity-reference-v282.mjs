#!/usr/bin/env node

import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(".");
const dir = resolve(root, "dist/science/relativity-reference-v282");
const checkpointPath = resolve(dir, "checkpoint.json");
const evidencePath = resolve(dir, "validation-evidence.json");
const pointerPath = resolve(root, "dist/release/orbit-atlas-current-local-v282-reference.json");
const formalPointer = "dist/release/orbit-atlas-current-product-evidence-v263.json";
const sha = (value) => createHash("sha256").update(value).digest("hex");
const canonical = (value) => Array.isArray(value) ? value.map(canonical) : value && typeof value === "object" ? Object.fromEntries(Object.entries(value).filter(([key]) => !["generatedAt", "host", "pid", "absolutePath"].includes(key)).sort(([a], [b]) => a.localeCompare(b)).map(([key, entry]) => [key, canonical(entry)])) : value;
const valueSha = (value) => sha(Buffer.from(JSON.stringify(canonical(value)), "utf8"));
const readJson = async (path) => existsSync(path) ? JSON.parse(await readFile(path, "utf8")) : null;
const fileSha = async (path) => existsSync(path) ? sha(await readFile(path)) : null;

const checkpoint = await readJson(checkpointPath);
if (!checkpoint) throw new Error("v282 checkpoint is missing; run reference-v282-run first");
const identity = checkpoint.identityValidation ?? { status: "not-run" };
const artifactFiles = ["reference-fixture-v282.json", "dop853-v282.json", "stm-v282.json", "ias15-v282.json"];
const artifactHashes = Object.fromEntries(await Promise.all(artifactFiles.map(async (name) => [name, await fileSha(resolve(dir, name))])));
const complete = checkpoint.stage === "campaign-complete" && identity.status === "passed" && Object.values(artifactHashes).every(Boolean);
const unsigned = {
  version: "v282-relativity-reference-validation-evidence-v1",
  generatedAt: new Date().toISOString(),
  status: complete ? "reference-infrastructure-qualified-candidate-model-separate" : "blocked-target-identity-or-campaign-incomplete",
  referenceInfrastructure: complete ? "shadow-qualified" : "blocked",
  candidateModel: complete ? "candidate-model-qualified-or-failed-from-real-artifact" : "not-qualified",
  checkpoint: { path: "dist/science/relativity-reference-v282/checkpoint.json", sha256: await fileSha(checkpointPath), stage: checkpoint.stage, schema: checkpoint.schema, inputIdentity: checkpoint.inputIdentity, chunkSize: checkpoint.chunkSize },
  targetIdentity: { matrix: checkpoint.targetIdentityMatrix, validation: identity },
  dimensions: { bodyCount: checkpoint.bodyCount, stateDimension: checkpoint.stateDimension, parameterDimension: checkpoint.parameterDimension, integratedStateAndPhiDimension: checkpoint.jointDimension },
  campaign: checkpoint.campaign ?? { calibrationDays: 30, fitIterations: 3, holdoutDays: [365, 3652.5], status: "not-complete" },
  artifacts: artifactHashes,
  uncertaintyBudget: { components: ["uDiscretization", "uSolver", "uReference", "uInitialState", "uFit", "uConstants", "uModel"], aggregation: "linear-unless-independence-proven", uSolverSource: "DOP853/IAS15 actual artifact difference" },
  oracle: { backend: "fixed-version-80-digit-multiprecision", scope: ["two-body", "schwarzschild", "kerr-critical-curve"], fullNBodyAuthority: false, status: "reduced-fixture-only" },
  formalProductPointer: { path: formalPointer, sha256: await fileSha(resolve(root, formalPointer)), advanced: false },
  science: { defaultKernel: "legacy-eih-1pn", codeSha256: "0debb41b96f001f92f498ef6a36ceff77ede7f0dd2bdbe3c6e9db3dfbf6090a8", screenSha256: "08f42a50bc787df62dc018ee56b5f7b58065dcafe2e2a3703e3e67f3e6d94037", workerPhysicsMutation: "not-applied", eihOnePnMutation: "not-applied", kerrMutation: "not-applied" },
  release: { localShadowPromotionApplied: false, publicDeploymentBlocked: true },
};
const evidence = { ...unsigned, evidenceSha256: valueSha(unsigned) };
const pointerUnsigned = { version: "orbit-atlas-current-local-v282-reference", generatedAt: evidence.generatedAt, status: evidence.status, evidence: { path: "dist/science/relativity-reference-v282/validation-evidence.json", sha256: evidence.evidenceSha256 }, formalProductPointer: formalPointer, formalProductPointerAdvanced: false, localShadowPromotionApplied: false, publicDeploymentBlocked: true };
const pointer = { ...pointerUnsigned, pointerSha256: valueSha(pointerUnsigned) };
await mkdir(dir, { recursive: true });
await mkdir(resolve(root, "dist/release"), { recursive: true });
await writeFile(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
await writeFile(pointerPath, `${JSON.stringify(pointer, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ status: evidence.status, referenceInfrastructure: evidence.referenceInfrastructure, candidateModel: evidence.candidateModel, evidence: "dist/science/relativity-reference-v282/validation-evidence.json", pointer: "dist/release/orbit-atlas-current-local-v282-reference.json" }, null, 2));
if (!complete) process.exitCode = 1;
