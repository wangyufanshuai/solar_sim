import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const node = process.execPath;
const python = resolve(root, ".venv-science/Scripts/python.exe");

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value).filter(([key]) => !["generatedAt", "pid", "host", "absolutePath"].includes(key)).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, canonicalize(entry)]));
}

function sha(value) {
  return createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
}

function fileSha(relative) {
  return createHash("sha256").update(readFileSync(resolve(root, relative))).digest("hex");
}

function run(id, command, args) {
  const result = spawnSync(command, args, { cwd: root, encoding: "utf8", maxBuffer: 16 * 1024 * 1024 });
  if (result.status !== 0) {
    process.stderr.write(result.stdout ?? "");
    process.stderr.write(result.stderr ?? "");
  }
  return { id, exitCode: result.status ?? -1, passed: result.status === 0 };
}

function readNodeEvidence(relative) {
  const document = JSON.parse(readFileSync(resolve(root, relative), "utf8"));
  const expected = document.evidenceSha256;
  const unsigned = { ...document };
  delete unsigned.evidenceSha256;
  if (typeof expected !== "string" || sha(unsigned) !== expected) throw new Error(`${relative} SHA mismatch`);
  return document;
}

const envelope = readNodeEvidence("dist/science/kerr-reference-v296/portable-envelope.json");
const commands = [
  run("v296-python-tests", python, ["scripts/test-kerr-authority-v296.py"]),
  run("focused", node, ["scripts/atlas.mjs", "test", "focused"]),
  run("typescript", node, ["scripts/atlas.mjs", "test", "types"]),
  run("eslint-v296-zero-warning", node, [resolve(root, "node_modules/eslint/bin/eslint.js"), "--max-warnings=0", "scripts/build-kerr-authority-envelope-v296.mjs", "scripts/verify-shadow-v296-light.mjs", "scripts/build-shadow-candidate-v296.mjs", "app/lib/kerrAuthorityV296.ts", "app/lib/kerrAuthorityV296.test.ts", "app/lib/atlasShadowCapabilityPointerV296.ts", "app/lib/atlasShadowCapabilityPointerV296.test.ts", "app/lib/relativityWorkbenchEvidenceV285.ts", "app/lib/relativityEvidenceServerV285R1.ts"]),
];
const frozen = {
  formalV263Sha256: fileSha("dist/release/orbit-atlas-current-product-evidence-v263.json"),
  legacyV288Sha256: fileSha("dist/science/kerr-reference-v288/short-gate-evidence.json"),
  v291NegativeSha256: fileSha("dist/science/kerr-reference-v291/coordinate-event-diagnostic.json"),
  v292NegativeSha256: fileSha("dist/science/kerr-reference-v292/geometry-redshift-short-gate.json"),
  v293BlockedSha256: fileSha("dist/science/kerr-reference-v293/polarization-gate.json"),
};
const frozenPassed = frozen.formalV263Sha256 === "5f59d18a66d4415747e1068213b5e1acf719b3ce4e10cb20bc58713f40b2ac5b"
  && frozen.legacyV288Sha256 === "5c27e5d669e81889097c5b14cc2955e8b94447973711bb18d5590dfd4a1da207"
  && frozen.v291NegativeSha256 === "28a7153f0b6a853bb8f07502e82065482eeabd6f1b3906ad7809e0df32072a9a"
  && frozen.v292NegativeSha256 === "4a3cee0598c8a18157a53b31aa5ec014fefba966d1af7d0ec05d1744a87050a5"
  && frozen.v293BlockedSha256 === "969ff3e9b004d68e053b1f5e7b06cc1080945eda7cf89ce5a1f29f896093968c";
const passed = commands.every((command) => command.passed) && frozenPassed && envelope.geometry?.geometryRedshiftQualified === true && envelope.release?.denseShardExecuted === false;
const unsigned = {
  version: "v296-low-memory-validation-evidence-v1",
  generatedAt: new Date().toISOString(),
  status: passed ? "passed-geometry-redshift-qualified-polarization-pending" : "failed-v296-low-memory-validation",
  commands,
  frozen,
  frozenPassed,
  authority: { envelopeSha256: envelope.evidenceSha256, geometryStatus: envelope.geometry?.status, diagnosticStatus: envelope.diagnostic?.status, polarizationStatus: envelope.geometry?.polarizationStatus },
  science: { defaultKernel: "legacy-eih-1pn", codeSha256: "0debb41b96f001f92f498ef6a36ceff77ede7f0dd2bdbe3c6e9db3dfbf6090a8", screenSha256: "08f42a50bc787df62dc018ee56b5f7b58065dcafe2e2a3703e3e67f3e6d94037", workerPhysicsMutation: "not-applied", legacyKerrMutation: "not-applied" },
  skipped: ["v297-polarization-gate", "dense-campaign", "builds", "browser-matrix", "visual-matrix", "soak", "rtx-webgpu"],
};
const evidence = { ...unsigned, evidenceSha256: sha(unsigned) };
mkdirSync(resolve(root, "dist/science"), { recursive: true });
writeFileSync(resolve(root, "dist/science/v296-low-memory-validation.json"), `${JSON.stringify(evidence, null, 2)}\n`);
console.log(JSON.stringify({ status: evidence.status, commands, frozenPassed, geometryStatus: envelope.geometry.status }, null, 2));
if (!passed) process.exitCode = 1;
