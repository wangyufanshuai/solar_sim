import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";
import {
  createAlignmentReport, failureReport, loadEvidenceInput,
  parseArguments, writeExclusiveJson,
} from "./mainline-a-release-evidence.mjs";

export async function auditRelease(workspace, inputPath) {
  const evidence = await loadEvidenceInput(workspace, inputPath);
  const report = await createAlignmentReport(workspace, evidence);
  return { evidence, report };
}

async function main() {
  const schema = "mainline-a-release-alignment-pinned-v1";
  try {
    const options = parseArguments(process.argv.slice(2), ["evidence-input", "output", "check", "no-write", "json"]);
    if (!options["no-write"] && !options.check && !options.output) throw new Error("explicit-unique-output-required");
    const { report } = await auditRelease(process.cwd(), options["evidence-input"]);
    if (!options["no-write"] && !options.check) await writeExclusiveJson(process.cwd(), options.output, report);
    console.log(JSON.stringify(report, null, 2));
    if (options.check && report.status !== "passed") process.exitCode = 1;
  } catch (error) {
    console.log(JSON.stringify(failureReport(schema, error), null, 2));
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) await main();
