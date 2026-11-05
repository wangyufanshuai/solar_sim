import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const file = "dist/release/atlas-hero-browser-qualification-v562.json";
const transient = new Set(["generatedAt", "receiptSha256", "artifactSha256"]);
const bytes = (path) => readFileSync(resolve(root, path));
const fileSha = (path) => createHash("sha256").update(bytes(path)).digest("hex");
const canonicalize = (value) => Array.isArray(value) ? value.map(canonicalize) : !value || typeof value !== "object" ? value : Object.fromEntries(Object.entries(value).filter(([key]) => !transient.has(key)).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, canonicalize(entry)]));
const sha = (value) => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
const receipt = JSON.parse(bytes(file).toString("utf8"));
if (receipt.version !== "v562-atlas-hero-browser-qualification-v1" || receipt.status !== "passed-interaction-screenshot-visual-regression-performance-pending" || sha(receipt) !== receipt.receiptSha256 || sha(receipt.sourceManifest) !== receipt.sourceSha256) throw new Error("v562-hero-receipt-identity");
for (const entry of receipt.sourceManifest) if (!statSync(resolve(root, entry.path)).isFile() || statSync(resolve(root, entry.path)).size !== entry.bytes || fileSha(entry.path) !== entry.sha256) throw new Error(`v562-hero-receipt-source:${entry.path}`);
if (receipt.desktop.uniqueSceneCount !== 4 || receipt.desktop.sceneIds.length !== 4 || receipt.desktop.scienceModeObserved !== true || receipt.desktop.cinematicModeObserved !== true || receipt.desktop.sharedGeometry !== true || receipt.desktop.cinematicWriteback !== false || receipt.desktop.additionalCanvasCount !== 0 || receipt.desktop.documentHorizontalOverflow !== false || receipt.desktop.browserErrorCount !== 0 || receipt.mobile.viewport.width !== 390 || receipt.mobile.viewport.height !== 844 || receipt.mobile.documentHorizontalOverflow !== false || receipt.mobile.browserErrorCount !== 0) throw new Error("v562-hero-receipt-observation");
for (const capture of receipt.captures) if (fileSha(capture.path) !== capture.sha256 || capture.format !== "jpeg" || capture.bytes <= 0) throw new Error(`v562-hero-receipt-capture:${capture.id}`);
if (receipt.qualification.heroSceneInteractionQualified !== true || receipt.qualification.desktopScreenshotQualified !== true || receipt.qualification.mobileScreenshotQualified !== true || receipt.qualification.scienceCinematicBoundaryQualified !== true || receipt.qualification.visualRegressionQualified !== false || receipt.qualification.scientificScenePerformanceQualified !== false || receipt.qualification.productionPromotionAllowed !== false || receipt.boundary.formalProductPointer !== "v263" || receipt.boundary.measuredAuthorityGranted !== false || receipt.boundary.denseCampaignStatus !== "incomplete-0-of-49" || receipt.boundary.gpuRun !== false) throw new Error("v562-hero-receipt-boundary");
console.log(JSON.stringify({ status: "passed-v562-hero-browser-verifier", receiptSha256: receipt.receiptSha256, heroSceneCount: receipt.desktop.uniqueSceneCount, captureCount: receipt.captures.length, visualRegressionQualified: false, scientificScenePerformanceQualified: false }, null, 2));
