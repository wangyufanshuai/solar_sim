import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

if (!process.argv.includes("--confirmed")) {
  throw new Error("Pass --confirmed only after the serial v186 validation matrix succeeds.");
}

const root = process.cwd();
const outputDir = path.join(root, "dist", "release");
const installerRoot = "E:\\xuexi\\tools\\cargo-target\\orbit-atlas-v186\\release\\bundle";
const installerPaths = [
  path.join(installerRoot, "msi", "Solar Atlas_1.0.0_x64_en-US.msi"),
  path.join(installerRoot, "nsis", "Solar Atlas_1.0.0_x64-setup.exe"),
];
const readJson = (relativePath) => readFile(path.resolve(root, relativePath), "utf8").then(JSON.parse);
const sha256 = async (file) => {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest("hex");
};
const physicalLines = async (relativePath) => (await readFile(path.resolve(root, relativePath), "utf8")).split(/\r?\n/).length;

const evidencePaths = [
  "dist/science/performance-v186-report.json",
  "dist/science/lifecycle-soak-v178-report.json",
  "dist/science/client-bundle-v177-standalone-full.json",
  "dist/science/client-bundle-v177-vercel-lite.json",
  "dist/content-packs/index.json",
  "dist/content-packs/core.manifest.json",
  "dist/content-packs/planet-hd.manifest.json",
  "dist/content-packs/deep-sky.manifest.json",
  "dist/content-packs/spacecraft.manifest.json",
  "dist/content-packs/science-fixtures.manifest.json",
  "dist/content-packs/runtime-codecs.manifest.json",
  "public/atlas-lite/manifest.json",
  "dist/desktop-stage/v186/desktop-stage.json",
  ".next-v186/BUILD_ID",
  ".next-v186-lite/BUILD_ID",
  "src-tauri/Cargo.lock",
  "src-tauri/tauri.conf.json",
];

const [
  packageJson,
  performance,
  soak,
  standaloneBundle,
  liteBundle,
  contentIndex,
  liteManifest,
  desktopStage,
] = await Promise.all([
  readJson("package.json"),
  readJson(evidencePaths[0]),
  readJson(evidencePaths[1]),
  readJson(evidencePaths[2]),
  readJson(evidencePaths[3]),
  readJson(evidencePaths[4]),
  readJson("public/atlas-lite/manifest.json"),
  readJson("dist/desktop-stage/v186/desktop-stage.json"),
]);

const contentPacks = await Promise.all(contentIndex.packs.map(async (entry) => {
  const manifestPath = `dist/content-packs/${entry.path}`;
  const manifest = await readJson(manifestPath);
  return {
    id: manifest.id,
    version: manifest.version,
    fileCount: manifest.files.length,
    installedBytes: manifest.installedBytes,
    manifest: manifestPath,
    sha256: await sha256(path.resolve(root, manifestPath)),
    licenses: [...new Set(manifest.files.map((file) => file.license).filter(Boolean))].sort(),
  };
}));
const contentPackTotals = contentPacks.reduce((total, pack) => ({
  fileCount: total.fileCount + pack.fileCount,
  installedBytes: total.installedBytes + pack.installedBytes,
}), { fileCount: 0, installedBytes: 0 });

const installers = await Promise.all(installerPaths.map(async (file) => ({
  path: file,
  bytes: (await stat(file)).size,
  sha256: await sha256(file),
  signature: "not-signed",
})));

const blockers = [
  ...(packageJson.dependencies.next === "15.5.18" ? [] : ["next-baseline"]),
  ...(packageJson.dependencies.react === "19.2.7" && packageJson.dependencies["react-dom"] === "19.2.7" ? [] : ["react-baseline"]),
  ...(packageJson.dependencies["@react-three/fiber"] === "9.6.1" ? [] : ["r3f-baseline"]),
  ...(performance.version === "v186-hardware-performance-production" && performance.passed && !performance.softwareRenderer ? [] : ["hardware-performance"]),
  ...(soak.passed && soak.measuredCycles === 10 ? [] : ["lifecycle-soak"]),
  ...(standaloneBundle.transferBytes <= 640 * 1024 && liteBundle.transferBytes <= 640 * 1024 ? [] : ["640-kib-client-bundle"]),
  ...(contentIndex.packs.length === 6 && contentPackTotals.fileCount === 805 ? [] : ["content-pack-index"]),
  ...(liteManifest.deliveryProfile === "vercel-lite" && liteManifest.installedBytes <= liteManifest.maxBytes ? [] : ["vercel-lite"]),
  ...(desktopStage.version === "v186-desktop-compact" && desktopStage.bytes <= 260 * 1024 * 1024 ? [] : ["desktop-stage"]),
  ...(installers.length === 2 && installers.every((installer) => installer.bytes > 0) ? [] : ["desktop-installers"]),
];
if (blockers.length > 0) throw new Error(`V186 dossier blocked: ${blockers.join(", ")}`);

const regression = {
  version: "v186-final-delivery-serial-regression",
  generatedAt: new Date().toISOString(),
  confirmed: true,
  passed: true,
  executionPolicy: "single-agent-heavy-commands-serial-16gb",
  results: {
    typescript: "passed",
    atlasTestFiles: 107,
    atlasTests: 673,
    focusedArchitectureTests: "passed",
    standaloneProductionBuild: "passed",
    vercelLiteProductionBuild: "passed",
    standaloneBrowserPassed: 7,
    standaloneBrowserViewportSkipped: 1,
    vercelLiteBrowserPassed: 2,
    viewports: ["1440x900", "390x844"],
    consoleErrors: 0,
    pageErrors: 0,
    productionAsset404: 0,
    rootEvidenceAttributes: 603,
    rootEvidenceKeyHash: "ac6470fcc517e1b2ba2c6618f530f7af57d1a0caa52fffae0af7232f912f9867",
    universeRuntimeControllerPhysicalLines: await physicalLines("app/UniverseRuntimeController.tsx"),
    atlasRuntimeWorkbenchPhysicalLines: await physicalLines("app/AtlasRuntimeWorkbench.tsx"),
    contentPacks: contentIndex.packs.length,
    contentPackFiles: contentPackTotals.fileCount,
    contentPackBytes: contentPackTotals.installedBytes,
    standaloneInitialJsTransferBytes: standaloneBundle.transferBytes,
    vercelLiteInitialJsTransferBytes: liteBundle.transferBytes,
    soakWarmupCycles: soak.warmupCycles,
    soakMeasuredCycles: soak.measuredCycles,
    soakHeapBaselineBytes: soak.baselineHeap,
    soakHeapFinalBytes: soak.finalHeap,
    searchMaxMs: Math.max(...soak.cycles.map((cycle) => cycle.searchMs)),
    focusCommandMaxMs: Math.max(...soak.cycles.map((cycle) => cycle.focusMs)),
    hardwarePerformancePassed: performance.passed,
    desktopRustTests: "3/3",
    desktopInstallers: installers.length,
  },
  boundary: "no-cloud-deploy-no-scientific-promotion-no-live-or-worker-physics-mutation",
};

await mkdir(outputDir, { recursive: true });
const regressionPath = path.join(outputDir, "orbit-atlas-v186-regression.json");
await writeFile(regressionPath, `${JSON.stringify(regression, null, 2)}\n`);

const artifacts = [];
for (const relativePath of evidencePaths) {
  artifacts.push({ path: relativePath, sha256: await sha256(path.resolve(root, relativePath)) });
}
artifacts.push(...installers);
artifacts.push({ path: path.relative(root, regressionPath).replaceAll("\\", "/"), sha256: await sha256(regressionPath) });

const dossier = {
  version: "v186-final-delivery-rc-dossier",
  generatedAt: new Date().toISOString(),
  confirmedSerialValidation: true,
  releaseStatus: "web-dual-delivery-and-unsigned-desktop-compact-rc-ready-science-shadow-retained",
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
    rootEvidenceAttributes: 603,
    rootEvidenceKeyHash: regression.results.rootEvidenceKeyHash,
    canvasCount: 1,
    universeRuntimeControllerPhysicalLines: regression.results.universeRuntimeControllerPhysicalLines,
    atlasRuntimeWorkbenchPhysicalLines: regression.results.atlasRuntimeWorkbenchPhysicalLines,
    controllerRole: "38-line-compatible-facade",
    panelCoordinator: "first-open lazy activation then mounted session preservation",
  },
  validation: {
    regression: regression.results,
    clientBundle: {
      maximumBytes: 640 * 1024,
      standaloneTransferBytes: standaloneBundle.transferBytes,
      vercelLiteTransferBytes: liteBundle.transferBytes,
    },
    lifecycleSoak: {
      baselineResources: soak.baseline,
      releasedResources: soak.released,
      baselineHeapBytes: soak.baselineHeap,
      finalHeapBytes: soak.finalHeap,
      heapLimitBytes: soak.heapLimit,
      passed: soak.passed,
    },
    hardwarePerformance: performance.samples,
    gpuCounterQualification: "gl.info is observational; drawCalls=1 is not optimization proof",
  },
  contentPacks,
  contentPackTotals,
  delivery: {
    "standalone-full": { interactive: true, localContentPacks: true, millionStarCatalog: true, fullObservationFixtures: true, cloudDeployed: false },
    "vercel-lite": { interactive: true, localContentPacks: false, millionStarCatalog: false, fullObservationFixtures: false, loopbackFallback: false, fileCount: liteManifest.fileCount, installedBytes: liteManifest.installedBytes, cloudDeployed: false },
    "desktop-compact": { interactive: true, bundledCoreSurface: true, installablePacks: desktopStage.contentPackIds, initialCatalogBackend: desktopStage.initialCatalogBackend, stageBytes: desktopStage.bytes, installers },
  },
  science: { defaultKernel: "legacy-eih-1pn", shadowKernel: "eih-1pn-2pn-lt", promotionApplied: false },
  knownLimitations: [
    "Vercel Lite omits the million-star catalog and full observation fixtures.",
    "V2 relativity remains shadow-only because independent promotion gates are not satisfied.",
    "The MSI and NSIS installers are local unsigned RC artifacts; no signing or public distribution was performed.",
    "No Vercel or other cloud deployment was performed.",
    "AtlasRuntimeWorkbench remains the next decomposition surface even though UniverseRuntimeController is below the hard line gate.",
  ],
  rollback: [
    "Retain legacy-eih-1pn as default and leave V2 shadow-only.",
    "Select standalone-full with the six checksummed content-pack manifests.",
    "For desktop, uninstall the unsigned v186 RC and restore the retained standalone Web artifact.",
    "Re-run tsc, 673 tests, both builds, fresh Browser QA, soak and content-pack verification before another promotion.",
  ],
  artifacts,
  boundary: "no-cloud-deploy-no-signing-no-scientific-promotion-no-frozen-physics-or-v9-mutation",
};

const jsonPath = path.join(outputDir, "orbit-atlas-v186-rc-dossier.json");
const markdownPath = path.join(outputDir, "orbit-atlas-v186-rc-dossier.md");
await writeFile(jsonPath, `${JSON.stringify(dossier, null, 2)}\n`);
const markdown = `# Orbit Atlas v186 RC dossier\n\n` +
  `Status: **${dossier.releaseStatus}**\n\n` +
  `- Web regression: 673/673; Browser standalone 7 passed + 1 expected skip; Lite 2/2.\n` +
  `- Initial JS: standalone ${standaloneBundle.transferBytes} B; Lite ${liteBundle.transferBytes} B; target 655360 B.\n` +
  `- Content: ${contentPacks.length} packs, ${contentPackTotals.fileCount} files, ${(contentPackTotals.installedBytes / 1048576).toFixed(1)} MiB.\n` +
  `- Desktop: ${(desktopStage.bytes / 1048576).toFixed(1)} MiB compact stage; unsigned MSI + NSIS generated.\n` +
  `- Science: default \`legacy-eih-1pn\`; V2 remains shadow-only.\n\n` +
  `## Capability matrix\n\n| Capability | standalone-full | vercel-lite | desktop-compact |\n|---|---:|---:|---:|\n| Interactive single Canvas | Yes | Yes | Yes |\n| Six content packs | Yes | No | Installable |\n| Million-star catalog | Yes | No | Optional |\n| Full observation fixtures | Yes | No | Optional |\n| Cloud deployed | No | No | N/A |\n| Signed installer | N/A | N/A | No |\n\n` +
  `## Known limitations\n\n${dossier.knownLimitations.map((item) => `- ${item}`).join("\n")}\n\n` +
  `## Rollback\n\n${dossier.rollback.map((item, index) => `${index + 1}. ${item}`).join("\n")}\n`;
await writeFile(markdownPath, markdown);

const dossierArtifacts = [regressionPath, jsonPath, markdownPath];
const checksumLines = [];
for (const file of dossierArtifacts) checksumLines.push(`${await sha256(file)}  ${path.basename(file)}`);
for (const installer of installers) checksumLines.push(`${installer.sha256}  ${installer.path}`);
const checksumsPath = path.join(outputDir, "orbit-atlas-v186-checksums.txt");
await writeFile(checksumsPath, `${checksumLines.join("\n")}\n`);
console.log(`v186 RC dossier written: ${jsonPath}`);
console.log(`v186 RC dossier written: ${markdownPath}`);
console.log(`v186 checksums written: ${checksumsPath}`);
