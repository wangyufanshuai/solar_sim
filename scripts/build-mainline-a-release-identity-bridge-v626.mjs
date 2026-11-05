import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";
import { readFile } from "node:fs/promises";
import {
  BOUNDARY, failureReport, parseArguments, sha256, writeExclusiveJson,
} from "./mainline-a-release-evidence.mjs";
import { auditRelease } from "./audit-mainline-a-release-alignment-v626.mjs";

export async function buildIdentityBridge(workspace, evidence, report) {
  const nextBytes = await readFile(path.join(workspace, "package.json"));
  const nextPackage = JSON.parse(nextBytes.toString("utf8"));
  const root = report.rootObservation.source;
  const rootPackage = root?.root?.package;
  const releaseIdentity = "solar-sim-mainline-a";
  const rootReleaseIdentity = rootPackage?.releaseIdentity ?? null;
  const nextReleaseIdentity = nextPackage.mainlineAReleaseIdentity ?? null;
  const releaseIdentityMatch = rootReleaseIdentity === releaseIdentity && nextReleaseIdentity === releaseIdentity;
  return {
    schema: "mainline-a-release-identity-bridge-pinned-v1", version: "explicit-evidence-v1",
    generatedAt: new Date().toISOString(), productIdentity: releaseIdentity,
    status: "blocked", candidateOnly: true, boundary: BOUNDARY,
    build: evidence.build, evidenceInput: evidence.bundle,
    rootPackage: { packageName: rootPackage?.packageName ?? null, runtimeName: rootPackage?.packageName ?? null, releaseIdentity: rootReleaseIdentity },
    nextWebPackage: { packageName: nextPackage.name, runtimeName: nextPackage.name, releaseIdentity: nextReleaseIdentity, packageSha256: sha256(nextBytes) },
    mapping: {
      releaseIdentityMatch,
      runtimeNameDifferenceIntentional: releaseIdentityMatch && rootPackage.packageName !== nextPackage.name,
      sourceDigestRelation: "different-code-lines", rootBuildIdentityPresent: false,
      nextWebBuildIdentityPresent: report.sourceBinding.valid,
    },
    sourceBinding: report.sourceBinding,
    rootSource: { inputSha256: root?.root?.inventory?.inventorySha256 ?? null, readOnly: true, parentGitOperations: false },
    nextWebSource: { inputSha256: evidence.snapshot.sha256, sourceStable: report.sourceBinding.valid },
    manifestParity: report.comparison,
    blockers: [...report.blockers, ...(!releaseIdentityMatch ? ["release-identity-mismatch"] : [])],
  };
}

async function main() {
  const schema = "mainline-a-release-identity-bridge-pinned-v1";
  try {
    const options = parseArguments(process.argv.slice(2), ["evidence-input", "output", "check", "no-write", "json"]);
    if (!options["no-write"] && !options.check && !options.output) throw new Error("explicit-unique-output-required");
    const { evidence, report } = await auditRelease(process.cwd(), options["evidence-input"]);
    const bridge = await buildIdentityBridge(process.cwd(), evidence, report);
    if (!options["no-write"] && !options.check) await writeExclusiveJson(process.cwd(), options.output, bridge);
    console.log(JSON.stringify(bridge, null, 2));
    if (options.check && bridge.status !== "passed") process.exitCode = 1;
  } catch (error) {
    console.log(JSON.stringify(failureReport(schema, error), null, 2));
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) await main();
