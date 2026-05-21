"use client";

import dynamic from "next/dynamic";
import { Component, type ReactNode } from "react";

const UniversePage = dynamic(() => import("./UniversePage"), {
  ssr: false,
  loading: () => (
    <div
      className="flex h-[100dvh] w-screen flex-col items-center justify-center gap-4 bg-[#050816] px-6 text-center text-slate-300"
      style={{ backgroundColor: "#050816" }}
    >
      <div className="space-y-1">
        <div className="font-mono text-[11px] uppercase tracking-[0.34em] text-cyan-300/70">
          Universe Sandbox
        </div>
        <div className="text-base font-medium text-slate-100">
          正在接入星图与物理场景
        </div>
      </div>
      <div className="max-w-md text-sm text-slate-400">
        如果长时间停在白屏，请优先使用 Chrome 或 Edge，并确认浏览器硬件加速已开启。
      </div>
    </div>
  ),
});

class RootSceneErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div
          className="flex h-[100dvh] w-screen flex-col items-center justify-center gap-4 bg-[#050816] px-6 text-center"
          style={{ backgroundColor: "#050816" }}
        >
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-rose-300/80">
            Renderer Fault
          </p>
          <p className="text-base font-medium text-rose-100">
            3D 场景没有成功启动
          </p>
          <p className="max-w-md text-sm text-slate-400">
            {this.state.error.message}
          </p>
          <p className="max-w-lg text-sm text-slate-500">
            可以先尝试更新显卡驱动、切换到 Chrome 或 Edge，或关闭浏览器里强制软件渲染
            WebGL 的实验项后刷新。
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function ClientAppShell() {
  return (
    <RootSceneErrorBoundary>
      <UniversePage />
    </RootSceneErrorBoundary>
  );
}
