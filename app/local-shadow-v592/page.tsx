import OrbitAtlasLivingUniverseV592Lazy from "../components/OrbitAtlasLivingUniverseV592Lazy";

export const dynamic = "force-dynamic";

export default function LocalShadowV592LivingUniversePage() {
  const localShadow = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE === "local-shadow";
  return (
    <main
      className="min-h-[100dvh] bg-[#000104]"
      data-atlas-local-shadow-v592-page
      data-atlas-local-shadow-v592-enabled={localShadow}
      data-atlas-v592-candidate="living-universe"
      data-atlas-formal-product-pointer="v263"
    >
      <OrbitAtlasLivingUniverseV592Lazy enabled={localShadow} />
    </main>
  );
}
