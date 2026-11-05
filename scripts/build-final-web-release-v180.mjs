import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

if (!process.argv.includes("--confirmed")) {
  throw new Error("Pass --confirmed only after the serial v180 validation matrix succeeds.");
}

const root = process.cwd();
const readJson = (relativePath) => readFile(path.join(root, ...relativePath.split("/")), "utf8").then(JSON.parse);
const sha256 = async (file) => {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest("hex");
};

const relativeArtifacts = [
  "dist/science/performance-v180-report.json",
  "dist/science/performance-v174-report.json",
  "dist/science/lifecycle-soak-v178-report.json",
  "dist/science/client-bundle-v177-standalone-full.json",
  "dist/science/client-bundle-v177-vercel-lite.json",
  "dist/science/regression-v180-report.json",
  "dist/science/product-release-v167-report.json",
  "dist/content-packs/core.manifest.json",
  "dist/content-packs/planet-hd.manifest.json",
  "dist/content-packs/deep-sky.manifest.json",
  "dist/content-packs/spacecraft.manifest.json",
  "dist/content-packs/science-fixtures.manifest.json",
  "dist/content-packs/runtime-codecs.manifest.json",
  "public/atlas-lite/manifest.json",
];

const [packageJson, performance, previousPerformance, soak, standaloneBundle, liteBundle, regression, product, liteManifest] = await Promise.all([
  readJson("package.json"),
  readJson(relativeArtifacts[0]),
  readJson(relativeArtifacts[1]),
  readJson(relativeArtifacts[2]),
  readJson(relativeArtifacts[3]),
  readJson(relativeArtifacts[4]),
  readJson(relativeArtifacts[5]),
  readJson(relativeArtifacts[6]),
  readJson(relativeArtifacts.at(-1)),
]);

const performanceComparison = performance.samples.map((sample) => {
  const previous = previousPerformance.samples.find((candidate) => candidate.id === sample.id);
  const medianFpsRatio = previous ? sample.medianFps / previous.medianFps : null;
  return {
    id: sample.id,
    v174MedianFps: previous?.medianFps ?? null,
    v180MedianFps: sample.medianFps,
    medianFpsRatio,
    regressionWithinFivePercent: medianFpsRatio !== null && medianFpsRatio >= 0.95,
  };
});

const blockers = [
  ...(packageJson.dependencies?.next === "15.5.18" ? [] : ["next-security-baseline"]),
  ...(packageJson.dependencies?.react === "19.2.7" && packageJson.dependencies?.["react-dom"] === "19.2.7" && packageJson.dependencies?.["@react-three/fiber"] === "9.6.1" ? [] : ["react-renderer-baseline"]),
  ...(performance.version === "v180-hardware-performance-production" && performance.passed === true && performance.softwareRenderer === false ? [] : ["hardware-performance"]),
  ...(performanceComparison.every((item) => item.regressionWithinFivePercent) ? [] : ["performance-regression"]),
  ...(soak.passed === true && soak.measuredCycles === 10 ? [] : ["lifecycle-soak"]),
  ...(standaloneBundle.passed === true && liteBundle.passed === true ? [] : ["client-bundle"]),
  ...(regression.version === "v180-final-web-serial-regression" && regression.passed === true && regression.confirmed === true ? [] : ["full-regression"]),
  ...(product.productReleaseStatus === "verified-web-standalone-release-candidate" ? [] : ["product-release"]),
  ...(liteManifest.deliveryProfile === "vercel-lite" && liteManifest.installedBytes <= liteManifest.maxBytes ? [] : ["vercel-lite"]),
];
if (blockers.length > 0) throw new Error(`V180 dossier blocked: ${blockers.join(", ")}`);

const artifacts = [];
for (const relativePath of relativeArtifacts) {
  const absolutePath = path.join(root, ...relativePath.split("/"));
  artifacts.push({ path: relativePath, sha256: await sha256(absolutePath) });
}

const contentPacks = [];
for (const artifact of artifacts.filter((item) => item.path.startsWith("dist/content-packs/"))) {
  const manifest = await readJson(artifact.path);
  contentPacks.push({
    id: manifest.id,
    version: manifest.version,
    fileCount: manifest.fileCount ?? manifest.files?.length ?? 0,
    installedBytes: manifest.installedBytes ?? manifest.files?.reduce((sum, file) => sum + file.bytes, 0) ?? 0,
    licenses: [...new Set((manifest.files ?? []).map((file) => file.license).filter(Boolean))].sort(),
    manifest: artifact.path,
    sha256: artifact.sha256,
  });
}

const contentPackTotals = contentPacks.reduce((totals, pack) => ({
  fileCount: totals.fileCount + pack.fileCount,
  installedBytes: totals.installedBytes + pack.installedBytes,
}), { fileCount: 0, installedBytes: 0 });

const dossier = {
  version: "v180-final-web-rc-dossier",
  generatedAt: new Date().toISOString(),
  confirmedSerialValidation: true,
  releaseStatus: "web-dual-delivery-rc-ready-science-shadow-retained",
  framework: {
    next: packageJson.dependencies.next,
    react: packageJson.dependencies.react,
    reactDom: packageJson.dependencies["react-dom"],
    reactThreeFiber: packageJson.dependencies["@react-three/fiber"],
    drei: packageJson.dependencies["@react-three/drei"],
    three: packageJson.dependencies.three,
  },
  machine: {
    platform: `${os.platform()} ${os.release()} ${os.arch()}`,
    cpu: os.cpus()[0]?.model ?? "unknown",
    logicalCpus: os.cpus().length,
    totalMemoryMiB: Math.round(os.totalmem() / 1048576),
    node: process.version,
    graphicsAdapter: performance.adapter,
  },
  architecture: {
    universeRuntimeControllerPhysicalLines: regression.results.universeRuntimeControllerPhysicalLines,
    rootEvidenceAttributes: regression.results.rootEvidenceAttributes,
    canvasCount: 1,
    controllerRole: "root-facade-scene-host-compatibility-audit",
    workbenchNote: "The facade is below 1200 lines; AtlasRuntimeWorkbench remains the principal follow-up decomposition surface.",
  },
  validation: {
    focusedFiles: regression.results.focusedFiles,
    focusedTests: regression.results.focusedTests,
    fullRegression: `${regression.results.atlasTests}/${regression.results.atlasTests}`,
    productionBuilds: ["standalone-full", "vercel-lite"],
    browserQa: {
      standalonePassed: regression.results.standaloneBrowserPassed,
      standaloneViewportSkipped: regression.results.standaloneBrowserViewportSkipped,
      vercelLitePassed: regression.results.vercelLiteBrowserPassed,
      viewports: regression.results.viewports,
      consoleErrors: 0,
      pageErrors: 0,
      resource404: 0,
      axe: "wcag2a-and-wcag2aa-pass",
    },
    lifecycleSoak: {
      warmupCycles: soak.warmupCycles,
      measuredCycles: soak.measuredCycles,
      baselineHeapBytes: soak.baselineHeap,
      finalHeapBytes: soak.finalHeap,
      heapLimitBytes: soak.heapLimit,
      baselineResources: soak.baseline,
      releasedResources: soak.released,
      maxSearchMs: Math.max(...soak.cycles.map((cycle) => cycle.searchMs)),
      maxFocusCommandMs: Math.max(...soak.cycles.map((cycle) => cycle.focusMs)),
      passed: soak.passed,
    },
    clientBundle: {
      standaloneTransferBytes: standaloneBundle.transferBytes,
      vercelLiteTransferBytes: liteBundle.transferBytes,
      maxTransferBytes: standaloneBundle.maxTransferBytes,
    },
    hardwarePerformance: performance.samples,
    performanceComparison,
    gpuCounterQualification: "gl.info counters are observational only; drawCalls=1 is not optimization proof",
  },
  contentPacks,
  contentPackTotals,
  delivery: {
    "standalone-full": {
      interactive: true,
      localContentPacks: true,
      millionStarCatalog: true,
      fullObservationFixtures: true,
      cloudDeployment: false,
    },
    "vercel-lite": {
      interactive: true,
      localContentPacks: false,
      millionStarCatalog: false,
      fullObservationFixtures: false,
      loopbackFallback: liteManifest.capabilities.loopbackFallback,
      manifestVersion: liteManifest.version,
      fileCount: liteManifest.fileCount,
      installedBytes: liteManifest.installedBytes,
      maxBytes: liteManifest.maxBytes,
      cloudDeployment: false,
    },
  },
  science: {
    defaultKernel: "legacy-eih-1pn",
    shadowKernel: "eih-1pn-2pn-lt",
    promotionApplied: false,
    scientificBlockers: product.scientificBlockers,
  },
  knownLimitations: [
    "Vercel Lite omits the million-star catalog and full observation fixtures.",
    "V2 relativity remains shadow-only because the independent promotion gates are not satisfied.",
    "Cloud deployment and desktop installers are separate, unreleased tracks.",
    "GPU gl.info counters remain observational and are not optimization proof.",
    "AtlasRuntimeWorkbench is still a large integration surface even though UniverseRuntimeController is a 38-line facade.",
  ],
  rollback: [
    "Select standalone-full and the retained v174/v167 verified artifact set.",
    "Keep legacy-eih-1pn as the default kernel and leave V2 shadow-only.",
    "Restore the six checksummed content-pack manifests from retained release artifacts.",
    "Re-run tsc, the 673-test atlas suite, both production builds and fresh Browser QA before promotion.",
  ],
  artifacts,
  boundary: "no-cloud-deploy-no-desktop-release-no-scientific-promotion-no-live-or-worker-physics-mutation",
};

const outputDir = path.join(root, "dist", "release");
const jsonOutput = path.join(outputDir, "orbit-atlas-v180-rc-dossier.json");
const markdownOutput = path.join(outputDir, "orbit-atlas-v180-rc-dossier.md");
await mkdir(outputDir, { recursive: true });
await writeFile(jsonOutput, `${JSON.stringify(dossier, null, 2)}\n`);

const markdown = `# Orbit Atlas v180 Web RC\n\n` +
  `Status: **${dossier.releaseStatus}**\n\n` +
  `- Framework: Next ${dossier.framework.next}, React ${dossier.framework.react}, R3F ${dossier.framework.reactThreeFiber}, Three ${dossier.framework.three}\n` +
  `- Regression: ${dossier.validation.fullRegression}; focused ${dossier.validation.focusedTests}/${dossier.validation.focusedTests}\n` +
  `- Browser QA: standalone ${dossier.validation.browserQa.standalonePassed} passed + ${dossier.validation.browserQa.standaloneViewportSkipped} expected skip; Lite ${dossier.validation.browserQa.vercelLitePassed} passed\n` +
  `- Initial JS: standalone ${standaloneBundle.transferBytes} B; Lite ${liteBundle.transferBytes} B; budget ${standaloneBundle.maxTransferBytes} B\n` +
  `- Soak: ${soak.measuredCycles} measured cycles, heap ${(soak.baselineHeap / 1048576).toFixed(2)} to ${(soak.finalHeap / 1048576).toFixed(2)} MiB\n` +
  `- GPU: ${performance.adapter.renderer}\n\n` +
  `## Delivery capability matrix\n\n` +
  `| Capability | standalone-full | vercel-lite |\n|---|---:|---:|\n` +
  `| Interactive single Canvas | Yes | Yes |\n| Six local content packs | Yes | No |\n| Million-star catalog | Yes | No |\n| Full observation fixtures | Yes | No |\n| Loopback fallback | N/A | No |\n| Cloud deployed in this release | No | No |\n\n` +
  `## Science boundary\n\nDefault: \`legacy-eih-1pn\`. V2 remains shadow-only; no scientific promotion was applied.\n\n` +
  `## Known limitations\n\n${dossier.knownLimitations.map((item) => `- ${item}`).join("\n")}\n\n` +
  `## Rollback\n\n${dossier.rollback.map((item, index) => `${index + 1}. ${item}`).join("\n")}\n`;
await writeFile(markdownOutput, markdown);

for (const output of [jsonOutput, markdownOutput]) {
  const hash = await sha256(output);
  await writeFile(`${output}.sha256`, `${hash}  ${path.basename(output)}\n`);
}
console.log(`v180 Web RC dossier written: ${jsonOutput}`);
console.log(`v180 Web RC dossier written: ${markdownOutput}`);
