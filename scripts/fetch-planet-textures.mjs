/**
 * Download `public/textures/planets/{id}.jpg` from Solar System Scope (2K equirectangular).
 * Filenames match `planetsJ2000.ts` (`mercury` … `neptune`, plus `moon`).
 *
 * Run from `next-web`: node scripts/fetch-planet-textures.mjs
 */
import { createWriteStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { get } from "node:https";
import { get as getHttp } from "node:http";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", "public", "textures", "planets");

const BASE = "https://www.solarsystemscope.com/textures/download/";

/** Local filename → full URL (`id` matches body `id` in `planetsJ2000.ts`). */
const FILES = {
  "mercury.jpg": `${BASE}2k_mercury.jpg`,
  "venus.jpg": `${BASE}2k_venus_surface.jpg`,
  "earth.jpg": `${BASE}2k_earth_daymap.jpg`,
  "moon.jpg": `${BASE}2k_moon.jpg`,
  "mars.jpg": `${BASE}2k_mars.jpg`,
  "jupiter.jpg": `${BASE}2k_jupiter.jpg`,
  "saturn.jpg": `${BASE}2k_saturn.jpg`,
  "uranus.jpg": `${BASE}2k_uranus.jpg`,
  "neptune.jpg": `${BASE}2k_neptune.jpg`,
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

await mkdir(outDir, { recursive: true });
for (const [name, url] of Object.entries(FILES)) {
  const dest = join(outDir, name);
  process.stdout.write(`${name} ... `);
  await download(url, dest);
  console.log("ok");
}
