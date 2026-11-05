"""Test-only fixed-layer factorial diagnostic; never a physical boundary API."""
from dataclasses import fields as dataclass_fields, replace
from pathlib import Path
import struct

import numpy as np

from .fo_ccz4_checkpoint import state_slots
from .fo_ccz4_rhs import FOCCZ4Config, fo_ccz4_rhs_3d, _state_add, _state_rk4_update
from .fo_ccz4_schwarzschild import BOUNDARY

MODES = ("none", "low", "high", "both")
STEPS = (1, 32, 64, 128, 256)
HEADER = struct.Struct("<8sQQQQQ")
RECORD = np.dtype([("step", "<u8"), ("time", "<f8"), ("q", "<f8", (58, 25, 25, 25))])
LIMIT = 2.e-12


def clamp_mask(mode):
    if mode not in MODES:
        raise ValueError("identified clamp mode required")
    ijk = np.indices((25,)*3)
    low, high = np.any(ijk <= 5, axis=0), np.any(ijk >= 19, axis=0)
    return {"none": np.zeros((25,)*3, dtype=bool), "low": low,
            "high": high, "both": low | high}[mode]


def clamp_rhs(rhs, mode):
    """Zero only declared rows; do not reset evolved fields or alter formulas."""
    mask = clamp_mask(mode)
    values = {}
    for field in dataclass_fields(rhs):
        a = np.asarray(getattr(rhs, field.name))
        if a.shape[:3] != (25,)*3 or not np.all(np.isfinite(a)):
            raise ValueError("finite n25 tensor RHS required")
        values[field.name] = a.copy()
        values[field.name][mask] = 0.
    return replace(rhs, **values)


def first_step(data, mode, gauge):
    state, dt = data.to_state(), data.header["dt"]
    def rhs(value):
        return clamp_rhs(fo_ccz4_rhs_3d(value, gauge=gauge, gauge_profile=data.profile,
            config=FOCCZ4Config(tau_inverse=data.tau_inverse), boundary_mode=BOUNDARY), mode)
    k1 = rhs(state)
    k2 = rhs(_state_add(state, k1, .5*dt))
    k3 = rhs(_state_add(state, k2, .5*dt))
    k4 = rhs(_state_add(state, k3, dt))
    return np.asarray(state_slots(_state_rk4_update(state, dt, k1, k2, k3, k4)))


def read_records(path, mode, steps):
    path = Path(path)
    if mode not in MODES or type(steps) is not int or steps not in (1, 256):
        raise ValueError("identified mode and steps 1 or 256 required")
    expected = STEPS if steps == 256 else (1,)
    with path.open("rb") as stream:
        header = stream.read(HEADER.size)
    if len(header) != HEADER.size or HEADER.unpack(header) != (b"NRHALO01", 1, 25, 58, MODES.index(mode), len(expected)):
        raise ValueError("not the declared intervention diagnostic")
    if path.stat().st_size != HEADER.size+len(expected)*RECORD.itemsize:
        raise ValueError("intervention diagnostic size differs")
    records = np.memmap(path, dtype=RECORD, mode="r", offset=HEADER.size, shape=(len(expected),))
    if (tuple(records["step"]) != expected
            or not np.array_equal(records["time"], np.asarray(expected)/256.)
            or not np.all(np.isfinite(records["q"]))):
        raise ValueError("nonfinite fields or wrong saved stage identity")
    return records


def summarize(values):
    q = np.asarray(values, dtype=float)
    if q.size == 0 or not np.all(np.isfinite(q)):
        raise ValueError("finite nonempty diagnostic required")
    maximum = float(np.max(np.abs(q)))
    rms = maximum*float(np.sqrt(np.mean((q/maximum)**2))) if maximum else 0.
    return {"rms": rms, "max_abs": maximum, "resolved_above_floor": rms > LIMIT}


def factorial(values):
    """Signed contrasts, not independent physical causes or reflection rates."""
    if set(values) != set(MODES):
        raise ValueError("all four unique clamp conditions required")
    v = {k: np.asarray(a, dtype=float) for k, a in values.items()}
    if len({a.shape for a in v.values()}) != 1:
        raise ValueError("matched diagnostic shapes required")
    for a in v.values():
        summarize(a)
    with np.errstate(over="ignore", invalid="ignore"):
        contrast = {"release_low_from_both": v["high"]-v["both"],
                    "release_high_from_both": v["low"]-v["both"],
                    "interaction": v["none"]-v["low"]-v["high"]+v["both"],
                    "release_both": v["none"]-v["both"]}
        residual = contrast["release_both"]-(contrast["release_low_from_both"]+
                   contrast["release_high_from_both"]+contrast["interaction"])
    result = {k: {"fields": a.tolist(), **summarize(a)} for k, a in contrast.items()}
    return {"contrasts": result, "identity_residual": summarize(residual)["max_abs"],
            "reflection_measurement": False, "unique_source_decomposition": False}
