/**
 * Download ultra-resolution (8K) equirectangular textures from Solar System Scope
 * into `public/textures/planets/`, using the same filenames as `planetTextureManifest.ts`.
 *
 * License: CC BY 4.0 — https://www.solarsystemscope.com/textures/
 *
 * Run from `next-web`: node scripts/fetch-planet-textures-8k.mjs
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

/** Manifest-aligned local names → SSS download filename (under BASE). */
const FILES = {
  "8k_mercury.jpg": "8k_mercury.jpg",
  "8k_venus_surface.jpg": "8k_venus_surface.jpg",
  "8k_earth_daymap.jpg": "8k_earth_daymap.jpg",
  "8k_earth_clouds.jpg": "8k_earth_clouds.jpg",
  "8k_earth_nightmap.jpg": "8k_earth_nightmap.jpg",
  "8k_moon.jpg": "8k_moon.jpg",
  "8k_mars.jpg": "8k_mars.jpg",
  "8k_jupiter.jpg": "8k_jupiter.jpg",
  "8k_saturn.jpg": "8k_saturn.jpg",
  "2k_uranus.jpg": "2k_uranus.jpg",
  "2k_neptune.jpg": "2k_neptune.jpg",
  "8k_sun.jpg": "8k_sun.jpg",
  "4k_eris_fictional.jpg": "4k_eris_fictional.jpg",
  "4k_makemake_fictional.jpg": "4k_makemake_fictional.jpg",
  "4k_haumea_fictional.jpg": "4k_haumea_fictional.jpg",
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
for (const [localName, remoteName] of Object.entries(FILES)) {
  const url = `${BASE}${remoteName}`;
  const dest = join(outDir, localName);
  process.stdout.write(`${localName} ... `);
  await download(url, dest);
  console.log("ok");
}
console.log("\nDone. Source: Solar System Scope (CC BY 4.0).");
