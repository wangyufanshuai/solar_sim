import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { resolveKerrPhotonMetrologyObservatoryIntentV533 } from "../lib/kerrPhotonMetrologyObservatoryIntentV533";

const source = readFileSync("app/components/KerrPhotonMetrologyObservatoryIntentV533.tsx", "utf8");
const workbench = readFileSync("app/components/RelativityResearchWorkbenchV280.tsx", "utf8");

describe("v533 historical observatory intent", () => {
  it("preserves the 35-entry shared catalog behind the v534 workbench", () => {
    expect(source).toContain("KERR_PHOTON_METROLOGY_DETAILS_V533[detail]");
    expect(source).toContain('data-atlas-v533-axis-request-before-detail="false"');
    expect(source).not.toContain("fetch(");
    expect(workbench).toContain('from "./KerrPhotonMetrologyObservatoryIntentV534"');
    expect(workbench).not.toContain('from "./KerrPhotonMetrologyObservatoryIntentV533"');
  });

  it("keeps standalone and Lite closed while preserving one-detail concurrency", () => {
    expect(resolveKerrPhotonMetrologyObservatoryIntentV533("local-shadow", true)).toMatchObject({
      observatoryImportAuthorized: true,
      detailComponentCatalogSize: 35,
      concurrentDetailSurfaceBudget: 1,
    });
    expect(resolveKerrPhotonMetrologyObservatoryIntentV533("standalone-full", true).observatoryImportAuthorized).toBe(false);
    expect(resolveKerrPhotonMetrologyObservatoryIntentV533("vercel-lite", true).reason).toBe("lite-boundary");
    expect(source).toContain('data-atlas-v533-canvas-created="false"');
    expect(source).toContain('data-atlas-v533-physics-mutation="false"');
  });
});
