import OrbitAtlasFinalArtDirectionV593Lazy from "../components/OrbitAtlasFinalArtDirectionV593Lazy";

export const dynamic = "force-dynamic";

export default function LocalShadowV593FinalArtDirectionPage() {
  const localShadow = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE === "local-shadow";
  return (
    <main
      className="min-h-[100dvh] bg-[#010204]"
      data-atlas-local-shadow-v593-page
      data-atlas-local-shadow-v593-enabled={localShadow}
      data-atlas-v593-candidate="final-art-direction-product-rc"
      data-atlas-formal-product-pointer="v263"
    >
      <OrbitAtlasFinalArtDirectionV593Lazy enabled={localShadow} />
    </main>
  );
}
