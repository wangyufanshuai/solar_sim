#!/usr/bin/env node

import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(".");
const formal = "dist/release/orbit-atlas-current-product-evidence-v263.json";
const paths = {
  v281: "dist/science/v281-focused-closure-evidence.json",
  v282: "dist/science/relativity-reference-v282/validation-evidence.json",
  v283: "dist/science/kerr-reference-v283/short-gate-evidence.json",
  v284: "dist/science/kerr-campaign-v284/campaign-state.json",
};
const sha = (value) => createHash("sha256").update(value).digest("hex");
const canonical = (value) => Array.isArray(value) ? value.map(canonical) : value && typeof value === "object" ? Object.fromEntries(Object.entries(value).filter(([key]) => !["generatedAt", "host", "pid", "absolutePath"].includes(key)).sort(([a], [b]) => a.localeCompare(b)).map(([key, entry]) => [key, canonical(entry)])) : value;
const valueSha = (value) => sha(Buffer.from(JSON.stringify(canonical(value)), "utf8"));
const readJson = async (relative) => existsSync(resolve(root, relative)) ? JSON.parse(await readFile(resolve(root, relative), "utf8")) : null;
const fileSha = async (relative) => existsSync(resolve(root, relative)) ? sha(await readFile(resolve(root, relative))) : null;
const v281 = await readJson(paths.v281);
const v282 = await readJson(paths.v282);
const v283 = await readJson(paths.v283);
const v284 = await readJson(paths.v284);
const formalPointer = await readJson(formal);
if (!formalPointer || formalPointer.version !== "v263-current-product-evidence-pointer") throw new Error("formal v263 pointer changed");
const capabilities = {
  v281: v281?.qualification === "shadow-qualified" ? "qualified" : "blocked",
  v282: v282?.referenceInfrastructure === "shadow-qualified" ? "qualified" : (v282 ? "blocked" : "incomplete"),
  v283: v283?.gatePassed === true ? "qualified" : (v283 ? "blocked" : "incomplete"),
  v284: v284?.status === "complete" ? "qualified" : (v284 ? "incomplete" : "incomplete"),
  v285: "implemented-awaiting-qualification",
};
const sourceFiles = ["app/lib/atlasVisualProfileV285.ts", "app/lib/atlasVisualProfileV274.ts", "app/lib/relativityWorkbenchEvidenceV285.ts", "app/components/ScienceCinematicVisualSurfaceV261.tsx", "app/components/AtlasRuntimeWorkbenchSurface.tsx", "app/components/RelativityResearchWorkbenchV280.tsx"];
const sourceHashes = Object.fromEntries(await Promise.all(sourceFiles.map(async (path) => [path, await fileSha(path)])));
const unsigned = {
  version: "v285-science-cinematic-v4-shadow-evidence-v1",
  generatedAt: new Date().toISOString(),
  status: "capability-level-shadow-candidate-formal-product-v263-retained",
  capabilities,
  evidence: Object.fromEntries(await Promise.all(Object.entries(paths).map(async ([phase, path]) => [phase, { path, exists: Boolean(await readJson(path)), sha256: await fileSha(path) }]))),
  runtime: { resolver: "resolveAtlasVisualProfileV285", scienceGroups: ["sky/backdrop", "planet/rings", "catalog/cosmic", "strong-gravity", "post-FX", "launch/exoplanet", "research-HUD"], scienceBuffer: "immutable-ray-payload", cinematicNoise: "seeded-only", localShadowDefaultApplied: false, formalDefault: "legacy-v9", liteDefault: "legacy-v9" },
  workbench: { evidenceModel: "RelativityWorkbenchEvidenceModelV285", missionCapsule: "scenario-and-artifact-sha-only", exports: ["JSON", "CSV", "FITS", "PNG"], surveyCompleteness: "unavailable" },
  sourceHashes,
  formalProductPointer: { path: formal, version: formalPointer.version, sha256: await fileSha(formal), advanced: false },
  science: { defaultKernel: "legacy-eih-1pn", codeSha256: "0debb41b96f001f92f498ef6a36ceff77ede7f0dd2bdbe3c6e9db3dfbf6090a8", screenSha256: "08f42a50bc787df62dc018ee56b5f7b58065dcafe2e2a3703e3e67f3e6d94037", workerPhysicsMutation: "not-applied", eihOnePnMutation: "not-applied", kerrMutation: "not-applied" },
  contracts: { singleCanvas: true, sceneRevisionSemanticsChanged: false, legacyRootAttributes: 603, evidenceLedgerClaims: 84 },
  release: { localShadowPromotionApplied: false, publicDeploymentBlocked: true, vercelApplied: false, productionApplied: false, dnsApplied: false, signingApplied: false },
};
const evidence = { ...unsigned, evidenceSha256: valueSha(unsigned) };
const pointerUnsigned = { version: "current-local-shadow-candidate-v285", generatedAt: evidence.generatedAt, status: evidence.status, capabilities, evidence: { path: "dist/science/science-cinematic-v285-shadow-evidence.json", sha256: evidence.evidenceSha256 }, formalProductPointer: formal, formalProductPointerAdvanced: false, localShadowDefaultApplied: false, publicDeploymentBlocked: true, science: unsigned.science, contracts: unsigned.contracts };
const pointer = { ...pointerUnsigned, pointerSha256: valueSha(pointerUnsigned) };
await mkdir(resolve(root, "dist/science"), { recursive: true });
await mkdir(resolve(root, "dist/release"), { recursive: true });
await writeFile(resolve(root, "dist/science/science-cinematic-v285-shadow-evidence.json"), `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
await writeFile(resolve(root, "dist/release/orbit-atlas-current-local-shadow-candidate-v285.json"), `${JSON.stringify(pointer, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ status: pointer.status, capabilities, evidence: "dist/science/science-cinematic-v285-shadow-evidence.json", pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v285.json" }, null, 2));
