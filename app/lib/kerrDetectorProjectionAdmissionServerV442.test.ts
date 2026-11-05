import { afterEach, describe, expect, it } from "vitest";
import { loadKerrDetectorProjectionAdmissionV442, resetKerrDetectorProjectionAdmissionServerCacheForTestsV442 } from "./kerrDetectorProjectionAdmissionServerV442";
afterEach(() => resetKerrDetectorProjectionAdmissionServerCacheForTestsV442());
describe("v442 bounded admission server", () => {
  it("loads the bounded artifact and contract exports", async () => {
    const loaded = await loadKerrDetectorProjectionAdmissionV442();
    expect(loaded.summary.gates).toHaveLength(11);
    expect(Object.keys(loaded.exports).sort()).toEqual(["admission", "contract"]);
    expect(loaded.summary.qualification.admission).toBe("blocked");
  });
});
