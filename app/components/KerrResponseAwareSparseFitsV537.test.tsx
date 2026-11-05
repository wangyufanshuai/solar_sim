import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync("app/components/KerrResponseAwareSparseFitsV537.tsx", "utf8");
describe("v537 V8.6 provenance HUD", () => {
  it("states the binary-table and image boundary without a renderer", () => {
    expect(source).toContain("四行标准 FITS 表，不是科学图像");
    expect(source).toContain("image HDU");
    expect(source).toContain("0/49");
    expect(source).not.toContain("Math.random");
    expect(source).not.toContain("<canvas");
  });
});
