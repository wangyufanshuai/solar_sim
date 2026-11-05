"""Independent Minkowski source matrix and plane-mode initialization controls.

No nonlinear RHS is sampled to build these operators. This is a linearized
diagnostic, not a strong-field solver or a hyperbolicity/promotion certificate.
"""
from __future__ import annotations

from dataclasses import replace
import math

import numpy as np
from scipy.linalg import expm

from .ccz4_reference import GaugeConfig
from .fo_ccz4 import FOCCZ4_VARIABLE_ORDER
from .fo_ccz4_analytic_symbol import analytic_fo_ccz4_principal_matrix_3d
from .fo_ccz4_checkpoint import FOCheckpoint
from .fo_ccz4_gauge_profile import FOCCZ4GaugeProfile
from .fo_ccz4_rhs import FOCCZ4Config

INDEX = {name: i for i, name in enumerate(FOCCZ4_VARIABLE_ORDER)}
PROFILE = FOCCZ4GaugeProfile()
GAUGE = GaugeConfig(shift_coefficient=1., shift_damping=0., theta_coupling=2.)
CONFIG = FOCCZ4Config()


def _sym(prefix, i, j):
    return f"{prefix}{min(i,j)}{max(i,j)}"


def minkowski_source_matrix(profile=PROFILE):
    """Jacobian of Eq.12 algebraic sources, fixed kappa1=.1/kappa2=0/tau=0.

    Derivatives of f/mu do not enter this *flat* linearization because their
    multiplying background b/ordering curls vanish. No such cancellation is
    assumed away from Minkowski.
    """
    basis = np.eye(58)
    e = lambda name: basis[INDEX[name]]  # noqa: E731
    tr_a = sum(e(f"A{i}{i}") for i in range(3))
    tr_b = sum(e(f"B{i}{i}") for i in range(3))
    matrix = np.zeros((58, 58))
    for i in range(3):
        for j in range(i, 3):
            matrix[INDEX[_sym("h", i, j)]] = (-2.*e(_sym("A", i, j)) + e(f"B{i}{j}") + e(f"B{j}{i}")
                + (2./3.*(tr_a-tr_b) if i == j else 0.))
    matrix[INDEX["ln_alpha"]] = -2.*e("K")+4.*e("Theta")
    matrix[INDEX["ln_phi"]] = (e("K")-tr_b)/3.
    matrix[INDEX["K"]] = -.3*e("Theta")
    matrix[INDEX["Theta"]] = -.2*e("Theta")
    for i in range(3):
        matrix[INDEX[f"beta{i}"]] = profile.shift_scale*e(f"b{i}")
        tilde_gamma = sum(2.*e(f"D{j}{min(i,j)}{max(i,j)}")-e(f"D{i}{j}{j}") for j in range(3))
        damping = -.1*(e(f"GammaHat{i}")-tilde_gamma)
        matrix[INDEX[f"GammaHat{i}"]] = damping
        matrix[INDEX[f"b{i}"]] = damping
    return matrix


def plane_generator(derivative_k, profile=PROFILE):
    if not math.isfinite(float(derivative_k)):
        raise ValueError("wave number must be finite")
    principal = analytic_fo_ccz4_principal_matrix_3d(
        gauge=replace(GAUGE, shift_coefficient=profile.shift_scale),
        config=replace(CONFIG, ordering_mu=profile.ordering_scale))
    return minkowski_source_matrix(profile)+1j*derivative_k*principal


def centered_wave_number(points):
    if isinstance(points, bool) or not isinstance(points, int) or points < 5:
        raise ValueError("points must be an integer of at least five")
    return float(points*np.sin(2.*np.pi/points))


def linear_gauge_wave_mode(amplitude, auxiliary_k, *, gamma_k=2.*np.pi):
    """Positive mode-1 FFT/N coefficient of the analytic unit-wavelength slice.

    K and A use the analytic geometric wave number 2*pi. A_k/D/P use the
    declared auxiliary wave number. The distinction in Gamma is intentional.
    """
    if not all(math.isfinite(float(v)) for v in (amplitude, auxiliary_k, gamma_k)) or abs(amplitude) >= 1.:
        raise ValueError("finite wave parameters with |amplitude|<1 required")
    k = 2.*np.pi
    q = np.zeros(58, dtype=complex)
    for name, value in {"h00": 1j/3., "h11": -1j/6., "h22": -1j/6.,
                        "ln_alpha": 1j/4., "ln_phi": -1j/12., "K": -k/4.,
                        "A00": -k/6., "A11": k/12., "A22": k/12.,
                        "GammaHat0": -gamma_k/3.}.items():
        q[INDEX[name]] = amplitude*value
    q[INDEX["A0"]] = 1j*auxiliary_k*q[INDEX["ln_alpha"]]
    q[INDEX["P0"]] = 1j*auxiliary_k*q[INDEX["ln_phi"]]
    for i in range(3):
        q[INDEX[f"D0{i}{i}"]] = .5j*auxiliary_k*q[INDEX[f"h{i}{i}"]]
    return q


def evolve_mode(initial, derivative_k, time, *, dt=None, profile=PROFILE):
    initial = np.asarray(initial, dtype=complex)
    if initial.shape != (58,) or not np.all(np.isfinite(initial)) or not math.isfinite(float(time)) or time < 0.:
        raise ValueError("finite 58-mode vector and non-negative time required")
    generator = plane_generator(derivative_k, profile)
    if dt is None:
        return expm(time*generator) @ initial
    if not math.isfinite(float(dt)) or dt <= 0. or not math.isclose(time/dt, round(time/dt), abs_tol=1.e-12, rel_tol=0.):
        raise ValueError("dt must be positive and divide time")
    z = dt*generator
    z2 = z@z
    step = np.eye(58)+z+z2/2.+z2@z/6.+z2@z2/24.
    return np.linalg.matrix_power(step, round(time/dt)) @ initial


def linear_hamiltonian_mode(mode, derivative_k=2.*np.pi):
    """delta H = k^2*(delta h_yy+delta h_zz-4 delta ln(phi))."""
    mode = np.asarray(mode)
    if mode.shape != (58,) or not np.all(np.isfinite(mode)) or not math.isfinite(float(derivative_k)):
        raise ValueError("finite 58-mode vector and wave number required")
    return derivative_k**2*(mode[INDEX["h11"]]+mode[INDEX["h22"]]-4.*mode[INDEX["ln_phi"]])


def connection_consistent_initial_checkpoint(checkpoint):
    """Opt-in Z_i=0 *initial* connection from independent D; no time-step projection.

    Only the three GammaHat slots change. This does not solve H/M or repair
    differential/algebraic ordering constraints and never changes defaults.
    """
    if checkpoint.header["step"] != 0 or checkpoint.header["time"] != 0.:
        raise ValueError("connection control is initial-data only; evolved states rejected")
    state = checkpoint.to_state()
    inverse = np.linalg.inv(state.base.h)
    d = state.auxiliary.metric_gradient
    gamma = np.zeros((*state.grid.shape, 3))
    for upper in range(3):
        for i in range(3):
            for j in range(3):
                for ell in range(3):
                    gamma[..., upper] += inverse[..., i, j]*inverse[..., upper, ell]*(
                        d[..., i, ell, j]+d[..., j, ell, i]-d[..., ell, i, j])
    slots = [slot.copy() for slot in checkpoint.slots]
    for axis in range(3):
        slots[INDEX[f"GammaHat{axis}"]] = gamma[..., axis].copy()
    result = FOCheckpoint(dict(checkpoint.header), tuple(slots), checkpoint.profile)
    result.to_bytes()
    return result
