import { afterEach, describe, expect, it } from "vitest";
import { loadKerrMeasuredResponseAdmissionV438, resetKerrMeasuredResponseAdmissionServerCacheForTestsV438 } from "./kerrMeasuredResponseAdmissionServerV438";
afterEach(() => resetKerrMeasuredResponseAdmissionServerCacheForTestsV438());
describe("v438 bounded server", () => { it("loads six missing gates without exposing full admission material", async () => { const loaded = await loadKerrMeasuredResponseAdmissionV438(); expect(loaded.summary.requiredGates).toHaveLength(6); expect(Object.keys(loaded.exports).sort()).toEqual(["contract", "oracle"]); }); });
