"use client";

import { useMemo } from "react";
import type { VisualReviewIndexV666 } from
  "../lib/mainlineAR79VisualReviewV666";
import { visualSessionProgressV667,
  type VisualSessionV667 } from
  "../lib/mainlineAR80VisualSessionV667";

function CoverageMetric({ label, inspected, total }: {
  label: string; inspected: number; total: number;
}) {
  return <div className="min-w-0 rounded border border-white/10 bg-black/20 p-2">
    <strong className="block font-mono text-sm text-cyan-50">
      {inspected}/{total}</strong>
    <span className="mt-1 block text-[10px] leading-4 text-slate-400">
      {label}</span>
  </div>;
}

export default function MainlineAR80VisualCoverageV667({
  index, session, onJump,
}: {
  index: VisualReviewIndexV666;
  session: VisualSessionV667;
  onJump: (key: string) => void;
}) {
  const progress = useMemo(() => visualSessionProgressV667(
    session, index), [session, index]);
  const valid = index.status === "valid-candidate-hold"
    && session.status === "ready" && progress.total === 31;
  const fraction = progress.total > 0
    ? Math.round(progress.inspected / progress.total * 100) : 0;
  return <section className="mb-3 min-w-0 rounded-lg border border-cyan-100/20 bg-cyan-100/[.025] p-3"
    aria-label="本机会话图片核对进度"
    data-mainline-a-r80-coverage={valid ? "ready" : "held"}
    data-mainline-a-r80-covered-count={progress.inspected}
    data-mainline-a-r80-total={progress.total}
    data-mainline-a-r80-next-key={progress.nextKey ?? "none"}
    data-scientific-payload-writeback="false">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="font-mono text-[9px] tracking-[.14em] text-cyan-100/55">
          R80 / BROWSER-LOCAL IMAGE CYCLES</p>
        <h4 className="mt-1 text-sm text-cyan-50">
          当前浏览器会话 · {progress.inspected}/{progress.total} 张已走完核对与释放</h4>
        <p className="mt-1 max-w-2xl text-[10px] leading-5 text-slate-400">
          每张图需手动读取、核对 SHA-256、实际显示，再释放图片资源。
          进度只保留在当前页面，不写入版权签署、科学载荷或发布清单。</p>
      </div>
      <button type="button" disabled={!valid || !progress.nextKey}
        onClick={() => progress.nextKey && onJump(progress.nextKey)}
        className="min-h-11 shrink-0 rounded border border-cyan-100/30 px-3 text-xs text-cyan-50 disabled:opacity-40"
        data-mainline-a-r80-next-image={progress.nextKey ?? "none"}>
        {progress.complete ? "本机图片队列已核完"
          : "前往下一张待核对图片"}
      </button>
    </div>
    <div role="progressbar" aria-label="本机会话图片核对进度"
      aria-valuemin={0} aria-valuemax={progress.total}
      aria-valuenow={progress.inspected}
      className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
      <div className="h-full rounded-full bg-cyan-200/70 transition-[width]"
        style={{ width: `${fraction}%` }} />
    </div>
    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
      <CoverageMetric label="A 线本机图" {...progress.aImages} />
      <CoverageMetric label="Beta 派生审查预览" {...progress.betaDerived} />
      <CoverageMetric label="Beta 官方原图路由" {...progress.betaOfficialRaw} />
    </div>
    <p role="status" aria-live="polite" className="mt-3 text-[10px] leading-5 text-amber-100/80">
      {valid ? `${progress.remaining} 张待完成本机循环` : "验收矩阵异常，核对队列已停用"}
      {` · ${progress.sourceHolds} 张缺图保持无请求`}
      {` · ${progress.identityHolds} 颗恒星身份保持 hold`}
    </p>
    <p className="mt-1 text-[10px] leading-4 text-slate-500">
      candidate-only · hold · not-admitted · scientificPayloadWriteback=false。
      即使达到 31/31，也不代表人工视觉签收、版权批准或真实用户验证。
    </p>
  </section>;
}
