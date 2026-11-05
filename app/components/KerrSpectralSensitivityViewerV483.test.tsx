import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

describe("v483 sensitivity viewer surface", () => {
  it("presents one sensitive axis and four nullspace modes without measurement claims", () => {
    const source = readFileSync("app/components/KerrSpectralSensitivityViewerV483.tsx", "utf8");
    expect(source).toContain("一条敏感轴，四条沉默方向");
    expect(source).toContain("零投影只表示当前共同 g 上界模型不敏感");
    expect(source).toContain("zero under model ≠ exact measurement");
    expect(source).toContain('data-atlas-v483-nullspace-count');
    expect(source).toContain('data-atlas-v483-science-writeback="false"');
    expect(source).not.toContain("Math.random");
    expect(source).not.toContain("<canvas");
    expect(source).not.toContain("�");
  });

  it("keeps the page and API local-shadow-only and bounded", () => {
    const page = readFileSync("app/local-shadow-v483/page.tsx", "utf8");
    const route = readFileSync(
      "app/api/atlas/relativity-evidence/v483/spectral-sensitivity-modes/route.ts",
      "utf8",
    );
    expect(page).toContain(
      'process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE === "local-shadow"',
    );
    expect(route).toContain('delivery !== "local-shadow"');
    expect(route).toContain('download !== "sensitivity-modes"');
    expect(route).toContain("128 * 1024");
    expect(route).toContain('"Cache-Control": "no-store"');
    expect(route).toContain("X-Atlas-Kerr-Spectral-Sensitivity");
  });
});
