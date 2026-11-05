import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

describe("v475 dual render boundary surface", () => {
  it("makes shared science identity and presentation isolation explicit", () => {
    const source = readFileSync("app/components/KerrDualRenderBoundaryV475.tsx", "utf8");

    expect(source).toContain("同一份科学缓冲区，两种不可串写的观看方式");
    expect(source).toContain("scientific fields in presentation");
    expect(source).toContain('data-atlas-v475-scientific-mutation="false"');
    expect(source).toContain('data-atlas-v475-scene-revision-delta="0"');
    expect(source).not.toContain("Math.random");
    expect(source).not.toContain("<canvas");
    expect(source).not.toContain("�");
  });

  it("keeps the API and page local-shadow-only, bounded and no-store", () => {
    const page = readFileSync("app/local-shadow-v475/page.tsx", "utf8");
    const route = readFileSync(
      "app/api/atlas/relativity-evidence/v475/dual-render-boundary/route.ts",
      "utf8",
    );

    expect(page).toContain('process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE === "local-shadow"');
    expect(page).toContain("四条真实 disk ray 只形成一份不可变科学缓冲区");
    expect(route).toContain('delivery !== "local-shadow"');
    expect(route).toContain('download !== "dual-render"');
    expect(route).toContain("128 * 1024");
    expect(route).toContain('"Cache-Control": "no-store"');
    expect(route).toContain("X-Atlas-Kerr-Dual-Render");
  });
});
