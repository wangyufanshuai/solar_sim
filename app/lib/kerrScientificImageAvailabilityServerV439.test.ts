import { afterEach, describe, expect, it } from "vitest";
import { loadKerrScientificImageAvailabilityV439, resetKerrScientificImageAvailabilityServerCacheForTestsV439 } from "./kerrScientificImageAvailabilityServerV439";
afterEach(() => resetKerrScientificImageAvailabilityServerCacheForTestsV439());
describe("v439 bounded server", () => { it("loads sparse point summary and only two exports", async () => { const loaded = await loadKerrScientificImageAvailabilityV439(); expect(loaded.summary.sparseAuthorityPoints).toHaveLength(4); expect(Object.keys(loaded.exports).sort()).toEqual(["contract", "oracle"]); }); });
