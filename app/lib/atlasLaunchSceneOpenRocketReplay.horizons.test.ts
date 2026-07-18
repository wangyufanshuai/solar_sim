import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");
describe("v118 launch release wiring", () => {
  it("wires root, import CLI, assets, evidence, docs and browser QA", () => {
    const all = ["app/UniverseRuntimeController.tsx", "scripts/import-openrocket.mjs", "scripts/optimize-spacecraft-assets.py", "app/lib/evidenceLedger.ts", "README.md", "docs/TECHNICAL_OVERVIEW.md", "tests/atlas-browser/atlas-browser-acceptance.spec.ts", "package.json"].map(read).join("\n");
    for (const marker of ["v118-launch-scene-openrocket-replay-lock", "import:openrocket", "optimize:spacecraft-assets", "OpenRocketReplayManifest", "offline-import-no-browser-exe-launch"]) expect(all).toContain(marker);
  });
});
