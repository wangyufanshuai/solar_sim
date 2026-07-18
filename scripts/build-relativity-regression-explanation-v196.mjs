import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createAtlasRelativityRegressionExplanationV196 } from "../app/lib/atlasRelativityRegressionExplanationV196.ts";

const input = path.resolve("dist/science/relativity-dop853-v7-report.json");
const output = path.resolve("dist/science/relativity-regression-explanation-v196.json");
const report = JSON.parse(await readFile(input, "utf8"));
const explanation = createAtlasRelativityRegressionExplanationV196(report);
await mkdir(path.dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify(explanation, null, 2)}\n`);
console.log(`${explanation.version}: regressions=${explanation.regressionCount}; decision=${explanation.decision}`);
