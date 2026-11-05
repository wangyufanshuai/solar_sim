import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

describe("v450 local-shadow expected image surface", () => {
  it("labels the fixture and authority firewall without a Canvas raster", () => {
    const source = readFileSync(
      "app/components/KerrDetectorExpectedImageFormationV450.tsx",
      "utf8",
    );
    expect(source).toContain('data-atlas-v450-fixture-authority="true"');
    expect(source).toContain(
      'data-atlas-v450-detector-projection-authority="false"',
    );
    expect(source).toContain('data-atlas-v450-science-raster-authority="false"');
    expect(source).toContain('data-atlas-v450-full-raster-materialized="false"');
    expect(source).toContain("坐标标记，不是亮度图像");
    expect(source).not.toContain("<canvas");
  });

  it("keeps the page and API local-shadow only", () => {
    const page = readFileSync("app/local-shadow-v450/page.tsx", "utf8");
    const route = readFileSync(
      "app/api/atlas/relativity-evidence/v450/expected-image-formation/route.ts",
      "utf8",
    );
    expect(page).toContain(
      'process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE === "local-shadow"',
    );
    expect(route).toContain('delivery !== "local-shadow"');
    expect(route).toContain('delivery === "vercel-lite" ? "lite-boundary"');
    expect(route).toContain("128 * 1024");
  });
});
