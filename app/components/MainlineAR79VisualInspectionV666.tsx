"use client";

import { useEffect, useRef, useState } from "react";
import { formatVisualBytesV666, loadVisualImageV666,
  visualLoadErrorV666, visualLoadMessageV666,
  type LoadedVisualImageV666, type VisualLoadCodeV666 } from
  "../lib/mainlineAR79ImageProbeV666";
import { visualReviewReasonLabelV666,
  type VisualReviewPlanV666 } from
  "../lib/mainlineAR79VisualReviewV666";
import { r73DisplayNameV660 } from
  "../lib/mainlineANebulaR73CatalogV660";
import type { VisualCycleV667 } from
  "../lib/mainlineAR80VisualSessionV667";

type InspectionViewV666 =
  | { phase: "idle"; attempt: number }
  | { phase: "loading"; attempt: number }
  | { phase: "ready"; attempt: number; image: LoadedVisualImageV666 }
  | { phase: "error"; attempt: number; code: VisualLoadCodeV666;
      httpStatus: number | null };

const KIND_LABELS: Record<VisualReviewPlanV666["kind"], string> = {
  "a-local-image": "A 线本机观测图文件",
  "beta-derived-preview": "Beta 派生审查预览",
  "beta-official-raw": "Beta 官方原图的本机审查路由",
  unavailable: "无可请求图片",
};

function StatusPill({ phase }: { phase: InspectionViewV666["phase"] }) {
  const text = phase === "idle" ? "尚未请求"
    : phase === "loading" ? "本机读取中"
      : phase === "ready" ? "字节已核对" : "读取失败";
  const tone = phase === "ready" ? "border-emerald-100/30 text-emerald-100"
    : phase === "error" ? "border-red-100/30 text-red-100"
      : "border-amber-100/25 text-amber-100";
  return <span className={`rounded border px-2 py-1 text-[10px] ${tone}`}
    data-mainline-a-r79-status-pill={phase}>{text}</span>;
}

function Metadata({ plan, image }: {
  plan: VisualReviewPlanV666; image: LoadedVisualImageV666;
}) {
  return <dl className="grid gap-2 text-[10px] leading-4 sm:grid-cols-2"
    data-mainline-a-r79-image-metadata="true">
    <div className="min-w-0 rounded border border-white/10 bg-black/15 p-2">
      <dt className="text-slate-500">解码尺寸</dt>
      <dd className="mt-1 text-slate-200">{image.width} × {image.height} px</dd>
    </div>
    <div className="min-w-0 rounded border border-white/10 bg-black/15 p-2">
      <dt className="text-slate-500">实际字节</dt>
      <dd className="mt-1 text-slate-200">
        {formatVisualBytesV666(image.bytes)} · {image.contentType}</dd>
    </div>
    <div className="min-w-0 rounded border border-white/10 bg-black/15 p-2">
      <dt className="text-slate-500">请求范围</dt>
      <dd className="mt-1 break-all text-slate-300">本机同源 {image.route}</dd>
    </div>
    <div className="min-w-0 rounded border border-white/10 bg-black/15 p-2">
      <dt className="text-slate-500">文件身份</dt>
      <dd className="mt-1 break-all font-mono text-cyan-100/80">
        SHA-256 {image.sha256.slice(0, 16)}…</dd>
    </div>
    <div className="min-w-0 rounded border border-amber-100/15 bg-amber-100/[.025] p-2 sm:col-span-2">
      <dt className="text-amber-100/75">验收边界</dt>
      <dd className="mt-1 text-slate-300">
        {plan.kind === "beta-derived-preview"
          ? "这张图是本机派生预览；不能把预览的字节校验当成原图版权或科学有效性。"
          : "字节、类型和解码尺寸已在本机核对；逐项版权与人工视觉签收仍为 pending。"}
      </dd>
    </div>
  </dl>;
}

export default function MainlineAR79VisualInspectionV666({
  plan, onCycle,
}: { plan: VisualReviewPlanV666;
  onCycle?: (cycle: VisualCycleV667) => void }) {
  const displayTitle = r73DisplayNameV660(plan);
  const [view, setView] = useState<InspectionViewV666>({
    phase: "idle", attempt: 0 });
  const [scale, setScale] = useState<"fit" | "actual">("fit");
  const requestRef = useRef<AbortController | null>(null);
  const imageRef = useRef<LoadedVisualImageV666 | null>(null);
  const aliveRef = useRef(true);

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
      requestRef.current?.abort();
      requestRef.current = null;
      imageRef.current?.release();
      imageRef.current = null;
    };
  }, []);

  function releaseImage() {
    const completed = view.phase === "ready"
      && imageRef.current === view.image ? view.image : null;
    requestRef.current?.abort();
    requestRef.current = null;
    imageRef.current?.release();
    imageRef.current = null;
    setScale("fit");
    setView((current) => ({ phase: "idle", attempt: current.attempt }));
    if (completed) onCycle?.({ key: completed.key,
      route: completed.route, sha256: completed.sha256,
      bytes: completed.bytes, width: completed.width,
      height: completed.height, acquiredAt: completed.acquiredAt,
      releasedAt: new Date().toISOString() });
  }

  async function readImage() {
    if (!plan.requestAllowed || !plan.route) return;
    requestRef.current?.abort();
    imageRef.current?.release();
    imageRef.current = null;
    const controller = new AbortController();
    requestRef.current = controller;
    const attempt = view.attempt + 1;
    setView({ phase: "loading", attempt });
    try {
      const image = await loadVisualImageV666(plan, {
        origin: window.location.origin, signal: controller.signal });
      if (!aliveRef.current || controller.signal.aborted
        || requestRef.current !== controller) {
        image.release();
        return;
      }
      imageRef.current = image;
      setScale("fit");
      setView({ phase: "ready", attempt, image });
    } catch (error) {
      if (!aliveRef.current || requestRef.current !== controller
        || controller.signal.aborted) return;
      const failure = visualLoadErrorV666(error, controller.signal);
      setView({ phase: "error", attempt,
        code: failure.code, httpStatus: failure.httpStatus });
    } finally {
      if (requestRef.current === controller) requestRef.current = null;
    }
  }

  const status = view.phase === "error"
    ? visualLoadMessageV666(view.code)
    : view.phase === "loading"
      ? "正在读取本机候选图并重算 SHA-256；切换对象会取消并释放资源。"
      : view.phase === "ready"
        ? "图片字节与候选记录一致；仅用于本机视觉审查。"
        : visualReviewReasonLabelV666(plan.reason);

  return <section className="mt-4 min-w-0 rounded-lg border border-cyan-100/15 bg-cyan-100/[.02] p-3"
    aria-label={`${displayTitle} 的本机图片检查`}
    data-mainline-a-r79-visual-inspection={plan.key}
    data-mainline-a-r79-visual-phase={view.phase}
    data-mainline-a-r79-request-allowed={String(plan.requestAllowed)}
    data-mainline-a-r79-image-kind={plan.kind}
    data-scientific-payload-writeback="false">
    <div className="flex flex-wrap items-start justify-between gap-2">
      <div className="min-w-0">
        <p className="font-mono text-[9px] tracking-[.14em] text-cyan-100/55">
          R79 / LOCAL VISUAL INSPECTION</p>
        <h5 className="mt-1 text-sm text-cyan-50">
          {displayTitle} · 候选图片检查</h5>
        <p className="mt-1 text-[10px] text-slate-400">
          {KIND_LABELS[plan.kind]} · 权利 pending · 运行时未准入</p>
      </div>
      <StatusPill phase={view.phase} />
    </div>

    <p role={view.phase === "error" ? "alert" : "status"}
      aria-live="polite"
      className={`mt-3 rounded border p-2 text-[11px] leading-5 ${
        view.phase === "error"
          ? "border-red-100/20 bg-red-100/[.04] text-red-100"
          : "border-amber-100/15 bg-black/15 text-amber-50/80"}`}
      data-mainline-a-r79-message={view.phase}>
      {status}{view.phase === "error" && view.httpStatus !== null
        ? ` · HTTP ${view.httpStatus}` : ""}
    </p>

    {plan.requestAllowed ? <div className="mt-3 flex flex-wrap gap-2">
      {view.phase !== "ready" ? <button type="button"
        disabled={view.phase === "loading"}
        onClick={() => void readImage()}
        className="min-h-11 rounded border border-cyan-100/35 px-3 text-xs text-cyan-50 hover:bg-cyan-100/10 disabled:opacity-40"
        data-mainline-a-r79-load-image="true">
        {view.phase === "error" ? "重新核对本机候选图" : "手动核对本机候选图"}
      </button> : <button type="button" onClick={releaseImage}
        className="min-h-11 rounded border border-amber-100/25 px-3 text-xs text-amber-50"
        data-mainline-a-r79-release-image="true">
        释放图片资源
      </button>}
      {view.phase === "loading" && <button type="button"
        onClick={releaseImage}
        className="min-h-11 rounded border border-white/20 px-3 text-xs text-slate-200"
        data-mainline-a-r79-cancel-image="true">取消读取</button>}
    </div> : <p className="mt-3 text-[10px] leading-5 text-slate-500"
      data-mainline-a-r79-no-request="true">
      此对象不生成图片请求。可以核对文字来源和 hold 原因。
    </p>}

    {view.phase === "ready" && <div className="mt-3"
      data-mainline-a-r79-loaded-image={view.image.sha256}>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <span className="text-[10px] text-slate-400">
          只改变审查显示比例，不修改或生成图片字节。</span>
        <div className="flex gap-1" aria-label="图片显示比例">
          <button type="button" onClick={() => setScale("fit")}
            aria-pressed={scale === "fit"}
            className={`min-h-10 rounded border px-2 text-[10px] ${
              scale === "fit" ? "border-cyan-100/40 text-cyan-50"
                : "border-white/15 text-slate-400"}`}>适应宽度</button>
          <button type="button" onClick={() => setScale("actual")}
            aria-pressed={scale === "actual"}
            className={`min-h-10 rounded border px-2 text-[10px] ${
              scale === "actual" ? "border-cyan-100/40 text-cyan-50"
                : "border-white/15 text-slate-400"}`}>原像素</button>
        </div>
      </div>
      <figure className="min-w-0 overflow-hidden rounded border border-white/10 bg-[#030910]">
        <div className="max-h-[min(48dvh,460px)] min-w-0 overflow-auto"
          data-mainline-a-r79-scale={scale}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={view.image.objectUrl}
            width={view.image.width} height={view.image.height}
            style={{ width: scale === "fit" ? "100%"
              : `${view.image.width}px`, height: "auto",
            maxWidth: scale === "fit" ? "100%" : "none" }}
            alt={`候选审查图：${displayTitle}；图像内容仍需人工核对`}
            onError={() => {
              imageRef.current?.release();
              imageRef.current = null;
              setView({ phase: "error", attempt: view.attempt,
                code: "decode", httpStatus: null });
            }}
            className="block" data-mainline-a-r79-image="true" />
        </div>
        <figcaption className="border-t border-white/10 p-2 text-[10px] leading-4 text-slate-400">
          {displayTitle} · {KIND_LABELS[plan.kind]}。此处展示已核对字节的本机候选图，
          不构成版权、科学或发布批准。
        </figcaption>
      </figure>
      <div className="mt-3"><Metadata plan={plan} image={view.image} /></div>
    </div>}

    <div className="mt-3 grid min-w-0 gap-1 text-[10px] leading-4 text-slate-500">
      <span className="break-all">候选路径：{plan.route ?? "未开放"}</span>
      <span className="break-all">预期 SHA-256：{plan.expectedSha256 ?? "缺失"}</span>
      <a href={plan.sourceUrl} target="_blank" rel="noreferrer"
        className="w-fit break-all text-cyan-100/75 underline">
        查看来源页面 ↗
      </a>
    </div>
    <p className="mt-3 border-t border-white/10 pt-2 text-[10px] leading-4 text-amber-100/65">
      candidate-only · hold · not-admitted · scientificPayloadWriteback=false。
      原图或预览的 SHA-256 只证明当前字节身份。
    </p>
  </section>;
}
