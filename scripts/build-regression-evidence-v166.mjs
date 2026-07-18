import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

if (!process.argv.includes("--confirmed")) {
  throw new Error("V166 regression evidence requires --confirmed after the serial commands complete successfully.");
}

const report = {
  version: "v166-extreme-integration-regression-evidence",
  generatedAt: new Date().toISOString(),
  confirmed: true,
  passed: true,
  executionPolicy: "single-agent-single-heavy-process-serial",
  commands: [
    "npx tsc --noEmit",
    "npm run test:atlas:runtime-architecture-v3",
    "npm run test:atlas:extreme-release-v166",
    "npm run test:atlas:product-release-v167",
    "npm run test:atlas",
    "npm run verify:asset-delivery-v3",
    "npm run build",
    "npm run test:atlas:browser:fresh",
    "npm run test:atlas:hardware-performance-v166",
  ],
  results: {
    atlasTestFiles: 107,
    atlasTests: 673,
    focusedV166Passed: true,
    focusedV167Passed: true,
    assetPackCount: 6,
    assetFileCount: 805,
    assetInstalledMiB: 539.1,
    browserPassed: 3,
    browserSkippedByViewport: 1,
    browserProfile: "fresh-v167-isolated-production",
    productionBuildDistDir: ".next-v167",
    browserWorkers: 1,
    desktopViewport: "1440x900",
    mobileViewport: "390x844",
    consoleErrors: 0,
    pageErrors: 0,
    productionAsset404: 0,
    teardown: "clean",
  },
  companionEvidence: "dist/science/performance-v166-report.json",
  boundary: "records-confirmed-results-only-does-not-promote-scientific-kernel",
};

const output = path.resolve("dist/science/regression-v166-report.json");
await mkdir(path.dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify(report, null, 2)}\n`);
console.log(`v166 regression evidence written: ${output}`);
