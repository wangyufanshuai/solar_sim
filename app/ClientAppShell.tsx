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
          Loading scene and physics
        </div>
      </div>
      <div className="max-w-md text-sm text-slate-400">
        If it stays blank for too long, try Chrome or Edge with hardware acceleration enabled.
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
            3D scene failed to start
          </p>
          <p className="max-w-md text-sm text-slate-400">{this.state.error.message}</p>
          <p className="max-w-lg text-sm text-slate-500">
            Try updating your GPU driver or switching to Chrome / Edge with WebGL hardware acceleration enabled.
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
