import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync("app/components/KerrResponseAwareReplayKitV541.tsx", "utf8");
describe("v541 V9.0 HUD", () => { it("presents the exact environment boundary without a renderer", () => { expect(source).toContain("验证器、数据和环境锁现在属于同一个可下载物"); expect(source).toContain("不夸大跨环境可移植性"); expect(source).toContain("cross-env"); expect(source).not.toContain("Math.random"); expect(source).not.toContain("<canvas"); }); });
