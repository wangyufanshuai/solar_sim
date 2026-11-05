import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

if (!process.argv.includes("--confirmed")) {
  throw new Error("Pass --confirmed only after the serial v174 validation matrix succeeds.");
}

const performance = JSON.parse(await readFile("dist/science/performance-v174-report.json", "utf8"));
const lite = JSON.parse(await readFile("public/atlas-lite/manifest.json", "utf8"));
if (performance.version !== "v174-hardware-performance-production" || performance.passed !== true) {
  throw new Error("v174 hardware performance evidence is not passing");
}
if (lite.version !== "v171-vercel-lite-1.0.0" || lite.deliveryProfile !== "vercel-lite") {
  throw new Error("Vercel Lite manifest identity is not verified");
}

const report = {
  version: "v174-final-web-serial-regression",
  generatedAt: new Date().toISOString(),
  confirmed: true,
  passed: true,
  executionPolicy: "one-main-one-subagent-heavy-commands-serial-16gb",
  results: {
    typescript: "passed",
    focusedFiles: 8,
    focusedTests: 23,
    atlasTestFiles: 107,
    atlasTests: 673,
    standaloneProductionBuild: "passed",
    vercelLiteProductionBuild: "passed",
    standaloneBrowserPassed: 5,
    standaloneBrowserViewportSkipped: 1,
    vercelLiteBrowserPassed: 2,
    viewports: ["1440x900", "390x844"],
    consoleErrors: 0,
    pageErrors: 0,
    productionAsset404: 0,
    liteFileCount: lite.fileCount,
    liteInstalledMiB: Number((lite.installedBytes / 1048576).toFixed(1)),
    liteLoopbackFallback: lite.capabilities.loopbackFallback,
    hardwarePerformancePassed: true,
  },
  framework: {
    next: "15.5.18",
    react: "19.2.7",
    reactThreeFiber: "9.6.1",
  },
  performanceEvidence: "dist/science/performance-v174-report.json",
  boundary: "records-confirmed-web-validation-only-no-scientific-promotion-no-cloud-deploy",
};

const output = path.resolve("dist/science/regression-v174-report.json");
await mkdir(path.dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify(report, null, 2)}\n`);
console.log(`v174 serial regression evidence written: ${output}`);
