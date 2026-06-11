import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const outDir = "public/data/atlas-demo";
mkdirSync(outDir, { recursive: true });

const route = {
  schemaVersion: 1,
  generatedAt: new Date(0).toISOString(),
  boundary:
    "Curated Sky Atlas visual navigation export. Coordinates and distances are for Solar Sim exploration, not certified astrometry.",
  route: {
    id: "deep-sky-flight-route-v2",
    name: "Deep Sky Flight Route v2",
  },
  stops: [
    { index: 1, objectId: "nebula:m42", name: "Orion Nebula", type: "nebula", credit: "Existing project deep-sky asset" },
    { index: 2, objectId: "cluster:m45", name: "Pleiades", type: "cluster", credit: "Curated star-cluster catalog" },
    { index: 3, objectId: "nebula:m1", name: "Crab Nebula", type: "nebula", credit: "Curated nebula catalog" },
    { index: 4, objectId: "nebula:carina", name: "Carina Nebula", type: "nebula", credit: "Curated nebula catalog" },
    { index: 5, objectId: "nebula:m57", name: "Ring Nebula", type: "nebula", credit: "Curated nebula catalog" },
    { index: 6, objectId: "pulsar:b0833-45", name: "Vela Pulsar", type: "pulsar", credit: "Curated pulsar catalog" },
    { index: 7, objectId: "star:alpha-centauri", name: "Alpha Centauri", type: "star", credit: "Nearby star catalog" },
    { index: 8, objectId: "gaia-star:vega", name: "Vega", type: "gaia-star", credit: "Gaia DR3 bright-star cross-match" },
  ],
};

writeFileSync(join(outDir, "deep-sky-flight-route-v2.json"), `${JSON.stringify(route, null, 2)}\n`);
writeFileSync(
  join(outDir, "deep-sky-flight-route-v2.md"),
  [
    "# Deep Sky Flight Route v2",
    "",
    route.boundary,
    "",
    ...route.stops.map((stop) => `${stop.index}. ${stop.name} (\`${stop.objectId}\`) - ${stop.credit}`),
    "",
  ].join("\n"),
);

console.log(`Wrote Sky Atlas route v2 demo to ${outDir}.`);
