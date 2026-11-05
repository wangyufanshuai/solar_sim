import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const node = process.execPath;
const python = process.platform === "win32" ? "python" : "python3";
const run = (label, command, args) => { const result = spawnSync(command, args, { cwd: root, stdio: "inherit", shell: false }); if (result.error) throw result.error; if (result.status !== 0) throw new Error(`${label} failed with ${result.status}`); };

run("v391-python-oracle", python, ["scripts/run-kerr-temperature-trust-region-oracle-v391.py"]);
run("v391-trust-region", node, [resolve(root, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-temperature-trust-region-v391.ts"]);
run("v390-evidence-reseal", node, ["scripts/build-shadow-candidate-v390.mjs"]);
run("v391-evidence", node, ["scripts/build-shadow-candidate-v391.mjs"]);
const firstEvidenceSha256 = JSON.parse(readFileSync(resolve(root, "dist/science/orbit-atlas-shadow-v391-evidence.json"), "utf8")).evidenceSha256;
run("v391-tests", node, [
  resolve(root, "node_modules/vitest/vitest.mjs"), "run",
  "app/lib/kerrTemperatureTrustRegionV391.test.ts",
  "app/lib/kerrTemperatureTrustRegionServerV391.test.ts",
  "app/api/atlas/relativity-evidence/v391/trust-region/route.test.ts",
  "app/components/KerrTemperatureCurvatureRelayV391.test.tsx",
  "app/lib/atlasShadowCapabilityPointerV391.test.ts",
]);
run("v391-types", node, [resolve(root, "node_modules/typescript/bin/tsc"), "--noEmit"]);
run("v391-eslint", node, [
  resolve(root, "node_modules/eslint/bin/eslint.js"),
  "app/lib/kerrTemperatureTrustRegionV391.ts",
  "app/lib/kerrTemperatureTrustRegionV391.test.ts",
  "app/lib/kerrTemperatureTrustRegionServerV391.ts",
  "app/lib/kerrTemperatureTrustRegionServerV391.test.ts",
  "app/api/atlas/relativity-evidence/v391/trust-region/route.ts",
  "app/api/atlas/relativity-evidence/v391/trust-region/route.test.ts",
  "app/components/KerrTemperatureCurvatureRelayV391.tsx",
  "app/components/KerrTemperatureCurvatureRelayV391.test.tsx",
  "app/lib/atlasShadowCapabilityPointerV391.ts",
  "app/lib/atlasShadowCapabilityPointerV391.test.ts",
  "scripts/build-kerr-temperature-trust-region-v391.ts",
  "scripts/build-shadow-candidate-v391.mjs",
  "scripts/verify-shadow-v391-light.mjs",
]);
run("v391-evidence-determinism", node, ["scripts/build-shadow-candidate-v391.mjs"]);

const artifact = JSON.parse(readFileSync(resolve(root, "dist/science/kerr-temperature-trust-region-v391/trust-region.json"), "utf8"));
const evidence = JSON.parse(readFileSync(resolve(root, "dist/science/orbit-atlas-shadow-v391-evidence.json"), "utf8"));
const pointer = JSON.parse(readFileSync(resolve(root, "dist/release/orbit-atlas-current-local-shadow-candidate-v391.json"), "utf8"));
const state = JSON.parse(readFileSync(resolve(root, "dist/science/kerr-campaign-v314/campaign-state.json"), "utf8"));
const formal = JSON.parse(readFileSync(resolve(root, "dist/release/orbit-atlas-current-product-evidence-v263.json"), "utf8"));
const formalEvidence = JSON.parse(readFileSync(resolve(root, formal.source), "utf8"));
const forbidden = ["dist/staging/measured-authority-v382-visible/manifest.json", "dist/science/measured-expectation-v375/envelope.json", "dist/science/expected-electron-image-v376/image.json", "dist/science/expected-electron-image-v376/image.csv"];
if (
  evidence.evidenceSha256 !== firstEvidenceSha256
  || artifact.rows?.length !== 12
  || artifact.counts?.axisReplayCount !== 216
  || artifact.counts?.mixedCornerReplayCount !== 864
  || artifact.minima?.linearTrustRadius < 0.003
  || artifact.minima?.quadraticTrustRadius < 0.01
  || artifact.maxima?.quadraticAbsoluteLogResidual >= 2e-8
  || artifact.maxima?.inversionRelativeResidual >= 2e-10
  || artifact.maxima?.pythonOracleRelativeDifference >= 2e-7
  || artifact.method?.stressGridIsPhysicalUncertainty !== false
  || artifact.method?.stressGridProbabilityContent !== false
  || artifact.qualification?.physicalSystematicVectorAdmitted !== false
  || artifact.qualification?.covarianceProjectionExecuted !== false
  || artifact.qualification?.absoluteScientificIntervalQualified !== false
  || artifact.qualification?.absoluteTemperatureAuthorityGranted !== false
  || artifact.qualification?.measuredAuthorityGranted !== false
  || evidence.authorityBoundary?.sciencePayloadMutationAllowed !== false
  || evidence.authorityBoundary?.cinematicConsumerAllowed !== false
  || pointer.capabilities?.v391AnalyticCurvature !== "qualified-12-hessians"
  || pointer.capabilities?.v391StressGridSemantics !== "validation-only-nonphysical-no-probability"
  || pointer.capabilities?.v391AbsoluteScientificInterval !== "not-qualified"
  || pointer.localShadowDefaultApplied !== false
  || forbidden.some((path) => existsSync(resolve(root, path)))
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
) throw new Error("v391 fail-closed validation failed");
const transientPattern = /[A-Za-z]:\\|"(?:pid|processId|hostname|hostName|absolutePath)"\s*:/;
if (transientPattern.test(JSON.stringify(evidence)) || transientPattern.test(JSON.stringify(pointer))) throw new Error("v391 transient evidence leak");
console.log(JSON.stringify({
  status: "passed-v391-low-memory",
  evidenceSha256: evidence.evidenceSha256,
  pointerSha256: pointer.pointerSha256,
  axisReplayCount: artifact.counts.axisReplayCount,
  mixedCornerReplayCount: artifact.counts.mixedCornerReplayCount,
  minimumLinearTrustRadius: artifact.minima.linearTrustRadius,
  minimumQuadraticTrustRadius: artifact.minima.quadraticTrustRadius,
  maximumLinearAbsoluteLogResidual: artifact.maxima.linearAbsoluteLogResidual,
  maximumQuadraticAbsoluteLogResidual: artifact.maxima.quadraticAbsoluteLogResidual,
  maximumPythonOracleRelativeDifference: artifact.maxima.pythonOracleRelativeDifference,
  stressGridIsPhysicalUncertainty: false,
  absoluteScientificIntervalQualified: false,
  dense: pointer.capabilities.v314CorrectedDense,
  browser: evidence.browserQualification,
}, null, 2));
