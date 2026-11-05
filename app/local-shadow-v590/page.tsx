import OrbitAtlasCelestialRenderingV590Lazy from "../components/OrbitAtlasCelestialRenderingV590Lazy";

export const dynamic = "force-dynamic";

export default function LocalShadowV590CelestialRenderingPage() {
  const localShadow = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE === "local-shadow";
  return (
    <main
      className="min-h-[100dvh] bg-[#000104]"
      data-atlas-local-shadow-v590-page
      data-atlas-local-shadow-v590-enabled={localShadow}
      data-atlas-v590-candidate="celestial-rendering"
      data-atlas-formal-product-pointer="v263"
    >
      <OrbitAtlasCelestialRenderingV590Lazy enabled={localShadow} />
    </main>
  );
}
