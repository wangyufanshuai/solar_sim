import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import { dirname, resolve } from "node:path";
import {
  MEASURED_AUTHORITY_MISSING_IDS_V379,
  parseMeasuredAuthorityReadinessMatrixV379,
  type MeasuredAuthorityReadinessEntryV379,
} from "../app/lib/measuredAuthorityReadinessV379";

const root = process.cwd();
const output = "dist/science/measured-authority-readiness-v379/readiness.json";
const consumerSource = "scripts/build-measured-expectation-v375.ts" as const;
const definitions = [
  { id: "v367-detector-admission", label: "Detector admission", lane: "detector", path: "dist/science/detector-calibration-v367/admission.json", maximumBytes: 512 * 1024, pathKey: "detectorAdmission", schemaSource: "app/lib/detectorResponseAuthorityGateV368.ts", schemaSymbol: "parseDetectorCalibrationAuthorityEnvelopeV367", producerCommand: "npm run atlas -- relativity detector-calibration-v367-admit", validatorCommands: ["npm run atlas -- relativity detector-calibration-v367-inspect", "npm run atlas -- relativity detector-response-v368-inspect"] },
  { id: "v367-detector-authority-pointer", label: "Detector authority pointer", lane: "detector", path: "dist/release/orbit-atlas-detector-calibration-authority-v367.json", maximumBytes: 64 * 1024, pathKey: "detectorPointer", schemaSource: "app/lib/detectorResponseAuthorityGateV368.ts", schemaSymbol: "parseDetectorCalibrationAuthorityPointerV367", producerCommand: "npm run atlas -- relativity detector-calibration-v367-admit", validatorCommands: ["npm run atlas -- relativity detector-response-v368-inspect"] },
  { id: "v361-detector-manifest", label: "Measured detector manifest", lane: "detector", path: "dist/staging/detector-calibration-v361/manifest.json", maximumBytes: 1024 * 1024, pathKey: "detectorManifest", schemaSource: "app/lib/detectorCalibrationAdmissionV361.ts", schemaSymbol: "parseDetectorCalibrationManifestV361", producerCommand: "manual measured import; npm run atlas -- relativity detector-calibration-v361-inspect", validatorCommands: ["npm run atlas -- relativity detector-calibration-v366-inspect", "npm run atlas -- relativity detector-calibration-v367-inspect"] },
  { id: "v373-geometry-admission", label: "Geometry admission", lane: "geometry", path: "dist/science/observation-geometry-v373/admission.json", maximumBytes: 256 * 1024, pathKey: "geometryAdmission", schemaSource: "app/lib/measuredExpectationAuthorityV375.ts", schemaSymbol: "validateMeasuredGeometryAuthorityChainV375", producerCommand: "npm run atlas -- relativity observation-geometry-v373-admit", validatorCommands: ["npm run atlas -- relativity observation-geometry-v373-inspect", "npm run atlas -- relativity observation-geometry-v374-inspect"] },
  { id: "v373-geometry-authority-pointer", label: "Geometry authority pointer", lane: "geometry", path: "dist/release/orbit-atlas-observation-geometry-authority-v373.json", maximumBytes: 64 * 1024, pathKey: "geometryPointer", schemaSource: "app/lib/measuredExpectationAuthorityV375.ts", schemaSymbol: "validateMeasuredGeometryAuthorityChainV375", producerCommand: "npm run atlas -- relativity observation-geometry-v373-admit", validatorCommands: ["npm run atlas -- relativity observation-geometry-v374-inspect"] },
  { id: "v374-geometry-publication-receipt", label: "Geometry publication receipt", lane: "geometry", path: "dist/science/observation-geometry-v374/publication.json", maximumBytes: 256 * 1024, pathKey: "geometryReceipt", schemaSource: "app/lib/measuredExpectationAuthorityV375.ts", schemaSymbol: "ObservationGeometryPublicationReceiptV375", producerCommand: "npm run atlas -- relativity observation-geometry-v374-publish", validatorCommands: ["npm run atlas -- relativity measured-expectation-v375-inspect"] },
  { id: "v369-runtime-observation-geometry", label: "Runtime observation geometry", lane: "geometry", path: "dist/staging/detector-calibration-v369/observation-geometry.json", maximumBytes: 64 * 1024, pathKey: "geometry", schemaSource: "app/lib/measuredPhotonExpectationV369.ts", schemaSymbol: "parseMeasuredObservationGeometryV369", producerCommand: "npm run atlas -- relativity observation-geometry-v374-publish", validatorCommands: ["npm run atlas -- relativity measured-expectation-v369-inspect", "npm run atlas -- relativity measured-expectation-v375-inspect"] },
] as const;
const bytes = (path: string) => readFileSync(resolve(root, path));
const read = (path: string) => JSON.parse(bytes(path).toString("utf8"));
const fileSha = (path: string) =>
  createHash("sha256").update(bytes(path)).digest("hex");
const canonicalize = (value: unknown): unknown =>
  Array.isArray(value)
    ? value.map(canonicalize)
    : !value || typeof value !== "object"
      ? value
      : Object.fromEntries(
          Object.entries(value as Record<string, unknown>)
            .filter(
              ([key]) =>
                !["generatedAt", "artifactSha256", "pointerSha256"].includes(key),
            )
            .sort(([left], [right]) => left.localeCompare(right))
            .map(([key, entry]) => [key, canonicalize(entry)]),
        );
const sha = (value: unknown) =>
  createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");

const topology = read("dist/science/measurement-authority-topology-v378/topology.json");
const dense = read("dist/science/kerr-campaign-v314/campaign-state.json");
const formal = read("dist/release/orbit-atlas-current-product-evidence-v263.json");
const formalEvidence = read(formal.source);
const missingIds = topology.nodes
  .filter((node: { status: string }) => node.status === "missing")
  .map((node: { id: string }) => node.id);
if (
  topology.status !==
    "provenance-topology-qualified-inputs-partial-1-of-8-image-unavailable" ||
  JSON.stringify(missingIds) !== JSON.stringify(MEASURED_AUTHORITY_MISSING_IDS_V379) ||
  topology.presentInputCount !== 1 ||
  topology.boundaries?.observedCountsNodeExists !== false ||
  dense.status !== "incomplete-0-of-49" ||
  dense.completedShardCount !== 0 ||
  dense.attemptConsumed !== false ||
  formal.version !== "v263-current-product-evidence-pointer" ||
  formalEvidence.science?.defaultKernel !== "legacy-eih-1pn" ||
  formalEvidence.contracts?.workerPhysicsMutation !== "not-applied" ||
  formalEvidence.contracts?.singleCanvas !== true
) {
  throw new Error("v379-readiness-source-boundary");
}
const boundedSource = bytes(consumerSource).toString("utf8");
if (
  !boundedSource.includes("assertMeasuredAuthorityInputSizeV380") ||
  !boundedSource.includes("MAXIMUM_BYTES_BY_PATH")
) {
  throw new Error("v379-bounded-consumer-missing");
}
const boundedConsumerSourceFileSha256 = fileSha(consumerSource);
const entries: MeasuredAuthorityReadinessEntryV379[] = definitions.map(
  (definition) => {
    if (existsSync(resolve(root, definition.path))) {
      throw new Error(`v379-unexpected-present-input:${definition.id}`);
    }
    const schemaSource = bytes(definition.schemaSource).toString("utf8");
    if (
      !schemaSource.includes(definition.schemaSymbol) ||
      !boundedSource.includes(
        `[paths.${definition.pathKey}]: ${definition.maximumBytes / 1024} * 1024`,
      )
    ) {
      throw new Error(`v379-contract-source-mismatch:${definition.id}`);
    }
    return Object.freeze({
      id: definition.id,
      label: definition.label,
      lane: definition.lane,
      path: definition.path,
      maximumBytes: definition.maximumBytes,
      present: false as const,
      schemaSource: definition.schemaSource,
      schemaSymbol: definition.schemaSymbol,
      schemaSourceFileSha256: fileSha(definition.schemaSource),
      boundedConsumerSource: consumerSource,
      boundedConsumerSourceFileSha256,
      producerCommand: definition.producerCommand,
      validatorCommands: definition.validatorCommands,
      schemaContractQualified: true as const,
      boundedReadQualified: true as const,
      fileSha256Required: true as const,
      canonicalSha256Required: true as const,
      instrumentIdentityRequired: true as const,
      independentValidationRequired: true as const,
      automaticRetryAllowed: false as const,
      automaticPromotionAllowed: false as const,
      readiness: "contract-qualified-input-missing" as const,
      failurePropagation: [
        "v375-envelope-withheld",
        "v376-image-withheld",
        "observed-counts-unavailable",
      ] as const,
    });
  },
);
const unsigned = {
  version: "v379-measured-authority-readiness-matrix-v1" as const,
  generatedAt: new Date().toISOString(),
  status: "readiness-matrix-qualified-contracts-7-of-7-inputs-0-of-7" as const,
  expectedMissingInputCount: 7 as const,
  presentInputCount: 0 as const,
  missingInputCount: 7 as const,
  schemaContractQualifiedCount: 7 as const,
  boundedReadQualifiedCount: 7 as const,
  photonAuthorityQualified: true as const,
  entries,
  downstream: {
    v375EnvelopeAvailable: false as const,
    v376ScienceImageAvailable: false as const,
    observedCountsAvailable: false as const,
    zeroImageFallbackAllowed: false as const,
    syntheticFallbackAllowed: false as const,
  },
  attemptConsumed: false as const,
  networkAttempted: false as const,
  formalProductPointer: "v263" as const,
  denseCampaignStatus: "incomplete-0-of-49" as const,
  browserQualification: "not-run" as const,
};
const artifact = parseMeasuredAuthorityReadinessMatrixV379({
  ...unsigned,
  artifactSha256: sha(unsigned),
});
const target = resolve(root, output);
mkdirSync(dirname(target), { recursive: true });
const temporary = `${target}.${process.pid}.part`;
writeFileSync(temporary, `${JSON.stringify(artifact, null, 2)}\n`);
renameSync(temporary, target);
console.log(
  JSON.stringify(
    {
      status: artifact.status,
      artifactSha256: artifact.artifactSha256,
      contracts: `${artifact.schemaContractQualifiedCount}/${artifact.expectedMissingInputCount}`,
      bounded: `${artifact.boundedReadQualifiedCount}/${artifact.expectedMissingInputCount}`,
      inputs: `${artifact.presentInputCount}/${artifact.expectedMissingInputCount}`,
      downstream: artifact.downstream,
      dense: artifact.denseCampaignStatus,
    },
    null,
    2,
  ),
);
