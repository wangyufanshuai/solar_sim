import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import canonical from "../data/mainlineACanonicalCoverageV622.generated.json";
import sky from "../data/mainlineAWebSkyAtlasV656.generated.json";
import nebula from "../data/mainlineANebulaR73CatalogV660.generated.json";
import alternatives from "../data/mainlineANebulaR74AlternativesV661.generated.json";
import { assembleMainlineAWebAcceptanceV662,
  type WebAcceptanceRowV662 } from "./mainlineAWebAcceptanceV662";
import { assembleVisualReviewIndexV666, visualDeliveryByIdV666,
  visualReviewLensV666, visualReviewPlanV666,
  visualReviewReasonLabelV666 } from "./mainlineAR79VisualReviewV666";
import MainlineAR79VisualInspectionV666 from
  "../components/MainlineAR79VisualInspectionV666";

const matrix = () => assembleMainlineAWebAcceptanceV662(
  structuredClone(canonical), structuredClone(sky),
  structuredClone(nebula), structuredClone(alternatives));
const index = () => assembleVisualReviewIndexV666(matrix(),
  structuredClone(nebula));
const row = (key: string) => matrix().rows.find((item) =>
  item.key === key)!;
const cloneRow = (value: WebAcceptanceRowV662) =>
  structuredClone(value) as WebAcceptanceRowV662;

describe("R79 local visual review plan", () => {
  it("assembles 96 fail-closed entries and 31 requestable local images", () => {
    const result = index();
    expect(result.status).toBe("valid-candidate-hold");
    expect(result.issues).toEqual([]);
    expect(result.counts).toEqual({ total: 96, aImages: 12,
      betaImages: 19, derivedPreviews: 12, officialRaw: 7,
      sourceHolds: 5, identityHolds: 4, noLocalImage: 56,
      rightsSigned: 0, runtimeAdmitted: 0 });
    expect(result.plans.filter((plan) => plan.requestAllowed))
      .toHaveLength(31);
    expect(result.plans.every((plan) => plan.candidateOnly
      && plan.hold && plan.notAdmitted
      && !plan.scientificPayloadWriteback
      && plan.rights === "pending")).toBe(true);
  });

  it("maps canonical A file paths to same-origin public routes", () => {
    const plan = visualReviewPlanV666(row("a:nebula:m42"));
    expect(plan).toMatchObject({ kind: "a-local-image",
      route: "/textures/mainline-a/opo0205d.jpg",
      expectedSha256: "35ce36bbff5099f2a6022bd47d5dfd78f2a55b09da98ffbdec7c98a6a85398e3" });
  });

  it("keeps derived preview and official raw route types distinct", () => {
    const deliveries = visualDeliveryByIdV666(nebula);
    const derived = visualReviewPlanV666(row(
      "beta:nebula:heart-nebula"), deliveries.get("heart-nebula"));
    const raw = visualReviewPlanV666(row(
      "beta:nebula:w40-nebula"), deliveries.get("w40-nebula"));
    const r72 = visualReviewPlanV666(row(
      "beta:nebula:california-nebula"),
    deliveries.get("california-nebula"));
    expect(derived.kind).toBe("beta-derived-preview");
    expect(raw.kind).toBe("beta-official-raw");
    expect(r72.kind).toBe("beta-official-raw");
    expect(new Set([derived.route, raw.route, r72.route]).size).toBe(3);
    expect(derived.expectedBytes).toBeGreaterThan(0);
    expect(raw.expectedWidth).toBeGreaterThan(0);
  });

  it("names the selected nebula without preloading an image", () => {
    const delivery = visualDeliveryByIdV666(nebula).get("heart-nebula");
    const plan = visualReviewPlanV666(row(
      "beta:nebula:heart-nebula"), delivery);
    const html = renderToStaticMarkup(createElement(
      MainlineAR79VisualInspectionV666, { plan }));
    expect(html).toContain("心脏星云 · 候选图片检查");
    expect(html).toContain("data-mainline-a-r79-visual-phase=\"idle\"");
    expect(html).not.toContain("<img");
    expect(html).not.toContain("blob:");
  });

  it("keeps five held nebulae and four component identities request-free", () => {
    const result = index();
    const holds = [...visualReviewLensV666(result, "source-holds"),
      ...visualReviewLensV666(result, "identity-holds")];
    expect(holds).toHaveLength(9);
    expect(holds.every((plan) => !plan.requestAllowed
      && plan.route === null && plan.expectedSha256 === null))
      .toBe(true);
    expect(holds.map((plan) => plan.id)).toContain("acrux");
    expect(holds.map((plan) => plan.id)).toContain("ring-nebula");
  });

  it("quick lenses match their explicit UI route and evidence cohorts", () => {
    const result = index();
    expect(visualReviewLensV666(result, "all")).toHaveLength(96);
    expect(visualReviewLensV666(result, "a-images")).toHaveLength(12);
    expect(visualReviewLensV666(result, "beta-images")).toHaveLength(19);
    expect(visualReviewLensV666(result, "source-holds")).toHaveLength(5);
    expect(visualReviewLensV666(result, "identity-holds")).toHaveLength(4);
    expect(visualReviewReasonLabelV666("source-hold"))
      .toContain("无图片请求");
  });

  it("rejects a forged A asset path or missing SHA", () => {
    const a = cloneRow(row("a:nebula:m42"));
    const wrong = { ...a, imageRoute: "public/textures/mainline-a/../secret.jpg" };
    const noDigest = { ...a, imageSha256: null };
    expect(visualReviewPlanV666(wrong).reason).toBe("route-rejected");
    expect(visualReviewPlanV666(noDigest).reason).toBe("digest-missing");
    expect(visualReviewPlanV666(wrong).requestAllowed).toBe(false);
    expect(visualReviewPlanV666(noDigest).route).toBeNull();
  });

  it("rejects a forged cross-origin or malformed beta image route", () => {
    const beta = cloneRow(row("beta:nebula:heart-nebula"));
    const delivery = visualDeliveryByIdV666(nebula).get(beta.id)!;
    const foreign = { ...beta,
      imageRoute: "https://example.invalid/image.webp" };
    const another = { ...beta,
      imageRoute: "/api/atlas/mainline-a-nebula-review/soul-nebula/detail" };
    expect(visualReviewPlanV666(foreign, delivery).reason)
      .toBe("route-rejected");
    expect(visualReviewPlanV666(another, delivery).reason)
      .toBe("route-rejected");
  });

  it("rejects a forged delivery digest, dimensions or variant", () => {
    const beta = row("beta:nebula:heart-nebula");
    const delivery = visualDeliveryByIdV666(nebula).get(beta.id)!;
    for (const forged of [
      { ...delivery, sha256: "f".repeat(64) },
      { ...delivery, width: 0 },
      { ...delivery, variant: "official-raw" },
    ]) {
      const plan = visualReviewPlanV666(beta, forged);
      expect(plan.requestAllowed).toBe(false);
      expect(plan.reason).toBe("delivery-mismatch");
    }
  });

  it("rejects signed-rights and scientific-writeback promotion", () => {
    const a = row("a:nebula:m42");
    const signed = { ...a, rights: "signed" } as unknown as
      WebAcceptanceRowV662;
    const writeback = { ...a, scientificPayloadWriteback: true } as unknown as WebAcceptanceRowV662;
    expect(visualReviewPlanV666(signed).reason).toBe("boundary-invalid");
    expect(visualReviewPlanV666(writeback).requestAllowed).toBe(false);
  });

  it("fails the whole index closed when a candidate plan is malformed", () => {
    const source = matrix();
    const rows = source.rows.map((item) => item.key === "a:nebula:m42"
      ? { ...item, imageSha256: null } : item);
    const result = assembleVisualReviewIndexV666({ ...source,
      rows }, nebula);
    expect(result.status).toBe("invalid-all-held");
    expect(result.plans).toHaveLength(0);
    expect(result.issues).toContain("digest-missing:a:nebula:m42");
    expect(visualReviewLensV666(result, "a-images"))
      .toHaveLength(0);
  });

  it("rejects duplicate image routes instead of silently reusing pixels", () => {
    const source = matrix();
    const a = source.rows.find((item) => item.key === "a:nebula:m42")!;
    const rows = source.rows.map((item) => item.key === "a:nebula:m1"
      ? { ...item, imageRoute: a.imageRoute,
        imageSha256: a.imageSha256 } : item);
    const result = assembleVisualReviewIndexV666({ ...source, rows },
      nebula);
    expect(result.status).toBe("invalid-all-held");
    expect(result.issues.some((issue) =>
      issue.startsWith("duplicate-or-null-route"))).toBe(true);
  });
});
