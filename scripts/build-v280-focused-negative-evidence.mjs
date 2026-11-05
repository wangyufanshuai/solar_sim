#!/usr/bin/env node
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const canonical = (value) => JSON.stringify(value, (_, entry) => entry && typeof entry === "object" && !Array.isArray(entry)
  ? Object.fromEntries(Object.entries(entry).sort(([a], [b]) => a.localeCompare(b))) : entry);
const sha = (value) => createHash("sha256").update(value).digest("hex");
const unsigned = {
  version: "v280-focused-gate-negative-evidence-v1",
  generatedAt: new Date().toISOString(),
  status: "failed-focused-line-budget-no-retry",
  command: "npm run atlas -- test focused",
  exitCode: 1,
  aggregate: { testFilesPassed: 17, testFilesFailed: 1, testsPassed: 57, testsFailed: 1 },
  failure: {
    test: "app/components/atlasAuthoredReactLineBudgetV256.test.ts",
    target: "app/components/GalaxyEnvironmentSphere.tsx",
    measuredLines: 616,
    limitLines: 600,
  },
  v276V280FilesCausedFailure: false,
  automaticRetryApplied: false,
  heavyQualificationStarted: false,
  boundary: "focused-regression-failed-before-build-browser-soak-or-rtx",
};
const evidence = { ...unsigned, evidenceSha256: sha(canonical(unsigned)) };
const path = resolve("dist/science/v280-focused-negative-evidence.json");
await mkdir(resolve("dist/science"), { recursive: true });
await writeFile(path, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ path, status: evidence.status, evidenceSha256: evidence.evidenceSha256 }, null, 2));
