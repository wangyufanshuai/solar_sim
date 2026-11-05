import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

describe("v485 photon metrology cockpit surface", () => {
  it("renders a six-stage evidence route with a scalar-only runtime contract", () => {
    const source = readFileSync("app/components/KerrPhotonMetrologyCockpitV485.tsx", "utf8");
    expect(source).toContain("六站证据航线，一套不越权的光子计量舱");
    expect(source).toContain("矩阵、投影和完整科学数组留在白名单 artifact");
    expect(source).toContain('data-atlas-v485-summary-matrix-elements="0"');
    expect(source).toContain('data-atlas-v485-summary-projection-records="0"');
    expect(source).toContain('data-atlas-v485-detail-autoload="false"');
    expect(source).toContain('data-atlas-v485-science-writeback="false"');
    expect(source).not.toContain("Math.random");
    expect(source).not.toContain("<canvas");
    expect(source).not.toContain("�");
  });

  it("keeps the page and API local-shadow-only and bounded", () => {
    const page = readFileSync("app/local-shadow-v485/page.tsx", "utf8");
    const route = readFileSync(
      "app/api/atlas/relativity-evidence/v485/photon-metrology-cockpit/route.ts",
      "utf8",
    );
    expect(page).toContain(
      'process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE === "local-shadow"',
    );
    expect(route).toContain('delivery !== "local-shadow"');
    expect(route).toContain('download !== "cockpit"');
    expect(route).toContain("128 * 1024");
    expect(route).toContain('"Cache-Control": "no-store"');
    expect(route).toContain("X-Atlas-Kerr-Photon-Metrology");
  });
});
