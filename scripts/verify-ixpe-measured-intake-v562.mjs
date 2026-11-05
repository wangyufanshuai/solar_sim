import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const folder = "dist/science/ixpe-measured-intake-v562";
const path = resolve(root, folder, "intake.json");
const transient = new Set(["generatedAt", "artifactSha256", "resultSha256"]);
const read = (file) => JSON.parse(readFileSync(resolve(root, file), "utf8"));
const canonicalize = (value) => Array.isArray(value) ? value.map(canonicalize) : !value || typeof value !== "object" ? value : Object.fromEntries(Object.entries(value).filter(([key]) => !transient.has(key)).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, canonicalize(entry)]));
const sha = (value) => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
const artifact = read(path);
if (sha(artifact) !== artifact.artifactSha256) throw new Error("v562-ixpe-artifact-sha");
if (artifact.version !== "v1-orbit-atlas-ixpe-measured-intake-v562" || artifact.status !== "blocked-public-data-package-missing" || artifact.target !== "Cyg X-1" || artifact.instrumentId !== "IXPE" || artifact.archive.provider !== "HEASARC" || artifact.archive.acquisition !== "explicit-command-only") throw new Error("v562-ixpe-identity");
if (artifact.inspect.readyFileCount !== 0 || artifact.inspect.missingFileIds.length !== 12 || artifact.inspect.invalidFileIds.length !== 0 || artifact.qualification.measuredAuthorityGranted !== false || artifact.qualification.sciencePayloadWritebackAllowed !== false || artifact.boundary.measuredRows !== 0 || artifact.boundary.syntheticValuesWritten !== false || artifact.boundary.networkAttempted !== false || artifact.boundary.automaticRetry !== false || artifact.boundary.automaticTargetReplacement !== false || artifact.boundary.denseCampaignStatus !== "incomplete-0-of-49" || artifact.boundary.formalProductPointer !== "v263" || artifact.boundary.defaultKernel !== "legacy-eih-1pn") throw new Error("v562-ixpe-boundary");
if (artifact.contract.requiredFileCount !== 12 || artifact.contract.syntheticValuesForbidden !== true || artifact.contract.networkByBuilder !== false || artifact.validation.mutationAudit.allRejected !== true || artifact.validation.mutationAudit.rejectedMutationCount !== artifact.validation.mutationAudit.attemptedMutationCount) throw new Error("v562-ixpe-contract");
for (const entry of artifact.sourceManifest) {
  const full = resolve(root, entry.path);
  if (!statSync(full).isFile()) throw new Error(`v562-ixpe-source:${entry.path}`);
}
console.log(JSON.stringify({ status: "passed-v562-ixpe-blocked-negative-evidence", artifactSha256: artifact.artifactSha256, target: artifact.target, requiredFiles: "0/12", mutationAudit: `${artifact.validation.mutationAudit.rejectedMutationCount}/${artifact.validation.mutationAudit.attemptedMutationCount}`, measuredAuthorityGranted: false, networkAttempted: false, denseCampaign: artifact.boundary.denseCampaignStatus, formalProductPointer: artifact.boundary.formalProductPointer }, null, 2));
