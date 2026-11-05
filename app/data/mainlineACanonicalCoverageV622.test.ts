import { describe, expect, it } from "vitest";
import { buildPack, gateSummary, jsonlReceipt, manifestDiff, routeInventory, validatePack } from "../../scripts/build-mainline-a-canonical-coverage-v622";

describe("Mainline A V622 canonical coverage", () => {
  it("builds a 12/12/12 manifest", () => {
    const pack = buildPack();
    expect(pack.counts).toMatchObject({ total: 36, stars: 12, nebulae: 12, constellations: 12 });
    expect(validatePack(pack)).toEqual([]);
  });
  it("keeps routes and source hashes on every record", () => {
    const pack = buildPack();
    expect(pack.records.every((row) => row.route.route && /^[a-f0-9]{64}$/.test(row.sourceHash))).toBe(true);
    expect(pack.records.filter((row) => row.kind === "constellation").every((row) => row.signoff === "pending")).toBe(true);
  });
  it("fails closed when coverage or admission is tampered", () => {
    const pack = buildPack();
    expect(validatePack({ ...pack, counts: { ...pack.counts, stars: 11 } })).toContain("12-12-12-coverage-invalid");
    expect(validatePack({ ...pack, boundary: { ...pack.boundary, scientificPayloadWriteback: true } })).toContain("boundary-invalid");
    expect(validatePack({ ...pack, records: [{ ...pack.records[0], route: null }, ...pack.records.slice(1)] })).toContain("alpha-centauri-a:asset-route-missing");
  });
  it("exposes deterministic route and gate inventories", () => {
    const pack = buildPack();
    expect(routeInventory(pack.records)).toHaveProperty("mainline-a-constellation-lines", 12);
    expect(gateSummary(pack.records)).toMatchObject({ pending: 36, signoffPending: 12, rightsPending: 12, admitted: 0 });
    expect(manifestDiff(pack, pack)).toEqual([]);
    expect(jsonlReceipt(pack).split("\n").filter(Boolean)).toHaveLength(40);
  });
});
