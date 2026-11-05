import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync("app/components/KerrResponseAwareSparseImageV536.tsx", "utf8");
describe("v536 V8.5 HUD", () => {
  it("states the sparse boundary in valid UTF-8", () => {
    expect(source).toContain("四个可定位样本，不是一张伪造图像");
    expect(source).toContain("0 raster pixels");
    expect(source).not.toContain("Math.random");
    expect(source).not.toContain("<canvas");
  });
});
