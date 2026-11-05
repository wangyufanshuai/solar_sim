import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import overlayJson from "../data/mainlineANebulaR71SourceV658.generated.json";
import MainlineANebulaR71SourcePanelV658 from
  "../components/MainlineANebulaR71SourcePanelV658";
import { inspectR71SourceOverlayV658,
  selectR71SourceImageV658, visibleR71SourceRowsV658,
  type R71SourceOverlayV658 } from "./mainlineAR71SourceV658";

const pack = overlayJson as R71SourceOverlayV658;
const clone = <T,>(value: T): T => structuredClone(value);

describe("R71 six current official-page image links", () => {
  it("accepts only six pinned candidate rows with pending rights", () => {
    const checked = inspectR71SourceOverlayV658(pack);
    expect(checked.ok).toBe(true);
    expect(checked.linked).toBe(6);
    expect(checked.rawByteMatches).toBe(2);
    expect(pack.counts).toMatchObject({ targets: 6, officialPages: 6,
      officialImages: 6, pixelMatches: 6, rightsSigned: 0,
      runtimeAdmitted: 0 });
    expect(pack.rows.every((row) => row.rightsStatus === "pending"
      && row.runtimeAdmission === "candidate-only"
      && row.scientificPayloadWriteback === false)).toBe(true);
  });

  it("rejects a substituted official page or direct JPEG", () => {
    const altered = clone(overlayJson);
    altered.rows[0].officialPageUrl = altered.rows[1].officialPageUrl;
    altered.rows[0].officialImageUrl = altered.rows[1].officialImageUrl;
    const checked = inspectR71SourceOverlayV658(
      altered as R71SourceOverlayV658);
    expect(checked.ok).toBe(false);
    expect(checked.issues).toContain(
      "w40-nebula:raw-link-or-boundary-invalid");
  });

  it("rejects forged approval, admission, science writeback and modified counts", () => {
    const altered = clone(overlayJson);
    altered.rows[1].rightsStatus = "approved";
    altered.rows[2].runtimeAdmission = "admitted";
    altered.rows[3].scientificPayloadWriteback = true;
    altered.counts.rightsSigned = 1;
    altered.claims.publicWebReleaseApproved = true;
    const checked = inspectR71SourceOverlayV658(
      altered as R71SourceOverlayV658);
    expect(checked.ok).toBe(false);
    expect(checked.issues).toContain("counts-or-release-claims-invalid");
    expect(checked.issues.filter((issue) =>
      issue.includes("raw-link-or-boundary-invalid")).length).toBe(3);
  });

  it("rejects path traversal and mismatched raw source pins", () => {
    const altered = clone(overlayJson);
    altered.rows[0].imageRaw.path =
      "docs/release/v607/nebula-r71-v658/raw/../../private.jpg";
    altered.rows[1].pageRaw.sha256 = "0".repeat(64);
    altered.rows[2].imageRaw.bytes = 1;
    expect(inspectR71SourceOverlayV658(
      altered as R71SourceOverlayV658).ok).toBe(false);
  });

  it("selects only the six allowlisted local image routes", () => {
    const selected = selectR71SourceImageV658(pack, "w40-nebula");
    expect(selected?.route).toBe(
      "/api/atlas/mainline-a-r71-source/w40-nebula/image");
    expect(selected?.pin.sha256).toBe(pack.rows[0].imageRaw?.sha256);
    expect(selected?.contentType).toBe("image/jpeg");
    expect(selectR71SourceImageV658(pack, "../private")).toBeNull();
    const altered = clone(overlayJson);
    altered.boundary.scientificPayloadWriteback = true;
    expect(selectR71SourceImageV658(
      altered as R71SourceOverlayV658, "w40-nebula")).toBeNull();
  });

  it("filters six records by name, NASA ID and byte equivalence", () => {
    expect(visibleR71SourceRowsV658(pack.rows, "all", "")).toHaveLength(6);
    expect(visibleR71SourceRowsV658(pack.rows,
      "raw-match", "")).toHaveLength(2);
    expect(visibleR71SourceRowsV658(pack.rows,
      "raw-variant", "")).toHaveLength(4);
    expect(visibleR71SourceRowsV658(pack.rows,
      "all", "PIA20357").map((row) => row.id)).toEqual(["spider-nebula"]);
    expect(visibleR71SourceRowsV658(pack.rows,
      "all", "no-such-image")).toHaveLength(0);
  });

  it("renders distinct source and copyright state without public approval", () => {
    const html = renderToStaticMarkup(
      createElement(MainlineANebulaR71SourcePanelV658));
    expect(html).toContain("data-mainline-a-r71-source-panel=\"v658\"");
    expect(html).toContain("data-mainline-a-r71-source-status=\"verified\"");
    expect(html).toContain("data-scientific-payload-writeback=\"false\"");
    expect(html).toContain("官方页");
    expect(html).toContain("版权签署");
    expect(html).toContain("发布 blocked");
    expect(html).toContain("NASA Photojournal");
    expect(html).not.toContain("公开发布已批准");
  });
});
