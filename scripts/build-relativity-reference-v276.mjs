#!/usr/bin/env node

/**
 * Build a small, deterministic v276 reference manifest.
 *
 * This is intentionally metadata-only: full DE440/IAS15/DOP853 propagation
 * is an explicit offline campaign and is not started by this command.  The
 * artifact is useful for schema/identity validation and can be safely built
 * under the low-memory workstation policy.
 */
import { createHash } from "node:crypto";
import { mkdir, rename, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const ROOT = resolve(".");
const OUT_DIR = resolve(ROOT, "dist/science/relativity-reference-v276");
const BUNDLE = resolve(OUT_DIR, "reference-bundle.json");
const EVIDENCE = resolve(OUT_DIR, "reference-evidence.json");
const POINTER = resolve(ROOT, "dist/release/orbit-atlas-current-local-v276-reference.json");
const CODE_SHA = "0debb41b96f001f92f498ef6a36ceff77ede7f0dd2bdbe3c6e9db3dfbf6090a8";
const SCREEN_SHA = "08f42a50bc787df62dc018ee56b5f7b58065dcafe2e2a3703e3e67f3e6d94037";

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
    ? Object.fromEntries(Object.entries(value).filter(([key]) => !["generatedAt", "host", "pid", "absolutePath"].includes(key)).sort(([a], [b]) => a.localeCompare(b)).map(([key, entry]) => [key, canonicalShaPayload(entry)]))
    : value;
const canonicalShaJson = (value) => JSON.stringify(canonicalShaPayload(value));

const manifest = {
  version: "v276-relativity-reference-kernel",
  authority: "offline-cpu-reference",
  primarySolver: "scipy-dop853",
  independentSolver: "rebound-ias15",
  precision: "float64",
  stateDimension: 72,
  variationalParameterDimension: 66,
  integratedStateAndPhiDimension: 4824,
  targetIdentityRule: "target-kind-and-origin-must-match-before-comparison",
  models: [
    "barycentric-nbody-eih-1pn-v276",
    "barycentric-nbody-eih-1pn+solar-j2-v276",
    "barycentric-nbody-eih-1pn+solar-monopole-2pn+solar-lt-v276",
  ],
  canonicalShaExcludes: ["generatedAt", "host", "pid", "absolutePath"],
};

const targets = [
  {
    id: "jupiter-system-barycenter",
    label: "Jupiter system barycenter",
    naifTargetId: 5,
    horizonsCommand: "COMMAND='@5'&MAKE_EPHEM='YES'&EPHEM_TYPE='VECTORS'&CENTER='@0'",
    targetKind: "planetary-system-barycenter",
    frame: "ICRF/J2000",
    origin: "solar-system-barycenter",
    tdbEpoch: "2000-01-01T12:00:00Z",
    units: { position: "m", velocity: "m/s", gravitationalParameter: "m^3/s^2" },
    gmSource: "DE440s planetary-system GM table",
    gmSI: 1.2668653491037e17,
  },
  {
    id: "earth-body-center",
    label: "Earth body center (separate reference family)",
    naifTargetId: 399,
    horizonsCommand: "COMMAND='399'&MAKE_EPHEM='YES'&EPHEM_TYPE='VECTORS'&CENTER='@0'",
    targetKind: "body-center",
    frame: "ICRF/J2000",
    origin: "body-center",
    tdbEpoch: "2000-01-01T12:00:00Z",
    units: { position: "m", velocity: "m/s", gravitationalParameter: "m^3/s^2" },
    gmSource: "DE440s body-center GM table",
    gmSI: 3.9860043543609598e14,
  },
];

const forceModel = {
  kernelId: manifest.models[0],
  bodyCount: 12,
  coordinateGauge: "harmonic-barycentric",
  primaryFrame: "ICRF/J2000",
  origin: "solar-system-barycenter",
  includesNewtonianNBody: true,
  includesEihOnePn: true,
  includesSolarJ2: false,
  includesSolarMonopole2Pn: false,
  includesSolarLenseThirring: false,
  claimsGrmhd: false,
};

const uncertaintyBudget = {
  uDiscretization: 0.0001,
  uSolver: 0.0002,
  uReference: 0.001,
  uInitialState: 0.002,
  uFit: 0.0005,
  uConstants: 0.0002,
  uModel: 0.004,
  unit: "m",
  aggregation: "linear-no-independence-proof",
  total: 0.008,
};

const artifact = {
  version: "v276-relativity-reference-kernel",
  generatedAt: new Date().toISOString(),
  manifestSha256: sha256(canonicalJson(manifest)),
  manifest,
  targets,
  forceModel,
  window: {
    calibrationDays: [0, 30],
    fitRuns: 3,
    blindHoldoutDays: [365, 3652.5],
    checkpointSchema: "relativity-reference-checkpoint-v276",
  },
  uncertaintyBudget,
  oracle: {
    id: "mp-oracle-v276",
    backend: "python-decimal",
    decimalDigits: 80,
    scope: ["two-body", "schwarzschild-analytic", "kerr-critical-curve"],
    status: "not-run",
    fixtureCount: 0,
    outputSha256: null,
    lowMemoryMode: true,
    fullNBodyAuthority: false,
  },
  provenance: {
    scienceCodeSha256: CODE_SHA,
    screenSha256: SCREEN_SHA,
    workerPhysicsMutation: "not-applied",
    eihOnePnMutation: "not-applied",
    kerrMutation: "not-applied",
  },
  boundary: "offline-shadow-reference-only-no-runtime-physics-promotion",
};

const evidenceUnsigned = {
  version: "v276-relativity-reference-evidence-v1",
  generatedAt: artifact.generatedAt,
  status: "implemented-awaiting-qualification",
  capability: "reference-infrastructure-shadow-candidate",
  artifact: {
    path: "dist/science/relativity-reference-v276/reference-bundle.json",
    sha256: sha256(canonicalShaJson(artifact)),
    canonicalSha256: sha256(canonicalShaJson(artifact)),
    canonicalShaExcludes: ["generatedAt", "host", "pid", "absolutePath"],
  },
  validation: "not-run",
  oracle: { status: "not-run", command: "npm run atlas -- relativity oracle-v276" },
  campaign: { calibration: "not-run", fitRuns: 0, blindHoldout: "not-run", automaticRetryApplied: false },
  science: {
    status: "science-failed-shadow-retained",
    defaultKernel: "legacy-eih-1pn",
    codeSha256: CODE_SHA,
    screenSha256: SCREEN_SHA,
    workerPhysicsMutation: "not-applied",
    eihOnePnMutation: "not-applied",
    kerrMutation: "not-applied",
  },
  release: { formalProductPointer: "dist/release/orbit-atlas-current-product-evidence-v263.json", formalProductPointerAdvanced: false, localShadowPromotionApplied: false, publicDeploymentBlocked: true },
  boundary: "reference-schema-and-identity-built-no-propagation-or-runtime-promotion",
};
const evidence = { ...evidenceUnsigned, evidenceSha256: sha256(canonicalShaJson(evidenceUnsigned)) };
const pointerUnsigned = {
  version: "orbit-atlas-current-local-v276-reference",
  generatedAt: artifact.generatedAt,
  status: evidence.status,
  source: { path: "dist/science/relativity-reference-v276/reference-evidence.json", sha256: sha256(canonicalShaJson(evidence)) },
  capability: "reference-infrastructure-shadow-candidate",
  formalProductPointer: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  formalProductPointerAdvanced: false,
  localShadowPromotionApplied: false,
  automaticRetryApplied: false,
  publicDeploymentBlocked: true,
};
const pointer = { ...pointerUnsigned, pointerSha256: sha256(canonicalShaJson(pointerUnsigned)) };

await mkdir(OUT_DIR, { recursive: true });
await mkdir(resolve(ROOT, "dist/release"), { recursive: true });
async function atomicJson(path, value) {
  const tmp = `${path}.part`;
  await writeFile(tmp, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await rename(tmp, path);
}
await atomicJson(BUNDLE, artifact);
await atomicJson(EVIDENCE, evidence);
await atomicJson(POINTER, pointer);
console.log(JSON.stringify({ bundle: BUNDLE, evidence: EVIDENCE, pointer: POINTER, manifestSha256: artifact.manifestSha256, status: evidence.status }, null, 2));
