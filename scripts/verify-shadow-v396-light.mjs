import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const node = process.execPath;
const python = process.platform === "win32" ? "python" : "python3";
const run = (label, command, args) => {
  const result = spawnSync(command, args, { cwd: root, stdio: "inherit", shell: false });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${label} failed with ${result.status}`);
};
run("v396-python-oracle", python, ["scripts/run-kerr-auxiliary-constraint-oracle-v396.py"]);
run("v396-design", node, [resolve(root, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-auxiliary-constraint-design-v396.ts"]);
run("v396-tests", node, [resolve(root, "node_modules/vitest/vitest.mjs"), "run",
  "app/lib/kerrAuxiliaryConstraintDesignV396.test.ts",
  "app/lib/kerrAuxiliaryConstraintDesignServerV396.test.ts",
  "app/api/atlas/relativity-evidence/v396/constraint-design/route.test.ts",
  "app/components/KerrConstraintForgeV396.test.tsx",
  "app/lib/atlasShadowCapabilityPointerV396.test.ts"]);
run("v396-types", node, [resolve(root, "node_modules/typescript/bin/tsc"), "--noEmit"]);
run("v396-eslint", node, [resolve(root, "node_modules/eslint/bin/eslint.js"),
  "app/lib/kerrAuxiliaryConstraintDesignV396.ts", "app/lib/kerrAuxiliaryConstraintDesignV396.test.ts",
  "app/lib/kerrAuxiliaryConstraintDesignServerV396.ts", "app/lib/kerrAuxiliaryConstraintDesignServerV396.test.ts",
  "app/api/atlas/relativity-evidence/v396/constraint-design/route.ts", "app/api/atlas/relativity-evidence/v396/constraint-design/route.test.ts",
  "app/components/KerrConstraintForgeV396.tsx", "app/components/KerrConstraintForgeV396.test.tsx",
  "app/lib/atlasShadowCapabilityPointerV396.ts", "app/lib/atlasShadowCapabilityPointerV396.test.ts",
  "app/components/RelativityResearchWorkbenchV280.tsx", "scripts/build-kerr-auxiliary-constraint-design-v396.ts",
  "scripts/build-shadow-candidate-v396.mjs", "scripts/reseal-shadow-evidence-chain-v396.mjs", "scripts/verify-shadow-v396-light.mjs"]);
run("v396-evidence", node, ["scripts/build-shadow-candidate-v396.mjs"]);

const artifact = JSON.parse(readFileSync(resolve(root, "dist/science/kerr-auxiliary-constraint-design-v396/constraint-design.json"), "utf8"));
const evidence = JSON.parse(readFileSync(resolve(root, "dist/science/orbit-atlas-shadow-v396-evidence.json"), "utf8"));
const pointer = JSON.parse(readFileSync(resolve(root, "dist/release/orbit-atlas-current-local-shadow-candidate-v396.json"), "utf8"));
const state = JSON.parse(readFileSync(resolve(root, "dist/science/kerr-campaign-v314/campaign-state.json"), "utf8"));
const formal = JSON.parse(readFileSync(resolve(root, "dist/release/orbit-atlas-current-product-evidence-v263.json"), "utf8"));
const formalEvidence = JSON.parse(readFileSync(resolve(root, formal.source), "utf8"));
if (
  artifact.design?.evaluationCount !== 60 || artifact.design?.minimumConstraintsForFullRank !== 12
  || artifact.design?.fullRank !== 36 || artifact.design?.maximumQualifiedStructuralConditionNumber >= 8
  || artifact.residuals?.maximumPythonOracleRelativeDifference >= 2e-12
  || artifact.productionAdmission?.instrumentResponseAvailable !== false
  || artifact.productionAdmission?.structuralCandidatePromotedToRecommendation !== false
  || pointer.capabilities?.v396InstrumentFeasibility !== "unavailable"
  || pointer.capabilities?.v396PhysicalRecommendation !== "forbidden"
  || pointer.localShadowDefaultApplied !== false
  || state.status !== "incomplete-0-of-49" || state.completedShardCount !== 0
  || state.attemptConsumed !== false || state.aggregateAvailable !== false
  || formal.version !== "v263-current-product-evidence-pointer"
  || formalEvidence.science?.defaultKernel !== "legacy-eih-1pn"
  || formalEvidence.contracts?.workerPhysicsMutation !== "not-applied"
  || formalEvidence.contracts?.eihOnePnMutation !== "not-applied"
  || formalEvidence.contracts?.singleCanvas !== true
  || formalEvidence.contracts?.legacyRootAttributes !== 603
  || formalEvidence.contracts?.evidenceLedgerClaims !== 84
  || evidence.browserQualification !== "not-run"
) throw new Error("v396 fail-closed validation failed");
const transientPattern = /[A-Za-z]:\\|"(?:pid|processId|hostname|hostName|absolutePath)"\s*:/;
if (transientPattern.test(JSON.stringify(evidence)) || transientPattern.test(JSON.stringify(pointer))) throw new Error("v396 transient evidence leak");
for (const entry of evidence.sourceManifest ?? []) {
  const actual = createHash("sha256").update(readFileSync(resolve(root, entry.path))).digest("hex");
  if (actual !== entry.sha256) throw new Error(`v396 source manifest mismatch: ${entry.path}`);
}
console.log(JSON.stringify({
  status: "passed-v396-low-memory",
  artifactSha256: artifact.artifactSha256,
  evidenceSha256: evidence.evidenceSha256,
  pointerSha256: pointer.pointerSha256,
  evaluations: artifact.design.evaluationCount,
  fullRank: artifact.design.fullRank,
  instrumentFeasibility: artifact.qualification.instrumentFeasibilityQualified,
  dense: pointer.capabilities.v314CorrectedDense,
  browser: evidence.browserQualification,
}, null, 2));
