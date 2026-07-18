import { describe, expect, it } from "vitest";
import {
  atlasDesktopSecretMatches,
  atlasDesktopSessionMatches,
  atlasDesktopSessionValue,
  configuredAtlasDesktopToken,
} from "./atlasDesktopSession";

describe("desktop bootstrap session", () => {
  const token = "a".repeat(64);

  it("requires an explicit high-entropy runtime token", () => {
    expect(configuredAtlasDesktopToken(undefined)).toBeNull();
    expect(configuredAtlasDesktopToken("short")).toBeNull();
    expect(configuredAtlasDesktopToken(`  ${token}  `)).toBe(token);
  });

  it("derives a non-reversible cookie and compares secrets in constant-length form", () => {
    const cookie = atlasDesktopSessionValue(token);
    expect(cookie).toMatch(/^[a-f0-9]{64}$/);
    expect(cookie).not.toBe(token);
    expect(atlasDesktopSecretMatches(token, token)).toBe(true);
    expect(atlasDesktopSecretMatches(`${token}b`, token)).toBe(false);
    expect(atlasDesktopSessionMatches(cookie, token)).toBe(true);
    expect(atlasDesktopSessionMatches("0".repeat(64), token)).toBe(false);
  });
});

