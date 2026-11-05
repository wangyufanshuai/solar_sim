#!/usr/bin/env node

import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const ROOT = resolve(".");
const FORMAL = "dist/release/orbit-atlas-current-product-evidence-v263.json";
const VALIDATION = "dist/science/v285r1-low-memory-validation.json";
const PATHS = {
  v281: "dist/science/v281-focused-closure-evidence.json",
  v282: "dist/science/relativity-reference-v282/validation-evidence.json",
  v283: "dist/science/kerr-reference-v283/short-gate-evidence.json",
  v284: "dist/science/kerr-campaign-v284/campaign-state.json",
  v285Baseline: "dist/science/science-cinematic-v285-shadow-evidence.json",
  v282r1Checkpoint: "dist/science/relativity-reference-v282r1/fetch-checkpoint.json",
};
const sha = (value) => createHash("sha256").update(value).digest("hex");
const canonical = (value) => Array.isArray(value) ? value.map(canonical) : value && typeof value === "object" ? Object.fromEntries(Object.entries(value).filter(([key]) => !["generatedAt", "host", "pid", "absolutePath"].includes(key)).sort(([a], [b]) => a.localeCompare(b)).map(([key, entry]) => [key, canonical(entry)])) : value;
const valueSha = (value) => sha(Buffer.from(JSON.stringify(canonical(value)), "utf8"));
const fileSha = async (path) => existsSync(resolve(ROOT, path)) ? sha(await readFile(resolve(ROOT, path))) : null;
const readJson = async (path) => existsSync(resolve(ROOT, path)) ? JSON.parse(await readFile(resolve(ROOT, path), "utf8")) : null;

const [formal, validation, v281, v283, v284, v285Baseline, v282r1] = await Promise.all([
  readJson(FORMAL), readJson(VALIDATION), readJson(PATHS.v281), readJson(PATHS.v283), readJson(PATHS.v284), readJson(PATHS.v285Baseline), readJson(PATHS.v282r1Checkpoint),
]);
if (formal?.version !== "v263-current-product-evidence-pointer") throw new Error("formal v263 pointer changed");
if (validation?.status !== "passed-low-memory-validation") throw new Error("v285r1 low-memory validation is not passing");
if (!v282r1) throw new Error("v282r1 checkpoint is missing");

const tokenConsumers = {
  sky: ["app/components/GalaxyEnvironmentSphere.tsx", "groups.sky"],
  solar: ["app/components/Planet.tsx", "groups.solar"],
  catalog: ["app/components/GaiaStarField.tsx", "groups.catalog"],
  postFx: ["app/components/UniversePmndrsPostProcessing.tsx", "groups.postFx"],
  strongGravity: ["app/components/KerrBlackHole.tsx", "runtimeTokens.strongGravity"],
  launch: ["app/components/LaunchSceneView.tsx", "runtimeTokens.launch"],
  exoplanet: ["app/components/ExoplanetSystemScene.tsx", "runtimeTokens.exoplanet"],
  hud: ["app/components/AtlasRuntimeWorkbenchSurface.tsx", "resolveAtlasVisualShellPropsV285R1"],
};
const runtimeAudit = {};
for (const [group, [path, token]] of Object.entries(tokenConsumers)) {
  const source = await readFile(resolve(ROOT, path), "utf8");
  runtimeAudit[group] = { status: source.includes(token) ? "consumed" : "missing", source: path, sourceSha256: sha(source), token };
}
const consumedTokenGroups = Object.entries(runtimeAudit).filter(([, entry]) => entry.status === "consumed").map(([group]) => group);
if (consumedTokenGroups.length !== 8) throw new Error("not all V4 token groups have runtime consumers");

let v282r1Negative = null;
if (v282r1.status === "failed-no-automatic-retry") {
  const partRelative = "dist/science/relativity-reference-v282r1/horizons-barycenters/mercury-barycenter-horizons.json.part";
  const negativeUnsigned = {
    version: "v282r1-barycenter-fetch-attempt-1-negative-evidence-v1",
    generatedAt: new Date().toISOString(),
    status: v282r1.status,
    failedTarget: v282r1.failedTarget,
    failure: String(v282r1.failure ?? "fetch failed").slice(0, 256),
    attemptedTargets: v282r1.attemptedTargets,
    completedTargets: v282r1.completedTargets,
    rawPart: { path: partRelative, sha256: await fileSha(partRelative), retained: existsSync(resolve(ROOT, partRelative)) },
    checkpoint: { path: PATHS.v282r1Checkpoint, sha256: await fileSha(PATHS.v282r1Checkpoint) },
    automaticRetryApplied: false,
    subsequentTargetRequested: false,
    boundary: "single-request-failed-closed-old-v282-evidence-preserved",
  };
  v282r1Negative = { ...negativeUnsigned, evidenceSha256: valueSha(negativeUnsigned) };
  await writeFile(resolve(ROOT, "dist/science/relativity-reference-v282r1/fetch-attempt-1-negative-evidence.json"), `${JSON.stringify(v282r1Negative, null, 2)}\n`, "utf8");
}

const evidenceManifest = Object.fromEntries(await Promise.all(Object.entries(PATHS).map(async ([phase, path]) => [phase, { path, exists: existsSync(resolve(ROOT, path)), sha256: await fileSha(path) }])));
const capabilities = {
  v281: v281?.qualification === "shadow-qualified" ? "qualified" : "blocked",
  v282: v282r1.status === "identity-cache-ready-awaiting-campaign" ? "identity-cache-ready-awaiting-campaign" : "blocked-single-request-attempt-1",
  v283: v283?.gatePassed === true ? "qualified-short-gate-only" : "blocked",
  v284: v284?.completedShardCount === 1 && v284?.nextShardIndex === 1 ? "incomplete-1-of-49" : "incomplete",
  v285: "implemented-awaiting-browser-qualification",
};
const generatedAt = new Date().toISOString();
const unsigned = {
  version: "v285r1-low-memory-visual-workbench-shadow-evidence-v1",
  generatedAt,
  status: "implemented-low-memory-validation-passed-formal-product-v263-retained",
  capabilities,
  evidence: evidenceManifest,
  validation: { path: VALIDATION, sha256: await fileSha(VALIDATION), status: validation.status },
  v282r1: { status: v282r1.status, failedTarget: v282r1.failedTarget, automaticRetryApplied: false, negativeEvidence: v282r1Negative ? { path: "dist/science/relativity-reference-v282r1/fetch-attempt-1-negative-evidence.json", sha256: await fileSha("dist/science/relativity-reference-v282r1/fetch-attempt-1-negative-evidence.json") } : null },
  runtime: {
    resolver: "resolveAtlasVisualProfileV285", consumedTokenGroups, tokenConsumers: runtimeAudit,
    localAbProfile: "science-cinematic-v4-v285", localAbVisibleIn: ["development", "standalone-full", "local-shadow"], liteVisible: false,
    localShadowDefaultApplied: false, formalDefault: "legacy-v9", liteDefault: "legacy-v9", scienceBuffer: "immutable-ray-payload", cinematicDecoration: "seeded-only",
  },
  workbench: { api: "/api/atlas/relativity-evidence", responseMaxBytes: 131072, cache: "no-store", liteBoundary: "unavailable", exports: ["JSON", "CSV", "FITS-if-present", "PNG-if-present"], missionCapsule: "scenario-and-artifact-sha-only" },
  v284Preservation: { completedShardCount: v284.completedShardCount, nextShardIndex: v284.nextShardIndex, automaticExecutionApplied: false, stateSha256: v284.stateSha256 },
  priorEvidencePreserved: { v282: { path: PATHS.v282, sha256: await fileSha(PATHS.v282) }, v285: { path: PATHS.v285Baseline, sha256: await fileSha(PATHS.v285Baseline), status: v285Baseline?.status ?? null } },
  formalProductPointer: { path: FORMAL, version: formal.version, sha256: await fileSha(FORMAL), advanced: false },
  science: { defaultKernel: "legacy-eih-1pn", codeSha256: "0debb41b96f001f92f498ef6a36ceff77ede7f0dd2bdbe3c6e9db3dfbf6090a8", screenSha256: "08f42a50bc787df62dc018ee56b5f7b58065dcafe2e2a3703e3e67f3e6d94037", workerPhysicsMutation: "not-applied", eihOnePnMutation: "not-applied", kerrMutation: "not-applied" },
  contracts: { singleCanvas: true, sceneRevisionSemanticsChanged: false, legacyRootAttributes: 603, evidenceLedgerClaims: 84 },
  release: { localShadowPromotionApplied: false, publicDeploymentBlocked: true, vercelApplied: false, productionApplied: false, dnsApplied: false, signingApplied: false },
};
const evidence = { ...unsigned, evidenceSha256: valueSha(unsigned) };
const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v285r1", generatedAt, status: evidence.status, capabilities,
  evidence: { path: "dist/science/science-cinematic-v285r1-shadow-evidence.json", sha256: evidence.evidenceSha256 },
  formalProductPointer: FORMAL, formalProductPointerAdvanced: false, localShadowDefaultApplied: false, publicDeploymentBlocked: true,
  science: unsigned.science, contracts: unsigned.contracts,
};
const pointer = { ...pointerUnsigned, pointerSha256: valueSha(pointerUnsigned) };
await mkdir(resolve(ROOT, "dist/science"), { recursive: true });
await mkdir(resolve(ROOT, "dist/release"), { recursive: true });
await writeFile(resolve(ROOT, "dist/science/science-cinematic-v285r1-shadow-evidence.json"), `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
await writeFile(resolve(ROOT, "dist/release/orbit-atlas-current-local-shadow-candidate-v285r1.json"), `${JSON.stringify(pointer, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ status: pointer.status, capabilities, consumedTokenGroups, pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v285r1.json", formalProductPointerAdvanced: false }, null, 2));
