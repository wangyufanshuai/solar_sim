import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { sha256BytesHexV566, sha256Utf8HexV566 } from "./sha256BrowserV566";

describe("v566 browser-safe SHA-256", () => {
  it.each(["", "abc", "Orbit Atlas / Kerr / 偏振", "x".repeat(1025)])("matches Node SHA-256 for UTF-8 input", (value) => {
    expect(sha256Utf8HexV566(value)).toBe(createHash("sha256").update(value).digest("hex"));
  });

  it("hashes arbitrary bytes without a Node runtime dependency", () => {
    const bytes = Uint8Array.from([0, 1, 2, 127, 128, 254, 255]);
    expect(sha256BytesHexV566(bytes)).toBe(createHash("sha256").update(bytes).digest("hex"));
  });
});
