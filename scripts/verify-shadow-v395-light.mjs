import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
const root = process.cwd(); const node = process.execPath; const python = process.platform === "win32" ? "python" : "python3";
const run = (label, command, args) => { const result = spawnSync(command, args, { cwd: root, stdio: "inherit", shell: false }); if (result.error) throw result.error; if (result.status !== 0) throw new Error(`${label} failed with ${result.status}`); };
run("v395-python-oracle", python, ["scripts/run-kerr-global-observability-oracle-v395.py"]);
run("v395-observability", node, [resolve(root, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-global-observability-v395.ts"]);
run("v395-chain-reseal", node, ["scripts/reseal-shadow-evidence-chain-v395.mjs"]);
const firstEvidenceSha256 = JSON.parse(readFileSync(resolve(root, "dist/science/orbit-atlas-shadow-v395-evidence.json"), "utf8")).evidenceSha256;
run("v395-tests", node, [resolve(root, "node_modules/vitest/vitest.mjs"), "run",
  "app/lib/kerrGlobalObservabilityV395.test.ts", "app/lib/kerrGlobalObservabilityServerV395.test.ts",
  "app/api/atlas/relativity-evidence/v395/observability/route.test.ts", "app/components/KerrNullspaceObservatoryV395.test.tsx",
  "app/lib/atlasShadowCapabilityPointerV395.test.ts"]);
run("v395-types", node, [resolve(root, "node_modules/typescript/bin/tsc"), "--noEmit"]);
run("v395-eslint", node, [resolve(root, "node_modules/eslint/bin/eslint.js"),
  "app/lib/kerrGlobalObservabilityV395.ts", "app/lib/kerrGlobalObservabilityV395.test.ts",
  "app/lib/kerrGlobalObservabilityServerV395.ts", "app/lib/kerrGlobalObservabilityServerV395.test.ts",
  "app/api/atlas/relativity-evidence/v395/observability/route.ts", "app/api/atlas/relativity-evidence/v395/observability/route.test.ts",
  "app/components/KerrNullspaceObservatoryV395.tsx", "app/components/KerrNullspaceObservatoryV395.test.tsx",
  "app/lib/atlasShadowCapabilityPointerV395.ts", "app/lib/atlasShadowCapabilityPointerV395.test.ts",
  "scripts/build-kerr-global-observability-v395.ts", "scripts/build-shadow-candidate-v395.mjs",
  "scripts/reseal-shadow-evidence-chain-v395.mjs", "scripts/verify-shadow-v395-light.mjs"]);
run("v395-evidence-determinism", node, ["scripts/build-shadow-candidate-v395.mjs"]);

const artifact = JSON.parse(readFileSync(resolve(root, "dist/science/kerr-global-observability-v395/observability.json"), "utf8"));
const evidence = JSON.parse(readFileSync(resolve(root, "dist/science/orbit-atlas-shadow-v395-evidence.json"), "utf8"));
const pointer = JSON.parse(readFileSync(resolve(root, "dist/release/orbit-atlas-current-local-shadow-candidate-v395.json"), "utf8"));
const state = JSON.parse(readFileSync(resolve(root, "dist/science/kerr-campaign-v314/campaign-state.json"), "utf8"));
const formal = JSON.parse(readFileSync(resolve(root, "dist/release/orbit-atlas-current-product-evidence-v263.json"), "utf8"));
const formalEvidence = JSON.parse(readFileSync(resolve(root, formal.source), "utf8"));
const forbidden = ["dist/staging/measured-authority-v382-visible/manifest.json", "dist/science/measured-expectation-v375/envelope.json", "dist/science/expected-electron-image-v376/image.json", "dist/science/expected-electron-image-v376/image.csv"];
if (
  evidence.evidenceSha256 !== firstEvidenceSha256 || artifact.dimensions?.rank !== 24 || artifact.dimensions?.nullity !== 12
  || artifact.validator?.rejectedAdversarialFixtureCount !== 8
  || Math.max(...Object.values(artifact.residuals ?? {})) >= 2e-12
  || artifact.productionAdmission?.physicalNuisanceModesAvailable !== false
  || artifact.productionAdmission?.physicalModeAttributionExecuted !== false
  || artifact.productionAdmission?.nullspacePriorAssigned !== false
  || artifact.productionAdmission?.unobservableDirectionsTreatedAsZero !== false
  || artifact.productionAdmission?.probabilityContentAssigned !== false
  || pointer.capabilities?.v395JacobianRank !== "qualified-rank-24"
  || pointer.capabilities?.v395Nullspace !== "qualified-nullity-12"
  || pointer.capabilities?.v395PhysicalModeAttribution !== "unavailable"
  || pointer.localShadowDefaultApplied !== false || forbidden.some((path) => existsSync(resolve(root, path)))
  || state.status !== "incomplete-0-of-49" || state.completedShardCount !== 0 || state.attemptConsumed !== false || state.aggregateAvailable !== false
  || formal.version !== "v263-current-product-evidence-pointer" || formalEvidence.science?.defaultKernel !== "legacy-eih-1pn"
  || formalEvidence.contracts?.workerPhysicsMutation !== "not-applied" || formalEvidence.contracts?.eihOnePnMutation !== "not-applied"
  || formalEvidence.contracts?.singleCanvas !== true || formalEvidence.contracts?.legacyRootAttributes !== 603
  || formalEvidence.contracts?.evidenceLedgerClaims !== 84 || evidence.browserQualification !== "not-run"
) throw new Error("v395 fail-closed validation failed");
const transientPattern = /[A-Za-z]:\\|"(?:pid|processId|hostname|hostName|absolutePath)"\s*:/;
if (transientPattern.test(JSON.stringify(evidence)) || transientPattern.test(JSON.stringify(pointer))) throw new Error("v395 transient evidence leak");
for (const entry of evidence.sourceManifest ?? []) {
  const actual = createHash("sha256").update(readFileSync(resolve(root, entry.path))).digest("hex");
  if (actual !== entry.sha256) throw new Error(`v395 source manifest mismatch: ${entry.path}`);
}
console.log(JSON.stringify({ status: "passed-v395-low-memory", artifactSha256: artifact.artifactSha256, evidenceSha256: evidence.evidenceSha256, pointerSha256: pointer.pointerSha256, rank: 24, nullity: 12, maximumResidual: Math.max(...Object.values(artifact.residuals)), physicalNuisanceModesAvailable: false, physicalModeAttributionExecuted: false, dense: pointer.capabilities.v314CorrectedDense, browser: evidence.browserQualification }, null, 2));
