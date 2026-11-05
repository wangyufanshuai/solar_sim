import { describe, expect, it } from "vitest";
import { loadKerrReplayCompatibilityV542, resetKerrReplayCompatibilityServerCacheForTestsV542 } from "./kerrReplayCompatibilityServerV542";

describe("v542 compatibility server", () => { it("loads bounded SHA-locked exports through one cache entry", async () => { resetKerrReplayCompatibilityServerCacheForTestsV542(); const first = await loadKerrReplayCompatibilityV542(), second = await loadKerrReplayCompatibilityV542(); expect(first).toBe(second); expect(first.exports.preflight.fileSha256).toBe(first.artifact.exports.preflight.fileSha256); expect(first.exports.matrix.fileSha256).toBe(first.artifact.exports.matrix.fileSha256); expect(new TextDecoder().decode(first.exports.validator.bytes)).toContain("importlib.metadata"); }); });
