import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

describe("v470 causal qualification rail", () => {
  it("keeps the root-blocker narrative visible and canvas-free", () => {
    const source = readFileSync("app/components/KerrEvidenceDependencyRailV470.tsx", "utf8");

    expect(source).toContain("不是一堵墙，而是三条可追溯的根阻塞");
    expect(source).toContain("协议通过不等于生产资格");
    expect(source).toContain("Science/Cinematic writeback isolated");
    expect(source).not.toContain("Math.random");
    expect(source).not.toContain("<canvas");
    expect(source).not.toMatch(/\uFFFD|锟斤拷|鈥|銆|姝ｅ湪|涓嶅彲|缁熶竴/);
  });

  it("keeps API and page local-shadow-only, bounded and no-store", () => {
    const page = readFileSync("app/local-shadow-v470/page.tsx", "utf8");
    const route = readFileSync(
      "app/api/atlas/relativity-evidence/v470/dependency-graph/route.ts",
      "utf8",
    );

    expect(page).toContain('process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE === "local-shadow"');
    expect(page).toContain("从 measured intake 到科学像素与 local-shadow 晋级的只读因果轨道");
    expect(route).toContain('delivery !== "local-shadow"');
    expect(route).toContain('download !== "dependency-graph"');
    expect(route).toContain("128 * 1024");
    expect(route).toContain('"Cache-Control": "no-store"');
    expect(route).toContain("X-Atlas-Kerr-Dependency");
  });
});
