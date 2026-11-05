"use client";

import { visualReviewLensV666,
  type VisualReviewIndexV666, type VisualReviewLensV666 } from
  "../lib/mainlineAR79VisualReviewV666";
import type { WebAcceptanceGroupV662,
  WebAcceptanceStateV662 } from "../lib/mainlineAWebAcceptanceV662";

type GroupChoice = WebAcceptanceGroupV662 | "all";
type StateChoice = WebAcceptanceStateV662 | "all";

type ReviewLaneV666 = {
  key: Exclude<VisualReviewLensV666, "all">;
  title: string;
  description: string;
  group: GroupChoice;
  state: StateChoice;
  tone: "cyan" | "amber";
};

const LANES: readonly ReviewLaneV666[] = [
  { key: "a-images", title: "A 线图片", group: "a-nebula",
    state: "all", tone: "cyan",
    description: "已纳入 A 线清单的本机图像；版权签署仍待完成。" },
  { key: "beta-images", title: "Beta 候选图", group: "beta-nebula",
    state: "reviewable", tone: "cyan",
    description: "仅在点击详情后手动读取；包含原图路由与派生预览。" },
  { key: "source-holds", title: "缺少图像链", group: "beta-nebula",
    state: "source-hold", tone: "amber",
    description: "当前策略禁止请求原图；保持来源 hold。" },
  { key: "identity-holds", title: "恒星身份待审", group: "beta-star",
    state: "identity-hold", tone: "amber",
    description: "物理组件尚未确认；没有可请求的图片或运行时入口。" },
];

export default function MainlineAR79ReviewLanesV666({ index,
  group, state, onChoose,
}: {
  index: VisualReviewIndexV666;
  group: GroupChoice;
  state: StateChoice;
  onChoose: (group: GroupChoice, state: StateChoice) => void;
}) {
  if (index.status !== "valid-candidate-hold") {
    return <p role="alert" className="rounded border border-red-100/20 p-3 text-xs text-red-100"
      data-mainline-a-r79-lanes="invalid">
      本机图片审查索引不一致，所有图片请求保持禁用：
      {index.issues.join(" · ")}
    </p>;
  }
  return <section aria-label="网页视觉审查快速路径"
    className="mb-3 rounded-lg border border-white/10 bg-[#07141e] p-3"
    data-mainline-a-r79-lanes="valid"
    data-mainline-a-r79-image-total={index.counts.aImages
      + index.counts.betaImages}
    data-scientific-payload-writeback="false">
    <div className="flex flex-wrap items-start justify-between gap-2">
      <div>
        <p className="font-mono text-[9px] tracking-[.16em] text-cyan-100/55">
          R79 / WEB VISUAL REVIEW PATHS</p>
        <h4 className="mt-1 text-sm text-cyan-50">按证据状态进入图片检查</h4>
      </div>
      <span className="rounded border border-amber-100/20 px-2 py-1 text-[10px] text-amber-100">
        发布 blocked
      </span>
    </div>
    <p className="mt-1 text-[10px] leading-5 text-slate-400">
      先选路径，再选对象。本检查区只在点击后读取图片；本机查看也不会改变签署或准入状态。
    </p>
    <div className="mt-3 grid grid-cols-2 gap-2 xl:grid-cols-4">
      {LANES.map((lane) => {
        const count = visualReviewLensV666(index, lane.key).length;
        const active = group === lane.group && state === lane.state;
        const cyan = lane.tone === "cyan";
        return <button key={lane.key} type="button"
          onClick={() => onChoose(lane.group, lane.state)}
          aria-pressed={active}
          data-mainline-a-r79-lane={lane.key}
          data-mainline-a-r79-lane-count={count}
          className={`min-h-20 min-w-0 rounded border p-2.5 text-left focus-visible:outline focus-visible:outline-2 ${
            cyan ? "focus-visible:outline-cyan-100"
              : "focus-visible:outline-amber-100"} ${active
            ? cyan ? "border-cyan-100/50 bg-cyan-100/10"
              : "border-amber-100/45 bg-amber-100/[.06]"
            : "border-white/10 bg-black/15 hover:border-white/25"}`}>
          <span className="flex items-start justify-between gap-2">
            <strong className={`text-xs ${cyan
              ? "text-cyan-50" : "text-amber-50"}`}>{lane.title}</strong>
            <span className={`rounded px-1.5 py-0.5 font-mono text-sm ${
              cyan ? "bg-cyan-100/10 text-cyan-50"
                : "bg-amber-100/10 text-amber-50"}`}>
              {count}
            </span>
          </span>
          <span className="mt-2 hidden text-[10px] leading-4 text-slate-400 sm:block">
            {lane.description}
          </span>
        </button>;
      })}
    </div>
    <p className="mt-3 text-[10px] leading-4 text-slate-500">
      {index.counts.derivedPreviews} 张为派生审查预览；
      {index.counts.officialRaw} 张通过官方原图审查路由。
      图片字节可复核，不代表来源解释、版权或科学有效性已批准。
    </p>
  </section>;
}
