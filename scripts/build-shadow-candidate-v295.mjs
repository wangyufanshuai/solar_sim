import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const scienceOutput = "dist/science/orbit-atlas-shadow-v295-evidence.json";
const pointerOutput = "dist/release/orbit-atlas-current-local-shadow-candidate-v295.json";
const formalPointerPath = "dist/release/orbit-atlas-current-product-evidence-v263.json";

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value)
    .filter(([key]) => !["generatedAt", "pid", "host", "absolutePath"].includes(key))
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, entry]) => [key, canonicalize(entry)]));
}

function canonicalSha(value) {
  return createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
}

function fileSha(relative) {
  return createHash("sha256").update(readFileSync(resolve(root, relative))).digest("hex");
}

function readVerified(relative, field, pythonCanonical = false) {
  const document = JSON.parse(readFileSync(resolve(root, relative), "utf8"));
  const expected = document[field];
  const unsigned = { ...document };
  delete unsigned[field];
  if (typeof expected !== "string") throw new Error(`${relative} canonical SHA is missing`);
  if (pythonCanonical) {
    const source = "import hashlib,json,pathlib,sys\np=pathlib.Path(sys.argv[1]);field=sys.argv[2];d=json.loads(p.read_text(encoding='utf-8'));expected=d.pop(field,None)\ndef c(v):\n return [c(x) for x in v] if isinstance(v,list) else {k:c(v[k]) for k in sorted(v) if k not in {'generatedAt','pid','host','absolutePath'}} if isinstance(v,dict) else v\nactual=hashlib.sha256(json.dumps(c(d),sort_keys=True,separators=(',',':'),allow_nan=False).encode()).hexdigest();raise SystemExit(0 if actual==expected else 1)";
    const result = spawnSync(resolve(root, ".venv-science/Scripts/python.exe"), ["-c", source, resolve(root, relative), field], { cwd: root, encoding: "utf8" });
    if (result.status !== 0) throw new Error(`${relative} Python canonical SHA mismatch`);
  } else if (canonicalSha(unsigned) !== expected) throw new Error(`${relative} canonical SHA mismatch`);
  return { document, canonicalSha256: expected, fileSha256: fileSha(relative) };
}

const validation = readVerified("dist/science/v295-low-memory-validation.json", "evidenceSha256");
const v291 = readVerified("dist/science/kerr-reference-v291/coordinate-event-diagnostic.json", "evidenceSha256", true);
const v292 = readVerified("dist/science/kerr-reference-v292/geometry-redshift-short-gate.json", "evidenceSha256", true);
const v293 = readVerified("dist/science/kerr-reference-v293/polarization-gate.json", "evidenceSha256", true);
const v287 = readVerified("dist/science/relativity-reference-v282r2/identity-fetch-evidence.json", "evidenceSha256", true);
const truth = readVerified("dist/science/scientific-evidence-truth-audit-v286.json", "evidenceSha256");
const v288 = readVerified("dist/science/kerr-reference-v288/short-gate-evidence.json", "evidenceSha256", true);
const campaign = readVerified("dist/science/kerr-campaign-v288r1/campaign-state.json", "stateSha256", true);
const formalPointerSha256 = fileSha(formalPointerPath);

if (validation.document.status !== "passed-low-memory-validation-science-blocked-v292") throw new Error("v295 low-memory validation is not complete");
if (v287.document.status !== "identity-cache-partial-1-of-9") throw new Error("v282r2 Mercury identity state changed");
if (Number(campaign.document.completedShardCount ?? 0) !== 0) throw new Error("a dense Kerr shard was executed unexpectedly");

const capabilities = {
  v282: "identity-cache-partial-1-of-9",
  legacyV283: "qualification-withdrawn",
  legacyV284: "quarantined",
  v288: "failed-preserved",
  v291: v291.document.status,
  v292: v292.document.status,
  v293: v293.document.status,
  campaign: "incomplete-0-of-49",
  v294: "implemented-awaiting-browser-qualification",
  v295: "heavy-qualification-pending",
};
const unsignedEvidence = {
  version: "v295-kerr-truth-low-memory-shadow-evidence-v1",
  generatedAt: new Date().toISOString(),
  status: "low-memory-implementation-complete-heavy-qualification-pending",
  capabilities,
  evidence: {
    validation: { path: "dist/science/v295-low-memory-validation.json", sha256: validation.fileSha256, canonicalSha256: validation.canonicalSha256 },
    v291: { path: "dist/science/kerr-reference-v291/coordinate-event-diagnostic.json", sha256: v291.fileSha256, canonicalSha256: v291.canonicalSha256 },
    v292: { path: "dist/science/kerr-reference-v292/geometry-redshift-short-gate.json", sha256: v292.fileSha256, canonicalSha256: v292.canonicalSha256 },
    v293: { path: "dist/science/kerr-reference-v293/polarization-gate.json", sha256: v293.fileSha256, canonicalSha256: v293.canonicalSha256 },
    truthV286: { path: "dist/science/scientific-evidence-truth-audit-v286.json", sha256: truth.fileSha256, canonicalSha256: truth.canonicalSha256 },
    preservedV288: { path: "dist/science/kerr-reference-v288/short-gate-evidence.json", sha256: v288.fileSha256, canonicalSha256: v288.canonicalSha256 },
  },
  scientificTruth: {
    v291CoordinateClassificationAgreement: v291.document.thresholds?.capture02Agreement === true,
    v292ClassificationAgreement: v292.document.thresholds?.classificationAgreement ?? null,
    v292GeometryQualified: v292.document.geometryRedshiftQualified === true,
    v293ImplementationSelfTestPassed: v293.document.implementationSelfTest?.passed === true,
    v293FormalQualified: v293.document.qualified === true,
    denseShardExecuted: false,
  },
  formalProductPointer: { path: formalPointerPath, version: "v263-current-product-evidence-pointer", sha256: formalPointerSha256, advanced: false },
  science: validation.document.science,
  release: { formalProductPointerAdvanced: false, localShadowDefaultApplied: false, publicDeploymentBlocked: true, vercelApplied: false, productionApplied: false, dnsApplied: false, signingApplied: false },
  heavyQualification: { run: false, requiredFreeMemoryGiB: 7, status: "pending-resource-stability-and-heavy-gates" },
};
const scienceEvidence = { ...unsignedEvidence, evidenceSha256: canonicalSha(unsignedEvidence) };
mkdirSync(resolve(root, "dist/science"), { recursive: true });
writeFileSync(resolve(root, scienceOutput), `${JSON.stringify(scienceEvidence, null, 2)}\n`);

const unsignedPointer = {
  version: "orbit-atlas-current-local-shadow-candidate-v295",
  generatedAt: new Date().toISOString(),
  status: scienceEvidence.status,
  capabilities,
  evidence: { path: scienceOutput, sha256: fileSha(scienceOutput), canonicalSha256: scienceEvidence.evidenceSha256 },
  formalProductPointer: formalPointerPath,
  formalProductPointerSha256: formalPointerSha256,
  formalProductPointerAdvanced: false,
  localShadowDefaultApplied: false,
  publicDeploymentBlocked: true,
};
const pointer = { ...unsignedPointer, pointerSha256: canonicalSha(unsignedPointer) };
mkdirSync(resolve(root, "dist/release"), { recursive: true });
writeFileSync(resolve(root, pointerOutput), `${JSON.stringify(pointer, null, 2)}\n`);
console.log(JSON.stringify({ status: pointer.status, capabilities, pointer: pointerOutput, formalProductPointerAdvanced: false }, null, 2));
