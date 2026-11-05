import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

describe("v469 unified Kerr workbench runtime boundary", () => {
  it("keeps the evidence rail UTF-8, summary-only and canvas-free", () => {
    const source = readFileSync("app/components/KerrUnifiedWorkbenchV469.tsx", "utf8");

    expect(source).toContain("六道证据，一条可追溯的轨道");
    expect(source).toContain("ray/pixel 数组留在白名单 artifact");
    expect(source).toContain("不进入 React 状态");
    expect(source).not.toContain("Math.random");
    expect(source).not.toContain("<canvas");
    expect(source).not.toMatch(/\uFFFD|锟斤拷|鈥|銆|姝ｅ湪|涓嶅彲|缁熶竴/);
  });

  it("keeps the page and API local-shadow-only with bounded no-store delivery", () => {
    const page = readFileSync("app/local-shadow-v469/page.tsx", "utf8");
    const route = readFileSync(
      "app/api/atlas/relativity-evidence/v469/unified-workbench/route.ts",
      "utf8",
    );

    expect(page).toContain('process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE === "local-shadow"');
    expect(page).toContain("资格、SHA、生命周期和失败原因的统一只读工作台");
    expect(route).toContain('delivery!=="local-shadow"');
    expect(route).toContain('download!=="workbench"');
    expect(route).toContain("128*1024");
    expect(route).toContain('"Cache-Control":"no-store"');
    expect(route).toContain("X-Atlas-Unified-Workbench");
  });
});
