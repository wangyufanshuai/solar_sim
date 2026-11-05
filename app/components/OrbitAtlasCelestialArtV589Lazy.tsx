"use client";

import dynamic from "next/dynamic";

const CelestialArt = dynamic(() => import("./OrbitAtlasCelestialArtV589"), {
  ssr: false,
  loading: () => (
    <div className="grid h-[100dvh] min-h-[640px] w-full place-items-center bg-[#000104] text-[8px] uppercase tracking-[.26em] text-sky-100/42" data-atlas-v589-lazy-loading>
      Loading Gaia optics and Hero admission…
    </div>
  ),
});

export default function OrbitAtlasCelestialArtV589Lazy({ enabled }: Readonly<{ enabled: boolean }>) {
  if (!enabled) {
    return (
      <div className="grid min-h-[100dvh] place-items-center bg-[#000104] px-6 text-center font-mono text-[9px] uppercase tracking-[.16em] text-amber-100/55" data-atlas-local-shadow-v589-boundary="local-shadow-only">
        v589 is an additive local-shadow celestial-art candidate. Formal product v263 remains unchanged.
      </div>
    );
  }
  return <CelestialArt />;
}

