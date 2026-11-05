import { afterEach, describe, expect, it } from "vitest";
import {
  loadMeasuredVisibleSourceForensicV382R1,
  resetMeasuredVisibleSourceForensicServerV382R1CacheForTests,
} from "./measuredVisibleSourceForensicServerV382R1";

afterEach(() => resetMeasuredVisibleSourceForensicServerV382R1CacheForTests());

describe("v382r1 visible source forensic server", () => {
  it("loads a bounded content-addressed 1/7 recovery artifact", async () => {
    const first = await loadMeasuredVisibleSourceForensicV382R1();
    const second = await loadMeasuredVisibleSourceForensicV382R1();
    expect(second).toBe(first);
    expect(first.progress.qualifiedSourceCount).toBe(1);
    expect(first.progress.sourceDossierAvailable).toBe(false);
  });
});
