import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

describe("v473 uncertainty ledger UI", () => {
  it("keeps combination policy and open production ledger visible", () => {
    const source = readFileSync(
      "app/components/KerrObservableUncertaintyLedgerV473.tsx",
      "utf8",
    );

    expect(source).toContain("误差不是一个数字，而是一组不能随意相加的收据");
    expect(source).toContain("未证明独立性时线性相加");
    expect(source).toContain("RSS");
    expect(source).toContain("production ledger 继续保持 open");
    expect(source).toContain('data-atlas-v473-scientific-field-mutation="false"');
    expect(source).not.toContain("Math.random");
    expect(source).not.toContain("<canvas");
    expect(source).not.toMatch(/\uFFFD|锟斤拷|鈥|銆|姝ｅ湪|涓嶅彲|缁熶竴/);
  });

  it("keeps API and page local-shadow-only, bounded and no-store", () => {
    const page = readFileSync("app/local-shadow-v473/page.tsx", "utf8");
    const route = readFileSync(
      "app/api/atlas/relativity-evidence/v473/observable-uncertainty/route.ts",
      "utf8",
    );

    expect(page).toContain('process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE === "local-shadow"');
    expect(page).toContain("独立公式、容差收敛、坐标回放与 Python oracle 的逐项误差收据");
    expect(route).toContain('delivery !== "local-shadow"');
    expect(route).toContain('download !== "uncertainty-ledger"');
    expect(route).toContain("128 * 1024");
    expect(route).toContain('"Cache-Control": "no-store"');
    expect(route).toContain("X-Atlas-Kerr-Uncertainty");
  });
});
