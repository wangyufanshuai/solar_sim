/**
 * One-shot HD pack for `public/textures/planets/nasa-hd/`:
 * - NASA (GSFC + Photojournal): Earth, Mercury, Mars, Jupiter, Sun — global / cylindrical-friendly where noted.
 * - Solar System Scope (CC BY 4.0): Venus, Moon, Saturn, Uranus, Neptune — same 2K equirect as `fetch-planet-textures.mjs`.
 * - Optional `--extras`: NASA Photojournal mosaics for Pluto, Ceres, Galilean moons, Titan, Enceladus (for future ephemeris / custom bodies; not in default sim).
 *
 * Usage (from `next-web`): node scripts/fetch-nasa-hd-bundle.mjs
 * Options:
 *   --earth-21600   Use NASA NEO 21600×10800 BMNG for Earth (~28 MB) instead of 5400×2700.
 *   --extras        Also fetch dwarf planets / major moons into the same `nasa-hd/` folder.
 *   --extras-only   Only fetch `--extras` targets (skip Earth / planets / SSS pack).
 *
 * `sun.jpg` is also copied to `public/textures/planets/sun.jpg` so the default `planetAlbedoUrl("sun")` works without `NEXT_PUBLIC_PLANET_TEXTURE_BASE`.
 * For HD everywhere: set `NEXT_PUBLIC_PLANET_TEXTURE_BASE=/textures/planets/nasa-hd` (see `.env.local`).
 */
import { createWriteStream } from "node:fs";
import { copyFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { get } from "node:https";
import { get as getHttp } from "node:http";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", "public", "textures", "planets", "nasa-hd");
const defaultPlanetsDir = join(__dirname, "..", "public", "textures", "planets");

const EARTH_5400 =
  "https://eoimages.gsfc.nasa.gov/images/imagerecords/73000/73909/world.topo.bathy.200412.3x5400x2700.jpg";
const EARTH_21600 =
  "https://neo.gsfc.nasa.gov/archive/bluemarble/bmng/world_2km/world.topo.bathy.200412.3x21600x10800.jpg";

/** NASA / JPL science assets — global mosaics suitable for UV spheres (see each PIA page). */
const NASA_JPEG = {
  mercury:
    "https://assets.science.nasa.gov/content/dam/science/psd/photojournal/pia/pia15/pia15063/PIA15063.jpg",
  mars: "https://assets.science.nasa.gov/content/dam/science/psd/photojournal/pia/pia00/pia00407/PIA00407.jpg",
  jupiter:
    "https://assets.science.nasa.gov/content/dam/science/psd/photojournal/pia/pia07/pia07782/PIA07782.jpg",
};

/** Solar disk (SOHO / MDI-style mosaic); equirect-friendly for a glowing sphere. */
const NASA_SUN =
  "https://assets.science.nasa.gov/content/dam/science/psd/photojournal/pia/pia03/pia03149/PIA03149.jpg";

/** Dwarf planets & large moons — not wired into default `ephemerisGenerated` until you add bodies. */
const NASA_EXTRAS = {
  pluto:
    "https://assets.science.nasa.gov/content/dam/science/psd/photojournal/pia/pia11/pia11713/PIA11713.jpg",
  ceres:
    "https://assets.science.nasa.gov/content/dam/science/psd/photojournal/pia/pia21/pia21090/PIA21090.jpg",
  io: "https://assets.science.nasa.gov/content/dam/science/psd/photojournal/pia/pia02/pia02309/PIA02309.jpg",
  europa:
    "https://assets.science.nasa.gov/content/dam/science/psd/photojournal/pia/pia19/pia19048/PIA19048.jpg",
  ganymede:
    "https://assets.science.nasa.gov/content/dam/science/psd/photojournal/pia/pia01/pia01610/PIA01610.jpg",
  callisto:
    "https://assets.science.nasa.gov/content/dam/science/psd/photojournal/pia/pia03/pia03458/PIA03458.jpg",
  titan:
    "https://assets.science.nasa.gov/content/dam/science/psd/photojournal/pia/pia06/pia06282/PIA06282.jpg",
  enceladus:
    "https://assets.science.nasa.gov/content/dam/science/psd/photojournal/pia/pia11/pia11685/PIA11685.jpg",
};

const SSS_BASE = "https://www.solarsystemscope.com/textures/download/";
const SSS_FILES = {
  venus: "2k_venus_surface.jpg",
  moon: "2k_moon.jpg",
  saturn: "2k_saturn.jpg",
  uranus: "2k_uranus.jpg",
  neptune: "2k_neptune.jpg",
};

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https:") ? get : getHttp;
    client(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        const loc = res.headers.location;
        res.resume();
        if (!loc) return reject(new Error("Redirect without location"));
        return resolve(download(new URL(loc, url).href, dest));
      }
      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      const file = createWriteStream(dest);
      res.pipe(file);
      file.on("finish", () => file.close(resolve));
      file.on("error", reject);
    }).on("error", reject);
  });
}

async function fetchOne(label, url, filename) {
  const dest = join(outDir, filename);
  process.stdout.write(`${label} ... `);
  await download(url, dest);
  console.log("ok");
}

const args = process.argv.slice(2);
const earth21600 = args.includes("--earth-21600");
const extrasOnly = args.includes("--extras-only");
const withExtras = args.includes("--extras") || extrasOnly;

await mkdir(outDir, { recursive: true });
await mkdir(defaultPlanetsDir, { recursive: true });

if (!extrasOnly) {
  console.log("→ NASA / GSFC + Photojournal");
  await fetchOne(
    "earth",
    earth21600 ? EARTH_21600 : EARTH_5400,
    "earth.jpg"
  );
  for (const [id, url] of Object.entries(NASA_JPEG)) {
    await fetchOne(id, url, `${id}.jpg`);
  }
  await fetchOne("sun", NASA_SUN, "sun.jpg");
  await copyFile(join(outDir, "sun.jpg"), join(defaultPlanetsDir, "sun.jpg"));
  console.log("sun → also copied to public/textures/planets/sun.jpg (default albedo path)");

  console.log("→ Solar System Scope (fill Venus / Moon / outer giants)");
  for (const [id, name] of Object.entries(SSS_FILES)) {
    await fetchOne(`${id} (SSS)`, `${SSS_BASE}${name}`, `${id}.jpg`);
  }
}

if (withExtras) {
  console.log("→ NASA Photojournal (dwarf planets / major moons, optional sim bodies)");
  for (const [id, url] of Object.entries(NASA_EXTRAS)) {
    await fetchOne(id, url, `${id}.jpg`);
  }
}

console.log(
  "\nDone. HD pack: NEXT_PUBLIC_PLANET_TEXTURE_BASE=/textures/planets/nasa-hd — sun also works at default /textures/planets/sun.jpg."
);
