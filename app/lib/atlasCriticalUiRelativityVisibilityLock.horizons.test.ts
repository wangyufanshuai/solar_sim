import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { createAtlasCriticalUiRelativityVisibilitySummary } from "./atlasCriticalUiRelativityVisibilityLock";
import {
  runAtlasCriticalUiRelativityVisibilityAudit,
  v110CriticalUiRelativityVisibilityCommandContract,
} from "./atlasCriticalUiRelativityVisibilityLockRunner";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("v110 critical UI and relativity visibility heavy audit", () => {
  it("locks visible Chinese copy and Relativity Core entry/readout surfaces", async () => {
    const result = await runAtlasCriticalUiRelativityVisibilityAudit({
      bottomBarText: read("app/components/BottomControlBar.tsx"),
      launchControlText: read("app/components/LaunchControlPanel.tsx"),
      relativityPanelText: read("app/components/RelativityObservableAtlasPanel.tsx"),
      navigatorText: read("app/lib/atlasNavigator.ts"),
      universePageText: read("app/UniverseRuntimeController.tsx"),
      evidenceText: read("app/lib/evidenceLedger.ts"),
      validationText: read("app/lib/atlasValidationConsole.ts"),
      docsText: `${read("README.md")}\n${read("docs/TECHNICAL_OVERVIEW.md")}`,
      browserSpecText: read("tests/atlas-browser/atlas-browser-acceptance.spec.ts"),
      lockText: read("app/lib/atlasCriticalUiRelativityVisibilityLock.ts"),
    });
    const summary = createAtlasCriticalUiRelativityVisibilitySummary(result);

    expect(v110CriticalUiRelativityVisibilityCommandContract()).toEqual({
      focusedCommand: "npm run test:atlas:critical-ui-relativity-visibility",
      verifyCommand: "npm run verify:atlas:critical-ui-relativity-visibility",
      screenshotArtifactDirectory:
        "test-results/v110-critical-ui-relativity-visibility-lock/",
    });
    expect(
      summary.status,
      JSON.stringify(summary.audits.filter((audit) => audit.status !== "ready")),
    ).toBe("ready-critical-ui-relativity-visibility-locked");
    expect(summary.classification).toBe("critical-ui-relativity-visibility-pass");
  }, 120_000);
});
