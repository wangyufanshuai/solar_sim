"""NR-K3a three-dimensional state and benchmark contracts.

This module deliberately starts with the parts that can be validated without
claiming a production 3-D evolution scheme: a full-tensor BSSN/CCZ4 state
container, an excision-aware isotropic Schwarzschild initial slice, AMR
hierarchy metadata, a spherical apparent-horizon benchmark, an ADM surface
mass benchmark, and an algebraic Weyl-to-``Psi4`` projection.  A 3-D method of
lines RHS and characteristic boundaries remain later K3 gates.  A bounded
uniform-grid star-shaped apparent-horizon shadow solver is included, but it is
not a production AMR/excision horizon finder.

Units are geometric (G = c = 1).  The state uses ``gamma_ij = chi**-1 h_ij``
and the same 25 variable names as the K1/K2 backends.
"""

from __future__ import annotations

from dataclasses import dataclass, field
import math
from typing import Any, Literal, Mapping, Sequence

import numpy as np

from .ccz4_reference import CCZ4_STATE_VARIABLES


Array = np.ndarray
Boundary3D = Literal["periodic", "excision", "sommerfeld", "schwarzschild-dirichlet", "sbp-volume"]


def _finite_array(value: Array, *, name: str) -> Array:
    result = np.asarray(value, dtype=np.float64)
    if result.size == 0 or not np.all(np.isfinite(result)):
        raise ValueError(f"{name} must be finite and non-empty")
    return result


@dataclass(frozen=True)
class Grid3D:
    """Uniform Cartesian grid metadata for the K3 contracts.

    ``spatial_order`` selects the periodic second- or fourth-order centered
    finite-difference stencil used by the reference RHS and diagnostics.
    Non-periodic operators remain explicitly second-order until their
    boundary closures are independently audited.
    """

    shape: tuple[int, int, int]
    lower: tuple[float, float, float]
    upper: tuple[float, float, float]
    boundary: Boundary3D = "excision"
    spatial_order: int = 2

    def __post_init__(self) -> None:
        if len(self.shape) != 3 or any(int(points) < 5 for points in self.shape):
            raise ValueError("Grid3D requires three point counts of at least five")
        if len(self.lower) != 3 or len(self.upper) != 3:
            raise ValueError("Grid3D bounds must contain three coordinates")
        if not all(math.isfinite(float(value)) for value in (*self.lower, *self.upper)):
            raise ValueError("Grid3D bounds must be finite")
        if any(hi <= lo for lo, hi in zip(self.lower, self.upper)):
            raise ValueError("Grid3D upper bounds must exceed lower bounds")
        if self.boundary not in ("periodic", "excision", "sommerfeld", "schwarzschild-dirichlet", "sbp-volume"):
            raise ValueError(f"unsupported Grid3D boundary: {self.boundary}")
        if self.spatial_order not in (2, 4):
            raise ValueError("Grid3D spatial_order must be 2 or 4")
        if self.boundary == "sbp-volume" and (
            self.spatial_order != 4 or any(type(n) is not int or n < 9 for n in self.shape)
        ):
            raise ValueError("SBP(4,2) volume requires order4 and at least9 integer nodes per axis")

    @property
    def spacing(self) -> tuple[float, float, float]:
        return tuple(
            (float(hi) - float(lo)) / (points if self.boundary == "periodic" else points - 1)
            for lo, hi, points in zip(self.lower, self.upper, self.shape)
        )

    @property
    def coordinates(self) -> tuple[Array, Array, Array]:
        axes = [
            np.linspace(
                lo,
                hi,
                points,
                endpoint=self.boundary != "periodic",
                dtype=np.float64,
            )
            for lo, hi, points in zip(self.lower, self.upper, self.shape)
        ]
        return tuple(np.meshgrid(*axes, indexing="ij"))  # type: ignore[return-value]


@dataclass
class BSSNState3D:
    """Full 25-slot BSSN/CCZ4 state on a Cartesian 3-D grid."""

    grid: Grid3D
    chi: Array
    h: Array
    trace_k: Array
    a: Array
    theta: Array
    conformal_gamma: Array
    lapse: Array
    shift: Array
    b: Array
    valid_mask: Array
    formulation: Literal["ccz4", "bssnok"] = "ccz4"
    metadata: Mapping[str, str] = field(default_factory=dict)

    def __post_init__(self) -> None:
        nx, ny, nz = self.grid.shape
        scalar_shape = (nx, ny, nz)
        expected = {
            "chi": scalar_shape,
            "h": (*scalar_shape, 3, 3),
            "trace_k": scalar_shape,
            "a": (*scalar_shape, 3, 3),
            "theta": scalar_shape,
            "conformal_gamma": (*scalar_shape, 3),
            "lapse": scalar_shape,
            "shift": (*scalar_shape, 3),
            "b": (*scalar_shape, 3),
            "valid_mask": scalar_shape,
        }
        for name, shape in expected.items():
            value = _finite_array(getattr(self, name), name=name)
            if value.shape != shape:
                raise ValueError(f"{name} must have shape {shape}, received {value.shape}")
            setattr(self, name, value)
        if self.formulation not in ("ccz4", "bssnok"):
            raise ValueError(f"unsupported formulation: {self.formulation}")
        mask = np.asarray(self.valid_mask, dtype=bool)
        if np.any(self.chi[mask] <= 0.0) or np.any(self.lapse[mask] <= 0.0):
            raise ValueError("chi and lapse must be positive on valid cells")
        if not np.allclose(self.h, np.swapaxes(self.h, -1, -2), rtol=0.0, atol=1.0e-13):
            raise ValueError("conformal metric h must be symmetric")
        if not np.allclose(self.a, np.swapaxes(self.a, -1, -2), rtol=0.0, atol=1.0e-13):
            raise ValueError("conformal extrinsic curvature A must be symmetric")
        self.valid_mask = mask

    @classmethod
    def minkowski(cls, grid: Grid3D, *, formulation: Literal["ccz4", "bssnok"] = "ccz4") -> "BSSNState3D":
        shape = grid.shape
        identity = np.broadcast_to(np.eye(3, dtype=np.float64), (*shape, 3, 3)).copy()
        zeros = np.zeros(shape, dtype=np.float64)
        vectors = np.zeros((*shape, 3), dtype=np.float64)
        return cls(
            grid=grid,
            chi=np.ones(shape, dtype=np.float64),
            h=identity,
            trace_k=zeros.copy(),
            a=np.zeros((*shape, 3, 3), dtype=np.float64),
            theta=zeros.copy(),
            conformal_gamma=vectors.copy(),
            lapse=np.ones(shape, dtype=np.float64),
            shift=vectors.copy(),
            b=vectors.copy(),
            valid_mask=np.ones(shape, dtype=bool),
            formulation=formulation,
        )

    @classmethod
    def gauge_wave(
        cls,
        grid: Grid3D,
        *,
        amplitude: float = 1.0e-2,
        wavelength: float = 1.0,
        phase: float = 0.0,
        time: float = 0.0,
        formulation: Literal["ccz4", "bssnok"] = "ccz4",
    ) -> "BSSNState3D":
        """Return the exact periodic 3-D gauge-wave slice at coordinate time.

        The spacetime is ``ds² = H(-dt² + dx²) + dy² + dz²`` with
        ``H = 1 - A sin(k (x - t) + phase)`` and ``k = 2π / wavelength``.
        The conformal variables, extrinsic curvature, lapse, and evolved
        connection are assembled analytically at the requested ``time``.
        This is a vacuum gauge-wave benchmark, not a black-hole or
        radiative-waveform initial data set.
        """

        if grid.boundary != "periodic":
            raise ValueError("the analytic gauge wave requires periodic boundaries")
        amplitude = float(amplitude)
        wavelength = float(wavelength)
        phase = float(phase)
        if not all(math.isfinite(value) for value in (amplitude, wavelength, phase)):
            raise ValueError("amplitude, wavelength, and phase must be finite")
        time = float(time)
        if not math.isfinite(time):
            raise ValueError("time must be finite")
        if wavelength <= 0.0 or abs(amplitude) >= 1.0:
            raise ValueError("wavelength must be positive and |amplitude| < 1")
        k = 2.0 * np.pi / wavelength
        x, _, _ = grid.coordinates
        argument = k * (x - time) + phase
        h_wave = 1.0 - amplitude * np.sin(argument)
        h_time = k * amplitude * np.cos(argument)
        state = cls.minkowski(grid, formulation=formulation)
        state.chi[:] = np.power(h_wave, -1.0 / 3.0)
        state.h[..., 0, 0] = np.power(h_wave, 2.0 / 3.0)
        state.h[..., 1, 1] = np.power(h_wave, -1.0 / 3.0)
        state.h[..., 2, 2] = np.power(h_wave, -1.0 / 3.0)
        state.trace_k[:] = -h_time / (2.0 * np.power(h_wave, 1.5))
        state.a[..., 0, 0] = -h_time / (3.0 * np.power(h_wave, 5.0 / 6.0))
        state.a[..., 1, 1] = h_time / (6.0 * np.power(h_wave, 11.0 / 6.0))
        state.a[..., 2, 2] = state.a[..., 1, 1]
        state.lapse[:] = np.sqrt(h_wave)
        state.conformal_gamma[..., 0] = (
            -(2.0 / 3.0) * k * amplitude * np.cos(argument) * np.power(h_wave, -5.0 / 3.0)
        )
        state.metadata = {
            "initial_data": "periodic-gauge-wave",
            "amplitude": f"{amplitude:.17g}",
            "wavelength": f"{wavelength:.17g}",
            "phase": f"{phase:.17g}",
            "time": f"{time:.17g}",
        }
        return state

    @classmethod
    def schwarzschild_isotropic(
        cls,
        grid: Grid3D,
        *,
        mass_length: float = 1.0,
        center: Sequence[float] = (0.0, 0.0, 0.0),
        excision_radius: float | None = None,
        excision_buffer_cells: int = 0,
        lapse_seed: Literal["schwarzschild", "psi-minus-two", "one"] = "schwarzschild",
        formulation: Literal["ccz4", "bssnok"] = "ccz4",
    ) -> "BSSNState3D":
        """Return time-symmetric isotropic Schwarzschild data with an explicit mask.

        The historical default masks the isotropic throat ``r <= M/2`` and
        uses the exact static Schwarzschild lapse on the valid exterior.  A
        dynamic moving-puncture shadow may instead choose an inner radius
        inside the horizon and ``lapse_seed='psi-minus-two'``; that seed stays
        positive and is deliberately recorded as a gauge seed rather than a
        claim of stationary Schwarzschild coordinates.
        """

        mass = float(mass_length)
        if not math.isfinite(mass) or mass <= 0.0:
            raise ValueError("mass_length must be finite and positive")
        if len(center) != 3 or not all(math.isfinite(float(value)) for value in center):
            raise ValueError("center must contain three finite coordinates")
        if excision_radius is None:
            inner_radius = 0.5 * mass
        else:
            inner_radius = float(excision_radius)
        if not math.isfinite(inner_radius) or inner_radius <= 0.0:
            raise ValueError("excision_radius must be finite and positive")
        if not isinstance(excision_buffer_cells, int) or excision_buffer_cells < 0:
            raise ValueError("excision_buffer_cells must be a non-negative integer")
        if lapse_seed not in ("schwarzschild", "psi-minus-two", "one"):
            raise ValueError("unsupported Schwarzschild lapse seed")
        coordinates = grid.coordinates
        radius = np.sqrt(sum((axis - float(origin)) ** 2 for axis, origin in zip(coordinates, center)))
        guard_radius = inner_radius + excision_buffer_cells * min(grid.spacing)
        if lapse_seed == "schwarzschild" and guard_radius < 0.5 * mass:
            raise ValueError(
                "the exact Schwarzschild lapse requires the excision guard to contain r=M/2; "
                "use lapse_seed='psi-minus-two' for a moving-puncture shadow"
            )
        valid_mask = radius > guard_radius
        state = cls.minkowski(grid, formulation=formulation)
        psi = np.ones(grid.shape, dtype=np.float64)
        psi[valid_mask] = 1.0 + 0.5 * mass / radius[valid_mask]
        state.chi[:] = np.power(psi, -4.0)
        if lapse_seed == "schwarzschild":
            state.lapse[valid_mask] = (
                1.0 - 0.5 * mass / radius[valid_mask]
            ) / psi[valid_mask]
        elif lapse_seed == "psi-minus-two":
            safe_radius = np.maximum(radius, guard_radius)
            positive_psi = 1.0 + 0.5 * mass / safe_radius
            state.lapse[:] = np.power(positive_psi, -2.0)
        else:
            state.lapse[:] = 1.0
        state.valid_mask[:] = valid_mask
        state.metadata = {
            "initial_data": "time-symmetric-isotropic-schwarzschild",
            "mass_length": f"{mass:.17g}",
            "center": ",".join(f"{float(value):.17g}" for value in center),
            "excision": f"cells at r <= {guard_radius:.17g} are masked and not evolved",
            "excision_guard_radius": f"{guard_radius:.17g}",
            "excision_radius": f"{inner_radius:.17g}",
            "excision_buffer_cells": str(excision_buffer_cells),
            "lapse_seed": lapse_seed,
        }
        return state

    @classmethod
    def brill_lindquist_two_puncture(
        cls,
        grid: Grid3D,
        *,
        masses: Sequence[float] = (1.0, 1.0),
        centers: Sequence[Sequence[float]] = ((-0.75, 0.0, 0.0), (0.75, 0.0, 0.0)),
        excision_radius: float = 0.15,
        excision_buffer_cells: int = 2,
        lapse_seed: Literal["one", "psi-minus-two"] = "psi-minus-two",
        formulation: Literal["ccz4", "bssnok"] = "ccz4",
    ) -> "BSSNState3D":
        """Return time-symmetric Brill--Lindquist two-puncture data.

        The conformal metric is flat and
        ``psi = 1 + m1/(2 r1) + m2/(2 r2)`` outside two masked puncture
        balls plus a finite-difference guard band.  ``K`` and ``A_ij`` are zero, so the continuum momentum
        constraint vanishes and the Hamiltonian constraint is the harmonic
        conformal-factor equation away from the punctures.  The lapse is a
        positive gauge seed, not an equilibrium binary lapse; no orbital
        momentum or binding-energy claim is implied by this initializer.
        """

        if grid.boundary == "periodic":
            raise ValueError("Brill-Lindquist punctures require a non-periodic grid")
        if len(masses) != 2 or len(centers) != 2:
            raise ValueError("exactly two puncture masses and centers are required")
        mass_values = tuple(float(value) for value in masses)
        center_values = tuple(
            tuple(float(component) for component in center) for center in centers
        )
        if any(not math.isfinite(value) or value <= 0.0 for value in mass_values):
            raise ValueError("puncture masses must be finite and positive")
        if any(len(center) != 3 or not all(math.isfinite(value) for value in center)
               for center in center_values):
            raise ValueError("puncture centers must contain three finite coordinates")
        radius = float(excision_radius)
        if not math.isfinite(radius) or radius <= 0.0:
            raise ValueError("excision_radius must be finite and positive")
        if not isinstance(excision_buffer_cells, int) or excision_buffer_cells < 0:
            raise ValueError("excision_buffer_cells must be a non-negative integer")
        if lapse_seed not in ("one", "psi-minus-two"):
            raise ValueError("unsupported Brill-Lindquist lapse seed")
        coordinates = grid.coordinates
        distances = [
            np.sqrt(
                sum((coordinate_axis - center_axis) ** 2
                    for coordinate_axis, center_axis in zip(coordinates, center))
            )
            for center in center_values
        ]
        # Keep masked puncture cells finite so the state remains serializable;
        # their values are never admitted to constraint norms or evolution.
        safe_distances = [np.maximum(distance, radius) for distance in distances]
        psi = np.ones(grid.shape, dtype=np.float64)
        for mass, distance in zip(mass_values, safe_distances):
            psi += 0.5 * mass / distance
        guard_radius = radius + excision_buffer_cells * min(grid.spacing)
        valid_mask = np.logical_and.reduce([distance > guard_radius for distance in distances])
        state = cls.minkowski(grid, formulation=formulation)
        state.chi[:] = np.power(psi, -4.0)
        if lapse_seed == "psi-minus-two":
            state.lapse[:] = np.power(psi, -2.0)
        state.valid_mask[:] = valid_mask
        state.metadata = {
            "initial_data": "time-symmetric-brill-lindquist-two-puncture",
            "masses": ",".join(f"{value:.17g}" for value in mass_values),
            "centers": ";".join(
                ",".join(f"{component:.17g}" for component in center)
                for center in center_values
            ),
            "excision_radius": f"{radius:.17g}",
            "excision_buffer_cells": str(excision_buffer_cells),
            "lapse_seed": lapse_seed,
            "momentum": "zero-time-symmetric-no-orbital-momentum",
            "excision": "cells within each puncture ball are masked and not evolved",
        }
        return state

    @property
    def variable_names(self) -> tuple[str, ...]:
        return CCZ4_STATE_VARIABLES

    @property
    def valid_cell_count(self) -> int:
        return int(np.count_nonzero(self.valid_mask))


@dataclass(frozen=True)
class AMRLevel3D:
    """Deterministic AMR level metadata for the periodic shadow contracts."""

    level: int
    shape: tuple[int, int, int]
    lower: tuple[float, float, float]
    upper: tuple[float, float, float]
    refinement_ratio: int
    spatial_order: int = 2

    def __post_init__(self) -> None:
        if self.level < 0 or any(points < 5 for points in self.shape):
            raise ValueError("AMR level and shape are invalid")
        if self.refinement_ratio < 1:
            raise ValueError("refinement_ratio must be positive")
        if self.spatial_order not in (2, 4):
            raise ValueError("AMR level spatial_order must be 2 or 4")


@dataclass(frozen=True)
class AMRHierarchy3D:
    """Nested Cartesian hierarchy contract shared by future CPU/GPU backends."""

    levels: tuple[AMRLevel3D, ...]

    def __post_init__(self) -> None:
        if not self.levels or self.levels[0].level != 0:
            raise ValueError("AMR hierarchy must start at level zero")
        for previous, current in zip(self.levels, self.levels[1:]):
            if current.level != previous.level + 1:
                raise ValueError("AMR levels must be contiguous")
            if current.refinement_ratio < 2:
                raise ValueError("refined levels require ratio >= 2")

    @classmethod
    def from_grid(cls, grid: Grid3D, *, levels: int = 1, refinement_ratio: int = 2) -> "AMRHierarchy3D":
        if levels < 1 or refinement_ratio < 2:
            raise ValueError("levels >= 1 and refinement_ratio >= 2 are required")
        shape = grid.shape
        entries = [AMRLevel3D(0, shape, grid.lower, grid.upper, 1, grid.spatial_order)]
        for level in range(1, levels):
            if grid.boundary == "periodic":
                shape = tuple(points * refinement_ratio for points in shape)
            else:
                shape = tuple((points - 1) * refinement_ratio + 1 for points in shape)
            entries.append(
                AMRLevel3D(
                    level,
                    shape,
                    grid.lower,
                    grid.upper,
                    refinement_ratio,
                    grid.spatial_order,
                )
            )
        return cls(tuple(entries))


def prolongate_periodic_trilinear(values: Array, refinement_ratio: int = 2) -> Array:
    """Prolong a periodic cell-centered field with deterministic trilinear weights.

    The first three axes are the Cartesian grid axes; any remaining axes are
    treated as component axes (for example the 25 state slots).  Periodic
    wrapping is explicit, so the operator does not silently consume a ghost
    cell or an endpoint duplicated at the upper bound.  This is a transfer
    operator contract only: it does not perform refluxing or evolve an AMR
    hierarchy.
    """

    data = _finite_array(values, name="values")
    if data.ndim < 3:
        raise ValueError("values must have at least three grid axes")
    if not isinstance(refinement_ratio, int) or refinement_ratio < 2:
        raise ValueError("refinement_ratio must be an integer of at least two")
    coarse_shape = data.shape[:3]
    if any(points < 2 for points in coarse_shape):
        raise ValueError("each coarse grid axis must contain at least two points")

    fine_axes = [np.arange(points * refinement_ratio, dtype=np.float64) for points in coarse_shape]
    # Cell centers live at (i + 1/2) h.  Express each fine center in coarse
    # index units; the half-cell offset makes restriction conservative and
    # removes the O(h) bias that results from interpolating at a coarse node.
    coarse_coordinates = [
        (axis + 0.5) / refinement_ratio - 0.5 for axis in fine_axes
    ]
    coarse_indices = [np.floor(coordinate).astype(np.int64) for coordinate in coarse_coordinates]
    fractions = [coordinate - np.floor(coordinate) for coordinate in coarse_coordinates]
    fine_shape = tuple(points * refinement_ratio for points in coarse_shape)
    result = np.zeros((*fine_shape, *data.shape[3:]), dtype=np.float64)
    trailing = (None,) * (data.ndim - 3)
    for offset_x in (0, 1):
        weight_x = (1.0 - fractions[0]) if offset_x == 0 else fractions[0]
        index_x = (coarse_indices[0] + offset_x) % coarse_shape[0]
        for offset_y in (0, 1):
            weight_y = (1.0 - fractions[1]) if offset_y == 0 else fractions[1]
            index_y = (coarse_indices[1] + offset_y) % coarse_shape[1]
            for offset_z in (0, 1):
                weight_z = (1.0 - fractions[2]) if offset_z == 0 else fractions[2]
                index_z = (coarse_indices[2] + offset_z) % coarse_shape[2]
                weight = (
                    weight_x[:, None, None]
                    * weight_y[None, :, None]
                    * weight_z[None, None, :]
                )
                result += data[np.ix_(index_x, index_y, index_z)] * weight[(...,) + trailing]
    return result


def restrict_periodic_volume_average(values: Array, refinement_ratio: int = 2) -> Array:
    """Restrict a periodic fine field by exact Cartesian block averaging."""

    data = _finite_array(values, name="values")
    if data.ndim < 3:
        raise ValueError("values must have at least three grid axes")
    if not isinstance(refinement_ratio, int) or refinement_ratio < 2:
        raise ValueError("refinement_ratio must be an integer of at least two")
    fine_shape = data.shape[:3]
    if any(points % refinement_ratio != 0 for points in fine_shape):
        raise ValueError("fine grid axes must be divisible by refinement_ratio")
    coarse_shape = tuple(points // refinement_ratio for points in fine_shape)
    reshaped = data.reshape(
        coarse_shape[0], refinement_ratio,
        coarse_shape[1], refinement_ratio,
        coarse_shape[2], refinement_ratio,
        *data.shape[3:],
    )
    return reshaped.mean(axis=(1, 3, 5), dtype=np.float64)


def _prolongate_periodic_nodal_trilinear(values: Array, refinement_ratio: int = 2) -> Array:
    """Prolong values sampled at periodic Cartesian nodes.

    ``Grid3D`` periodic coordinates are node-centered (``x_i = i h``), so a
    state transfer must align fine node ``j`` with coarse index ``j/r``.
    This private variant is kept separate from the historical cell-centered
    generic transfer above so existing scalar contracts remain explicit.
    """

    data = _finite_array(values, name="values")
    if data.ndim < 3:
        raise ValueError("values must have at least three grid axes")
    if not isinstance(refinement_ratio, int) or refinement_ratio < 2:
        raise ValueError("refinement_ratio must be an integer of at least two")
    coarse_shape = data.shape[:3]
    if any(points < 2 for points in coarse_shape):
        raise ValueError("each coarse grid axis must contain at least two points")

    fine_axes = [np.arange(points * refinement_ratio, dtype=np.float64) for points in coarse_shape]
    coarse_coordinates = [axis / refinement_ratio for axis in fine_axes]
    coarse_indices = [np.floor(coordinate).astype(np.int64) for coordinate in coarse_coordinates]
    fractions = [coordinate - np.floor(coordinate) for coordinate in coarse_coordinates]
    fine_shape = tuple(points * refinement_ratio for points in coarse_shape)
    result = np.zeros((*fine_shape, *data.shape[3:]), dtype=np.float64)
    trailing = (None,) * (data.ndim - 3)
    for offset_x in (0, 1):
        weight_x = (1.0 - fractions[0]) if offset_x == 0 else fractions[0]
        index_x = (coarse_indices[0] + offset_x) % coarse_shape[0]
        for offset_y in (0, 1):
            weight_y = (1.0 - fractions[1]) if offset_y == 0 else fractions[1]
            index_y = (coarse_indices[1] + offset_y) % coarse_shape[1]
            for offset_z in (0, 1):
                weight_z = (1.0 - fractions[2]) if offset_z == 0 else fractions[2]
                index_z = (coarse_indices[2] + offset_z) % coarse_shape[2]
                weight = (
                    weight_x[:, None, None]
                    * weight_y[None, :, None]
                    * weight_z[None, None, :]
                )
                result += data[np.ix_(index_x, index_y, index_z)] * weight[(...,) + trailing]
    return result


def restrict_periodic_full_weighting(values: Array, refinement_ratio: int = 2) -> Array:
    """Restrict node-centered periodic data with a second-order stencil.

    Coarse nodes map to aligned fine nodes ``i*r``.  The tensor-product
    weights ``(1/4, 1/2, 1/4)`` around that node give a constant-preserving,
    periodic, second-order full-weighting operator for any integer ratio.
    It is the transfer used by BSSN/CCZ4 state synchronization; the older
    ``restrict_periodic_volume_average`` remains available for cell-centered
    scalar contracts.
    """

    data = _finite_array(values, name="values")
    if data.ndim < 3:
        raise ValueError("values must have at least three grid axes")
    if not isinstance(refinement_ratio, int) or refinement_ratio < 2:
        raise ValueError("refinement_ratio must be an integer of at least two")
    fine_shape = data.shape[:3]
    if any(points % refinement_ratio != 0 for points in fine_shape):
        raise ValueError("fine grid axes must be divisible by refinement_ratio")
    coarse_shape = tuple(points // refinement_ratio for points in fine_shape)
    aligned = [np.arange(points, dtype=np.int64) * refinement_ratio for points in coarse_shape]
    weights = (0.25, 0.5, 0.25)
    result = np.zeros((*coarse_shape, *data.shape[3:]), dtype=np.float64)
    for offset_x, weight_x in zip((-1, 0, 1), weights):
        index_x = (aligned[0] + offset_x) % fine_shape[0]
        for offset_y, weight_y in zip((-1, 0, 1), weights):
            index_y = (aligned[1] + offset_y) % fine_shape[1]
            for offset_z, weight_z in zip((-1, 0, 1), weights):
                index_z = (aligned[2] + offset_z) % fine_shape[2]
                weight = weight_x * weight_y * weight_z
                result += weight * data[np.ix_(index_x, index_y, index_z)]
    return result


def _project_bssn_algebraic_constraints(h: Array, a: Array) -> tuple[Array, Array]:
    """Restore unit conformal determinant and trace-free ``A_ij`` after transfer."""

    determinant = np.linalg.det(h)
    if np.any(determinant <= 0.0) or not np.all(np.isfinite(determinant)):
        raise ValueError("AMR transfer produced a non-positive conformal metric")
    projected_h = h * np.power(determinant, -1.0 / 3.0)[..., None, None]
    inverse = np.linalg.inv(projected_h)
    trace_a = np.einsum("...ij,...ij->...", inverse, a)
    projected_a = a - projected_h * trace_a[..., None, None] / 3.0
    return projected_h, projected_a


def project_algebraic_constraints_3d(state: BSSNState3D) -> BSSNState3D:
    """Return a state projected onto the two algebraic BSSN constraints."""

    projected_h, projected_a = _project_bssn_algebraic_constraints(
        state.h.copy(), state.a.copy()
    )
    return BSSNState3D(
        grid=state.grid,
        chi=state.chi.copy(),
        h=projected_h,
        trace_k=state.trace_k.copy(),
        a=projected_a,
        theta=state.theta.copy(),
        conformal_gamma=state.conformal_gamma.copy(),
        lapse=state.lapse.copy(),
        shift=state.shift.copy(),
        b=state.b.copy(),
        valid_mask=state.valid_mask.copy(),
        formulation=state.formulation,
        metadata=dict(state.metadata),
    )


def prolongate_periodic_state(
    state: BSSNState3D,
    refinement_ratio: int = 2,
) -> BSSNState3D:
    """Prolong a fully valid periodic BSSN/CCZ4 state to a finer level.

    The transfer is deterministic and node-aligned with the periodic
    ``Grid3D`` coordinates.  Algebraic BSSN constraints are projected after
    interpolation; no differential constraint
    projection, refluxing, or time subcycling is implied.
    """

    if state.grid.boundary != "periodic" or not np.all(state.valid_mask):
        raise ValueError("state prolongation requires a fully valid periodic state")
    if not isinstance(refinement_ratio, int) or refinement_ratio < 2:
        raise ValueError("refinement_ratio must be an integer of at least two")
    fine_grid = Grid3D(
        tuple(points * refinement_ratio for points in state.grid.shape),
        state.grid.lower,
        state.grid.upper,
        boundary="periodic",
        spatial_order=state.grid.spatial_order,
    )
    fine_chi = _prolongate_periodic_nodal_trilinear(state.chi, refinement_ratio)
    fine_h, fine_a = _project_bssn_algebraic_constraints(
        _prolongate_periodic_nodal_trilinear(state.h, refinement_ratio),
        _prolongate_periodic_nodal_trilinear(state.a, refinement_ratio),
    )
    fine_trace_k = _prolongate_periodic_nodal_trilinear(state.trace_k, refinement_ratio)
    fine_theta = _prolongate_periodic_nodal_trilinear(state.theta, refinement_ratio)
    fine_gamma = _prolongate_periodic_nodal_trilinear(state.conformal_gamma, refinement_ratio)
    fine_lapse = _prolongate_periodic_nodal_trilinear(state.lapse, refinement_ratio)
    fine_shift = _prolongate_periodic_nodal_trilinear(state.shift, refinement_ratio)
    fine_b = _prolongate_periodic_nodal_trilinear(state.b, refinement_ratio)
    if np.any(fine_chi <= 0.0) or np.any(fine_lapse <= 0.0):
        raise ValueError("AMR prolongation produced non-positive chi or lapse")
    metadata = dict(state.metadata)
    metadata.update({
        "amr_transfer": "periodic-trilinear-nodal-prolongation-algebraic-projection",
        "amr_parent_shape": ",".join(str(points) for points in state.grid.shape),
    })
    return BSSNState3D(
        grid=fine_grid,
        chi=fine_chi,
        h=fine_h,
        trace_k=fine_trace_k,
        a=fine_a,
        theta=fine_theta,
        conformal_gamma=fine_gamma,
        lapse=fine_lapse,
        shift=fine_shift,
        b=fine_b,
        valid_mask=np.ones(fine_grid.shape, dtype=bool),
        formulation=state.formulation,
        metadata=metadata,
    )


def restrict_periodic_state(
    state: BSSNState3D,
    refinement_ratio: int = 2,
) -> BSSNState3D:
    """Restrict a fully valid periodic BSSN/CCZ4 state to a coarser level.

    Node-centered full weighting is used rather than cell-centered block
    averaging, so coarse and fine states represent the same periodic nodes.
    """

    if state.grid.boundary != "periodic" or not np.all(state.valid_mask):
        raise ValueError("state restriction requires a fully valid periodic state")
    if not isinstance(refinement_ratio, int) or refinement_ratio < 2:
        raise ValueError("refinement_ratio must be an integer of at least two")
    if any(points % refinement_ratio != 0 for points in state.grid.shape):
        raise ValueError("fine state axes must be divisible by refinement_ratio")
    coarse_grid = Grid3D(
        tuple(points // refinement_ratio for points in state.grid.shape),
        state.grid.lower,
        state.grid.upper,
        boundary="periodic",
        spatial_order=state.grid.spatial_order,
    )
    coarse_chi = restrict_periodic_full_weighting(state.chi, refinement_ratio)
    coarse_h, coarse_a = _project_bssn_algebraic_constraints(
        restrict_periodic_full_weighting(state.h, refinement_ratio),
        restrict_periodic_full_weighting(state.a, refinement_ratio),
    )
    coarse_trace_k = restrict_periodic_full_weighting(state.trace_k, refinement_ratio)
    coarse_theta = restrict_periodic_full_weighting(state.theta, refinement_ratio)
    coarse_gamma = restrict_periodic_full_weighting(state.conformal_gamma, refinement_ratio)
    coarse_lapse = restrict_periodic_full_weighting(state.lapse, refinement_ratio)
    coarse_shift = restrict_periodic_full_weighting(state.shift, refinement_ratio)
    coarse_b = restrict_periodic_full_weighting(state.b, refinement_ratio)
    if np.any(coarse_chi <= 0.0) or np.any(coarse_lapse <= 0.0):
        raise ValueError("AMR restriction produced non-positive chi or lapse")
    metadata = dict(state.metadata)
    metadata.update({
        "amr_transfer": "periodic-volume-full-weighting-algebraic-projection",
        "amr_parent_shape": ",".join(str(points) for points in state.grid.shape),
    })
    return BSSNState3D(
        grid=coarse_grid,
        chi=coarse_chi,
        h=coarse_h,
        trace_k=coarse_trace_k,
        a=coarse_a,
        theta=coarse_theta,
        conformal_gamma=coarse_gamma,
        lapse=coarse_lapse,
        shift=coarse_shift,
        b=coarse_b,
        valid_mask=np.ones(coarse_grid.shape, dtype=bool),
        formulation=state.formulation,
        metadata=metadata,
    )


@dataclass(frozen=True)
class ApparentHorizonResult:
    radius: float
    expansion: float
    mass_length: float
    method: str
    passed: bool


@dataclass(frozen=True)
class StateApparentHorizonResult:
    """Coordinate-sphere apparent-horizon diagnostic on an evolved state."""

    radius: float
    expansion: float
    expansion_l2: float
    angular_std: float
    iterations: int
    method: str
    passed: bool


@dataclass(frozen=True)
class StarShapedApparentHorizonResult:
    """Damped-Newton result for a sampled star-shaped apparent horizon.

    The radial graph is represented on cell-centered angular samples.  The
    expansion uses a level-set normal and a finite-difference divergence of
    the physical normal, so the result is a genuine non-spherical surface
    diagnostic rather than a collection of independent coordinate spheres.
    It remains a uniform-grid shadow solver: AMR ghost filling, excision
    boundary closures, and a production fast-flow preconditioner are separate
    gates.
    """

    center: tuple[float, float, float]
    theta: Array
    phi: Array
    radii: Array
    expansion: Array
    mean_expansion: float
    expansion_l2: float
    angular_std: float
    iterations: int
    method: str
    passed: bool


def schwarzschild_spherical_expansion(radius: float, mass_length: float = 1.0) -> float:
    """Expansion of a coordinate sphere on a time-symmetric isotropic slice."""

    r = float(radius)
    mass = float(mass_length)
    if not math.isfinite(r) or r <= 0.0 or not math.isfinite(mass) or mass <= 0.0:
        raise ValueError("radius and mass_length must be finite and positive")
    psi = 1.0 + 0.5 * mass / r
    return 2.0 * (1.0 - 0.5 * mass / r) / (r * psi**3)


def find_schwarzschild_apparent_horizon(
    mass_length: float = 1.0,
    *,
    bracket: tuple[float, float] | None = None,
    iterations: int = 80,
) -> ApparentHorizonResult:
    """Find the analytic spherical horizon root by deterministic bisection."""

    mass = float(mass_length)
    if not math.isfinite(mass) or mass <= 0.0:
        raise ValueError("mass_length must be finite and positive")
    # The apparent horizon is the inner boundary of the exterior isotropic
    # slice.  The root bracket intentionally samples the analytic expression
    # on the excised side; no evolved state is evaluated there.
    left, right = bracket or (0.25 * mass, 4.0 * mass)
    if left <= 0.0 or right <= left:
        raise ValueError("bracket must contain positive, ordered radii")
    f_left = schwarzschild_spherical_expansion(left, mass)
    f_right = schwarzschild_spherical_expansion(right, mass)
    if f_left * f_right >= 0.0:
        raise ValueError("bracket must straddle the apparent-horizon expansion root")
    for _ in range(iterations):
        middle = 0.5 * (left + right)
        f_middle = schwarzschild_spherical_expansion(middle, mass)
        if f_left * f_middle <= 0.0:
            right, f_right = middle, f_middle
        else:
            left, f_left = middle, f_middle
    radius = 0.5 * (left + right)
    expansion = schwarzschild_spherical_expansion(radius, mass)
    return ApparentHorizonResult(radius, expansion, mass, "analytic-spherical-bisection", abs(expansion) < 1.0e-14)


def _coordinate_sphere_expansion_field(
    state: BSSNState3D,
    center: Sequence[float],
) -> Array:
    """Build the outgoing-expansion field for coordinate-sphere normals.

    The normal is the unit normal of the coordinate radius in the physical
    metric.  This is intentionally a spherical diagnostic: a production
    apparent-horizon finder must solve for a general star-shaped surface and
    handle excision/AMR ghost zones explicitly.
    """

    if state.grid.boundary == "periodic":
        raise ValueError("coordinate-sphere horizons require a non-periodic grid")
    if len(center) != 3 or not all(math.isfinite(float(value)) for value in center):
        raise ValueError("center must contain three finite coordinates")
    from .bssn3d import _christoffel

    inverse_conformal = np.linalg.inv(state.h)
    physical_metric = state.h / state.chi[..., None, None]
    physical_inverse = state.chi[..., None, None] * inverse_conformal
    determinant = np.linalg.det(physical_metric)
    if np.any(determinant <= 0.0) or not np.all(np.isfinite(determinant)):
        raise ValueError("physical metric is not positive definite")
    christoffel = _christoffel(physical_metric, physical_inverse, state)
    physical_k = (
        state.a + state.h * state.trace_k[..., None, None] / 3.0
    ) / state.chi[..., None, None]

    coordinates = state.grid.coordinates
    offset = np.stack(
        [axis - float(origin) for axis, origin in zip(coordinates, center)],
        axis=-1,
    )
    coordinate_radius = np.linalg.norm(offset, axis=-1)
    coordinate_covector = np.zeros_like(offset)
    nonzero = coordinate_radius > 0.0
    coordinate_covector[nonzero] = offset[nonzero] / coordinate_radius[nonzero, None]
    normal_norm_squared = np.einsum(
        "...i,...ij,...j->...",
        coordinate_covector,
        physical_inverse,
        coordinate_covector,
    )
    if np.any(normal_norm_squared[nonzero] <= 0.0) or not np.all(
        np.isfinite(normal_norm_squared)
    ):
        raise ValueError("coordinate-sphere normal is not spacelike")
    normal_covector = np.zeros_like(coordinate_covector)
    normal_covector[nonzero] = coordinate_covector[nonzero] / np.sqrt(
        normal_norm_squared[nonzero, None]
    )
    normal_vector = np.einsum(
        "...ij,...j->...i", physical_inverse, normal_covector
    )
    divergence = sum(
        _grid_d1(normal_vector[..., axis], state, axis) for axis in range(3)
    )
    connection_trace = np.zeros(state.grid.shape, dtype=np.float64)
    for upper in range(3):
        for lower in range(3):
            connection_trace += (
                christoffel[..., upper, upper, lower] * normal_vector[..., lower]
            )
    extrinsic_term = np.einsum(
        "...ij,...i,...j->...", physical_k, normal_vector, normal_vector
    ) - state.trace_k
    return divergence + connection_trace + extrinsic_term


def apparent_horizon_expansion_from_state(
    state: BSSNState3D,
    extraction_radius: float,
    *,
    center: Sequence[float] = (0.0, 0.0, 0.0),
    theta_samples: int = 16,
    phi_samples: int = 32,
) -> StateApparentHorizonResult:
    """Measure the outgoing expansion on one coordinate sphere.

    The returned mean is the root-finding signal; ``angular_std`` records how
    far the sampled sphere is from a constant-expansion surface.  The state
    must provide valid cells around the extraction sphere.
    """

    radius = float(extraction_radius)
    if not math.isfinite(radius) or radius <= 0.0:
        raise ValueError("extraction_radius must be finite and positive")
    if theta_samples < 4 or phi_samples < 8:
        raise ValueError("theta_samples >= 4 and phi_samples >= 8 are required")
    sample_points, _, polar_weights = _sphere_quadrature(
        radius, center, theta_samples, phi_samples
    )
    sampled_valid = _trilinear_sample_scalar(
        state.valid_mask.astype(np.float64), state.grid, sample_points
    )
    if np.any(sampled_valid < 0.5):
        raise ValueError("apparent-horizon sphere intersects invalid or excised cells")
    expansion_field = _coordinate_sphere_expansion_field(state, center)
    sampled_expansion = _trilinear_sample_scalar(
        expansion_field, state.grid, sample_points
    )
    quadrature_weights = polar_weights[:, None] * (2.0 * np.pi / phi_samples)
    normalization = 4.0 * np.pi
    mean = float(np.sum(quadrature_weights * sampled_expansion) / normalization)
    l2 = float(
        np.sqrt(np.sum(quadrature_weights * sampled_expansion**2) / normalization)
    )
    angular_std = float(max(0.0, l2 * l2 - mean * mean) ** 0.5)
    return StateApparentHorizonResult(
        radius,
        mean,
        l2,
        angular_std,
        0,
        "state-coordinate-sphere-expansion",
        bool(math.isfinite(mean) and math.isfinite(l2) and math.isfinite(angular_std)),
    )


def find_apparent_horizon_from_state(
    state: BSSNState3D,
    bracket: tuple[float, float],
    *,
    center: Sequence[float] = (0.0, 0.0, 0.0),
    theta_samples: int = 16,
    phi_samples: int = 32,
    iterations: int = 60,
    tolerance: float = 1.0e-8,
    angular_tolerance: float = 1.0e-6,
) -> StateApparentHorizonResult:
    """Find a spherical expansion root by deterministic bisection.

    This is deliberately a coordinate-sphere gate, not a general apparent-
    horizon solve.  The bracket must lie in valid cells and straddle a sign
    change; a general star-shaped fast-flow/Newton solve is a later K3 gate.
    """

    if len(bracket) != 2 or not all(math.isfinite(float(value)) for value in bracket):
        raise ValueError("bracket must contain two finite radii")
    left, right = (float(bracket[0]), float(bracket[1]))
    if left <= 0.0 or right <= left:
        raise ValueError("bracket must contain ordered positive radii")
    if iterations < 1 or tolerance <= 0.0 or angular_tolerance <= 0.0:
        raise ValueError("iterations and tolerances must be positive")
    left_result = apparent_horizon_expansion_from_state(
        state,
        left,
        center=center,
        theta_samples=theta_samples,
        phi_samples=phi_samples,
    )
    right_result = apparent_horizon_expansion_from_state(
        state,
        right,
        center=center,
        theta_samples=theta_samples,
        phi_samples=phi_samples,
    )
    if left_result.expansion == 0.0:
        return StateApparentHorizonResult(
            left_result.radius,
            left_result.expansion,
            left_result.expansion_l2,
            left_result.angular_std,
            0,
            "state-coordinate-sphere-expansion-bisection",
            left_result.angular_std <= angular_tolerance,
        )
    if left_result.expansion * right_result.expansion > 0.0:
        raise ValueError("bracket must straddle a coordinate-sphere expansion root")
    middle_result = right_result
    completed = 0
    for completed in range(1, iterations + 1):
        middle = 0.5 * (left + right)
        middle_result = apparent_horizon_expansion_from_state(
            state,
            middle,
            center=center,
            theta_samples=theta_samples,
            phi_samples=phi_samples,
        )
        if abs(middle_result.expansion) <= tolerance:
            break
        if left_result.expansion * middle_result.expansion <= 0.0:
            right, right_result = middle, middle_result
        else:
            left, left_result = middle, middle_result
    passed = bool(
        abs(middle_result.expansion) <= tolerance
        and middle_result.angular_std <= angular_tolerance
    )
    return StateApparentHorizonResult(
        middle_result.radius,
        middle_result.expansion,
        middle_result.expansion_l2,
        middle_result.angular_std,
        completed,
        "state-coordinate-sphere-expansion-bisection",
        passed,
    )


def find_star_shaped_apparent_horizon_from_state(
    state: BSSNState3D,
    initial_radius: float | Array,
    *,
    center: Sequence[float] = (0.0, 0.0, 0.0),
    theta_samples: int = 8,
    phi_samples: int = 16,
    iterations: int = 12,
    tolerance: float = 1.0e-6,
    angular_tolerance: float = 1.0e-6,
    relaxation: float = 0.75,
    max_surface_unknowns: int = 128,
) -> StarShapedApparentHorizonResult:
    """Solve a sampled star-shaped apparent horizon with damped Newton steps.

    The expansion is evaluated from the level-set normal of
    ``F = r - R(theta, phi)`` and a Cartesian finite-difference divergence of
    ``sqrt(gamma) s^i``.  A dense finite-difference Jacobian couples all
    angular unknowns, followed by a damped line search; this avoids silently
    treating each angular point as an independent coordinate sphere.  The
    deterministic uniform-grid reference is intentionally capped by
    ``max_surface_unknowns`` and fails closed on invalid/excised stencils; it
    does not claim the preconditioning or AMR ghost treatment of a production
    horizon finder.
    """

    if state.grid.boundary == "periodic":
        raise ValueError("star-shaped horizons require a non-periodic grid")
    if len(center) != 3 or not all(math.isfinite(float(value)) for value in center):
        raise ValueError("center must contain three finite coordinates")
    if theta_samples < 4 or phi_samples < 8:
        raise ValueError("theta_samples >= 4 and phi_samples >= 8 are required")
    if iterations < 1 or tolerance <= 0.0 or angular_tolerance <= 0.0:
        raise ValueError("iterations and tolerances must be positive")
    if not math.isfinite(relaxation) or not 0.0 < relaxation <= 1.0:
        raise ValueError("relaxation must be finite and in (0, 1]")
    if not isinstance(max_surface_unknowns, int) or max_surface_unknowns < 1:
        raise ValueError("max_surface_unknowns must be a positive integer")
    theta_nodes = np.pi * (np.arange(theta_samples, dtype=np.float64) + 0.5) / theta_samples
    phi_nodes = 2.0 * np.pi * np.arange(phi_samples, dtype=np.float64) / phi_samples
    if np.isscalar(initial_radius):
        initial_value = float(initial_radius)
        if not math.isfinite(initial_value) or initial_value <= 0.0:
            raise ValueError("initial_radius must be finite and positive")
        radii = np.full((theta_samples, phi_samples), initial_value, dtype=np.float64)
    else:
        radii = np.asarray(initial_radius, dtype=np.float64).copy()
        if radii.shape != (theta_samples, phi_samples):
            raise ValueError("initial_radius array must match the angular sample shape")
        if not np.all(np.isfinite(radii)) or np.any(radii <= 0.0):
            raise ValueError("initial_radius values must be finite and positive")
    if radii.size > max_surface_unknowns:
        raise ValueError(
            "angular surface exceeds max_surface_unknowns for the dense shadow Jacobian"
        )
    finite_difference_step = 0.25 * min(state.grid.spacing)
    if not math.isfinite(finite_difference_step) or finite_difference_step <= 0.0:
        raise ValueError("grid spacing must be finite and positive")

    def metrics(expansion: Array) -> tuple[float, float, float]:
        theta_weight = np.sin(theta_nodes)[:, None]
        normalization = float(np.sum(theta_weight)) * phi_samples
        mean = float(np.sum(theta_weight * expansion) / normalization)
        l2 = float(np.sqrt(np.sum(theta_weight * expansion**2) / normalization))
        angular_std = float(max(0.0, l2 * l2 - mean * mean) ** 0.5)
        return mean, l2, angular_std

    expansion = _star_shaped_expansion(
        state,
        radii,
        theta_nodes,
        phi_nodes,
        center,
        finite_difference_step,
    )
    completed = 0
    passed = False
    method = "state-star-shaped-apparent-horizon-damped-newton"
    for completed in range(1, iterations + 1):
        mean, l2, angular_std = metrics(expansion)
        if l2 <= tolerance and angular_std <= angular_tolerance:
            passed = True
            break
        delta = min(
            0.05 * float(np.min(radii)),
            0.25 * finite_difference_step,
        )
        if delta <= 0.0 or not math.isfinite(delta):
            method += "-singular-step"
            break
        unknown_count = radii.size
        jacobian = np.empty((unknown_count, unknown_count), dtype=np.float64)
        for column in range(unknown_count):
            perturbed = radii.copy()
            perturbed.flat[column] += delta
            perturbed_expansion = _star_shaped_expansion(
                state,
                perturbed,
                theta_nodes,
                phi_nodes,
                center,
                finite_difference_step,
            )
            jacobian[:, column] = (
                (perturbed_expansion - expansion) / delta
            ).reshape(-1)
        try:
            update = np.linalg.solve(jacobian, -expansion.reshape(-1)).reshape(radii.shape)
        except np.linalg.LinAlgError:
            method += "-singular-jacobian"
            break
        if not np.all(np.isfinite(update)):
            method += "-invalid-jacobian"
            break
        maximum_step = 0.5 * np.maximum(radii, finite_difference_step)
        update = np.clip(update, -maximum_step, maximum_step)
        candidate_found = False
        for fraction in (
            relaxation,
            0.5 * relaxation,
            0.25 * relaxation,
            0.125 * relaxation,
            0.0625 * relaxation,
        ):
            candidate_radii = radii + fraction * update
            if np.any(candidate_radii <= 0.0) or not np.all(np.isfinite(candidate_radii)):
                continue
            candidate_expansion = _star_shaped_expansion(
                state,
                candidate_radii,
                theta_nodes,
                phi_nodes,
                center,
                finite_difference_step,
            )
            candidate_l2 = metrics(candidate_expansion)[1]
            if candidate_l2 < l2:
                radii = candidate_radii
                expansion = candidate_expansion
                candidate_found = True
                break
        if not candidate_found:
            method += "-line-search-stalled"
            break
    mean, l2, angular_std = metrics(expansion)
    passed = bool(
        passed
        or (l2 <= tolerance and angular_std <= angular_tolerance)
    )
    return StarShapedApparentHorizonResult(
        center=tuple(float(value) for value in center),
        theta=theta_nodes.copy(),
        phi=phi_nodes.copy(),
        radii=radii.copy(),
        expansion=expansion.copy(),
        mean_expansion=mean,
        expansion_l2=l2,
        angular_std=angular_std,
        iterations=completed,
        method=method,
        passed=passed,
    )


@dataclass(frozen=True)
class ADMResult:
    mass: float
    extraction_radius: float
    method: str
    passed: bool


def _trilinear_sample_scalar(values: Array, grid: Grid3D, points: Array) -> Array:
    """Sample a scalar grid field at Cartesian points with explicit wrapping."""

    data = _finite_array(values, name="values")
    if data.shape != grid.shape:
        raise ValueError(f"values must have shape {grid.shape}")
    coordinates = np.asarray(points, dtype=np.float64)
    if coordinates.ndim < 2 or coordinates.shape[-1] != 3:
        raise ValueError("points must have a final axis of length three")
    flat = coordinates.reshape(-1, 3)
    spacing = np.asarray(grid.spacing, dtype=np.float64)
    lower = np.asarray(grid.lower, dtype=np.float64)
    index_coordinates = (flat - lower[None, :]) / spacing[None, :]
    shape = np.asarray(grid.shape, dtype=np.int64)
    if grid.boundary == "periodic":
        index_coordinates %= shape[None, :]
    elif np.any(index_coordinates < -1.0e-12) or np.any(index_coordinates > (shape - 1)[None, :] + 1.0e-12):
        raise ValueError("sample points lie outside the non-periodic grid")

    lower_index = np.floor(index_coordinates).astype(np.int64)
    fractions = index_coordinates - lower_index
    if grid.boundary != "periodic":
        lower_index = np.minimum(lower_index, shape[None, :] - 2)
        fractions = np.where(
            index_coordinates >= (shape - 1)[None, :],
            1.0,
            fractions,
        )

    result = np.zeros(flat.shape[0], dtype=np.float64)
    for offset_x in (0, 1):
        weight_x = (1.0 - fractions[:, 0]) if offset_x == 0 else fractions[:, 0]
        index_x = lower_index[:, 0] + offset_x
        if grid.boundary == "periodic":
            index_x %= shape[0]
        for offset_y in (0, 1):
            weight_y = (1.0 - fractions[:, 1]) if offset_y == 0 else fractions[:, 1]
            index_y = lower_index[:, 1] + offset_y
            if grid.boundary == "periodic":
                index_y %= shape[1]
            for offset_z in (0, 1):
                weight_z = (1.0 - fractions[:, 2]) if offset_z == 0 else fractions[:, 2]
                index_z = lower_index[:, 2] + offset_z
                if grid.boundary == "periodic":
                    index_z %= shape[2]
                result += (
                    values[index_x, index_y, index_z]
                    * weight_x
                    * weight_y
                    * weight_z
                )
    return result.reshape(coordinates.shape[:-1])


def _star_graph_coordinates(
    points: Array,
    radii: Array,
    theta_nodes: Array,
    phi_nodes: Array,
    center: Sequence[float],
) -> tuple[Array, Array]:
    """Return ``F_,i`` for ``F=r-R(theta, phi)`` at arbitrary Cartesian points."""

    coordinates = np.asarray(points, dtype=np.float64)
    if coordinates.ndim < 2 or coordinates.shape[-1] != 3:
        raise ValueError("points must have a final axis of length three")
    radial_table = np.asarray(radii, dtype=np.float64)
    if radial_table.shape != (theta_nodes.size, phi_nodes.size):
        raise ValueError("star-shaped radii do not match the angular grid")
    if not np.all(np.isfinite(radial_table)) or np.any(radial_table <= 0.0):
        raise ValueError("star-shaped radii must be finite and positive")
    flat = coordinates.reshape(-1, 3)
    offset = flat - np.asarray(center, dtype=np.float64)[None, :]
    radius = np.linalg.norm(offset, axis=-1)
    if np.any(radius <= 1.0e-12) or not np.all(np.isfinite(radius)):
        raise ValueError("star-shaped level-set samples must stay away from the center")
    cosine = np.clip(offset[:, 2] / radius, -1.0, 1.0)
    theta = np.arccos(cosine)
    phi = np.mod(np.arctan2(offset[:, 1], offset[:, 0]), 2.0 * np.pi)
    dtheta = np.pi / theta_nodes.size
    dphi = 2.0 * np.pi / phi_nodes.size
    theta_coordinate = np.clip(theta / dtheta - 0.5, 0.0, theta_nodes.size - 1.0)
    lower_theta = np.floor(theta_coordinate).astype(np.int64)
    lower_theta = np.minimum(lower_theta, theta_nodes.size - 2)
    theta_fraction = theta_coordinate - lower_theta
    phi_coordinate = phi / dphi
    lower_phi = np.floor(phi_coordinate).astype(np.int64) % phi_nodes.size
    phi_fraction = phi_coordinate - np.floor(phi_coordinate)
    d_r_dtheta = np.gradient(radial_table, dtheta, axis=0, edge_order=2)
    d_r_dphi = (
        np.roll(radial_table, -1, axis=1) - np.roll(radial_table, 1, axis=1)
    ) / (2.0 * dphi)

    def interpolate(field: Array) -> Array:
        lower = field[lower_theta, lower_phi]
        upper_theta = field[lower_theta + 1, lower_phi]
        upper_phi = field[lower_theta, (lower_phi + 1) % phi_nodes.size]
        upper_both = field[lower_theta + 1, (lower_phi + 1) % phi_nodes.size]
        return (
            lower * (1.0 - theta_fraction) * (1.0 - phi_fraction)
            + upper_theta * theta_fraction * (1.0 - phi_fraction)
            + upper_phi * (1.0 - theta_fraction) * phi_fraction
            + upper_both * theta_fraction * phi_fraction
        )

    radial_theta = interpolate(d_r_dtheta)
    radial_phi = interpolate(d_r_dphi)
    sin_theta = np.sqrt(np.maximum(0.0, 1.0 - cosine * cosine))
    cos_phi = np.cos(phi)
    sin_phi = np.sin(phi)
    radial_basis = np.stack((sin_theta * cos_phi, sin_theta * sin_phi, cosine), axis=-1)
    polar_basis = np.stack((cosine * cos_phi, cosine * sin_phi, -sin_theta), axis=-1)
    azimuthal_basis = np.stack((-sin_phi, cos_phi, np.zeros_like(sin_phi)), axis=-1)
    safe_sin = np.maximum(sin_theta, 1.0e-8)
    covector = (
        radial_basis
        - (radial_theta / radius)[..., None] * polar_basis
        - (radial_phi / (radius * safe_sin))[..., None] * azimuthal_basis
    )
    return covector.reshape((*coordinates.shape[:-1], 3)), radius.reshape(coordinates.shape[:-1])


def _star_surface_normal_density(
    state: BSSNState3D,
    points: Array,
    radii: Array,
    theta_nodes: Array,
    phi_nodes: Array,
    center: Sequence[float],
) -> tuple[Array, Array, Array, Array, Array]:
    """Evaluate ``sqrt(gamma) s^i`` and extrinsic data on a star graph."""

    coordinates = np.asarray(points, dtype=np.float64)
    sampled_valid = _trilinear_sample_scalar(
        state.valid_mask.astype(np.float64), state.grid, coordinates
    )
    if np.any(sampled_valid < 0.5):
        raise ValueError("star-shaped surface or divergence stencil intersects invalid cells")
    chi = _trilinear_sample_scalar(state.chi, state.grid, coordinates)
    trace_k = _trilinear_sample_scalar(state.trace_k, state.grid, coordinates)
    h = np.empty((*coordinates.shape[:-1], 3, 3), dtype=np.float64)
    a = np.empty_like(h)
    for first in range(3):
        for second in range(3):
            h[..., first, second] = _trilinear_sample_scalar(
                state.h[..., first, second], state.grid, coordinates
            )
            a[..., first, second] = _trilinear_sample_scalar(
                state.a[..., first, second], state.grid, coordinates
            )
    physical_metric = h / chi[..., None, None]
    determinant = np.linalg.det(physical_metric)
    if np.any(determinant <= 0.0) or not np.all(np.isfinite(determinant)):
        raise ValueError("star-shaped horizon samples have a non-positive physical metric")
    physical_inverse = np.linalg.inv(physical_metric)
    covector, _ = _star_graph_coordinates(
        coordinates, radii, theta_nodes, phi_nodes, center
    )
    normal_norm_squared = np.einsum(
        "...i,...ij,...j->...", covector, physical_inverse, covector
    )
    if np.any(normal_norm_squared <= 0.0) or not np.all(np.isfinite(normal_norm_squared)):
        raise ValueError("star-shaped horizon level-set normal is not spacelike")
    normal_vector = np.einsum("...ij,...j->...i", physical_inverse, covector)
    normal_vector /= np.sqrt(normal_norm_squared)[..., None]
    density = np.sqrt(determinant)[..., None] * normal_vector
    physical_k = (a + h * trace_k[..., None, None] / 3.0) / chi[..., None, None]
    return density, np.sqrt(determinant), physical_k, normal_vector, trace_k


def _star_surface_points(
    radii: Array,
    theta_nodes: Array,
    phi_nodes: Array,
    center: Sequence[float],
) -> Array:
    theta, phi = np.meshgrid(theta_nodes, phi_nodes, indexing="ij")
    sin_theta = np.sin(theta)
    radial_basis = np.stack(
        (sin_theta * np.cos(phi), sin_theta * np.sin(phi), np.cos(theta)),
        axis=-1,
    )
    return np.asarray(center, dtype=np.float64) + radii[..., None] * radial_basis


def _star_shaped_expansion(
    state: BSSNState3D,
    radii: Array,
    theta_nodes: Array,
    phi_nodes: Array,
    center: Sequence[float],
    finite_difference_step: float,
) -> Array:
    surface_points = _star_surface_points(radii, theta_nodes, phi_nodes, center)
    density, sqrt_determinant, physical_k, normal_vector, trace_k = (
        _star_surface_normal_density(
            state,
            surface_points,
            radii,
            theta_nodes,
            phi_nodes,
            center,
        )
    )
    divergence_density = np.zeros_like(sqrt_determinant)
    for axis in range(3):
        plus = surface_points.copy()
        minus = surface_points.copy()
        plus[..., axis] += finite_difference_step
        minus[..., axis] -= finite_difference_step
        plus_density = _star_surface_normal_density(
            state, plus, radii, theta_nodes, phi_nodes, center
        )[0]
        minus_density = _star_surface_normal_density(
            state, minus, radii, theta_nodes, phi_nodes, center
        )[0]
        divergence_density += (
            plus_density[..., axis] - minus_density[..., axis]
        ) / (2.0 * finite_difference_step)
    divergence = divergence_density / sqrt_determinant
    extrinsic = (
        np.einsum("...ij,...i,...j->...", physical_k, normal_vector, normal_vector)
        - trace_k
    )
    expansion = divergence + extrinsic
    if not np.all(np.isfinite(expansion)):
        raise ValueError("star-shaped apparent-horizon expansion is not finite")
    return expansion


def _grid_d1(values: Array, state: BSSNState3D, axis: int) -> Array:
    """Configured Cartesian derivative for diagnostics and boundary proxies."""

    spacing = state.grid.spacing[axis]
    if state.grid.boundary == "periodic":
        if state.grid.spatial_order == 4:
            # Match the evolution operator's exact constant-annihilation property.
            return (
                8.0 * (np.roll(values, -1, axis=axis) - np.roll(values, 1, axis=axis))
                - (np.roll(values, -2, axis=axis) - np.roll(values, 2, axis=axis))
            ) / (12.0 * spacing)
        return (np.roll(values, -1, axis=axis) - np.roll(values, 1, axis=axis)) / (2.0 * spacing)
    if state.grid.spatial_order != 2:
        raise ValueError("fourth-order diagnostics require periodic boundaries")
    return np.gradient(values, spacing, axis=axis, edge_order=2)


def outer_boundary_mask(grid: Grid3D) -> Array:
    """Return the physical outer-face mask for a non-periodic Cartesian grid."""

    if grid.boundary == "periodic":
        raise ValueError("periodic grids do not have an outer boundary mask")
    mask = np.zeros(grid.shape, dtype=bool)
    for axis in range(3):
        lower = [slice(None)] * 3
        upper = [slice(None)] * 3
        lower[axis] = 0
        upper[axis] = -1
        mask[tuple(lower)] = True
        mask[tuple(upper)] = True
    return mask


def apply_sommerfeld_boundary_rhs(
    state: BSSNState3D,
    rhs: Any,
    *,
    wave_speed: float = 1.0,
    center: Sequence[float] = (0.0, 0.0, 0.0),
) -> Any:
    """Apply a scalar Sommerfeld proxy on the six outer faces.

    The replacement is ``-v (n^i d_i u + (u-u_inf)/r)`` for each evolved
    component, with Minkowski reference values.  It is a deterministic outer
    boundary contract for the shadow RHS, not a characteristic Einstein
    boundary or an excision treatment.  The caller must keep this gate
    separate from physical-waveform validation.
    """

    if state.grid.boundary != "sommerfeld":
        raise ValueError("Sommerfeld RHS requires Grid3D(boundary='sommerfeld')")
    if not np.all(state.valid_mask):
        raise ValueError("Sommerfeld RHS requires a fully valid state")
    speed = float(wave_speed)
    if not math.isfinite(speed) or speed <= 0.0:
        raise ValueError("wave_speed must be finite and positive")
    if len(center) != 3 or not all(math.isfinite(float(value)) for value in center):
        raise ValueError("center must contain three finite coordinates")
    mask = outer_boundary_mask(state.grid)
    coordinates = state.grid.coordinates
    offset = np.stack(
        [axis - float(origin) for axis, origin in zip(coordinates, center)],
        axis=-1,
    )
    radius = np.linalg.norm(offset, axis=-1)
    radial_unit = np.zeros_like(offset)
    nonzero = radius > 0.0
    radial_unit[nonzero] = offset[nonzero] / radius[nonzero, None]
    radius_safe = np.maximum(radius, min(state.grid.spacing))
    reference_fields: dict[str, Array] = {
        "chi": np.ones(state.grid.shape, dtype=np.float64),
        "h": np.broadcast_to(np.eye(3, dtype=np.float64), (*state.grid.shape, 3, 3)).copy(),
        "trace_k": np.zeros(state.grid.shape, dtype=np.float64),
        "a": np.zeros((*state.grid.shape, 3, 3), dtype=np.float64),
        "theta": np.zeros(state.grid.shape, dtype=np.float64),
        "conformal_gamma": np.zeros((*state.grid.shape, 3), dtype=np.float64),
        "lapse": np.ones(state.grid.shape, dtype=np.float64),
        "shift": np.zeros((*state.grid.shape, 3), dtype=np.float64),
        "b": np.zeros((*state.grid.shape, 3), dtype=np.float64),
    }
    updated: dict[str, Array] = {}
    for name, reference in reference_fields.items():
        field = np.asarray(getattr(state, name), dtype=np.float64)
        gradients = [_grid_d1(field, state, axis) for axis in range(3)]
        radial_derivative = sum(
            radial_unit[..., axis, *([None] * (field.ndim - 3))] * gradients[axis]
            for axis in range(3)
        )
        boundary_rhs = -speed * (radial_derivative + (field - reference) / radius_safe[
            (...,) + (None,) * (field.ndim - 3)
        ])
        replaced = np.asarray(getattr(rhs, name), dtype=np.float64).copy()
        replaced[mask] = boundary_rhs[mask]
        updated[name] = replaced
    return type(rhs)(**updated)


def _sphere_quadrature(
    radius: float,
    center: Sequence[float],
    theta_samples: int,
    phi_samples: int,
) -> tuple[Array, Array, Array]:
    """Return deterministic spherical points, normals, and polar weights."""

    cosine, polar_weights = np.polynomial.legendre.leggauss(theta_samples)
    phi = 2.0 * np.pi * np.arange(phi_samples, dtype=np.float64) / phi_samples
    sine = np.sqrt(np.maximum(0.0, 1.0 - cosine * cosine))
    normals = np.stack(
        [
            sine[:, None] * np.cos(phi)[None, :],
            sine[:, None] * np.sin(phi)[None, :],
            cosine[:, None] * np.ones(phi_samples, dtype=np.float64),
        ],
        axis=-1,
    )
    points = np.asarray(center, dtype=np.float64) + radius * normals
    return points, normals, polar_weights


def adm_mass_from_state(
    state: BSSNState3D,
    extraction_radius: float,
    *,
    center: Sequence[float] = (0.0, 0.0, 0.0),
    theta_samples: int = 16,
    phi_samples: int = 32,
    tolerance: float | None = None,
) -> ADMResult:
    """Estimate ADM mass from the full physical metric on a coordinate sphere.

    The estimator uses the finite-radius Cartesian ADM surface integrand

    ``M = (1/(16*pi)) integral (d_j gamma_ij - d_i gamma_jj) n^i dS``

    with ``gamma_ij = chi**-1 h_ij``.  It is a diagnostic on a finite uniform
    grid, not the asymptotic limit and not a replacement for an extrapolated
    multi-radius ADM analysis.  The extraction sphere must be inside valid
    cells; this prevents an excision surface from being silently sampled.
    """

    radius = float(extraction_radius)
    if not math.isfinite(radius) or radius <= 0.0:
        raise ValueError("extraction_radius must be finite and positive")
    if len(center) != 3 or not all(math.isfinite(float(value)) for value in center):
        raise ValueError("center must contain three finite coordinates")
    if theta_samples < 4 or phi_samples < 8:
        raise ValueError("theta_samples >= 4 and phi_samples >= 8 are required")
    if tolerance is not None and (not math.isfinite(tolerance) or tolerance <= 0.0):
        raise ValueError("tolerance must be finite and positive")
    if np.any(state.chi <= 0.0):
        raise ValueError("state chi must be positive for an ADM surface integral")

    sample_points, normals, polar_weights = _sphere_quadrature(
        radius, center, theta_samples, phi_samples
    )
    if not np.all(state.valid_mask):
        sampled_valid = _trilinear_sample_scalar(
            state.valid_mask.astype(np.float64), state.grid, sample_points
        )
        if np.any(sampled_valid < 0.5):
            raise ValueError("ADM extraction sphere intersects invalid or excised cells")

    physical_metric = state.h / state.chi[..., None, None]
    derivatives = [_grid_d1(physical_metric, state, axis) for axis in range(3)]
    # Recompute the two contractions with explicit indices.  Keeping this
    # loop separate makes the ADM index placement auditable and avoids relying
    # on an opaque einsum over sampled component axes.
    integrand_vector = np.zeros((*sample_points.shape[:2], 3), dtype=np.float64)
    for first in range(3):
        first_divergence = np.zeros(sample_points.shape[:2], dtype=np.float64)
        first_trace_gradient = np.zeros_like(first_divergence)
        for direction in range(3):
            first_divergence += _trilinear_sample_scalar(
                derivatives[direction][..., first, direction], state.grid, sample_points
            )
            first_trace_gradient += _trilinear_sample_scalar(
                derivatives[first][..., direction, direction], state.grid, sample_points
            )
        integrand_vector[..., first] = first_divergence - first_trace_gradient
    integrand = np.einsum("...i,...i->...", integrand_vector, normals)
    surface_integral = radius * radius * (2.0 * np.pi / phi_samples) * np.sum(
        polar_weights[:, None] * integrand
    )
    measured = float(surface_integral / (16.0 * np.pi))
    expected = None
    if "mass_length" in state.metadata:
        try:
            expected = float(state.metadata["mass_length"])
        except (TypeError, ValueError):
            expected = None
    passed = bool(math.isfinite(measured) and (
        tolerance is None or expected is None or abs(measured - expected) <= tolerance
    ))
    return ADMResult(measured, radius, "full-physical-metric-surface-integral", passed)


def adm_mass_extrapolated_from_state(
    state: BSSNState3D,
    extraction_radii: Sequence[float],
    *,
    center: Sequence[float] = (0.0, 0.0, 0.0),
    theta_samples: int = 16,
    phi_samples: int = 32,
    tolerance: float = 5.0e-2,
) -> ADMResult:
    """Extrapolate finite-radius ADM estimates to the asymptotic limit.

    The fit uses ``M(r) = M_inf + a/r + b/r**2`` and therefore requires at
    least three distinct positive extraction radii.  This is still a bounded
    uniform-grid diagnostic: production runs should repeat the fit across
    resolutions and vary the fit window before treating it as a physical
    measurement.
    """

    radii = np.asarray(tuple(float(radius) for radius in extraction_radii), dtype=np.float64)
    if radii.ndim != 1 or radii.size < 3 or np.any(~np.isfinite(radii)) or np.any(radii <= 0.0):
        raise ValueError("at least three finite positive extraction radii are required")
    if np.unique(radii).size != radii.size:
        raise ValueError("extraction radii must be distinct")
    if not math.isfinite(tolerance) or tolerance <= 0.0:
        raise ValueError("tolerance must be finite and positive")
    measurements = np.asarray(
        [
            adm_mass_from_state(
                state,
                radius,
                center=center,
                theta_samples=theta_samples,
                phi_samples=phi_samples,
            ).mass
            for radius in radii
        ],
        dtype=np.float64,
    )
    design = np.column_stack((
        np.ones(radii.size, dtype=np.float64),
        1.0 / radii,
        1.0 / (radii * radii),
    ))
    coefficients, _, rank, _ = np.linalg.lstsq(design, measurements, rcond=None)
    if rank < 3 or not np.all(np.isfinite(coefficients)):
        raise ValueError("ADM asymptotic fit is rank deficient or non-finite")
    measured = float(coefficients[0])
    expected = None
    if "mass_length" in state.metadata:
        try:
            expected = float(state.metadata["mass_length"])
        except (TypeError, ValueError):
            expected = None
    passed = bool(math.isfinite(measured) and (
        expected is None or abs(measured - expected) <= tolerance
    ))
    return ADMResult(
        measured,
        float(np.max(radii)),
        "full-physical-metric-asymptotic-extrapolation",
        passed,
    )


def adm_mass_from_isotropic_state(
    state: BSSNState3D,
    extraction_radius: float,
    *,
    center: Sequence[float] = (0.0, 0.0, 0.0),
    theta_samples: int = 16,
    phi_samples: int = 32,
    tolerance: float = 5.0e-2,
) -> ADMResult:
    """Estimate ADM mass from a time-symmetric conformally flat state.

    This is the first state-backed K3 diagnostic, not a general ADM surface
    integral.  It intentionally requires ``h_ij = delta_ij``, zero extrinsic
    curvature, and a spherical extraction surface.  The conformal-factor
    reduction is

    ``M = -(1/(2*pi)) integral_S d_r psi dS``, ``psi = chi**(-1/4)``.

    Gauss-Legendre polar nodes and an equispaced azimuth make the sampling
    deterministic.  A state carrying ``metadata['mass_length']`` receives a
    bounded comparison in ``ADMResult.passed``; otherwise ``passed`` means
    only that the estimator is finite.
    """

    radius = float(extraction_radius)
    if not math.isfinite(radius) or radius <= 0.0:
        raise ValueError("extraction_radius must be finite and positive")
    if len(center) != 3 or not all(math.isfinite(float(value)) for value in center):
        raise ValueError("center must contain three finite coordinates")
    if theta_samples < 4 or phi_samples < 8:
        raise ValueError("theta_samples >= 4 and phi_samples >= 8 are required")
    if not math.isfinite(tolerance) or tolerance <= 0.0:
        raise ValueError("tolerance must be finite and positive")
    if not np.allclose(state.h, np.eye(3), rtol=0.0, atol=1.0e-10):
        raise ValueError("state-backed isotropic ADM requires h_ij equal to delta_ij")
    if not np.allclose(state.a, 0.0, rtol=0.0, atol=1.0e-10) or not np.allclose(
        state.trace_k, 0.0, rtol=0.0, atol=1.0e-10
    ):
        raise ValueError("state-backed isotropic ADM requires time-symmetric extrinsic curvature")

    spacing = state.grid.spacing
    gradients = np.gradient(
        state.chi,
        spacing[0],
        spacing[1],
        spacing[2],
        edge_order=2,
    )
    psi_gradient = [
        -0.25 * np.power(state.chi, -1.25) * gradient
        for gradient in gradients
    ]
    cosine, polar_weights = np.polynomial.legendre.leggauss(theta_samples)
    phi = 2.0 * np.pi * np.arange(phi_samples, dtype=np.float64) / phi_samples
    sine = np.sqrt(np.maximum(0.0, 1.0 - cosine * cosine))
    normals = np.stack(
        [
            sine[:, None] * np.cos(phi)[None, :],
            sine[:, None] * np.sin(phi)[None, :],
            cosine[:, None] * np.ones(phi_samples, dtype=np.float64),
        ],
        axis=-1,
    )
    sample_points = np.asarray(center, dtype=np.float64) + radius * normals
    radial_derivative = sum(
        _trilinear_sample_scalar(gradient, state.grid, sample_points) * normals[..., axis]
        for axis, gradient in enumerate(psi_gradient)
    )
    surface_integral = radius * radius * (2.0 * np.pi / phi_samples) * np.sum(
        polar_weights[:, None] * radial_derivative
    )
    measured = -surface_integral / (2.0 * np.pi)
    expected = None
    if "mass_length" in state.metadata:
        try:
            expected = float(state.metadata["mass_length"])
        except (TypeError, ValueError):
            expected = None
    passed = bool(math.isfinite(measured) and (
        expected is None or abs(measured - expected) <= tolerance
    ))
    return ADMResult(float(measured), radius, "state-isotropic-conformal-surface-integral", passed)


def schwarzschild_adm_mass(mass_length: float = 1.0, *, extraction_radius: float = 20.0) -> ADMResult:
    """ADM surface integral for isotropic Schwarzschild initial data."""

    mass = float(mass_length)
    radius = float(extraction_radius)
    if not math.isfinite(mass) or mass <= 0.0 or not math.isfinite(radius) or radius <= 0.5 * mass:
        raise ValueError("mass and extraction_radius must be finite and outside the throat")
    # M_ADM = -(1/(2*pi)) integral d_r psi dS, with d_r psi = -M/(2 r^2).
    measured = -(1.0 / (2.0 * math.pi)) * (-0.5 * mass / radius**2) * (4.0 * math.pi * radius**2)
    return ADMResult(measured, radius, "isotropic-conformal-surface-integral", abs(measured - mass) < 1.0e-13)


@dataclass(frozen=True)
class Psi4Result:
    value: complex
    method: str
    radiative_input_required: bool


@dataclass(frozen=True)
class Weyl3DResult:
    """Electric and magnetic Weyl tensors reconstructed from a vacuum slice."""

    electric: Array
    magnetic: Array
    method: str


def weyl_electric_magnetic_from_state(state: BSSNState3D) -> Weyl3DResult:
    """Construct 3+1 electric/magnetic Weyl tensors from a vacuum state.

    The reconstruction uses ``E_ij = TF(R_ij + K K_ij - K_i^k K_kj)`` and the
    symmetrized curl of ``K_ij`` for ``B_ij``.  It is a uniform-grid reference
    diagnostic: matter sources, constraint projection, tetrad transport, and
    Cauchy-characteristic extraction are deliberately outside this function.
    """

    if np.any(state.chi <= 0.0):
        raise ValueError("state chi must be positive for Weyl reconstruction")
    from .bssn3d import _christoffel
    from .constraints3d import _direct_ricci

    inverse_conformal = np.linalg.inv(state.h)
    physical_metric = state.h / state.chi[..., None, None]
    physical_inverse = state.chi[..., None, None] * inverse_conformal
    # The continuum spatial Ricci tensor is symmetric.  The independent
    # second-order Christoffel stencil is not exactly symmetric at finite
    # resolution (the antisymmetric part converges away), so project it onto
    # the geometric tensor space before constructing the Weyl electric part.
    physical_ricci = _direct_ricci(physical_metric, physical_inverse, state)
    physical_ricci = 0.5 * (physical_ricci + np.swapaxes(physical_ricci, -1, -2))
    christoffel = _christoffel(physical_metric, physical_inverse, state)
    physical_k = (
        state.a + state.h * state.trace_k[..., None, None] / 3.0
    ) / state.chi[..., None, None]
    mixed_k = np.einsum("...ik,...kj->...ij", physical_inverse, physical_k)
    k_square = np.einsum("...ik,...kj->...ij", physical_k, mixed_k)
    electric = physical_ricci + state.trace_k[..., None, None] * physical_k - k_square
    electric_trace = np.einsum("...ij,...ij->...", physical_inverse, electric)
    electric -= physical_metric * electric_trace[..., None, None] / 3.0

    derivatives_k = [_grid_d1(physical_k, state, axis) for axis in range(3)]
    determinant = np.linalg.det(physical_metric)
    if np.any(determinant <= 0.0) or not np.all(np.isfinite(determinant)):
        raise ValueError("physical metric is not positive definite")
    permutation = np.zeros((3, 3, 3), dtype=np.float64)
    permutation[0, 1, 2] = permutation[1, 2, 0] = permutation[2, 0, 1] = 1.0
    permutation[0, 2, 1] = permutation[2, 1, 0] = permutation[1, 0, 2] = -1.0
    epsilon_mixed = np.einsum(
        "...,imn,...mk,...nl->...ikl",
        np.sqrt(determinant),
        permutation,
        physical_inverse,
        physical_inverse,
    )
    magnetic_unsym = np.zeros_like(physical_k)
    for first in range(3):
        for second in range(3):
            value = np.zeros(state.grid.shape, dtype=np.float64)
            for derivative_axis in range(3):
                for lower_index in range(3):
                    covariant = derivatives_k[derivative_axis][..., lower_index, second]
                    for upper_index in range(3):
                        covariant -= (
                            christoffel[..., upper_index, derivative_axis, lower_index]
                            * physical_k[..., upper_index, second]
                            + christoffel[..., upper_index, derivative_axis, second]
                            * physical_k[..., lower_index, upper_index]
                        )
                    value += epsilon_mixed[..., first, derivative_axis, lower_index] * covariant
            magnetic_unsym[..., first, second] = value
    magnetic = 0.5 * (magnetic_unsym + np.swapaxes(magnetic_unsym, -1, -2))
    return Weyl3DResult(
        electric=electric,
        magnetic=magnetic,
        method="vacuum-3+1-electric-magnetic-weyl-reference",
    )


@dataclass(frozen=True)
class Psi4SphereResult:
    """Pointwise Ψ₄ samples on one coordinate extraction sphere."""

    radius: float
    values: Array
    method: str
    radiative_input_required: bool


@dataclass(frozen=True)
class Psi4ModeResult:
    """One spin-weight ``-2`` spherical-harmonic mode of ``Psi4``."""

    radius: float
    ell: int
    m: int
    value: complex
    method: str
    radiative_input_required: bool


@dataclass(frozen=True)
class Psi4TimeSeriesResult:
    """One audited ``Psi4`` mode sampled over an ordered state sequence.

    ``retarded_times`` applies the geometric ``t - r`` offset only.  It does
    not perform radial extrapolation, tetrad transport, CCE, or alignment to a
    physically measured null cone; those claims remain outside this shadow
    contract.
    """

    times: Array
    retarded_times: Array
    values: Array
    radius: float
    ell: int
    m: int
    method: str
    radiative_input_required: bool


def extract_psi4_on_sphere(
    state: BSSNState3D,
    extraction_radius: float,
    *,
    center: Sequence[float] = (0.0, 0.0, 0.0),
    theta_samples: int = 16,
    phi_samples: int = 32,
) -> Psi4SphereResult:
    """Extract pointwise Ψ₄ from state-reconstructed Weyl tensors.

    The local null dyad uses the radial direction and a deterministic tangent
    basis.  The result is a waveform field on the sphere, not a spin-weighted
    harmonic mode and not a CCE waveform; mode integration and tetrad transport
    remain later K3 gates.
    """

    radius = float(extraction_radius)
    if not math.isfinite(radius) or radius <= 0.0:
        raise ValueError("extraction_radius must be finite and positive")
    if len(center) != 3 or not all(math.isfinite(float(value)) for value in center):
        raise ValueError("center must contain three finite coordinates")
    if theta_samples < 4 or phi_samples < 8:
        raise ValueError("theta_samples >= 4 and phi_samples >= 8 are required")
    sample_points, normals, _ = _sphere_quadrature(
        radius, center, theta_samples, phi_samples
    )
    if not np.all(state.valid_mask):
        sampled_valid = _trilinear_sample_scalar(
            state.valid_mask.astype(np.float64), state.grid, sample_points
        )
        if np.any(sampled_valid < 0.5):
            raise ValueError("Ψ₄ extraction sphere intersects invalid or excised cells")
    weyl = weyl_electric_magnetic_from_state(state)
    sampled_electric = np.empty((*sample_points.shape[:2], 3, 3), dtype=np.float64)
    sampled_magnetic = np.empty_like(sampled_electric)
    for first in range(3):
        for second in range(3):
            sampled_electric[..., first, second] = _trilinear_sample_scalar(
                weyl.electric[..., first, second], state.grid, sample_points
            )
            sampled_magnetic[..., first, second] = _trilinear_sample_scalar(
                weyl.magnetic[..., first, second], state.grid, sample_points
            )

    reference = np.asarray((0.0, 0.0, 1.0), dtype=np.float64)
    polar = reference[None, None, :] - normals * np.sum(normals * reference, axis=-1, keepdims=True)
    polar_norm = np.linalg.norm(polar, axis=-1, keepdims=True)
    fallback = np.asarray((1.0, 0.0, 0.0), dtype=np.float64)
    fallback_polar = fallback[None, None, :] - normals * np.sum(normals * fallback, axis=-1, keepdims=True)
    polar = np.where(polar_norm < 1.0e-12, fallback_polar, polar)
    polar /= np.linalg.norm(polar, axis=-1, keepdims=True)
    azimuthal = np.cross(normals, polar)
    dyad = (polar + 1j * azimuthal) / math.sqrt(2.0)
    values = np.einsum(
        "...i,...j,...ij->...",
        dyad.conjugate(),
        dyad.conjugate(),
        sampled_electric - 1j * sampled_magnetic,
    )
    return Psi4SphereResult(
        radius,
        values,
        "state-weyl-null-tetrad-sphere",
        False,
    )


def _spin_weight_minus_two_y2m(
    cosine: Array,
    phi: Array,
    m: int,
) -> Array:
    """Return the Goldberg phase convention for ``_{-2}Y_{2m}``."""

    sine = np.sqrt(np.maximum(0.0, 1.0 - cosine * cosine))
    if m == 2:
        return np.sqrt(5.0 / (64.0 * np.pi)) * (1.0 + cosine[:, None]) ** 2 * np.exp(
            2j * phi[None, :]
        )
    if m == 1:
        return np.sqrt(5.0 / (16.0 * np.pi)) * sine[:, None] * (1.0 + cosine[:, None]) * np.exp(
            1j * phi[None, :]
        )
    if m == 0:
        return np.sqrt(15.0 / (32.0 * np.pi)) * sine[:, None] ** 2 * np.ones(
            (1, phi.size), dtype=np.complex128
        )
    if m == -1:
        return np.sqrt(5.0 / (16.0 * np.pi)) * sine[:, None] * (1.0 - cosine[:, None]) * np.exp(
            -1j * phi[None, :]
        )
    if m == -2:
        return np.sqrt(5.0 / (64.0 * np.pi)) * (1.0 - cosine[:, None]) ** 2 * np.exp(
            -2j * phi[None, :]
        )
    raise ValueError("the reference mode projector currently supports ell=2 and m=-2..2")


def project_psi4_mode(
    sphere: Psi4SphereResult,
    ell: int,
    m: int,
    *,
    theta_samples: int | None = None,
    phi_samples: int | None = None,
) -> Psi4ModeResult:
    """Project a sampled sphere field onto one spin-weight ``-2`` mode.

    The quadrature ordering must match :func:`extract_psi4_on_sphere`.
    Only the explicit ``ell=2`` basis is included in this reference layer;
    higher modes require a separately audited spin-weighted basis and phase
    convention before they can enter a scientific waveform claim.
    """

    if ell != 2:
        raise ValueError("the reference mode projector currently supports ell=2 only")
    values = np.asarray(sphere.values, dtype=np.complex128)
    if values.size == 0 or not np.all(np.isfinite(values)):
        raise ValueError("sphere.values must be finite and non-empty")
    if values.ndim != 2:
        raise ValueError("sphere.values must have theta and phi axes")
    theta_count = values.shape[0] if theta_samples is None else int(theta_samples)
    phi_count = values.shape[1] if phi_samples is None else int(phi_samples)
    if (theta_count, phi_count) != values.shape:
        raise ValueError("quadrature counts must match sphere.values")
    if theta_count < 4 or phi_count < 8:
        raise ValueError("theta_samples >= 4 and phi_samples >= 8 are required")
    cosine, polar_weights = np.polynomial.legendre.leggauss(theta_count)
    phi = 2.0 * np.pi * np.arange(phi_count, dtype=np.float64) / phi_count
    basis = _spin_weight_minus_two_y2m(cosine, phi, int(m))
    weights = polar_weights[:, None] * (2.0 * np.pi / phi_count)
    value = complex(np.sum(weights * values * np.conjugate(basis)))
    return Psi4ModeResult(
        sphere.radius,
        2,
        int(m),
        value,
        "state-weyl-null-tetrad-spin-minus-two-ell2-mode",
        sphere.radiative_input_required,
    )


def extract_psi4_mode_on_sphere(
    state: BSSNState3D,
    extraction_radius: float,
    *,
    ell: int = 2,
    m: int = 0,
    center: Sequence[float] = (0.0, 0.0, 0.0),
    theta_samples: int = 16,
    phi_samples: int = 32,
) -> Psi4ModeResult:
    """Extract one audited ``ell=2`` mode from the state-backed sphere field."""

    sphere = extract_psi4_on_sphere(
        state,
        extraction_radius,
        center=center,
        theta_samples=theta_samples,
        phi_samples=phi_samples,
    )
    return project_psi4_mode(sphere, ell, m)


def extract_psi4_mode_time_series(
    states: Sequence[BSSNState3D],
    times: Sequence[float],
    extraction_radius: float,
    *,
    ell: int = 2,
    m: int = 0,
    center: Sequence[float] = (0.0, 0.0, 0.0),
    theta_samples: int = 16,
    phi_samples: int = 32,
) -> Psi4TimeSeriesResult:
    """Extract one ``Psi4`` mode at strictly ordered simulation times.

    Every sample uses the same sphere, quadrature, tetrad convention, and
    spin-weighted projection.  The sequence is useful for deterministic
    waveform plumbing tests; it is not a CCE or finite-radius extrapolation
    result and does not make a radiative-validity claim on its own.
    """

    state_sequence = tuple(states)
    if not state_sequence:
        raise ValueError("states must contain at least one BSSNState3D")
    time_array = np.asarray(times, dtype=np.float64)
    if time_array.ndim != 1 or time_array.size != len(state_sequence):
        raise ValueError("times must be a one-dimensional array matching states")
    if not np.all(np.isfinite(time_array)):
        raise ValueError("times must be finite")
    if time_array.size > 1 and np.any(np.diff(time_array) <= 0.0):
        raise ValueError("times must be strictly increasing")
    radius = float(extraction_radius)
    if not math.isfinite(radius) or radius <= 0.0:
        raise ValueError("extraction_radius must be finite and positive")
    modes = [
        extract_psi4_mode_on_sphere(
            state,
            radius,
            ell=ell,
            m=m,
            center=center,
            theta_samples=theta_samples,
            phi_samples=phi_samples,
        )
        for state in state_sequence
    ]
    values = np.asarray([mode.value for mode in modes], dtype=np.complex128)
    return Psi4TimeSeriesResult(
        times=time_array.copy(),
        retarded_times=time_array - radius,
        values=values,
        radius=radius,
        ell=int(ell),
        m=int(m),
        method="state-weyl-null-tetrad-spin-minus-two-ell2-mode-time-series",
        radiative_input_required=any(mode.radiative_input_required for mode in modes),
    )


def extract_psi4_from_weyl(
    electric_weyl: Array,
    magnetic_weyl: Array,
    *,
    radial_axis: Sequence[float] = (1.0, 0.0, 0.0),
    polar_axis: Sequence[float] = (0.0, 0.0, 1.0),
) -> Psi4Result:
    """Project electric/magnetic Weyl tensors onto a null tetrad dyad.

    The function intentionally requires already-computed Weyl tensors.  It is
    an extraction contract, not a claim that the present K3a module computes
    curvature from a 3-D evolved state.
    """

    electric = _finite_array(electric_weyl, name="electric_weyl")
    magnetic = _finite_array(magnetic_weyl, name="magnetic_weyl")
    if electric.shape != (3, 3) or magnetic.shape != (3, 3):
        raise ValueError("Weyl tensors must have shape (3, 3)")
    radial = np.asarray(radial_axis, dtype=np.float64)
    polar = np.asarray(polar_axis, dtype=np.float64)
    if radial.shape != (3,) or polar.shape != (3,):
        raise ValueError("tetrad axes must contain three coordinates")
    radial /= np.linalg.norm(radial)
    polar -= radial * np.dot(radial, polar)
    polar /= np.linalg.norm(polar)
    azimuthal = np.cross(radial, polar)
    m = (polar + 1j * azimuthal) / math.sqrt(2.0)
    value = np.einsum("i,j,ij->", m.conjugate(), m.conjugate(), electric - 1j * magnetic)
    return Psi4Result(complex(value), "electric-magnetic-weyl-null-tetrad", True)


def schwarzschild_weyl_psi4(mass_length: float = 1.0, *, extraction_radius: float = 20.0) -> Psi4Result:
    """Static Schwarzschild has zero radiative Psi4 in the principal tetrad."""

    mass = float(mass_length)
    radius = float(extraction_radius)
    if not math.isfinite(mass) or mass <= 0.0 or radius <= 0.5 * mass:
        raise ValueError("mass and extraction_radius must be finite and outside the throat")
    tidal = mass / radius**3
    electric = np.diag((-2.0 * tidal, tidal, tidal))
    magnetic = np.zeros((3, 3), dtype=np.float64)
    result = extract_psi4_from_weyl(electric, magnetic)
    return Psi4Result(result.value, "static-schwarzschild-weyl-null-tetrad", True)


def schwarzschild_3d_benchmark(mass_length: float = 1.0) -> dict[str, object]:
    """Return the bounded K3a analytic benchmark summary."""

    horizon = find_schwarzschild_apparent_horizon(mass_length)
    adm = schwarzschild_adm_mass(mass_length)
    psi4 = schwarzschild_weyl_psi4(mass_length)
    return {
        "horizon": horizon,
        "adm": adm,
        "psi4": psi4,
        "promotion": "blocked-pending-k3-dynamic-rhs-amr",
    }
