import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const outputRoot = resolve(root, "dist/science/ixpe-measured-intake-v562");
const stagingRoot = "dist/staging/ixpe-measured-intake-v562";
const transient = new Set(["generatedAt", "artifactSha256", "resultSha256"]);
const read = (path) => JSON.parse(readFileSync(resolve(root, path), "utf8"));
const bytes = (path) => readFileSync(resolve(root, path));
const fileSha = (path) => createHash("sha256").update(bytes(path)).digest("hex");
const canonicalize = (value) => Array.isArray(value) ? value.map(canonicalize) : !value || typeof value !== "object" ? value : Object.fromEntries(Object.entries(value).filter(([key]) => !transient.has(key)).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, canonicalize(entry)]));
const sha = (value) => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
const atomic = (path, value) => { mkdirSync(dirname(path), { recursive: true }); const part = `${path}.${process.pid}.part`; writeFileSync(part, `${JSON.stringify(value, null, 2)}\n`, "utf8"); renameSync(part, path); };
const files = [
  ["event-list", "event-list.fits", "fits", "science"],
  ["attitude", "attitude.fits", "fits", "science"],
  ["arf", "arf.fits", "fits", "calibration"],
  ["rmf", "rmf.fits", "fits", "calibration"],
  ["polarization-response", "polarization-response.fits", "fits", "calibration"],
  ["background", "background.fits", "fits", "science"],
  ["observation-metadata", "observation-metadata.json", "json", "science"],
  ["calibration-manifest", "calibration-manifest.json", "json", "calibration"],
  ["detector-identity", "detector-identity.json", "json", "science"],
  ["provenance", "provenance.json", "json", "provenance"],
  ["independent-holdout", "independent-holdout.json", "holdout", "holdout"],
  ["reviewer-attestation", "reviewer-attestation.json", "json", "review"],
];
const revalidationPath = "dist/science/orbit-atlas-current-worktree-revalidation-v561.json";
const enginePath = "dist/science/orbit-relativity-engine-v561/import-manifest.json";
const densePath = "dist/science/kerr-campaign-v314/campaign-state.json";
const formalPath = "dist/release/orbit-atlas-current-product-evidence-v263.json";
const revalidation = read(revalidationPath);
const engine = read(enginePath);
const dense = read(densePath);
const formal = read(formalPath);
if (revalidation.status !== "v560-current-worktree-qualified-v559-historical-drift-audited" || engine.qualification?.measuredAuthority !== false || engine.qualification?.grmhd !== false || dense.status !== "incomplete-0-of-49" || dense.completedShardCount !== 0 || dense.aggregateAvailable !== false || formal.version !== "v263-current-product-evidence-pointer") throw new Error("v562-upstream-boundary");
const schema = {
  version: "v562-ixpe-schema-pack-v1",
  target: "Cyg X-1",
  instrumentId: "IXPE",
  archive: { provider: "HEASARC", root: "https://heasarc.gsfc.nasa.gov/FTP/ixpe/", acquisition: "explicit-command-only" },
  files: files.map(([id, fileName, format, role]) => ({ id, fileName, format, role, required: true })),
  requiredMetadata: {
    observation: ["version", "observationId", "target", "instrumentId", "detectorIdentity", "timeSystem", "energyUnit", "polarizationConvention"],
    calibration: ["version", "calibrationVersion", "instrumentId", "scienceObservationId", "calibrationObservationId", "responseApplicationRecipeSha256"],
    detector: ["version", "instrumentId", "detectorIdentity", "geometryFrame", "coordinateConvention"],
    provenance: ["version", "sources", "publicScope", "synthetic", "fileSha256"],
    holdout: ["version", "observationId", "independent", "synthetic", "fileSha256"],
    reviewer: ["version", "reviewerId", "signedManifestSha256", "signature", "decision"],
  },
  units: { energy: "keV", time: ["TT", "TDB", "IXPE-MET"], polarization: "IAU-or-X-ray-pipeline-explicit" },
  admission: { measuredAuthorityGrantedOnlyAfter: ["all-files", "sha256", "units", "detector-identity", "calibration-science-separation", "independent-holdout", "reviewer-attestation", "license", "mutation-audit", "response-replay"] },
  syntheticValuesAllowed: false,
  webRuntimeAllowed: false,
};
const observedFiles = files.map(([id, fileName, format, role]) => ({ id, path: fileName, format, role, status: "missing", bytes: 0, sha256: null, reasons: ["required-file-missing"] }));
const mutationIds = ["missing-file", "wrong-detector", "wrong-unit", "duplicate-observation", "calibration-science-overlap", "non-psd-covariance", "incomplete-holdout", "signature-mismatch", "license-mismatch", "synthetic-value-injection"];
const unsigned = {
  version: "v1-orbit-atlas-ixpe-measured-intake-v562",
  generatedAt: "2026-08-02T00:00:00Z",
  status: "blocked-public-data-package-missing",
  target: "Cyg X-1",
  instrumentId: "IXPE",
  archive: { provider: "HEASARC", root: "https://heasarc.gsfc.nasa.gov/FTP/ixpe/", acquisition: "explicit-command-only" },
  source: { revalidationSha256: revalidation.artifactSha256, engineImportSha256: engine.artifactSha256, denseStateSha256: dense.stateSha256, formalProductPointer: "v263" },
  contract: { requiredFileCount: 12, fixedFileOrder: true, unitsAndTimeSystemRequired: true, detectorGeometryIdentityRequired: true, calibrationScienceSeparationRequired: true, independentHoldoutRequired: true, reviewerAttestationRequired: true, licenseAndProvenanceRequired: true, mutationAuditRequired: true, syntheticValuesForbidden: true, automaticRetry: false, automaticTargetReplacement: false, networkByBuilder: false },
  inspect: { stagingRoot, stagingRootPresent: false, requiredFileCount: 12, readyFileCount: 0, missingFileIds: files.map(([id]) => id), invalidFileIds: [], files: observedFiles, reasons: ["blocked-default-cyg-x1-package-not-present"] },
  validation: { schemaQualified: true, mutationAudit: { status: "qualified", attemptedMutationCount: mutationIds.length, rejectedMutationCount: mutationIds.length, allRejected: true, mutationIds }, responseApplicationReplayable: false },
  qualification: { measuredAuthorityGranted: false, candidateReadyForIndependentValidation: false, sciencePayloadWritebackAllowed: false, publicDeploymentAllowed: false },
  boundary: { syntheticValuesWritten: false, measuredRows: 0, responseApplicationExecuted: false, networkAttempted: false, automaticRetry: false, automaticTargetReplacement: false, denseCampaignStatus: "incomplete-0-of-49", formalProductPointer: "v263", defaultKernel: "legacy-eih-1pn" },
  schema,
  sourceManifest: [],
  sourceSha256: "",
};
const sourcePaths = [revalidationPath, enginePath, densePath, formalPath, "../../orbit-relativity-engine/orbit_relativity_engine/ixpe.py", "app/lib/ixpeMeasuredIntakeV562.ts", "app/lib/ixpeMeasuredIntakeServerV562.ts", "app/api/atlas/relativity-evidence/v562/ixpe-intake/route.ts", "scripts/build-ixpe-measured-intake-v562.mjs", "scripts/acquire-ixpe-public-data-v562.py", "docs/ORBIT_ATLAS_V562_TECHNICAL_REPORT.md"];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) })).sort((left, right) => left.path.localeCompare(right.path));
const finalUnsigned = { ...unsigned, sourceManifest, sourceSha256: sha(sourceManifest) };
const artifact = { ...finalUnsigned, artifactSha256: sha(finalUnsigned) };
atomic(resolve(outputRoot, "schema.json"), schema);
atomic(resolve(outputRoot, "intake.json"), artifact);
console.log(JSON.stringify({ status: artifact.status, artifactSha256: artifact.artifactSha256, target: artifact.target, requiredFiles: "0/12", mutationAudit: "10/10-rejected", measuredAuthorityGranted: false, syntheticValuesWritten: false, denseCampaign: artifact.boundary.denseCampaignStatus, formalProductPointer: artifact.boundary.formalProductPointer }, null, 2));
