import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const node = process.execPath;
const python = process.platform === "win32" ? "python" : "python3";
const run = (label, command, args) => { const result = spawnSync(command, args, { cwd: root, stdio: "inherit", shell: false }); if (result.error) throw result.error; if (result.status !== 0) throw new Error(`${label} failed with ${result.status}`); };
run("v388-python-oracle", python, ["scripts/run-kerr-geometry-conditioned-temperature-oracle-v388.py"]);
run("v388-temperature", node, [resolve(root, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-geometry-conditioned-temperature-v388.ts"]);
run("v387-evidence-reseal", node, ["scripts/build-shadow-candidate-v387.mjs"]);
run("v388-evidence", node, ["scripts/build-shadow-candidate-v388.mjs"]);
const firstEvidenceSha256 = JSON.parse(readFileSync(resolve(root, "dist/science/orbit-atlas-shadow-v388-evidence.json"), "utf8")).evidenceSha256;
run("v388-tests", node, [
  resolve(root, "node_modules/vitest/vitest.mjs"), "run",
  "app/lib/kerrGeometryConditionedTemperatureV388.test.ts",
  "app/lib/kerrGeometryConditionedTemperatureServerV388.test.ts",
  "app/api/atlas/relativity-evidence/v388/conditioned-temperature/route.test.ts",
  "app/components/KerrGeometryConditionedTemperatureSurfaceV388.test.tsx",
  "app/lib/atlasShadowCapabilityPointerV388.test.ts",
  "app/components/KerrPhotonIdentifiabilitySurfaceV387.test.tsx",
]);
run("v388-types", node, [resolve(root, "node_modules/typescript/bin/tsc"), "--noEmit"]);
run("v388-evidence-determinism", node, ["scripts/build-shadow-candidate-v388.mjs"]);

const artifact = JSON.parse(readFileSync(resolve(root, "dist/science/kerr-geometry-conditioned-temperature-v388/temperature-replay.json"), "utf8"));
const evidence = JSON.parse(readFileSync(resolve(root, "dist/science/orbit-atlas-shadow-v388-evidence.json"), "utf8"));
const pointer = JSON.parse(readFileSync(resolve(root, "dist/release/orbit-atlas-current-local-shadow-candidate-v388.json"), "utf8"));
const state = JSON.parse(readFileSync(resolve(root, "dist/science/kerr-campaign-v314/campaign-state.json"), "utf8"));
const formal = JSON.parse(readFileSync(resolve(root, "dist/release/orbit-atlas-current-product-evidence-v263.json"), "utf8"));
const forbidden = ["dist/staging/measured-authority-v382-visible/manifest.json", "dist/science/measured-expectation-v375/envelope.json", "dist/science/expected-electron-image-v376/image.json", "dist/science/expected-electron-image-v376/image.csv"];
if (
  evidence.evidenceSha256 !== firstEvidenceSha256
  || artifact.rows?.length !== 12
  || artifact.identifiability?.spectralOnlyRank !== 1
  || artifact.identifiability?.geometryConditionedRank !== 2
  || artifact.maxima?.temperatureReplayRelativeDifference >= 2e-6
  || artifact.maxima?.knownNumericalUpperBoundRelative >= 2e-6
  || artifact.maxima?.pythonOracleRelativeDifference >= 2e-7
  || artifact.uncertainty?.combinationPolicy !== "linear-sum-no-independence-proof-no-rss"
  || artifact.uncertainty?.knownNumericalIntervalIsConfidenceInterval !== false
  || artifact.uncertainty?.geometryPhysicalModelSystematicAvailable !== false
  || artifact.uncertainty?.diskPhysicalModelSystematicAvailable !== false
  || artifact.uncertainty?.detectorCalibrationCovarianceAvailable !== false
  || artifact.uncertainty?.absoluteTemperatureUncertaintyQualified !== false
  || artifact.uncertainty?.numericalPlaceholderUsed !== false
  || artifact.qualification?.absoluteTemperatureAuthorityGranted !== false
  || artifact.qualification?.measuredAuthorityGranted !== false
  || artifact.qualification?.observedCountsAvailable !== false
  || artifact.qualification?.scienceImageAvailable !== false
  || evidence.uncertaintyBoundary?.sciencePayloadMutationAllowed !== false
  || evidence.uncertaintyBoundary?.cinematicConsumerAllowed !== false
  || pointer.capabilities?.v388AbsoluteTemperatureAuthority !== "not-qualified"
  || pointer.localShadowDefaultApplied !== false
  || forbidden.some((path) => existsSync(resolve(root, path)))
  || state.status !== "incomplete-0-of-49" || state.completedShardCount !== 0
  || state.attemptConsumed !== false || state.aggregateAvailable !== false
  || formal.version !== "v263-current-product-evidence-pointer"
  || evidence.browserQualification !== "not-run"
) throw new Error("v388 fail-closed validation failed");
const transientPattern = /[A-Za-z]:\\|"(?:pid|processId|hostname|hostName|absolutePath)"\s*:/;
if (transientPattern.test(JSON.stringify(evidence)) || transientPattern.test(JSON.stringify(pointer))) throw new Error("v388 transient evidence leak");
console.log(JSON.stringify({
  status: "passed-v388-low-memory",
  evidenceSha256: evidence.evidenceSha256,
  pointerSha256: pointer.pointerSha256,
  inversions: artifact.counts.inversionCount,
  spectralOnlyRank: artifact.identifiability.spectralOnlyRank,
  geometryConditionedRank: artifact.identifiability.geometryConditionedRank,
  maximumTemperatureReplayRelativeDifference: artifact.maxima.temperatureReplayRelativeDifference,
  maximumKnownNumericalUpperBoundRelative: artifact.maxima.knownNumericalUpperBoundRelative,
  maximumPythonOracleRelativeDifference: artifact.maxima.pythonOracleRelativeDifference,
  absoluteTemperatureAuthorityGranted: false,
  dense: pointer.capabilities.v314CorrectedDense,
  browser: evidence.browserQualification,
}, null, 2));
