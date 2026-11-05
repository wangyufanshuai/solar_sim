#!/usr/bin/env node

import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const ROOT = resolve(".");
const V283_PATH = "dist/science/kerr-reference-v283/short-gate-evidence.json";
const V284_PATH = "dist/science/kerr-campaign-v284/campaign-state.json";
const OUTPUT = "dist/science/scientific-evidence-truth-audit-v286.json";
const POINTER = "dist/release/orbit-atlas-current-local-scientific-truth-v286.json";

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value)
    .filter(([key]) => !["generatedAt", "pid", "host", "absolutePath"].includes(key))
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, entry]) => [key, canonicalize(entry)]));
}

const digest = (value) => createHash("sha256").update(value).digest("hex");
const canonicalSha = (value) => digest(JSON.stringify(canonicalize(value)));
const fileSha = async (relative) => digest(await readFile(resolve(ROOT, relative)));

const v283 = JSON.parse(await readFile(resolve(ROOT, V283_PATH), "utf8"));
const v284 = JSON.parse(await readFile(resolve(ROOT, V284_PATH), "utf8"));
const executions = Array.isArray(v283.executions) ? v283.executions : [];
const brackets = Array.isArray(v283.criticalBrackets) ? v283.criticalBrackets : [];
const carterCaptureCount = executions.filter((row) => row.formulation === "carter-mino-dop853" && row.capture === true).length;
const kerrSchildCaptureCount = executions.filter((row) => row.formulation === "cartesian-kerr-schild-hamiltonian-dop853" && row.capture === true).length;
const uniqueRedshiftResidualCount = new Set(executions.map((row) => row.redshiftInvariantResidual)).size;
const uniqueEvpaResidualCount = new Set(executions.map((row) => row.evpaResidualDeg)).size;
const positiveBracketWidthCount = brackets.filter((row) => Number(row.bracketWidthPx) > 0).length;
const reasons = [];
if (carterCaptureCount === 0 && kerrSchildCaptureCount === 0) reasons.push("zero-capture-coverage-in-both-formulations");
if (uniqueRedshiftResidualCount === 1 && executions.every((row) => row.redshiftInvariantResidual === 0)) reasons.push("redshift-residual-hardcoded-zero");
if (uniqueEvpaResidualCount === 1 && executions.every((row) => row.evpaResidualDeg === 0)) reasons.push("evpa-residual-hardcoded-zero");
if (positiveBracketWidthCount === 0) reasons.push("critical-brackets-have-zero-measured-width");
const withdrawn = reasons.length > 0;

const unsigned = {
  version: "v286-scientific-evidence-truth-audit-v1",
  generatedAt: new Date().toISOString(),
  status: withdrawn ? "scientific-qualification-corrected" : "no-correction-required",
  sourceArtifacts: {
    v283: { path: V283_PATH, fileSha256: await fileSha(V283_PATH), claimedEvidenceSha256: v283.evidenceSha256 },
    v284: { path: V284_PATH, fileSha256: await fileSha(V284_PATH), claimedStateSha256: v284.stateSha256 },
  },
  v283: {
    status: withdrawn ? "structural-gate-passed-science-qualification-withdrawn" : "science-gate-nondegenerate",
    executionCount: executions.length,
    carterCaptureCount,
    kerrSchildCaptureCount,
    uniqueRedshiftResidualCount,
    uniqueEvpaResidualCount,
    positiveBracketWidthCount,
    reasons,
  },
  v284: {
    status: withdrawn ? "quarantined-nonauthoritative-1-of-49" : "not-quarantined",
    completedShardCount: Number(v284.completedShardCount ?? 0),
    authorityInheritedFromWithdrawnGate: withdrawn,
  },
  historicalArtifactsMutated: false,
  formalProductPointer: "v263",
  defaultKernel: "legacy-eih-1pn",
  boundary: "truth-correction-only-no-physics-promotion",
};
const evidence = { ...unsigned, evidenceSha256: canonicalSha(unsigned) };
const pointerUnsigned = {
  version: "orbit-atlas-current-local-scientific-truth-v286",
  generatedAt: unsigned.generatedAt,
  status: evidence.status,
  evidence: { path: OUTPUT, sha256: evidence.evidenceSha256 },
  formalProductPointer: "v263",
  formalProductPointerAdvanced: false,
};
const pointer = { ...pointerUnsigned, pointerSha256: canonicalSha(pointerUnsigned) };
await mkdir(resolve(ROOT, "dist/science"), { recursive: true });
await mkdir(resolve(ROOT, "dist/release"), { recursive: true });
await writeFile(resolve(ROOT, OUTPUT), `${JSON.stringify(evidence, null, 2)}\n`);
await writeFile(resolve(ROOT, POINTER), `${JSON.stringify(pointer, null, 2)}\n`);
console.log(JSON.stringify({ status: evidence.status, v283: evidence.v283.status, v284: evidence.v284.status }, null, 2));
