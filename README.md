# Solar sim (Python + Next)

## Horizons → Next.js ephemeris export

From the **repository root** (parent of `solar_sim/`), with dependencies installed (`pip install -r solar_sim/requirements.txt`):

```bash
python solar_sim/export_ephemeris_nextweb.py
```

This queries JPL Horizons (via **astroquery**) for the same body list as the frontend (Sun, planets, Moon) and refreshes:

- `solar_sim/next-web/app/data/ephemerisGenerated.ts`
- `solar_sim/next-web/public/data/horizons_reference.json`
- `solar_sim/next-web/app/data/horizonsReference.ts` (same snapshot as the JSON, for label deltas)

Requires network access to the Horizons service.

## Tests

```bash
pytest solar_sim/tests
```

## Production deployment notes

`next-web` is deployed as a standalone Next.js app on `solar.wangyufan.xyz`.
Large GLB and texture assets are stored in OSS under `solar/` and served through
the same-origin Nginx proxy `/solar-assets/` to avoid WebGL CORS failures.

Production runtime defaults:

- `solar-next`: Next standalone server on `127.0.0.1:3001`.
- `solar-viz`: `uvicorn solar_sim.viz_server:app` on `127.0.0.1:8765`.
- `solar-launch`: `uvicorn solar_sim.launch_server:app` on `127.0.0.1:8766`.
- `SOLAR_SIM_OFFLINE=1` and `SOLAR_SIM_ASTEROIDS=20000` on the 2GB server.
- `NEXT_PUBLIC_SOLAR_ASSET_BASE=/solar-assets/solar`.
- `NEXT_PUBLIC_SIM_WS_URL=wss://solar.wangyufan.xyz/ws/sim`.
- `NEXT_PUBLIC_LAUNCH_WS_URL=wss://solar.wangyufan.xyz/ws/launch`.
