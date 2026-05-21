# Planet textures

JPEGs in this folder are **2K equirectangular** maps used by the scene globes (`planetsJ2000.ts` → `/textures/planets/{id}.jpg`).

## Source

**[Solar System Scope — Textures](https://www.solarsystemscope.com/textures/)** (INOVE): maps are derived from **NASA** elevation and imagery data, tuned to spacecraft and Hubble true-color references. Some unmapped areas use fictional fill terrain; colors are slightly saturated for clarity (see their page NOTES).

| File | SSS download name |
|------|-------------------|
| `mercury.jpg` | `2k_mercury.jpg` |
| `venus.jpg` | `2k_venus_surface.jpg` |
| `earth.jpg` | `2k_earth_daymap.jpg` |
| `moon.jpg` | `2k_moon.jpg` |
| `mars.jpg` | `2k_mars.jpg` |
| `jupiter.jpg` | `2k_jupiter.jpg` |
| `saturn.jpg` | `2k_saturn.jpg` |
| `uranus.jpg` | `2k_uranus.jpg` |
| `neptune.jpg` | `2k_neptune.jpg` |

Saturn’s rings in the app are still **procedural geometry**, not the optional SSS ring texture.

## License / attribution

Textures are **CC BY 4.0**. When redistributing or showing credits in product copy, attribute for example:

> Planet textures © [Solar System Scope](https://www.solarsystemscope.com/textures/) / INOVE, [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).

## Re-fetch

From `next-web`:

```bash
node scripts/fetch-planet-textures.mjs
```

Optional Earth **normal** maps from SSS are `.tif` only; convert to JPG/PNG separately if you add `normalMap` on the Earth body in `planetsJ2000.ts`.

## NASA high-resolution (optional)

The renderer accepts **any** equirectangular **JPG/PNG** size (`TextureLoader`). For NASA-hosted Earth:

```bash
npm run fetch-nasa-hd-all
```

This writes **Earth + Mercury + Mars + Jupiter** from NASA (GSFC / Photojournal) and **Venus, Moon, Saturn, Uranus, Neptune** from Solar System Scope 2K (same as `fetch-planet-textures`), all into `nasa-hd/`.

```bash
npm run fetch-nasa-earth-hd
# or: node scripts/fetch-nasa-earth-hd.mjs --21600
```

Then add to **`.env.local`** (and restart dev):

```bash
NEXT_PUBLIC_PLANET_TEXTURE_BASE=/textures/planets/nasa-hd
```

Copy or symlink the other bodies’ `mercury.jpg` … `neptune.jpg`, `moon.jpg` into that same folder (e.g. from `npm run fetch-planet-textures`), so every `id` resolves. For PNG maps: `NEXT_PUBLIC_PLANET_TEXTURE_EXT=png`.

Other worlds: use [NASA Photojournal](https://photojournal.jpl.nasa.gov/), [NASA SVS](https://svs.gsfc.nasa.gov), [USGS Astrogeology](https://astrogeology.usgs.gov/) — export or convert to equirectangular **JPG/PNG** with the same filenames as the table above. Check each product’s **use policy** (many NASA media are public domain; some composites may request attribution).
