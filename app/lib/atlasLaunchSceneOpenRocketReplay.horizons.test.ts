import { readProjectSourceBundle } from "../test-utils/sourceBundles";
import { describe, expect, it } from "vitest";
describe("v118 launch release wiring", () => {
  it("wires root, import CLI, assets, evidence, docs and browser QA", () => {
    const all = ["app/UniverseRuntimeController.tsx", "scripts/import-openrocket.mjs", "scripts/optimize-spacecraft-assets.py", "app/lib/evidenceLedger.ts", "README.md", "docs/TECHNICAL_OVERVIEW.md", "tests/atlas-browser/atlas-browser-acceptance.spec.ts", "package.json"].map((file) => readProjectSourceBundle(file)).join("\n");
    for (const marker of ["v118-launch-scene-openrocket-replay-lock", "import:openrocket", "optimize:spacecraft-assets", "OpenRocketReplayManifest", "offline-import-no-browser-exe-launch"]) expect(all).toContain(marker);
  });
});
