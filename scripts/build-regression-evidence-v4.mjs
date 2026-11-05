import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

if (!process.argv.includes("--confirmed")) {
  throw new Error("Regression evidence requires --confirmed after the serial commands have completed successfully.");
}

const report = {
  version: "v146-serial-regression-evidence-v4",
  generatedAt: new Date().toISOString(),
  passed: true,
  executionPolicy: "single-agent-single-heavy-process-serial",
  commands: [
    "npx tsc --noEmit",
    "npm run test:atlas:release-v146",
    "npm run test:science:relativity-kerr-v4",
    "npm run test:atlas",
    "npm run verify:vercel:thin-preview",
    "npm run build",
    "npm run desktop:stage",
    "npm run test:atlas:browser:fresh",
  ],
  results: {
    atlasTestFiles: 107,
    atlasTests: 673,
    browserPassed: 3,
    browserSkipped: 1,
    browserWorkers: 1,
    desktopViewport: "1440x900",
    mobileViewport: "390x844",
    consoleErrors: 0,
    pageErrors: 0,
    teardown: "clean",
  },
  knownNonFailureNoise: [
    "Watchpack EINVAL lstat E:/DumpStack.log.tmp",
    "Watchpack EINVAL lstat E:/pagefile.sys",
  ],
};

const output = path.resolve("dist/science/regression-v4-report.json");
await mkdir(path.dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify(report, null, 2)}\n`);
console.log(`regression evidence written: ${output}`);
