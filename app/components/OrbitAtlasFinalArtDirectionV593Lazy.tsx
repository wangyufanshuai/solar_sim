"use client";

import dynamic from "next/dynamic";

const FinalArtDirectionV593 = dynamic(
  () => import("./OrbitAtlasFinalArtDirectionV593"),
  {
    ssr: false,
    loading: () => (
      <div
        className="grid h-[100dvh] min-h-[640px] w-full place-items-center bg-[#010204] font-mono text-[9px] uppercase tracking-[.28em] text-[#d9c18e]/52"
        data-atlas-v593-lazy-loading
      >
        Calibrating final observatory art direction…
      </div>
    ),
  },
);

export default function OrbitAtlasFinalArtDirectionV593Lazy({ enabled }: Readonly<{ enabled: boolean }>) {
  if (!enabled) {
    return (
      <div
        className="grid min-h-[100dvh] place-items-center bg-[#010204] px-6 text-center font-mono text-[9px] uppercase tracking-[.16em] text-amber-100/55"
        data-atlas-local-shadow-v593-boundary="local-shadow-only"
      >
        v593 is an additive product-RC candidate. Formal product v263 remains unchanged.
      </div>
    );
  }
  return <FinalArtDirectionV593 />;
}
