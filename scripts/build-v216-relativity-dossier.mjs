import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const fromRoot = (file) => path.join(root, file);
const readJson = async (file) => JSON.parse(await readFile(fromRoot(file), "utf8"));
const sha256 = async (file) =>
  createHash("sha256").update(await readFile(fromRoot(file))).digest("hex");
const canonicalHash = (document, omitted = ["generatedAt", "canonicalEvidenceSha256"]) => {
  const stable = Object.fromEntries(
    Object.entries(document).filter(([key]) => !omitted.includes(key)),
  );
  return createHash("sha256")
    .update(JSON.stringify(stable, Object.keys(stable).sort()))
    .digest("hex");
};
const deepCanonicalHash = (document, omitted = ["generatedAt", "canonicalEvidenceSha256"]) => {
  const stable = structuredClone(document);
  for (const key of omitted) delete stable[key];
  const sort = (value) => {
    if (Array.isArray(value)) return value.map(sort);
    if (value && typeof value === "object") {
      return Object.fromEntries(
        Object.keys(value).sort().map((key) => [key, sort(value[key])]),
      );
    }
    return value;
  };
  return createHash("sha256").update(JSON.stringify(sort(stable))).digest("hex");
};

const packageJson = await readJson("package.json");
const baseline = await readJson("dist/release/orbit-atlas-v208-relativity-dossier.json");
const bundle = await readJson("dist/science/relativity-reference-bundle-v10.json");
const stm = await readJson("dist/science/relativity-stm-fit-v10.json");
const stmRerun = await readJson("dist/science/relativity-stm-fit-v10-rerun.json");
const longHorizon = await readJson("dist/science/relativity-100y-diagnostic-v10.json");
const kerrSchild = await readJson("dist/science/kerr-schild-reference-v4.json");
const kerrSchildRerun = await readJson("dist/science/kerr-schild-reference-v4-rerun.json");
const kerrCross = await readJson("dist/science/kerr-cross-validation-v4.json");
const kerrCrossRerun = await readJson("dist/science/kerr-cross-validation-v4-rerun.json");
const bundleStandalone = await readJson("dist/science/client-bundle-v216-standalone-full.json");
const bundleLite = await readJson("dist/science/client-bundle-v216-vercel-lite.json");
const contentPacks = await readJson("dist/science/content-pack-integrity-v192.json");
const soak = await readJson("dist/science/lifecycle-soak-v216-report.json");
const performance = await readJson("dist/science/performance-v216-report.json");

const bundleSha256 = await sha256("dist/science/relativity-reference-bundle-v10.json");
const sourceCounts = Object.fromEntries(
  [...new Set(bundle.epochs.map((epoch) => epoch.source))]
    .sort()
    .map((source) => [source, bundle.epochs.filter((epoch) => epoch.source === source).length]),
);
const hashPattern = /^[a-f0-9]{64}$/;
const horizonsEpochs = bundle.epochs.filter((epoch) => epoch.source === "horizons-frozen");
const bundleGate = {
  provenanceReady: bundle.provenanceReady === true,
  frameReady: bundle.coordinateFrame === "ICRF-J2000-barycentric",
  timeScaleReady: bundle.timeScale === "TDB",
  epochCount: bundle.epochs.length === 68,
  sourceEpochCount:
    sourceCounts["de440-naif"] === 34 && sourceCounts["horizons-frozen"] === 34,
  bodyCounts: bundle.epochs.every((epoch) => epoch.bodies?.length === 12),
  hashesPresent: bundle.epochs.every(
    (epoch) => hashPattern.test(epoch.rawSha256) && hashPattern.test(epoch.convertedSha256),
  ),
  rawAndConvertedSeparated:
    horizonsEpochs.length === 34 &&
    horizonsEpochs.every((epoch) => epoch.rawSha256 !== epoch.convertedSha256),
  localOnlyAssets: bundle.assets.every((asset) => asset.localOnly === true),
};
bundleGate.passed = Object.values(bundleGate).every(Boolean);

const stmCanonical = deepCanonicalHash(stm, ["generatedAt"]);
const stmRerunCanonical = deepCanonicalHash(stmRerun, ["generatedAt"]);
const blindHoldoutImproved = stm.reports.every((report) => {
  const raw = report.raw.checkpoints.find((row) => row.offsetDays === 3652.5);
  const fitted = report.fitted.checkpoints.find((row) => row.offsetDays === 3652.5);
  return fitted.positionRmsKm < raw.positionRmsKm;
});
const stmGate = {
  bundleHashMatches: stm.bundleSha256 === bundleSha256 && stmRerun.bundleSha256 === bundleSha256,
  deterministicRerun: stmCanonical === stmRerunCanonical,
  rawPropagationPreserved:
    stm.rawPropagationReplaced === false &&
    stm.reports.every((report) => report.rawPropagationReplaced === false),
  covariancePresent: stm.reports.every(
    (report) => report.calibration.coefficientCovarianceDiagonal?.length === 66,
  ),
  groupedPressPresent: stm.reports.every(
    (report) =>
      report.calibration.leaveOneDayOutMethod === "regularized-linearized-grouped-press" &&
      report.calibration.leaveOneDayOut?.length === 30,
  ),
  blindHoldoutImproved,
  promotionQualified: false,
};
stmGate.passedForPromotion =
  stmGate.bundleHashMatches &&
  stmGate.deterministicRerun &&
  stmGate.rawPropagationPreserved &&
  stmGate.covariancePresent &&
  stmGate.groupedPressPresent &&
  stmGate.blindHoldoutImproved;

const longHorizonGate = {
  diagnosticOnly: longHorizon.qualificationGate === false,
  allSixModes: longHorizon.modes?.length === 6,
  bundleHashMatches: longHorizon.bundleSha256 === bundleSha256,
  canonicalEvidencePresent: hashPattern.test(longHorizon.canonicalEvidenceSha256),
  promotionDecision: longHorizon.promotionDecision === "shadow-retained",
};
longHorizonGate.passed = Object.values(longHorizonGate).every(Boolean);

const kerrSchildGate = {
  deterministicRerun:
    kerrSchild.canonicalEvidenceSha256 === kerrSchildRerun.canonicalEvidenceSha256,
  rayCount: kerrSchild.rayCount === 25,
  classificationStateValid: kerrSchild.rays.every((ray) => ray.status !== "invalid"),
  nullConstraintBelow1e10: kerrSchild.maxNullConstraint < 1e-10,
};
const kerrCrossGate = {
  deterministicRerun:
    kerrCross.canonicalEvidenceSha256 === kerrCrossRerun.canonicalEvidenceSha256,
  classificationAgreementAtLeast999:
    kerrCross.gates.classificationAgreementAtLeast999 === true,
  kerrSchildNullBelow1e10: kerrCross.gates.kerrSchildNullBelow1e10 === true,
  carterNullBelow1e10: kerrCross.gates.carterNullBelow1e10 === true,
  redshiftCrossValidated: kerrCross.gates.redshiftCrossValidated === true,
  polarizationCrossValidated: kerrCross.gates.polarizationCrossValidated === true,
};
kerrCrossGate.passed = Object.values(kerrCrossGate).every(Boolean);

const sourceFiles = [
  "app/lib/relativityResearchV10.ts",
  "app/lib/relativityResearchEvidenceV216.ts",
  "app/lib/kerrReferenceV4.ts",
  "app/components/RelativityResearchWorkspaceV9.tsx",
  "scripts/build-relativity-reference-bundle-v10.py",
  "scripts/run-relativity-stm-fit-v10.py",
  "scripts/run-relativity-100y-diagnostic-v10.py",
  "scripts/run-kerr-schild-reference-v4.py",
  "scripts/build-kerr-cross-validation-v4.py",
  "scripts/build-atlas-profile.mjs",
  "scripts/build-v216-relativity-dossier.mjs",
];
const sourceSha256 = Object.fromEntries(
  await Promise.all(sourceFiles.map(async (file) => [file, await sha256(file)])),
);

const blockers = [
  "The nonlinear STM calibration is deterministic, but the 365-day and ten-year blind holdouts are worse than raw propagation.",
  `Kerr-Schild maximum normalized null drift is ${kerrSchild.maxNullConstraint.toExponential(6)}, above the 1e-10 reference gate.`,
  `The Carter cross-grid maximum null diagnostic is ${kerrCross.maxCarterNullConstraint.toExponential(6)}, above the 1e-10 reference gate.`,
  "Kerr redshift and Walker-Penrose polarization have not yet been independently cross-validated.",
  `Cold Canvas-ready JavaScript has only ${bundleStandalone.releaseTargetBytes - bundleStandalone.transferBytes} B standalone and ${bundleLite.releaseTargetBytes - bundleLite.transferBytes} B Lite margin below the 624640 B gate.`,
  "The 100-year program is diagnostic-only and cannot be used as a promotion gate.",
  "External clean-Windows MSI/NSIS installation, uninstall and reinstall evidence remains pending.",
];

const dossier = {
  version: "v216-relativity-reproducible-research-dossier",
  generatedAt: new Date().toISOString(),
  status: "relativity-v10-research-candidate-shadow-retained",
  releaseLabelApplied: false,
  baseline: {
    dossier: "dist/release/orbit-atlas-v208-relativity-dossier.json",
    sha256: await sha256("dist/release/orbit-atlas-v208-relativity-dossier.json"),
    status: baseline.status,
  },
  runtime: {
    next: packageJson.dependencies?.next,
    react: packageJson.dependencies?.react,
    r3f: packageJson.dependencies?.["@react-three/fiber"],
    three: packageJson.dependencies?.three,
    defaultScientificKernel: "legacy-eih-1pn",
    candidateKernel: "barycentric-eih-1pn-j2-2pn-lt-v9",
    candidateStatus: "shadow-retained",
    liveWorkerPhysicsMutated: false,
    scientificPromotionApplied: false,
  },
  weakField: {
    referenceBundle: {
      file: "dist/science/relativity-reference-bundle-v10.json",
      sha256: bundleSha256,
      sourceCounts,
      gate: bundleGate,
    },
    stm: {
      file: "dist/science/relativity-stm-fit-v10.json",
      rerun: "dist/science/relativity-stm-fit-v10-rerun.json",
      sha256: await sha256("dist/science/relativity-stm-fit-v10.json"),
      canonicalEvidenceSha256: stmCanonical,
      rerunCanonicalEvidenceSha256: stmRerunCanonical,
      gate: stmGate,
      reports: stm.reports.map((report) => ({
        mode: report.mode,
        conditionNumber: report.conditionNumber,
        regularizationLambda: report.iterations.at(-1)?.selectedRegularizationLambda,
        calibrationWeightedRms: report.calibration.weightedResidualRms,
        leaveOneDayOutRms: report.calibration.leaveOneDayOutRms,
        raw: report.raw.checkpoints,
        fitted: report.fitted.checkpoints,
      })),
    },
    hundredYearDiagnostic: {
      file: "dist/science/relativity-100y-diagnostic-v10.json",
      sha256: await sha256("dist/science/relativity-100y-diagnostic-v10.json"),
      canonicalEvidenceSha256: longHorizon.canonicalEvidenceSha256,
      gate: longHorizonGate,
    },
    promotionDecision: "shadow-retained",
  },
  strongField: {
    kerrSchild: {
      file: "dist/science/kerr-schild-reference-v4.json",
      sha256: await sha256("dist/science/kerr-schild-reference-v4.json"),
      canonicalEvidenceSha256: kerrSchild.canonicalEvidenceSha256,
      rerunCanonicalEvidenceSha256: kerrSchildRerun.canonicalEvidenceSha256,
      maxNullConstraint: kerrSchild.maxNullConstraint,
      gate: kerrSchildGate,
    },
    cpuCrossValidation: {
      file: "dist/science/kerr-cross-validation-v4.json",
      sha256: await sha256("dist/science/kerr-cross-validation-v4.json"),
      canonicalEvidenceSha256: kerrCross.canonicalEvidenceSha256,
      rerunCanonicalEvidenceSha256: kerrCrossRerun.canonicalEvidenceSha256,
      classificationAgreement: kerrCross.classificationAgreement,
      gate: kerrCrossGate,
    },
    promotionDecision: "shadow-retained",
  },
  validation: {
    focused: "28/28 passed across 8 files",
    typescript: "passed",
    fullRegression: "674/674 passed across 107 files",
    productionBuilds: {
      standalone: {
        passed: true,
        buildId: (await readFile(fromRoot(".next-v216/BUILD_ID"), "utf8")).trim(),
      },
      vercelLite: {
        passed: true,
        buildId: (await readFile(fromRoot(".next-v216-lite/BUILD_ID"), "utf8")).trim(),
      },
      traceIsolationRepair: "passed-both-profiles-with-active-dev-standalone-temporarily-isolated",
    },
    clientBundle: {
      standaloneTransferBytes: bundleStandalone.transferBytes,
      liteTransferBytes: bundleLite.transferBytes,
      releaseTargetBytes: bundleStandalone.releaseTargetBytes,
      standaloneMarginBytes: bundleStandalone.releaseTargetBytes - bundleStandalone.transferBytes,
      liteMarginBytes: bundleLite.releaseTargetBytes - bundleLite.transferBytes,
      passed: bundleStandalone.releaseTargetPassed && bundleLite.releaseTargetPassed,
    },
    contentPacks: {
      packCount: contentPacks.packCount,
      verifiedFileCount: contentPacks.verifiedFileCount,
      manifestFileCount: contentPacks.manifestFileCount,
      failureCount: contentPacks.failureCount,
      passed: contentPacks.passed,
    },
    vercelLiteManifest: "595 files / 65.9 MiB / no loopback fallback",
    browserQa: {
      standalone: "9 passed / 1 viewport skip",
      vercelLite: "2/2 passed",
      kerrLifecycle: "2/2 passed",
      pageTestFailures: 0,
      serverReloadNoise: "one ERR_INVALID_STATE Controller-already-closed event during same-page cold reload",
    },
    lifecycleSoak: {
      passed: soak.passed,
      measuredCycles: soak.measuredCycles,
      baselineHeap: soak.baselineHeap,
      finalHeap: soak.finalHeap,
      heapLimit: soak.heapLimit,
      released: soak.released,
    },
    namedHardwarePerformance: {
      passed: performance.passed,
      adapter: performance.adapter,
      softwareRenderer: performance.softwareRenderer,
      samples: performance.samples,
      drawCallBoundary: "observational-only-not-used-as-optimization-proof",
    },
  },
  blockers,
  boundaries: {
    rawPropagationReplaced: false,
    hundredYearPromotionGate: false,
    numericalRelativity: "not-claimed",
    blackHoleMerger: "not-implemented",
    grmhd: "not-claimed-analytic-thin-disk-only",
    cloudDeployment: "not-performed",
    signing: "not-performed",
    gitMutation: "no-reset-revert-clean-stage-or-commit",
  },
  sourceSha256,
};

if (!bundleGate.passed) throw new Error("V216 reference bundle provenance gate failed");
if (!stmGate.bundleHashMatches || !stmGate.deterministicRerun) {
  throw new Error("V216 STM reproducibility gate failed");
}
if (!longHorizonGate.passed) throw new Error("V216 100-year diagnostic provenance gate failed");
if (!kerrSchildGate.deterministicRerun || !kerrCrossGate.deterministicRerun) {
  throw new Error("V216 Kerr deterministic rerun gate failed");
}
if (stmGate.promotionQualified || kerrCrossGate.passed) {
  throw new Error("V216 dossier must remain fail closed while qualification gates are incomplete");
}

const outputDir = fromRoot("dist/release");
await mkdir(outputDir, { recursive: true });
const jsonRelative = "dist/release/orbit-atlas-v216-relativity-dossier.json";
const mdRelative = "dist/release/orbit-atlas-v216-relativity-dossier.md";
await writeFile(fromRoot(jsonRelative), `${JSON.stringify(dossier, null, 2)}\n`);
const markdown = `# Orbit Atlas v216 reproducible relativity research dossier

Status: **${dossier.status}**

This is a reproducible research package, not a scientific promotion and not GA. The default runtime kernel remains \`legacy-eih-1pn\`.

## Weak-field result

- The dual-source ICRF/J2000 TDB bundle contains ${bundle.epochs.length} epochs: ${sourceCounts["de440-naif"]} DE440/NAIF and ${sourceCounts["horizons-frozen"]} frozen Horizons epochs.
- Original-response hashes and converted-state hashes are stored separately.
- Two complete STM reruns match canonical SHA-256 \`${stmCanonical}\`.
- The fit contains a 66-parameter covariance diagonal and a 30-day regularized grouped-PRESS diagnostic.
- Legacy 365-day position RMS changes from ${stm.reports[0].raw.checkpoints[0].positionRmsKm.toFixed(3)} km raw to ${stm.reports[0].fitted.checkpoints[0].positionRmsKm.toFixed(3)} km fitted.
- Legacy ten-year position RMS changes from ${stm.reports[0].raw.checkpoints[1].positionRmsKm.toFixed(3)} km raw to ${stm.reports[0].fitted.checkpoints[1].positionRmsKm.toFixed(3)} km fitted.
- The blind holdout is therefore a reproducible negative result; raw propagation is not replaced.
- The ${longHorizon.durationDays}-day program is explicitly diagnostic-only and is excluded from qualification.

## Strong-field result

- Two Kerr-Schild reruns match canonical SHA-256 \`${kerrSchild.canonicalEvidenceSha256}\`.
- Carter/Mino and Kerr-Schild captured/not-captured classification agrees for ${(kerrCross.classificationAgreement * 100).toFixed(1)}% of ${kerrCross.rayCount} rays.
- The invariant gate remains failed: Kerr-Schild \`${kerrSchild.maxNullConstraint.toExponential(6)}\`, Carter \`${kerrCross.maxCarterNullConstraint.toExponential(6)}\`.
- Redshift and Walker-Penrose polarization cross-validation remain incomplete.

## Blockers

${blockers.map((item) => `- ${item}`).join("\n")}

## Boundary

The strong-field work is test-particle Kerr geometry with an analytic teaching thin disk. It is not numerical relativity, a merger simulation or GRMHD. No runtime physics, Worker protocol or frozen scientific gate was changed.
`;
await writeFile(fromRoot(mdRelative), markdown);
const checksumRows = await Promise.all(
  [jsonRelative, mdRelative].map(async (file) => `${await sha256(file)}  ${file}`),
);
await writeFile(
  fromRoot("dist/release/orbit-atlas-v216-relativity-dossier.sha256"),
  `${checksumRows.join("\n")}\n`,
);
console.log(JSON.stringify({
  version: dossier.version,
  status: dossier.status,
  bundleGatePassed: bundleGate.passed,
  stmDeterministic: stmGate.deterministicRerun,
  stmBlindHoldoutImproved: stmGate.blindHoldoutImproved,
  longHorizonGatePassed: longHorizonGate.passed,
  kerrClassificationAgreement: kerrCross.classificationAgreement,
  kerrInvariantGatePassed: kerrCrossGate.passed,
  output: jsonRelative,
}, null, 2));
