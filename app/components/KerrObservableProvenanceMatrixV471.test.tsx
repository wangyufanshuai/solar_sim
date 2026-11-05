import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

describe("v471 observable provenance UI", () => {
  it("keeps scientific distinctions explicit and canvas-free", () => {
    const source = readFileSync(
      "app/components/KerrObservableProvenanceMatrixV471.tsx",
      "utf8",
    );

    expect(source).toContain("一个数值，必须带着它的来源、适用性与边界出现");
    expect(source).toContain("连续坐标不是像素，方向基不是 Stokes");
    expect(source).toContain("unavailable 永远不被写成零");
    expect(source).not.toContain("Math.random");
    expect(source).not.toContain("<canvas");
    expect(source).not.toMatch(/\uFFFD|锟斤拷|鈥|銆|姝ｅ湪|涓嶅彲|缁熶竴/);
  });

  it("keeps API and page local-shadow-only, bounded and no-store", () => {
    const page = readFileSync("app/local-shadow-v471/page.tsx", "utf8");
    const route = readFileSync(
      "app/api/atlas/relativity-evidence/v471/observable-provenance/route.ts",
      "utf8",
    );

    expect(page).toContain('process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE === "local-shadow"');
    expect(page).toContain("从 geodesic event 到 FITS image 的逐观测量来源、适用性与生产边界");
    expect(route).toContain('delivery !== "local-shadow"');
    expect(route).toContain('download !== "observable-matrix"');
    expect(route).toContain("128 * 1024");
    expect(route).toContain('"Cache-Control": "no-store"');
    expect(route).toContain("X-Atlas-Kerr-Observable-Provenance");
  });
});
