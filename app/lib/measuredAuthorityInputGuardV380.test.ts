import { describe, expect, it } from "vitest";
import { assertMeasuredAuthorityInputSizeV380 } from "./measuredAuthorityInputGuardV380";

describe("v380 measured authority input guard", () => {
  it("accepts the exact bounded edge and rejects zero, overflow and traversal", () => {
    expect(
      assertMeasuredAuthorityInputSizeV380({
        path: "dist/science/example.json",
        size: 64 * 1024,
        maximumBytes: 64 * 1024,
      }),
    ).toMatchObject({ accepted: true, size: 64 * 1024 });
    expect(() =>
      assertMeasuredAuthorityInputSizeV380({
        path: "dist/science/example.json",
        size: 64 * 1024 + 1,
        maximumBytes: 64 * 1024,
      }),
    ).toThrow("v380-input-size:dist/science/example.json");
    expect(() =>
      assertMeasuredAuthorityInputSizeV380({
        path: "dist/science/example.json",
        size: 0,
        maximumBytes: 64 * 1024,
      }),
    ).toThrow("v380-input-size:dist/science/example.json");
    expect(() =>
      assertMeasuredAuthorityInputSizeV380({
        path: "dist/../escape.json",
        size: 1,
        maximumBytes: 64 * 1024,
      }),
    ).toThrow("v380-input-size:dist/../escape.json");
  });
});
