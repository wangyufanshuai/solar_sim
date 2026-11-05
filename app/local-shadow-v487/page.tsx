import KerrDimensionlessPhotonAtlasV487 from "../components/KerrDimensionlessPhotonAtlasV487";

export const dynamic = "force-dynamic";

export default function LocalShadowV487Page() {
  const localShadow = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE === "local-shadow";
  return (
    <main
      className="min-h-screen bg-[#010405] px-4 py-8 text-white sm:px-8"
      data-atlas-local-shadow-v487-page
      data-atlas-local-shadow-v487-enabled={localShadow}
    >
      <div className="mx-auto max-w-[1540px]">
        {localShadow ? (
          <KerrDimensionlessPhotonAtlasV487 />
        ) : (
          <div
            className="rounded border border-amber-100/15 bg-amber-100/[.03] p-4 font-mono text-xs text-amber-50/55"
            data-atlas-local-shadow-v487-boundary="local-shadow-only"
          >
            V487 dimensionless photon atlas is available only in the local-shadow delivery profile.
          </div>
        )}
      </div>
    </main>
  );
}
