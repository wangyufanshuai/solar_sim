import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const python = resolve(root, ".venv-science/Scripts/python.exe");
const geometryPath = "dist/science/kerr-reference-v296/geometry-redshift-short-gate.json";
const polarizationPath = "dist/science/kerr-reference-v297/polarization-short-gate.json";
const historicalGeometryPath = "dist/science/kerr-reference-v292/geometry-redshift-short-gate.json";
const historicalPolarizationPath = "dist/science/kerr-reference-v293/polarization-gate.json";
const outputPath = "dist/science/kerr-reference-v297/portable-envelope.json";

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value)
    .filter(([key]) => !["generatedAt", "pid", "host", "absolutePath", "peakRssGiB"].includes(key))
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, entry]) => [key, canonicalize(entry)]));
}

function sha(value) {
  return createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
}

function fileSha(relative) {
  return createHash("sha256").update(readFileSync(resolve(root, relative))).digest("hex");
}

function readPythonEvidence(relative) {
  const source = "import hashlib,json,pathlib,sys\np=pathlib.Path(sys.argv[1]);d=json.loads(p.read_text(encoding='utf-8'));expected=d.pop('evidenceSha256',None)\ndef c(v):\n return [c(x) for x in v] if isinstance(v,list) else {k:c(v[k]) for k in sorted(v) if k not in {'generatedAt','pid','host','absolutePath','peakRssGiB'}} if isinstance(v,dict) else v\nactual=hashlib.sha256(json.dumps(c(d),sort_keys=True,separators=(',',':'),allow_nan=False).encode()).hexdigest();raise SystemExit(0 if actual==expected else 1)";
  const result = spawnSync(python, ["-c", source, resolve(root, relative)], { cwd: root, encoding: "utf8" });
  if (result.status !== 0) throw new Error(`${relative} Python canonical SHA mismatch`);
  return JSON.parse(readFileSync(resolve(root, relative), "utf8"));
}

const geometry = readPythonEvidence(geometryPath);
const polarization = readPythonEvidence(polarizationPath);
const historicalGeometry = readPythonEvidence(historicalGeometryPath);
const historicalPolarization = readPythonEvidence(historicalPolarizationPath);
if (polarization.status !== "full-kerr-short-authority-qualified" && polarization.qualified !== false) {
  throw new Error("v297 polarization status is invalid");
}

const unsigned = {
  version: "v297-kerr-authority-portable-envelope-v1",
  generatedAt: polarization.generatedAt,
  status: polarization.qualified === true ? "full-kerr-short-authority-qualified" : "polarization-short-gate-failed",
  geometry: {
    version: geometry.version,
    status: geometry.status,
    qualified: geometry.geometryRedshiftQualified === true,
    executionCount: geometry.executionCount,
    criticalBracketCount: geometry.criticalBracketCount,
    evidenceSha256: geometry.evidenceSha256,
    fileSha256: fileSha(geometryPath),
  },
  polarization: {
    version: polarization.version,
    status: polarization.status,
    qualified: polarization.qualified === true,
    applicableExecutionCount: polarization.applicableExecutionCount,
    sourceDiskHitExecutionCount: polarization.sourceDiskHitExecutionCount,
    thresholds: polarization.thresholds,
    gates: polarization.gates,
    failureReasons: polarization.failureReasons,
    evidenceSha256: polarization.evidenceSha256,
    fileSha256: fileSha(polarizationPath),
  },
  history: {
    v292: {
      version: historicalGeometry.version,
      status: historicalGeometry.status,
      executionCount: historicalGeometry.executionCount,
      criticalBracketCount: historicalGeometry.criticalBracketCount,
      thresholds: historicalGeometry.thresholds,
      failureReasons: historicalGeometry.failureReasons,
      evidenceSha256: historicalGeometry.evidenceSha256,
      fileSha256: fileSha(historicalGeometryPath),
    },
    v293: {
      version: historicalPolarization.version,
      status: historicalPolarization.status,
      qualified: historicalPolarization.qualified === true,
      implementationSelfTest: historicalPolarization.implementationSelfTest,
      applicableExecutionCount: historicalPolarization.applicableExecutionCount,
      failureReasons: historicalPolarization.failureReasons,
      evidenceSha256: historicalPolarization.evidenceSha256,
      fileSha256: fileSha(historicalPolarizationPath),
    },
  },
  authority: {
    walkerPenrose: "standard-complex-kerr-walker-penrose",
    parallelTransport: "independent-cartesian-kerr-schild-hamiltonian-dop853",
    sourceSha256: fileSha("scripts/run-kerr-polarization-v297.py"),
    sourceGeometryVersion: "v296",
    denseCampaign: "not-executed-0-of-49",
  },
  science: polarization.science,
  release: {
    formalProductPointer: "v263",
    formalProductPointerAdvanced: false,
    denseShardExecuted: false,
    browserQualificationRun: false,
    localShadowDefaultApplied: false,
  },
};
const envelope = { ...unsigned, evidenceSha256: sha(unsigned) };
mkdirSync(resolve(root, "dist/science/kerr-reference-v297"), { recursive: true });
writeFileSync(resolve(root, outputPath), `${JSON.stringify(envelope, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ status: envelope.status, evidenceSha256: envelope.evidenceSha256, output: outputPath }, null, 2));
