import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";
import { readFile } from "node:fs/promises";
import {
  BOUNDARY, createAlignmentReport, failureReport, loadEvidenceInput, parseArguments, readPinnedFile,
  relativePath, safeFile, sha256, verifyBuildSnapshot, verifyEvidenceIndex,
} from "./mainline-a-release-evidence.mjs";
import { verifyRuntimePayloadV636 } from "./mainline-a-runtime-payload-v636.mjs";

const REQUIRED = [
  "release-package.json", "alignment.json", "identity-bridge.json",
  "evidence-input.json", "evidence-index.json", "gate-checklist.json", "rollback.json",
];

function checkBoundary(value, label) {
  for (const [key, expected] of Object.entries(BOUNDARY)) {
    if (value?.boundary?.[key] !== expected) throw new Error(`package-boundary-mismatch:${label}:${key}`);
  }
}

export function verifyRollbackBindingV636(rollback, { packageId, build, workingDirectory, runtime = null }) {
  if (rollback?.packageId !== packageId) throw new Error("rollback-package-id-mismatch");
  if (rollback.automaticRollback !== false || rollback.rootMutationAllowed !== false) throw new Error("rollback-mutation-policy-invalid");
  if (rollback.preservedBuild !== workingDirectory) throw new Error("rollback-preserved-build-mismatch");
  if (rollback.buildReceipt?.path !== build.receiptPath || rollback.buildReceipt?.sha256 !== build.receiptSha256) throw new Error("rollback-build-receipt-mismatch");
  if (runtime) {
    if (rollback.runtime?.path !== runtime.path || rollback.runtime?.sha256 !== runtime.sha256) throw new Error("rollback-runtime-binding-mismatch");
    if (rollback.runtime.restorePolicy !== "new-exclusive-directory-only" || rollback.runtime.existingEnvironmentMutation !== false) throw new Error("rollback-restore-policy-invalid");
  } else if (rollback.runtime !== undefined) throw new Error("rollback-unindexed-runtime-rejected");
  return true;
}

export async function verifyPackage(workspace, requestedManifest, { current = true, rootObservation = null } = {}) {
  const manifestFile = await safeFile(workspace, requestedManifest);
  const manifestBytes = await readFile(manifestFile.absolute);
  const manifest = JSON.parse(manifestBytes.toString("utf8"));
  if (manifest.schema !== "mainline-a-release-package-manifest-pinned-v1") throw new Error("package-manifest-schema-invalid");
  checkBoundary(manifest, "manifest");
  const required = manifest.runtimePayloadIncluded === true ? [...REQUIRED, "runtime-payload.json"] : REQUIRED;
  if (!Array.isArray(manifest.files) || manifest.files.length !== required.length) throw new Error("package-manifest-file-set-incomplete");
  const names = manifest.files.map((entry) => entry.path);
  if (new Set(names).size !== names.length || required.some((name) => !names.includes(name))) throw new Error("package-manifest-file-set-mismatch");
  const directory = path.dirname(manifestFile.absolute);
  const documents = {};
  for (const descriptor of manifest.files) {
    if (path.basename(descriptor.path) !== descriptor.path) throw new Error("package-member-path-escape");
    const requested = relativePath(workspace, path.join(directory, descriptor.path));
    const pinned = await readPinnedFile(workspace, { ...descriptor, path: requested, evidenceClass: "static" }, `package:${descriptor.path}`);
    documents[descriptor.path] = JSON.parse(pinned.raw.toString("utf8"));
  }
  const value = documents["release-package.json"];
  const alignment = documents["alignment.json"];
  const bridge = documents["identity-bridge.json"];
  const index = documents["evidence-index.json"];
  const checklist = documents["gate-checklist.json"];
  const input = documents["evidence-input.json"];
  for (const [label, item] of Object.entries({ value, alignment, bridge, index, checklist, rollback: documents["rollback.json"] })) checkBoundary(item, label);
  if (value.packageId !== manifest.packageId || index.packageId !== manifest.packageId || checklist.packageId !== manifest.packageId) throw new Error("package-id-mismatch");
  if (value.status !== "blocked" || value.admission !== "candidate-only" || checklist.status !== "blocked") throw new Error("candidate-package-promotion-rejected");
  const roles = new Map(index.files.map((item) => [item.role, item]));
  const buildRef = roles.get("build");
  const inputRef = roles.get("evidenceInput");
  const bridgeRef = roles.get("identityBridge");
  if (!buildRef || !inputRef || !bridgeRef) throw new Error("package-foundation-evidence-missing");
  if (value.evidenceInput.sha256 !== inputRef.sha256 || value.identityBridge.sha256 !== bridgeRef.sha256) throw new Error("package-foundation-digest-mismatch");
  const integrity = await verifyEvidenceIndex(workspace, index.files);
  const evidence = await loadEvidenceInput(workspace, inputRef.path);
  if (evidence.bundle.sha256 !== inputRef.sha256 || JSON.stringify(input) !== JSON.stringify(evidence.input)) throw new Error("package-input-snapshot-mismatch");
  if (input.mode !== "candidate") throw new Error("fixture-package-not-admitted");
  const runtime = documents["runtime-payload.json"] ?? null;
  if (Boolean(value.runtimePayloadIncluded) !== Boolean(runtime)) throw new Error("package-runtime-presence-mismatch");
  verifyRollbackBindingV636(documents["rollback.json"], {
    packageId: manifest.packageId, build: evidence.build, workingDirectory: evidence.values.build.workingDirectory, runtime,
  });
  let runtimeIntegrity = null;
  if (runtime) {
    checkBoundary(runtime, "runtime");
    if (runtime.schema !== "mainline-a-package-runtime-binding-v636" || runtime.packageId !== manifest.packageId) throw new Error("package-runtime-schema-or-id-mismatch");
    const storage = runtime.storage ?? "embedded";
    if (!["embedded", "workspace-reference"].includes(storage)) throw new Error("package-runtime-storage-invalid");
    if (storage === "embedded" && runtime.path !== "runtime/runtime-payload-manifest.json") throw new Error("package-runtime-path-invalid");
    const runtimePath = storage === "embedded" ? relativePath(workspace, path.join(directory, runtime.path)) : relativePath(workspace, runtime.path);
    if (storage === "workspace-reference" && runtime.path !== runtimePath) throw new Error("package-runtime-reference-path-not-canonical");
    if (path.basename(runtimePath) !== "runtime-payload-manifest.json") throw new Error("package-runtime-path-invalid");
    if (runtime.status !== "candidate-copy" || runtime.releaseApproved !== false || runtime.recoveryTest !== "not-run") throw new Error("package-runtime-approval-claim-rejected");
    for (const key of ["buildId", "runtimeBuildId", "branch", "head", "profile", "receiptSha256", "receiptPath", "sourceSha256"]) {
      if (runtime.build?.[key] !== evidence.build[key]) throw new Error(`package-runtime-build-mismatch:${key}`);
    }
    await readPinnedFile(workspace, { ...runtime, path: runtimePath, evidenceClass: "static" }, "runtimeManifest");
    runtimeIntegrity = await verifyRuntimePayloadV636({
      workspace, directory: relativePath(workspace, path.dirname(path.join(workspace, runtimePath))),
      expectedManifestSha256: runtime.sha256,
      expectedBuild: Object.fromEntries(["buildId", "runtimeBuildId", "branch", "head", "profile", "receiptSha256", "receiptPath", "sourceSha256"].map((key) => [key, evidence.build[key]])),
    });
    const runtimeManifest = JSON.parse(await readFile(path.join(workspace, runtimePath), "utf8"));
    if (runtime.fileCount !== runtimeManifest.files.length || runtime.totalBytes !== runtimeManifest.files.reduce((sum, file) => sum + file.bytes, 0)) throw new Error("package-runtime-inventory-count-mismatch");
  }
  const actualIndex = new Map(index.files.map((item) => [item.path, item]));
  for (const reference of evidence.index) {
    const found = actualIndex.get(reference.path);
    if (!found || found.sha256 !== reference.sha256 || found.evidenceClass !== reference.evidenceClass) throw new Error(`package-reference-omitted:${reference.path}`);
  }
  const sourceBridge = JSON.parse((await readPinnedFile(workspace, bridgeRef, "identityBridge")).raw.toString("utf8"));
  if (JSON.stringify(bridge) !== JSON.stringify(sourceBridge)) throw new Error("package-bridge-snapshot-mismatch");
  for (const item of [manifest, value, alignment, bridge]) {
    for (const key of ["buildId", "runtimeBuildId", "branch", "head", "receiptSha256", "sourceSha256"]) {
      if (item.build?.[key] !== evidence.build[key]) throw new Error(`package-build-mismatch:${key}`);
    }
    if (item.evidenceInput?.sha256 !== evidence.bundle.sha256) throw new Error("package-input-binding-mismatch");
  }
  if (JSON.stringify(value.gates) !== JSON.stringify(alignment.gates) || JSON.stringify(value.gates) !== JSON.stringify(checklist.gates)) throw new Error("package-gate-snapshot-mismatch");
  if (current && evidence.buildProblems.length) throw new Error(`package-current-source-invalid:${evidence.buildProblems.join(",")}`);
  const replayEvidence = current ? evidence : {
    ...evidence, snapshot: evidence.values.build.inputBefore,
    buildProblems: verifyBuildSnapshot(evidence.values.build, evidence.values.build.inputBefore),
  };
  const recalculated = await createAlignmentReport(workspace, replayEvidence,
    current ? rootObservation : alignment.rootObservation);
  for (const key of ["gates", "sourceClosure", "rightsClosure", "claims", "blockers", "sourceBinding"]) {
    if (JSON.stringify(alignment[key]) !== JSON.stringify(recalculated[key])) throw new Error(`package-derived-report-mismatch:${key}`);
  }
  for (const key of ["gates", "claims", "blockers", "sourceBinding"]) {
    if (JSON.stringify(value[key]) !== JSON.stringify(recalculated[key])) throw new Error(`package-derived-summary-mismatch:${key}`);
  }
  if (Object.values(value.claims).some((claim) => claim !== false)) throw new Error("package-approval-claim-rejected");
  return {
    schema: "mainline-a-release-package-verification-v1", status: "blocked", readOnly: true,
    packageId: manifest.packageId, manifest: { path: manifestFile.relative, sha256: sha256(manifestBytes) },
    integrity: { ...integrity, packageFiles: required.length, offlineReplay: true, runtimePayload: runtimeIntegrity },
    currentSourceVerified: current && evidence.buildProblems.length === 0,
    historicalReplayOnly: !current, releaseApproved: false, boundary: BOUNDARY,
    build: evidence.build, blockers: value.blockers,
  };
}

async function main() {
  try {
    const options = parseArguments(process.argv.slice(2), ["package", "mode", "json"]);
    const mode = options.mode ?? "current";
    if (!["current", "historical"].includes(mode)) throw new Error("verification-mode-invalid");
    console.log(JSON.stringify(await verifyPackage(process.cwd(), options.package, { current: mode === "current" }), null, 2));
  } catch (error) {
    console.log(JSON.stringify(failureReport("mainline-a-release-package-verification-v1", error), null, 2));
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) await main();
