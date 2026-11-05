import { afterEach, describe, expect, it } from "vitest";
import {
  loadMeasuredVisiblePhotonErrorBudgetV385,
  resetMeasuredVisiblePhotonErrorBudgetServerV385CacheForTests,
} from "./measuredVisiblePhotonErrorBudgetServerV385";

afterEach(() => resetMeasuredVisiblePhotonErrorBudgetServerV385CacheForTests());

describe("v385 visible photon error budget server", () => {
  it("loads a bounded partial budget without zero-filled systematics", async () => {
    const first = await loadMeasuredVisiblePhotonErrorBudgetV385();
    const second = await loadMeasuredVisiblePhotonErrorBudgetV385();
    expect(second).toBe(first);
    expect(first.rows).toHaveLength(4);
    expect(first.combination.unknownSystematicsTreatedAsZero).toBe(false);
    expect(first.qualification.absoluteScientificBudgetQualified).toBe(false);
  });
});
