import { afterEach, describe, expect, it } from "vitest";
import {
  loadKerrMeasuredDetectorIntakeV458,
  resetKerrMeasuredDetectorIntakeServerCacheForTestsV458,
} from "./kerrMeasuredDetectorIntakeServerV458";

afterEach(() => resetKerrMeasuredDetectorIntakeServerCacheForTestsV458());

describe("v458 measured detector intake server", () => {
  it("single-flights three bounded JSON-only exports", async () => {
    const first = loadKerrMeasuredDetectorIntakeV458();
    const second = loadKerrMeasuredDetectorIntakeV458();
    const [left, right] = await Promise.all([first, second]);
    expect(left.artifact.artifactSha256).toBe(right.artifact.artifactSha256);
    expect(left.summary.inspect.readyFileCount).toBe(0);
    expect(Object.keys(left.exports)).toEqual(["inspect", "contract", "schema"]);
    expect(
      Object.values(left.exports).every(
        (entry) => entry.name.endsWith(".json") && entry.bytes.byteLength <= 128 * 1024,
      ),
    ).toBe(true);
  });
});
