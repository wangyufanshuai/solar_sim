import { lazy, Suspense } from "react";

const RelativityResearchWorkspaceV9 = lazy(() => import("./RelativityResearchWorkspaceV9"));
const RelativityResearchWorkbenchV280 = lazy(() => import("./RelativityResearchWorkbenchV280"));

export default function RelativityResearchWorkspaceSection() {
  return (
    <Suspense fallback={<div className="border-b border-cyan-100/10 px-3 py-3 text-[10px] text-white/40">正在加载科研证据工作台…</div>}>
      <RelativityResearchWorkspaceV9 />
      <RelativityResearchWorkbenchV280 />
    </Suspense>
  );
}
