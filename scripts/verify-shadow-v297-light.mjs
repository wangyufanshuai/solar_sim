import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const python = process.platform === "win32" ? resolve(root, ".venv-science/Scripts/python.exe") : resolve(root, ".venv-science/bin/python");
const node = process.execPath;
const sha = (file) => createHash("sha256").update(readFileSync(resolve(root, file))).digest("hex");
const run = (id, command, args) => {
  const result = spawnSync(command, args, { cwd: root, stdio: "inherit", shell: false });
  return { id, exitCode: result.status ?? -1, passed: result.status === 0 };
};

const commands = [
  run("v297-python-tests", python, ["scripts/test-kerr-polarization-v297.py"]),
  run("v297-envelope", node, ["scripts/build-kerr-authority-envelope-v297.mjs"]),
  run("v297-shadow-pointer", node, ["scripts/build-shadow-candidate-v297.mjs"]),
  run("v298-status", python, ["scripts/kerr-dense-campaign-v298.py", "--status"]),
  run("v297-eslint", node, [resolve(root, "node_modules/eslint/bin/eslint.js"), "--max-warnings=0", "scripts/build-kerr-authority-envelope-v297.mjs", "scripts/build-shadow-candidate-v297.mjs", "scripts/verify-shadow-v297-light.mjs"]),
];

const envelope = JSON.parse(readFileSync(resolve(root, "dist/science/kerr-reference-v297/portable-envelope.json"), "utf8"));
const pointer = JSON.parse(readFileSync(resolve(root, "dist/release/orbit-atlas-current-local-shadow-candidate-v297.json"), "utf8"));
const formalProductSha = sha("dist/release/orbit-atlas-current-product-evidence-v263.json");
const frozenPassed = formalProductSha === "5f59d18a66d4415747e1068213b5e1acf719b3ce4e10cb20bc58713f40b2ac5b"
  && envelope.science?.defaultKernel === "legacy-eih-1pn"
  && envelope.science?.codeSha256 === "0debb41b96f001f92f498ef6a36ceff77ede7f0dd2bdbe3c6e9db3dfbf6090a8"
  && envelope.science?.screenSha256 === "08f42a50bc787df62dc018ee56b5f7b58065dcafe2e2a3703e3e67f3e6d94037";
const passed = commands.every((command) => command.passed)
  && frozenPassed
  && envelope.status === "full-kerr-short-authority-qualified"
  && pointer.formalProductPointer === "v263"
  && pointer.formalProductPointerAdvanced === false
  && pointer.localShadowDefaultApplied === false;
const unsigned = {
  version: "v297-low-memory-validation-evidence-v1",
  generatedAt: new Date().toISOString(),
  status: passed ? "passed-full-kerr-short-authority-qualified-campaign-pending" : "failed-v297-low-memory-validation",
  commands,
  frozenPassed,
  authority: { envelopeSha256: envelope.evidenceSha256, pointerSha256: pointer.pointerSha256 },
  skipped: ["v298-run-next", "dense-campaign", "builds", "browser-matrix", "visual-matrix", "soak", "rtx-webgpu"],
  formalProductPointer: "v263",
};
const canonicalize = (value) => Array.isArray(value) ? value.map(canonicalize) : value && typeof value === "object" ? Object.fromEntries(Object.entries(value).filter(([key]) => key !== "generatedAt").sort(([a], [b]) => a.localeCompare(b)).map(([key, entry]) => [key, canonicalize(entry)])) : value;
const evidence = { ...unsigned, evidenceSha256: createHash("sha256").update(JSON.stringify(canonicalize(unsigned))).digest("hex") };
writeFileSync(resolve(root, "dist/science/v297-low-memory-validation.json"), `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ status: evidence.status, commands, frozenPassed }, null, 2));
process.exitCode = passed ? 0 : 1;
