import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, statSync, writeFileSync } from "node:fs";
import { dirname, relative, resolve, sep } from "node:path";
import {
  validateKerrPhysicalObservationIntakeV398,
  V398_MAX_FILE_BYTES,
  V398_MAX_TOTAL_BYTES,
  V398_STAGING_ROOT,
  type KerrPhysicalObservationIntakeManifestV398,
} from "../app/lib/kerrPhysicalObservationIntakeV398";
import { parseKerrCovarianceSourceAdmissionArtifactV393 } from "../app/lib/kerrCovarianceSourceDossierV393";
import { parseKerrTemperatureSystematicsTransferArtifactV390 } from "../app/lib/kerrTemperatureSystematicsTransferV390";

const root = process.cwd();
const stagingRoot = resolve(root, V398_STAGING_ROOT);
const manifestPath = resolve(stagingRoot, "manifest.json");
const outputPath = resolve(root, "dist/science/kerr-physical-observation-intake-v398/physical-observation.candidate.json");
const bounded = (path: string, maximum: number) => { const metadata = statSync(path); if (!metadata.isFile() || metadata.size <= 0 || metadata.size > maximum) throw new Error("v398-compile-file-size"); return readFileSync(path); };
const readJson = (path: string, maximum = 128 * 1024) => JSON.parse(bounded(path, maximum).toString("utf8"));
const sha = (value: Uint8Array | string) => createHash("sha256").update(value).digest("hex");
const resolveStaging = (path: string) => { if (typeof path !== "string" || path.includes("\\") || path.startsWith("/") || /^[A-Za-z]:/.test(path)) throw new Error("v398-compile-unsafe-path"); const target = resolve(stagingRoot, path); const rel = relative(stagingRoot, target); if (!rel || rel.startsWith("..") || rel.includes(`..${sep}`)) throw new Error("v398-compile-unsafe-path"); return target; };
const atomic = (path: string, value: unknown) => { mkdirSync(dirname(path), { recursive: true }); const temporary = `${path}.${process.pid}.part`; writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`); renameSync(temporary, path); };

if (!existsSync(manifestPath)) throw new Error("v398-staging-unavailable-no-attempt-consumed");
if (existsSync(outputPath)) throw new Error("v398-refuse-overwrite-existing-candidate");
const manifest = readJson(manifestPath) as KerrPhysicalObservationIntakeManifestV398;
const packEntry = manifest.files?.find((entry) => entry.role === "pack");
if (!packEntry) throw new Error("v398-compile-pack-entry");
let totalBytes = 0;
const observedFiles = manifest.files.map((entry) => {
  const target = resolveStaging(entry.relativePath);
  const bytes = bounded(target, V398_MAX_FILE_BYTES);
  totalBytes += bytes.length;
  if (totalBytes > V398_MAX_TOTAL_BYTES) throw new Error("v398-compile-total-size");
  return Object.freeze({ relativePath: entry.relativePath, sha256: sha(bytes), bytes: bytes.length });
});
const pack = JSON.parse(bounded(resolveStaging(packEntry.relativePath), 512 * 1024).toString("utf8"));
const transfer = parseKerrTemperatureSystematicsTransferArtifactV390(readJson(resolve(root, "dist/science/kerr-temperature-systematics-transfer-v390/transfer-operator.json")));
const sourceAdmission = parseKerrCovarianceSourceAdmissionArtifactV393(readJson(resolve(root, "dist/science/kerr-covariance-source-admission-v393/source-admission.json")));
const v397 = readJson(resolve(root, "dist/science/kerr-physical-observation-admission-v397/observation-admission.json")) as { artifactSha256: string; source: { v396ConstraintDesignArtifactSha256: string } };
const validation = validateKerrPhysicalObservationIntakeV398(manifest, observedFiles, pack, transfer, sourceAdmission, v397.artifactSha256, v397.source.v396ConstraintDesignArtifactSha256);
if (validation.status !== "admitted-physical" || !validation.compileAllowed || !validation.publicationAllowed) throw new Error(`v398-compile-rejected:${validation.rejectionReasons.join(",")}`);
const candidate = Object.freeze({ version: "v398-kerr-physical-observation-candidate-v1", generatedAt: new Date().toISOString(), status: "physical-observation-candidate-compiled-awaiting-independent-validation", source: Object.freeze({ manifestFileSha256: sha(bounded(manifestPath, 128 * 1024)), v397AdmissionArtifactSha256: v397.artifactSha256 }), manifest, pack, observedFiles: Object.freeze(observedFiles), totalBytes, compileExecuted: true, candidatePublished: true, runtimePublished: false, measuredAuthorityGranted: false, independentScientificValidation: "pending", networkAttempted: false, formalProductPointer: "v263" });
atomic(outputPath, candidate);
console.log(JSON.stringify({ status: candidate.status, candidatePath: "dist/science/kerr-physical-observation-intake-v398/physical-observation.candidate.json", checkedFiles: observedFiles.length, totalBytes, runtimePublished: false, measuredAuthorityGranted: false, independentScientificValidation: "pending" }, null, 2));
