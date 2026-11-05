import { createHash } from "node:crypto";
import {
  mkdirSync,
  readFileSync,
  renameSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, resolve } from "node:path";
import {
  createKerrGlobalCovarianceControlFixtureV394,
  parseKerrGlobalCovariancePropagationArtifactV394,
} from "../app/lib/kerrGlobalCovariancePropagationV394";
import {
  createKerrGlobalObservabilityAdversarialFixturesV395,
  createKerrGlobalObservabilityBundleV395,
  decomposeKerrNuisanceModeV395,
  parseKerrGlobalObservabilityArtifactV395,
  validateKerrGlobalObservabilityBundleV395,
  V395_ORACLE_RELATIVE_LIMIT,
} from "../app/lib/kerrGlobalObservabilityV395";
import { parseKerrPhysicalCovarianceAdmissionArtifactV392 } from "../app/lib/kerrPhysicalCovarianceAdmissionV392";
import { parseKerrCovarianceSourceAdmissionArtifactV393 } from "../app/lib/kerrCovarianceSourceDossierV393";
import { parseKerrTemperatureSystematicsTransferArtifactV390 } from "../app/lib/kerrTemperatureSystematicsTransferV390";

const root = process.cwd();
const paths = {
  transfer:
    "dist/science/kerr-temperature-systematics-transfer-v390/transfer-operator.json",
  admission:
    "dist/science/kerr-physical-covariance-admission-v392/covariance-admission.json",
  dossier:
    "dist/science/kerr-covariance-source-admission-v393/source-admission.json",
  global:
    "dist/science/kerr-global-covariance-propagation-v394/global-propagation.json",
  oracle:
    "dist/science/kerr-global-observability-v395/python-oracle.json",
  artifact:
    "dist/science/kerr-global-observability-v395/observability.json",
} as const;
const shaBytes = (value: Uint8Array | string) =>
  createHash("sha256").update(value).digest("hex");
const SHA256 = /^[a-f0-9]{64}$/;
const canonicalize = (value: unknown): unknown =>
  Array.isArray(value)
    ? value.map(canonicalize)
    : !value || typeof value !== "object"
      ? value
      : Object.fromEntries(
          Object.entries(value as Record<string, unknown>)
            .filter(([key]) => !["generatedAt", "artifactSha256"].includes(key))
            .sort(([left], [right]) => left.localeCompare(right))
            .map(([key, entry]) => [key, canonicalize(entry)]),
        );
const canonicalSha = (value: unknown) =>
  shaBytes(JSON.stringify(canonicalize(value)));
const bounded = (path: string, maximumBytes: number) => {
  const target = resolve(root, path);
  const metadata = statSync(target);
  if (!metadata.isFile() || metadata.size <= 0 || metadata.size > maximumBytes) {
    throw new Error(`v395-input-size:${path}`);
  }
  return readFileSync(target);
};
const atomicText = (path: string, value: string) => {
  const target = resolve(root, path);
  mkdirSync(dirname(target), { recursive: true });
  const temporary = `${target}.${process.pid}.part`;
  writeFileSync(temporary, value);
  renameSync(temporary, target);
};
const relativeDifference = (left: number, right: number) =>
  Math.abs(left - right) /
  Math.max(Number.MIN_VALUE, Math.abs(left), Math.abs(right));

const transfer = parseKerrTemperatureSystematicsTransferArtifactV390(
  JSON.parse(bounded(paths.transfer, 128 * 1024).toString("utf8")),
);
const admission = parseKerrPhysicalCovarianceAdmissionArtifactV392(
  JSON.parse(bounded(paths.admission, 128 * 1024).toString("utf8")),
);
const dossier = parseKerrCovarianceSourceAdmissionArtifactV393(
  JSON.parse(bounded(paths.dossier, 128 * 1024).toString("utf8")),
);
const global = parseKerrGlobalCovariancePropagationArtifactV394(
  JSON.parse(bounded(paths.global, 128 * 1024).toString("utf8")),
);
if (
  global.source.v390TransferArtifactSha256 !== transfer.artifactSha256 ||
  global.source.v392AdmissionArtifactSha256 !== admission.artifactSha256 ||
  global.source.v393SourceAdmissionArtifactSha256 !== dossier.artifactSha256
) {
  throw new Error("v395-source-identity");
}
const oracle = JSON.parse(bounded(paths.oracle, 512 * 1024).toString("utf8"));
if (
  oracle.version !== "v395-kerr-global-observability-python-oracle-v1" ||
  oracle.status !== "qualified-independent-global-observability-oracle" ||
  oracle.source?.v390TransferArtifactSha256 !== transfer.artifactSha256 ||
  oracle.source?.v394GlobalCovarianceArtifactSha256 !== global.artifactSha256 ||
  oracle.rank !== 24 ||
  oracle.nullity !== 12 ||
  oracle.jacobian?.length !== 24 ||
  oracle.pseudoinverse?.length !== 36 ||
  oracle.nullBasis?.length !== 12 ||
  oracle.observableProjector?.length !== 36 ||
  oracle.nullProjector?.length !== 36 ||
  oracle.singularValues?.length !== 24 ||
  oracle.syntheticModeDecompositions?.length !== 3 ||
  oracle.physicalNuisanceModesAvailable !== false ||
  oracle.physicalModeAttributionExecuted !== false ||
  oracle.probabilityContentAssigned !== false ||
  oracle.networkAttempted !== false ||
  !SHA256.test(oracle.artifactSha256 ?? "")
) {
  throw new Error("v395-oracle-identity");
}

const bundle = createKerrGlobalObservabilityBundleV395(transfer, global);
const validation = validateKerrGlobalObservabilityBundleV395(
  bundle,
  transfer,
  global,
);
if (validation.status !== "qualified" || validation.rejectionReasons.length !== 0) {
  throw new Error("v395-control-validation");
}
let maximumPythonOracleRelativeDifference = 0;
const compareMatrix = (
  left: readonly (readonly number[])[],
  right: readonly (readonly number[])[],
  label: string,
) => {
  for (let row = 0; row < left.length; row += 1) {
    for (let column = 0; column < left[row].length; column += 1) {
      const difference = relativeDifference(left[row][column], Number(right?.[row]?.[column]));
      if (!Number.isFinite(difference) || difference >= V395_ORACLE_RELATIVE_LIMIT) {
        throw new Error(`v395-oracle-difference:${label}:${row}:${column}:${difference}`);
      }
      maximumPythonOracleRelativeDifference = Math.max(
        maximumPythonOracleRelativeDifference,
        difference,
      );
    }
  }
};
compareMatrix(bundle.jacobian, oracle.jacobian, "jacobian");
compareMatrix(bundle.pseudoinverse, oracle.pseudoinverse, "pseudoinverse");
compareMatrix(bundle.nullBasis, oracle.nullBasis, "null-basis");
compareMatrix(
  bundle.observableProjector,
  oracle.observableProjector,
  "observable-projector",
);
compareMatrix(bundle.nullProjector, oracle.nullProjector, "null-projector");
for (let index = 0; index < bundle.singularValues.length; index += 1) {
  maximumPythonOracleRelativeDifference = Math.max(
    maximumPythonOracleRelativeDifference,
    relativeDifference(bundle.singularValues[index], Number(oracle.singularValues[index])),
  );
}
const globalControl = createKerrGlobalCovarianceControlFixtureV394(
  transfer,
  admission,
  dossier,
);
const syntheticModes = globalControl.nuisanceModes.map((mode) =>
  decomposeKerrNuisanceModeV395(mode.modeId, mode.loadings, bundle),
);
for (const mode of syntheticModes) {
  const oracleMode = oracle.syntheticModeDecompositions.find(
    (candidate: { modeId?: unknown }) => candidate.modeId === mode.modeId,
  );
  if (!oracleMode) throw new Error("v395-oracle-mode");
  maximumPythonOracleRelativeDifference = Math.max(
    maximumPythonOracleRelativeDifference,
    relativeDifference(mode.observableFraction, Number(oracleMode.observableFraction)),
    relativeDifference(mode.nullFraction, Number(oracleMode.nullFraction)),
    relativeDifference(mode.reconstructionResidual, Number(oracleMode.reconstructionResidual)),
  );
}
if (maximumPythonOracleRelativeDifference >= V395_ORACLE_RELATIVE_LIMIT) {
  throw new Error("v395-oracle-maximum");
}
const adversarialFixtures = createKerrGlobalObservabilityAdversarialFixturesV395(
  transfer,
  global,
).map((fixture) => {
  const result = validateKerrGlobalObservabilityBundleV395(
    fixture.value,
    transfer,
    global,
  );
  if (
    result.status !== "rejected" ||
    !result.rejectionReasons.includes(fixture.expectedReason)
  ) {
    throw new Error(`v395-adversarial-fixture:${fixture.id}`);
  }
  return Object.freeze({
    id: fixture.id,
    expectedReason: fixture.expectedReason,
    observedReason: fixture.expectedReason,
    rejected: true as const,
  });
});
if (adversarialFixtures.length !== 8) throw new Error("v395-adversarial-count");
const maximumConditionNumber =
  Math.max(...bundle.singularValues) / Math.min(...bundle.singularValues);

const unsigned = {
  version: "v395-kerr-global-observability-v1" as const,
  generatedAt: new Date().toISOString(),
  status:
    "global-jacobian-observability-qualified-physical-mode-attribution-unavailable" as const,
  source: Object.freeze({
    v390TransferArtifactSha256: transfer.artifactSha256,
    v394GlobalCovarianceArtifactSha256: global.artifactSha256,
    fullShortAuthoritySha256: transfer.source.fullShortAuthoritySha256,
  }),
  dimensions: Object.freeze({
    inputDimension: 36 as const,
    outputDimension: 24 as const,
    rank: 24 as const,
    nullity: 12 as const,
    pseudoinverseCoefficientCount: 864 as const,
    observableProjectorCoefficientCount: 1296 as const,
    nullProjectorCoefficientCount: 1296 as const,
  }),
  structure: Object.freeze({
    nullDirectionPerRow: "normalized-[1,photon-transfer,0]" as const,
    nullMeaning:
      "joint-photon-redshift-perturbation-preserving-conditioned-temperature" as const,
    pageThorneFluxInNullDirection: false as const,
    blockCount: 12 as const,
    singularValueCount: 24 as const,
    maximumConditionNumber,
  }),
  validator: Object.freeze({
    qualified: true as const,
    acceptedControlFixtureCount: 1 as const,
    rejectedAdversarialFixtureCount: 8 as const,
    adversarialFixtures: Object.freeze(adversarialFixtures),
  }),
  residuals: Object.freeze({
    maximumNullResidual: validation.maxima.nullResidual,
    maximumNullOrthonormalityResidual:
      validation.maxima.nullOrthonormalityResidual,
    maximumPenroseResidual: validation.maxima.penroseResidual,
    maximumProjectorResidual: validation.maxima.projectorResidual,
    maximumProjectorComplementResidual:
      validation.maxima.projectorComplementResidual,
    maximumPythonOracleRelativeDifference,
  }),
  syntheticModeAudit: Object.freeze({
    fixtureClass: "synthetic-validation-fixture" as const,
    publishable: false as const,
    modeCount: 3 as const,
    modes: Object.freeze(syntheticModes),
  }),
  productionAdmission: Object.freeze({
    physicalNuisanceModesAvailable: false as const,
    physicalModeAttributionExecuted: false as const,
    nullspacePriorAssigned: false as const,
    unobservableDirectionsTreatedAsZero: false as const,
    probabilityContentAssigned: false as const,
    confidenceInterval: false as const,
    absoluteScientificInterval: null,
  }),
  qualification: Object.freeze({
    structuralObservabilityQualified: true as const,
    analyticPseudoinverseQualified: true as const,
    nullspaceBasisQualified: true as const,
    physicalModeAttributionQualified: false as const,
    absoluteScientificIntervalQualified: false as const,
    absoluteTemperatureAuthorityGranted: false as const,
    measuredAuthorityGranted: false as const,
    scienceImageAvailable: false as const,
  }),
  networkAttempted: false as const,
  sciencePayloadMutationAllowed: false as const,
  cinematicConsumerAllowed: false as const,
  formalProductPointer: "v263" as const,
  denseCampaignStatus: "incomplete-0-of-49" as const,
  browserQualification: "not-run" as const,
};
const artifact = parseKerrGlobalObservabilityArtifactV395({
  ...unsigned,
  artifactSha256: canonicalSha(unsigned),
});
atomicText(paths.artifact, `${JSON.stringify(artifact, null, 2)}\n`);
console.log(
  JSON.stringify(
    {
      status: artifact.status,
      artifactSha256: artifact.artifactSha256,
      rank: artifact.dimensions.rank,
      nullity: artifact.dimensions.nullity,
      maximumConditionNumber: artifact.structure.maximumConditionNumber,
      maximumResidual: Math.max(
        artifact.residuals.maximumNullResidual,
        artifact.residuals.maximumNullOrthonormalityResidual,
        artifact.residuals.maximumPenroseResidual,
        artifact.residuals.maximumProjectorResidual,
        artifact.residuals.maximumProjectorComplementResidual,
      ),
      maximumPythonOracleRelativeDifference:
        artifact.residuals.maximumPythonOracleRelativeDifference,
      physicalNuisanceModesAvailable:
        artifact.productionAdmission.physicalNuisanceModesAvailable,
      physicalModeAttributionExecuted:
        artifact.productionAdmission.physicalModeAttributionExecuted,
    },
    null,
    2,
  ),
);
