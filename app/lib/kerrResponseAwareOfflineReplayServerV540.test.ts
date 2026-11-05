import { describe, expect, it } from "vitest";
import { loadKerrResponseAwareOfflineReplayV540, resetKerrResponseAwareOfflineReplayServerCacheForTestsV540 } from "./kerrResponseAwareOfflineReplayServerV540";

describe("v540 offline-replay server", () => { it("loads exact artifact and receipt through a bounded fingerprint cache", async () => { resetKerrResponseAwareOfflineReplayServerCacheForTestsV540(); const first = await loadKerrResponseAwareOfflineReplayV540(); const second = await loadKerrResponseAwareOfflineReplayV540(); expect(first).toBe(second); expect(first.exports.receipt.fileSha256).toBe(first.artifact.receiptExport.fileSha256); expect(JSON.parse(new TextDecoder().decode(first.exports.receipt.bytes))).toEqual(first.artifact.receipt); }); });
