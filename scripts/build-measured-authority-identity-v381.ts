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
  createMeasuredAuthorityIdentityLanesV381,
  parseMeasuredAuthorityIdentityAuditV381,
} from "../app/lib/measuredAuthorityIdentityAuditV381";
import { parseMeasuredAuthorityReadinessMatrixV379 } from "../app/lib/measuredAuthorityReadinessV379";

const root = process.cwd();
const output = "dist/science/measured-authority-identity-v381/audit.json";
const readinessPath =
  "dist/science/measured-authority-readiness-v379/readiness.json";
const sourcePaths = {
  v320BandDefinitions: "app/lib/kerrThinDiskBandImagingV320.ts",
  v361DetectorManifestContract: "app/lib/detectorCalibrationAdmissionV361.ts",
  v369MeasuredExpectationOperator: "app/lib/measuredPhotonExpectationV369.ts",
  v375DualAuthorityContract: "app/lib/measuredExpectationAuthorityV375.ts",
} as const;
const shaBytes = (value: Uint8Array | string) =>
  createHash("sha256").update(value).digest("hex");
const canonicalize = (value: unknown): unknown =>
  Array.isArray(value)
    ? value.map(canonicalize)
    : !value || typeof value !== "object"
      ? value
      : Object.fromEntries(
          Object.entries(value as Record<string, unknown>)
            .filter(
              ([key]) =>
                !["generatedAt", "artifactSha256", "pointerSha256"].includes(
                  key,
                ),
            )
            .sort(([left], [right]) => left.localeCompare(right))
            .map(([key, entry]) => [key, canonicalize(entry)]),
        );
const canonicalSha = (value: unknown) =>
  shaBytes(JSON.stringify(canonicalize(value)));
const readBounded = (path: string, maximumBytes: number) => {
  const target = resolve(root, path);
  const metadata = statSync(target);
  if (!metadata.isFile() || metadata.size <= 0 || metadata.size > maximumBytes) {
    throw new Error(`v381-input-size:${path}`);
  }
  return readFileSync(target);
};

const readinessBytes = readBounded(readinessPath, 128 * 1024);
const readiness = parseMeasuredAuthorityReadinessMatrixV379(
  JSON.parse(readinessBytes.toString("utf8")),
);
if (
  canonicalSha(readiness) !== readiness.artifactSha256 ||
  readiness.schemaContractQualifiedCount !== 7 ||
  readiness.boundedReadQualifiedCount !== 7 ||
  readiness.presentInputCount !== 0 ||
  readiness.missingInputCount !== 7
) {
  throw new Error("v381-readiness-boundary");
}

const sourceSha256 = Object.fromEntries(
  Object.entries(sourcePaths).map(([key, path]) => [
    key,
    shaBytes(readBounded(path, 512 * 1024)),
  ]),
) as Record<keyof typeof sourcePaths, string>;
const unsigned = {
  version: "v381-measured-authority-identity-audit-v1" as const,
  generatedAt: new Date().toISOString(),
  status:
    "identity-model-corrected-three-band-lanes-ready-inputs-0-of-3" as const,
  legacyModel: Object.freeze({
    readinessArtifactSha256: readiness.artifactSha256,
    readinessStructuralContractsQualified: "7/7" as const,
    measuredInputsPresent: "0/7" as const,
    singleManifestBandCount: 3 as const,
    singleGeometryIdentityCount: 1 as const,
    scientificFusionEligibility:
      "withdrawn-single-instrument-three-band-identity-not-demonstrated" as const,
    historicalArtifactsMutated: false as const,
  }),
  correctedModel: Object.freeze({
    authorityUnit: "detector-response-plus-geometry-per-band" as const,
    bandLaneCount: 3 as const,
    qualifiedBandLaneCount: 0 as const,
    sameBandInstrumentIdentityRequired: true as const,
    crossBandInstrumentIdentityRequired: false as const,
    allBandsRequiredForThreeBandImage: true as const,
    partialBandScienceAllowed: false as const,
    observedCountsAvailable: false as const,
  }),
  lanes: createMeasuredAuthorityIdentityLanesV381(),
  sourceSha256: Object.freeze(sourceSha256),
  findings: Object.freeze([
    "v361-binds-visible-euv-soft-x-ray-to-one-instrument-manifest",
    "v369-v375-bind-all-three-bands-to-one-observation-geometry-identity",
    "real-authority-requires-per-band-detector-and-matching-geometry",
  ] as const),
  nextRequiredInput:
    "one-traceable-measured-detector-and-geometry-pair-for-one-band" as const,
  authorityPromotionAllowed: false as const,
  syntheticFallbackUsed: false as const,
  sciencePayloadMutationAllowed: false as const,
  cinematicConsumerAllowed: false as const,
  attemptConsumed: false as const,
  networkAttempted: false as const,
  formalProductPointer: "v263" as const,
  denseCampaignStatus: "incomplete-0-of-49" as const,
  browserQualification: "not-run" as const,
};
const artifact = parseMeasuredAuthorityIdentityAuditV381({
  ...unsigned,
  artifactSha256: canonicalSha(unsigned),
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
      historicalStructuralReadiness:
        artifact.legacyModel.readinessStructuralContractsQualified,
      scientificFusionEligibility:
        artifact.legacyModel.scientificFusionEligibility,
      correctedBandLanes: `${artifact.correctedModel.qualifiedBandLaneCount}/${artifact.correctedModel.bandLaneCount}`,
      nextRequiredInput: artifact.nextRequiredInput,
    },
    null,
    2,
  ),
);
