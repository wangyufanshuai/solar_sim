import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const performancePath = path.resolve("dist/science/performance-v166-report.json");
const regressionPath = path.resolve("dist/science/regression-v166-report.json");

const [performance, regression] = await Promise.all([
  readFile(performancePath, "utf8").then(JSON.parse),
  readFile(regressionPath, "utf8").then(JSON.parse),
]);

const failures = [
  ...(performance.version === "v166-hardware-performance-production" ? [] : ["performance-version"]),
  ...(performance.runtimeBaseline === "next-standalone-production-v166" ? [] : ["performance-runtime-baseline"]),
  ...(performance.passed === true ? [] : ["performance-gate"]),
  ...(performance.softwareRenderer === false ? [] : ["hardware-adapter"]),
  ...(performance.resourcesReleased === true ? [] : ["resource-lifecycle"]),
  ...(Array.isArray(performance.consoleErrors) && performance.consoleErrors.length === 0 ? [] : ["console-errors"]),
  ...(Array.isArray(performance.pageErrors) && performance.pageErrors.length === 0 ? [] : ["page-errors"]),
  ...(regression.version === "v166-extreme-integration-regression-evidence" ? [] : ["regression-version"]),
  ...(regression.passed === true && regression.confirmed === true ? [] : ["regression-gate"]),
];

if (failures.length > 0) {
  throw new Error(`V167 product release evidence blocked: ${failures.join(", ")}`);
}

const report = {
  version: "v167-product-release-evidence-closure",
  generatedAt: new Date().toISOString(),
  status: "product-rc-verified-science-shadow-retained",
  productReleaseStatus: "verified-web-standalone-release-candidate",
  scientificPromotionStatus: "shadow-retained-no-demonstrated-improvement",
  defaultScientificKernel: "legacy-eih-1pn",
  shadowScientificKernel: "eih-1pn-2pn-lt",
  promotionApplied: false,
  evidence: {
    performance: path.relative(process.cwd(), performancePath).replaceAll("\\", "/"),
    regression: path.relative(process.cwd(), regressionPath).replaceAll("\\", "/"),
  },
  productBlockers: [],
  scientificBlockers: [
    "candidate-does-not-improve-legacy-aggregate-rms",
    "independent-per-body-dop853-comparison-pending",
  ],
  boundary: "product-release-evidence-only-no-scientific-promotion-no-live-or-worker-physics-mutation",
};

const output = path.resolve("dist/science/product-release-v167-report.json");
await mkdir(path.dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify(report, null, 2)}\n`);
console.log(`v167 product release evidence written: ${output}`);
