import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

describe("v482 covariance viewer surface", () => {
  it("shows rank-one correlation without claiming independent statistics", () => {
    const source = readFileSync(
      "app/components/KerrSpectralLandmarkCovarianceViewerV482.tsx",
      "utf8",
    );
    expect(source).toContain("一个共同尺度，五个相关误差");
    expect(source).toContain("rank-1 外积上界");
    expect(source).toContain("不是五个独立噪声的 1σ covariance");
    expect(source).toContain('data-atlas-v482-rank-one');
    expect(source).toContain('data-atlas-v482-science-writeback="false"');
    expect(source).toContain("covariance matrix");
    expect(source).not.toContain("Math.random");
    expect(source).not.toContain("<canvas");
    expect(source).not.toContain("�");
  });

  it("keeps the page and API local-shadow-only and bounded", () => {
    const page = readFileSync("app/local-shadow-v482/page.tsx", "utf8");
    const route = readFileSync(
      "app/api/atlas/relativity-evidence/v482/spectral-landmark-covariance/route.ts",
      "utf8",
    );
    expect(page).toContain(
      'process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE === "local-shadow"',
    );
    expect(route).toContain('delivery !== "local-shadow"');
    expect(route).toContain('download !== "covariance"');
    expect(route).toContain("128 * 1024");
    expect(route).toContain('"Cache-Control": "no-store"');
    expect(route).toContain("X-Atlas-Kerr-Spectral-Landmark-Covariance");
  });
});
