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
import type { ObservationGeometryValidationArtifactV373 } from "../app/lib/observationGeometryAuthorityAdmissionV373";
import { parseObservationGeometryIdentityV371 } from "../app/lib/observationGeometryCompilerV371";
import {
  evaluateObservationGeometryRuntimePublicationV374,
  type ObservationGeometryAdmissionArtifactV374,
  type ObservationGeometryAuthorityPointerV374,
} from "../app/lib/observationGeometryRuntimePublicationV374";
import {
  OBSERVATION_GEOMETRY_RUNTIME_PUBLICATION_INPUTS_V374,
  parseObservationGeometryRuntimePublicationInspectV374,
} from "../app/lib/observationGeometryRuntimePublicationInspectV374";
import {
  createObservationGeometryCandidateShaV372,
  type ObservationGeometryCandidateV372,
  type ObservationGeometryCompiledArtifactV372,
} from "../app/lib/observationGeometryValidationV372";

const root = process.cwd();
const output = "dist/science/observation-geometry-v374/inspect.json";
const inputs = [
  {
    id: "v373-authority-pointer",
    path: "dist/release/orbit-atlas-observation-geometry-authority-v373.json",
    maximumBytes: 64 * 1024,
  },
  {
    id: "v373-admission-artifact",
    path: "dist/science/observation-geometry-v373/admission.json",
    maximumBytes: 256 * 1024,
  },
  {
    id: "v372-validation-artifact",
    path: "dist/science/observation-geometry-v372/validation.json",
    maximumBytes: 256 * 1024,
  },
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
            .filter(
              ([key]) =>
                !["generatedAt", "artifactSha256", "pointerSha256"].includes(key),
            )
            .sort(([left], [right]) => left.localeCompare(right))
            .map(([key, entry]) => [key, canonicalize(entry)]),
        );
const sha = (value: unknown) =>
  createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
const bytes = (entry: (typeof inputs)[number]) => {
  const absolute = resolve(root, entry.path);
  const size = statSync(absolute).size;
  if (size <= 0 || size > entry.maximumBytes) {
    throw new Error(`v374-input-size:${entry.id}`);
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
    const authorityPointer = JSON.parse(
      bytes(inputs[0]).toString("utf8"),
    ) as ObservationGeometryAuthorityPointerV374;
    const admission = JSON.parse(
      bytes(inputs[1]).toString("utf8"),
    ) as ObservationGeometryAdmissionArtifactV374;
    const validation = JSON.parse(
      bytes(inputs[2]).toString("utf8"),
    ) as ObservationGeometryValidationArtifactV373;
    const compilation = JSON.parse(
      bytes(inputs[3]).toString("utf8"),
    ) as ObservationGeometryCompiledArtifactV372;
    const candidate = JSON.parse(
      bytes(inputs[4]).toString("utf8"),
    ) as ObservationGeometryCandidateV372;
    const identity = parseObservationGeometryIdentityV371(
      JSON.parse(bytes(inputs[5]).toString("utf8")),
    );
    const decision = evaluateObservationGeometryRuntimePublicationV374({
      authorityPointer,
      admission,
      validation,
      compilation,
      candidate,
      identityInstrumentSerialOrCampaignId: identity.instrumentSerialOrCampaignId,
      actualFileSha256: {
        authorityPointer: fileSha(inputs[0]),
        admission: fileSha(inputs[1]),
        validation: fileSha(inputs[2]),
        compilation: fileSha(inputs[3]),
        candidate: fileSha(inputs[4]),
        identity: fileSha(inputs[5]),
        collectingArea: fileSha(inputs[6]),
        plateScale: fileSha(inputs[7]),
        provenance: fileSha(inputs[8]),
      },
      authorityPointerCanonicalSha256: sha(authorityPointer),
      admissionCanonicalSha256: sha(admission),
      validationCanonicalSha256: sha(validation),
      candidateCanonicalSha256: createObservationGeometryCandidateShaV372(candidate),
    });
    if (!decision.publicationAllowed || !decision.geometry) {
      throw new Error(`v374-publication:${decision.reasons.join(",")}`);
    }
  } catch (error) {
    invalidReason = error instanceof Error ? error.message.slice(0, 160) : "v374-input-invalid";
  }
}
const status = missing.length
  ? "blocked-publication-inputs-unavailable"
  : invalidReason
    ? "blocked-publication-inputs-invalid"
    : "ready-for-explicit-runtime-publication";
const unsigned = {
  version: "v374-observation-geometry-runtime-publication-inspect-v1" as const,
  generatedAt: new Date().toISOString(),
  status,
  expectedInputs: OBSERVATION_GEOMETRY_RUNTIME_PUBLICATION_INPUTS_V374,
  presentInputCount: present.length,
  missingInputs: missing,
  invalidReason,
  publicationControllerImplemented: true as const,
  publicationCommand:
    "npm run atlas -- relativity observation-geometry-v374-publish" as const,
  publicationExecuted: false as const,
  runtimeGeometryPublished: false as const,
  measuredAuthorityAvailable: false as const,
  measuredExpectationAvailable: false as const,
  attemptConsumed: false as const,
  networkAttempted: false as const,
  automaticPromotionAllowed: false as const,
  formalProductPointer: "v263" as const,
  denseCampaignStatus: "incomplete-0-of-49" as const,
  browserQualification: "not-run" as const,
};
const artifact = parseObservationGeometryRuntimePublicationInspectV374({
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
      publicationExecuted: artifact.publicationExecuted,
      runtimeGeometryPublished: artifact.runtimeGeometryPublished,
      authorityAvailable: artifact.measuredAuthorityAvailable,
      expectationAvailable: artifact.measuredExpectationAvailable,
      attemptConsumed: artifact.attemptConsumed,
    },
    null,
    2,
  ),
);
