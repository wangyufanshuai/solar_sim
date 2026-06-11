import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const outDir = "public/data/atlas-demo";
mkdirSync(outDir, { recursive: true });

const demo = {
  schemaVersion: 1,
  generatedAt: new Date(0).toISOString(),
  boundary:
    "Curated Sky Atlas map demo. Projection samples are for Solar Sim visual navigation, not certified astrometry.",
  viewport: { width: 420, height: 188 },
  projections: [
    { id: "equatorial", label: "Equatorial", axes: ["right ascension", "declination"] },
    { id: "galactic", label: "Galactic", axes: ["galactic longitude", "galactic latitude"] },
  ],
  overlays: ["magnitude scale", "distance rings", "route path", "target reticle"],
  featuredTargets: ["nebula:m42", "cluster:m45", "nebula:m1", "pulsar:b0833-45"],
};

writeFileSync(join(outDir, "sky-atlas-map-demo.json"), `${JSON.stringify(demo, null, 2)}\n`);
writeFileSync(
  join(outDir, "sky-atlas-map-demo.md"),
  [
    "# Sky Atlas Map Demo",
    "",
    demo.boundary,
    "",
    `Viewport: ${demo.viewport.width} x ${demo.viewport.height}`,
    "",
    ...demo.projections.map((projection) => `- ${projection.label}: ${projection.axes.join(" / ")}`),
    "",
  ].join("\n"),
);

console.log(`Wrote Sky Atlas map demo to ${outDir}.`);
