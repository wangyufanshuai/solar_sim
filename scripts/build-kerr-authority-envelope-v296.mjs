import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const python = resolve(root, ".venv-science/Scripts/python.exe");
const diagnosticPath = "dist/science/kerr-reference-v296/constraint-stability-diagnostic.json";
const gatePath = "dist/science/kerr-reference-v296/geometry-redshift-short-gate.json";
const polarizationPath = "dist/science/kerr-reference-v293/polarization-gate.json";
const outputPath = "dist/science/kerr-reference-v296/portable-envelope.json";

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value)
    .filter(([key]) => !["generatedAt", "pid", "host", "absolutePath"].includes(key))
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
  const source = "import hashlib,json,pathlib,sys\np=pathlib.Path(sys.argv[1]);d=json.loads(p.read_text(encoding='utf-8'));expected=d.pop('evidenceSha256',None)\ndef c(v):\n return [c(x) for x in v] if isinstance(v,list) else {k:c(v[k]) for k in sorted(v) if k not in {'generatedAt','pid','host','absolutePath'}} if isinstance(v,dict) else v\nactual=hashlib.sha256(json.dumps(c(d),sort_keys=True,separators=(',',':'),allow_nan=False).encode()).hexdigest();raise SystemExit(0 if actual==expected else 1)";
  const result = spawnSync(python, ["-c", source, resolve(root, relative)], { cwd: root, encoding: "utf8" });
  if (result.status !== 0) throw new Error(`${relative} Python canonical SHA mismatch`);
  return JSON.parse(readFileSync(resolve(root, relative), "utf8"));
}

const diagnostic = readPythonEvidence(diagnosticPath);
const gate = readPythonEvidence(gatePath);
const polarization = readPythonEvidence(polarizationPath);
const unsigned = {
  version: "v296-kerr-authority-portable-envelope-v1",
  generatedAt: new Date().toISOString(),
  status: gate.geometryRedshiftQualified === true ? "geometry-redshift-qualified-polarization-pending" : "geometry-redshift-failed",
  diagnostic: {
    version: diagnostic.version,
    status: diagnostic.status,
    qualified: diagnostic.qualified === true,
    executionCount: diagnostic.executionCount,
    thresholds: diagnostic.thresholds,
    evidenceSha256: diagnostic.evidenceSha256,
    fileSha256: fileSha(diagnosticPath),
  },
  geometry: {
    version: gate.version,
    status: gate.status,
    geometryRedshiftQualified: gate.geometryRedshiftQualified === true,
    polarizationStatus: gate.polarizationStatus,
    fullKerrAuthorityQualified: false,
    executionCount: gate.executionCount,
    criticalBracketCount: gate.criticalBracketCount,
    classCounts: gate.classCounts,
    thresholds: gate.thresholds,
    failureReasons: gate.failureReasons,
    constraintStabilization: gate.constraintStabilization,
    evidenceSha256: gate.evidenceSha256,
    fileSha256: fileSha(gatePath),
  },
  polarizationImplementation: {
    version: polarization.version,
    status: gate.geometryRedshiftQualified === true && polarization.qualified !== true ? "polarization-pending" : polarization.status,
    qualified: polarization.qualified === true,
    implementationSelfTest: polarization.implementationSelfTest,
    applicableExecutionCount: polarization.applicableExecutionCount,
    evidenceSha256: polarization.evidenceSha256,
    fileSha256: fileSha(polarizationPath),
  },
  science: gate.science,
  release: { formalProductPointer: "v263", formalProductPointerAdvanced: false, denseShardExecuted: false, polarizationCampaignExecuted: false },
};
const envelope = { ...unsigned, evidenceSha256: sha(unsigned) };
mkdirSync(resolve(root, "dist/science/kerr-reference-v296"), { recursive: true });
writeFileSync(resolve(root, outputPath), `${JSON.stringify(envelope, null, 2)}\n`);
console.log(JSON.stringify({ status: envelope.status, evidenceSha256: envelope.evidenceSha256, output: outputPath }, null, 2));
