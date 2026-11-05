import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

describe("v474 sparse payload inspector", () => {
  it("keeps sparse authority and unavailable measurements explicit", () => {
    const source = readFileSync(
      "app/components/KerrSparseSciencePayloadInspectorV474.tsx",
      "utf8",
    );

    expect(source).toContain("四条真实光线，原子连接成一封不可变科研信封");
    expect(source).toContain("它仍不是 dense image、Stokes measurement 或 production pixel");
    expect(source).toContain("atomic join 4/4");
    expect(source).toContain('data-atlas-v474-runtime-mutation="false"');
    expect(source).not.toContain("Math.random");
    expect(source).not.toContain("<canvas");
    expect(source).not.toMatch(/\uFFFD|锟斤拷|鈥|銆|姝ｅ湪|涓嶅彲|缁熶竴/);
  });

  it("keeps API and page local-shadow-only, bounded and no-store", () => {
    const page = readFileSync("app/local-shadow-v474/page.tsx", "utf8");
    const route = readFileSync(
      "app/api/atlas/relativity-evidence/v474/sparse-science-payload/route.ts",
      "utf8",
    );

    expect(page).toContain('process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE === "local-shadow"');
    expect(page).toContain("四条 authority disk ray 的真实数值、provenance、适用性和 uncertainty 原子连接");
    expect(route).toContain('delivery !== "local-shadow"');
    expect(route).toContain('download !== "sparse-payload"');
    expect(route).toContain("128 * 1024");
    expect(route).toContain('"Cache-Control": "no-store"');
    expect(route).toContain("X-Atlas-Kerr-Sparse-Payload");
  });
});
