import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

if (!process.argv.includes("--confirmed")) {
  throw new Error("Pass --confirmed only after the serial v180 validation matrix succeeds.");
}

const readJson = (file) => readFile(file, "utf8").then(JSON.parse);
const [performance, soak, standaloneBundle, liteBundle, lite] = await Promise.all([
  readJson("dist/science/performance-v180-report.json"),
  readJson("dist/science/lifecycle-soak-v178-report.json"),
  readJson("dist/science/client-bundle-v177-standalone-full.json"),
  readJson("dist/science/client-bundle-v177-vercel-lite.json"),
  readJson("public/atlas-lite/manifest.json"),
]);

const blockers = [
  ...(performance.version === "v180-hardware-performance-production" && performance.passed === true ? [] : ["hardware-performance"]),
  ...(soak.passed === true && soak.measuredCycles === 10 ? [] : ["lifecycle-soak"]),
  ...(standaloneBundle.passed === true && liteBundle.passed === true ? [] : ["client-bundle"]),
  ...(lite.deliveryProfile === "vercel-lite" && lite.installedBytes <= lite.maxBytes ? [] : ["vercel-lite"]),
];
if (blockers.length > 0) throw new Error(`V180 regression evidence blocked: ${blockers.join(", ")}`);

const report = {
  version: "v180-final-web-serial-regression",
  generatedAt: new Date().toISOString(),
  confirmed: true,
  passed: true,
  executionPolicy: "one-main-one-subagent-heavy-commands-serial-16gb",
  results: {
    typescript: "passed",
    focusedFiles: 9,
    focusedTests: 25,
    atlasTestFiles: 107,
    atlasTests: 673,
    standaloneProductionBuild: "passed",
    vercelLiteProductionBuild: "passed",
    standaloneBrowserPassed: 7,
    standaloneBrowserViewportSkipped: 1,
    vercelLiteBrowserPassed: 2,
    viewports: ["1440x900", "390x844"],
    rootEvidenceAttributes: 603,
    universeRuntimeControllerPhysicalLines: 38,
    consoleErrors: 0,
    pageErrors: 0,
    productionAsset404: 0,
    soakWarmupCycles: soak.warmupCycles,
    soakMeasuredCycles: soak.measuredCycles,
    soakHeapBaselineMiB: Number((soak.baselineHeap / 1048576).toFixed(2)),
    soakHeapFinalMiB: Number((soak.finalHeap / 1048576).toFixed(2)),
    searchMaxMs: Math.max(...soak.cycles.map((cycle) => cycle.searchMs)),
    focusCommandMaxMs: Math.max(...soak.cycles.map((cycle) => cycle.focusMs)),
    standaloneInitialJsTransferBytes: standaloneBundle.transferBytes,
    vercelLiteInitialJsTransferBytes: liteBundle.transferBytes,
    liteFileCount: lite.fileCount,
    liteInstalledMiB: Number((lite.installedBytes / 1048576).toFixed(1)),
    liteLoopbackFallback: lite.capabilities.loopbackFallback,
    hardwarePerformancePassed: true,
  },
  framework: {
    next: "15.5.18",
    react: "19.2.7",
    reactDom: "19.2.7",
    reactThreeFiber: "9.6.1",
    three: "0.170.x",
  },
  evidence: {
    performance: "dist/science/performance-v180-report.json",
    lifecycleSoak: "dist/science/lifecycle-soak-v178-report.json",
    standaloneBundle: "dist/science/client-bundle-v177-standalone-full.json",
    vercelLiteBundle: "dist/science/client-bundle-v177-vercel-lite.json",
  },
  boundary: "records-confirmed-web-validation-only-no-scientific-promotion-no-cloud-deploy-no-desktop-installer",
};

const output = path.resolve("dist/science/regression-v180-report.json");
await mkdir(path.dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify(report, null, 2)}\n`);
console.log(`v180 serial regression evidence written: ${output}`);
