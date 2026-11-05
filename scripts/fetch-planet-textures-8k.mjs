/**
 * Download high-resolution Solar System Scope textures for selected-body detail.
 *
 * Files are stored separately from overview 2K assets:
 *   public/textures/planets/hd/{body}.jpg
 *
 * License/source: Solar System Scope textures, CC BY 4.0.
 * https://www.solarsystemscope.com/textures/
 */
import { createWriteStream, existsSync, statSync } from "node:fs";
import { mkdir, rename, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { get } from "node:https";
import { get as getHttp } from "node:http";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", "public", "textures", "planets", "hd");
const base = "https://www.solarsystemscope.com/textures/download/";

const files = {
  "mercury.jpg": "8k_mercury.jpg",
  "venus.jpg": "8k_venus_surface.jpg",
  "earth.jpg": "8k_earth_daymap.jpg",
  "earth-clouds.jpg": "8k_earth_clouds.jpg",
  "earth-night.jpg": "8k_earth_nightmap.jpg",
  "moon.jpg": "8k_moon.jpg",
  "mars.jpg": "8k_mars.jpg",
  "jupiter.jpg": "8k_jupiter.jpg",
  "saturn.jpg": "8k_saturn.jpg",
  "uranus.jpg": "2k_uranus.jpg",
  "neptune.jpg": "2k_neptune.jpg",
  "sun.jpg": "8k_sun.jpg",
};

function download(url, destination) {
  return new Promise((resolve, reject) => {
    const temporary = `${destination}.part`;
    const request = (nextUrl) => {
      const client = nextUrl.startsWith("https:") ? get : getHttp;
      client(nextUrl, (response) => {
        if ([301, 302, 307, 308].includes(response.statusCode)) {
          const location = response.headers.location;
          response.resume();
          if (!location) return reject(new Error("Redirect without location"));
          request(new URL(location, nextUrl).href);
          return;
        }
        if (response.statusCode !== 200) {
          response.resume();
          reject(new Error(`HTTP ${response.statusCode} for ${nextUrl}`));
          return;
        }
        const file = createWriteStream(temporary);
        response.pipe(file);
        file.on("finish", async () => {
          file.close();
          await rm(destination, { force: true });
          await rename(temporary, destination);
          resolve();
        });
        file.on("error", reject);
      }).on("error", reject);
    };
    request(url);
  });
}

await mkdir(outDir, { recursive: true });
for (const [localName, remoteName] of Object.entries(files)) {
  const destination = join(outDir, localName);
  if (existsSync(destination) && statSync(destination).size > 64 * 1024) {
    console.log(`${localName} cached`);
    continue;
  }
  process.stdout.write(`${localName} ... `);
  await download(`${base}${remoteName}`, destination);
  console.log("ok");
}

console.log("\nDone. Source: Solar System Scope textures (CC BY 4.0).");
