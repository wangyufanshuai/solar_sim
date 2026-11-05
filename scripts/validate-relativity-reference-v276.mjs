#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(".");
const bundlePath = resolve(root, "dist/science/relativity-reference-v276/reference-bundle.json");
const reportPath = resolve(root, "dist/science/relativity-reference-v276/validation.json");
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const canonicalize = (value) => Array.isArray(value)
  ? value.map(canonicalize)
  : value && typeof value === "object"
    ? Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, entry]) => [key, canonicalize(entry)]))
    : value;
const canonicalJson = (value) => JSON.stringify(canonicalize(value));
const canonicalShaPayload = (value) => Array.isArray(value)
  ? value.map(canonicalShaPayload)
  : value && typeof value === "object"
    ? Object.fromEntries(Object.entries(value).filter(([key]) => !["checkedAt", "generatedAt", "host", "pid", "absolutePath"].includes(key)).sort(([a], [b]) => a.localeCompare(b)).map(([key, entry]) => [key, canonicalShaPayload(entry)]))
    : value;
const canonicalShaJson = (value) => JSON.stringify(canonicalShaPayload(value));

const bundle = JSON.parse(await readFile(bundlePath, "utf8"));
const failures = [];
const manifestSha = sha256(canonicalJson(bundle.manifest));
if (bundle.manifestSha256 !== manifestSha) failures.push("manifest-canonical-sha-mismatch");
if (bundle.version !== "v276-relativity-reference-kernel") failures.push("version-mismatch");
if (!Array.isArray(bundle.targets) || bundle.targets.length === 0) failures.push("target-list-empty");
if (Array.isArray(bundle.targets) && new Set(bundle.targets.map((target) => target.id)).size !== bundle.targets.length) failures.push("target-identity-duplicate-id");
for (const target of bundle.targets ?? []) {
  const expectedOrigin = target.targetKind === "body-center" ? "body-center" : "solar-system-barycenter";
  if (target.origin !== expectedOrigin) failures.push(`target-origin-mismatch:${target.id}`);
  if (target.frame !== "ICRF/J2000" || target.units?.position !== "m" || target.units?.velocity !== "m/s") failures.push(`target-frame-units-invalid:${target.id}`);
  if (!Number.isInteger(target.naifTargetId) || !target.horizonsCommand || !target.gmSource || !Number.isFinite(target.gmSI) || target.gmSI <= 0) failures.push(`target-numeric-invalid:${target.id}`);
}
if (bundle.manifest?.stateDimension !== 72 || bundle.manifest?.variationalParameterDimension !== 66 || bundle.manifest?.integratedStateAndPhiDimension !== 4824) failures.push("variational-dimensions-invalid");
if (bundle.forceModel?.bodyCount !== 12 || bundle.forceModel?.claimsGrmhd !== false || bundle.forceModel?.coordinateGauge !== "harmonic-barycentric") failures.push("force-model-boundary-invalid");
const budget = bundle.uncertaintyBudget;
const terms = ["uDiscretization", "uSolver", "uReference", "uInitialState", "uFit", "uConstants", "uModel"];
if (budget?.aggregation !== "linear-no-independence-proof" || !terms.every((key) => Number.isFinite(budget[key])) || Math.abs(budget.total - terms.reduce((sum, key) => sum + budget[key], 0)) > Math.max(1e-12, budget.total * 1e-12)) failures.push("uncertainty-budget-invalid");
if (bundle.oracle?.id !== "mp-oracle-v276" || bundle.oracle?.decimalDigits !== 80 || bundle.oracle?.lowMemoryMode !== true || bundle.oracle?.fullNBodyAuthority !== false) failures.push("oracle-contract-invalid");
if (bundle.provenance?.scienceCodeSha256 !== "0debb41b96f001f92f498ef6a36ceff77ede7f0dd2bdbe3c6e9db3dfbf6090a8" || bundle.provenance?.screenSha256 !== "08f42a50bc787df62dc018ee56b5f7b58065dcafe2e2a3703e3e67f3e6d94037") failures.push("protected-science-sha-changed");
const report = {
  version: "v276-relativity-reference-validation-v1",
  checkedAt: new Date().toISOString(),
  artifact: { path: "dist/science/relativity-reference-v276/reference-bundle.json", manifestSha256: bundle.manifestSha256 },
  checks: {
    manifestCanonicalSha: failures.includes("manifest-canonical-sha-mismatch") ? "failed" : "passed",
    targetIdentity: failures.some((failure) => failure.startsWith("target-")) ? "failed" : "passed",
    forceModelBoundary: failures.includes("force-model-boundary-invalid") ? "failed" : "passed",
    variationalDimensions: failures.includes("variational-dimensions-invalid") ? "failed" : "passed",
    uncertaintyBudget: failures.includes("uncertainty-budget-invalid") ? "failed" : "passed",
    oracleContract: failures.includes("oracle-contract-invalid") ? "failed" : "passed",
    protectedScienceSha: failures.includes("protected-science-sha-changed") ? "failed" : "passed",
  },
  oracleStatus: bundle.oracle?.status ?? "unknown",
  campaign: { calibration: "not-run", fitRuns: 0, blindHoldout: "not-run", automaticRetryApplied: false },
  status: failures.length === 0 ? "passed-v276-schema-and-identity" : "failed-v276-schema-or-identity",
  failures,
  boundary: "reference-schema-validation-does-not-promote-runtime-physics",
};
report.reportSha256 = sha256(canonicalShaJson(report));
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ report: reportPath, status: report.status, failures, reportSha256: report.reportSha256 }, null, 2));
if (failures.length) process.exitCode = 1;
