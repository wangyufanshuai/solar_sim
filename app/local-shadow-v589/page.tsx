import OrbitAtlasCelestialArtV589Lazy from "../components/OrbitAtlasCelestialArtV589Lazy";

export const dynamic = "force-dynamic";

export default function LocalShadowV589CelestialArtPage() {
  const localShadow = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE === "local-shadow";
  return (
    <main
      className="min-h-[100dvh] bg-[#000104]"
      data-atlas-local-shadow-v589-page
      data-atlas-local-shadow-v589-enabled={localShadow}
      data-atlas-v589-candidate="celestial-art"
      data-atlas-formal-product-pointer="v263"
    >
      <OrbitAtlasCelestialArtV589Lazy enabled={localShadow} />
    </main>
  );
}

