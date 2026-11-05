import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import overlayJson from "../data/mainlineANebulaB1SourceV654.generated.json";
import batchJson from "../data/mainlineANebulaBatchV624.generated.json";
import MainlineANebulaB1SourcePanelV654 from "../components/MainlineANebulaB1SourcePanelV654";
import {
  filterB1SourceRowsV654, inspectB1SourceOverlayV654,
  selectB1SourceRowV654, type B1SourceOverlayV654,
} from "./mainlineANebulaB1SourceV654";

const overlay = overlayJson as B1SourceOverlayV654;
const clone = <T,>(value: T): T => structuredClone(value);

describe("B1 six official-page and image overlay", () => {
  it("keeps six candidate rows in image-batch order without rights promotion", () => {
    const result = inspectB1SourceOverlayV654(overlay, batchJson);
    expect(result.status).toBe("verified-local-candidate");
    expect(result.issues).toEqual([]);
    expect(result.rows.map((row) => row.id)).toEqual(
      batchJson.rows.map((row) => row.id));
    expect(result.counts).toEqual({ total: 6,
      officialPagesVerified: 6, officialJpegsCaptured: 6,
      rawByteIdentical: 0, decodedPixelIdentical: 6,
      rightsSigned: 0 });
    expect(overlay.boundary).toMatchObject({ candidateOnly: true,
      hold: true, notAdmitted: true,
      scientificPayloadWriteback: false, runtimePromotion: "closed" });
  });

  it("rejects forged release claims and fabricated signoff", () => {
    const changed = clone(overlayJson);
    changed.claims.publicWebReleaseApproved = true;
    changed.rows[0].rightsStatus = "approved";
    const inspected = inspectB1SourceOverlayV654(changed as B1SourceOverlayV654, batchJson);
    expect(inspected.status).toBe("invalid");
    expect(inspected.issues).toContain("release-boundary-promoted");
    expect(inspected.issues.some((item) =>
      item.includes("admission-or-comparison-invalid"))).toBe(true);
  });

  it("rejects a mismatched source URL, credit, hash, and misleading byte flag", () => {
    const changed = clone(overlayJson);
    changed.rows[0].officialPageUrl = "https://example.invalid/page";
    changed.rows[0].officialJpegUrl = "https://example.invalid/image.jpg";
    changed.rows[0].officialCredit = "Unknown";
    changed.rows[0].candidateRawSha256 = "a".repeat(64);
    changed.rows[0].rawByteIdentical = true;
    changed.counts.rawByteIdentical = 1;
    const inspected = inspectB1SourceOverlayV654(changed as B1SourceOverlayV654, batchJson);
    expect(inspected.status).toBe("invalid");
    expect(inspected.issues.some((item) =>
      item.includes("candidate-binding-invalid"))).toBe(true);
    expect(inspected.issues.some((item) =>
      item.includes("source-and-raster-invalid"))).toBe(true);
    expect(inspected.issues.some((item) =>
      item.includes("admission-or-comparison-invalid"))).toBe(true);
  });

  it("searches by NASA ID and credit and preserves a sensible selection", () => {
    const rows = inspectB1SourceOverlayV654(overlay, batchJson).rows;
    const byId = filterB1SourceRowsV654(rows, "PIA14731");
    expect(byId.map((row) => row.id)).toEqual(["pacman-nebula"]);
    const byCredit = filterB1SourceRowsV654(rows, "NASA/CXC");
    expect(byCredit.map((row) => row.id)).toEqual(["pacman-nebula"]);
    expect(selectB1SourceRowV654(byId, "missing")?.id).toBe("pacman-nebula");
    expect(selectB1SourceRowV654([], "missing")).toBeNull();
  });

  it("renders source links, byte/pixel distinction and pending rights", () => {
    const markup = renderToStaticMarkup(createElement(
      MainlineANebulaB1SourcePanelV654, { overlay,
        imageBatch: batchJson }));
    expect(markup).toContain('data-mainline-a-b1-source-status="verified-local-candidate"');
    expect(markup).toContain('data-mainline-a-b1-source-row="heart-nebula"');
    expect(markup).toContain("0/6");
    expect(markup).toContain("版权待审");
    expect(markup).toContain("原始字节不同");
    expect(markup).toContain("scientificPayloadWriteback=false");
    expect(markup).toContain("https://science.nasa.gov/photojournal/");
  });

  it("renders hold error instead of candidate records when overlay is invalid", () => {
    const changed = clone(overlayJson);
    changed.boundary.scientificPayloadWriteback = true;
    const markup = renderToStaticMarkup(createElement(
      MainlineANebulaB1SourcePanelV654, { overlay: changed as B1SourceOverlayV654,
        imageBatch: batchJson }));
    expect(markup).toContain('data-mainline-a-b1-source-status="invalid"');
    expect(markup).toContain("保持 hold");
    expect(markup).not.toContain('data-mainline-a-b1-source-row=');
  });
});
