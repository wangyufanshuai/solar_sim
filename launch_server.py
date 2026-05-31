"""
FastAPI WebSocket launch telemetry server.

Streams pre-computed launch trajectory data at configurable cadence via
binary frames. Runs independently on port 8766 alongside the existing
viz_server on port 8765.

Binary protocol v1:
  Header  (20 bytes): magic "LNCH" (4B) | version uint32 (4B) | flags uint32 (4B) | sim_time_s float64 (8B)
  Payload (88 bytes): 11 x float64 = x, y, z, vx, vy, vz, mass, mach, altitude, q, gamma
  Total frame: 108 bytes

Run::

    uvicorn solar_sim.launch_server:app --host 127.0.0.1 --port 8766
"""

from __future__ import annotations

import asyncio
import json
import struct
import time
from typing import Any

import numpy as np
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from .launch_simulator import (
    LAUNCH_SITES,
    LaunchResult,
    LaunchSimulator,
    TelemetryFrame,
)
from .rocket_engine import create_falcon9, create_saturn_v

# Binary protocol constants
_MAGIC = b"LNCH"
_VERSION = 1
_HEADER_FMT = "<4sIII"  # magic(4B) + version(4B) + flags(4B) + pad(4B) = 16 bytes
_HEADER_SIZE = 16
_PAYLOAD_FMT = "<d" * 11  # 11 float64 = 88 bytes
_PAYLOAD_SIZE = 88
_FRAME_SIZE = _HEADER_SIZE + _PAYLOAD_SIZE  # 104 bytes

# Launch profiles
LAUNCH_PROFILES = {
    "leo": {
        "name": "LEO (Low Earth Orbit)",
        "target_altitude_m": 185_000,
        "vehicle": "falcon9",
        "description": "185 km circular low Earth orbit",
    },
    "gto": {
        "name": "GTO (Geostationary Transfer Orbit)",
        "target_altitude_m": 35_786_000,
        "vehicle": "falcon9",
        "description": "35,786 km geostationary transfer orbit",
    },
    "tli": {
        "name": "TLI (Trans-Lunar Injection)",
        "target_altitude_m": 384_400_000,
        "vehicle": "saturn_v",
        "description": "Trans-lunar injection trajectory",
    },
    "mars": {
        "name": "Mars Transfer",
        "target_altitude_m": 225_000_000_000,
        "vehicle": "saturn_v",
        "description": "Mars transfer orbit (~225 million km)",
    },
}

app = FastAPI(title="Rocket Launch Simulator Server")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def _pack_frame(sim_time_s: float, frame: TelemetryFrame) -> bytes:
    """Pack a telemetry frame into binary protocol v1."""
    header = struct.pack(
        _HEADER_FMT,
        _MAGIC,
        _VERSION,
        0,  # flags
        0,  # pad (sim_time in payload for alignment)
    )
    sim_time_bytes = struct.pack("<d", sim_time_s)
    payload = struct.pack(
        _PAYLOAD_FMT,
        frame.x,
        frame.y,
        frame.z,
        frame.vx,
        frame.vy,
        frame.vz,
        frame.mass_kg,
        frame.mach,
        frame.altitude_m,
        frame.dynamic_pressure_pa,
        frame.lorentz_gamma,
    )
    return header + sim_time_bytes + payload


@app.get("/api/launch/profiles")
async def get_profiles():
    """Return available launch profiles."""
    return {
        "profiles": [
            {"id": k, **v} for k, v in LAUNCH_PROFILES.items()
        ],
        "sites": {
            k: {"name": v.name, "lat_deg": v.lat_deg, "lon_deg": v.lon_deg}
            for k, v in LAUNCH_SITES.items()
        },
    }


@app.get("/healthz")
async def healthz():
    return {
        "ok": True,
        "service": "solar-launch",
        "profiles": list(LAUNCH_PROFILES.keys()),
        "version": _VERSION,
    }


@app.websocket("/ws/launch")
async def ws_launch(websocket: WebSocket):
    """WebSocket endpoint for launch telemetry streaming.

    Client sends JSON commands:
      {"action": "start", "profile": "leo", "site": "cape_canaveral", "target_altitude_m": 185000}
      {"action": "pause"}
      {"action": "resume"}
      {"action": "setTimeScale", "value": 10.0}
      {"action": "seek", "time_s": 120.0}

    Server responds with binary telemetry frames.
    """
    await websocket.accept()
    await websocket.send_json({"type": "connected", "message": "Launch simulator ready"})

    result: LaunchResult | None = None
    sim_time = 0.0
    time_scale = 1.0
    paused = False
    dt = 0.001  # 1ms frame interval
    stream_task: asyncio.Task | None = None

    async def stream_telemetry():
        """Background task that streams telemetry frames."""
        nonlocal sim_time, paused, result, time_scale
        if result is None:
            return

        t_end = result.times[-1]
        stream_gen = None

        while True:
            if paused or result is None:
                await asyncio.sleep(0.05)
                continue

            if sim_time > t_end:
                await websocket.send_json({
                    "type": "complete",
                    "final_altitude_m": result.final_altitude_m,
                    "final_velocity_m_s": result.final_velocity_m_s,
                    "max_q_pa": result.max_q_pa,
                    "events": [
                        {
                            "type": ev.event_type,
                            "t": ev.t,
                            "altitude_m": ev.altitude_m,
                            "velocity_m_s": ev.velocity_m_s,
                            **ev.data,
                        }
                        for ev in result.events
                    ],
                })
                break

            # Evaluate dense solution at current time
            try:
                state = result.dense_solution(sim_time)
            except Exception:
                break

            # Compute derived quantities
            from .launch_simulator import _C_LIGHT
            from .rocket_atmosphere import ExponentialAtmosphere
            atm = ExponentialAtmosphere()
            r = state[0:3]
            v = state[3:6]
            m = state[6]
            r_norm = float(np.linalg.norm(r))
            v_norm = float(np.linalg.norm(v))
            alt = r_norm - atm.R_body
            mach = atm.mach_number(max(alt, 0.0), v_norm)
            # Use generic Cd/A for dynamic pressure display
            q = 0.5 * atm.density(max(alt, 0.0)) * v_norm * v_norm
            beta2 = (v_norm / _C_LIGHT) ** 2
            gamma = 1.0 / (1.0 - beta2) ** 0.5 if beta2 < 1.0 else float("inf")

            frame = TelemetryFrame(
                t=sim_time,
                x=float(r[0]), y=float(r[1]), z=float(r[2]),
                vx=float(v[0]), vy=float(v[1]), vz=float(v[2]),
                mass_kg=float(m),
                mach=mach,
                altitude_m=alt,
                dynamic_pressure_pa=q,
                lorentz_gamma=gamma,
            )

            binary = _pack_frame(sim_time, frame)
            try:
                await websocket.send_bytes(binary)
            except Exception:
                break

            # Advance time by dt * time_scale
            sim_time += dt * time_scale

            # Throttle sending to match real-time (at time_scale=1)
            # At 1x, send 1ms of sim per 1ms of real time
            # At 10x, send 10ms of sim per 1ms of real time
            await asyncio.sleep(dt)  # ~1ms between frames

    try:
        while True:
            raw = await websocket.receive_text()
            try:
                msg = json.loads(raw)
            except json.JSONDecodeError:
                await websocket.send_json({"type": "error", "message": "Invalid JSON"})
                continue

            action = msg.get("action", "")

            if action == "start":
                # Stop any existing stream
                if stream_task and not stream_task.done():
                    stream_task.cancel()

                profile_id = msg.get("profile", "leo")
                site_id = msg.get("site", "cape_canaveral")
                target_alt = msg.get("target_altitude_m", 185_000)
                vehicle = msg.get("vehicle", LAUNCH_PROFILES.get(profile_id, {}).get("vehicle", "falcon9"))

                # Create engine and simulator
                if vehicle == "saturn_v":
                    engine = create_saturn_v()
                else:
                    engine = create_falcon9()

                site = LAUNCH_SITES.get(site_id, LAUNCH_SITES["cape_canaveral"])
                simulator = LaunchSimulator(
                    engine=engine,
                    launch_site=site,
                    target_orbit_altitude_m=target_alt,
                )

                await websocket.send_json({
                    "type": "status",
                    "message": "Computing trajectory...",
                })

                # Run simulation (fast, typically <1 second)
                result = simulator.simulate()

                if not result.success:
                    await websocket.send_json({
                        "type": "error",
                        "message": "Simulation failed to converge",
                    })
                    continue

                sim_time = 0.0
                paused = False
                time_scale = msg.get("timeScale", 10.0)

                # Send simulation metadata
                await websocket.send_json({
                    "type": "ready",
                    "duration_s": float(result.times[-1]),
                    "max_q_pa": result.max_q_pa,
                    "max_q_time_s": result.max_q_time_s,
                    "max_q_altitude_m": result.max_q_altitude_m,
                    "events": [
                        {
                            "type": ev.event_type,
                            "t": ev.t,
                            "altitude_m": ev.altitude_m,
                            "velocity_m_s": ev.velocity_m_s,
                            **ev.data,
                        }
                        for ev in result.events
                    ],
                })

                # Start streaming
                stream_task = asyncio.create_task(stream_telemetry())

            elif action == "pause":
                paused = True
                await websocket.send_json({"type": "paused", "time_s": sim_time})

            elif action == "resume":
                paused = False
                await websocket.send_json({"type": "resumed", "time_s": sim_time})

            elif action == "setTimeScale":
                time_scale = float(msg.get("value", 1.0))
                time_scale = max(0.1, min(time_scale, 10000.0))
                await websocket.send_json({"type": "timeScale", "value": time_scale})

            elif action == "seek":
                sim_time = float(msg.get("time_s", 0.0))
                await websocket.send_json({"type": "seeked", "time_s": sim_time})

    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"Launch WebSocket error: {e}")
    finally:
        if stream_task and not stream_task.done():
            stream_task.cancel()
