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
  evaluateObservationGeometryAuthorityV373,
  type ObservationGeometryValidationArtifactV373,
} from "../app/lib/observationGeometryAuthorityAdmissionV373";
import {
  parseObservationGeometryIdentityV371,
  parseObservationGeometryProvenanceV371,
} from "../app/lib/observationGeometryCompilerV371";
import {
  createObservationGeometryCandidateShaV372,
  type ObservationGeometryCandidateV372,
  type ObservationGeometryCompiledArtifactV372,
} from "../app/lib/observationGeometryValidationV372";

const root = process.cwd();
const paths = {
  compilation: "dist/science/observation-geometry-v371/compiled.json",
  candidate: "dist/science/observation-geometry-v371/geometry.candidate.json",
  validation: "dist/science/observation-geometry-v372/validation.json",
  identity: "dist/staging/observation-geometry-v371/identity.json",
  collectingArea: "dist/staging/observation-geometry-v371/collecting-area.csv",
  plateScale: "dist/staging/observation-geometry-v371/plate-scale.csv",
  provenance: "dist/staging/observation-geometry-v371/provenance.json",
  admission: "dist/science/observation-geometry-v373/admission.json",
  authorityPointer:
    "dist/release/orbit-atlas-observation-geometry-authority-v373.json",
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
            .filter(([key]) => !["generatedAt", "artifactSha256"].includes(key))
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
  existsSync(resolve(root, paths.admission)) ||
  existsSync(resolve(root, paths.authorityPointer))
) {
  throw new Error("v373-refuse-overwrite-existing-admission");
}
const compilation = JSON.parse(
  read(paths.compilation).toString("utf8"),
) as ObservationGeometryCompiledArtifactV372;
const candidate = JSON.parse(
  read(paths.candidate).toString("utf8"),
) as ObservationGeometryCandidateV372;
const validation = JSON.parse(
  read(paths.validation).toString("utf8"),
) as ObservationGeometryValidationArtifactV373;
const identity = parseObservationGeometryIdentityV371(
  JSON.parse(read(paths.identity).toString("utf8")),
);
const provenance = parseObservationGeometryProvenanceV371(
  JSON.parse(read(paths.provenance).toString("utf8")),
);
const actualInputFileSha256 = {
  compilation: fileSha(paths.compilation),
  candidate: fileSha(paths.candidate),
  identity: fileSha(paths.identity),
  collectingArea: fileSha(paths.collectingArea),
  plateScale: fileSha(paths.plateScale),
  provenance: fileSha(paths.provenance),
};
const candidateCanonicalSha256 = createObservationGeometryCandidateShaV372(candidate);
const validationArtifactCanonicalSha256 = sha(validation);
const suspicious = [
  identity.instrumentSerialOrCampaignId,
  identity.observatoryOrLaboratory,
  identity.attestation.operatorOrArchive,
  provenance.sourceUrl,
  provenance.licenseOrTerms,
].join(" ").toLowerCase();
const decision = evaluateObservationGeometryAuthorityV373({
  compilation,
  candidate,
  validation,
  identityInstrumentSerialOrCampaignId: identity.instrumentSerialOrCampaignId,
  actualInputFileSha256,
  candidateCanonicalSha256,
  validationArtifactCanonicalSha256,
  validationArtifactFileSha256: fileSha(paths.validation),
  declaredTestFixture:
    /example\.invalid|test[- ]?fixture|synthetic example|fixture-only/.test(suspicious),
});
const admissionUnsigned = {
  version: "v373-observation-geometry-authority-envelope-v1",
  generatedAt: new Date().toISOString(),
  status: decision.status,
  decision,
  candidateCanonicalSha256,
  validationArtifactCanonicalSha256,
  attemptConsumed: true,
  networkAttempted: false,
  automaticPromotionApplied: false,
  runtimeGeometryPublished: false,
  formalProductPointer: "v263",
  denseCampaignStatus: "incomplete-0-of-49",
  browserQualification: "not-run",
};
const admission = { ...admissionUnsigned, artifactSha256: sha(admissionUnsigned) };
atomic(paths.admission, admission);
if (decision.authorityGranted) {
  const authorityPointerUnsigned = {
    version: "v373-observation-geometry-authority-pointer-v1",
    status: "qualified-measured-observation-geometry-authority-local-shadow-only",
    authorityGranted: true,
    admissionArtifactSha256: admission.artifactSha256,
    validationArtifactCanonicalSha256,
    validationArtifactFileSha256: fileSha(paths.validation),
    candidateCanonicalSha256,
    candidateFileSha256: fileSha(paths.candidate),
    instrumentSerialOrCampaignId: identity.instrumentSerialOrCampaignId,
    localShadowOnly: true,
    runtimeGeometryPublicationAllowed: false,
    productPromotionAllowed: false,
    formalProductPointer: "v263",
    denseCampaignStatus: "incomplete-0-of-49",
  };
  atomic(paths.authorityPointer, {
    ...authorityPointerUnsigned,
    pointerSha256: sha(authorityPointerUnsigned),
  });
}
console.log(
  JSON.stringify(
    {
      status: admission.status,
      artifactSha256: admission.artifactSha256,
      authorityGranted: decision.authorityGranted,
      reasons: decision.reasons,
      runtimeGeometryPublicationAllowed: false,
      formalProductPointer: admission.formalProductPointer,
    },
    null,
    2,
  ),
);
if (!decision.authorityGranted) {
  throw new Error(`v373-admission-failed:${decision.status}`);
}
