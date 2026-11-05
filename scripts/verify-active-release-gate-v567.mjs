import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const transient = new Set(["generatedAt", "receiptSha256", "artifactSha256", "evidenceSha256"]);
const canonicalize = (value) => Array.isArray(value) ? value.map(canonicalize) : !value || typeof value !== "object" ? value : Object.fromEntries(Object.entries(value).filter(([key]) => !transient.has(key)).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, canonicalize(entry)]));
const sha = (value) => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
const fileSha = (path) => createHash("sha256").update(readFileSync(resolve(root, path))).digest("hex");
const artifact = JSON.parse(readFileSync(resolve(root, "dist/release/orbit-atlas-active-release-gate-v567.json"), "utf8"));
if (artifact.version !== "v567-orbit-atlas-active-release-gate-v1" || artifact.status !== "lite-scientific-performance-soak-qualified-hero-visual-regression-blocked" || sha(artifact) !== artifact.artifactSha256) throw new Error("v567-active-gate");
if (artifact.releaseGates.standaloneBuild !== true || artifact.releaseGates.liteBuild !== true || artifact.releaseGates.overviewVisualRegression !== true || artifact.releaseGates.heroVisualRegression !== false || artifact.releaseGates.visualRegression !== false || artifact.releaseGates.scientificScenePerformance !== true || artifact.releaseGates.soak !== true || artifact.releaseGates.publicPreview !== false) throw new Error("v567-active-runtime");
if (artifact.scienceAdmission.transportQualified !== true || artifact.scienceAdmission.radiativeTransferQualified !== false || artifact.scienceAdmission.measuredAuthorityGranted !== false || artifact.scienceAdmission.denseCpuAuthorityQualified !== false || artifact.scienceAdmission.denseCampaignStatus !== "incomplete-0-of-49" || artifact.scienceAdmission.gpuShadowQualified !== false || artifact.scienceAdmission.publicResearchRelease !== false) throw new Error("v567-active-science");
if (artifact.boundary.formalProductPointer !== "v263" || artifact.boundary.priorV562GateRewritten !== false || artifact.boundary.productionPromotionAllowed !== false || artifact.boundary.publicDeploymentAllowed !== false || artifact.boundary.denseRunAllowed !== false || artifact.boundary.gpuRunAllowed !== false) throw new Error("v567-active-boundary");
if (sha(artifact.sourceManifest) !== artifact.sourceSha256) throw new Error("v567-active-source-sha");
for (const source of artifact.sourceManifest) { const stat = statSync(resolve(root, source.path)); if (stat.size !== source.bytes || fileSha(source.path) !== source.sha256) throw new Error(`v567-active-source-drift:${source.path}`); }
console.log(JSON.stringify({ status: "passed-v567-active-release-gate", artifactSha256: artifact.artifactSha256, liteBuild: true, overviewVisualRegression: true, heroVisualRegression: false, visualRegression: false, scientificScenePerformance: true, soak: true, radiativeTransferQualified: false, measuredAuthorityGranted: false, denseCampaign: "0/49-source-manifest-drift", gpuShadowQualified: false, publicResearchRelease: false, formalProductPointer: "v263" }, null, 2));
