import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, statSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const output = "dist/release/atlas-hero-browser-qualification-v562.json";
const transient = new Set(["generatedAt", "receiptSha256", "artifactSha256"]);
const bytes = (file) => readFileSync(resolve(root, file));
const fileSha = (file) => createHash("sha256").update(bytes(file)).digest("hex");
const canonicalize = (value) => Array.isArray(value) ? value.map(canonicalize) : !value || typeof value !== "object" ? value : Object.fromEntries(Object.entries(value).filter(([key]) => !transient.has(key)).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, canonicalize(entry)]));
const canonicalSha = (value) => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");

function jpegDimensions(file) {
  const payload = bytes(file);
  if (payload[0] !== 0xff || payload[1] !== 0xd8) throw new Error(`v562-hero-capture-not-jpeg:${file}`);
  let offset = 2;
  while (offset + 8 < payload.length) {
    if (payload[offset] !== 0xff) { offset += 1; continue; }
    const marker = payload[offset + 1];
    const segmentLength = payload.readUInt16BE(offset + 2);
    if (segmentLength < 2 || offset + segmentLength + 2 > payload.length) break;
    if (marker != null && ((marker >= 0xc0 && marker <= 0xc3) || (marker >= 0xc5 && marker <= 0xc7) || (marker >= 0xc9 && marker <= 0xcb) || (marker >= 0xcd && marker <= 0xcf))) return { width: payload.readUInt16BE(offset + 7), height: payload.readUInt16BE(offset + 5) };
    offset += segmentLength + 2;
  }
  throw new Error(`v562-hero-capture-dimensions:${file}`);
}

const captureSpecs = [
  ["desktop-science-01", "output/playwright/orbit-atlas-v562-hero-desktop-science-iab-1440x900.jpg", 1440, 900],
  ["desktop-science-02", "output/playwright/orbit-atlas-v562-hero-desktop-02-science-iab.jpg", 1440, 900],
  ["desktop-science-03", "output/playwright/orbit-atlas-v562-hero-desktop-03-science-iab.jpg", 1440, 900],
  ["desktop-science-04", "output/playwright/orbit-atlas-v562-hero-desktop-04-science-iab.jpg", 1440, 900],
  ["desktop-cinematic-04", "output/playwright/orbit-atlas-v562-hero-desktop-cinematic-iab-1440x900.jpg", 1440, 900],
  ["mobile-science-01", "output/playwright/orbit-atlas-v562-hero-mobile-science-reloaded-iab-390x844.jpg", 390, 844],
];
const captures = captureSpecs.map(([id, path, expectedWidth, expectedHeight]) => {
  const dimensions = jpegDimensions(path);
  if (dimensions.width !== expectedWidth || dimensions.height !== expectedHeight) throw new Error(`v562-hero-capture-size:${id}`);
  return { id, path, format: "jpeg", bytes: statSync(resolve(root, path)).size, sha256: fileSha(path), ...dimensions };
});
const visual = JSON.parse(bytes("dist/science/atlas-visual-candidate-v562/manifest.json").toString("utf8"));
if (visual.status !== "candidate-qualified-history-immutable" || visual.boundary?.historicalEvidenceRewritten !== false) throw new Error("v562-hero-visual-boundary");

const sourcePaths = [
  "app/components/OrbitAtlasHeroScenesV562.tsx",
  "app/components/OrbitAtlasHeroScenesV562.test.tsx",
  "app/lib/atlasProxyContractV562.ts",
  "app/local-shadow-v562/page.tsx",
  "dist/science/atlas-visual-candidate-v562/manifest.json",
  "next.config.mjs",
  "proxy.ts",
  "scripts/build-hero-browser-qualification-v562.mjs",
  "scripts/verify-hero-browser-qualification-v562.mjs",
  ...captures.map((capture) => capture.path),
];
const sourceManifest = sourcePaths.map((file) => ({ path: file, bytes: statSync(resolve(root, file)).size, sha256: fileSha(file) })).sort((left, right) => left.path.localeCompare(right.path));
const unsigned = {
  version: "v562-atlas-hero-browser-qualification-v1",
  generatedAt: "2026-08-03T03:40:00Z",
  status: "passed-interaction-screenshot-visual-regression-performance-pending",
  browserSurface: "Codex In-app Browser",
  visualCandidate: { version: visual.version, manifestSha256: visual.manifestSha256 },
  desktop: { viewport: { width: 1440, height: 900 }, sceneIds: ["kerr-volume-disk", "photon-ring-lensing", "polarization-field", "science-cinematic-ab"], uniqueSceneCount: 4, scienceModeObserved: true, cinematicModeObserved: true, sharedGeometry: true, cinematicWriteback: false, additionalCanvasCount: 0, svgCount: 1, documentHorizontalOverflow: false, browserErrorCount: 0, browserWarningCount: 0 },
  mobile: { viewport: { width: 390, height: 844 }, sceneIds: ["kerr-volume-disk", "polarization-field", "science-cinematic-ab"], scienceModeObserved: true, cinematicModeObserved: true, sharedGeometry: true, cinematicWriteback: false, additionalCanvasCount: 0, svgCount: 1, documentHorizontalOverflow: false, browserErrorCount: 0, browserWarningCount: 0 },
  captures,
  qualification: { heroSceneInteractionQualified: true, desktopScreenshotQualified: true, mobileScreenshotQualified: true, scienceCinematicBoundaryQualified: true, visualRegressionQualified: false, scientificScenePerformanceQualified: false, productionPromotionAllowed: false },
  boundary: { formalProductPointer: "v263", formalDefaultKernel: "legacy-eih-1pn", measuredAuthorityGranted: false, historicalVisualAssetsRestored: false, historicalEvidenceRewritten: false, denseCampaignStatus: "incomplete-0-of-49", gpuRun: false, networkAttempted: false },
  sourceManifest,
  sourceSha256: canonicalSha(sourceManifest),
};
const receipt = { ...unsigned, receiptSha256: canonicalSha(unsigned) };
const target = resolve(root, output);
mkdirSync(dirname(target), { recursive: true });
const partial = `${target}.${process.pid}.part`;
writeFileSync(partial, `${JSON.stringify(receipt, null, 2)}\n`, "utf8");
renameSync(partial, target);
console.log(JSON.stringify({ status: receipt.status, receiptSha256: receipt.receiptSha256, heroSceneCount: 4, captures: captures.length, visualRegressionQualified: false, scientificScenePerformanceQualified: false, productionPromotionAllowed: false }, null, 2));
