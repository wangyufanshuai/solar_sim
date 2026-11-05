"""Actual nonlinear volume + stage-local characteristic SAT reference.

Analytic incoming-data experiments only: no CPBC, nonlinear stability theorem,
physical radiative boundary, native restart or black-hole admission. The volume
grid remains a component contract; ONLY this explicit driver applies SAT/RK4.
"""
from __future__ import annotations

from dataclasses import dataclass, replace
import hashlib
import math

import numpy as np

from .ccz4_reference import GaugeConfig
from .fo_ccz4_frozen_characteristics import _speed_families
from .fo_ccz4_frozen_symbol import frozen_fo_ccz4_principal_matrix_3d
from .fo_ccz4_gauge_profile import FOCCZ4GaugeProfile
from .fo_ccz4_principal_symbol import _rhs_components
from .fo_ccz4_rhs import FOCCZ4Config
from .fo_ccz4_sbp_volume import FLAGS, SBPVolumeOperator, state_from_slots

GAUGE = GaugeConfig(shift_coefficient=1., shift_damping=0., theta_coupling=2.)
CONFIG = FOCCZ4Config(tau_inverse=1.)
PROFILE = FOCCZ4GaugeProfile()


def require(value, message):
    if not value:
        raise ValueError(message)


def readonly(value):
    result = np.array(value, dtype=np.float64, order="C", copy=True)
    result.flags.writeable = False
    return result


def face(values, axis, side):
    require(type(axis) is int and axis in (0, 1, 2) and type(side) is int and side in (0, 1), "Cartesian face required")
    selection = [slice(None)]*values.ndim
    selection[axis+1] = 0 if side == 0 else -1
    return values[tuple(selection)]


@dataclass(frozen=True)
class LocalCharacteristicSplit:
    principal: np.ndarray
    positive: np.ndarray
    negative: np.ndarray
    basis: np.ndarray
    roots: np.ndarray
    condition: float
    residual: float
    symmetry_residual: float

    def penalty(self, jump, side, weight):
        jump = np.asarray(jump)
        require(jump.shape == (58,) and jump.dtype.kind in "fiu" and np.all(np.isfinite(jump)), "finite58 jump required")
        require(type(side) is int and side in (0, 1) and math.isfinite(weight) and weight > 0., "face side/weight required")
        # q_t=A_x q_x: left incoming lambda_x<0; right incoming lambda_x>0.
        return ((self.negative if side == 0 else -self.positive) @ jump)/weight


def local_split(h, chi, alpha, beta, axis, *, gauge=GAUGE, config=CONFIG, profile=PROFILE):
    """Current curved coefficient matrix, never a scaled flat-space operator.

    ODE rows/columns decouple exactly. The47 PDE eigenvectors are computed
    after removing their common beta.n advection; this avoids conflating tiny
    PDE speeds with the11 unrelated ODE zeros. No eigenvalue clipping, hidden
    determinant normalization or pseudoinverse is used.
    """
    require(type(axis) is int and axis in (0, 1, 2), "Cartesian axis required")
    n = np.eye(3)[axis]
    principal = frozen_fo_ccz4_principal_matrix_3d(h, chi, alpha, beta, n,
                                                gauge=gauge, config=config, gauge_profile=profile)
    require(not np.any(principal[:11]) and not np.any(principal[:, :11]), "ODE/PDE decoupling required")
    profile.validate_formulation(gauge, config)
    f, mu = profile.coefficients(alpha, chi)
    families = _speed_families(np.asarray(h), chi, alpha, np.zeros(3), n,
                              replace(gauge, shift_coefficient=float(f)), replace(config, ordering_mu=float(mu)))
    families = [row for row in families if row[0] != "ODE"]
    advective = float(np.asarray(beta) @ n)
    centered = principal[11:, 11:]-advective*np.eye(47)
    scale = max(1., float(np.linalg.norm(centered, np.inf)))
    root_scale = max(1., *(abs(row[1]) for row in families))
    groups = []
    for _label, value, count in families:
        if groups and abs(value-groups[-1][0]) <= 1.e-12*root_scale:
            groups[-1][1] += count
        else:
            groups.append([value, count])
    blocks, roots = [], []
    for value, count in groups:
        _, singular, vh = np.linalg.svd(centered-value*np.eye(47))
        size = max(1., float(singular[0]))
        nullities = [int(np.sum(singular <= tol*size)) for tol in (1.e-9, 1.e-10, 1.e-11)]
        require(all(x == count for x in nullities), "ambiguous/incomplete PDE eigenspace")
        blocks.append(vh[-count:].T)
        roots.extend([float(value+advective)]*count)
    basis_pde = np.concatenate(blocks, axis=1)
    require(basis_pde.shape == (47, 47), "complete47 PDE basis required")
    condition = float(np.linalg.cond(basis_pde))
    require(math.isfinite(condition) and condition <= 1.e6, "ill-conditioned PDE eigenbasis")
    inverse = np.linalg.inv(basis_pde)
    roots_pde = np.array(roots)
    residual = float(np.max(abs(principal[11:, 11:]@basis_pde-basis_pde*roots_pde)))/scale
    symmetrizer = inverse.T@inverse
    ha = symmetrizer@principal[11:, 11:]
    symmetry = float(np.max(abs(ha-ha.T)))/max(1., float(np.linalg.norm(ha, np.inf)))
    require(residual <= 2.e-11 and symmetry <= 2.e-11 and np.linalg.eigvalsh(symmetrizer)[0] > 0.,
            "local characteristic residual/energy algebra failed")
    positive, negative = np.zeros((58, 58)), np.zeros((58, 58))
    positive[11:, 11:] = (basis_pde*np.maximum(roots_pde, 0.))@inverse
    negative[11:, 11:] = (basis_pde*np.minimum(roots_pde, 0.))@inverse
    require(np.max(abs(positive+negative-principal))/scale <= 2.e-11, "characteristic splitting failed")
    basis = np.eye(58)
    basis[11:, 11:] = basis_pde
    return LocalCharacteristicSplit(*(readonly(x) for x in (principal, positive, negative, basis,
                                    np.concatenate((np.zeros(11), roots_pde)))), condition, residual, symmetry)


class NonlinearSBPCube:
    """FP64 reference driver with an explicit analytic-incoming SAT contract."""

    def __init__(self, grid, *, gauge=GAUGE, config=CONFIG, profile=PROFILE):
        self.volume = SBPVolumeOperator(grid)
        require(all(9 <= n <= 17 for n in grid.shape), "bounded reference grid9..17 required")
        profile.validate_formulation(gauge, config)
        self.gauge, self.config, self.profile = gauge, config, profile

    @property
    def identity(self):
        return dict(schema="nr-actual-nonlinear-sbp-sat-shadow-v1", shape=list(self.volume.grid.shape),
                    volume_operator=self.volume.identity,
                    boundary="six stage-local characteristic SATs with explicit incoming analytic data",
                    coefficient_cache="exact bytes within one RHS only", ode_pde_split="11+47; PDE advection removed for SVD",
                    integrator="RK4 in58 canonical slots; integer half-step boundary times",
                    source_included=True, algebraic_projection=False, auxiliary_reconstruction=False,
                    common_symmetrizer_validated=False, nonlinear_stability_validated=False,
                    native_checkpoint_supported=False, **{key: False for key in FLAGS})

    def field(self, value):
        raw = np.asarray(value)
        require(raw.shape == (58, *self.volume.grid.shape) and raw.dtype.kind in "fiu"
                and np.all(np.isfinite(raw)), "finite58 canonical cube required")
        return np.ascontiguousarray(raw, dtype=np.float64)

    def state(self, value):
        return state_from_slots(self.volume.grid, self.field(value))

    def boundary_targets(self, reference):
        q = self.field(reference)
        return tuple(np.ascontiguousarray(face(q, axis, side)) for axis in range(3) for side in range(2))

    def targets(self, data):
        require(isinstance(data, (tuple, list)) and len(data) == 6, "six explicit incoming face targets required")
        result = []
        for axis in range(3):
            shape = (58, *(n for d, n in enumerate(self.volume.grid.shape) if d != axis))
            for side in range(2):
                value = np.asarray(data[2*axis+side])
                require(value.shape == shape and value.dtype.kind in "fiu" and np.all(np.isfinite(value)), "invalid incoming face target")
                result.append(np.asarray(value, dtype=np.float64))
        return tuple(result)

    def cfl(self, state, dt):
        require(not isinstance(dt, (bool, str, complex)) and np.isscalar(dt)
                and math.isfinite(dt) and dt > 0., "positive finite dt required")
        h_inverse = np.linalg.inv(state.base.h)
        alpha, chi, beta = state.base.lapse, state.base.chi, state.base.shift
        f, mu = self.profile.coefficients(alpha, chi)
        speeds = []
        for axis in range(3):
            hn = h_inverse[..., axis, axis]
            speed = np.maximum.reduce((alpha*np.sqrt(chi*hn), np.sqrt(2.*alpha*chi*hn),
                                       np.sqrt(4.*f*hn/3.), alpha*np.sqrt(mu*hn/2.),
                                       np.sqrt(f*hn), .5*alpha*np.sqrt(mu*hn)))
            speeds.append(float(np.max(abs(beta[..., axis])+speed)))
        value = dt*sum(speed/dx for speed, dx in zip(speeds, self.volume.grid.spacing, strict=True))
        require(value <= .25*(1.+1.e-14), "stage exceeds declared reference CFL cap")
        return float(value)

    def rhs(self, values, data, dt):
        q, targets = self.field(values), self.targets(data)
        state = self.state(q)
        cfl = self.cfl(state, dt)
        bulk = np.array(_rhs_components(self.volume.rhs(
            state, gauge=self.gauge, config=self.config, gauge_profile=self.profile)), dtype=np.float64)
        result = bulk.copy()
        cache, face_rows = {}, []
        worst_condition = worst_residual = 0.
        for axis in range(3):
            tangent = [d for d in range(3) if d != axis]
            for side in range(2):
                target = targets[2*axis+side]
                addition = np.zeros_like(target)
                weight = self.volume.axes[axis].norm_weights[0 if side == 0 else -1]
                for ij in np.ndindex(target.shape[1:]):
                    point = [0, 0, 0]
                    point[axis] = 0 if side == 0 else self.volume.grid.shape[axis]-1
                    for d, index in zip(tangent, ij, strict=True):
                        point[d] = index
                    point = tuple(point)
                    cell = q[(slice(None), *point)]
                    key = (axis, cell[:11].tobytes())
                    if key not in cache:
                        cache[key] = local_split(state.base.h[point], state.base.chi[point], state.base.lapse[point],
                                                 state.base.shift[point], axis, gauge=self.gauge,
                                                 config=self.config, profile=self.profile)
                    split = cache[key]
                    addition[(slice(None), *ij)] = split.penalty(cell-target[(slice(None), *ij)], side, weight)
                    worst_condition = max(worst_condition, split.condition)
                    worst_residual = max(worst_residual, split.residual, split.symmetry_residual)
                face(result, axis, side)[...] += addition
                face_rows.append(dict(axis=axis, side=side, sat_max_abs=float(np.max(abs(addition)))))
        require(np.all(np.isfinite(result)), "nonfinite coupled nonlinear RHS")
        # The packed ODE block cannot receive a penalty, even at corners.
        require(np.array_equal(result[:11], bulk[:11]), "SAT modified ODE equations")
        report = dict(cfl=cfl, coefficients_sha256=hashlib.sha256(q[:11].tobytes()).hexdigest(),
                      basis_builds=len(cache), max_basis_condition=worst_condition,
                      max_characteristic_residual=worst_residual, faces=face_rows,
                      sat_max_abs=max(row["sat_max_abs"] for row in face_rows),
                      min_lapse=float(np.min(state.base.lapse)), min_chi=float(np.min(state.base.chi)),
                      det_h_max_error=float(np.max(abs(np.linalg.det(state.base.h)-1.))))
        return result, report

    def step(self, values, step_index, dt, boundary):
        require(type(step_index) is int and step_index >= 0 and callable(boundary), "integer step and explicit boundary callback required")
        q = self.field(values)
        k1, r1 = self.rhs(q, boundary(2*step_index), dt)
        k2, r2 = self.rhs(q+.5*dt*k1, boundary(2*step_index+1), dt)
        k3, r3 = self.rhs(q+.5*dt*k2, boundary(2*step_index+1), dt)
        k4, r4 = self.rhs(q+dt*k3, boundary(2*step_index+2), dt)
        result = self.field(q+dt*(k1+2.*k2+2.*k3+k4)/6.).copy()
        self.state(result)  # Validate, never repair or project the endpoint.
        return result, [dict(stage=i+1, **r) for i, r in enumerate((r1, r2, r3, r4))]

    def metric_constraints(self, values):
        """Direct metric/physical K tensors; H/M do not use evolved A/B/D/P."""
        state = self.state(values)
        b = state.base
        metric = b.h/b.chi[..., None, None]
        inverse = np.linalg.inv(metric)
        extrinsic = (b.a+b.h*(b.trace_k/3.)[..., None, None])/b.chi[..., None, None]
        mixed = np.einsum("...jk,...ki->...ji", inverse, extrinsic)
        trace = np.trace(mixed, axis1=-2, axis2=-1)
        def derivative(value, axis):
            return self.volume.axes[axis].derivative(value, axis=axis)
        dg = [derivative(metric, k) for k in range(3)]
        connection = np.zeros((*b.grid.shape, 3, 3, 3))
        for k in range(3):
            for i in range(3):
                for j in range(3):
                    connection[..., k, i, j] = .5*sum(inverse[..., k, ell]*(dg[i][..., ell, j]
                        +dg[j][..., ell, i]-dg[ell][..., i, j]) for ell in range(3))
        dc = [derivative(connection, k) for k in range(3)]
        ricci = np.zeros_like(metric)
        for i in range(3):
            for j in range(3):
                ricci[..., i, j] = sum(dc[k][..., k, i, j]-dc[j][..., k, i, k] for k in range(3))
                ricci[..., i, j] += sum(connection[..., k, i, j]*connection[..., ell, k, ell]
                    -connection[..., ell, i, k]*connection[..., k, j, ell] for k in range(3) for ell in range(3))
        hamiltonian = np.einsum("...ij,...ij->...", inverse, ricci)+trace**2-np.einsum("...ij,...ji->...", mixed, mixed)
        dk = [derivative(mixed, k) for k in range(3)]
        momentum = np.zeros((*b.grid.shape, 3))
        for i in range(3):
            momentum[..., i] = sum(dk[j][..., j, i] for j in range(3))-derivative(trace, i)
            momentum[..., i] += sum(connection[..., j, j, ell]*mixed[..., ell, i]
                -connection[..., ell, j, i]*mixed[..., j, ell] for j in range(3) for ell in range(3))
        aux = state.auxiliary
        fields = dict(H_metric=hamiltonian, M_metric=momentum, det_h=np.linalg.det(b.h)-1.,
                      trace_a=np.einsum("...ij,...ij->...", np.linalg.inv(b.h), b.a), Theta=b.theta,
                      C_A=aux.lapse_gradient-np.stack([derivative(np.log(b.lapse), k) for k in range(3)], axis=-1),
                      C_P=aux.conformal_factor_gradient-np.stack([derivative(.5*np.log(b.chi), k) for k in range(3)], axis=-1),
                      C_B=aux.shift_gradient-np.stack([derivative(b.shift, k) for k in range(3)], axis=-2),
                      C_D=aux.metric_gradient-.5*np.stack([derivative(b.h, k) for k in range(3)], axis=-3))
        require(all(np.all(np.isfinite(v)) for v in fields.values()), "nonfinite diagnostic")
        return fields

    def diagnostics(self, values):
        weights = np.einsum("i,j,k->ijk", *(axis.norm_weights for axis in self.volume.axes))
        norms = {}
        for key, field in self.metric_constraints(values).items():
            components = field.reshape((*self.volume.grid.shape, -1))
            norms[key] = float(np.sqrt(np.sum(weights*np.mean(components**2, axis=-1))/np.sum(weights)))
        return norms
