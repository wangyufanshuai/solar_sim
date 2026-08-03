import { describe, expect, it } from "vitest";
import { ATLAS_PROXY_AUTHORITY_BOUNDARY_V562, ATLAS_PROXY_SEMANTIC_CASES_V562, classifyAtlasProxyPathV562 } from "./atlasProxyContractV562";

describe("v562 proxy semantic contract", () => {
  it.each(ATLAS_PROXY_SEMANTIC_CASES_V562)("preserves $id", (testCase) => {
    expect(classifyAtlasProxyPathV562(
      testCase.method,
      testCase.pathname,
      "deliveryProfile" in testCase ? testCase.deliveryProfile : undefined,
    )).toBe(testCase.decision);
  });
  it("keeps proxy as the only Next runtime entry", () => {
    expect(ATLAS_PROXY_AUTHORITY_BOUNDARY_V562.canonicalRuntimeEntry).toBe("proxy.ts");
    expect(ATLAS_PROXY_AUTHORITY_BOUNDARY_V562.middlewareShimAllowed).toBe(false);
    expect(ATLAS_PROXY_AUTHORITY_BOUNDARY_V562.localShadowRoutesRequireLocalShadowProfile).toBe(true);
  });
});
