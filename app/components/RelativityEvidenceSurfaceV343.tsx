"use client";

import { useEffect, useRef, useState } from "react";
import { acquireKerrScienceImageProductV344, type AcquiredKerrScienceImageProductV344, type KerrScienceImageProductExpectationV344 } from "../lib/kerrScienceImageProductClientV344";
import { publishAtlasScienceImagePreviewTelemetryV345, startAtlasScienceImagePreviewTelemetryBridgeV345 } from "../lib/atlasScienceImagePreviewTelemetryV345";
import { parseRelativityEvidenceResponseV343, type RelativityEvidenceResponseV343 } from "../lib/relativityWorkbenchEvidenceV343";
import KerrScienceImageProbeSurfaceV346 from "./KerrScienceImageProbeSurfaceV346";

function short(value: string | null): string { return value == null ? "unavailable" : `${value.slice(0, 10)}…${value.slice(-8)}`; }

export default function RelativityEvidenceSurfaceV343() {
  const [response, setResponse] = useState<RelativityEvidenceResponseV343>({ version: "v343-relativity-evidence-response", available: false, reason: "evidence-unavailable", snapshot: null });
  const [preview, setPreview] = useState<AcquiredKerrScienceImageProductV344 | null>(null);
  const [productStatus, setProductStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const previewRef = useRef<AcquiredKerrScienceImageProductV344 | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/atlas/relativity-evidence/v343", { cache: "no-store", signal: controller.signal })
      .then(async (value) => parseRelativityEvidenceResponseV343(await value.json()))
      .then(setResponse)
      .catch(() => { if (!controller.signal.aborted) setResponse({ version: "v343-relativity-evidence-response", available: false, reason: "evidence-corrupt", snapshot: null }); });
    return () => controller.abort();
  }, []);
  useEffect(() => () => { previewRef.current?.release(); previewRef.current = null; }, []);
  useEffect(() => startAtlasScienceImagePreviewTelemetryBridgeV345({ route: "research", subscribe: (listener) => { window.addEventListener("resize", listener, { passive: true }); return () => window.removeEventListener("resize", listener); } }), []);

  const products = response.snapshot?.current.v343;
  const ready = response.available && products != null;
  const expectation = (id: "fits" | "png"): KerrScienceImageProductExpectationV344 | null => {
    const product = products?.[id];
    if (!product || !products.manifestSha256) return null;
    return { id, endpoint: product.endpoint, sha256: product.sha256, manifestSha256: products.manifestSha256, bytes: product.bytes, mimeType: id === "fits" ? "application/fits" : "image/png" };
  };
  const closePreview = () => {
    previewRef.current?.release(); previewRef.current = null; setPreview(null); setProductStatus("idle");
    publishAtlasScienceImagePreviewTelemetryV345({ route: "research", intent: "none", product: "none" });
  };
  const openPreview = async () => {
    const expected = expectation("png"); if (!expected || productStatus === "loading") return;
    if (previewRef.current) { closePreview(); return; }
    setProductStatus("loading"); publishAtlasScienceImagePreviewTelemetryV345({ route: "research", intent: "png-preview", product: "png" });
    try {
      const acquired = await acquireKerrScienceImageProductV344(expected); previewRef.current = acquired; setPreview(acquired); setProductStatus("ready");
      publishAtlasScienceImagePreviewTelemetryV345({ route: "research", intent: "png-preview", product: "png" });
    } catch { setProductStatus("error"); publishAtlasScienceImagePreviewTelemetryV345({ route: "research", intent: "none", product: "none" }); }
  };
  const downloadFits = async () => {
    const expected = expectation("fits"); if (!expected || productStatus === "loading") return;
    setProductStatus("loading"); publishAtlasScienceImagePreviewTelemetryV345({ route: "research", intent: "fits-download", product: "fits" });
    try {
      const acquired = await acquireKerrScienceImageProductV344(expected);
      const anchor = document.createElement("a"); anchor.href = acquired.objectUrl; anchor.download = "orbit-atlas-kerr-sparse-v343.fits"; anchor.click();
      queueMicrotask(() => { acquired.release(); setProductStatus(previewRef.current ? "ready" : "idle"); publishAtlasScienceImagePreviewTelemetryV345({ route: "research", intent: previewRef.current ? "png-preview" : "none", product: previewRef.current ? "png" : "none" }); });
    } catch { setProductStatus("error"); publishAtlasScienceImagePreviewTelemetryV345({ route: "research", intent: previewRef.current ? "png-preview" : "none", product: previewRef.current ? "png" : "none" }); }
  };

  return <section className="relative mt-2 overflow-hidden rounded-[10px] border border-amber-100/15 bg-[linear-gradient(145deg,rgba(22,16,9,0.94),rgba(6,10,18,0.98)_66%,rgba(9,18,28,0.96))] p-3 font-mono text-[8px] text-white/52" data-atlas-relativity-evidence-v343 data-atlas-relativity-evidence-v343-status={ready ? "ready" : response.reason} data-atlas-v344-product-status={productStatus} data-atlas-v344-product-intent={preview ? "png-preview-active" : "none"}>
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_92%_0%,rgba(255,210,120,0.12),transparent_28%),linear-gradient(90deg,transparent_49.8%,rgba(148,220,255,0.025)_50%,transparent_50.2%)]" />
    <div className="relative flex flex-wrap items-end justify-between gap-2"><div><div className="text-[7px] uppercase tracking-[0.2em] text-amber-100/44">Scientific image archive v343 / lifecycle v344</div><div className="mt-0.5 text-[13px] tracking-[0.045em] text-amber-50/90">FITS / PNG provenance</div></div><div className="text-right text-[7px] text-amber-100/64">{products?.denseStatus ?? "dense unavailable"}<br /><span className="text-white/28">product request only after explicit intent</span></div></div>
    <div className="relative mt-3 grid gap-1.5 sm:grid-cols-2">
      <article className="rounded border border-white/[0.08] bg-black/20 p-2.5"><div className="flex items-center justify-between"><span className="text-[7px] uppercase tracking-[0.14em] text-white/36">FITS / authority layers</span><span className="text-[7px] text-emerald-100/66">{products?.fits?.hduCount ?? 0} HDU</span></div><div className="mt-1 text-[12px] text-amber-50/84">{products?.fits ? `${(products.fits.bytes / 1024).toFixed(1)} KiB` : "—"}</div><div className="mt-0.5 text-[7px] text-white/34">radiance · error · redshift · EVPA · image order</div><div className="mt-1 text-[7px] text-white/28">SHA {short(products?.fits?.sha256 ?? null)}</div><button type="button" disabled={!products?.fits || productStatus === "loading"} onClick={() => void downloadFits()} className="atlas-accessible-focus mt-2 rounded border border-amber-100/20 bg-amber-100/[0.05] px-2 py-1 text-[7px] text-amber-50/76 hover:bg-amber-100/[0.1] disabled:opacity-35">Verified FITS download</button></article>
      <article className="rounded border border-white/[0.08] bg-black/20 p-2.5"><div className="flex items-center justify-between"><span className="text-[7px] uppercase tracking-[0.14em] text-white/36">PNG / observation plate</span><span className="text-[7px] text-cyan-100/66">{products?.png ? `${products.png.width}×${products.png.height}` : "—"}</span></div><div className="mt-1 text-[12px] text-cyan-50/84">{products?.png ? `${(products.png.bytes / 1024).toFixed(1)} KiB` : "—"}</div><div className="mt-0.5 text-[7px] text-white/34">fixed-linear reference · no adaptive normalization</div><div className="mt-1 text-[7px] text-white/28">SHA {short(products?.png?.sha256 ?? null)}</div><button type="button" disabled={!products?.png || productStatus === "loading"} onClick={() => void openPreview()} className="atlas-accessible-focus mt-2 rounded border border-cyan-100/20 bg-cyan-100/[0.05] px-2 py-1 text-[7px] text-cyan-50/76 hover:bg-cyan-100/[0.1] disabled:opacity-35">{preview ? "Close verified preview" : productStatus === "loading" ? "Verifying bytes…" : "Open verified preview"}</button></article>
    </div>
    {preview ? <KerrScienceImageProbeSurfaceV346 objectUrl={preview.objectUrl} bytes={preview.bytes} /> : null}
    {productStatus === "error" ? <div className="relative mt-2 rounded border border-rose-200/15 bg-rose-200/[0.04] px-2 py-1.5 text-[7px] text-rose-100/72">Product integrity validation failed closed. No preview or download was published.</div> : null}
    <div className="relative mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.06] pt-2 text-[7px] text-white/32"><span>manifest {short(products?.manifestSha256 ?? null)} · {products?.fields.length ?? 0} scientific fields · exact SHA</span><span>{ready ? "sanitized provenance" : response.reason === "lite-boundary" ? "Lite boundary" : "evidence unavailable"}</span></div>
  </section>;
}
