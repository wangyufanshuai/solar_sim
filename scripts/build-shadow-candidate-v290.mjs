#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const ROOT = resolve(".");
const PATHS = {
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  validation: "dist/science/v290-low-memory-validation.json",
  v281: "dist/science/v281-focused-closure-evidence.json",
  truthV286: "dist/science/scientific-evidence-truth-audit-v286.json",
  v287: "dist/science/relativity-reference-v282r2/identity-fetch-evidence.json",
  v288: "dist/science/kerr-reference-v288/short-gate-evidence.json",
  campaignV288: "dist/science/kerr-campaign-v288r1/campaign-state.json",
  assetsV289: "dist/science-cinematic-v4-v289-assets/manifest.json",
  v285: "dist/science/science-cinematic-v285r1-shadow-evidence.json",
};
const sha = (value) => createHash("sha256").update(value).digest("hex");
const canonical = (value) => Array.isArray(value) ? value.map(canonical) : value && typeof value === "object" ? Object.fromEntries(Object.entries(value).filter(([key]) => !["generatedAt", "host", "pid", "absolutePath"].includes(key)).sort(([a], [b]) => a.localeCompare(b)).map(([key, entry]) => [key, canonical(entry)])) : value;
const valueSha = (value) => sha(Buffer.from(JSON.stringify(canonical(value)), "utf8"));
const readJson = async (path) => JSON.parse(await readFile(resolve(ROOT, path), "utf8"));
const fileSha = async (path) => sha(await readFile(resolve(ROOT, path)));
const [formal, validation, v281, truth, v287, v288, campaign, assets, v285] = await Promise.all(Object.values(PATHS).map(readJson));
if (formal.version !== "v263-current-product-evidence-pointer") throw new Error("formal v263 pointer changed");
if (validation.status !== "passed-low-memory-validation-science-blocked-v288") throw new Error("v290 low-memory validation is not passing");
const capabilities = {
  v281: v281.qualification === "shadow-qualified" ? "qualified" : "blocked",
  v282: v287.status === "identity-cache-partial-1-of-9" ? "identity-cache-partial-1-of-9" : "blocked",
  legacyV283: truth.v283.status.includes("withdrawn") ? "qualification-withdrawn" : "blocked",
  legacyV284: truth.v284.status.startsWith("quarantined") ? "quarantined" : "blocked",
  v288ShortGate: v288.gatePassed === true ? "qualified-short-gate-only" : "blocked",
  v288Campaign: campaign.completedShardCount === 1 ? "incomplete-1-of-49" : "incomplete-0-of-49",
  v289: "implemented-awaiting-browser-qualification",
  v290: "incomplete-heavy-qualification-not-run",
};
const evidenceFiles = Object.fromEntries(await Promise.all(Object.entries(PATHS).map(async ([id, path]) => [id, { path, sha256: await fileSha(path) }])));
const generatedAt = new Date().toISOString();
const unsigned = {
  version: "v290-scientific-truth-runtime-shadow-evidence-v1", generatedAt,
  status: "low-memory-implementation-complete-heavy-qualification-pending", capabilities,
  evidence: evidenceFiles,
  scientificTruth: { legacyV283: truth.v283, legacyV284: truth.v284, correctedV288: { status: v288.status, failureReasons: v288.failureReasons, classCounts: v288.classCounts }, shardExecutionApplied: false },
  referenceIdentity: { status: v287.status, requestedCommand: v287.identity.requestedCommand, reportedHorizonsId: v287.identity.reportedHorizonsId, completedTargets: 1, remainingTargets: 8 },
  runtime: { stableVisualProfileReferences: true, deepSpaceIntentGate: true, appShellResourceTelemetryIsolated: true, directDreiImports: true, evidenceReadCacheEntries: 4, localShadowDefaultApplied: false },
  visualAssets: { id: assets.id, entries: assets.entries.length, canonicalSha256: assets.canonicalSha256, installedBytes: assets.installedBytes, runtimePolicy: assets.runtimePolicy, networkDownloadApplied: false },
  priorV285: { status: v285.status, sha256: await fileSha(PATHS.v285) },
  heavyQualification: { authorized: false, reason: "stable-7-gib-preflight-not-run", thresholdsUnchanged: true },
  formalProductPointer: { path: PATHS.formal, version: formal.version, sha256: await fileSha(PATHS.formal), advanced: false },
  science: { defaultKernel: "legacy-eih-1pn", codeSha256: "0debb41b96f001f92f498ef6a36ceff77ede7f0dd2bdbe3c6e9db3dfbf6090a8", screenSha256: "08f42a50bc787df62dc018ee56b5f7b58065dcafe2e2a3703e3e67f3e6d94037", workerPhysicsMutation: "not-applied", eihOnePnMutation: "not-applied", legacyKerrMutation: "not-applied" },
  contracts: { singleCanvas: true, sceneRevisionSemanticsChanged: false, legacyRootAttributes: 603, evidenceLedgerClaims: 84 },
  release: { formalProductPointerAdvanced: false, localShadowDefaultApplied: false, publicDeploymentBlocked: true, vercelApplied: false, productionApplied: false, dnsApplied: false, signingApplied: false },
};
const evidence = { ...unsigned, evidenceSha256: valueSha(unsigned) };
const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v290", generatedAt,
  status: "low-memory-implementation-complete-heavy-qualification-pending", capabilities,
  evidence: { path: "dist/science/orbit-atlas-shadow-v290-evidence.json", sha256: evidence.evidenceSha256 },
  formalProductPointer: PATHS.formal, formalProductPointerAdvanced: false,
  localShadowDefaultApplied: false, publicDeploymentBlocked: true,
};
const pointer = { ...pointerUnsigned, pointerSha256: valueSha(pointerUnsigned) };
await mkdir(resolve(ROOT, "dist/science"), { recursive: true });
await mkdir(resolve(ROOT, "dist/release"), { recursive: true });
await writeFile(resolve(ROOT, "dist/science/orbit-atlas-shadow-v290-evidence.json"), `${JSON.stringify(evidence, null, 2)}\n`);
await writeFile(resolve(ROOT, "dist/release/orbit-atlas-current-local-shadow-candidate-v290.json"), `${JSON.stringify(pointer, null, 2)}\n`);
console.log(JSON.stringify({ status: pointer.status, capabilities, pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v290.json", formalProductPointerAdvanced: false }, null, 2));
