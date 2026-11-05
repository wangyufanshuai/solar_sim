import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, statSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const generatedAt = process.env.V587_GENERATED_AT ?? "2026-08-08T00:00:00Z";
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const canonicalize = (value) => Array.isArray(value)
  ? value.map(canonicalize)
  : value === null || typeof value !== "object"
    ? value
    : Object.fromEntries(Object.keys(value).sort((left, right) => left.localeCompare(right)).map((key) => [key, canonicalize(value[key])]));
const canonicalSha = (value) => sha256(Buffer.from(JSON.stringify(canonicalize(value)), "utf8"));
const readJson = (path) => JSON.parse(readFileSync(resolve(root, path), "utf8"));
const record = (path) => {
  const absolute = resolve(root, path);
  const bytes = readFileSync(absolute);
  return { path, bytes: statSync(absolute).size, sha256: sha256(bytes) };
};

const summary = readJson("public/data/kerr-observation-v587/observation-summary.json");
const visualManifest = readJson("public/data/kerr-observation-v587/visual-manifest.json");
const liteBuild = readJson("dist/release/atlas-lite-build-resource-v562.json");
const standaloneBuild = readJson("dist/release/atlas-build-resource-v562.json");
if (liteBuild.status !== "passed" || standaloneBuild.status !== "passed") throw new Error("v587-visual-acceptance-build-gate");
if (summary.authority.measuredAuthorityGranted !== false || summary.authority.gpuAuthorityGranted !== false) throw new Error("v587-visual-acceptance-authority");

const screenshotPaths = [
  "docs/release/v587/visual-qa/reference-concept-v587.png",
  "docs/release/v587/visual-qa/desktop-cinematic-1440x900.png",
  "docs/release/v587/visual-qa/desktop-science-1440x900.png",
  "docs/release/v587/visual-qa/mobile-cinematic-390x844.png",
  "docs/release/v587/visual-qa/mobile-science-390x844.png",
  "docs/release/v587/visual-qa/mobile-inspector-390x844.png",
  "docs/release/v587/visual-qa/comparison-reference-vs-cinematic.png",
  "docs/release/v587/visual-qa/comparison-reference-vs-science.png",
  "docs/release/v587/visual-qa/comparison-hero-reference-vs-cinematic.png",
];

const unsigned = {
  version: "v587-browser-visual-acceptance-v1",
  generatedAt,
  status: "passed-visual-gate-post-build-browser-replay-blocked",
  sourceVisualTruth: "docs/release/v587/visual-qa/reference-concept-v587.png",
  browserSurface: "codex-in-app-browser",
  capturePhase: "final-cinematic-source-and-near-final-science-source-before-standalone-build",
  viewports: {
    desktop: {
      width: 1440,
      height: 900,
      scienceMedianFps: 176.5,
      cinematicMedianFps: 175.4,
      canvasCount: 1,
      consolePageRendererErrorCount: 0,
      horizontalOverflow: false,
    },
    mobile: {
      width: 390,
      height: 844,
      scienceMedianFps: 179.7,
      cinematicMedianFps: 186.9,
      canvasCount: 1,
      consolePageRendererErrorCount: 0,
      horizontalOverflow: false,
      inspectorSheetQualified: true,
    },
  },
  scienceCinematicBoundary: {
    scientificPayloadSha256: summary.authorityReference,
    payloadStableAcrossModeSwitch: true,
    scienceLinear: true,
    cinematicPresentationOnly: true,
    ktx2ManifestSha256: visualManifest.manifestSha256,
    measuredAuthorityGranted: false,
    gpuAuthorityGranted: false,
    radiativeTransferGranted: false,
  },
  buildGates: {
    lite: { status: liteBuild.status, heapMb: liteBuild.heapMb, rollbackSlotAvailable: liteBuild.rollbackSlotAvailable },
    standalone: { status: standaloneBuild.status, heapMb: standaloneBuild.heapMb, rollbackSlotAvailable: standaloneBuild.rollbackSlotAvailable },
    swcRuntime: standaloneBuild.swcRuntime.mode,
  },
  postBuildBrowserReplay: {
    status: "blocked-browser-url-policy-after-local-preview-restart",
    sourceChangedAfterCapture: true,
    boundedChangesAfterScienceCapture: [
      "candidate-authority-labels-and-inspector-compaction-visible-in-final-desktop-cinematic-capture",
      "final-capture-edge-attenuation-visible-in-final-mobile-science-capture",
    ],
    alternateBrowserAttempted: false,
  },
  screenshots: screenshotPaths.map(record),
  boundary: {
    formalProductPointer: "v263",
    researchCandidateOnly: true,
    promotionAllowed: false,
    denseCampaignStatus: "incomplete-0-of-49",
    denseExecutionStarted: false,
    gpuRaytraceStarted: false,
    ixpePayloadDownloaded: false,
    productionDeploymentAttempted: false,
    publicReleaseAttempted: false,
  },
};

const receipt = { ...unsigned, receiptSha256: canonicalSha(unsigned) };
const target = resolve(root, "docs/release/v587/visual-acceptance-v587.json");
mkdirSync(resolve(target, ".."), { recursive: true });
const part = `${target}.${process.pid}.part`;
writeFileSync(part, `${JSON.stringify(receipt, null, 2)}\n`, "utf8");
renameSync(part, target);
console.log(JSON.stringify({
  status: receipt.status,
  receiptSha256: receipt.receiptSha256,
  desktopScienceMedianFps: receipt.viewports.desktop.scienceMedianFps,
  desktopCinematicMedianFps: receipt.viewports.desktop.cinematicMedianFps,
  mobileScienceMedianFps: receipt.viewports.mobile.scienceMedianFps,
  mobileCinematicMedianFps: receipt.viewports.mobile.cinematicMedianFps,
  formalProductPointer: receipt.boundary.formalProductPointer,
}, null, 2));
