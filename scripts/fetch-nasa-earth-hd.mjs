/**
 * NASA GSFC / Earth Observatory — Blue Marble Next Generation (July 2004) + topography & bathymetry.
 * Equirectangular JPEG, suitable for `planetAlbedoUrl("earth")` on a UV sphere.
 *
 * Usage (from `next-web`):
 *   node scripts/fetch-nasa-earth-hd.mjs
 *   node scripts/fetch-nasa-earth-hd.mjs --21600
 *   node scripts/fetch-nasa-earth-hd.mjs --out public/textures/planets/nasa-hd/earth.jpg
 *
 * Then set in `.env.local`:
 *   NEXT_PUBLIC_PLANET_TEXTURE_BASE=/textures/planets/nasa-hd
 * Copy or symlink other bodies' JPGs into the same folder (same names as SSS fetch), or keep default base for them.
 *
 * Credit: NASA Earth Observatory / Visible Earth (see image pages for terms).
 */
import { createWriteStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { get } from "node:https";
import { get as getHttp } from "node:http";

const __dirname = dirname(fileURLToPath(import.meta.url));

const SOURCES = {
  /** ~2.5 MB, good default for laptops */
  5400: "https://eoimages.gsfc.nasa.gov/images/imagerecords/73000/73909/world.topo.bathy.200412.3x5400x2700.jpg",
  /** ~28 MB, 2 km/px BMNG; strong GPU recommended */
  21600:
    "https://neo.gsfc.nasa.gov/archive/bluemarble/bmng/world_2km/world.topo.bathy.200412.3x21600x10800.jpg",
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

const args = process.argv.slice(2);
const use21600 = args.includes("--21600");
let outArgIdx = args.indexOf("--out");
const out =
  outArgIdx >= 0 && args[outArgIdx + 1]
    ? args[outArgIdx + 1]
    : join(
        __dirname,
        "..",
        "public",
        "textures",
        "planets",
        "nasa-hd",
        "earth.jpg"
      );

const url = use21600 ? SOURCES[21600] : SOURCES[5400];
await mkdir(dirname(out), { recursive: true });
process.stdout.write(`Earth HD (${use21600 ? "21600×10800" : "5400×2700"}) → ${out}\n`);
await download(url, out);
console.log("ok");
