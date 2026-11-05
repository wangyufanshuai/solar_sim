import { describe, expect, it } from "vitest";
import { loadKerrLicenseConfirmationPacketV552, resetKerrLicenseConfirmationPacketServerCacheForTestsV552 } from "./kerrLicenseConfirmationPacketServerV552";

describe("v552 license confirmation packet server", () => {
  it("uses one bounded promise for the missing packet evidence", async () => {
    resetKerrLicenseConfirmationPacketServerCacheForTestsV552();
    const first = await loadKerrLicenseConfirmationPacketV552();
    const second = await loadKerrLicenseConfirmationPacketV552();
    expect(first).toBe(second);
    expect(Object.keys(first.exports)).toEqual(["atlas", "receipt"]);
    expect(first.artifact.validator).toMatchObject({ packetPresent: false, missingEntryCount: 7, networkAttemptCount: 0, measuredAuthorityGranted: false });
  });
});
