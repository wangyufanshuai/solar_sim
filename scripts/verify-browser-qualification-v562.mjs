import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const file = "dist/release/atlas-browser-qualification-v562.json";
const transient = new Set(["generatedAt", "artifactSha256", "receiptSha256"]);
const bytes = (path) => readFileSync(resolve(root, path));
const fileSha = (path) => createHash("sha256").update(bytes(path)).digest("hex");
const canonicalize = (value) => Array.isArray(value) ? value.map(canonicalize) : !value || typeof value !== "object" ? value : Object.fromEntries(Object.entries(value).filter(([key]) => !transient.has(key)).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, canonicalize(entry)]));
const sha = (value) => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
const receipt = JSON.parse(bytes(file).toString("utf8"));
if (receipt.version !== "v562-atlas-browser-qualification-v1" || receipt.status !== "passed-standalone-desktop-mobile-visual-regression-pending" || sha(receipt) !== receipt.receiptSha256 || sha(receipt.sourceManifest) !== receipt.sourceSha256) throw new Error("v562-browser-receipt-identity");
for (const entry of receipt.sourceManifest) if (!statSync(resolve(root, entry.path)).isFile() || statSync(resolve(root, entry.path)).size !== entry.bytes || fileSha(entry.path) !== entry.sha256) throw new Error(`v562-browser-receipt-source:${entry.path}`);
for (const id of ["desktop", "mobile"]) {
  const observed = receipt.observations[id];
  if (observed.canvasCount !== 1 || observed.consoleErrors.length || observed.pageErrors.length || observed.rendererErrors.length || observed.adapter.softwareRenderer !== false || observed.adapter.contextLost !== false || observed.sampleStatus !== "ready" || observed.frameSamples <= 240 || observed.medianFps < 55 || observed.frameP95Ms > 50 || JSON.stringify(observed.resourceBaseline) !== JSON.stringify(observed.resourceReleased) || fileSha(observed.capture.path) !== observed.capture.sha256) throw new Error(`v562-browser-receipt-observation:${id}`);
}
if (receipt.qualification.desktopBrowser !== true || receipt.qualification.mobileBrowser !== true || receipt.qualification.hardwareRenderer !== true || receipt.qualification.singleCanvas !== true || receipt.qualification.resourceLifecycleReturned !== true || receipt.qualification.overviewPerformanceQualified !== true || receipt.qualification.visualRegressionQualified !== false || receipt.qualification.scientificScenePerformanceQualified !== false || receipt.qualification.soakQualified !== false) throw new Error("v562-browser-receipt-qualification");
if (receipt.boundary.formalProductPointer !== "v263" || receipt.boundary.formalDefaultKernel !== "legacy-eih-1pn" || receipt.boundary.historicalVisualAssetsRestored !== false || receipt.boundary.historicalEvidenceRewritten !== false || receipt.boundary.measuredAuthorityGranted !== false || receipt.boundary.denseCampaignStatus !== "incomplete-0-of-49" || receipt.boundary.gpuRun !== false || receipt.boundary.productionPromotionAllowed !== false) throw new Error("v562-browser-receipt-boundary");
console.log(JSON.stringify({ status: "passed-v562-browser-qualification-verifier", receiptSha256: receipt.receiptSha256, desktopFps: receipt.observations.desktop.medianFps, mobileFps: receipt.observations.mobile.medianFps, visualRegressionQualified: false, productionPromotionAllowed: false }, null, 2));
