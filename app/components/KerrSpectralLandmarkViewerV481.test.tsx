import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

describe("v481 spectral landmark viewer surface", () => {
  it("renders shared coordinate landmarks without claiming a spectrum", () => {
    const source = readFileSync("app/components/KerrSpectralLandmarkViewerV481.tsx", "utf8");
    expect(source).toContain("只传播谱特征位置，不虚构一条谱线");
    expect(source).toContain("xₒ = g·xₑ");
    expect(source).toContain("physical line identity");
    expect(source).toContain("observed spectrum");
    expect(source).toContain('data-atlas-v481-payload-shared');
    expect(source).toContain('data-atlas-v481-science-writeback="false"');
    expect(source).not.toContain("Math.random");
    expect(source).not.toContain("<canvas");
    expect(source).not.toContain("�");
  });

  it("keeps the page and API local-shadow-only, bounded and no-store", () => {
    const page = readFileSync("app/local-shadow-v481/page.tsx", "utf8");
    const route = readFileSync(
      "app/api/atlas/relativity-evidence/v481/spectral-landmarks/route.ts",
      "utf8",
    );
    expect(page).toContain(
      'process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE === "local-shadow"',
    );
    expect(route).toContain('delivery !== "local-shadow"');
    expect(route).toContain('download !== "landmarks"');
    expect(route).toContain("128 * 1024");
    expect(route).toContain('"Cache-Control": "no-store"');
    expect(route).toContain("X-Atlas-Kerr-Spectral-Landmarks");
  });
});
