import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
const root = process.cwd();
const commands = [
  [process.execPath, [resolve(root, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-license-confirmation-packet-v552.ts"], "packet"],
  [process.execPath, [resolve(root, "node_modules/vitest/vitest.mjs"), "run", "app/lib/kerrLicenseConfirmationPacketV552.test.ts", "app/lib/kerrLicenseConfirmationPacketServerV552.test.ts", "app/lib/kerrPhotonMetrologyObservatoryIntentV552.test.ts", "app/components/kerrPhotonMetrologyDetailCatalogV552.test.ts", "app/components/KerrLicenseConfirmationV552.test.tsx", "app/api/atlas/relativity-evidence/v552/license-confirmation-packet/route.test.ts"], "tests"],
  [process.execPath, [resolve(root, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-license-confirmation-packet-runtime-v552.ts"], "runtime"],
];
for (const [command, args, label] of commands) { const result = spawnSync(command, args, { cwd: root, stdio: "inherit" }); if (result.status !== 0) throw new Error(`v552-${label}-exit-${result.status}`); }
await import("./build-shadow-candidate-v552.mjs");
