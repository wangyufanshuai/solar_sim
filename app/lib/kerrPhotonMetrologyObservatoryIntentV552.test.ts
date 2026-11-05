import { describe, expect, it } from "vitest";
import { resolveKerrPhotonMetrologyObservatoryIntentV552 } from "./kerrPhotonMetrologyObservatoryIntentV552";

describe("v552 photon metrology intent", () => {
  it("keeps the 54-detail packet surface local-shadow-only", () => {
    expect(resolveKerrPhotonMetrologyObservatoryIntentV552("local-shadow", true)).toMatchObject({ detailComponentCatalogSize: 54, observatoryImportAuthorized: true, networkAttemptCount: 0, canvasCreated: false, physicsMutationAllowed: false });
    expect(resolveKerrPhotonMetrologyObservatoryIntentV552("vercel-lite", true)).toMatchObject({ detailComponentCatalogSize: 54, observatoryImportAuthorized: false, reason: "lite-boundary" });
  });
});
