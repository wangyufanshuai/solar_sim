import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync("app/components/KerrResponseAwarePortableCrateV539.tsx", "utf8");
describe("v539 V8.8 HUD", () => { it("presents a portable evidence chain without a renderer", () => { expect(source).toContain("带走的不只是文件，而是一条可离线重放的证据链"); expect(source).toContain("不是 production package 或科学图像"); expect(source).toContain("manifest 8/8"); expect(source).not.toContain("Math.random"); expect(source).not.toContain("<canvas"); }); });
