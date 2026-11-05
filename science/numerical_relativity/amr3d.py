"""NR-K3 shadow two-level AMR time-subcycling contract.

This module deliberately keeps the AMR operation narrow and auditable.  It
evolves one fully periodic coarse state and a node-aligned trilinearly
prolonged fine state to the same physical time, then replaces the coarse state
with a full-weighted fine state.  The synchronization is an algebraic BSSN projection;
it is *not* conservative refluxing, a tagged regrid, or a production ghost
fill.  Those are separate promotion gates.
"""

from __future__ import annotations

from dataclasses import dataclass
import hashlib
import math
from typing import Literal

import numpy as np

from .bssn3d import advance_bssn_rk4_3d
from .ccz4_3d import advance_ccz4_rk4_3d
from .ccz4_reference import GaugeConfig
from .ccz4_rhs import CCZ4Config
from .nr3d import BSSNState3D, prolongate_periodic_state, restrict_periodic_state


Formulation3D = Literal["ccz4", "bssnok"]


_STATE_FIELDS = (
    "chi",
    "h",
    "trace_k",
    "a",
    "theta",
    "conformal_gamma",
    "lapse",
    "shift",
    "b",
    "valid_mask",
)


@dataclass(frozen=True)
class AMRSubcycleReport3D:
    """Deterministic result of one two-level periodic shadow campaign.

    ``pre_sync_*`` compares the independently evolved coarse state with the
    fine state after node-centered full-weighting.  ``synchronized_coarse_state`` is the
    restricted fine state and is therefore the only state eligible for a
    subsequent coarse-level step in this contract.  ``reflux_applied`` is
    always false until a conservative finite-volume flux correction exists.
    """

    formulation: Formulation3D
    refinement_ratio: int
    coarse_steps: int
    fine_steps: int
    coarse_dt: float
    fine_dt: float
    physical_time: float
    pre_sync_l2: float
    pre_sync_l_inf: float
    coarse_state: BSSNState3D
    fine_state: BSSNState3D
    synchronized_coarse_state: BSSNState3D
    synchronization: str
    reflux_applied: bool
    state_sha256: str


def _state_fields(state: BSSNState3D) -> tuple[np.ndarray, ...]:
    return tuple(np.asarray(getattr(state, name)) for name in _STATE_FIELDS)


def _state_difference_norms(
    left: BSSNState3D,
    right: BSSNState3D,
) -> tuple[float, float]:
    if left.grid.shape != right.grid.shape or left.formulation != right.formulation:
        raise ValueError("AMR synchronization states must have matching grids and formulations")
    total_square = 0.0
    total_count = 0
    linf = 0.0
    for left_field, right_field in zip(_state_fields(left), _state_fields(right)):
        if left_field.shape != right_field.shape:
            raise ValueError("AMR synchronization fields must have matching shapes")
        difference = np.asarray(left_field, dtype=np.float64) - np.asarray(right_field, dtype=np.float64)
        total_square += float(np.sum(difference * difference, dtype=np.float64))
        total_count += int(difference.size)
        if difference.size:
            linf = max(linf, float(np.max(np.abs(difference))))
    return math.sqrt(total_square / total_count), linf


def _state_sha256(
    coarse: BSSNState3D,
    fine: BSSNState3D,
    synchronized: BSSNState3D,
    *,
    refinement_ratio: int,
    coarse_steps: int,
    coarse_dt: float,
) -> str:
    digest = hashlib.sha256()
    digest.update(b"nr-k3-amr-subcycle-v1\0")
    digest.update(f"ratio={refinement_ratio};steps={coarse_steps};dt={coarse_dt:.17g}\0".encode())
    for label, state in (
        ("coarse", coarse),
        ("fine", fine),
        ("synchronized", synchronized),
    ):
        digest.update(label.encode())
        digest.update(b"\0")
        digest.update(state.formulation.encode())
        digest.update(b"\0")
        for name, field in zip(_STATE_FIELDS, _state_fields(state)):
            array = np.ascontiguousarray(field)
            digest.update(name.encode())
            digest.update(b"\0")
            digest.update(str(array.dtype).encode())
            digest.update(b"\0")
            digest.update(repr(array.shape).encode())
            digest.update(b"\0")
            digest.update(array.tobytes(order="C"))
    return digest.hexdigest()


def advance_two_level_periodic_amr(
    state: BSSNState3D,
    dt: float,
    *,
    coarse_steps: int = 1,
    refinement_ratio: int = 2,
    gauge: GaugeConfig = GaugeConfig(),
    ccz4: CCZ4Config = CCZ4Config(),
    project_algebraic: bool = True,
) -> AMRSubcycleReport3D:
    """Advance a periodic coarse/fine pair with deterministic subcycling.

    The fine level takes ``refinement_ratio`` steps for every coarse step and
    starts from periodic trilinear prolongation.  Both levels use the existing
    reference RK4 method and optional algebraic projection at every RK stage.
    At the common physical time, the fine state is volume-restricted and
    algebraically projected to form the synchronized coarse state.  No
    conservative fluxes, ghost-zone exchange, adaptive tagging, or excision
    are performed.
    """

    if state.grid.boundary != "periodic" or not np.all(state.valid_mask):
        raise ValueError("two-level AMR subcycling requires a fully valid periodic state")
    if not isinstance(refinement_ratio, int) or refinement_ratio < 2:
        raise ValueError("refinement_ratio must be an integer of at least two")
    if not isinstance(coarse_steps, int) or coarse_steps < 1:
        raise ValueError("coarse_steps must be a positive integer")
    coarse_dt = float(dt)
    if not math.isfinite(coarse_dt) or coarse_dt <= 0.0:
        raise ValueError("dt must be finite and positive")

    fine_dt = coarse_dt / refinement_ratio
    fine_steps = coarse_steps * refinement_ratio
    fine_initial = prolongate_periodic_state(state, refinement_ratio)

    if state.formulation == "ccz4":
        coarse_final = advance_ccz4_rk4_3d(
            state,
            coarse_dt,
            steps=coarse_steps,
            ccz4=ccz4,
            gauge=gauge,
            project_algebraic=project_algebraic,
        )
        fine_final = advance_ccz4_rk4_3d(
            fine_initial,
            fine_dt,
            steps=fine_steps,
            ccz4=ccz4,
            gauge=gauge,
            project_algebraic=project_algebraic,
        )
    elif state.formulation == "bssnok":
        coarse_final = advance_bssn_rk4_3d(
            state,
            coarse_dt,
            steps=coarse_steps,
            gauge=gauge,
            project_algebraic=project_algebraic,
        )
        fine_final = advance_bssn_rk4_3d(
            fine_initial,
            fine_dt,
            steps=fine_steps,
            gauge=gauge,
            project_algebraic=project_algebraic,
        )
    else:  # pragma: no cover - BSSNState3D validates this invariant.
        raise ValueError(f"unsupported formulation: {state.formulation}")

    restricted_fine = restrict_periodic_state(fine_final, refinement_ratio)
    pre_sync_l2, pre_sync_l_inf = _state_difference_norms(coarse_final, restricted_fine)
    synchronized_metadata = dict(restricted_fine.metadata)
    synchronized_metadata.update(
        {
            "amr_subcycling": "two-level-periodic-shadow",
            "amr_refinement_ratio": str(refinement_ratio),
            "amr_coarse_steps": str(coarse_steps),
            "amr_fine_steps": str(fine_steps),
            "amr_sync": "periodic-node-full-weighting-algebraic-projection",
            "amr_reflux": "false",
        }
    )
    restricted_fine.metadata = synchronized_metadata
    physical_time = float(coarse_dt * coarse_steps)
    return AMRSubcycleReport3D(
        formulation=state.formulation,
        refinement_ratio=refinement_ratio,
        coarse_steps=coarse_steps,
        fine_steps=fine_steps,
        coarse_dt=coarse_dt,
        fine_dt=fine_dt,
        physical_time=physical_time,
        pre_sync_l2=pre_sync_l2,
        pre_sync_l_inf=pre_sync_l_inf,
        coarse_state=coarse_final,
        fine_state=fine_final,
        synchronized_coarse_state=restricted_fine,
        synchronization="periodic-node-full-weighting-algebraic-projection",
        reflux_applied=False,
        state_sha256=_state_sha256(
            coarse_final,
            fine_final,
            restricted_fine,
            refinement_ratio=refinement_ratio,
            coarse_steps=coarse_steps,
            coarse_dt=coarse_dt,
        ),
    )


__all__ = ["AMRSubcycleReport3D", "advance_two_level_periodic_amr"]
