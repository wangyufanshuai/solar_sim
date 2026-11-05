import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
const root = process.cwd(), sciencePython = resolve(root, ".venv-science/Scripts/python.exe"), python = existsSync(sciencePython) ? sciencePython : "python";
const tests = ["app/lib/kerrSparseCoordinateProductsV557.test.ts", "app/lib/kerrSparseCoordinateProductsServerV557.test.ts", "app/lib/kerrPhotonMetrologyObservatoryIntentV557.test.ts", "app/components/kerrPhotonMetrologyDetailCatalogV557.test.ts", "app/components/KerrSparseCoordinateProductsV557.test.tsx", "app/api/atlas/relativity-evidence/v557/sparse-coordinate-products/route.test.ts"];
for (const [command, args, label] of [[python, ["scripts/build-kerr-sparse-coordinate-products-v557.py"], "products"], [process.execPath, [resolve(root, "node_modules/vitest/vitest.mjs"), "run", ...tests], "tests"], [process.execPath, [resolve(root, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-sparse-coordinate-products-runtime-v557.ts"], "runtime"]]) { const result = spawnSync(command, args, { cwd: root, stdio: "inherit" }); if (result.status !== 0) throw new Error(`v557-${label}-exit-${result.status}`); }
await import("./build-shadow-candidate-v557.mjs");
