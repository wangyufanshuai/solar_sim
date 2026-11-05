import { describe, expect, it } from "vitest";
import {
  ATLAS_CRITICAL_UI_RELATIVITY_VISIBILITY_VERSION,
  createAtlasCriticalUiRelativityVisibilitySummary,
} from "./atlasCriticalUiRelativityVisibilityLock";
import type { AtlasCriticalUiRelativityVisibilityAudit } from "./simulationDiagnosticsTypes";

const audit = (
  id: AtlasCriticalUiRelativityVisibilityAudit["id"],
  status: AtlasCriticalUiRelativityVisibilityAudit["status"] = "ready",
): AtlasCriticalUiRelativityVisibilityAudit => ({
  id,
  label: id,
  status,
  measured: status,
  expected: "ready",
  trustedBoundary: "test",
});

describe("v110 critical UI and relativity visibility lock summary", () => {
  it("exposes deterministic pending metadata by default", () => {
    const summary = createAtlasCriticalUiRelativityVisibilitySummary();
    expect(summary.version).toBe(ATLAS_CRITICAL_UI_RELATIVITY_VISIBILITY_VERSION);
    expect(summary.profile).toBe("v110-visible-chinese-copy-relativity-core-entry");
    expect(summary.status).toBe("pending-runtime-run");
    expect(summary.uiCopyPolicy).toBe("visible-chinese-copy-no-mojibake");
    expect(summary.relativityCoreEntryPolicy).toBe("bottom-tools-search-observable-atlas-entry");
    expect(summary.relativityReadoutPolicy).toBe("eih-dp-rk-mercury-shapiro-kerr-boundary-visible");
    expect(summary.eihOnePnMutation).toBe("not-applied");
    expect(summary.kerrKernelMutation).toBe("not-applied");
  });

  it("classifies focused audit results", () => {
    const ready = createAtlasCriticalUiRelativityVisibilitySummary({
      audits: [
        audit("v109-interaction-visual-quality"),
        audit("visible-chinese-copy-lock"),
        audit("relativity-core-entry-lock"),
        audit("relativity-core-readout-lock"),
        audit("docs-surface-lock"),
        audit("protected-mutation-lock"),
      ],
    });
    expect(ready.status).toBe("ready-critical-ui-relativity-visibility-locked");
    expect(ready.classification).toBe("critical-ui-relativity-visibility-pass");

    const regressed = createAtlasCriticalUiRelativityVisibilitySummary({
      audits: [audit("relativity-core-entry-lock", "regressed")],
    });
    expect(regressed.classification).toBe("relativity-core-entry-regression");
  });
});
