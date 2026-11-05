import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const node = process.execPath;
const python = process.platform === "win32" ? "python" : "python3";
const run = (label, command, args) => { const result = spawnSync(command, args, { cwd: root, stdio: "inherit", shell: false }); if (result.error) throw result.error; if (result.status !== 0) throw new Error(`${label} failed with ${result.status}`); };
run("v397-python-oracle", python, ["scripts/run-kerr-physical-observation-admission-oracle-v397.py"]);
run("v397-admission", node, [resolve(root, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-physical-observation-admission-v397.ts"]);
run("v397-tests", node, [resolve(root, "node_modules/vitest/vitest.mjs"), "run", "app/lib/kerrPhysicalObservationAdmissionV397.test.ts", "app/lib/kerrPhysicalObservationAdmissionServerV397.test.ts", "app/api/atlas/relativity-evidence/v397/observation-admission/route.test.ts", "app/components/KerrObservationAirlockV397.test.tsx", "app/lib/atlasShadowCapabilityPointerV397.test.ts"]);
run("v397-types", node, [resolve(root, "node_modules/typescript/bin/tsc"), "--noEmit"]);
run("v397-eslint", node, [resolve(root, "node_modules/eslint/bin/eslint.js"), "app/lib/kerrPhysicalObservationAdmissionV397.ts", "app/lib/kerrPhysicalObservationAdmissionV397.test.ts", "app/lib/kerrPhysicalObservationAdmissionServerV397.ts", "app/lib/kerrPhysicalObservationAdmissionServerV397.test.ts", "app/api/atlas/relativity-evidence/v397/observation-admission/route.ts", "app/api/atlas/relativity-evidence/v397/observation-admission/route.test.ts", "app/components/KerrObservationAirlockV397.tsx", "app/components/KerrObservationAirlockV397.test.tsx", "app/lib/atlasShadowCapabilityPointerV397.ts", "app/lib/atlasShadowCapabilityPointerV397.test.ts", "app/components/RelativityResearchWorkbenchV280.tsx", "scripts/build-kerr-physical-observation-admission-v397.ts", "scripts/build-shadow-candidate-v397.mjs", "scripts/reseal-shadow-evidence-chain-v397.mjs", "scripts/verify-shadow-v397-light.mjs"]);
run("v397-chain-reseal", node, ["scripts/reseal-shadow-evidence-chain-v397.mjs"]);

const artifact = JSON.parse(readFileSync(resolve(root, "dist/science/kerr-physical-observation-admission-v397/observation-admission.json"), "utf8"));
const evidence = JSON.parse(readFileSync(resolve(root, "dist/science/orbit-atlas-shadow-v397-evidence.json"), "utf8"));
const pointer = JSON.parse(readFileSync(resolve(root, "dist/release/orbit-atlas-current-local-shadow-candidate-v397.json"), "utf8"));
const state = JSON.parse(readFileSync(resolve(root, "dist/science/kerr-campaign-v314/campaign-state.json"), "utf8"));
const formal = JSON.parse(readFileSync(resolve(root, "dist/release/orbit-atlas-current-product-evidence-v263.json"), "utf8"));
const formalEvidence = JSON.parse(readFileSync(resolve(root, formal.source), "utf8"));
if (artifact.validator?.rejectedAdversarialFixtureCount !== 9 || artifact.selfTest?.maximumPythonOracleRelativeDifference >= 2e-12 || artifact.productionAdmission?.physicalObservationPackAvailable !== false || artifact.productionAdmission?.availableSources !== 0 || artifact.productionAdmission?.availableCrossLinks !== 0 || artifact.productionAdmission?.sourceLicenseVerified !== false || artifact.productionAdmission?.physicalConstraintSelectionExecuted !== false || artifact.qualification?.measuredAuthorityGranted !== false || pointer.capabilities?.v397PhysicalObservationPack !== "unavailable" || pointer.capabilities?.v397MeasuredAuthority !== "not-granted" || pointer.localShadowDefaultApplied !== false || state.status !== "incomplete-0-of-49" || state.completedShardCount !== 0 || state.attemptConsumed !== false || state.aggregateAvailable !== false || formal.version !== "v263-current-product-evidence-pointer" || formalEvidence.science?.defaultKernel !== "legacy-eih-1pn" || formalEvidence.contracts?.workerPhysicsMutation !== "not-applied" || formalEvidence.contracts?.eihOnePnMutation !== "not-applied" || formalEvidence.contracts?.singleCanvas !== true || formalEvidence.contracts?.legacyRootAttributes !== 603 || formalEvidence.contracts?.evidenceLedgerClaims !== 84 || evidence.browserQualification !== "not-run") throw new Error("v397 fail-closed validation failed");
const transientPattern = /[A-Za-z]:\\|"(?:pid|processId|hostname|hostName|absolutePath)"\s*:/;
if (transientPattern.test(JSON.stringify(evidence)) || transientPattern.test(JSON.stringify(pointer))) throw new Error("v397 transient evidence leak");
for (const entry of evidence.sourceManifest ?? []) { const actual = createHash("sha256").update(readFileSync(resolve(root, entry.path))).digest("hex"); if (actual !== entry.sha256) throw new Error(`v397 source manifest mismatch: ${entry.path}`); }
console.log(JSON.stringify({ status: "passed-v397-low-memory", artifactSha256: artifact.artifactSha256, evidenceSha256: evidence.evidenceSha256, pointerSha256: pointer.pointerSha256, admissionContract: pointer.capabilities.v397ObservationAdmissionContract, physicalPack: pointer.capabilities.v397PhysicalObservationPack, measuredAuthority: pointer.capabilities.v397MeasuredAuthority, dense: pointer.capabilities.v314CorrectedDense, browser: evidence.browserQualification }, null, 2));
