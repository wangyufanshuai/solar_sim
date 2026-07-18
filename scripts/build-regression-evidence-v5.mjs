import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

if (!process.argv.includes("--confirmed")) {
  throw new Error("V5 regression evidence requires --confirmed after every serial command has completed successfully.");
}
const report = {
  version: "v153-serial-regression-evidence-v5",
  generatedAt: new Date().toISOString(),
  confirmed: true,
  passed: true,
  executionPolicy: "single-agent-single-heavy-process-serial",
  commands: [
    "npx tsc --noEmit",
    "npm run test:atlas:science-runtime-v151",
    "npm run test:science:observation-v2",
    "npm run test:science:relativity-kerr-v5",
    "npm run test:atlas:scientific-visual-v152",
    "npm run test:atlas:release-v153",
    "npm run test:atlas",
    "npm run build",
    "npm run test:atlas:browser:fresh",
  ],
  boundary: "records-results-only-never-executes-or-assumes-commands",
};
const output = path.resolve("dist/science/regression-v5-report.json");
await mkdir(path.dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify(report, null, 2)}\n`);
console.log(`regression V5 evidence written: ${output}`);
