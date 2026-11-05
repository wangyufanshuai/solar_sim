import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const dist = resolve(root, "dist/release/orbit-atlas-visual-freeze-v585");
const docs = resolve(root, "docs/release/v585");
const requireRuntime = process.argv.includes("--require-runtime");
const requirePreview = process.argv.includes("--require-preview");
const jsonNames = [
  "visual-freeze-audit-v585.json",
  "legacy-v9-asset-recovery-v585.json",
  "stable-candidate-import-boundary-v585.json",
  "public-asset-availability-v585.json",
  "desktop-mobile-visual-matrix-v585.json",
  "visual-authority-manifest-v585.json",
];
const markdownNames = ["rollback-plan-v585.md", "current-capability-report-v585.md"];
const supplementalReceiptNames = ["vercel-preview-deployment-v585.json", "public-head-runner-blocker-v585.json", "public-head-admission-v585.json", "git-push-blocker-v585.json"];
const transient = new Set(["artifactSha256", "receiptSha256"]);
const canonical = (value) => Array.isArray(value) ? value.map(canonical) : !value || typeof value !== "object" ? value : Object.fromEntries(Object.entries(value).filter(([key]) => !transient.has(key)).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, canonical(entry)]));
const canonicalSha = (value) => createHash("sha256").update(JSON.stringify(canonical(value))).digest("hex");
const artifacts = new Map();
for (const name of [...jsonNames, ...markdownNames]) {
  const distBytes = readFileSync(resolve(dist, name));
  const docsBytes = readFileSync(resolve(docs, name));
  if (!distBytes.equals(docsBytes)) throw new Error(`v585-mirror-drift:${name}`);
  if (name.endsWith(".json")) {
    const artifact = JSON.parse(distBytes.toString("utf8"));
    if (!/^[a-f0-9]{64}$/.test(artifact.artifactSha256) || canonicalSha(artifact) !== artifact.artifactSha256) throw new Error(`v585-artifact-sha:${name}`);
    artifacts.set(name, artifact);
  }
}
const supplementalReceipts = new Map();
for (const name of supplementalReceiptNames) {
  const distBytes = readFileSync(resolve(dist, name));
  const docsBytes = readFileSync(resolve(docs, name));
  if (!distBytes.equals(docsBytes)) throw new Error(`v585-supplemental-mirror-drift:${name}`);
  const receipt = JSON.parse(distBytes.toString("utf8"));
  if (!/^[a-f0-9]{64}$/.test(receipt.receiptSha256) || canonicalSha(receipt) !== receipt.receiptSha256) throw new Error(`v585-supplemental-receipt-sha:${name}`);
  supplementalReceipts.set(name, receipt);
}
const audit = artifacts.get("visual-freeze-audit-v585.json");
const recovery = artifacts.get("legacy-v9-asset-recovery-v585.json");
const boundary = artifacts.get("stable-candidate-import-boundary-v585.json");
const availability = artifacts.get("public-asset-availability-v585.json");
const matrix = artifacts.get("desktop-mobile-visual-matrix-v585.json");
const authority = artifacts.get("visual-authority-manifest-v585.json");
const previewDeployment = supplementalReceipts.get("vercel-preview-deployment-v585.json");
const publicHeadBlocker = supplementalReceipts.get("public-head-runner-blocker-v585.json");
const publicHeadAdmission = supplementalReceipts.get("public-head-admission-v585.json");
const gitPushBlocker = supplementalReceipts.get("git-push-blocker-v585.json");
if (audit.status !== "stable-binding-restored-candidate-decoupled" || recovery.status !== "recovered-original-byte-complete" || recovery.assets.length !== 5 || recovery.assets.some((asset) => asset.qualified !== true) || boundary.status !== "qualified-fail-closed-three-lane-boundary" || boundary.hardGates.stableRootNoCandidateV !== true || boundary.hardGates.stableDefaultLegacyV9 !== true || boundary.hardGates.candidateExplicitOnly !== true) throw new Error("v585-static-gates");
if (authority.formalPointers.product !== "v263" || authority.formalPointers.scienceKernel !== "legacy-eih-1pn" || authority.formalPointers.visual !== "stable-v263-legacy-v9" || authority.gates.staticFreeze !== true || authority.gates.buildProfiles !== true || authority.gates.productionAliasSwitchAllowed !== false || authority.immutableBoundaries.productionAliasChanged !== false) throw new Error("v585-authority-boundary");
if (authority.evidence.visualFreezeAuditSha256 !== audit.artifactSha256 || authority.evidence.legacyRecoverySha256 !== recovery.artifactSha256 || authority.evidence.importBoundarySha256 !== boundary.artifactSha256 || authority.evidence.publicAvailabilitySha256 !== availability.artifactSha256 || authority.evidence.visualMatrixSha256 !== matrix.artifactSha256) throw new Error("v585-evidence-links");
if (previewDeployment.deployment.target !== "preview" || previewDeployment.deployment.readyState !== "READY" || previewDeployment.qualification.previewBuildReady !== true || previewDeployment.qualification.productionFlagUsed !== false || previewDeployment.qualification.productionAliasChanged !== false || previewDeployment.qualification.productionPromotionAllowed !== false) throw new Error("v585-preview-deployment-boundary");
if (publicHeadBlocker.audit.automaticRetry !== false || publicHeadBlocker.audit.automaticTargetReplacement !== false || publicHeadBlocker.interpretation.previewHeadGatePassed !== false || publicHeadBlocker.interpretation.asset404Observed !== false || publicHeadBlocker.interpretation.productionPromotionAllowed !== false) throw new Error("v585-public-head-blocker-boundary");
const admissionPaths = publicHeadAdmission.requests.map((entry) => entry.path);
if (publicHeadAdmission.deployment.id !== previewDeployment.deployment.id || publicHeadAdmission.deployment.environment !== "preview" || publicHeadAdmission.dispatch.automaticRetry !== false || publicHeadAdmission.dispatch.automaticTargetReplacement !== false || publicHeadAdmission.dispatch.payloadDownloaded !== false || publicHeadAdmission.requests.length !== 29 || new Set(admissionPaths).size !== 29 || publicHeadAdmission.requests.some((entry) => entry.method !== "HEAD" || entry.status !== 200) || publicHeadAdmission.qualification.allRequiredHead200 !== true || publicHeadAdmission.qualification.http404Count !== 0 || publicHeadAdmission.qualification.productionPromotionAllowed !== false) throw new Error("v585-public-head-admission-boundary");
if (gitPushBlocker.classification !== "blocked-no-remote-configured" || gitPushBlocker.repository.remoteCount !== 0 || gitPushBlocker.qualification.pushCompleted !== false || gitPushBlocker.qualification.remoteGuessedOrAdded !== false || gitPushBlocker.qualification.forcePushUsed !== false) throw new Error("v585-git-push-blocker-boundary");
if (authority.evidence.previewDeploymentReceiptSha256 !== previewDeployment.receiptSha256 || authority.evidence.publicHeadBlockerReceiptSha256 !== publicHeadBlocker.receiptSha256 || authority.evidence.publicHeadAdmissionReceiptSha256 !== publicHeadAdmission.receiptSha256 || authority.evidence.gitPushBlockerReceiptSha256 !== gitPushBlocker.receiptSha256) throw new Error("v585-supplemental-evidence-links");
if (requireRuntime && (matrix.qualification.browserQualified !== true || matrix.qualification.visualRegressionQualified !== true || matrix.qualification.requiredAsset404Count !== 0 || matrix.qualification.singleCanvas !== true || matrix.qualification.horizontalOverflowZero !== true || matrix.qualification.scienceLinearNoBloomGradeGrain !== true || matrix.qualification.cinematicScienceWriteback !== false)) throw new Error("v585-runtime-gates");
if (requirePreview && availability.qualification.v585PreviewAllRequiredHead200 !== true) throw new Error("v585-preview-head-gate");
const hero = readFileSync(resolve(root, "app/components/OrbitAtlasHeroScenesV562.tsx"), "utf8");
const candidate = JSON.parse(readFileSync(resolve(root, "dist/science/atlas-visual-candidate-v562/manifest.json"), "utf8"));
if (!hero.includes(candidate.manifestSha256)) throw new Error("v585-hero-manifest-binding");
console.log(JSON.stringify({ status: "verified", artifactCount: 8, supplementalReceiptCount: supplementalReceiptNames.length, static: true, runtime: requireRuntime ? true : matrix.qualification.browserQualified, previewBuildReady: previewDeployment.qualification.previewBuildReady, previewBrowserRootReachable: previewDeployment.qualification.browserDirectRootReached, previewHead: requirePreview ? true : availability.qualification.v585PreviewAllRequiredHead200, productionAliasSwitchAllowed: false }, null, 2));
