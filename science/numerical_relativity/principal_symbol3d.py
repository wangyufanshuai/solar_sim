"""Numerical principal-symbol audit for the 3-D CCZ4/BSSN shadow RHS.

The current boundary operators use analytic speed proxies.  This module
linearizes the actual discrete periodic RHS around Minkowski with a small
Fourier perturbation, builds the complex mode matrix, and reports its phase
speeds.  It is a formulation/discretization audit, not a replacement for a
first-order reduction, a symmetrizer, or a constraint-preserving boundary
proof.  In particular, no eigenvectors are exported as production boundary
data and all physical-validation flags remain false.
"""

from __future__ import annotations

from dataclasses import dataclass
import hashlib
import math
from typing import Literal

import numpy as np

from .bssn3d import bssn_rhs_3d
from .ccz4_3d import ccz4_rhs_3d
from .ccz4_reference import GaugeConfig
from .constraints3d import constraint_report_3d
from .nr3d import BSSNState3D, Grid3D


Formulation3D = Literal["ccz4", "bssnok"]


_SLOT_LAYOUT: tuple[tuple[str, tuple[int, ...] | None], ...] = (
    ("chi", None),
    ("h", (0, 0)),
    ("h", (0, 1)),
    ("h", (0, 2)),
    ("h", (1, 1)),
    ("h", (1, 2)),
    ("h", (2, 2)),
    ("trace_k", None),
    ("a", (0, 0)),
    ("a", (0, 1)),
    ("a", (0, 2)),
    ("a", (1, 1)),
    ("a", (1, 2)),
    ("a", (2, 2)),
    ("theta", None),
    ("conformal_gamma", (0,)),
    ("conformal_gamma", (1,)),
    ("conformal_gamma", (2,)),
    ("lapse", None),
    ("shift", (0,)),
    ("shift", (1,)),
    ("shift", (2,)),
    ("b", (0,)),
    ("b", (1,)),
    ("b", (2,)),
)


@dataclass(frozen=True)
class PrincipalSymbolReport3D:
    """Auditable eigenvalue summary of one discrete Fourier mode."""

    formulation: Formulation3D
    points: int
    harmonic: int
    amplitude: float
    wave_number: float
    effective_wave_number: float
    mode_count: int
    phase_speeds: tuple[float, ...]
    zero_speed_count: int
    max_abs_phase_speed: float
    max_real_eigenvalue_abs: float
    eigenvector_rank: int
    eigenvector_condition_number: float
    constraint_mode_response: tuple[float, ...]
    constraint_mode_count: int
    incoming_constraint_mode_count: int
    outgoing_constraint_mode_count: int
    constraint_map_rank: int
    max_constraint_response: float
    constraint_response_threshold: float
    constraint_map_sha256: str
    expected_speed_errors: dict[str, float]
    symbol_sha256: str
    eigenvector_sha256: str
    method: str
    eigenvectors_available: bool
    physical_boundary_validated: bool
    constraint_preserving_validated: bool


def _clone_state(state: BSSNState3D) -> BSSNState3D:
    return BSSNState3D(
        grid=state.grid,
        chi=state.chi.copy(),
        h=state.h.copy(),
        trace_k=state.trace_k.copy(),
        a=state.a.copy(),
        theta=state.theta.copy(),
        conformal_gamma=state.conformal_gamma.copy(),
        lapse=state.lapse.copy(),
        shift=state.shift.copy(),
        b=state.b.copy(),
        valid_mask=state.valid_mask.copy(),
        formulation=state.formulation,
        metadata=dict(state.metadata),
    )


def _rhs_slots(state: BSSNState3D, gauge: GaugeConfig) -> tuple[np.ndarray, ...]:
    if state.formulation == "ccz4":
        rhs = ccz4_rhs_3d(state, gauge=gauge, boundary_mode="sommerfeld")
    else:
        rhs = bssn_rhs_3d(state, gauge=gauge, boundary_mode="sommerfeld")
    return (
        rhs.chi,
        rhs.h[..., 0, 0],
        rhs.h[..., 0, 1],
        rhs.h[..., 0, 2],
        rhs.h[..., 1, 1],
        rhs.h[..., 1, 2],
        rhs.h[..., 2, 2],
        rhs.trace_k,
        rhs.a[..., 0, 0],
        rhs.a[..., 0, 1],
        rhs.a[..., 0, 2],
        rhs.a[..., 1, 1],
        rhs.a[..., 1, 2],
        rhs.a[..., 2, 2],
        rhs.theta,
        rhs.conformal_gamma[..., 0],
        rhs.conformal_gamma[..., 1],
        rhs.conformal_gamma[..., 2],
        rhs.lapse,
        rhs.shift[..., 0],
        rhs.shift[..., 1],
        rhs.shift[..., 2],
        rhs.b[..., 0],
        rhs.b[..., 1],
        rhs.b[..., 2],
    )


def _constraint_slots(state: BSSNState3D) -> tuple[np.ndarray, ...]:
    report = constraint_report_3d(state)
    return (
        report.hamiltonian,
        report.momentum[..., 0],
        report.momentum[..., 1],
        report.momentum[..., 2],
        report.det_h_minus_one,
        report.trace_a,
        report.conformal_gamma[..., 0],
        report.conformal_gamma[..., 1],
        report.conformal_gamma[..., 2],
        report.theta,
    )


def _add_mode(state: BSSNState3D, slot: int, mode: np.ndarray) -> None:
    name, component = _SLOT_LAYOUT[slot]
    field = np.asarray(getattr(state, name))
    if component is None:
        field[...] += mode
        return
    if len(component) == 1:
        field[..., component[0]] += mode
        return
    first, second = component
    field[..., first, second] += mode
    if first != second:
        field[..., second, first] += mode


def _active_slots(formulation: Formulation3D) -> tuple[int, ...]:
    if formulation == "ccz4":
        return tuple(range(len(_SLOT_LAYOUT)))
    # BSSNOK keeps Theta identically zero and the RHS rejects nonzero Theta.
    return tuple(slot for slot in range(len(_SLOT_LAYOUT)) if slot != 14)


def linearized_principal_symbol_3d(
    formulation: Formulation3D = "ccz4",
    *,
    points: int = 12,
    harmonic: int = 1,
    amplitude: float = 1.0e-7,
    gauge: GaugeConfig = GaugeConfig(theta_coupling=2.0),
) -> PrincipalSymbolReport3D:
    """Return the discrete Fourier principal-symbol audit around Minkowski."""

    if formulation not in ("ccz4", "bssnok"):
        raise ValueError("formulation must be 'ccz4' or 'bssnok'")
    if not isinstance(points, int) or points < 8:
        raise ValueError("points must be an integer of at least eight")
    if not isinstance(harmonic, int) or harmonic < 1 or harmonic >= points // 2:
        raise ValueError("harmonic must lie between one and the Nyquist limit")
    amplitude = float(amplitude)
    if not math.isfinite(amplitude) or amplitude <= 0.0:
        raise ValueError("amplitude must be finite and positive")

    grid = Grid3D(
        (points, points, points),
        (0.0, 0.0, 0.0),
        (2.0 * np.pi, 2.0 * np.pi, 2.0 * np.pi),
        boundary="periodic",
        spatial_order=2,
    )
    base = BSSNState3D.minkowski(grid, formulation=formulation)
    x = grid.coordinates[0]
    spacing = grid.spacing[0]
    wave_number = float(harmonic)
    effective_wave_number = float(np.sin(wave_number * spacing) / spacing)
    if effective_wave_number <= 0.0:
        raise ValueError("harmonic is too close to the Nyquist limit")
    mode = amplitude * np.cos(wave_number * x)
    fourier_factor = np.exp(-1j * wave_number * x)
    active = _active_slots(formulation)
    symbol = np.zeros((len(_SLOT_LAYOUT), len(_SLOT_LAYOUT)), dtype=np.complex128)
    for slot in active:
        perturbed = _clone_state(base)
        _add_mode(perturbed, slot, mode)
        projection = np.asarray(
            [np.mean(value * fourier_factor) for value in _rhs_slots(perturbed, gauge)],
            dtype=np.complex128,
        )
        symbol[:, slot] = projection / (0.5 * amplitude)

    active_symbol = symbol[np.ix_(active, active)]
    eigenvalues, eigenvectors = np.linalg.eig(active_symbol)
    phase_order = np.argsort(np.imag(eigenvalues) / effective_wave_number)
    eigenvalues = eigenvalues[phase_order]
    eigenvectors = eigenvectors[:, phase_order]
    phase_speeds = np.imag(eigenvalues) / effective_wave_number
    constraint_symbol = np.zeros((10, len(_SLOT_LAYOUT)), dtype=np.complex128)
    for slot in active:
        perturbed = _clone_state(base)
        _add_mode(perturbed, slot, mode)
        projection = np.asarray(
            [
                np.mean(value * fourier_factor)
                for value in _constraint_slots(perturbed)
            ],
            dtype=np.complex128,
        )
        constraint_symbol[:, slot] = projection / (0.5 * amplitude)
    active_constraint_symbol = constraint_symbol[:, active]
    constraint_response = np.linalg.norm(
        active_constraint_symbol @ eigenvectors,
        axis=0,
    )
    constraint_threshold = 1.0e-8
    constraint_modes = constraint_response > constraint_threshold
    expected = {
        "light": 1.0,
        "one-plus-log": math.sqrt(gauge.lapse_coefficient),
        "gamma-driver": math.sqrt(gauge.shift_coefficient),
    }
    errors = {
        name: float(np.min(np.abs(np.abs(phase_speeds) - target)))
        for name, target in expected.items()
    }
    digest = hashlib.sha256()
    digest.update(b"nr-k3-discrete-principal-symbol-v1\0")
    digest.update(formulation.encode("ascii"))
    digest.update(np.ascontiguousarray(active_symbol).tobytes(order="C"))
    eigenvector_digest = hashlib.sha256()
    eigenvector_digest.update(b"nr-k3-discrete-principal-eigenvectors-v1\0")
    eigenvector_digest.update(formulation.encode("ascii"))
    eigenvector_digest.update(np.ascontiguousarray(eigenvectors).tobytes(order="C"))
    constraint_digest = hashlib.sha256()
    constraint_digest.update(b"nr-k3-discrete-constraint-symbol-v1\0")
    constraint_digest.update(formulation.encode("ascii"))
    constraint_digest.update(
        np.ascontiguousarray(active_constraint_symbol).tobytes(order="C")
    )
    return PrincipalSymbolReport3D(
        formulation=formulation,
        points=points,
        harmonic=harmonic,
        amplitude=amplitude,
        wave_number=wave_number,
        effective_wave_number=effective_wave_number,
        mode_count=len(active),
        phase_speeds=tuple(float(value) for value in phase_speeds),
        zero_speed_count=int(np.count_nonzero(np.abs(phase_speeds) <= 1.0e-8)),
        max_abs_phase_speed=float(np.max(np.abs(phase_speeds))),
        max_real_eigenvalue_abs=float(np.max(np.abs(np.real(eigenvalues)))),
        eigenvector_rank=int(np.linalg.matrix_rank(eigenvectors)),
        eigenvector_condition_number=float(np.linalg.cond(eigenvectors)),
        constraint_mode_response=tuple(float(value) for value in constraint_response),
        constraint_mode_count=int(np.count_nonzero(constraint_modes)),
        incoming_constraint_mode_count=int(
            np.count_nonzero(constraint_modes & (phase_speeds < -1.0e-8))
        ),
        outgoing_constraint_mode_count=int(
            np.count_nonzero(constraint_modes & (phase_speeds > 1.0e-8))
        ),
        constraint_map_rank=int(np.linalg.matrix_rank(active_constraint_symbol)),
        max_constraint_response=float(np.max(constraint_response)),
        constraint_response_threshold=constraint_threshold,
        constraint_map_sha256=constraint_digest.hexdigest(),
        expected_speed_errors=errors,
        symbol_sha256=digest.hexdigest(),
        eigenvector_sha256=eigenvector_digest.hexdigest(),
        method="real-cosine-fourier-linearization-v1",
        eigenvectors_available=False,
        physical_boundary_validated=False,
        constraint_preserving_validated=False,
    )


__all__ = ["PrincipalSymbolReport3D", "linearized_principal_symbol_3d"]
