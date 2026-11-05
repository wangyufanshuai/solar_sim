import { describe, expect, it } from "vitest";
import reviewJson from "../data/mainlineANebulaCandidateReviewV655.generated.json";
import r71Json from "../data/mainlineANebulaR71SourceV658.generated.json";
import r72Json from "../data/mainlineANebulaR72SourceV659.generated.json";
import catalogJson from "../data/mainlineANebulaR73CatalogV660.generated.json";
import { buildR73CatalogV660, inspectR73CatalogV660,
  r73DisplayNameV660, visibleR73RowsV660,
  type R73CatalogV660 } from "./mainlineANebulaR73CatalogV660";
import type { CandidateReviewPackV655 } from "./mainlineANebulaReviewAssetV655";
import type { R71SourceOverlayV658 } from "./mainlineAR71SourceV658";
import type { R72SourceOverlayV659 } from "./mainlineAR72ExpansionSourceV659";

const catalog = catalogJson as R73CatalogV660;
function changed(index: number, values: Record<string, unknown>) {
  const rows = catalog.rows.map((row, rank) => rank === index
    ? { ...row, ...values } : row);
  return { ...catalog, rows } as R73CatalogV660;
}

describe("R73 source-linked nebula catalog", () => {
  it("rebuilds exactly 24 candidate rows from three pinned source packs", () => {
    const rebuilt = buildR73CatalogV660(
      reviewJson as CandidateReviewPackV655,
      r71Json as R71SourceOverlayV658,
      r72Json as R72SourceOverlayV659,
      catalog.inputs, catalog.generatedAt);
    expect(rebuilt).toEqual(catalog);
    const result = inspectR73CatalogV660(catalog);
    expect(result.ok).toBe(true);
    expect(result.counts).toMatchObject({ total: 24,
      reviewImages: 19, policyHolds: 5, itemPages: 21,
      genericShells: 3, rightsSigned: 0, runtimeAdmitted: 0 });
  });

  it("keeps all 24 identities unique and five R72 image requests unexecuted", () => {
    expect(new Set(catalog.rows.map((row) => row.id)).size).toBe(24);
    expect(new Set(catalog.rows.map((row) => row.nasaId)).size).toBe(24);
    expect(catalog.rows.filter((row) => row.imageState === "policy-hold")
      .map((row) => row.id)).toEqual([
      "ring-nebula", "dumbbell-nebula", "bubble-nebula",
      "cats-eye-nebula", "omega-nebula",
    ]);
    expect(catalog.rows.every((row) => row.hold
      && row.notAdmitted && row.scientificPayloadWriteback === false)).toBe(true);
  });

  it("filters by reviewable image, policy hold, cohort and limited credit", () => {
    expect(visibleR73RowsV660(catalog.rows, "all", "")).toHaveLength(24);
    expect(visibleR73RowsV660(catalog.rows,
      "review-image", "")).toHaveLength(19);
    expect(visibleR73RowsV660(catalog.rows,
      "policy-hold", "")).toHaveLength(5);
    expect(visibleR73RowsV660(catalog.rows, "R72", "")).toHaveLength(6);
    expect(visibleR73RowsV660(catalog.rows,
      "credit-limited", "")).toHaveLength(3);
    expect(visibleR73RowsV660(catalog.rows, "all", "PIA23650")
      .map((row) => row.id)).toEqual(["california-nebula"]);
    expect(visibleR73RowsV660(catalog.rows, "all", "加州")
      .map((row) => row.id)).toEqual(["california-nebula"]);
    expect(r73DisplayNameV660(catalog.rows[20])).toBe("加州星云");
  });

  it("rejects forged rights and scientific admission", () => {
    const rights = changed(0, { rightsStatus: "approved" });
    expect(inspectR73CatalogV660(rights).issues).toContain(
      "0:heart-nebula:admission-invalid");
    const promoted = { ...catalog, boundary: { ...catalog.boundary,
      scientificPayloadWriteback: true } } as unknown as R73CatalogV660;
    expect(inspectR73CatalogV660(promoted).issues).toContain(
      "catalog-boundary-promoted");
  });

  it("rejects a fabricated image for any of the five held sources", () => {
    const california = catalog.rows[20];
    const ring = changed(18, { imageState: "review-image",
      delivery: california.delivery,
      sourceRawSha256: california.sourceRawSha256,
      rawByteRelation: "identical", decodedPixelMatch: true });
    expect(inspectR73CatalogV660(ring).issues).toContain(
      "18:ring-nebula:blocked-image-promoted");
    expect(inspectR73CatalogV660(ring).issues).toContain(
      "catalog-counts-invalid");
  });

  it("rejects swapped route, duplicate identity and generic-page promotion", () => {
    const first = catalog.rows[0];
    const route = changed(0, { delivery: {
      ...first.delivery, route: "/api/atlas/mainline-a-r72-source/ring-nebula",
    } });
    expect(inspectR73CatalogV660(route).issues).toContain(
      "0:heart-nebula:review-image-invalid");
    const duplicate = changed(1, { id: first.id });
    expect(inspectR73CatalogV660(duplicate).issues).toContain(
      "1:heart-nebula:identity-invalid");
    const page = changed(18, { creditEvidence: "structured-current" });
    expect(inspectR73CatalogV660(page).issues).toContain(
      "18:ring-nebula:generic-page-credit-promoted");
  });

  it("rejects traversal and keeps byte-digest checks in the offline builder", () => {
    const first = catalog.rows[0];
    const traversal = changed(0, { rawEvidence: [
      { ...first.rawEvidence[0], path: "docs/release/v607/../escape.jpg" },
      ...first.rawEvidence.slice(1),
    ] });
    expect(inspectR73CatalogV660(traversal).issues).toContain(
      "0:heart-nebula:raw-evidence-invalid");
    const input = { ...catalog, inputs: catalog.inputs.map((item, index) =>
      index === 0 ? { ...item, sha256: "0".repeat(64) } : item) };
    expect(inspectR73CatalogV660(input as R73CatalogV660).ok).toBe(true);
  });
});
