"""Source-inclusive full58 frozen FO-CCZ4 SBP/SAT reference.

q_t=A(n) q_x+S q about Minkowski, using the current f=3,mu=.2 candidate
and finite-rate algebraic relaxation. Physical speeds are -eig(A). This is
a plane reduction of the full system, NOT a nonlinear/3-D/physical CPBC.
Boundary inputs are perturbations in canonical slot order, not full metrics.
"""
from __future__ import annotations

from dataclasses import dataclass, replace
import math

import numpy as np
from scipy.linalg import expm

from .fo_ccz4 import FOCCZ4_VARIABLE_ORDER
from .fo_ccz4_analytic_symbol import analytic_fo_ccz4_principal_matrix_3d
from .fo_ccz4_frozen_characteristics import audit_frozen_fo_ccz4_eigenspaces_3d
from .fo_ccz4_frozen_symbol import frozen_fo_ccz4_principal_matrix_3d
from .fo_ccz4_linear_modes import CONFIG, GAUGE, INDEX, PROFILE, minkowski_source_matrix
from .manifest import FOCCZ4_CPP_PARAMETER_CONTRACT
from .sbp_boundary_operator import SBP42

FLAGS = ("physical_validation", "physical_boundary_validated", "black_hole_evolution_validated",
         "amr_validated", "waveform_validated", "gpu_validated", "runtime_writeback",
         "scientificPayloadWriteback")


def _real(value, shape, name):
    raw = np.asarray(value)
    if raw.dtype.kind not in "fiu" or raw.shape != shape or not np.all(np.isfinite(raw)):
        raise ValueError(f"finite real {name} with shape{shape} required")
    return np.asarray(raw, dtype=float)


def _positive(value, name, *, zero=False):
    if (isinstance(value, (bool, complex, str)) or not np.isscalar(value)
            or not math.isfinite(value) or value < 0. or (not zero and value == 0.)):
        raise ValueError(f"finite {'nonnegative' if zero else 'positive'} {name} required")
    return float(value)


def unit_normal(normal):
    n = _real(normal, (3,), "normal")
    scale = float(np.max(np.abs(n)))
    if scale == 0.:
        raise ValueError("nonzero normal required")
    n = n/scale
    return n/np.linalg.norm(n)


def source_matrix(tau_inverse=1.):
    """Independent flat source Jacobian, including BOTH trace relaxations."""
    rate = _positive(tau_inverse, "tau_inverse", zero=True)
    source = minkowski_source_matrix(PROFILE)
    for prefix in ("h", "A"):
        for i in range(3):
            for j in range(3):
                source[INDEX[f"{prefix}{i}{i}"], INDEX[f"{prefix}{j}{j}"]] -= rate
    return source


def _readonly(array):
    result = np.array(array, dtype=float, copy=True)
    result.flags.writeable = False
    return result


@dataclass(frozen=True)
class FrozenSystem:
    normal: np.ndarray
    tau_inverse: float
    principal: np.ndarray
    source: np.ndarray
    basis: np.ndarray
    inverse_basis: np.ndarray
    roots: np.ndarray
    symmetrizer: np.ndarray
    source_log_norm: float
    basis_condition: float
    principal_crosscheck_error: float
    eigen_residual: float
    symmetrization_residual: float

    @property
    def identity(self):
        return {
            "schema": "nr-frozen-fo-full58-system-v1", "scope": "Minkowski-linearization-plane-reduction",
            "variable_order": list(FOCCZ4_VARIABLE_ORDER), "equation": "q_t=A(n)*q_x+S*q",
            "normal": self.normal.tolist(), "physical_speeds": (-self.roots).tolist(),
            "parameters": {**FOCCZ4_CPP_PARAMETER_CONTRACT, "tau_inverse": self.tau_inverse},
            "gauge_profile": PROFILE.identity(), "background": {"alpha": 1., "chi": 1., "beta": [0., 0., 0.]},
            "basis_rank": 58, "left_incoming": int(np.sum(self.roots < 0.)),
            "right_incoming": int(np.sum(self.roots > 0.)), "zero_modes": int(np.sum(self.roots == 0.)),
            "basis_condition": self.basis_condition, "principal_crosscheck_error": self.principal_crosscheck_error,
            "eigen_residual": self.eigen_residual, "symmetrization_residual": self.symmetrization_residual,
            "source_log_norm": self.source_log_norm, "strong_hyperbolicity_validated": False,
            "cpbc_ready": False, **{key: False for key in FLAGS},
        }


def build_system(normal=(1., 0., 0.), *, tau_inverse=1.):
    """A complete numerical basis at ONE flat coefficient point/direction."""
    n = unit_normal(normal)
    source = source_matrix(tau_inverse)
    gauge = replace(GAUGE, shift_coefficient=PROFILE.shift_scale)
    config = replace(CONFIG, ordering_mu=PROFILE.ordering_scale, tau_inverse=tau_inverse)
    principal = frozen_fo_ccz4_principal_matrix_3d(np.eye(3), 1., 1., np.zeros(3), n,
                                                gauge=gauge, config=config)
    analytic = analytic_fo_ccz4_principal_matrix_3d(normal=n, gauge=gauge, config=config)
    crosscheck = float(np.max(np.abs(principal-analytic)))
    audit = audit_frozen_fo_ccz4_eigenspaces_3d(np.eye(3), 1., 1., np.zeros(3), n,
                                             gauge=GAUGE, config=config, gauge_profile=PROFILE)
    if not audit.pointwise_eigenbasis_validated or crosscheck > 2.e-11:
        raise ValueError("full58 frozen principal/basis gate failed")
    blocks, speeds = [], []
    for root in audit.roots:
        _, singular, vh = np.linalg.svd(principal-root.value*np.eye(58))
        scale = max(1., float(singular[0]))
        counts = [int(np.sum(singular <= tol*scale)) for tol in (1.e-9, 1.e-10, 1.e-11)]
        if any(count != root.algebraic_multiplicity for count in counts):
            raise ValueError("unstable frozen eigenspace dimension")
        blocks.append(vh[-counts[-1]:].T)
        speeds.extend([root.value]*counts[-1])
    basis, roots = np.concatenate(blocks, axis=1), np.array(speeds)
    condition = float(np.linalg.cond(basis))
    if basis.shape != (58, 58) or condition > 1.e6:
        raise ValueError("incomplete or ill-conditioned frozen basis")
    inverse = np.linalg.inv(basis)  # Never a pseudoinverse or replacement basis.
    symmetrizer = inverse.T@inverse
    eigen_error = float(np.max(np.abs(principal@basis-basis*roots)))/max(1., float(np.linalg.norm(principal, np.inf)))
    ha = symmetrizer@principal
    symmetry_error = float(np.max(np.abs(ha-ha.T)))/max(1., float(np.linalg.norm(ha, np.inf)))
    if eigen_error > 2.e-11 or symmetry_error > 2.e-11 or np.linalg.eigvalsh(symmetrizer)[0] <= 0.:
        raise ValueError("frozen symmetrizer gate failed")
    characteristic_source = inverse@source@basis
    log_norm = float(np.linalg.eigvalsh((characteristic_source+characteristic_source.T)/2.)[-1])
    return FrozenSystem(_readonly(n), float(tau_inverse), _readonly(principal), _readonly(source),
                        _readonly(basis), _readonly(inverse), _readonly(roots), _readonly(symmetrizer),
                        log_norm, condition, crosscheck, eigen_error, symmetry_error)


@dataclass(frozen=True)
class FrozenSBPLine:
    system: FrozenSystem
    operator: SBP42

    def __post_init__(self):
        if not isinstance(self.system, FrozenSystem) or not isinstance(self.operator, SBP42):
            raise ValueError("frozen system and SBP42 required")

    def _field(self, values):
        return _real(values, (self.operator.points, 58), "full58 field")

    @staticmethod
    def _boundary(data):
        return np.zeros((2, 58)) if data is None else _real(data, (2, 58), "boundary data")

    def penalties(self, values, data=None):
        q, g = self._field(values), self._boundary(data)
        s = self.system
        characteristic_jump = (q[[0, -1]]-g)@s.inverse_basis.T
        left = (np.minimum(s.roots, 0.)*characteristic_jump[0])@s.basis.T/self.operator.norm_weights[0]
        right = -(np.maximum(s.roots, 0.)*characteristic_jump[1])@s.basis.T/self.operator.norm_weights[-1]
        return np.stack((left, right))

    def rhs(self, values, data=None):
        q = self._field(values)
        result = self.operator.derivative(q)@self.system.principal.T + q@self.system.source.T
        result[[0, -1]] += self.penalties(q, data)
        if not np.all(np.isfinite(result)):
            raise ValueError("nonfinite full58 RHS")
        return result

    def energy(self, values):
        w = self._field(values)@self.system.inverse_basis.T
        return float(np.sum(self.operator.norm_weights[:, None]*w*w)/2.)

    def norm(self, values):
        return math.sqrt(2.*self.energy(values))

    def balance(self, values, data=None):
        q, g = self._field(values), self._boundary(data)
        s, weights = self.system, self.operator.norm_weights
        hq = q@s.symmetrizer
        rhs = self.rhs(q, g)
        direct = float(np.sum(weights[:, None]*hq*rhs))
        source = float(np.sum(weights[:, None]*hq*(q@s.source.T)))
        flux = float((hq[-1]@s.principal@q[-1]-hq[0]@s.principal@q[0])/2.)
        penalty = float(np.sum(weights[[0, -1], None]*hq[[0, -1]]*self.penalties(q, g)))
        w, v = q[[0, -1]]@s.inverse_basis.T, g@s.inverse_basis.T
        incoming_loss, outgoing_loss, injection = 0., 0., 0.
        for face, incoming in ((0, s.roots < 0.), (1, s.roots > 0.)):
            incoming_loss += float(np.sum(np.abs(s.roots[incoming])*(w[face, incoming]-v[face, incoming])**2)/2.)
            outgoing_loss += float(np.sum(np.abs(s.roots[~incoming])*w[face, ~incoming]**2)/2.)
            injection += float(np.sum(np.abs(s.roots[incoming])*v[face, incoming]**2)/2.)
        characteristic_boundary = injection-incoming_loss-outgoing_loss
        energy = self.energy(q)
        return {"energy": energy, "direct_rate": direct, "source_rate": source, "boundary_flux": flux,
                "sat_rate": penalty, "balance_residual": direct-source-flux-penalty,
                "characteristic_boundary_rate": characteristic_boundary,
                "boundary_identity_residual": flux+penalty-characteristic_boundary,
                "incoming_loss": incoming_loss, "outgoing_loss": outgoing_loss, "injection": injection,
                "source_bound": 2.*s.source_log_norm*energy,
                "source_excess": source-2.*s.source_log_norm*energy}

    def step(self, values, step_index, dt, boundary=None):
        """RK4; boundary callback uses INTEGER half-step indices for replay."""
        q = self._field(values)
        dt = _positive(dt, "dt")
        if type(step_index) is not int or step_index < 0:
            raise ValueError("nonnegative integer step index required")
        if (dt*np.max(np.abs(self.system.roots))/self.operator.spacing > .25*(1.+1.e-14)
                or dt*np.linalg.norm(self.system.source, np.inf) > .25*(1.+1.e-14)):
            raise ValueError("step exceeds declared frozen CFL/source caps")
        if boundary is not None and not callable(boundary):
            raise ValueError("boundary must be a half-step callback")
        get = (lambda index: None) if boundary is None else boundary
        left, middle, right = get(2*step_index), get(2*step_index+1), get(2*step_index+2)
        k1 = self.rhs(q, left)
        k2 = self.rhs(q+.5*dt*k1, middle)
        k3 = self.rhs(q+.5*dt*k2, middle)
        k4 = self.rhs(q+dt*k3, right)
        return self._field(q+dt*(k1+2.*k2+2.*k3+k4)/6.).copy()


def weighted_l2(values, weights):
    q = np.asarray(values)
    w = _real(weights, (q.shape[0],), "norm weights") if q.ndim else None
    if w is None or np.any(w <= 0.) or not np.all(np.isfinite(q)) or np.iscomplexobj(q):
        raise ValueError("finite real field and positive norm required")
    return float(np.sqrt(np.sum(w*np.sum(q.reshape(len(w), -1)**2, axis=1))))


def constraint_fields(values, first, second, normal):
    """Linear plane constraints; metric diagnostics do NOT use evolved D/P.

    Away from tr(A)=0, reconstructed K_ij has trace K+tr(A); its ADM momentum
    differs from the stored-K FO row by -d_i tr(A). Both are reported.
    """
    raw = np.asarray(values)
    if raw.ndim != 2 or raw.shape[1] != 58:
        raise ValueError("full58 line required for constraints")
    q, dq, ddq = (_real(v, raw.shape, "constraint field") for v in (values, first, second))
    n = unit_normal(normal)
    def sym(v, prefix, i, j):
        return v[:, INDEX[f"{prefix}{min(i,j)}{max(i,j)}"]]
    def dslot(v, k, i, j):
        return v[:, INDEX[f"D{k}{min(i,j)}{max(i,j)}"]]
    trace_h = sum(q[:, INDEX[f"h{i}{i}"]] for i in range(3))
    trace_a = sum(q[:, INDEX[f"A{i}{i}"]] for i in range(3))
    d_trace_h = sum(dq[:, INDEX[f"h{i}{i}"]] for i in range(3))
    d_trace_a = sum(dq[:, INDEX[f"A{i}{i}"]] for i in range(3))
    h_metric = sum(n[i]*n[j]*sym(ddq, "h", i, j) for i in range(3) for j in range(3))
    h_metric -= sum(ddq[:, INDEX[f"h{i}{i}"]] for i in range(3))
    h_metric += 4.*ddq[:, INDEX["ln_phi"]]
    h_fo = sum(2.*n[i]*(dslot(dq, j, i, j)-dslot(dq, i, j, j))
               for i in range(3) for j in range(3))
    h_fo += sum(4.*n[i]*dq[:, INDEX[f"P{i}"]] for i in range(3))
    momentum = np.stack([sum(n[j]*sym(dq, "A", i, j) for j in range(3))
                         -2./3.*n[i]*dq[:, INDEX["K"]] for i in range(3)], axis=1)
    gamma = np.stack([q[:, INDEX[f"GammaHat{i}"]]-sum(n[j]*sym(dq, "h", i, j) for j in range(3))
                     +.5*n[i]*d_trace_h for i in range(3)], axis=1)
    return {"H_metric": h_metric, "H_fo": h_fo, "M_stored_K": momentum,
            "M_metric": momentum-d_trace_a[:, None]*n, "Gamma_metric": gamma,
            "Theta": q[:, INDEX["Theta"]], "trace_h": trace_h, "trace_a": trace_a,
            "C_A": np.stack([q[:, INDEX[f"A{i}"]]-n[i]*dq[:, INDEX["ln_alpha"]] for i in range(3)], axis=1),
            "C_P": np.stack([q[:, INDEX[f"P{i}"]]-n[i]*dq[:, INDEX["ln_phi"]] for i in range(3)], axis=1),
            "C_B": np.stack([q[:, INDEX[f"B{i}{j}"]]-n[i]*dq[:, INDEX[f"beta{j}"]]
                             for i in range(3) for j in range(3)], axis=1),
            "C_D": np.stack([dslot(q, k, i, j)-.5*n[k]*sym(dq, "h", i, j)
                             for k in range(3) for i in range(3) for j in range(i, 3)], axis=1)}


def plane_mode(family, normal, *, amplitude=1.e-3, wave_number=np.pi):
    amplitude = _positive(amplitude, "amplitude")
    k = _positive(wave_number, "wave number")
    n = unit_normal(normal)
    if family == "full58":
        j = np.arange(1, 59)
        return amplitude*(np.sin(j)+1j*np.cos(2*j))/np.sqrt(58.)
    if family != "tt-plus":
        raise ValueError("unknown plane family")
    tangent = np.eye(3)[int(np.argmin(np.abs(n)))]
    tangent = tangent-np.dot(tangent, n)*n
    tangent /= np.linalg.norm(tangent)
    other = np.cross(n, tangent)
    polarization = amplitude*(np.outer(tangent, tangent)-np.outer(other, other))
    mode = np.zeros(58, dtype=complex)
    for i in range(3):
        for j in range(i, 3):
            mode[INDEX[f"h{i}{j}"]] = polarization[i, j]
            mode[INDEX[f"A{i}{j}"]] = .5j*k*polarization[i, j]
            for axis in range(3):
                mode[INDEX[f"D{axis}{i}{j}"]] = .5j*k*n[axis]*polarization[i, j]
    return mode


def plane_values(mode, coordinates, *, wave_number=np.pi, derivative=0):
    v, x = np.asarray(mode, dtype=complex), np.asarray(coordinates)
    if (v.shape != (58,) or not np.all(np.isfinite(v)) or x.ndim != 1 or not len(x)
            or type(derivative) is not int or derivative not in (0, 1, 2)):
        raise ValueError("finite58 mode, line coordinates and derivative0/1/2 required")
    x = _real(x, x.shape, "coordinates")
    k = _positive(wave_number, "wave number")
    return np.real(np.exp(1j*k*x[:, None])*(1j*k)**derivative*v)


class PlaneBoundary:
    """Finite half-step table of continuum amplitudes; no discrete state feedback."""

    def __init__(self, system, mode, dt, steps, *, wave_number=np.pi, endpoints=(-1., 1.)):
        dt = _positive(dt, "dt")
        k = _positive(wave_number, "wave number")
        if type(steps) is not int or not 1 <= steps <= 16384:
            raise ValueError("steps must be an integer in[1,16384]")
        v = np.asarray(mode, dtype=complex)
        if v.shape != (58,) or not np.all(np.isfinite(v)):
            raise ValueError("finite58 initial mode required")
        self.endpoints = _real(endpoints, (2,), "endpoints").copy()
        if self.endpoints[1] <= self.endpoints[0]:
            raise ValueError("ordered endpoints required")
        generator = system.source+1j*k*system.principal
        half_step = expm(.5*dt*generator)
        amplitudes = np.empty((2*steps+1, 58), dtype=complex)
        amplitudes[0] = v
        for index in range(2*steps):
            amplitudes[index+1] = half_step@amplitudes[index]
        self.final_mode = expm(dt*steps*generator)@v
        self.table_error = float(np.max(np.abs(self.final_mode-amplitudes[-1])))
        if self.table_error > 2.e-12 or not np.all(np.isfinite(amplitudes)):
            raise ValueError("continuum boundary table disagrees with direct exponential")
        self.amplitudes, self.wave_number = amplitudes, k
        self.amplitudes.flags.writeable = False

    def __call__(self, half_index):
        if type(half_index) is not int or not 0 <= half_index < len(self.amplitudes):
            raise ValueError("half-step boundary index out of range")
        return plane_values(self.amplitudes[half_index], self.endpoints, wave_number=self.wave_number)
