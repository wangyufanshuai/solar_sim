import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";
import { mkdir, readFile } from "node:fs/promises";
import {
  BOUNDARY, ensureOutputParent, failureReport, jsonBytes, parseArguments,
  relativePath, safeFile, sha256, verifyEvidenceIndex, writeExclusiveJson,
} from "./mainline-a-release-evidence.mjs";
import { auditRelease } from "./audit-mainline-a-release-alignment-v626.mjs";
import { verifyPackage } from "./verify-mainline-a-release-package.mjs";
import { prepareRuntimePayloadV636, materializeRuntimePayloadV636, verifyRuntimePayloadV636 } from "./mainline-a-runtime-payload-v636.mjs";

export function assertIdentityBridgeBuild(bridge, report) {
  if (bridge?.schema !== "mainline-a-release-identity-bridge-pinned-v1") throw new Error("identity-bridge-schema-missing");
  for (const key of ["buildId", "runtimeBuildId", "branch", "head", "receiptSha256", "sourceSha256"]) {
    if (!report.build?.[key] || bridge.build?.[key] !== report.build[key]) throw new Error(`identity-bridge-build-mismatch:${key}`);
  }
  if (bridge.evidenceInput?.sha256 !== report.evidenceInput?.sha256) throw new Error("identity-bridge-input-mismatch");
  if (!report.sourceBinding?.valid || !bridge.sourceBinding?.valid) throw new Error("identity-bridge-source-not-current");
}

export async function preparePackage(workspace, inputPath, bridgePath, runId, { audit = auditRelease, runtime = false, runtimeManifest = null } = {}) {
  if (!/^[a-zA-Z0-9_-]{8,64}$/u.test(runId ?? "")) throw new Error("explicit-valid-run-id-required");
  const { evidence, report } = await audit(workspace, inputPath);
  if (!report.candidatePackageAllowed) throw new Error(`candidate-package-input-rejected:${report.sourceBinding.problems.join(",")}`);
  const bridgeFile = await safeFile(workspace, bridgePath);
  const bridgeBytes = await readFile(bridgeFile.absolute);
  const bridge = JSON.parse(bridgeBytes.toString("utf8"));
  assertIdentityBridgeBuild(bridge, report);
  if (bridge.mapping?.releaseIdentityMatch !== true) throw new Error("identity-bridge-release-mapping-mismatch");
  const bridgeReference = { role: "identityBridge", path: bridgeFile.relative, sha256: sha256(bridgeBytes), bytes: bridgeBytes.length, evidenceClass: "static" };
  const bundleReference = { ...evidence.bundle, role: "evidenceInput", evidenceClass: "static" };
  const records = [...evidence.index, bridgeReference, bundleReference];
  await verifyEvidenceIndex(workspace, records);
  const packageId = `mainline-a-r66-${runId}`;
  if (runtime && runtimeManifest) throw new Error("runtime-input-modes-exclusive");
  let runtimeReference = null;
  if (runtimeManifest) {
    const file = await safeFile(workspace, runtimeManifest.path);
    const raw = await readFile(file.absolute);
    if (path.basename(file.absolute) !== "runtime-payload-manifest.json" || sha256(raw) !== runtimeManifest.sha256) throw new Error("runtime-reference-pin-invalid");
    const expectedBuild = Object.fromEntries(["buildId", "runtimeBuildId", "branch", "head", "profile", "receiptPath", "receiptSha256", "sourceSha256"].map((key) => [key, evidence.build[key]]));
    await verifyRuntimePayloadV636({ workspace, directory: relativePath(workspace, path.dirname(file.absolute)), expectedManifestSha256: runtimeManifest.sha256, expectedBuild });
    runtimeReference = { manifestPath: file.relative, manifestSha256: runtimeManifest.sha256, manifest: JSON.parse(raw.toString("utf8")), bytes: raw.length };
  }
  const runtimePlan = runtime ? await prepareRuntimePayloadV636({
    workspace, buildReceipt: { path: evidence.build.receiptPath, sha256: evidence.build.receiptSha256 },
  }) : null;
  const packageValue = {
    schema: "mainline-a-release-package-pinned-v1", version: "explicit-evidence-v1", packageId,
    generatedAt: new Date().toISOString(), status: "blocked", admission: "candidate-only",
    scope: runtimeManifest ? "next-web candidate metadata references an independently pinned immutable runtime directory; preserve both directories together"
      : runtime ? "next-web candidate runtime copy and evidence references; local recovery only"
      : "next-web candidate metadata and locally replayable file references; runtime payload absent",
    runtimePayloadIncluded: Boolean(runtime || runtimeManifest),
    boundary: BOUNDARY, build: evidence.build, sourceBinding: report.sourceBinding,
    evidenceInput: evidence.bundle, identityBridge: bridgeReference,
    gates: report.gates, blockers: report.blockers, claims: report.claims,
  };
  const documents = {
    "release-package.json": packageValue,
    "alignment.json": report,
    "identity-bridge.json": bridge,
    "evidence-input.json": evidence.input,
    "evidence-index.json": { schema: "mainline-a-release-evidence-index-v1", packageId, files: records, boundary: BOUNDARY },
    "gate-checklist.json": { packageId, status: "blocked", gates: report.gates, blockers: report.blockers, boundary: BOUNDARY },
    "rollback.json": {
      packageId, automaticRollback: false, rootMutationAllowed: false,
      preservedBuild: evidence.values.build.workingDirectory,
      buildReceipt: { path: evidence.build.receiptPath, sha256: evidence.build.receiptSha256 },
      steps: ["Stop only the owned preview server.", "Select an independently verified preserved build.", "Re-run HTTP and current-source checks before any release decision."],
      boundary: BOUNDARY,
    },
  };
  return { evidence, report, packageValue, documents, runtimePlan, runtimeReference };
}

export async function writePackage(workspace, requestedDirectory, prepared) {
  const directory = relativePath(workspace, requestedDirectory);
  await ensureOutputParent(workspace, directory);
  await mkdir(path.join(workspace, directory), { recursive: false });
  const documents = structuredClone(prepared.documents);
  let runtime = null;
  if (prepared.runtimePlan || prepared.runtimeReference) {
    const payload = prepared.runtimeReference ?? await materializeRuntimePayloadV636({
      workspace, destination: `${directory}/runtime`, plan: prepared.runtimePlan,
    });
    const raw = await readFile(path.join(workspace, payload.manifestPath));
    runtime = {
      schema: "mainline-a-package-runtime-binding-v636", packageId: prepared.packageValue.packageId,
      storage: prepared.runtimeReference ? "workspace-reference" : "embedded",
      path: prepared.runtimeReference ? payload.manifestPath : "runtime/runtime-payload-manifest.json", sha256: payload.manifestSha256,
      bytes: raw.length, build: prepared.evidence.build,
      fileCount: payload.manifest.files.length,
      totalBytes: payload.manifest.files.reduce((sum, file) => sum + file.bytes, 0),
      status: "candidate-copy", recoveryTest: "not-run", releaseApproved: false, boundary: BOUNDARY,
    };
    documents["runtime-payload.json"] = runtime;
    documents["rollback.json"].runtime = {
      path: runtime.path, sha256: runtime.sha256,
      restorePolicy: "new-exclusive-directory-only", existingEnvironmentMutation: false,
    };
    documents["rollback.json"].steps = [
      "Verify the package and its pinned runtime inventory before restoring.",
      "Restore the runtime into a new exclusive next-web directory; never replace an existing environment.",
      "Run the restored-runtime HTTP smoke and retain its owned-process cleanup result.",
      "Keep release, copyright, scientific admission, and browser gates pending until independently verified.",
    ];
  }
  const files = [];
  for (const [name, value] of Object.entries(documents)) {
    const record = await writeExclusiveJson(workspace, `${directory}/${name}`, value);
    files.push({ path: name, bytes: record.bytes, sha256: record.sha256 });
  }
  const manifest = {
    schema: "mainline-a-release-package-manifest-pinned-v1", packageId: prepared.packageValue.packageId,
    status: "blocked", build: prepared.evidence.build,
    evidenceInput: prepared.evidence.bundle, files, boundary: BOUNDARY,
    runtimePayloadIncluded: Boolean(runtime),
  };
  await writeExclusiveJson(workspace, `${directory}/manifest.json`, manifest);
  return { directory, manifestPath: `${directory}/manifest.json`, manifestSha256: sha256(jsonBytes(manifest)), status: "blocked", runtime };
}

async function main() {
  const schema = "mainline-a-release-package-pinned-v1";
  try {
    const options = parseArguments(process.argv.slice(2), ["evidence-input", "identity-bridge", "run-id", "output", "package", "runtime", "runtime-manifest", "runtime-sha256", "check", "no-write", "json"]);
    if (options.runtime !== undefined && options.runtime !== "bundle") throw new Error("runtime-option-must-be-bundle");
    if (options.check) {
      const result = await verifyPackage(process.cwd(), options.package, { current: true });
      console.log(JSON.stringify(result, null, 2));
      process.exitCode = 1;
      return;
    }
    if (Boolean(options["runtime-manifest"]) !== Boolean(options["runtime-sha256"])) throw new Error("runtime-reference-path-and-pin-required");
    const prepared = await preparePackage(process.cwd(), options["evidence-input"], options["identity-bridge"], options["run-id"], {
      runtime: options.runtime === "bundle",
      runtimeManifest: options["runtime-manifest"] ? { path: options["runtime-manifest"], sha256: options["runtime-sha256"] } : null,
    });
    if (options["no-write"]) {
      console.log(JSON.stringify({ ...prepared.packageValue, readOnly: true }, null, 2));
      return;
    }
    const directory = options.output ?? `docs/release/v607/mainline-a-r66-package-${options["run-id"]}`;
    const result = await writePackage(process.cwd(), directory, prepared);
    const verified = await verifyPackage(process.cwd(), result.manifestPath, { current: true });
    console.log(JSON.stringify({ schema, ...result, integrity: verified.integrity, releaseApproved: false, blockers: prepared.report.blockers }, null, 2));
  } catch (error) {
    console.log(JSON.stringify(failureReport(schema, error), null, 2));
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) await main();
