import { describe, expect, it } from "vitest";
import {
  isAtlasDebugLogRequestAllowed,
  normalizeAtlasDebugLogLine,
} from "./atlasDebugLogSecurity";

describe("Atlas debug log production boundary", () => {
  it("fails closed outside explicitly enabled loopback development", () => {
    expect(isAtlasDebugLogRequestAllowed({ nodeEnv: "production", enabled: "1", requestUrl: "http://127.0.0.1/api/debug-log" })).toBe(false);
    expect(isAtlasDebugLogRequestAllowed({ nodeEnv: "development", enabled: "0", requestUrl: "http://127.0.0.1/api/debug-log" })).toBe(false);
    expect(isAtlasDebugLogRequestAllowed({ nodeEnv: "development", enabled: "1", requestUrl: "https://solar.wangyufan.xyz/api/debug-log" })).toBe(false);
    expect(isAtlasDebugLogRequestAllowed({ nodeEnv: "development", enabled: "1", requestUrl: "http://localhost:3001/api/debug-log" })).toBe(true);
  });

  it("prevents newline injection in the local debug file", () => {
    expect(normalizeAtlasDebugLogLine("first\r\nsecond\u2028third")).toBe("first second third");
  });
});
