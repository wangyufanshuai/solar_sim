import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { resolveKerrPhotonMetrologyObservatoryIntentV534 } from "../lib/kerrPhotonMetrologyObservatoryIntentV534";

const source = readFileSync("app/components/KerrPhotonMetrologyObservatoryIntentV534.tsx", "utf8");
const workbench = readFileSync("app/components/RelativityResearchWorkbenchV280.tsx", "utf8");

describe("v534 observatory intent", () => {
  it("binds the 36-entry catalog behind the current workbench intent", () => {
    expect(source).toContain("KERR_PHOTON_METROLOGY_DETAILS_V534[detail]");
    expect(source).toContain('data-atlas-v534-bandpass-request-before-detail="false"');
    expect(source).not.toContain("fetch(");
    expect(workbench).toContain('from "./KerrPhotonMetrologyObservatoryIntentV535"');
    expect(workbench).not.toContain('from "./KerrPhotonMetrologyObservatoryIntentV534"');
  });

  it("keeps standalone and Lite closed with one-detail concurrency", () => {
    expect(resolveKerrPhotonMetrologyObservatoryIntentV534("local-shadow", true)).toMatchObject({
      observatoryImportAuthorized: true,
      detailComponentCatalogSize: 36,
      concurrentDetailSurfaceBudget: 1,
    });
    expect(resolveKerrPhotonMetrologyObservatoryIntentV534("standalone-full", true).observatoryImportAuthorized).toBe(false);
    expect(resolveKerrPhotonMetrologyObservatoryIntentV534("vercel-lite", true).reason).toBe("lite-boundary");
    expect(source).toContain('data-atlas-v534-canvas-created="false"');
    expect(source).toContain('data-atlas-v534-physics-mutation="false"');
  });
});
