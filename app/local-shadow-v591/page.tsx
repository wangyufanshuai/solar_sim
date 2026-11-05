import OrbitAtlasCelestialConvergenceV591Lazy from "../components/OrbitAtlasCelestialConvergenceV591Lazy";

export const dynamic = "force-dynamic";

export default function LocalShadowV591CelestialConvergencePage() {
  const localShadow = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE === "local-shadow";
  return (
    <main
      className="min-h-[100dvh] bg-[#000104]"
      data-atlas-local-shadow-v591-page
      data-atlas-local-shadow-v591-enabled={localShadow}
      data-atlas-v591-candidate="celestial-convergence"
      data-atlas-formal-product-pointer="v263"
    >
      <OrbitAtlasCelestialConvergenceV591Lazy enabled={localShadow} />
    </main>
  );
}
