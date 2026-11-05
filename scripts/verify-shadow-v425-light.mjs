import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd(), node = process.execPath;
const run = (label, command, args) => { const result = spawnSync(command, args, { cwd: root, stdio: "inherit", shell: false }); if (result.error) throw result.error; if (result.status !== 0) throw new Error(`${label} failed with ${result.status}`); };
const read = (path) => JSON.parse(readFileSync(resolve(root, path), "utf8"));
const fileSha = (path) => createHash("sha256").update(readFileSync(resolve(root, path))).digest("hex");
const transient = new Set(["generatedAt", "artifactSha256", "evidenceSha256", "pointerSha256"]);
const canonicalize = (value) => Array.isArray(value) ? value.map(canonicalize) : !value || typeof value !== "object" ? value : Object.fromEntries(Object.entries(value).filter(([key]) => !transient.has(key)).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, canonicalize(entry)]));
const canonicalSha = (value) => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
const tests = [
  "app/lib/kerrInstrumentSpectralAdmissionV425.test.ts", "app/lib/kerrInstrumentSpectralAdmissionServerV425.test.ts", "app/lib/kerrInstrumentSpectralAdmissionClientV425.test.ts",
  "app/api/atlas/relativity-evidence/v425/spectral-admission/route.test.ts", "app/components/KerrInstrumentSpectralAdmissionV425.test.tsx", "app/lib/atlasShadowCapabilityPointerV425.test.ts",
];
const lint = [
  "app/lib/kerrInstrumentSpectralAdmissionV425.ts", "app/lib/kerrInstrumentSpectralAdmissionV425.test.ts",
  "app/lib/kerrInstrumentSpectralAdmissionServerV425.ts", "app/lib/kerrInstrumentSpectralAdmissionServerV425.test.ts",
  "app/lib/kerrInstrumentSpectralAdmissionClientV425.ts", "app/lib/kerrInstrumentSpectralAdmissionClientV425.test.ts",
  "app/lib/atlasShadowCapabilityPointerV425.ts", "app/lib/atlasShadowCapabilityPointerV425.test.ts",
  "app/api/atlas/relativity-evidence/v425/spectral-admission/route.ts", "app/api/atlas/relativity-evidence/v425/spectral-admission/route.test.ts",
  "app/components/KerrInstrumentSpectralAdmissionV425.tsx", "app/components/KerrInstrumentSpectralAdmissionV425.test.tsx", "app/components/KerrEvidenceObservatoryV405.tsx",
  "scripts/build-kerr-instrument-spectral-admission-v425.ts", "scripts/build-kerr-instrument-spectral-admission-chain-v425.mjs", "scripts/build-shadow-candidate-v425.mjs", "scripts/reseal-shadow-evidence-chain-v425.mjs", "scripts/verify-shadow-v425-light.mjs", "scripts/atlas.mjs",
];
const reproducible = [
  "dist/science/kerr-instrument-spectral-admission-v425/python-spectral-admission-oracle.json", "dist/science/kerr-instrument-spectral-admission-v425/spectral-admission.json", "dist/science/kerr-instrument-spectral-admission-v425/spectral-admission.csv", "dist/science/kerr-instrument-spectral-admission-v425/spectral-admission-table.fits", "dist/science/kerr-instrument-spectral-admission-v425/spectral-domain-diagnostic.png", "dist/science/kerr-instrument-spectral-admission-v425/export-manifest.json", "dist/science/orbit-atlas-shadow-v425-evidence.json", "dist/release/orbit-atlas-current-local-shadow-candidate-v425.json",
];
run("v425 first reseal", node, ["scripts/reseal-shadow-evidence-chain-v425.mjs"]);
const firstSeal = Object.fromEntries(reproducible.map((path) => [path, fileSha(path)]));
run("v425 Python spectral applicability verification", "python", ["scripts/test-kerr-instrument-spectral-admission-v425.py"]);
run("v425 tests", node, [resolve(root, "node_modules/vitest/vitest.mjs"), "run", ...tests]);
run("v425 types", node, [resolve(root, "node_modules/typescript/bin/tsc"), "--noEmit"]);
run("v425 eslint", node, [resolve(root, "node_modules/eslint/bin/eslint.js"), ...lint, "--max-warnings=0"]);
run("v425 final reseal", node, ["scripts/reseal-shadow-evidence-chain-v425.mjs"]);
const secondSeal = Object.fromEntries(reproducible.map((path) => [path, fileSha(path)]));
if (JSON.stringify(firstSeal) !== JSON.stringify(secondSeal)) throw new Error("v425 reseal reproducibility failed");

const artifactPath = "dist/science/kerr-instrument-spectral-admission-v425/spectral-admission.json", evidencePath = "dist/science/orbit-atlas-shadow-v425-evidence.json", pointerPath = "dist/release/orbit-atlas-current-local-shadow-candidate-v425.json";
const artifact = read(artifactPath), evidence = read(evidencePath), pointer = read(pointerPath), state = read("dist/science/kerr-campaign-v314/campaign-state.json"), formal = read("dist/release/orbit-atlas-current-product-evidence-v263.json"), formalEvidence = read(formal.source), view = artifact.view;
if (
  canonicalSha(artifact) !== artifact.artifactSha256 || canonicalSha(evidence) !== evidence.evidenceSha256 || canonicalSha(pointer) !== pointer.pointerSha256 ||
  fileSha("dist/science/kerr-predicted-polarimeter-v424/predicted-ideal-dual-beam.json") !== "ee46fa0819b9f41e30b4dd053d069c99783a50cb0afcdb2b34e095daa1b5e024" ||
  fileSha("dist/science/kerr-polarimeter-calibration-v411/inspect.json") !== "5bd1831f70860125fb1e841f801566e0c92517cf7d9d6ad7748ad5812f4e2a31" ||
  fileSha("dist/science/kerr-polarimeter-spectral-response-v413/spectral-response.json") !== "d8972aa256d4ee1818ad3e4075e27c09e20a37c738e0853fa4a44068146e1413" ||
  fileSha("dist/science/orbit-atlas-shadow-v424-evidence.json") !== "4c6e7f2d9efdbef994422d963f96dbccad4fe1599fc7a7ed7d3512a47d06889b" ||
  fileSha("dist/release/orbit-atlas-current-local-shadow-candidate-v424.json") !== "ec7854079f9bfd8e2e3ad98e3e59a9e62753cb0b0e77f0ed8625df3f3856db40" ||
  evidence.dependency?.v425ArtifactSha256 !== artifact.artifactSha256 || pointer.evidence?.fileSha256 !== fileSha(evidencePath) || pointer.evidence?.canonicalSha256 !== evidence.evidenceSha256 ||
  view?.rows?.length !== 24 || view.bandSummaries?.length !== 3 || view.domains?.overlapM !== null || view.domains.overlapFraction !== 0 || view.domains.extrapolation !== "forbidden" ||
  view.counts?.responseEligibleSourceCount !== 0 || view.counts.blockedOutOfDomainSourceCount !== 24 || view.counts.v413ResponseMatrixApplicationCount !== 0 ||
  view.rows.some((row) => row.responseEligible !== false || row.extrapolationAllowed !== false || row.v413ResponseMatrixApplied !== false || row.opticalHwpWollastonPhysicalApplicabilityGranted !== false) ||
  view.metrics?.maximumPythonOracleRelativeDifference >= 1e-15 ||
  pointer.capabilities?.v425SpectralApplicabilityAudit !== "qualified" || pointer.capabilities.v425V413DomainOverlap !== "none" || pointer.capabilities.v425ResponseEligibleSources !== "zero-of-24" || pointer.capabilities.v425BlockedOutOfDomainSources !== "24-of-24" || pointer.capabilities.v425ResponseMatrixApplications !== "zero" || pointer.capabilities.v425Extrapolation !== "forbidden" || pointer.capabilities.v425NonidealInstrumentResponseAuthority !== "unavailable" || pointer.capabilities.v425BrowserQualification !== "not-run" || pointer.capabilities.v314CorrectedDense !== "incomplete-0-of-49" ||
  state.status !== "incomplete-0-of-49" || state.completedShardCount !== 0 || state.attemptConsumed !== false || state.aggregateAvailable !== false ||
  formal.version !== "v263-current-product-evidence-pointer" || formalEvidence.science?.defaultKernel !== "legacy-eih-1pn" || formalEvidence.contracts?.workerPhysicsMutation !== "not-applied" || formalEvidence.contracts?.singleCanvas !== true || formalEvidence.contracts?.legacyRootAttributes !== 603 || formalEvidence.contracts?.evidenceLedgerClaims !== 84
) throw new Error("v425 fail-closed validation failed");
const transientPattern = /[A-Za-z]:\\|"(?:pid|processId|hostname|hostName|absolutePath)"\s*:/;
if (transientPattern.test(JSON.stringify(artifact)) || transientPattern.test(JSON.stringify(evidence)) || transientPattern.test(JSON.stringify(pointer))) throw new Error("v425 transient evidence leak");
for (const entry of evidence.sourceManifest ?? []) if (fileSha(entry.path) !== entry.sha256) throw new Error(`v425 source manifest mismatch: ${entry.path}`);
console.log(JSON.stringify({ status: "passed-v425-low-memory", artifactSha256: artifact.artifactSha256, evidenceSha256: evidence.evidenceSha256, pointerSha256: pointer.pointerSha256, counts: view.counts, domains: view.domains, bands: view.bandSummaries, responseEligible: pointer.capabilities.v425ResponseEligibleSources, browser: pointer.capabilities.v425BrowserQualification, dense: pointer.capabilities.v314CorrectedDense }, null, 2));
