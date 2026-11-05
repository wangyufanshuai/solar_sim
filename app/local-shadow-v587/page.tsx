import OrbitAtlasKerrObservatoryV587Lazy from "../components/OrbitAtlasKerrObservatoryV587Lazy";

export const dynamic = "force-dynamic";

export default function LocalShadowV587ObservationPage() {
  const localShadow = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE === "local-shadow";
  return (
    <main
      className="min-h-[100dvh] bg-[#010204]"
      data-atlas-local-shadow-v587-page
      data-atlas-local-shadow-v587-enabled={localShadow}
      data-atlas-v587-candidate="event-horizon-observatory"
      data-atlas-formal-product-pointer="v263"
    >
      <OrbitAtlasKerrObservatoryV587Lazy enabled={localShadow} />
    </main>
  );
}
