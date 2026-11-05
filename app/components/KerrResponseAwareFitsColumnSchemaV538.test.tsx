import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync("app/components/KerrResponseAwareFitsColumnSchemaV538.tsx", "utf8");
describe("v538 V8.7 HUD", () => { it("makes semantic absence explicit without rendering pixels", () => { expect(source).toContain("每一列都有单位、适用性与缺失语义"); expect(source).toContain("零不确定度或零亮度像素"); expect(source).toContain("17 / 17"); expect(source).not.toContain("Math.random"); expect(source).not.toContain("<canvas"); }); });
