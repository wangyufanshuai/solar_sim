import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const out = "dist/science/kerr-detector-projection-admission-v442";
const transient = new Set(["generatedAt", "artifactSha256"]);
const canonicalize = (value: unknown): unknown =>
  Array.isArray(value)
    ? value.map(canonicalize)
    : !value || typeof value !== "object"
      ? value
      : Object.fromEntries(
          Object.entries(value)
            .filter(([key]) => !transient.has(key))
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, entry]) => [key, canonicalize(entry)]),
        );
const sha = (value: unknown): string =>
  createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
const fileSha = (path: string): string =>
  createHash("sha256").update(readFileSync(resolve(root, path))).digest("hex");
// The admission audit deliberately preserves unknown upstream JSON fields; runtime contracts validate the fields we consume.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const read = (path: string): Record<string, any> =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  JSON.parse(readFileSync(resolve(root, path), "utf8")) as Record<string, any>;
const atomic = (path: string, value: unknown): void => {
  const target = resolve(root, path);
  mkdirSync(dirname(target), { recursive: true });
  const part = `${target}.${process.pid}.part`;
  writeFileSync(part, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  renameSync(part, target);
};

const paths = {
  pack: "dist/science/observation-geometry-pack-v370/manifest.json",
  importInspect: "dist/science/observation-geometry-v371/inspect.json",
  validationInspect: "dist/science/observation-geometry-v372/inspect.json",
  admissionInspect: "dist/science/observation-geometry-v373/inspect.json",
  publicationInspect: "dist/science/observation-geometry-v374/inspect.json",
  visibleForensic: "dist/science/measured-visible-source-v382r1/forensic.json",
  wcs: "dist/science/kerr-wcs-projection-availability-v441/wcs-projection-availability.json",
  state: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
};
const pack = read(paths.pack);
const importInspect = read(paths.importInspect);
const validationInspect = read(paths.validationInspect);
const admissionInspect = read(paths.admissionInspect);
const publicationInspect = read(paths.publicationInspect);
const visibleForensic = read(paths.visibleForensic);
const wcs = read(paths.wcs);
const state = read(paths.state);
const formal = read(paths.formal);
const formalEvidence = read(formal.source);

if (
  pack.version !== "v370-observation-geometry-acquisition-pack-v1" ||
  pack.totalMeasurementRows !== 0 ||
  pack.measuredGeometryQualified !== false ||
  importInspect.status !== "blocked-measured-geometry-files-unavailable" ||
  validationInspect.status !== "blocked-validation-inputs-unavailable" ||
  admissionInspect.status !== "blocked-admission-inputs-unavailable" ||
  publicationInspect.status !== "blocked-publication-inputs-unavailable" ||
  visibleForensic.progress?.sourceDossierAvailable !== false ||
  visibleForensic.authorityGranted !== false ||
  visibleForensic.progress?.qualifiedSourceCount !== 1 ||
  wcs.version !== "v441-kerr-wcs-projection-availability-artifact-v1" ||
  wcs.counts?.joinedSourceCoordinateRowCount !== 24 ||
  wcs.counts?.detectorProjectionCount !== 0 ||
  wcs.qualification?.wcsCoordinateAuthorityQualified !== true ||
  wcs.qualification?.detectorProjectionBlocked !== true ||
  state.status !== "incomplete-0-of-49" ||
  state.completedShardCount !== 0 ||
  state.attemptConsumed !== false ||
  state.aggregateAvailable !== false ||
  formal.version !== "v263-current-product-evidence-pointer" ||
  formalEvidence.science?.defaultKernel !== "legacy-eih-1pn" ||
  formalEvidence.contracts?.singleCanvas !== true ||
  formalEvidence.contracts?.legacyRootAttributes !== 603 ||
  formalEvidence.contracts?.evidenceLedgerClaims !== 84
) {
  throw new Error("v442-source-boundary");
}

const sourcePaths = [paths.pack, paths.importInspect, paths.validationInspect, paths.admissionInspect, paths.publicationInspect, paths.visibleForensic, paths.wcs];
const sourceManifest = sourcePaths.map((path, index) => ({
  id: ["v370-pack", "v371-import", "v372-validation", "v373-admission", "v374-publication", "v382-visible-forensic", "v441-wcs"][index],
  path,
  sha256: fileSha(path),
  artifactSha256: index === 0 ? pack.artifactSha256 : index === 1 ? importInspect.artifactSha256 : index === 2 ? validationInspect.artifactSha256 : index === 3 ? admissionInspect.artifactSha256 : index === 4 ? publicationInspect.artifactSha256 : index === 5 ? visibleForensic.artifactSha256 : wcs.artifactSha256,
  status: "present" as const,
}));
const missingFiles = [
  "identity.json",
  "collecting-area.csv",
  "plate-scale.csv",
  "provenance.json",
  "v371-compiled-artifact",
  "v372-validation-artifact",
  "v373-authority-pointer",
];
const partialSources = ["v382-visible-source-dossier-1-of-7-no-geometry-dossier"];
const gates = [
  { id: "wcs-coordinate-authority", status: "qualified", sourceVersion: "v441", sourceArtifactSha256: wcs.artifactSha256, reason: "24 source coordinates and linear WCS join are independently qualified", requiredForProjection: true },
  { id: "instrument-identity", status: "missing", sourceVersion: "v371", sourceArtifactSha256: null, reason: "identity.json is absent; nominal source labels cannot establish measured detector identity", requiredForProjection: true },
  { id: "collecting-area", status: "missing", sourceVersion: "v371", sourceArtifactSha256: null, reason: "three-repeat collecting-area measurements are absent", requiredForProjection: true },
  { id: "plate-scale", status: "missing", sourceVersion: "v371", sourceArtifactSha256: null, reason: "three-repeat plate-scale measurements are absent", requiredForProjection: true },
  { id: "distortion-calibration", status: "missing", sourceVersion: "v382", sourceArtifactSha256: null, reason: "official geometry source is only a planned staging input; no normalized distortion coefficients are present", requiredForProjection: true },
  { id: "psf-calibration", status: "missing", sourceVersion: "v382", sourceArtifactSha256: null, reason: "no traceable measured PSF model is present", requiredForProjection: true },
  { id: "pixel-response-calibration", status: "missing", sourceVersion: "v382", sourceArtifactSha256: null, reason: "detector response and pixel sampling inputs are absent", requiredForProjection: true },
  { id: "source-provenance", status: "partial", sourceVersion: "v382r1", sourceArtifactSha256: visibleForensic.artifactSha256, reason: "one of seven staged visible sources is revalidated; geometry/detector dossier is unavailable", requiredForProjection: true },
  { id: "independent-validation", status: "blocked", sourceVersion: "v372", sourceArtifactSha256: validationInspect.artifactSha256, reason: "independent validation cannot run without v371 inputs", requiredForProjection: true },
  { id: "authority-admission", status: "blocked", sourceVersion: "v373", sourceArtifactSha256: admissionInspect.artifactSha256, reason: "authority admission is fail-closed until identity, measurement and validation hashes exist", requiredForProjection: true },
  { id: "runtime-publication", status: "blocked", sourceVersion: "v374", sourceArtifactSha256: publicationInspect.artifactSha256, reason: "runtime publication is forbidden while measured authority is unavailable", requiredForProjection: true },
] as const;
const contract = {
  version: "v442-kerr-detector-projection-admission-contract-v1",
  status: "detector-projection-admission-fail-closed",
  requiredGateCount: 10,
  gateIds: gates.map((gate) => gate.id).slice(1),
  wcsCoordinateAuthority: true,
  measuredDetectorGeometryRequired: true,
  distortionCalibrationRequired: true,
  psfCalibrationRequired: true,
  pixelResponseCalibrationRequired: true,
  independentValidationRequired: true,
  authorityAdmissionRequired: true,
  runtimeProjectionAllowed: false,
  scienceRasterAllowed: false,
  cinematicScienceWritebackAllowed: false,
  automaticPromotionAllowed: false,
  formalProductPointer: "v263",
  denseCampaignStatus: "incomplete-0-of-49",
} as const;
const unsigned = {
  version: "v442-kerr-detector-projection-admission-v1",
  generatedAt: "2026-07-30T00:00:00Z",
  status: "blocked-detector-projection-inputs-unavailable",
  sourceManifest,
  sourceSha256: sha(sourceManifest),
  gates,
  counts: { gateCount: 11, qualified: 1, partial: 1, missing: 6, blocked: 3 },
  inputs: {
    missingFiles,
    partialSources,
    explicitCompileCommand: "npm run atlas -- relativity observation-geometry-v371-compile",
    explicitValidateCommand: "npm run atlas -- relativity observation-geometry-v372-validate",
    explicitAdmissionCommand: "npm run atlas -- relativity observation-geometry-v373-admit",
    explicitPublicationCommand: "npm run atlas -- relativity observation-geometry-v374-publish",
  },
  wcs: { authority: "qualified-linear-wcs", sourceArtifactSha256: wcs.artifactSha256, coordinateRows: 24, detectorProjectionAllowed: false },
  projection: { measuredGeometryAuthority: false, distortionCalibrationAuthority: false, psfAuthority: false, pixelResponseAuthority: false, detectorProjectionAvailable: false, rasterProductAvailable: false, sciencePayloadMutationAllowed: false },
  qualification: { admission: "blocked", sourcePackComplete: false, measuredAuthorityGranted: false, runtimeGeometryPublished: false, browserQualification: "not-run", denseAuthority: false },
  networkAttempted: false,
  attemptConsumed: false,
  automaticRetryApplied: false,
  formalProductPointer: "v263",
  denseCampaignStatus: "incomplete-0-of-49",
  contract,
  boundary: "v442-wcs-coordinate-authority-is-qualified-but-detector-projection-requires-measured-geometry-distortion-psf-response-independent-validation-and-explicit-admission",
};
const artifact = { ...unsigned, artifactSha256: sha(unsigned) };
atomic(`${out}/admission-contract.json`, contract);
atomic(`${out}/detector-projection-admission.json`, artifact);
console.log(JSON.stringify({ status: artifact.status, artifactSha256: artifact.artifactSha256, gates: artifact.counts, missingFiles: missingFiles.length, partialSources: partialSources.length, projectionAllowed: false }, null, 2));
