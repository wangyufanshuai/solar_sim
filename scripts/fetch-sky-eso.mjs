/**
 * Download ESO Milky Way panorama **eso0932a** (wallpaper JPEG) into
 * `public/textures/sky/eso0932a.jpg` — second candidate after `milky-way-equirect.jpg` when no env URL is set.
 *
 * Source: European Southern Observatory (CC BY 4.0) — see image credit on eso.org.
 * Run from `next-web`: npm run fetch-sky-eso
 */
import { createWriteStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { get } from "node:https";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEST = join(__dirname, "..", "public", "textures", "sky", "eso0932a.jpg");
const URL =
  "https://cdn.eso.org/images/wallpaper5/eso0932a.jpg";

function download(url, dest) {
  return new Promise((resolve, reject) => {
    get(url, (res) => {
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

await mkdir(dirname(DEST), { recursive: true });
process.stdout.write(`eso0932a → ${DEST} ... `);
await download(URL, DEST);
console.log("ok");
