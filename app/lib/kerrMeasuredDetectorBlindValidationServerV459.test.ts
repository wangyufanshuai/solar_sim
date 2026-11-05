import { afterEach, describe, expect, it } from "vitest";
import {
  loadKerrMeasuredDetectorBlindValidationV459,
  resetKerrMeasuredDetectorBlindValidationServerCacheForTestsV459,
} from "./kerrMeasuredDetectorBlindValidationServerV459";

afterEach(() => resetKerrMeasuredDetectorBlindValidationServerCacheForTestsV459());

describe("v459 blind validation server", () => {
  it("single-flights a bounded validation artifact", async () => {
    const first = loadKerrMeasuredDetectorBlindValidationV459();
    const second = loadKerrMeasuredDetectorBlindValidationV459();
    const [left, right] = await Promise.all([first, second]);
    expect(left.artifact.artifactSha256).toBe(right.artifact.artifactSha256);
    expect(left.summary.inspect.holdoutRows).toBe(0);
    expect(left.exports.validation.bytes.byteLength).toBeLessThanOrEqual(128 * 1024);
  });
});
