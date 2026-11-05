"use client";

import dynamic from "next/dynamic";

const VisualRestoration = dynamic(() => import("./OrbitAtlasVisualRestorationV588"), {
  ssr: false,
  loading: () => (
    <div
      className="grid h-[100dvh] min-h-[640px] w-full place-items-center bg-[#010205] text-[9px] uppercase tracking-[.28em] text-sky-100/45"
      data-atlas-v588-lazy-loading
    >
      Admitting visual restoration assets…
    </div>
  ),
});

export default function OrbitAtlasVisualRestorationV588Lazy({
  enabled,
}: Readonly<{ enabled: boolean }>) {
  if (!enabled) {
    return (
      <div
        className="grid min-h-[100dvh] place-items-center bg-[#010205] px-6 text-center font-mono text-[10px] uppercase tracking-[.18em] text-amber-100/55"
        data-atlas-local-shadow-v588-boundary="local-shadow-only"
      >
        v588 is an additive local-shadow candidate. Formal product v263 remains unchanged.
      </div>
    );
  }
  return <VisualRestoration />;
}
