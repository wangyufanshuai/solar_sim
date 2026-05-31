"""
Real-time visualization backend: integrates 10 massive bodies (RK4 + EIH) and
~100k massless asteroids (Numba), broadcasts binary frames over WebSocket.

Run (after ``npm install && npm run build`` in ``web/``, or use Vite dev proxy)::

    uvicorn solar_sim.viz_server:app --host 127.0.0.1 --port 8765

Vite dev: ``npm run dev`` in ``web/`` with ``vite.config.js`` proxy ``/ws`` → 8765.
Next dev: ``npm run dev`` in ``next-web/``; WebSocket to ``ws://127.0.0.1:8765/ws/sim``; optional HTTP texture rewrite to 8765.

Environment:
  ``SOLAR_SIM_OFFLINE=1`` — skip Horizons; use static synthetic layout (still SI).
  ``SOLAR_SIM_ASTEROIDS=20000`` — lower particle count for small production servers.
"""

from __future__ import annotations

import asyncio
import os
import struct
import threading
import time
from pathlib import Path

import numpy as np
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, Response
from fastapi.staticfiles import StaticFiles

from solar_sim.massless_belt_numba import (
    init_asteroid_belt,
    massless_euler_cromer_step,
)
from solar_sim.pn_eih_accel import acceleration_eih
from solar_sim.pn_integrator import default_gravity_and_light_speed, step_rk4
from solar_sim.solar_system_masses import default_mass_kg_array
from solar_sim.units import horizons_df_to_si

try:
    import astropy.units as u
    from astropy.constants import au as au_const

    _AU_M = float(au_const.to_value(u.m))
except Exception:  # noqa: BLE001
    _AU_M = 1.495978707e11

_DAY_S = 86400.0
_N_BODIES = 10
_MAGIC = b"SSIM"
# v2: header adds float64 epoch_jd_tdb, sim_elapsed_s, rel_ratio (after nb, np)
_VERSION = 2
_J2000_JD = 2451545.0


def _relativistic_deviation_ratio(
    r: np.ndarray,
    v: np.ndarray,
    mass: np.ndarray,
    G: float,
    inv_c2: float,
    eps2: float,
) -> float:
    """Mean |a_1PN| / |a_N| over planets (indices 1..9), excluding Sun."""
    a_new = acceleration_eih(r, v, mass, G, 0.0, eps2)
    a_full = acceleration_eih(r, v, mass, G, inv_c2, eps2)
    d = np.linalg.norm(a_full[1:] - a_new[1:], axis=1)
    n = np.linalg.norm(a_new[1:], axis=1)
    mask = n > 1e-20
    if not np.any(mask):
        return 0.0
    return float(np.mean(d[mask] / n[mask]))


def _synthetic_initial_si(
    mass: np.ndarray,
    G: float,
) -> tuple[np.ndarray, np.ndarray]:
    """Rough coplanar circular-ish orbits if Horizons unavailable."""
    au = _AU_M
    sma_au = np.array(
        [0.0, 0.387, 0.723, 1.0, 1.524, 5.2, 9.5, 19.2, 30.1, 39.5],
        dtype=np.float64,
    )
    n = _N_BODIES
    r = np.zeros((n, 3), dtype=np.float64)
    v = np.zeros((n, 3), dtype=np.float64)
    m0 = mass[0]
    for i in range(1, n):
        a = sma_au[i] * au
        theta = 2 * np.pi * i / max(n - 1, 1)
        r[i, 0] = a * np.cos(theta)
        r[i, 1] = a * np.sin(theta)
        vorb = np.sqrt(G * m0 / max(a, 1e9))
        v[i, 0] = -vorb * np.sin(theta)
        v[i, 1] = vorb * np.cos(theta)
    return r, v


def _load_initial_state() -> tuple[np.ndarray, np.ndarray, np.ndarray, float, float, float]:
    mass = default_mass_kg_array()
    G, c = default_gravity_and_light_speed()
    inv_c2 = 1.0 / (c * c)
    if os.environ.get("SOLAR_SIM_OFFLINE", "").lower() in ("1", "true", "yes"):
        r0, v0 = _synthetic_initial_si(mass, G)
        return r0, v0, mass, G, inv_c2, float(_J2000_JD)
    try:
        from solar_sim.horizons_ephemeris import fetch_solar_system_state_vectors

        df, _meta = fetch_solar_system_state_vectors(origin="ssb")
        r_m, v_m = horizons_df_to_si(df)
        epoch_jd = float(df["jd_tdb"].iloc[0])
        return (
            np.asarray(r_m, dtype=np.float64),
            np.asarray(v_m, dtype=np.float64),
            mass,
            G,
            inv_c2,
            epoch_jd,
        )
    except Exception:  # noqa: BLE001
        r0, v0 = _synthetic_initial_si(mass, G)
        return r0, v0, mass, G, inv_c2, float(_J2000_JD)


def _pack_frame_au(
    r_si: np.ndarray,
    r_ast_si: np.ndarray,
    r_sun_si: np.ndarray,
    epoch_jd: float,
    sim_elapsed_s: float,
    rel_ratio: float,
) -> bytes:
    """Sun-centered positions in AU, float32. Binary protocol v2 header."""
    au = _AU_M
    rel = (r_si - r_sun_si) / au
    parts = (r_ast_si - r_sun_si) / au
    nb = rel.shape[0]
    np_ = parts.shape[0]
    hdr = struct.pack(
        "<4sIIIddd",
        _MAGIC,
        _VERSION,
        nb,
        np_,
        float(epoch_jd),
        float(sim_elapsed_s),
        float(rel_ratio),
    )
    b = np.asarray(rel, dtype=np.float32).tobytes(order="C")
    p = np.asarray(parts, dtype=np.float32).tobytes(order="C")
    return hdr + b + p


def _env_int(name: str, default: int, minimum: int = 0, maximum: int | None = None) -> int:
    raw = os.environ.get(name, "").strip()
    if not raw:
        return default
    try:
        value = int(raw)
    except ValueError:
        return default
    if maximum is not None:
        value = min(value, maximum)
    return max(minimum, value)


class SimState:
    def __init__(self, n_asteroids: int | None = None) -> None:
        if n_asteroids is None:
            n_asteroids = _env_int("SOLAR_SIM_ASTEROIDS", 100_000, 0, 200_000)
        self.n_asteroids = n_asteroids
        r, v, self.mass, self.G, self.inv_c2, self.epoch_jd_tdb = _load_initial_state()
        self.r = r
        self.v = v
        self.eps2 = 0.0
        self.time_scale = 1.0
        self.sim_time = 0.0
        self.paused = False
        self.last_rel = 0.0
        self.lock = threading.Lock()
        rng = np.random.default_rng(0)
        r_au, _ = init_asteroid_belt(n_asteroids, rng)
        self.r_ast = r_au * _AU_M
        xy = np.hypot(self.r_ast[:, 0], self.r_ast[:, 1])
        vorb = np.sqrt(self.G * self.mass[0] / np.maximum(xy, 1e9))
        ang = np.arctan2(self.r_ast[:, 1], self.r_ast[:, 0])
        self.v_ast = np.empty_like(self.r_ast)
        self.v_ast[:, 0] = -vorb * np.sin(ang)
        self.v_ast[:, 1] = vorb * np.cos(ang)
        self.v_ast[:, 2] = 0.0
        self.last_rel = _relativistic_deviation_ratio(
            self.r, self.v, self.mass, self.G, self.inv_c2, self.eps2
        )

    def step(self, dt_base: float) -> bytes:
        dt = dt_base * self.time_scale
        with self.lock:
            if not self.paused:
                self.r, self.v = step_rk4(
                    self.r,
                    self.v,
                    self.mass,
                    dt,
                    self.G,
                    self.inv_c2,
                    self.eps2,
                )
                massless_euler_cromer_step(
                    self.r_ast,
                    self.v_ast,
                    self.r,
                    self.mass,
                    _N_BODIES,
                    self.G,
                    (1e6) ** 2,
                    dt,
                )
                self.sim_time += dt
                self.last_rel = _relativistic_deviation_ratio(
                    self.r, self.v, self.mass, self.G, self.inv_c2, self.eps2
                )
            sun = self.r[0].copy()
            return _pack_frame_au(
                self.r,
                self.r_ast,
                sun,
                self.epoch_jd_tdb,
                self.sim_time,
                self.last_rel,
            )


state = SimState()
app = FastAPI(title="Solar sim viz")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_web_root = Path(__file__).resolve().parent / "web" / "dist"
_public = Path(__file__).resolve().parent / "web" / "public"
if _web_root.is_dir():
    app.mount("/assets", StaticFiles(directory=_web_root / "assets"), name="assets")
_tex_dir = _public / "textures"


@app.get("/textures/milky_way.jpg")
async def texture_milky_way_jpg():
    """Next/R3F expects this name; fall back to ``milkyway_equirect.jpg`` if present."""
    if not _tex_dir.is_dir():
        return Response(status_code=404)
    for name in ("milky_way.jpg", "milkyway_equirect.jpg"):
        p = _tex_dir / name
        if p.is_file():
            suf = p.suffix.lower()
            media = (
                "image/png"
                if suf == ".png"
                else "image/webp"
                if suf == ".webp"
                else "image/jpeg"
            )
            return FileResponse(p, media_type=media)
    return Response(status_code=404)


if _tex_dir.is_dir():
    app.mount("/textures", StaticFiles(directory=_tex_dir), name="textures")


@app.get("/")
async def root_index():
    index = _web_root / "index.html"
    if index.is_file():
        return FileResponse(index)
    return FileResponse(Path(__file__).parent / "web" / "index.html")


@app.get("/healthz")
async def healthz():
    return {
        "ok": True,
        "service": "solar-viz",
        "offline": os.environ.get("SOLAR_SIM_OFFLINE", "").lower()
        in ("1", "true", "yes"),
        "asteroids": state.n_asteroids,
        "version": _VERSION,
    }


def _observation_placeholder_path() -> Path | None:
    """Vite copies ``public/`` into ``dist/``; dev may only have ``public/``."""
    for candidate in (
        _web_root / "observation_placeholder.svg",
        Path(__file__).resolve().parent / "web" / "public" / "observation_placeholder.svg",
    ):
        if candidate.is_file():
            return candidate
    return None


@app.get("/observation_placeholder.svg")
async def observation_placeholder_svg():
    """Served at site root for ``img`` onerror (production build does not auto-mount ``dist`` root)."""
    p = _observation_placeholder_path()
    if p is not None:
        return FileResponse(p, media_type="image/svg+xml")
    return Response(status_code=404)


@app.get("/observation.jpg")
async def observation_image():
    """Optional user image: place ``web/public/observation.jpg``."""
    for name in ("observation.jpg", "observation.png", "observation.webp"):
        pub = Path(__file__).resolve().parent / "web" / "public" / name
        if pub.is_file():
            return FileResponse(pub)
        built = _web_root / name
        if built.is_file():
            return FileResponse(built)
    p = _observation_placeholder_path()
    if p is not None:
        return FileResponse(p, media_type="image/svg+xml")
    return Response(status_code=404)


@app.websocket("/ws/sim")
async def ws_sim(ws: WebSocket):
    await ws.accept()
    try:
        while True:
            try:
                msg = await asyncio.wait_for(ws.receive_text(), timeout=0.001)
                if msg.startswith("{"):
                    import json

                    try:
                        d = json.loads(msg)
                    except json.JSONDecodeError:
                        continue
                    with state.lock:
                        if "timeScale" in d:
                            state.time_scale = float(d["timeScale"])
                        if "paused" in d:
                            state.paused = bool(d["paused"])
            except (asyncio.TimeoutError, TimeoutError):
                pass
            blob = await asyncio.to_thread(state.step, 3600.0)
            await ws.send_bytes(blob)
            await asyncio.sleep(1.0 / 20.0)
    except WebSocketDisconnect:
        pass


def main() -> None:
    import uvicorn

    uvicorn.run(
        "solar_sim.viz_server:app",
        host="127.0.0.1",
        port=8765,
        reload=False,
    )


if __name__ == "__main__":
    main()
