import OrbitAtlasVisualRestorationV588Lazy from "../components/OrbitAtlasVisualRestorationV588Lazy";

export const dynamic = "force-dynamic";

export default function LocalShadowV588VisualRestorationPage() {
  const localShadow = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE === "local-shadow";
  return (
    <main
      className="min-h-[100dvh] bg-[#010205]"
      data-atlas-local-shadow-v588-page
      data-atlas-local-shadow-v588-enabled={localShadow}
      data-atlas-v588-candidate="visual-restoration"
      data-atlas-formal-product-pointer="v263"
    >
      <OrbitAtlasVisualRestorationV588Lazy enabled={localShadow} />
    </main>
  );
}
