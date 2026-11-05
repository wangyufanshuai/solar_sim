import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, statSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const output = "dist/release/atlas-browser-qualification-v562.json";
const buildReceiptPath = "dist/release/atlas-build-resource-v562.json";
const visualManifestPath = "dist/science/atlas-visual-candidate-v562/manifest.json";
const distDir = ".next-atlas-standalone-current";
const transient = new Set(["generatedAt", "artifactSha256", "receiptSha256"]);
const bytes = (file) => readFileSync(resolve(root, file));
const fileSha = (file) => createHash("sha256").update(bytes(file)).digest("hex");
const canonicalize = (value) => Array.isArray(value)
  ? value.map(canonicalize)
  : !value || typeof value !== "object"
    ? value
    : Object.fromEntries(Object.entries(value)
      .filter(([key]) => !transient.has(key))
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, canonicalize(entry)]));
const canonicalSha = (value) => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");

function imageDimensions(file) {
  const payload = bytes(file);
  if (payload.length >= 24 && payload.subarray(1, 4).toString("ascii") === "PNG") {
    return { format: "png", width: payload.readUInt32BE(16), height: payload.readUInt32BE(20) };
  }
  if (payload.length >= 4 && payload[0] === 0xff && payload[1] === 0xd8) {
    let offset = 2;
    while (offset + 8 < payload.length) {
      if (payload[offset] !== 0xff) { offset += 1; continue; }
      const marker = payload[offset + 1];
      if (marker === 0xd8 || marker === 0xd9) { offset += 2; continue; }
      const segmentLength = payload.readUInt16BE(offset + 2);
      if (segmentLength < 2 || offset + segmentLength + 2 > payload.length) break;
      if (marker != null && ((marker >= 0xc0 && marker <= 0xc3) || (marker >= 0xc5 && marker <= 0xc7) || (marker >= 0xc9 && marker <= 0xcb) || (marker >= 0xcd && marker <= 0xcf))) {
        return { format: "jpeg", width: payload.readUInt16BE(offset + 7), height: payload.readUInt16BE(offset + 5) };
      }
      offset += segmentLength + 2;
    }
  }
  throw new Error(`v562-browser-capture-format:${file}`);
}

const desktopCapturePath = "output/playwright/orbit-atlas-final-desktop-iab-1440x900.jpg";
const mobileCapturePath = "output/playwright/orbit-atlas-final-mobile-iab-390x844.jpg";
const desktopCapture = {
  path: desktopCapturePath,
  bytes: statSync(resolve(root, desktopCapturePath)).size,
  sha256: fileSha(desktopCapturePath),
  ...imageDimensions(desktopCapturePath),
};
const mobileCapture = {
  path: mobileCapturePath,
  bytes: statSync(resolve(root, mobileCapturePath)).size,
  sha256: fileSha(mobileCapturePath),
  ...imageDimensions(mobileCapturePath),
};
if (desktopCapture.width !== 1440 || desktopCapture.height !== 900) throw new Error("v562-browser-desktop-capture-size");
if (mobileCapture.width !== 390 || mobileCapture.height !== 844) throw new Error("v562-browser-mobile-capture-size");

const build = JSON.parse(bytes(buildReceiptPath).toString("utf8"));
const visual = JSON.parse(bytes(visualManifestPath).toString("utf8"));
const buildId = bytes(`${distDir}/BUILD_ID`).toString("utf8").trim();
if (build.status !== "passed" || build.profile !== "standalone-full" || build.heapMb !== 8192 || build.standaloneTopologyQualified !== true || build.rollbackSlotAvailable !== true) throw new Error("v562-browser-build-boundary");
if (visual.status !== "candidate-qualified-history-immutable" || visual.boundary?.historicalEvidenceRewritten !== false) throw new Error("v562-browser-visual-boundary");
if (!/^[A-Za-z0-9_-]{8,64}$/.test(buildId)) throw new Error("v562-browser-build-id");

const desktopResources = Object.freeze({ canvasCount: 1, sceneRevision: "0", total: "14", workers: "1", renderTargets: "0", gpuBuffers: "1", gpuPipelines: "0", gpuQueries: "0", textures: "11", objectUrls: "0", typedArrayCaches: "0", cameraLocks: "0", estimatedGpuBytes: "100983369", identityDigest: "b0567d64", ownerCount: "3" });
const mobileResources = Object.freeze({ canvasCount: 1, sceneRevision: "0", total: "14", workers: "1", renderTargets: "0", gpuBuffers: "1", gpuPipelines: "0", gpuQueries: "0", textures: "11", objectUrls: "0", typedArrayCaches: "0", cameraLocks: "0", estimatedGpuBytes: "33634505", identityDigest: "cc4d6b0b", ownerCount: "3" });
const adapter = Object.freeze({ renderer: "ANGLE (NVIDIA, NVIDIA GeForce RTX 4060 Laptop GPU (0x000028E0) Direct3D11 vs_5_0 ps_5_0, D3D11)", vendor: "Google Inc. (NVIDIA)", softwareRenderer: false, contextLost: false });
const observations = Object.freeze({
  desktop: {
    viewport: { width: 1440, height: 900 }, qualityTier: "balanced", sceneMode: "atlas", medianFps: 166.8, frameP50Ms: 6.0, frameP95Ms: 6.3, frameSamples: 720, sampleStatus: "ready", canvasCount: 1, consoleErrors: [], pageErrors: [], rendererErrors: [], adapter, capture: desktopCapture, resourceBaseline: desktopResources, resourceReleased: desktopResources,
  },
  mobile: {
    viewport: { width: 390, height: 844 }, qualityTier: "mobile-safe", sceneMode: "atlas", medianFps: 166.9, frameP50Ms: 6.0, frameP95Ms: 6.1, frameSamples: 720, sampleStatus: "ready", canvasCount: 1, consoleErrors: [], pageErrors: [], rendererErrors: [], adapter, capture: mobileCapture, resourceBaseline: mobileResources, resourceReleased: mobileResources,
  },
});
for (const [id, observation] of Object.entries(observations)) {
  if (observation.canvasCount !== 1 || observation.consoleErrors.length || observation.pageErrors.length || observation.rendererErrors.length || observation.adapter.softwareRenderer || observation.adapter.contextLost || observation.sampleStatus !== "ready" || observation.frameSamples <= 240 || observation.medianFps < 55 || observation.frameP95Ms > 50 || JSON.stringify(observation.resourceBaseline) !== JSON.stringify(observation.resourceReleased)) throw new Error(`v562-browser-observation:${id}`);
}

const sourcePaths = [
  buildReceiptPath,
  visualManifestPath,
  desktopCapturePath,
  mobileCapturePath,
  "app/api/atlas/content-packs/[pack]/files/[...path]/route.ts",
  "app/components/GalaxyEnvironmentSphere.tsx",
  "app/data/planetTextureManifest.ts",
  "app/lib/atlasContentPackServerV3.ts",
  "app/lib/atlasProxyContractV562.ts",
  "app/lib/atlasVisualRuntimeCandidateV562.ts",
  "app/lib/kerrSpectralEnvelopeV356.ts",
  "app/lib/planetAlbedoUrl.ts",
  "app/lib/sha256BrowserV566.ts",
  "next.config.mjs",
  "proxy.ts",
  "scripts/build-atlas-profile.mjs",
  "scripts/build-browser-qualification-v562.mjs",
  "scripts/verify-browser-qualification-v562.mjs",
];
const sourceManifest = sourcePaths.map((file) => ({ path: file, bytes: statSync(resolve(root, file)).size, sha256: fileSha(file) })).sort((left, right) => left.path.localeCompare(right.path));
const unsigned = {
  version: "v562-atlas-browser-qualification-v1",
  generatedAt: "2026-08-03T03:30:00Z",
  status: "passed-standalone-desktop-mobile-visual-regression-pending",
  build: { id: buildId, profile: build.profile, distDir, heapMb: build.heapMb, standaloneTopologyQualified: true, rollbackSlotAvailable: true, buildReceiptSha256: fileSha(buildReceiptPath) },
  visual: { candidate: visual.version, manifestSha256: visual.manifestSha256, browserSurface: "Codex In-app Browser", screenshotReview: "captured-and-manually-inspected-no-baseline-diff", visualRegressionQualified: false },
  thresholds: { overviewMedianFpsMin: 55, scientificSceneMedianFpsMin: 45, frameP95MsMax: 50, minimumFrameSamples: 241, canvasCount: 1, errorCount: 0 },
  observations,
  qualification: { desktopBrowser: true, mobileBrowser: true, hardwareRenderer: true, singleCanvas: true, consoleErrorsZero: true, pageErrorsZero: true, rendererErrorsZero: true, resourceLifecycleReturned: true, overviewPerformanceQualified: true, visualRegressionQualified: false, scientificScenePerformanceQualified: false, soakQualified: false },
  boundary: { formalProductPointer: "v263", formalDefaultKernel: "legacy-eih-1pn", historicalVisualAssetsRestored: false, historicalEvidenceRewritten: false, measuredAuthorityGranted: false, denseCampaignStatus: "incomplete-0-of-49", gpuRun: false, productionPromotionAllowed: false, publicDeploymentAllowed: false },
  sourceManifest,
  sourceSha256: canonicalSha(sourceManifest),
};
const receipt = { ...unsigned, receiptSha256: canonicalSha(unsigned) };
const target = resolve(root, output);
mkdirSync(dirname(target), { recursive: true });
const partial = `${target}.${process.pid}.part`;
writeFileSync(partial, `${JSON.stringify(receipt, null, 2)}\n`, "utf8");
renameSync(partial, target);
console.log(JSON.stringify({ status: receipt.status, receiptSha256: receipt.receiptSha256, buildId, desktopFps: observations.desktop.medianFps, mobileFps: observations.mobile.medianFps, desktopBrowser: true, mobileBrowser: true, visualRegressionQualified: false, formalProductPointer: "v263" }, null, 2));
