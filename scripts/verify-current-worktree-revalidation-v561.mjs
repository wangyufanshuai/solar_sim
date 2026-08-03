import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const artifactPath = "dist/science/orbit-atlas-current-worktree-revalidation-v561.json";
const capabilityPath = "dist/release/orbit-atlas-current-capability-v561.json";
const transient = new Set(["generatedAt", "artifactSha256", "capabilitySha256", "evidenceSha256", "pointerSha256", "resultSha256"]);
const bytes = (path) => readFileSync(resolve(root, path));
const read = (path) => JSON.parse(bytes(path).toString("utf8"));
const fileSha = (path) => createHash("sha256").update(bytes(path)).digest("hex");
const canonicalize = (value) => Array.isArray(value)
  ? value.map(canonicalize)
  : !value || typeof value !== "object"
    ? value
    : Object.fromEntries(Object.entries(value).filter(([key]) => !transient.has(key)).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, canonicalize(entry)]));
const sha = (value) => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");

const artifact = read(artifactPath);
const capability = read(capabilityPath);
if (sha(artifact) !== artifact.artifactSha256) throw new Error("v561-artifact-sha");
if (sha(capability) !== capability.capabilitySha256) throw new Error("v561-capability-sha");
if (artifact.version !== "orbit-atlas-current-worktree-revalidation-v561" || capability.version !== "orbit-atlas-current-capability-v561") throw new Error("v561-version");
if (artifact.currentWorktree.sourceAudit.mismatchCount !== 0 || artifact.revalidation.v560SourceManifestReplayed !== true) throw new Error("v561-current-v560-drift");
if (artifact.historicalDrift.mismatchCount < 1 || artifact.historicalDrift.historicalEvidenceMutated !== false || artifact.historicalDrift.historicalFilesRewritten !== false) throw new Error("v561-history-boundary");
if (artifact.boundary.formalProductPointer !== undefined) throw new Error("v561-boundary-shape");
if (artifact.boundary.measuredAuthorityGranted !== false || artifact.boundary.denseCampaignStatus !== "incomplete-0-of-49" || artifact.boundary.aggregateAvailable !== false || artifact.boundary.publicDeploymentBlocked !== true || artifact.boundary.productionPromotionAllowed !== false) throw new Error("v561-promotion-boundary");
if (artifact.baseline.engineImportArtifactSha256 === undefined || artifact.capabilities?.v561OrbitRelativityEngine !== "qualified-cpu-reference-5-rays-kerr-transport-measured-unavailable-grmhd-unavailable") throw new Error("v561-engine-boundary");
if (capability.baseline.formalProductPointer !== "v263" || capability.baseline.defaultKernel !== "legacy-eih-1pn" || capability.promotion.promotionAllowed !== false || capability.promotion.publicDeploymentBlocked !== true || capability.promotion.localShadowDefaultApplied !== false || capability.evidence.revalidationSha256 !== artifact.artifactSha256) throw new Error("v561-capability-boundary");
for (const entry of artifact.sourceManifest) if (fileSha(entry.path) !== entry.sha256) throw new Error(`v561-source-manifest:${entry.path}`);

console.log(JSON.stringify({
  status: "passed-v561-current-worktree-revalidation",
  artifactSha256: artifact.artifactSha256,
  capabilitySha256: capability.capabilitySha256,
  currentV560Mismatches: artifact.currentWorktree.sourceAudit.mismatchCount,
  historicalV559Mismatches: artifact.historicalDrift.mismatchCount,
  formalProductPointer: "v263",
  defaultKernel: "legacy-eih-1pn",
  denseCampaign: "0/49",
  promotionAllowed: false,
}, null, 2));
