import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("v493 edge redundancy surface", () => {
  it("requires explicit data intent and preserves Science/Cinematic data", () => {
    const source = readFileSync("app/components/KerrRedshiftEdgeRedundancyV493.tsx", "utf8");
    expect(source).toContain("Load edge redundancy audit");
    expect(source).not.toContain("useEffect");
    expect(source).toContain('data-atlas-v493-statistical-jackknife="false"');
    expect(source).toContain('data-atlas-v493-science-writeback="false"');
    expect(source).toContain('data-atlas-v493-science-raster="false"');
    expect(source).toContain('data-atlas-v493-scene-revision-delta="0"');
    expect(source).not.toContain("Math.random");
    expect(source).not.toContain("<canvas");
  });

  it("keeps page and API local-shadow-only", () => {
    const page = readFileSync("app/local-shadow-v493/page.tsx", "utf8");
    const route = readFileSync("app/api/atlas/relativity-evidence/v493/redshift-edge-redundancy/route.ts", "utf8");
    expect(page).toContain('NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE === "local-shadow"');
    expect(route).toContain('delivery !== "local-shadow"');
    expect(route).toContain("128 * 1024");
    expect(route).toContain("Content-Security-Policy");
  });
});
