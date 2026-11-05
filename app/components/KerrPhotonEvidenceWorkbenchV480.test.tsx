import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

describe("v480 photon evidence workbench surface", () => {
  it("shows explicit buffer identities, product admission and presentation boundary", () => {
    const source = readFileSync("app/components/KerrPhotonEvidenceWorkbenchV480.tsx", "utf8");
    expect(source).toContain("稀疏真值与生产边界，同屏但不混同");
    expect(source).toContain("normalized-frequency buffer 保留独立身份");
    expect(source).toContain("2 allowed");
    expect(source).toContain("7 blocked");
    expect(source).toContain('data-atlas-v480-frequency-buffer-shared');
    expect(source).toContain('data-atlas-v480-science-writeback="false"');
    expect(source).not.toContain("Math.random");
    expect(source).not.toContain("<canvas");
    expect(source).not.toContain("�");
  });

  it("keeps the page and API local-shadow-only, bounded and no-store", () => {
    const page = readFileSync("app/local-shadow-v480/page.tsx", "utf8");
    const route = readFileSync(
      "app/api/atlas/relativity-evidence/v480/photon-evidence-workbench/route.ts",
      "utf8",
    );
    expect(page).toContain(
      'process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE === "local-shadow"',
    );
    expect(route).toContain('delivery !== "local-shadow"');
    expect(route).toContain('download !== "workbench"');
    expect(route).toContain("128 * 1024");
    expect(route).toContain('"Cache-Control": "no-store"');
    expect(route).toContain("X-Atlas-Kerr-Photon-Evidence-Workbench");
  });
});
