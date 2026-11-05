import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const paths = {
  previousEvidence: "dist/science/orbit-atlas-shadow-v424-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v424.json",
  v424: "dist/science/kerr-predicted-polarimeter-v424/predicted-ideal-dual-beam.json",
  v411: "dist/science/kerr-polarimeter-calibration-v411/inspect.json",
  v413: "dist/science/kerr-polarimeter-spectral-response-v413/spectral-response.json",
  artifact: "dist/science/kerr-instrument-spectral-admission-v425/spectral-admission.json",
  oracle: "dist/science/kerr-instrument-spectral-admission-v425/python-spectral-admission-oracle.json",
  exportManifest: "dist/science/kerr-instrument-spectral-admission-v425/export-manifest.json",
  state: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v425-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v425.json",
};
const transient = new Set(["generatedAt", "artifactSha256", "evidenceSha256", "pointerSha256"]);
const bytes = (path) => readFileSync(resolve(root, path));
const read = (path) => JSON.parse(bytes(path).toString("utf8"));
const fileSha = (path) => createHash("sha256").update(bytes(path)).digest("hex");
const canonicalize = (value) => Array.isArray(value) ? value.map(canonicalize) : !value || typeof value !== "object" ? value : Object.fromEntries(Object.entries(value).filter(([key]) => !transient.has(key)).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, canonicalize(entry)]));
const sha = (value) => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
const atomic = (path, value) => { const target = resolve(root, path); mkdirSync(dirname(target), { recursive: true }); const temporary = `${target}.${process.pid}.part`; writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, "utf8"); renameSync(temporary, target); };

const previousEvidence = read(paths.previousEvidence), previousPointer = read(paths.previousPointer), v424 = read(paths.v424), v411 = read(paths.v411), v413 = read(paths.v413), artifact = read(paths.artifact), oracle = read(paths.oracle), exports = read(paths.exportManifest), state = read(paths.state), formal = read(paths.formal), formalEvidence = read(formal.source), view = artifact.view;
if (
  previousEvidence.evidenceSha256 !== "4e18645a0c3a668810c8d2c8c8431b353bbbf463cb508f6484f4867a6fd4efcd" ||
  previousPointer.pointerSha256 !== "689f34efe49c854f3b3bb2bf0f6f6580fd9c8ca57af526874c16ed71bbb76473" ||
  fileSha(paths.previousEvidence) !== "4c6e7f2d9efdbef994422d963f96dbccad4fe1599fc7a7ed7d3512a47d06889b" ||
  fileSha(paths.previousPointer) !== "ec7854079f9bfd8e2e3ad98e3e59a9e62753cb0b0e77f0ed8625df3f3856db40" ||
  fileSha(paths.v424) !== "ee46fa0819b9f41e30b4dd053d069c99783a50cb0afcdb2b34e095daa1b5e024" || v424.artifactSha256 !== "934f3038aa2ca30fa804346008528c33479f5af5b09a173fca55cf0f76d4139d" ||
  fileSha(paths.v411) !== "5bd1831f70860125fb1e841f801566e0c92517cf7d9d6ad7748ad5812f4e2a31" || v411.artifactSha256 !== "9382399d3184a5480f085ecc4e3679ba593f814db8a73c8abba15eb3eec58ced" ||
  fileSha(paths.v413) !== "d8972aa256d4ee1818ad3e4075e27c09e20a37c738e0853fa4a44068146e1413" || v413.artifactSha256 !== "f4a10d65ca5e0c49495cf5be6b3a27298a4048da7acbdaba264905d3cf4ccd6f" ||
  artifact.version !== "v425-kerr-instrument-spectral-applicability-firewall-artifact-v1" || sha(artifact) !== artifact.artifactSha256 ||
  oracle.status !== "qualified-all-v424-predictions-outside-v413-domain-response-application-blocked" || oracle.artifactSha256 !== artifact.pythonOracleArtifactSha256 ||
  view?.rows?.length !== 24 || view.bandSummaries?.length !== 3 ||
  view.domains?.v413FixtureWavelengthM?.join(",") !== "4e-7,8e-7" || view.domains.overlapM !== null || view.domains.overlapFraction !== 0 || view.domains.extrapolation !== "forbidden" ||
  view.counts?.affectedV424ModulationRowCount !== 96 || view.counts.responseEligibleSourceCount !== 0 || view.counts.blockedOutOfDomainSourceCount !== 24 || view.counts.v413ResponseMatrixApplicationCount !== 0 || view.counts.measuredCalibrationRowCount !== 0 || view.counts.detectorProjectionCount !== 0 || view.counts.photonOrElectronCountProductCount !== 0 ||
  view.rows.some((row) => row.vacuumWavelengthM >= 4e-7 || row.responseEligible !== false || row.extrapolationAllowed !== false || row.v413ResponseMatrixApplied !== false || row.opticalHwpWollastonPhysicalApplicabilityGranted !== false || row.measuredCalibrationAvailable !== false || row.detectorProjectionApplied !== false) ||
  view.metrics?.maximumPythonOracleRelativeDifference >= 1e-15 ||
  view.qualification?.outOfDomainFirewallQualified !== true || view.qualification.independentPythonOracleQualified !== true || view.qualification.nonidealMuellerProjectionQualified !== false || view.qualification.measuredInstrumentResponseQualified !== false ||
  view.authorityBoundary?.spectralApplicabilityAuditQualified !== true || view.authorityBoundary.nonidealInstrumentResponseAuthorityGranted !== false || view.authorityBoundary.measurementAuthorityGranted !== false || view.authorityBoundary.detectorAuthorityGranted !== false ||
  exports.version !== "v425-kerr-instrument-spectral-admission-export-manifest-v1" || exports.artifactSha256 !== artifact.artifactSha256 || exports.spectralApplicabilityAudit !== "qualified" || exports.responseEligibleSourceCount !== 0 || exports.responseMatrixApplicationCount !== 0 || exports.extrapolation !== "forbidden" || exports.measurementAuthority !== "unavailable" || exports.detectorAuthority !== "unavailable" || exports.pixelRasterAuthority !== "unavailable" || Object.values(exports.exports ?? {}).some((entry) => entry.sha256 !== fileSha(`dist/science/kerr-instrument-spectral-admission-v425/${entry.path}`)) ||
  state.status !== "incomplete-0-of-49" || state.completedShardCount !== 0 || state.attemptConsumed !== false || state.aggregateAvailable !== false ||
  formal.version !== "v263-current-product-evidence-pointer" || formalEvidence.science?.defaultKernel !== "legacy-eih-1pn" || formalEvidence.contracts?.workerPhysicsMutation !== "not-applied" || formalEvidence.contracts?.singleCanvas !== true || formalEvidence.contracts?.legacyRootAttributes !== 603 || formalEvidence.contracts?.evidenceLedgerClaims !== 84
) throw new Error("v425-boundary");

const sourcePaths = [
  "app/lib/kerrInstrumentSpectralAdmissionV425.ts", "app/lib/kerrInstrumentSpectralAdmissionV425.test.ts",
  "app/lib/kerrInstrumentSpectralAdmissionServerV425.ts", "app/lib/kerrInstrumentSpectralAdmissionServerV425.test.ts",
  "app/lib/kerrInstrumentSpectralAdmissionClientV425.ts", "app/lib/kerrInstrumentSpectralAdmissionClientV425.test.ts",
  "app/lib/atlasShadowCapabilityPointerV425.ts", "app/lib/atlasShadowCapabilityPointerV425.test.ts",
  "app/api/atlas/relativity-evidence/v425/spectral-admission/route.ts", "app/api/atlas/relativity-evidence/v425/spectral-admission/route.test.ts",
  "app/components/KerrInstrumentSpectralAdmissionV425.tsx", "app/components/KerrInstrumentSpectralAdmissionV425.test.tsx", "app/components/KerrEvidenceObservatoryV405.tsx",
  "scripts/run-kerr-instrument-spectral-admission-oracle-v425.py", "scripts/test-kerr-instrument-spectral-admission-v425.py",
  "scripts/build-kerr-instrument-spectral-admission-v425.ts", "scripts/export-kerr-instrument-spectral-admission-v425.py", "scripts/build-kerr-instrument-spectral-admission-chain-v425.mjs",
  "scripts/build-shadow-candidate-v425.mjs", "scripts/reseal-shadow-evidence-chain-v425.mjs", "scripts/verify-shadow-v425-light.mjs", "scripts/atlas.mjs",
];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) }));
const evidenceUnsigned = {
  version: "orbit-atlas-shadow-v425-evidence-v1", generatedAt: artifact.generatedAt,
  status: "spectral-applicability-firewall-qualified-all-v424-predictions-out-of-v413-domain-response-extrapolation-blocked-browser-pending-dense-incomplete-0-of-49",
  dependency: {
    v424EvidenceSha256: previousEvidence.evidenceSha256, v424PointerSha256: previousPointer.pointerSha256,
    v424EvidenceFileSha256: fileSha(paths.previousEvidence), v424PointerFileSha256: fileSha(paths.previousPointer),
    v424ArtifactSha256: v424.artifactSha256, v424ArtifactFileSha256: fileSha(paths.v424),
    v411CalibrationContractArtifactSha256: v411.artifactSha256, v411CalibrationContractFileSha256: fileSha(paths.v411),
    v413SpectralFixtureArtifactSha256: v413.artifactSha256, v413SpectralFixtureFileSha256: fileSha(paths.v413),
    v425ArtifactSha256: artifact.artifactSha256, v425ArtifactFileSha256: fileSha(paths.artifact),
    pythonOracleArtifactSha256: oracle.artifactSha256, pythonOracleFileSha256: fileSha(paths.oracle), exportManifestFileSha256: fileSha(paths.exportManifest),
  },
  spectralAdmission: {
    status: view.status, constants: view.constants, domains: view.domains, counts: view.counts, rows: view.rows, bandSummaries: view.bandSummaries, metrics: view.metrics, thresholds: view.thresholds,
    futureMeasuredResponseRequirements: view.futureMeasuredResponseRequirements, qualification: view.qualification, authorityBoundary: view.authorityBoundary, products: view.products,
    exports: Object.fromEntries(Object.entries(exports.exports).map(([id, entry]) => [id, { fileSha256: entry.sha256, semantic: entry.semantic }])),
  },
  qualification: {
    exactFrequencyWavelengthEnergyConversionQualified: true, allSourcePredictionsAudited: true, spectralApplicabilityFirewallQualified: true, independentPythonOracleQualified: true,
    v413DomainOverlap: "none", responseEligibleSourceCount: 0, blockedOutOfDomainSourceCount: 24, responseMatrixApplicationCount: 0,
    nonidealMuellerProjectionQualified: false, measuredInstrumentResponseQualified: false, detectorProjectionQualified: false, photonOrElectronCountsQualified: false, pixelRasterAuthorityQualified: false, denseAuthorityQualified: false,
    browserQualification: "not-run", visualMatrixQualification: "not-run", soakQualification: "not-run", rtxWebGpuQualification: "not-run",
  },
  runtimeIntegration: { v13EvidenceObservatory: true, summaryOnlyInReactState: true, fullAdmissionRowsInReactState: false, responseMatrixInReactState: false, fullArtifactDownloadAvailable: true, canvasCreated: false, responseValueFabrication: false, measurementClaim: false, detectorImageClaim: false },
  correctedCampaign: { namespace: "v314", status: state.status, completedShardCount: 0, plannedShardCount: state.plannedShardCount, attemptConsumed: false, aggregateAvailable: false, stateSha256: state.stateSha256 },
  sourceManifest, sourceSha256: sha(sourceManifest),
  release: { formalProductPointer: "v263", formalProductPointerSha256: fileSha(paths.formal), formalProductPointerAdvanced: false, ordinaryStandaloneProfile: "legacy-v9", liteProfile: "legacy-v9", localShadowDefaultProfile: "legacy-v9", localShadowDefaultApplied: false, publicDeploymentBlocked: true },
  releaseBoundary: "v425-spectral-applicability-firewall-only-no-extrapolated-response-measurement-detector-counts-pixel-raster-dense-browser-or-product-promotion",
};
const evidence = { ...evidenceUnsigned, evidenceSha256: sha(evidenceUnsigned) }; atomic(paths.evidence, evidence);
const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v425", generatedAt: artifact.generatedAt, status: evidence.status, formalProductPointer: "v263", formalProductPointerAdvanced: false, localShadowDefaultApplied: false, publicDeploymentBlocked: true,
  capabilities: {
    v424IdealModelModulation: "qualified-preserved-96-rows", v425ExactFrequencyWavelengthEnergyConversion: "qualified-24-sources", v425SpectralApplicabilityAudit: "qualified", v425V413DomainOverlap: "none", v425ResponseEligibleSources: "zero-of-24", v425BlockedOutOfDomainSources: "24-of-24", v425ResponseMatrixApplications: "zero", v425Extrapolation: "forbidden", v425OpticalHwpWollastonPhysicalApplicability: "not-granted", v425PythonOracle: "qualified-independent", v425NonidealInstrumentResponseAuthority: "unavailable", v425MeasurementAuthority: "unavailable", v425DetectorAuthority: "unavailable", v425PhotonElectronCounts: "unavailable", v425PixelRasterAuthority: "unavailable", v425FitsAdmissionTable: "available-no-image-data", v425DiagnosticPng: "available-not-detector-image", v425BrowserQualification: "not-run", v314CorrectedDense: "incomplete-0-of-49", denseAggregate: "unavailable",
  },
  evidence: { path: paths.evidence, fileSha256: fileSha(paths.evidence), canonicalSha256: evidence.evidenceSha256 },
};
const pointer = { ...pointerUnsigned, pointerSha256: sha(pointerUnsigned) }; atomic(paths.pointer, pointer);
console.log(JSON.stringify({ status: pointer.status, artifactSha256: artifact.artifactSha256, evidenceSha256: evidence.evidenceSha256, pointerSha256: pointer.pointerSha256, counts: view.counts, domains: view.domains, bands: view.bandSummaries, responseEligible: pointer.capabilities.v425ResponseEligibleSources, browser: pointer.capabilities.v425BrowserQualification, dense: pointer.capabilities.v314CorrectedDense }, null, 2));
