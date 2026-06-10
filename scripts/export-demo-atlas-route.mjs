import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import crypto from "node:crypto";

const outDir = "public/data/atlas-demo";
mkdirSync(outDir, { recursive: true });

const route = {
  schemaVersion: 1,
  generatedAt: new Date(0).toISOString(),
  name: "Deep Sky Flight Route",
  boundary:
    "Curated visual atlas route for Solar Sim showcase navigation. Not a certified astrometric or planetarium data product.",
  stops: [
    { objectId: "nebula:m42", name: "Orion Nebula", note: "Start in the Orion molecular cloud complex" },
    { objectId: "cluster:m45", name: "Pleiades", note: "Bright nearby open cluster" },
    { objectId: "nebula:m1", name: "Crab Nebula", note: "Supernova remnant and pulsar field" },
    { objectId: "nebula:carina", name: "Carina Nebula", note: "Massive southern star-forming region" },
    { objectId: "nebula:m57", name: "Ring Nebula", note: "Planetary nebula close target" },
    { objectId: "pulsar:b0833-45", name: "Vela Pulsar", note: "Nearby bright pulsar marker" },
    { objectId: "star:alpha-centauri", name: "Alpha Centauri", note: "Nearest bright stellar system" },
    { objectId: "gaia-star:vega", name: "Vega", note: "Bright Gaia cross-match endpoint" },
  ],
};

const json = JSON.stringify(route, null, 2);
const checksum = crypto.createHash("sha256").update(json).digest("hex");
writeFileSync(join(outDir, "deep-sky-flight-route.json"), `${json}\n`);
writeFileSync(
  join(outDir, "deep-sky-flight-route.md"),
  [
    "# Deep Sky Flight Route",
    "",
    route.boundary,
    "",
    `Checksum: \`${checksum}\``,
    "",
    ...route.stops.map((stop, index) => `${index + 1}. ${stop.name} (\`${stop.objectId}\`) - ${stop.note}`),
    "",
  ].join("\n"),
);

console.log(`Wrote ${route.stops.length} Sky Atlas route stops to ${outDir}.`);
