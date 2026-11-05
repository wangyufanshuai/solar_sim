import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const environmentRoot = path.resolve(root, ".venv-science");
const wheelRoot = path.resolve(root, "tools/science-cache/wheels");
const manifestPath = path.resolve(root, "dist/science/science-environment-v147.json");
const requirementsPath = path.resolve(root, "requirements-science.txt");
const bootstrapPython = process.env.ATLAS_BOOTSTRAP_PYTHON || "python";
const venvPython = path.join(environmentRoot, "Scripts", "python.exe");

function run(executable, args) {
  const result = spawnSync(executable, args, {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, PIP_DISABLE_PIP_VERSION_CHECK: "1" },
  });
  if (result.status !== 0) {
    throw new Error(`${executable} ${args.join(" ")} failed\n${result.stdout}\n${result.stderr}`);
  }
  return result.stdout.trim();
}

async function sha256(file) {
  const hash = createHash("sha256");
  hash.update(await readFile(file));
  return hash.digest("hex");
}

await mkdir(wheelRoot, { recursive: true });
await mkdir(path.dirname(manifestPath), { recursive: true });

try {
  await stat(venvPython);
} catch {
  run(bootstrapPython, ["-m", "venv", environmentRoot]);
}

// Download once, hash the exact wheel artifacts, then install without touching
// the machine-wide Python environment.
run(venvPython, ["-m", "pip", "download", "--only-binary=:all:", "--dest", wheelRoot, "-r", requirementsPath]);
run(venvPython, ["-m", "pip", "install", "--no-index", "--find-links", wheelRoot, "-r", requirementsPath]);

const wheelFiles = (await readdir(wheelRoot)).filter((name) => name.endsWith(".whl")).sort();
const wheels = [];
for (const name of wheelFiles) {
  const file = path.join(wheelRoot, name);
  wheels.push({ name, bytes: (await stat(file)).size, sha256: await sha256(file) });
}
const packages = JSON.parse(run(venvPython, ["-m", "pip", "list", "--format=json"]));
const pythonRuntime = JSON.parse(run(venvPython, ["-c", "import json,platform,sys;print(json.dumps({'executable':sys.executable,'version':platform.python_version(),'platform':platform.platform()}))"]));
const manifest = {
  version: "v147-project-local-science-environment",
  generatedAt: new Date().toISOString(),
  root: environmentRoot,
  python: pythonRuntime,
  requirementsSha256: await sha256(requirementsPath),
  packages,
  wheels,
  policy: "project-local-e-drive-no-global-python-mutation-serial-heavy-processes",
};
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`${manifest.version}: ${packages.length} packages, ${wheels.length} wheels`);

