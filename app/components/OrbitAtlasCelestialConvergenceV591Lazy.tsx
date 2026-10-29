"use client";

import dynamic from "next/dynamic";

const CelestialConvergenceV591 = dynamic(
  () => import("./OrbitAtlasCelestialConvergenceV591"),
  {
    ssr: false,
    loading: () => (
      <div
        className="grid h-[100dvh] min-h-[640px] w-full place-items-center bg-[#000104] text-[8px] uppercase tracking-[.27em] text-[#e8c98e]/48"
        data-atlas-v591-lazy-loading
      >
        Aligning celestial reference optics...
      </div>
    ),
  },
);

export default function OrbitAtlasCelestialConvergenceV591Lazy({ enabled }: Readonly<{ enabled: boolean }>) {
  if (!enabled) {
    return (
      <div
        className="grid min-h-[100dvh] place-items-center bg-[#000104] px-6 text-center font-mono text-[9px] uppercase tracking-[.16em] text-amber-100/55"
        data-atlas-local-shadow-v591-boundary="local-shadow-only"
      >
        v591 is an additive local-shadow convergence candidate. Formal product v263 remains unchanged.
      </div>
    );
  }
  return <CelestialConvergenceV591 />;
}
