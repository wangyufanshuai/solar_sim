import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import {
  mkdir,
  readFile,
  stat,
  writeFile,
} from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_ENGINE_ROOT = resolve(ROOT, "..", "..", "orbit-relativity-engine");
const DEFAULT_MANIFEST = resolve(
  DEFAULT_ENGINE_ROOT,
  "dist",
  "timelike-kerr-v595-reference-candidate-r2",
  "timelike-kerr-manifest-v595.json",
);
const DEFAULT_OUTPUT = resolve(
  ROOT,
  "public",
  "data",
  "post-v593-stellar-relativity",
  "timelike-kerr-reference-v595.json",
);
const DEFAULT_RECEIPT = resolve(
  ROOT,
  "docs",
  "release",
  "post-v593",
  "timelike-kerr-reference-receipt-v595.json",
);

const EXPECTED = Object.freeze({
  manifestSha256: "0b4d72b0313b6ba5bcdd49a0fdd20dc2e17a137a76902e55d530da08d46c3e63",
  summarySha256: "59b46d0f0a3d18b34c5bb96003215976e75596177855f73ed4dd2f1dd02f6d69",
  sourceSha256: "23e775498e009cd5a458df000e7ae20c3e416dc7065328af4cab922b5c36a06f",
  v594SourceSha256: "6599398a6fab78a1367b234d3a3e9ed428027879a1df4838f76b97ff279b981f",
  v594CandidateSha256: "e92484940ba9a812d0936bbd67b29c4cb3c3ac20d9477cd04a949e35efd33bad",
  v594DeploymentId: "v594-6599398a6fab-e92484940ba9",
  fixtureNames: ["bound", "capture", "scatter", "escape"],
  anchorNames: [
    "schwarzschild-circular-r10",
    "kerr-prograde-circular-a0.7-r10",
    "kerr-retrograde-circular-a0.7-r10",
  ],
  stateOrder: ["t", "r", "theta", "phi", "p_t", "p_r", "p_theta", "p_phi"],
  invariantOrder: ["energy", "axialAngularMomentum", "carterQ", "hamiltonian", "massShellResidual"],
});

const REFERENCE_BOUNDARY =
  "offline-vacuum-test-particle-reference-candidate-not-production-scientific-authority-not-measured-not-gpu-not-radiative-transfer";

const parseArgs = (argv) => {
  const args = {
    engineRoot: DEFAULT_ENGINE_ROOT,
    manifest: DEFAULT_MANIFEST,
    output: DEFAULT_OUTPUT,
    receipt: DEFAULT_RECEIPT,
    python: process.env.PYTHON ?? "python",
    verifyExisting: false,
  };
  for (let index = 2; index < argv.length; index += 1) {
    const flag = argv[index];
    if (flag === "--verify-existing") {
      args.verifyExisting = true;
      continue;
    }
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) throw new Error(`missing-value:${flag}`);
    if (flag === "--engine-root") args.engineRoot = resolve(value);
    else if (flag === "--manifest") args.manifest = resolve(value);
    else if (flag === "--output") args.output = resolve(value);
    else if (flag === "--receipt") args.receipt = resolve(value);
    else if (flag === "--python") args.python = value;
    else throw new Error(`unknown-argument:${flag}`);
    index += 1;
  }
  return args;
};

const canonicalize = (value) => Array.isArray(value)
  ? value.map(canonicalize)
  : value && typeof value === "object"
    ? Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]))
    : value;

export const canonicalSha256 = (value) => createHash("sha256")
  .update(JSON.stringify(canonicalize(value)), "utf8")
  .digest("hex");

const fileSha256 = async (path) => createHash("sha256")
  .update(await readFile(path))
  .digest("hex");

const readJson = async (path) => {
  const value = JSON.parse(await readFile(path, "utf8"));
  assertFiniteJson(value, "$input");
  if (!value || Array.isArray(value) || typeof value !== "object") {
    throw new Error(`json-root-not-object:${path}`);
  }
  return value;
};

function assertFiniteJson(value, path) {
  if (value === null || typeof value === "string" || typeof value === "boolean") return;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error(`non-finite-json:${path}`);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((entry, index) => assertFiniteJson(entry, `${path}[${index}]`));
    return;
  }
  if (value && typeof value === "object") {
    Object.entries(value).forEach(([key, entry]) => assertFiniteJson(entry, `${path}.${key}`));
    return;
  }
  throw new Error(`unsupported-json-value:${path}`);
}

const assert = (condition, label) => {
  if (!condition) throw new Error(`v595-timelike-kerr-admission:${label}`);
};

const equal = (actual, expected) => JSON.stringify(actual) === JSON.stringify(expected);

const validateSeal = (document, field, expected, label) => {
  const unsigned = { ...document };
  const seal = unsigned[field];
  delete unsigned[field];
  assert(seal === expected, `${label}-identity`);
  assert(seal === canonicalSha256(unsigned), `${label}-canonical-seal`);
};

const validateAuthority = (summary) => {
  assert(summary.formalEvidence === false, "summary-formal-evidence");
  assert(summary.promotion === "none", "summary-promotion");
  assert(summary.boundary === REFERENCE_BOUNDARY, "summary-boundary");
  assert(summary.authority?.referenceCandidateEvidence === true, "reference-candidate-evidence");
  for (const field of [
    "gpuAuthorityGranted",
    "grmhdAuthorityGranted",
    "measuredAuthorityGranted",
    "productionAuthorityGranted",
    "radiativeTransferAuthorityGranted",
    "scientificPromotionGranted",
    "webTeachingKernelModified",
  ]) assert(summary.authority?.[field] === false, `summary-authority-${field}`);
};

const validateFixture = (fixture, expectedName, thresholds) => {
  assert(fixture.name === expectedName, `fixture-order-${expectedName}`);
  assert(fixture.classification === expectedName, `fixture-classification-${expectedName}`);
  assert(fixture.expectedClassification === expectedName, `fixture-expected-classification-${expectedName}`);
  assert(fixture.qualified === true, `fixture-qualified-${expectedName}`);
  assert(fixture.spin === 0.7, `fixture-spin-${expectedName}`);
  assert(fixture.integration?.dynamicThetaSpan > 0, `fixture-dynamic-theta-${expectedName}`);
  assert(fixture.integration?.dynamicPThetaSpan > 0, `fixture-dynamic-p-theta-${expectedName}`);
  assert(fixture.invariants?.computedFromTrajectory === true, `fixture-invariants-computed-${expectedName}`);
  assert(fixture.invariants?.qualified === true, `fixture-invariants-qualified-${expectedName}`);
  assert(fixture.invariants.maxAbsoluteDrift.energy <= thresholds.energyDrift, `fixture-energy-drift-${expectedName}`);
  assert(fixture.invariants.maxAbsoluteDrift.axialAngularMomentum <= thresholds.axialAngularMomentumDrift, `fixture-lz-drift-${expectedName}`);
  assert(fixture.invariants.maxAbsoluteDrift.carterQ <= thresholds.carterQDrift, `fixture-q-drift-${expectedName}`);
  assert(fixture.invariants.maxAbsoluteDrift.hamiltonian <= thresholds.hamiltonianDrift, `fixture-h-drift-${expectedName}`);
  assert(fixture.invariants.maxMassShellResidual <= thresholds.massShellResidual, `fixture-shell-${expectedName}`);
  assert(fixture.stepConvergence?.qualified === true, `fixture-convergence-qualified-${expectedName}`);
  assert(Math.max(
    fixture.stepConvergence.coarseToMediumScaledError,
    fixture.stepConvergence.mediumToFineScaledError,
  ) <= thresholds.stepConvergenceScaledError, `fixture-convergence-threshold-${expectedName}`);
  assert(fixture.reverseTimeRoundtrip?.qualified === true, `fixture-reverse-qualified-${expectedName}`);
  assert(fixture.reverseTimeRoundtrip.scaledStateError <= thresholds.reverseTimeScaledError, `fixture-reverse-threshold-${expectedName}`);
  assert(fixture.independentReferenceComparison?.qualified === true, `fixture-independent-qualified-${expectedName}`);
  assert(fixture.independentReferenceComparison.maxScaledTrajectoryDifference <= thresholds.independentTrajectoryScaledError, `fixture-independent-threshold-${expectedName}`);
  assert(fixture.metricImplementationCrosscheck?.qualified === true, `fixture-metric-qualified-${expectedName}`);
  assert(fixture.metricImplementationCrosscheck.inverseMetricMaxAbsoluteResidual <= thresholds.metricInverseResidual, `fixture-metric-inverse-${expectedName}`);
  assert(fixture.metricImplementationCrosscheck.inverseMetricDerivativeMaxAbsoluteResidual <= thresholds.metricDerivativeResidual, `fixture-metric-derivative-${expectedName}`);
  assert(fixture.highPrecisionAlgebraicComparison?.qualified === true, `fixture-high-precision-qualified-${expectedName}`);
  assert(fixture.highPrecisionAlgebraicComparison.maxAbsoluteDifference <= thresholds.highPrecisionInvariantDifference, `fixture-high-precision-threshold-${expectedName}`);
  assert(fixture.turningPointContinuity?.qualified === true, `fixture-turning-qualified-${expectedName}`);
  assert(fixture.turningPointContinuity.midpointScaledResidual <= thresholds.turningPointMidpointResidual, `fixture-turning-threshold-${expectedName}`);
};

export const validateTimelikeKerrSummaryV595 = (summary) => {
  assert(summary.version === "v595-timelike-kerr-reference-candidate-v1", "summary-version");
  assert(summary.schemaVersion === "orbit-timelike-kerr-reference/v595", "summary-schema");
  assert(summary.status === "qualified-v595-timelike-kerr-reference-candidate", "summary-status");
  assert(summary.summarySha256 === EXPECTED.summarySha256, "summary-identity");
  assert(summary.coordinates === "Boyer-Lindquist-canonical-phase-space", "coordinates");
  assert(summary.metric === "Kerr", "metric");
  assert(summary.hamiltonian === "H=0.5*g^(mu,nu)*p_mu*p_nu", "hamiltonian");
  assert(summary.timelikeMassShell === -0.5, "timelike-shell");
  assert(equal(summary.stateOrder, EXPECTED.stateOrder), "state-order");
  assert(equal(summary.invariantOrder, EXPECTED.invariantOrder), "invariant-order");
  assert(equal(summary.units, { G: 1, M: 1, c: 1, particleRestMass: 1 }), "units");
  validateAuthority(summary);
  assert(summary.fixtureCount === 4, "fixture-count");
  assert(equal(summary.fixtures?.map(({ name }) => name), EXPECTED.fixtureNames), "fixture-set");
  summary.fixtures.forEach((fixture, index) => validateFixture(fixture, EXPECTED.fixtureNames[index], summary.thresholds));
  const radialTurns = Object.fromEntries(summary.fixtures.map((fixture) => [fixture.name, fixture.integration.radialTurningPointCount]));
  assert(equal(radialTurns, { bound: 2, capture: 0, scatter: 1, escape: 0 }), "classification-event-semantics");
  assert(summary.analyticAnchors?.qualified === true, "anchors-qualified");
  assert(summary.analyticAnchors.anchorCount === 3, "anchor-count");
  assert(equal(summary.analyticAnchors.anchorNames, EXPECTED.anchorNames), "anchor-set");
  for (const anchor of summary.analyticAnchors.anchors) {
    assert(anchor.qualified === true, `anchor-qualified-${anchor.name}`);
    assert(anchor.maxInvariantResidual <= summary.thresholds.analyticAnchorInvariantResidual, `anchor-invariant-${anchor.name}`);
    assert(anchor.maxRhsEquilibriumResidual <= summary.thresholds.analyticAnchorEquilibriumResidual, `anchor-equilibrium-${anchor.name}`);
    assert(anchor.shortOrbit.maxStabilityResidual <= summary.thresholds.analyticAnchorOrbitStability, `anchor-stability-${anchor.name}`);
  }
  return true;
};

const validateManifest = async (manifestPath) => {
  const manifest = await readJson(manifestPath);
  validateSeal(manifest, "manifestSha256", EXPECTED.manifestSha256, "external-manifest");
  assert(manifest.version === "v595-timelike-kerr-reference-manifest-v1", "manifest-version");
  assert(manifest.summarySha256 === EXPECTED.summarySha256, "manifest-summary");
  assert(manifest.sourceSha256 === EXPECTED.sourceSha256, "manifest-source");
  assert(manifest.formalEvidence === false, "manifest-formal-evidence");
  assert(manifest.promotion === "none", "manifest-promotion");
  assert(manifest.scientificPromotionGranted === false, "manifest-scientific-promotion");
  assert(manifest.boundary === REFERENCE_BOUNDARY, "manifest-boundary");
  assert(manifest.dependencies?.hdf5?.available === true, "manifest-hdf5");
  assert(manifest.dependencies?.fits?.available === true, "manifest-fits");
  assert(canonicalSha256(manifest.source) === EXPECTED.sourceSha256, "manifest-source-seal");
  assert(equal(manifest.source.files?.map(({ path }) => path), ["timelike_kerr_v595.py", "timelike_kerr_io_v595.py"]), "manifest-source-files");
  const productNames = [
    "timelike-kerr-summary-v595.json",
    "timelike-kerr-trajectories-v595.h5",
    "timelike-kerr-invariants-v595.fits",
  ];
  assert(equal(manifest.files?.map(({ path }) => path), productNames), "manifest-product-files");
  const root = dirname(manifestPath);
  for (const record of manifest.files) {
    const path = resolve(root, record.path);
    assert(dirname(path) === resolve(root), `manifest-file-boundary-${record.path}`);
    const info = await stat(path);
    assert(info.isFile(), `manifest-file-kind-${record.path}`);
    assert(info.size === record.bytes, `manifest-file-bytes-${record.path}`);
    assert(await fileSha256(path) === record.sha256, `manifest-file-sha-${record.path}`);
  }
  return manifest;
};

const verifySealedV594Base = async () => {
  const source = await readJson(resolve(ROOT, "docs/release/v594/source-manifest-v594.json"));
  const candidate = await readJson(resolve(ROOT, "public/data/stellar-relativity-v594/manifest.json"));
  validateSeal(source, "receiptSha256", EXPECTED.v594SourceSha256, "v594-source");
  validateSeal(candidate, "manifestSha256", EXPECTED.v594CandidateSha256, "v594-candidate");
  assert(candidate.formalProductPointer === "v263", "formal-product-pointer");
  return {
    version: "v594",
    formalProductPointer: "v263",
    sourceManifestSha256: source.receiptSha256,
    candidateManifestSha256: candidate.manifestSha256,
    deploymentId: EXPECTED.v594DeploymentId,
    binding: "sealed-v594-base-for-additive-v595-source-input",
  };
};

const runPythonVerifier = ({ python, engineRoot, manifest }) => {
  const result = spawnSync(
    python,
    ["-m", "orbit_relativity_engine.timelike_kerr_v595_cli", "verify", "--manifest", manifest],
    { cwd: engineRoot, encoding: "utf8", windowsHide: true },
  );
  assert(result.error == null, `python-verifier-launch:${result.error?.message ?? "unknown"}`);
  assert(result.status === 0, `python-verifier-exit:${result.status}:${result.stderr.trim()}`);
  const receipt = JSON.parse(result.stdout);
  assert(receipt.status === "passed-readonly-v595-timelike-kerr-json-hdf5-fits", "python-verifier-status");
  assert(receipt.manifestSha256 === EXPECTED.manifestSha256, "python-verifier-manifest");
  assert(receipt.summarySha256 === EXPECTED.summarySha256, "python-verifier-summary");
  assert(equal(receipt.formatsVerified, ["JSON", "HDF5", "FITS"]), "python-verifier-formats");
  assert(receipt.fixtureCount === 4, "python-verifier-fixtures");
  assert(receipt.writesPerformed === false, "python-verifier-readonly");
  assert(receipt.formalEvidence === false, "python-verifier-formal-evidence");
  assert(receipt.promotion === "none", "python-verifier-promotion");
  assert(receipt.scientificPromotionGranted === false, "python-verifier-authority");
  return receipt;
};

const compactFixture = (fixture) => ({
  id: fixture.name,
  classification: fixture.classification,
  expectedClassification: fixture.expectedClassification,
  qualified: fixture.qualified,
  spin: fixture.spin,
  invariants: {
    initial: fixture.invariants.initial,
    terminal: fixture.invariants.terminal,
    maxAbsoluteDrift: fixture.invariants.maxAbsoluteDrift,
    maxMassShellResidual: fixture.invariants.maxMassShellResidual,
    computedFromTrajectory: fixture.invariants.computedFromTrajectory,
  },
  dynamics: {
    dynamicThetaSpan: fixture.integration.dynamicThetaSpan,
    dynamicPThetaSpan: fixture.integration.dynamicPThetaSpan,
    radialTurningPointCount: fixture.integration.radialTurningPointCount,
    polarTurningPointCount: fixture.integration.polarTurningPointCount,
    status: fixture.integration.status,
  },
  gates: {
    stepConvergence: fixture.stepConvergence.qualified,
    reverseTimeRoundtrip: fixture.reverseTimeRoundtrip.qualified,
    independentReference: fixture.independentReferenceComparison.qualified,
    metricCrosscheck: fixture.metricImplementationCrosscheck.qualified,
    highPrecisionInvariant: fixture.highPrecisionAlgebraicComparison.qualified,
    turningPointContinuity: fixture.turningPointContinuity.qualified,
  },
  residuals: {
    convergenceScaled: Math.max(
      fixture.stepConvergence.coarseToMediumScaledError,
      fixture.stepConvergence.mediumToFineScaledError,
    ),
    reverseTimeScaled: fixture.reverseTimeRoundtrip.scaledStateError,
    independentTrajectoryScaled: fixture.independentReferenceComparison.maxScaledTrajectoryDifference,
    metricInverse: fixture.metricImplementationCrosscheck.inverseMetricMaxAbsoluteResidual,
    metricDerivative: fixture.metricImplementationCrosscheck.inverseMetricDerivativeMaxAbsoluteResidual,
    highPrecisionInvariant: fixture.highPrecisionAlgebraicComparison.maxAbsoluteDifference,
    turningPointMidpoint: fixture.turningPointContinuity.midpointScaledResidual,
  },
});

const compactAnchor = (anchor) => ({
  id: anchor.name,
  family: anchor.family,
  qualified: anchor.qualified,
  radius: anchor.radius,
  spin: anchor.spin,
  expected: anchor.expected,
  observed: anchor.observed,
  maxInvariantResidual: anchor.maxInvariantResidual,
  maxRhsEquilibriumResidual: anchor.maxRhsEquilibriumResidual,
  maxOrbitStabilityResidual: anchor.shortOrbit.maxStabilityResidual,
});

export async function buildTimelikeKerrAdmissionV595(options) {
  const manifestPath = resolve(options.manifest);
  const engineRoot = resolve(options.engineRoot);
  const outputPath = resolve(options.output);
  const receiptPath = resolve(options.receipt);
  assert(outputPath !== receiptPath, "output-receipt-collision");
  const [manifest, hostBase] = await Promise.all([
    validateManifest(manifestPath),
    verifySealedV594Base(),
  ]);
  const summaryRecord = manifest.files.find(({ path }) => path === "timelike-kerr-summary-v595.json");
  const summary = await readJson(resolve(dirname(manifestPath), summaryRecord.path));
  validateTimelikeKerrSummaryV595(summary);
  const pythonReceipt = runPythonVerifier({
    python: options.python,
    engineRoot,
    manifest: manifestPath,
  });

  const unsignedAdmission = {
    version: "v595-timelike-kerr-web-admission-v1",
    generatedAt: manifest.generatedAt,
    status: "admitted-reference-candidate-not-promoted",
    hostBase,
    source: {
      engine: "orbit-relativity-engine",
      manifestVersion: manifest.version,
      manifestSha256: manifest.manifestSha256,
      summarySha256: manifest.summarySha256,
      sourceSha256: manifest.sourceSha256,
      sourceFiles: manifest.source.files,
      productFiles: manifest.files,
      formatsVerified: pythonReceipt.formatsVerified,
      pythonCanonicalSealVerified: true,
      externalVerifierStatus: pythonReceipt.status,
      externalVerifierWritesPerformed: pythonReceipt.writesPerformed,
    },
    contract: {
      schemaVersion: summary.schemaVersion,
      coordinates: summary.coordinates,
      metric: summary.metric,
      hamiltonian: summary.hamiltonian,
      timelikeMassShell: summary.timelikeMassShell,
      stateOrder: summary.stateOrder,
      invariantOrder: summary.invariantOrder,
      units: summary.units,
    },
    fixtures: summary.fixtures.map(compactFixture),
    analyticAnchors: summary.analyticAnchors.anchors.map(compactAnchor),
    thresholds: summary.thresholds,
    gates: {
      exactFixtureSet: true,
      exactAnalyticAnchorSet: true,
      classificationEvents: true,
      dynamicThetaAndPolarMomentum: true,
      invariantAndMassShellBounds: true,
      convergence: true,
      reverseTime: true,
      independentReference: true,
      metricCrosscheck: true,
      highPrecisionInvariant: true,
      turningPointContinuity: true,
      allQualified: true,
    },
    authority: {
      defaultWebKernel: "legacy-eih-1pn",
      v2Mode: "shadow-only",
      referenceCandidateEvidence: true,
      formalEvidence: false,
      promotion: "none",
      scientificAuthorityGranted: false,
      measuredAuthorityGranted: false,
      gpuAuthorityGranted: false,
      radiativeTransferAuthorityGranted: false,
      grmhdAuthorityGranted: false,
      productionAuthorityGranted: false,
      webTeachingKernelModified: false,
      scientificPayloadMutationAllowed: false,
    },
    boundary: REFERENCE_BOUNDARY,
  };
  const admission = {
    ...unsignedAdmission,
    admissionSha256: canonicalSha256(unsignedAdmission),
  };
  const admissionText = `${JSON.stringify(admission, null, 2)}\n`;
  const outputRecord = {
    path: relative(ROOT, outputPath).replaceAll("\\", "/"),
    bytes: Buffer.byteLength(admissionText),
    sha256: createHash("sha256").update(admissionText).digest("hex"),
    admissionSha256: admission.admissionSha256,
  };
  const unsignedReceipt = {
    version: "v595-timelike-kerr-web-admission-receipt-v1",
    generatedAt: manifest.generatedAt,
    status: "passed-source-bound-compact-admission-not-promoted",
    hostBase,
    input: {
      manifestSha256: manifest.manifestSha256,
      summarySha256: manifest.summarySha256,
      sourceSha256: manifest.sourceSha256,
      productFiles: manifest.files,
    },
    validation: {
      manifestCanonicalSeal: true,
      summaryPythonCanonicalSeal: true,
      sourceReceiptCanonicalSeal: true,
      productFileHashes: true,
      jsonHdf5FitsSemantics: true,
      exactFixtureAndAnchorSets: true,
      numericThresholds: true,
      authorityBoundary: true,
      writesPerformedByExternalVerifier: false,
    },
    output: outputRecord,
    authority: admission.authority,
  };
  const receipt = {
    ...unsignedReceipt,
    receiptSha256: canonicalSha256(unsignedReceipt),
  };
  const receiptText = `${JSON.stringify(receipt, null, 2)}\n`;
  if (options.verifyExisting) {
    const [existingAdmission, existingReceipt] = await Promise.all([
      readFile(outputPath, "utf8"),
      readFile(receiptPath, "utf8"),
    ]);
    assert(existingAdmission === admissionText, "existing-admission-byte-drift");
    assert(existingReceipt === receiptText, "existing-receipt-byte-drift");
    return {
      admission,
      receipt,
      outputPath,
      receiptPath,
      writesPerformed: false,
      verifiedExisting: true,
    };
  }
  await Promise.all([mkdir(dirname(outputPath), { recursive: true }), mkdir(dirname(receiptPath), { recursive: true })]);
  await writeFile(outputPath, admissionText, { encoding: "utf8", flag: "wx" });
  await writeFile(receiptPath, receiptText, { encoding: "utf8", flag: "wx" });
  return {
    admission,
    receipt,
    outputPath,
    receiptPath,
    writesPerformed: true,
    verifiedExisting: false,
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = parseArgs(process.argv);
  buildTimelikeKerrAdmissionV595(args)
    .then(({ admission, receipt, outputPath, receiptPath, writesPerformed, verifiedExisting }) => {
      console.log(JSON.stringify({
        status: verifiedExisting ? "passed-byte-identical-existing-v595-timelike-kerr-admission" : receipt.status,
        output: relative(ROOT, outputPath).replaceAll("\\", "/"),
        receipt: relative(ROOT, receiptPath).replaceAll("\\", "/"),
        admissionSha256: admission.admissionSha256,
        receiptSha256: receipt.receiptSha256,
        writesPerformed,
      }, null, 2));
    })
    .catch((error) => {
      console.error(error instanceof Error ? error.stack : String(error));
      process.exitCode = 1;
    });
}
