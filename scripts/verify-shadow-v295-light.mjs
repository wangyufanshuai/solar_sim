import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const node = process.execPath;
const python = resolve(root, ".venv-science/Scripts/python.exe");
const output = resolve(root, "dist/science/v295-low-memory-validation.json");

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

function run(id, command, args) {
  const result = spawnSync(command, args, { cwd: root, encoding: "utf8", maxBuffer: 16 * 1024 * 1024 });
  const passed = result.status === 0;
  if (!passed) {
    process.stderr.write(result.stdout ?? "");
    process.stderr.write(result.stderr ?? "");
  }
  return { id, exitCode: result.status ?? -1, passed };
}

function verifyExistingPythonEvidence(id, relative, hashField, predicate = () => true) {
  const document = JSON.parse(readFileSync(resolve(root, relative), "utf8"));
  const predicatePassed = predicate(document);
  const source = "import hashlib,json,pathlib,sys\np=pathlib.Path(sys.argv[1]);field=sys.argv[2];d=json.loads(p.read_text(encoding='utf-8'));expected=d.pop(field,None)\ndef c(v):\n return [c(x) for x in v] if isinstance(v,list) else {k:c(v[k]) for k in sorted(v) if k not in {'generatedAt','pid','host','absolutePath'}} if isinstance(v,dict) else v\nactual=hashlib.sha256(json.dumps(c(d),sort_keys=True,separators=(',',':'),allow_nan=False).encode()).hexdigest();raise SystemExit(0 if actual==expected else 1)";
  const result = spawnSync(python, ["-c", source, resolve(root, relative), hashField], { cwd: root, encoding: "utf8" });
  const passed = result.status === 0 && predicatePassed;
  return { id, exitCode: passed ? 0 : 1, passed };
}

const reuseScience = process.argv.includes("--reuse-science");
const scienceCommands = reuseScience ? [
  verifyExistingPythonEvidence("v291-diagnostic-sha", "dist/science/kerr-reference-v291/coordinate-event-diagnostic.json", "evidenceSha256", (document) => document.executionCount === 32),
  verifyExistingPythonEvidence("v292-short-gate-sha", "dist/science/kerr-reference-v292/geometry-redshift-short-gate.json", "evidenceSha256", (document) => document.executionCount === 128 && document.criticalBracketCount === 40),
  verifyExistingPythonEvidence("v293-polarization-gate-sha", "dist/science/kerr-reference-v293/polarization-gate.json", "evidenceSha256", (document) => document.qualified === false),
] : [
  run("v291-diagnostic", python, ["scripts/run-kerr-authority-v291.py", "--diagnose"]),
  run("v292-short-gate", python, ["scripts/run-kerr-authority-v291.py", "--short-gate"]),
  run("v293-polarization-gate", python, ["scripts/run-kerr-polarization-v293.py", "--gate"]),
];
const commands = [
  run("v291-python-tests", python, ["scripts/test-kerr-authority-v291.py"]),
  run("v293-python-tests", python, ["scripts/test-kerr-polarization-v293.py"]),
  ...scienceCommands,
  run("focused", node, ["scripts/atlas.mjs", "test", "focused"]),
  run("typescript", node, ["scripts/atlas.mjs", "test", "types"]),
  run("eslint", node, [resolve(root, "node_modules/eslint/bin/eslint.js"), "app", "proxy.ts", "next.config.mjs", "scripts", "tests"]),
  run("eslint-v291-v295-zero-warning", node, [resolve(root, "node_modules/eslint/bin/eslint.js"), "--max-warnings=0",
    "app/lib/kerrAuthorityV291.ts", "app/lib/kerrAuthorityV291.test.ts",
    "app/lib/atlasBrowserObservabilityV294.ts", "app/lib/atlasBrowserObservabilityV294.test.ts",
    "app/lib/atlasShadowCapabilityPointerV295.ts", "app/lib/atlasShadowCapabilityPointerV295.test.ts",
    "app/lib/relativityWorkbenchEvidenceV285.ts", "app/lib/relativityEvidenceServerV285R1.ts",
    "app/components/RelativityResearchWorkbenchV280.tsx", "app/components/AtlasRuntimeWorkbenchSurface.tsx", "app/components/AtlasUniverseSceneRuntime.tsx",
    "scripts/build-shadow-candidate-v295.mjs", "scripts/verify-shadow-v295-light.mjs",
  ]),
];

const v291 = JSON.parse(readFileSync(resolve(root, "dist/science/kerr-reference-v291/coordinate-event-diagnostic.json"), "utf8"));
const v292 = JSON.parse(readFileSync(resolve(root, "dist/science/kerr-reference-v292/geometry-redshift-short-gate.json"), "utf8"));
const v293 = JSON.parse(readFileSync(resolve(root, "dist/science/kerr-reference-v293/polarization-gate.json"), "utf8"));
const campaign = JSON.parse(readFileSync(resolve(root, "dist/science/kerr-campaign-v288r1/campaign-state.json"), "utf8"));
const workbench = readFileSync(resolve(root, "app/components/RelativityResearchWorkbenchV280.tsx"), "utf8");
const scene = readFileSync(resolve(root, "app/components/AtlasUniverseSceneRuntime.tsx"), "utf8");
function sourceFiles(directory) {
  return readdirSync(directory).flatMap((name) => {
    const path = resolve(directory, name);
    return statSync(path).isDirectory() ? sourceFiles(path) : /\.(?:ts|tsx)$/.test(name) && !/\.test\.(?:ts|tsx)$/.test(name) ? [path] : [];
  });
}
const dreiBarrelImports = sourceFiles(resolve(root, "app"))
  .filter((path) => /from ["']@react-three\/drei["']/.test(readFileSync(path, "utf8")))
  .map((path) => path.slice(root.length + 1).replaceAll("\\", "/"));
const staticAudit = {
  directDreiImports: dreiBarrelImports.length === 0,
  dreiBarrelImports,
  deepSpaceIntentGuard: scene.includes("{deepSpaceIntent ? (") && scene.includes("AtlasSolarSkyPrimerV286"),
  layeredWorkbench: workbench.includes("data-atlas-relativity-workbench-v294") && workbench.includes("evidence.currentRows"),
  browserObservability: scene.includes("publishAtlasBrowserObservabilityV294"),
  denseShardExecuted: Number(campaign.completedShardCount ?? 0) > 0,
};
const commandPassed = commands.every((command) => command.passed);
const staticPassed = staticAudit.directDreiImports && staticAudit.deepSpaceIntentGuard && staticAudit.layeredWorkbench && staticAudit.browserObservability && !staticAudit.denseShardExecuted;
const unsigned = {
  version: "v295-low-memory-validation-evidence-v1",
  generatedAt: new Date().toISOString(),
  status: commandPassed && staticPassed ? "passed-low-memory-validation-science-blocked-v292" : "failed-low-memory-validation",
  commands,
  staticAudit,
  capabilities: {
    v291: v291.status,
    v292: v292.status,
    v293: v293.status,
    campaign: "incomplete-0-of-49",
    v294: "implemented-awaiting-browser-qualification",
  },
  science: {
    defaultKernel: "legacy-eih-1pn",
    codeSha256: "0debb41b96f001f92f498ef6a36ceff77ede7f0dd2bdbe3c6e9db3dfbf6090a8",
    screenSha256: "08f42a50bc787df62dc018ee56b5f7b58065dcafe2e2a3703e3e67f3e6d94037",
    workerPhysicsMutation: "not-applied",
    eihOnePnMutation: "not-applied",
    legacyKerrMutation: "not-applied",
  },
  skippedHeavyGates: ["resource-stability-18-samples", "full-regression", "rust", "standalone-build", "lite-build", "local-shadow-build", "browser-matrix", "visual-matrix", "ui-soak", "kerr-compute-soak", "rtx-webgpu"],
};
const evidence = { ...unsigned, evidenceSha256: sha(unsigned) };
mkdirSync(resolve(root, "dist/science"), { recursive: true });
writeFileSync(output, `${JSON.stringify(evidence, null, 2)}\n`);
console.log(JSON.stringify({ status: evidence.status, commands, capabilities: evidence.capabilities, output: "dist/science/v295-low-memory-validation.json" }, null, 2));
if (!commandPassed || !staticPassed) process.exitCode = 1;
