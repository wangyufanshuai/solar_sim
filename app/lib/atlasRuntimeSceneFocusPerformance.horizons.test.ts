import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { createAtlasRuntimeSceneFocusSummary } from "./atlasRuntimeSceneFocusPerformance";
import {
  runAtlasRuntimeSceneFocusAudit,
  v115RuntimeSceneFocusCommandContract,
} from "./atlasRuntimeSceneFocusPerformanceRunner";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("v115 runtime scene focus performance heavy audit", () => {
  it("locks scene isolation, telemetry cadence, focus latency and protected boundaries", () => {
    const result = runAtlasRuntimeSceneFocusAudit({
      universePageText: read("app/UniverseRuntimeController.tsx"),
      universeSceneText: read("app/components/UniverseScene.tsx"),
      universeCanvasText: read("app/components/UniverseCanvas.tsx"),
      universeSandboxHudText: read("app/components/UniverseSandboxHud.tsx"),
      cameraFocusCommandText: read("app/lib/cameraFocusCommand.ts"),
      evidenceText: read("app/lib/evidenceLedger.ts"),
      validationText: read("app/lib/atlasValidationConsole.ts"),
      docsText: `${read("README.md")}\n${read("docs/TECHNICAL_OVERVIEW.md")}`,
      browserSpecText: read("tests/atlas-browser/atlas-browser-acceptance.spec.ts"),
      packageText: read("package.json"),
    });
    const summary = createAtlasRuntimeSceneFocusSummary(result);
    expect(v115RuntimeSceneFocusCommandContract().focusedCommand).toBe(
      "npm run test:atlas:runtime-scene-focus-performance",
    );
    expect(
      summary.status,
      JSON.stringify(summary.audits.filter((audit) => audit.status !== "ready")),
    ).toBe("ready-runtime-scene-focus-locked");
  });
});
