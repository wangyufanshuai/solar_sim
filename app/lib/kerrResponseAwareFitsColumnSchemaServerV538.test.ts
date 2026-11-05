import { describe, expect, it } from "vitest";
import { loadKerrResponseAwareFitsColumnSchemaV538, resetKerrResponseAwareFitsColumnSchemaServerCacheForTestsV538 } from "./kerrResponseAwareFitsColumnSchemaServerV538";

describe("v538 column-schema server", () => { it("loads exact JSON/CSV through a bounded fingerprint cache", async () => { resetKerrResponseAwareFitsColumnSchemaServerCacheForTestsV538(); const first = await loadKerrResponseAwareFitsColumnSchemaV538(); const second = await loadKerrResponseAwareFitsColumnSchemaV538(); expect(first).toBe(second); expect(first.exports.csv.fileSha256).toBe(first.artifact.export.csvFileSha256); expect(new TextDecoder().decode(first.exports.csv.bytes).trimEnd().split("\n")).toHaveLength(18); }); });
