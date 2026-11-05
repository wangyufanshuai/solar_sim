"""Shared exact ZAMO observer frame for the independent Kerr CPU references.

The module only defines the observer tetrad and coordinate/covector transform.
The Carter/Mino and Cartesian Kerr-Schild integrators keep independent
equations of motion.
"""

from __future__ import annotations

import math

import numpy as np


def outer_horizon(spin: float) -> float:
    return 1.0 + math.sqrt(max(0.0, 1.0 - spin * spin))


def bl_metric_covariant(spin: float, radius: float, theta: float) -> np.ndarray:
    sin_theta = math.sin(theta)
    sin2 = max(1e-30, sin_theta * sin_theta)
    cos2 = math.cos(theta) ** 2
    sigma = radius * radius + spin * spin * cos2
    delta = radius * radius - 2.0 * radius + spin * spin
    big_a = (radius * radius + spin * spin) ** 2 - spin * spin * delta * sin2
    metric = np.zeros((4, 4), dtype=float)
    metric[0, 0] = -(1.0 - 2.0 * radius / sigma)
    metric[0, 3] = metric[3, 0] = -2.0 * spin * radius * sin2 / sigma
    metric[1, 1] = sigma / delta
    metric[2, 2] = sigma
    metric[3, 3] = big_a * sin2 / sigma
    return metric


def zamo_bl_phase_space(
    spin: float,
    radius: float,
    theta: float,
    local_direction: np.ndarray,
) -> dict:
    """Return one future-directed null ray in the exact BL ZAMO tetrad.

    Local components are ordered (radial, polar, azimuthal).  The spatial
    vector is normalized before applying the orthonormal tetrad.
    """
    direction = np.asarray(local_direction, dtype=float)
    norm = float(np.linalg.norm(direction))
    if not math.isfinite(norm) or norm <= 0:
        raise ValueError("ZAMO screen direction must be finite and non-zero")
    direction = direction / norm
    sin_theta = max(1e-15, math.sin(theta))
    cos_theta = math.cos(theta)
    sigma = radius * radius + spin * spin * cos_theta * cos_theta
    delta = radius * radius - 2.0 * radius + spin * spin
    if delta <= 0 or radius <= outer_horizon(spin):
        raise ValueError("ZAMO observer must be outside the outer horizon")
    big_a = (radius * radius + spin * spin) ** 2 - spin * spin * delta * sin_theta * sin_theta
    lapse = math.sqrt(sigma * delta / big_a)
    omega = 2.0 * spin * radius / big_a
    tetrad = np.array([
        [1.0 / lapse, 0.0, 0.0, 0.0],
        [0.0, math.sqrt(delta / sigma), 0.0, 0.0],
        [0.0, 0.0, 1.0 / math.sqrt(sigma), 0.0],
        [omega / lapse, 0.0, 0.0, math.sqrt(sigma / big_a) / sin_theta],
    ])
    contravariant = tetrad @ np.concatenate(([1.0], direction))
    metric = bl_metric_covariant(spin, radius, theta)
    covector = metric @ contravariant
    energy = -float(covector[0])
    axial = float(covector[3])
    p_theta = float(covector[2])
    # Null Carter constant (rest mass mu=0):
    # Q = p_theta^2 + cos(theta)^2 [Lz^2/sin(theta)^2 - a^2 E^2].
    # The previous `a^2 (1-E^2)` term is the massive-particle expression and
    # is not valid for the photon rays emitted by this tetrad.
    carter = p_theta * p_theta + cos_theta * cos_theta * (
        axial * axial / (sin_theta * sin_theta) - spin * spin * energy * energy
    )
    null = float(contravariant @ metric @ contravariant)
    return {
        "localDirection": direction,
        "contravariant": contravariant,
        "covector": covector,
        "tetradContravariant": tetrad,
        "energy": energy,
        "axialAngularMomentum": axial,
        "carterQ": carter,
        "nullConstraint": null,
    }


def bl_to_cartesian_ks_jacobian(
    spin: float,
    radius: float,
    theta: float,
    ks_azimuth: float = 0.0,
) -> tuple[np.ndarray, np.ndarray]:
    """Return q_KS and dq_KS/dq_BL for ingoing Cartesian Kerr-Schild.

    q_BL=(t,r,theta,phi_BL), q_KS=(t_KS,x,y,z), with
    dt_KS/dr=2r/Delta and dphi_KS/dr=a/Delta.
    """
    sin_theta = math.sin(theta)
    cos_theta = math.cos(theta)
    sin_phi = math.sin(ks_azimuth)
    cos_phi = math.cos(ks_azimuth)
    delta = radius * radius - 2.0 * radius + spin * spin
    if delta <= 0:
        raise ValueError("BL to Kerr-Schild transform requires an exterior point")
    dphi_dr = spin / delta
    x = (radius * cos_phi - spin * sin_phi) * sin_theta
    y = (radius * sin_phi + spin * cos_phi) * sin_theta
    z = radius * cos_theta
    dx_dphi = (-radius * sin_phi - spin * cos_phi) * sin_theta
    dy_dphi = (radius * cos_phi - spin * sin_phi) * sin_theta
    jacobian = np.array([
        [1.0, 2.0 * radius / delta, 0.0, 0.0],
        [0.0, cos_phi * sin_theta + dx_dphi * dphi_dr,
         (radius * cos_phi - spin * sin_phi) * cos_theta, dx_dphi],
        [0.0, sin_phi * sin_theta + dy_dphi * dphi_dr,
         (radius * sin_phi + spin * cos_phi) * cos_theta, dy_dphi],
        [0.0, cos_theta, -radius * sin_theta, 0.0],
    ])
    return np.array([0.0, x, y, z]), jacobian


def zamo_cartesian_ks_state(
    spin: float,
    radius: float,
    theta: float,
    local_direction: np.ndarray,
    ks_azimuth: float = 0.0,
) -> tuple[np.ndarray, dict]:
    frame = zamo_bl_phase_space(spin, radius, theta, local_direction)
    position, jacobian = bl_to_cartesian_ks_jacobian(spin, radius, theta, ks_azimuth)
    # p_BL = J^T p_KS for canonical covectors.
    ks_covector = np.linalg.solve(jacobian.T, frame["covector"])
    state = np.concatenate((position, ks_covector))
    return state, frame
