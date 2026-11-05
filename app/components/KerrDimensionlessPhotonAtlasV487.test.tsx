import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

describe("v487 dimensionless photon atlas surface", () => {
  it("requires explicit intent and preserves the Science/Cinematic data boundary", () => {
    const source = readFileSync("app/components/KerrDimensionlessPhotonAtlasV487.tsx", "utf8");
    expect(source).toContain("Load bounded coordinate atlas");
    expect(source).toContain("onClick={() => void loadKerrDimensionlessPhotonAtlasSummaryV487()");
    expect(source).not.toContain("useEffect");
    expect(source).toContain('data-atlas-v487-science-writeback="false"');
    expect(source).toContain('data-atlas-v487-science-raster="false"');
    expect(source).toContain('data-atlas-v487-scene-revision-delta="0"');
    expect(source).toContain("The same immutable science SVG is used in both shells");
    expect(source).not.toContain("Math.random");
    expect(source).not.toContain("<canvas");
  });

  it("keeps the page and API local-shadow-only and bounded", () => {
    const page = readFileSync("app/local-shadow-v487/page.tsx", "utf8");
    const route = readFileSync(
      "app/api/atlas/relativity-evidence/v487/dimensionless-photon-atlas/route.ts",
      "utf8",
    );
    expect(page).toContain('process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE === "local-shadow"');
    expect(route).toContain('delivery !== "local-shadow"');
    expect(route).toContain("128 * 1024");
    expect(route).toContain("Content-Security-Policy");
    expect(route).toContain("X-Content-Type-Options");
    expect(route).toContain('"Cache-Control": "no-store"');
  });
});
