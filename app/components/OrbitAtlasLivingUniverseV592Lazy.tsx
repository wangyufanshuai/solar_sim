"use client";

import dynamic from "next/dynamic";

const LivingUniverseV592 = dynamic(
  () => import("./OrbitAtlasLivingUniverseV592"),
  {
    ssr: false,
    loading: () => (
      <div
        className="grid h-[100dvh] min-h-[640px] w-full place-items-center bg-[#000104] font-mono text-[8px] uppercase tracking-[.27em] text-[#e8c98e]/48"
        data-atlas-v592-lazy-loading
      >
        Synchronizing J2000 living-sky clock…
      </div>
    ),
  },
);

export default function OrbitAtlasLivingUniverseV592Lazy({ enabled }: Readonly<{ enabled: boolean }>) {
  if (!enabled) {
    return (
      <div
        className="grid min-h-[100dvh] place-items-center bg-[#000104] px-6 text-center font-mono text-[9px] uppercase tracking-[.16em] text-amber-100/55"
        data-atlas-local-shadow-v592-boundary="local-shadow-only"
      >
        v592 is an additive local-shadow Living Universe candidate. Formal product v263 remains unchanged.
      </div>
    );
  }
  return <LivingUniverseV592 />;
}
