"use client";

import dynamic from "next/dynamic";

const Observatory = dynamic(() => import("./OrbitAtlasKerrObservatoryV587"), {
  ssr: false,
  loading: () => (
    <div
      className="grid h-[100dvh] min-h-[640px] w-full place-items-center bg-[#010204] text-[9px] uppercase tracking-[.24em] text-white/42"
      data-atlas-v587-lazy-loading
    >
      Loading Kerr observation console
    </div>
  ),
});

export default function OrbitAtlasKerrObservatoryV587Lazy({
  enabled,
}: Readonly<{ enabled: boolean }>) {
  if (!enabled) {
    return (
      <div
        className="grid min-h-[100dvh] place-items-center bg-[#010204] px-6 text-center font-mono text-[10px] uppercase tracking-[.18em] text-amber-100/55"
        data-atlas-local-shadow-v587-boundary="local-shadow-only"
      >
        This research candidate is unavailable outside the local-shadow delivery profile.
      </div>
    );
  }
  return <Observatory />;
}
