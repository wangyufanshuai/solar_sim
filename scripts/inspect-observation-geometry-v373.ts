import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, resolve } from "node:path";
import {
  OBSERVATION_GEOMETRY_AUTHORITY_INPUTS_V373,
  parseObservationGeometryAuthorityInspectV373,
} from "../app/lib/observationGeometryAuthorityInspectV373";
import {
  parseObservationGeometryCollectingAreaCsvV371,
  parseObservationGeometryIdentityV371,
  parseObservationGeometryPlateScaleCsvV371,
  parseObservationGeometryProvenanceV371,
} from "../app/lib/observationGeometryCompilerV371";
import {
  createObservationGeometryCandidateShaV372,
  type ObservationGeometryCandidateV372,
  type ObservationGeometryCompiledArtifactV372,
} from "../app/lib/observationGeometryValidationV372";
import type { ObservationGeometryValidationArtifactV373 } from "../app/lib/observationGeometryAuthorityAdmissionV373";

const root = process.cwd();
const output = "dist/science/observation-geometry-v373/inspect.json";
const inputs = [
  {
    id: "v371-compiled-artifact",
    path: "dist/science/observation-geometry-v371/compiled.json",
    maximumBytes: 256 * 1024,
  },
  {
    id: "v371-geometry-candidate",
    path: "dist/science/observation-geometry-v371/geometry.candidate.json",
    maximumBytes: 128 * 1024,
  },
  {
    id: "v372-validation-artifact",
    path: "dist/science/observation-geometry-v372/validation.json",
    maximumBytes: 256 * 1024,
  },
  {
    id: "identity-json",
    path: "dist/staging/observation-geometry-v371/identity.json",
    maximumBytes: 64 * 1024,
  },
  {
    id: "collecting-area-csv",
    path: "dist/staging/observation-geometry-v371/collecting-area.csv",
    maximumBytes: 2 * 1024 * 1024,
  },
  {
    id: "plate-scale-csv",
    path: "dist/staging/observation-geometry-v371/plate-scale.csv",
    maximumBytes: 2 * 1024 * 1024,
  },
  {
    id: "provenance-json",
    path: "dist/staging/observation-geometry-v371/provenance.json",
    maximumBytes: 64 * 1024,
  },
] as const;
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
const sha = (value: unknown) =>
  createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
const bytes = (entry: (typeof inputs)[number]) => {
  const absolute = resolve(root, entry.path);
  const size = statSync(absolute).size;
  if (size <= 0 || size > entry.maximumBytes) {
    throw new Error(`v373-input-size:${entry.id}`);
  }
  return readFileSync(absolute);
};
const fileSha = (entry: (typeof inputs)[number]) =>
  createHash("sha256").update(bytes(entry)).digest("hex");
const present = inputs
  .filter((entry) => existsSync(resolve(root, entry.path)))
  .map((entry) => entry.id);
const missing = inputs
  .filter((entry) => !present.includes(entry.id))
  .map((entry) => entry.id);

let invalidReason: string | null = null;
if (missing.length === 0) {
  try {
    const compilation = JSON.parse(
      bytes(inputs[0]).toString("utf8"),
    ) as ObservationGeometryCompiledArtifactV372;
    const candidate = JSON.parse(
      bytes(inputs[1]).toString("utf8"),
    ) as ObservationGeometryCandidateV372;
    const validation = JSON.parse(
      bytes(inputs[2]).toString("utf8"),
    ) as ObservationGeometryValidationArtifactV373;
    const identity = parseObservationGeometryIdentityV371(
      JSON.parse(bytes(inputs[3]).toString("utf8")),
    );
    parseObservationGeometryCollectingAreaCsvV371(bytes(inputs[4]).toString("utf8"));
    parseObservationGeometryPlateScaleCsvV371(bytes(inputs[5]).toString("utf8"));
    parseObservationGeometryProvenanceV371(
      JSON.parse(bytes(inputs[6]).toString("utf8")),
    );
    if (
      compilation.status !==
        "compiled-measured-geometry-candidate-awaiting-independent-validation" ||
      compilation.sourceKind !== "measured-import" ||
      compilation.candidatePublishable !== true ||
      validation.status !== "measured-geometry-validation-qualified" ||
      validation.passed !== true ||
      validation.measuredValidationQualified !== true ||
      validation.measuredAuthorityGranted !== false ||
      validation.runtimeGeometryPublished !== false ||
      validation.independentFromCompilerDerivations !== true ||
      candidate.instrumentSerialOrCampaignId !== identity.instrumentSerialOrCampaignId
    ) {
      throw new Error("v373-measured-chain-boundary");
    }
    const actual = {
      compilation: fileSha(inputs[0]),
      candidate: fileSha(inputs[1]),
      identity: fileSha(inputs[3]),
      collectingArea: fileSha(inputs[4]),
      plateScale: fileSha(inputs[5]),
      provenance: fileSha(inputs[6]),
    };
    if (
      createObservationGeometryCandidateShaV372(candidate) !==
        candidate.provenance.artifactSha256 ||
      candidate.provenance.artifactSha256 !==
        compilation.geometryCandidateArtifactSha256 ||
      sha(validation) !== validation.artifactSha256 ||
      Object.entries(actual).some(
        ([key, value]) =>
          validation.inputFileSha256[key as keyof typeof actual] !== value,
      )
    ) {
      throw new Error("v373-artifact-identity");
    }
  } catch (error) {
    invalidReason = error instanceof Error ? error.message.slice(0, 160) : "v373-input-invalid";
  }
}
const status = missing.length
  ? "blocked-admission-inputs-unavailable"
  : invalidReason
    ? "blocked-admission-inputs-invalid"
    : "ready-for-explicit-authority-admission";
const unsigned = {
  version: "v373-observation-geometry-authority-inspect-v1" as const,
  generatedAt: new Date().toISOString(),
  status,
  expectedInputs: OBSERVATION_GEOMETRY_AUTHORITY_INPUTS_V373,
  presentInputCount: present.length,
  missingInputs: missing,
  invalidReason,
  admissionControllerImplemented: true as const,
  admissionCommand:
    "npm run atlas -- relativity observation-geometry-v373-admit" as const,
  admissionExecuted: false as const,
  authorityPointerPublished: false as const,
  runtimeGeometryPublished: false as const,
  measuredAuthorityGranted: false as const,
  attemptConsumed: false as const,
  networkAttempted: false as const,
  automaticPromotionAllowed: false as const,
  formalProductPointer: "v263" as const,
  denseCampaignStatus: "incomplete-0-of-49" as const,
  browserQualification: "not-run" as const,
};
const artifact = parseObservationGeometryAuthorityInspectV373({
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
      present: artifact.presentInputCount,
      missing: artifact.missingInputs,
      admissionExecuted: artifact.admissionExecuted,
      authorityPointerPublished: artifact.authorityPointerPublished,
      runtimeGeometryPublished: artifact.runtimeGeometryPublished,
      authorityGranted: artifact.measuredAuthorityGranted,
      attemptConsumed: artifact.attemptConsumed,
    },
    null,
    2,
  ),
);
