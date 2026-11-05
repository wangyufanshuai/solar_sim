import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import canonical from "../data/mainlineACanonicalCoverageV622.generated.json";
import sky from "../data/mainlineAWebSkyAtlasV656.generated.json";
import nebula from "../data/mainlineANebulaR73CatalogV660.generated.json";
import alternatives from "../data/mainlineANebulaR74AlternativesV661.generated.json";
import { assembleMainlineAWebAcceptanceV662 } from
  "./mainlineAWebAcceptanceV662";
import { visualDeliveryByIdV666, visualReviewPlanV666,
  type VisualReviewPlanV666 } from "./mainlineAR79VisualReviewV666";
import { formatVisualBytesV666, loadVisualImageV666,
  visualLoadErrorV666, visualLoadMessageV666,
  type VisualLoadEnvironmentV666 } from
  "./mainlineAR79ImageProbeV666";

const ORIGIN = "http://127.0.0.1:3134";
const matrix = assembleMainlineAWebAcceptanceV662(
  canonical, sky, nebula, alternatives);
const a = visualReviewPlanV666(matrix.rows.find((item) =>
  item.key === "a:nebula:m42")!);
const held = visualReviewPlanV666(matrix.rows.find((item) =>
  item.key === "beta:nebula:ring-nebula")!);
const beta = visualReviewPlanV666(matrix.rows.find((item) =>
  item.key === "beta:nebula:heart-nebula")!,
visualDeliveryByIdV666(nebula).get("heart-nebula"));
const A_FILE = "public/textures/mainline-a/opo0205d.jpg";
const BETA_FILE = nebula.rows.find((item) =>
  item.id === "heart-nebula")!.delivery!.path;

function response(route: string, bytes: Buffer,
  options: { status?: number; type?: string; finalUrl?: string;
    contentLength?: number; artifactSha256?: string } = {}): Response {
  const headers = new Headers();
  headers.set("content-type", options.type ?? "image/jpeg");
  headers.set("content-length", String(options.contentLength
    ?? bytes.length));
  if (options.artifactSha256) {
    headers.set("x-artifact-sha256", options.artifactSha256);
  }
  const received = new Response(new Uint8Array(bytes), {
    status: options.status ?? 200, headers });
  Object.defineProperty(received, "url", {
    value: options.finalUrl ?? ORIGIN + route });
  return received;
}

function environment(received: Response, calls: string[],
  released: string[]): VisualLoadEnvironmentV666 {
  return { origin: ORIGIN,
    fetcher: (async (url: RequestInfo | URL) => {
      calls.push(String(url));
      return received;
    }) as typeof fetch,
    decode: async (blob) => {
      const metadata = await sharp(Buffer.from(
        await blob.arrayBuffer())).metadata();
      return { width: metadata.width!, height: metadata.height! };
    },
    createObjectUrl: () => "blob:r79-test-image",
    revokeObjectUrl: (url) => released.push(url),
  };
}

async function aBytes() { return readFile(A_FILE); }

describe("R79 explicit same-origin image loading", () => {
  it("reads a real A image, recomputes SHA and releases its object URL once", async () => {
    const bytes = await aBytes();
    const calls: string[] = [];
    const released: string[] = [];
    const result = await loadVisualImageV666(a,
      environment(response(a.route!, bytes), calls, released));
    expect(result.httpStatus).toBe(200);
    expect(result.sha256).toBe(createHash("sha256")
      .update(bytes).digest("hex"));
    expect(result.sha256).toBe(a.expectedSha256);
    expect(result.width).toBeGreaterThan(100);
    expect(result.height).toBeGreaterThan(100);
    expect(calls).toEqual([ORIGIN + a.route]);
    result.release();
    result.release();
    expect(released).toEqual(["blob:r79-test-image"]);
  });

  it("reads a real derived Beta preview with its recorded metadata", async () => {
    const bytes = await readFile(BETA_FILE);
    const calls: string[] = [];
    const released: string[] = [];
    const result = await loadVisualImageV666(beta,
      environment(response(beta.route!, bytes, {
        type: "image/webp", artifactSha256: beta.expectedSha256!,
      }), calls, released));
    expect(beta.kind).toBe("beta-derived-preview");
    expect(result.bytes).toBe(beta.expectedBytes);
    expect(result.width).toBe(beta.expectedWidth);
    expect(result.height).toBe(beta.expectedHeight);
    expect(result.contentType).toBe("image/webp");
    result.release();
  });

  it("does not call fetch for a held nebula or a forged right", async () => {
    const calls: string[] = [];
    const released: string[] = [];
    const bytes = await aBytes();
    const env = environment(response(a.route!, bytes), calls, released);
    await expect(loadVisualImageV666(held, env))
      .rejects.toMatchObject({ code: "not-eligible" });
    await expect(loadVisualImageV666({ ...a,
      rights: "signed" } as unknown as VisualReviewPlanV666, env))
      .rejects.toMatchObject({ code: "not-eligible" });
    expect(calls).toEqual([]);
  });

  it("rejects a cross-origin or traversal route before fetch", async () => {
    const calls: string[] = [];
    const released: string[] = [];
    const bytes = await aBytes();
    const env = environment(response(a.route!, bytes), calls, released);
    for (const route of ["https://example.invalid/image.jpg",
      "//example.invalid/image.jpg", "/textures/../secret.jpg",
      "/textures/x.jpg?raw=1"]) {
      await expect(loadVisualImageV666({ ...a, route }, env))
        .rejects.toMatchObject({ code: "route-invalid" });
    }
    expect(calls).toEqual([]);
  });

  it("keeps a default-off candidate 404 as a clear hold", async () => {
    const calls: string[] = [];
    const released: string[] = [];
    const received = response(beta.route!, Buffer.from("not found"), {
      status: 404, type: "text/plain" });
    await expect(loadVisualImageV666(beta,
      environment(received, calls, released)))
      .rejects.toMatchObject({ code: "http-unavailable", httpStatus: 404 });
    expect(calls).toEqual([ORIGIN + beta.route]);
    expect(released).toEqual([]);
    expect(visualLoadMessageV666("http-unavailable"))
      .toContain("保持 hold");
  });

  it("rejects a changed response body and never creates a display resource", async () => {
    const calls: string[] = [];
    const released: string[] = [];
    const altered = Buffer.from(await aBytes());
    altered[100] ^= 0x01;
    await expect(loadVisualImageV666(a,
      environment(response(a.route!, altered), calls, released)))
      .rejects.toMatchObject({ code: "digest" });
    expect(released).toEqual([]);
  });

  it("rejects redirected and mislabeled image responses", async () => {
    const bytes = await aBytes();
    const calls: string[] = [];
    const released: string[] = [];
    await expect(loadVisualImageV666(a,
      environment(response(a.route!, bytes, {
        finalUrl: "https://example.invalid/asset.jpg",
      }), calls, released)))
      .rejects.toMatchObject({ code: "redirect" });
    await expect(loadVisualImageV666(a,
      environment(response(a.route!, bytes, {
        type: "text/html" }), calls, released)))
      .rejects.toMatchObject({ code: "content-type" });
  });

  it("rejects oversized declarations and conflicting byte counts", async () => {
    const bytes = await aBytes();
    const calls: string[] = [];
    const released: string[] = [];
    await expect(loadVisualImageV666(a,
      environment(response(a.route!, bytes, {
        contentLength: 33 * 1024 * 1024,
      }), calls, released)))
      .rejects.toMatchObject({ code: "too-large" });
    await expect(loadVisualImageV666(a,
      environment(response(a.route!, bytes, {
        contentLength: bytes.length - 1,
      }), calls, released)))
      .rejects.toMatchObject({ code: "byte-length" });
  });

  it("rejects a forged artifact header or delivery dimensions", async () => {
    const bytes = await readFile(BETA_FILE);
    const calls: string[] = [];
    const released: string[] = [];
    await expect(loadVisualImageV666(beta,
      environment(response(beta.route!, bytes, {
        type: "image/webp", artifactSha256: "0".repeat(64),
      }), calls, released)))
      .rejects.toMatchObject({ code: "artifact-header" });
    await expect(loadVisualImageV666({ ...beta,
      expectedWidth: beta.expectedWidth! + 1 },
    environment(response(beta.route!, bytes, {
      type: "image/webp" }), calls, released)))
      .rejects.toMatchObject({ code: "dimensions" });
  });

  it("honors cancellation without issuing a request", async () => {
    const bytes = await aBytes();
    const calls: string[] = [];
    const released: string[] = [];
    const controller = new AbortController();
    controller.abort();
    await expect(loadVisualImageV666(a, { ...environment(
      response(a.route!, bytes), calls, released),
    signal: controller.signal }))
      .rejects.toMatchObject({ code: "cancelled" });
    expect(calls).toEqual([]);
  });

  it("classifies a bounded timeout separately from a network failure", async () => {
    const env: VisualLoadEnvironmentV666 = {
      origin: ORIGIN, timeoutMs: 100,
      fetcher: ((_url, init) => new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => reject(
          new DOMException("aborted", "AbortError")));
      })) as typeof fetch,
    };
    await expect(loadVisualImageV666(a, env))
      .rejects.toMatchObject({ code: "timeout" });
    expect(visualLoadErrorV666(new Error("network")).code)
      .toBe("network");
  });

  it("formats byte sizes without turning invalid inputs into measurements", () => {
    expect(formatVisualBytesV666(512)).toBe("512 B");
    expect(formatVisualBytesV666(1536)).toBe("1.5 KiB");
    expect(formatVisualBytesV666(-1)).toBe("未知大小");
  });
});
