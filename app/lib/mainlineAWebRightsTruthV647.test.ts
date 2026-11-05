import { describe, expect, it } from "vitest";
import canonicalJson from "../data/mainlineACanonicalCoverageV622.generated.json";
import {
  MAINLINE_A3_NEBULA_VISUAL_ASSETS_ALL,
  type MainlineANebulaVisualAssetV607All,
} from "../data/mainlineANebulaVisualAssetsV607.all.generated";
import type { CoveragePackV622 } from "./mainlineACanonicalCoverageV622";
import {
  MAINLINE_A_WEB_NEBULA_RIGHTS_V647,
  buildWebNebulaRightsBookV647,
  inspectWebNebulaRightsRowV647,
  webNebulaRightsRowV647,
} from "./mainlineAWebRightsTruthV647";

const pack = canonicalJson as unknown as CoveragePackV622;
const assets = MAINLINE_A3_NEBULA_VISUAL_ASSETS_ALL;

describe("V647 web-only nebula rights truth", () => {
  it("cross-checks all twelve current previews without treating a license tag as signoff", () => {
    const book = MAINLINE_A_WEB_NEBULA_RIGHTS_V647;
    expect(book.valid).toBe(true);
    expect(book.issues).toEqual([]);
    expect(book.counts).toEqual({ total: 12, localPreviewAvailable: 12,
      sourceLicenseRecorded: 12, rightsPending: 12, rightsApproved: 0,
      releaseAdmitted: 0, mismatched: 0 });
    expect(book.rows.every((row) => row.humanRightsSignoff === "pending"
      && row.releaseAdmission === "candidate-only" && row.scientificPayloadWriteback === false)).toBe(true);
    expect(book.canonicalManifestDigest).toBe(pack.manifestDigest);
  });

  it("retains source and exact local file identity for every canonical row", () => {
    for (const row of pack.records.filter((item) => item.kind === "nebula")) {
      const reviewed = webNebulaRightsRowV647(row.id)!;
      const asset = assets.find((item) => item.objectId === row.id)!;
      expect(reviewed.localPreviewPath).toBe(asset.src);
      expect(reviewed.localPreviewSha256).toBe(asset.sha256);
      expect(reviewed.sourcePage).toBe(row.source.sourceUrl);
      expect(reviewed.sourceLicenseLabel).toBe(row.source.license);
      expect(reviewed.sourceCredit).toBe(row.source.credit);
      expect(reviewed.canonicalRowHash).toBe(row.rowHash);
      expect(reviewed.canonicalPendingReasons).toContain("rights-pending");
    }
  });

  it("rejects a forged canonical rights approval even when local metadata says cleared", () => {
    const nebula = pack.records.find((row) => row.kind === "nebula")!;
    const asset = assets.find((item) => item.objectId === nebula.id)!;
    const forged = { ...nebula, status: "runtime-cleared" as const,
      pendingReasons: [], runtimeAdmission: "current" } as unknown as typeof nebula;
    const result = inspectWebNebulaRightsRowV647(forged, asset);
    expect(result.issues).toContain("canonical-rights-boundary-opened");
    expect(result.rightsState).toBe("mismatch");
    expect(result.humanRightsSignoff).toBe("pending");
    expect(result.releaseAdmission).toBe("candidate-only");
  });

  it("rejects swapped route and source identifiers separately", () => {
    const nebula = pack.records.find((row) => row.kind === "nebula")!;
    const asset = assets.find((item) => item.objectId === nebula.id)!;
    const swappedRoute = { ...asset, sha256: "f".repeat(64) };
    const swappedSource = { ...asset, sourcePage: "https://example.org/fixture" };
    expect(inspectWebNebulaRightsRowV647(nebula, swappedRoute).issues).toContain("route-record-mismatch");
    expect(inspectWebNebulaRightsRowV647(nebula, swappedSource).issues).toContain("source-record-mismatch");
  });

  it("fails closed when a preview is absent, duplicated, or outside the local texture route", () => {
    const absent = buildWebNebulaRightsBookV647(pack, assets.slice(1));
    expect(absent.valid).toBe(false);
    expect(absent.issues).toContain("preview-asset-count-invalid");
    expect(absent.rows.find((row) => row.id === assets[0].objectId)?.issues).toContain("local-preview-missing");
    const duplicate = buildWebNebulaRightsBookV647(pack, [...assets.slice(0, 11), assets[0]]);
    expect(duplicate.issues).toContain("preview-duplicate-id");
    const outside: MainlineANebulaVisualAssetV607All = { ...assets[0], src: "/private/fixture.jpg" };
    const badPath = inspectWebNebulaRightsRowV647(pack.records.find((row) => row.id === outside.objectId)!, outside);
    expect(badPath.localPreviewAvailable).toBe(false);
    expect(badPath.issues).toContain("local-preview-metadata-invalid");
  });

  it("does not reclassify a missing source or an unknown local object as approved", () => {
    const nebula = pack.records.find((row) => row.kind === "nebula")!;
    const asset = assets.find((item) => item.objectId === nebula.id)!;
    const missingSource = { ...nebula, source: { ...nebula.source, sourceUrl: "http://example.org/not-https" } };
    expect(inspectWebNebulaRightsRowV647(missingSource, asset).rightsState).toBe("source-missing");
    const unknown = { ...asset, objectId: "not-canonical" };
    const book = buildWebNebulaRightsBookV647(pack, [...assets.slice(1), unknown]);
    expect(book.valid).toBe(false);
    expect(book.issues).toContain("preview-without-canonical:not-canonical");
    expect(book.counts.rightsApproved).toBe(0);
  });
});
