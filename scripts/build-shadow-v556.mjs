import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
const root = process.cwd(), sciencePython = resolve(root, ".venv-science/Scripts/python.exe"), python = existsSync(sciencePython) ? sciencePython : "python";
const tests = ["app/lib/kerrSparseScienceImageProductsV556.test.ts", "app/lib/kerrSparseScienceImageProductsServerV556.test.ts", "app/lib/kerrPhotonMetrologyObservatoryIntentV556.test.ts", "app/components/kerrPhotonMetrologyDetailCatalogV556.test.ts", "app/components/KerrSparseScienceImageProductsV556.test.tsx", "app/api/atlas/relativity-evidence/v556/sparse-science-products/route.test.ts"];
const commands = [[python, ["scripts/build-kerr-sparse-science-image-products-v556.py"], "products"], [process.execPath, [resolve(root, "node_modules/vitest/vitest.mjs"), "run", ...tests], "tests"], [process.execPath, [resolve(root, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-sparse-science-image-products-runtime-v556.ts"], "runtime"]];
for (const [command, args, label] of commands) { const result = spawnSync(command, args, { cwd: root, stdio: "inherit" }); if (result.status !== 0) throw new Error(`v556-${label}-exit-${result.status}`); }
await import("./build-shadow-candidate-v556.mjs");
