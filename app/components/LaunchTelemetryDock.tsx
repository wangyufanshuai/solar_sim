"use client";

import { CircleStop } from "lucide-react";
import type { ReactNode } from "react";

export default function LaunchTelemetryDock({ children, onAbort }: { children: ReactNode; onAbort: () => void }) {
  return (
    <footer className="pointer-events-auto fixed bottom-0 left-0 right-0 z-[140] flex min-h-12 items-center border-y border-white/5 bg-[rgba(18,18,20,0.88)] pb-[max(0px,env(safe-area-inset-bottom))] backdrop-blur-xl" data-launch-telemetry-dock="true" data-atlas-launch-telemetry-layout="mobile-primary-four-desktop-full">
      <div className="min-w-0 flex-1">{children}</div>
      <button type="button" onClick={onAbort} data-atlas-launch-action="abort" className="mr-2 flex min-h-10 shrink-0 items-center gap-1.5 rounded border border-red-300/25 bg-red-300/[0.08] px-2.5 font-mono text-[13px] text-red-100 transition-colors hover:bg-red-300/[0.14] sm:mr-3 sm:text-[12px]" aria-label="中止发射" title="中止发射">
        <CircleStop className="h-3.5 w-3.5" strokeWidth={1.2} />
        中止
      </button>
    </footer>
  );
}
