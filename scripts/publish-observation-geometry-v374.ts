import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
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
  createObservationGeometryCandidateShaV372,
  type ObservationGeometryCandidateV372,
  type ObservationGeometryCompiledArtifactV372,
} from "../app/lib/observationGeometryValidationV372";

const root = process.cwd();
const paths = {
  authorityPointer: "dist/release/orbit-atlas-observation-geometry-authority-v373.json",
  admission: "dist/science/observation-geometry-v373/admission.json",
  validation: "dist/science/observation-geometry-v372/validation.json",
  compilation: "dist/science/observation-geometry-v371/compiled.json",
  candidate: "dist/science/observation-geometry-v371/geometry.candidate.json",
  identity: "dist/staging/observation-geometry-v371/identity.json",
  collectingArea: "dist/staging/observation-geometry-v371/collecting-area.csv",
  plateScale: "dist/staging/observation-geometry-v371/plate-scale.csv",
  provenance: "dist/staging/observation-geometry-v371/provenance.json",
  runtimeGeometry: "dist/staging/detector-calibration-v369/observation-geometry.json",
  receipt: "dist/science/observation-geometry-v374/publication.json",
} as const;
const read = (path: string) => readFileSync(resolve(root, path));
const fileSha = (path: string) =>
  createHash("sha256").update(read(path)).digest("hex");
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
const atomic = (path: string, value: unknown) => {
  const target = resolve(root, path);
  mkdirSync(dirname(target), { recursive: true });
  const temporary = `${target}.${process.pid}.part`;
  writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`);
  renameSync(temporary, target);
};

if (
  existsSync(resolve(root, paths.runtimeGeometry)) ||
  existsSync(resolve(root, paths.receipt))
) {
  throw new Error("v374-refuse-overwrite-existing-runtime-geometry");
}
const authorityPointer = JSON.parse(
  read(paths.authorityPointer).toString("utf8"),
) as ObservationGeometryAuthorityPointerV374;
const admission = JSON.parse(
  read(paths.admission).toString("utf8"),
) as ObservationGeometryAdmissionArtifactV374;
const validation = JSON.parse(
  read(paths.validation).toString("utf8"),
) as ObservationGeometryValidationArtifactV373;
const compilation = JSON.parse(
  read(paths.compilation).toString("utf8"),
) as ObservationGeometryCompiledArtifactV372;
const candidate = JSON.parse(
  read(paths.candidate).toString("utf8"),
) as ObservationGeometryCandidateV372;
const identity = parseObservationGeometryIdentityV371(
  JSON.parse(read(paths.identity).toString("utf8")),
);
const decision = evaluateObservationGeometryRuntimePublicationV374({
  authorityPointer,
  admission,
  validation,
  compilation,
  candidate,
  identityInstrumentSerialOrCampaignId: identity.instrumentSerialOrCampaignId,
  actualFileSha256: {
    authorityPointer: fileSha(paths.authorityPointer),
    admission: fileSha(paths.admission),
    validation: fileSha(paths.validation),
    compilation: fileSha(paths.compilation),
    candidate: fileSha(paths.candidate),
    identity: fileSha(paths.identity),
    collectingArea: fileSha(paths.collectingArea),
    plateScale: fileSha(paths.plateScale),
    provenance: fileSha(paths.provenance),
  },
  authorityPointerCanonicalSha256: sha(authorityPointer),
  admissionCanonicalSha256: sha(admission),
  validationCanonicalSha256: sha(validation),
  candidateCanonicalSha256: createObservationGeometryCandidateShaV372(candidate),
});
if (!decision.publicationAllowed || !decision.geometry) {
  throw new Error(`v374-publication-failed:${decision.reasons.join(",")}`);
}
const receiptUnsigned = {
  version: "v374-observation-geometry-runtime-publication-receipt-v1",
  generatedAt: new Date().toISOString(),
  status: decision.status,
  decision,
  authorityPointerFileSha256: fileSha(paths.authorityPointer),
  authorityPointerCanonicalSha256: sha(authorityPointer),
  admissionArtifactSha256: admission.artifactSha256,
  validationArtifactSha256: validation.artifactSha256,
  candidateArtifactSha256: candidate.provenance.artifactSha256,
  runtimeGeometryFileSha256: null,
  attemptConsumed: true,
  networkAttempted: false,
  automaticPromotionApplied: false,
  formalProductPointer: "v263",
  denseCampaignStatus: "incomplete-0-of-49",
  browserQualification: "not-run",
};
atomic(paths.runtimeGeometry, decision.geometry);
const receipt = {
  ...receiptUnsigned,
  runtimeGeometryFileSha256: fileSha(paths.runtimeGeometry),
};
atomic(paths.receipt, { ...receipt, artifactSha256: sha(receipt) });
console.log(
  JSON.stringify(
    {
      status: decision.status,
      runtimeGeometryPublished: true,
      runtimeGeometryFileSha256: receipt.runtimeGeometryFileSha256,
      candidateArtifactSha256: receipt.candidateArtifactSha256,
      authorityPointerCanonicalSha256: receipt.authorityPointerCanonicalSha256,
      productPromotionApplied: false,
      formalProductPointer: receipt.formalProductPointer,
    },
    null,
    2,
  ),
);
