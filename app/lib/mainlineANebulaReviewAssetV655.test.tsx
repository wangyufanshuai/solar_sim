import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import packJson from "../data/mainlineANebulaCandidateReviewV655.generated.json";
import MainlineANebulaCandidateGalleryV655, {
  candidateReviewNameV655, candidateReviewVisibleV655,
} from "../components/MainlineANebulaCandidateGalleryV655";
import {
  inspectCandidateReviewPackV655, isLocalReviewRequestV655,
  selectCandidateReviewAssetV655, type CandidateReviewPackV655,
} from "./mainlineANebulaReviewAssetV655";
import {
  classifyReviewImageFailureV655, retrieveReviewImageV655,
  reviewImageEndpointV655,
} from "./useMainlineANebulaReviewImageV655";

const pack = packJson as CandidateReviewPackV655;
const clone = <T,>(value: T): T => structuredClone(value);

describe("twelve nebula local review assets", () => {
  it("requires twelve distinct candidates, source-linked pixels and pending rights", () => {
    const checked = inspectCandidateReviewPackV655(pack);
    expect(checked.ok).toBe(true);
    expect(checked.counts).toEqual({ total: 12, B1: 6, B2: 6,
      sourcePagesVerified: 12, candidateRawVerified: 12,
      previewPairs: 12, rawByteIdentical: 1,
      decodedPixelIdentical: 12, rightsSigned: 0 });
    expect(pack.rows.every((row) => row.runtimeAdmission === "candidate-only"
      && row.scientificPayloadWriteback === false)).toBe(true);
  });

  it("rejects forged rights, runtime admission, counts and path traversal", () => {
    const altered = clone(packJson);
    altered.rows[0].rightsStatus = "approved";
    altered.rows[0].runtimeAdmission = "admitted";
    altered.rows[0].preview.thumb.path = "../../private.webp";
    altered.counts.rightsSigned = 1;
    const checked = inspectCandidateReviewPackV655(
      altered as CandidateReviewPackV655);
    expect(checked.ok).toBe(false);
    expect(checked.issues.some((item) =>
      item.includes("candidate-admission-invalid"))).toBe(true);
    expect(checked.issues.some((item) =>
      item.includes("thumb-pin-invalid"))).toBe(true);
    expect(checked.issues).toContain("review-pack-coverage-or-counts-invalid");
  });

  it("selects only allowlisted local variants with expected hashes", () => {
    const thumb = selectCandidateReviewAssetV655(pack,
      "heart-nebula", "thumb");
    const raw = selectCandidateReviewAssetV655(pack,
      "heart-nebula", "raw");
    expect(thumb?.mimeType).toBe("image/webp");
    expect(thumb?.pin.sha256).toBe(pack.rows[0].preview.thumb.sha256);
    expect(raw?.mimeType).toBe("image/jpeg");
    expect(raw?.pin.sha256).toBe(pack.rows[0].candidateRaw.sha256);
    expect(selectCandidateReviewAssetV655(pack, "../escape", "raw")).toBeNull();
    expect(selectCandidateReviewAssetV655(pack,
      "heart-nebula", "science-payload")).toBeNull();
  });

  it("keeps the image route closed unless an explicit local switch and loopback host agree", () => {
    const local = new Request("http://127.0.0.1:3095/api/test", {
      headers: { host: "127.0.0.1:3095" },
    });
    expect(isLocalReviewRequestV655(local, false)).toBe(false);
    expect(isLocalReviewRequestV655(local, true)).toBe(true);
    const remote = new Request("https://example.com/api/test", {
      headers: { host: "example.com" },
    });
    expect(isLocalReviewRequestV655(remote, true)).toBe(false);
    const forwarded = new Request("http://127.0.0.1:3095/api/test", {
      headers: { host: "127.0.0.1:3095",
        "x-forwarded-for": "203.0.113.9" },
    });
    expect(isLocalReviewRequestV655(forwarded, true)).toBe(true);
  });

  it("retrieves a real local preview only when HTTP headers and body SHA match", async () => {
    const row = pack.rows[0];
    const bytes = readFileSync(row.preview.thumb.path);
    const headers = {
      "content-type": "image/webp",
      "content-length": String(bytes.byteLength),
      "x-artifact-sha256": row.preview.thumb.sha256,
      "x-candidate-raw-sha256": row.candidateRaw.sha256,
      "x-mainline-a-review-only": "candidate-hold",
      "x-mainline-a-rights": "pending",
      "x-scientific-payload-writeback": "false",
    };
    const fetcher = async () => new Response(new Uint8Array(bytes), {
      status: 200, headers,
    });
    const result = await retrieveReviewImageV655(row, "thumb",
      new AbortController().signal, fetcher as typeof fetch);
    expect(result.buffer.byteLength).toBe(row.preview.thumb.bytes);
    expect(result.width).toBe(row.preview.thumb.width);
    const forged = async () => new Response(new Uint8Array(bytes), {
      status: 200, headers: { ...headers,
        "x-mainline-a-rights": "approved" },
    });
    await expect(retrieveReviewImageV655(row, "thumb",
      new AbortController().signal, forged as typeof fetch))
      .rejects.toThrow("boundary");
  });

  it("makes failure and search states explicit without granting rights", () => {
    expect(reviewImageEndpointV655("heart-nebula", "detail"))
      .toBe("/api/atlas/mainline-a-nebula-review/heart-nebula/detail");
    expect(() => reviewImageEndpointV655("../escape", "raw")).toThrow();
    expect(classifyReviewImageFailureV655(new Error("sha"))).toBe("sha");
    expect(candidateReviewVisibleV655(pack.rows,
      "B2", "PIA13449").map((row) => row.id))
      .toEqual(["jellyfish-nebula"]);
    expect(candidateReviewVisibleV655(pack.rows,
      "raw-variant", "")).toHaveLength(11);
    expect(candidateReviewNameV655(pack.rows[0])).toBe("心脏星云");
    const html = renderToStaticMarkup(createElement(
      MainlineANebulaCandidateGalleryV655, { pack }));
    expect(html).toContain('data-mainline-a-nebula-review-boundary="closed"');
    expect(html).toContain("十二张星云候选审查图集");
    expect(html).toContain("版权待审");
    expect(html).toContain("scientificPayloadWriteback=false");
    expect(html.match(/data-mainline-a-nebula-review-card=/g)).toHaveLength(12);
  });
});
