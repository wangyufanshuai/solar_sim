import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync("app/components/KerrResponseAwareOfflineReplayV540.tsx", "utf8");
describe("v540 V8.9 HUD", () => { it("presents clean-room replay without a renderer", () => { expect(source).toContain("离开工作区，证据链仍然闭合"); expect(source).toContain("临时路径不写入 receipt"); expect(source).toContain("network 0 · temporary leaks 0"); expect(source).not.toContain("Math.random"); expect(source).not.toContain("<canvas"); }); });
