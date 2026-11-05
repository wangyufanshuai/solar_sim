#!/usr/bin/env node
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(".");
const formalPointerPath = "dist/release/orbit-atlas-current-product-evidence-v263.json";
const paths = {
  v276: "dist/science/relativity-reference-v276/reference-evidence.json",
  v277: "dist/science/kerr-reference-v277/short-gate-evidence.json",
  v278: "dist/science/strong-gravity-v278-shadow-evidence.json",
  v279: "dist/science/kerr-campaign-v279/campaign-state.json",
};
const sourceFiles = [
  "app/lib/relativityReferenceV276.ts", "app/lib/kerrReferenceV277.ts", "app/lib/strongGravityRenderingV278.ts",
  "app/lib/kerrCampaignV279.ts", "app/lib/relativityWorkbenchV280.ts", "app/lib/atlasVisualProfileV280.ts",
  "app/components/RelativityResearchWorkbenchV280.tsx", "app/components/RelativityResearchWorkspaceSection.tsx",
];
const shaBytes = (bytes) => createHash("sha256").update(bytes).digest("hex");
const shaJson = (value) => shaBytes(Buffer.from(JSON.stringify(value, (_, entry) => entry && typeof entry === "object" && !Array.isArray(entry)
  ? Object.fromEntries(Object.entries(entry).sort(([a], [b]) => a.localeCompare(b))) : entry), "utf8"));
const readJson = async (relative) => existsSync(resolve(root, relative)) ? JSON.parse(await readFile(resolve(root, relative), "utf8")) : null;
const hashFile = async (relative) => existsSync(resolve(root, relative)) ? shaBytes(await readFile(resolve(root, relative))) : null;
const generatedAt = new Date().toISOString();
const v276 = await readJson(paths.v276);
const v277 = await readJson(paths.v277);
const v278 = await readJson(paths.v278);
const v279 = await readJson(paths.v279);
const focusedNegativePath = "dist/science/v280-focused-negative-evidence.json";
const focusedNegative = await readJson(focusedNegativePath);
const capabilities = {
  v276: { state: v276 ? "implemented-awaiting-qualification" : "incomplete", evidence: paths.v276 },
  v277: { state: v277 ? "implemented-awaiting-qualification" : "incomplete", evidence: paths.v277 },
  v278: { state: v278 ? "implemented-awaiting-qualification" : "incomplete", evidence: paths.v278 },
  v279: { state: v279?.status === "complete" ? "implemented-awaiting-qualification" : "incomplete", evidence: paths.v279 },
  v280: { state: focusedNegative ? "blocked" : "implemented-awaiting-qualification", evidence: "dist/science/unified-relativity-workbench-v280-shadow-evidence.json", reason: focusedNegative?.status ?? null },
};
const sourceHashes = Object.fromEntries(await Promise.all(sourceFiles.map(async (file) => [file, await hashFile(file)])));
const unsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v280",
  generatedAt,
  status: "partial-local-shadow-formal-product-v263-retained",
  formalProductPointer: formalPointerPath,
  formalProductPointerSha256: await hashFile(formalPointerPath),
  formalProductPointerAdvanced: false,
  localShadowPromotionApplied: false,
  publicDeploymentBlocked: true,
  validation: { focused: focusedNegative ? { status: "failed", evidence: focusedNegativePath } : { status: "not-run" }, heavyQualificationStarted: false },
  capabilities,
  sourceHashes,
  visualProfiles: { formalDefault: "legacy-v9", localShadowCandidate: "science-cinematic-v4-v280", localShadowDefaultApplied: false },
  science: {
    status: "science-failed-shadow-retained", defaultKernel: "legacy-eih-1pn",
    codeSha256: "0debb41b96f001f92f498ef6a36ceff77ede7f0dd2bdbe3c6e9db3dfbf6090a8",
    screenSha256: "08f42a50bc787df62dc018ee56b5f7b58065dcafe2e2a3703e3e67f3e6d94037",
    workerPhysicsMutation: "not-applied", eihOnePnMutation: "not-applied", kerrMutation: "not-applied",
  },
  contracts: { singleCanvas: true, sceneRevisionSemanticsChanged: false, legacyRootAttributes: 603, evidenceLedgerClaims: 84 },
  boundaries: {
    v276: "offline-reference-only", v277: "corrected-kerr-test-particle-zamo-not-grmhd",
    v278: "science-payload-separated-from-cinematic-decoration", v279: "cpu-authority-optional-webgpu-no-partial-aggregate",
    v280: "read-only-artifacts-bounded-preview-no-arbitrary-code",
  },
};
const pointer = { ...unsigned, pointerSha256: shaJson(unsigned) };
await mkdir(resolve(root, "dist/release"), { recursive: true });
await writeFile(resolve(root, "dist/release/orbit-atlas-current-local-shadow-candidate-v280.json"), `${JSON.stringify(pointer, null, 2)}\n`, "utf8");
const evidence = { version: "v280-unified-workbench-shadow-evidence-v1", generatedAt, status: pointer.status, pointerSha256: pointer.pointerSha256, capabilities, sourceHashes, formalProductPointer: "v263", formalProductPointerAdvanced: false, localShadowPromotionApplied: false, publicDeploymentBlocked: true };
await mkdir(resolve(root, "dist/science"), { recursive: true });
await writeFile(resolve(root, "dist/science/unified-relativity-workbench-v280-shadow-evidence.json"), `${JSON.stringify({ ...evidence, evidenceSha256: shaJson(evidence) }, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v280.json", status: pointer.status, capabilities }, null, 2));
