"""Full58 constant-coefficient 3-D SBP/SAT candidate, NOT physical CPBC.

All three principal operators act simultaneously. Face SATs add at edges and
corners. Directional line symmetrizers are not treated as a common cube norm;
Euclidean energy accounting explicitly retains skew-principal volume terms.
The nonlinear/curved solver and native checkpoint formats are untouched.
"""
from __future__ import annotations

from dataclasses import dataclass
import math

import numpy as np
from scipy.linalg import expm

from . import fo_ccz4_sbp_frozen as F

INDEX = F.INDEX
NORMALS = tuple(F.unit_normal(n) for n in ((1., 2., 3.), (-2., 1., 1.), (1., -3., 2.)))
PHASES = (0., .37, .81)


def face(values, axis, side):
    selection = [slice(None)]*values.ndim
    selection[axis] = 0 if side == 0 else -1
    return values[tuple(selection)]


@dataclass(frozen=True)
class FrozenSBPCube:
    operators: tuple
    systems: tuple

    def __post_init__(self):
        if len(self.operators) != 3 or len(self.systems) != 3:
            raise ValueError("three spatial operators and systems required")
        for axis, (operator, system) in enumerate(zip(self.operators, self.systems)):
            if not isinstance(operator, F.SBP42) or not isinstance(system, F.FrozenSystem):
                raise ValueError("SBP42 and frozen FO systems required")
            if not np.array_equal(system.normal, np.eye(3)[axis]):
                raise ValueError("positive Cartesian axis principal matrices required")
            if not np.array_equal(system.source, self.systems[0].source):
                raise ValueError("one identical source matrix required")

    @classmethod
    def box(cls, points, *, systems=None):
        if type(points) is int:
            points = (points,)*3
        if not isinstance(points, (tuple, list)) or len(points) != 3:
            raise ValueError("three integer grid counts required")
        if any(type(n) is not int or not 9 <= n <= 65 for n in points):
            raise ValueError("shadow cube grid counts must be in[9,65]")
        return cls(tuple(F.SBP42(n, 2./(n-1)) for n in points),
                   tuple(F.build_system(n) for n in np.eye(3)) if systems is None else tuple(systems))

    @property
    def shape(self):
        return tuple(op.points for op in self.operators)

    @property
    def weights(self):
        x, y, z = (op.norm_weights for op in self.operators)
        return x[:, None, None]*y[None, :, None]*z[None, None, :]

    @property
    def source(self):
        return self.systems[0].source

    @property
    def identity(self):
        h = self.systems[0].symmetrizer
        defects = []
        for system in self.systems:
            product = h@system.principal
            defects.append(float(np.max(np.abs(product-product.T)))/max(1., float(np.linalg.norm(product, np.inf))))
        return {"schema": "nr-full58-frozen-sbp-cube-v1", "shape": list(self.shape),
                "operators": [op.identity for op in self.operators],
                "equation": "q_t=sum_d A_d D_d q+S q+six additive SAT faces",
                "energy_norm": "tensor-spatial-weights-times-Euclidean-components",
                "x_symmetrizer_defects_on_xyz": defects, "common_symmetrizer_validated": False,
                "nonlinear": False, "cpbc_ready": False, "strong_hyperbolicity_validated": False,
                **{key: False for key in F.FLAGS}}

    def field(self, values):
        # np.real(complex_array) is strided; an npy restore is contiguous.
        # Normalize layout before BLAS to keep restart arithmetic identical.
        return np.ascontiguousarray(F._real(values, self.shape+(58,), "full58 cube"))

    def boundaries(self, data):
        if data is not None and (not isinstance(data, (tuple, list)) or len(data) != 6):
            raise ValueError("six face arrays required")
        result = []
        for axis in range(3):
            shape = tuple(n for i, n in enumerate(self.shape) if i != axis)+(58,)
            for side in range(2):
                result.append(np.zeros(shape) if data is None else F._real(data[2*axis+side], shape, "incoming face data"))
        return tuple(result)

    def penalty_faces(self, values, data=None):
        q, targets = self.field(values), self.boundaries(data)
        result = []
        for axis, (system, operator) in enumerate(zip(self.systems, self.operators)):
            for side in range(2):
                jump = (face(q, axis, side)-targets[2*axis+side])@system.inverse_basis.T
                speeds = np.minimum(system.roots, 0.) if side == 0 else -np.maximum(system.roots, 0.)
                weight = operator.norm_weights[0 if side == 0 else -1]
                result.append((jump*speeds)@system.basis.T/weight)
        return tuple(result)

    def rhs(self, values, data=None):
        q = self.field(values)
        result = q@self.source.T  # Source appears ONCE, not once per dimension.
        for axis, (operator, system) in enumerate(zip(self.operators, self.systems)):
            result += operator.derivative(q, axis=axis)@system.principal.T
        for index, penalty in enumerate(self.penalty_faces(q, data)):
            face(result, index//2, index%2)[...] += penalty
        return self.field(result)

    def norm(self, values):
        q = np.asarray(values)
        if q.shape[:3] != self.shape or q.ndim < 3 or np.iscomplexobj(q) or not np.all(np.isfinite(q)):
            raise ValueError("finite real cube-aligned norm field required")
        return float(np.sqrt(np.sum(self.weights*np.sum(q.reshape(self.shape+(-1,))**2, axis=-1))))

    def balance(self, values, data=None):
        q = self.field(values)
        weights = self.weights
        direct = float(np.sum(weights*np.sum(q*self.rhs(q, data), axis=-1)))
        source = float(np.sum(weights*np.sum(q*(q@self.source.T), axis=-1)))
        flux, skew, sat = 0., 0., 0.
        penalties = self.penalty_faces(q, data)
        for axis, (operator, system) in enumerate(zip(self.operators, self.systems)):
            a = system.principal
            symmetric, antisymmetric = .5*(a+a.T), .5*(a-a.T)
            derivative = operator.derivative(q, axis=axis)
            skew += float(np.sum(weights*np.sum(q*(derivative@antisymmetric.T), axis=-1)))
            for side in range(2):
                value = face(q, axis, side)
                volume_weights = face(weights, axis, side)
                surface_weights = volume_weights/operator.norm_weights[0 if side == 0 else -1]
                sign = -1. if side == 0 else 1.
                flux += sign*.5*float(np.sum(surface_weights*np.sum(value*(value@symmetric.T), axis=-1)))
                sat += float(np.sum(volume_weights*np.sum(value*penalties[2*axis+side], axis=-1)))
        return {"energy": .5*self.norm(q)**2, "direct_rate": direct, "source_rate": source,
                "symmetric_face_flux": flux, "skew_volume_rate": skew, "sat_rate": sat,
                "balance_residual": direct-source-flux-skew-sat}

    def step(self, values, step_index, dt, boundary=None):
        q, dt = self.field(values), F._positive(dt, "dt")
        if type(step_index) is not int or step_index < 0:
            raise ValueError("nonnegative integer step index required")
        speed_sum = sum(np.max(np.abs(s.roots))/op.spacing for s, op in zip(self.systems, self.operators))
        if dt*speed_sum > .25*(1.+1.e-14) or dt*np.linalg.norm(self.source, np.inf) > .25*(1.+1.e-14):
            raise ValueError("step exceeds three-dimensional CFL/source caps")
        if boundary is not None and not callable(boundary):
            raise ValueError("boundary must be an integer half-step callback")
        get = (lambda i: None) if boundary is None else boundary
        left, middle, right = get(2*step_index), get(2*step_index+1), get(2*step_index+2)
        k1 = self.rhs(q, left)
        k2 = self.rhs(q+.5*dt*k1, middle)
        k3 = self.rhs(q+.5*dt*k2, middle)
        k4 = self.rhs(q+dt*k3, right)
        return self.field(q+dt*(k1+2.*k2+2.*k3+k4)/6.).copy()

    def diagnostics(self, values, exact=None):
        q = self.field(values)
        gradient = tuple(op.derivative(q, axis=d) for d, op in enumerate(self.operators))
        def second(i, j, slot):
            return self.operators[i].derivative(gradient[j][..., slot], axis=i)
        observed = constraint_fields(q, gradient, second)
        result = {"constraint_norms": {k: self.norm(v) for k, v in observed.items()}}
        if exact is not None:
            reference = constraint_fields(exact[0], exact[1], exact[2])
            result["constraint_errors"] = {k: self.norm(observed[k]-v) for k, v in reference.items()}
            result["reference_constraint_norms"] = {k: self.norm(v) for k, v in reference.items()}
        return result


def constraint_fields(values, gradient, second):
    """Linear full3-D constraints, including mixed metric second derivatives.

    `second(i,j,slot)` returns the selected exact/discrete derivative. Metric
    Hamiltonian uses h/ln_phi, not D/P. Physical K_ij has trace K+tr(A).
    """
    q = np.asarray(values)
    if q.ndim != 4 or q.shape[-1] != 58 or len(gradient) != 3 or not callable(second):
        raise ValueError("full cube and three first derivatives required")
    q = F._real(q, q.shape, "constraint cube")
    dq = tuple(F._real(g, q.shape, "constraint derivative") for g in gradient)
    def slot(prefix, i, j):
        return INDEX[f"{prefix}{min(i,j)}{max(i,j)}"]
    trace_h = sum(q[..., slot("h", i, i)] for i in range(3))
    trace_a = sum(q[..., slot("A", i, i)] for i in range(3))
    dh = tuple(sum(g[..., slot("h", i, i)] for i in range(3)) for g in dq)
    da = tuple(sum(g[..., slot("A", i, i)] for i in range(3)) for g in dq)
    h_metric = sum(second(i, j, slot("h", i, j)) for i in range(3) for j in range(3))
    h_metric -= sum(second(i, i, slot("h", j, j)) for i in range(3) for j in range(3))
    h_metric += 4.*sum(second(i, i, INDEX["ln_phi"]) for i in range(3))
    h_fo = sum(2.*dq[i][..., INDEX[f"D{j}{min(i,j)}{max(i,j)}"]]
               -2.*dq[i][..., INDEX[f"D{i}{j}{j}"]] for i in range(3) for j in range(3))
    h_fo += 4.*sum(dq[i][..., INDEX[f"P{i}"]] for i in range(3))
    momentum = np.stack([sum(dq[j][..., slot("A", i, j)] for j in range(3))
                         -2./3.*dq[i][..., INDEX["K"]] for i in range(3)], axis=-1)
    gamma = np.stack([q[..., INDEX[f"GammaHat{i}"]]-sum(dq[j][..., slot("h", i, j)] for j in range(3))
                     +.5*dh[i] for i in range(3)], axis=-1)
    result = {"H_metric": h_metric, "H_fo": h_fo, "M_stored_K": momentum,
              "M_metric": momentum-np.stack(da, axis=-1), "Gamma_metric": gamma,
              "Theta": q[..., INDEX["Theta"]], "trace_h": trace_h, "trace_a": trace_a,
              "C_A": np.stack([q[..., INDEX[f"A{i}"]]-dq[i][..., INDEX["ln_alpha"]] for i in range(3)], axis=-1),
              "C_P": np.stack([q[..., INDEX[f"P{i}"]]-dq[i][..., INDEX["ln_phi"]] for i in range(3)], axis=-1),
              "C_B": np.stack([q[..., INDEX[f"B{k}{i}"]]-dq[k][..., INDEX[f"beta{i}"]]
                               for k in range(3) for i in range(3)], axis=-1),
              "C_D": np.stack([q[..., INDEX[f"D{k}{i}{j}"]]-.5*dq[k][..., slot("h", i, j)]
                               for k in range(3) for i in range(3) for j in range(i, 3)], axis=-1)}
    if any(not np.all(np.isfinite(v)) for v in result.values()):
        raise ValueError("nonfinite cube constraints")
    return result


class CubeWaves:
    """Three nonparallel continuum modes and six compatible face tables."""

    def __init__(self, cube, family, dt, steps):
        if not isinstance(cube, FrozenSBPCube) or family not in ("full58", "tt-plus"):
            raise ValueError("cube and known continuum family required")
        dt = F._positive(dt, "dt")
        if type(steps) is not int or not 1 <= steps <= 16384:
            raise ValueError("bounded integer step count required")
        self.cube, self.family = cube, family
        self.dt, self.steps = dt, steps
        coordinates = np.meshgrid(*(np.linspace(-1., 1., n) for n in cube.shape), indexing="ij", sparse=True)
        self.phase_fields = np.stack([np.exp(1j*np.pi*sum(n[d]*coordinates[d] for d in range(3))) for n in NORMALS])
        self.amplitudes = np.empty((2*steps+1, 3, 58), dtype=complex)
        self.generators, self.initial_modes, self.final_modes = [], [], []
        self.principal_linearity_error, self.table_error, self.tt_closed_form_error = 0., 0., 0.
        for j, (normal, phase) in enumerate(zip(NORMALS, PHASES)):
            principal = sum(normal[d]*cube.systems[d].principal for d in range(3))
            oblique = F.build_system(normal).principal
            self.principal_linearity_error = max(self.principal_linearity_error, float(np.max(np.abs(principal-oblique))))
            initial = F.plane_mode(family, normal)*np.exp(1j*phase)/3.
            generator = cube.source+1j*np.pi*principal
            self.generators.append(generator)
            self.initial_modes.append(initial)
            advance = expm(.5*dt*generator)
            self.amplitudes[0, j] = initial
            for index in range(2*steps):
                self.amplitudes[index+1, j] = advance@self.amplitudes[index, j]
            final = expm(dt*steps*generator)@initial
            self.final_modes.append(final)
            self.table_error = max(self.table_error, float(np.max(np.abs(final-self.amplitudes[-1, j]))))
            if family == "tt-plus":
                self.tt_closed_form_error = max(self.tt_closed_form_error,
                    float(np.max(np.abs(final-initial*np.exp(-1j*np.pi*dt*steps)))))
        if max(self.principal_linearity_error, self.table_error, self.tt_closed_form_error) > 2.e-12:
            raise ValueError("cube continuum/linearity reference gate failed")
        self.final_modes = np.asarray(self.final_modes)
        self.amplitudes.flags.writeable = False
        self.phase_fields.flags.writeable = False

    def _modes(self, half_index):
        if type(half_index) is not int or not 0 <= half_index < len(self.amplitudes):
            raise ValueError("half-step index outside continuum table")
        return self.amplitudes[half_index]

    def values(self, half_index):
        return np.real(np.tensordot(self.phase_fields, self._modes(half_index), axes=(0, 0)))

    def __call__(self, half_index):
        modes = self._modes(half_index)
        return tuple(np.real(np.tensordot(face(self.phase_fields, axis+1, side), modes, axes=(0, 0)))
                     for axis in range(3) for side in range(2))

    def exact_final(self):
        wave = self.phase_fields[..., None]*self.final_modes[:, None, None, None, :]
        q = np.real(np.sum(wave, axis=0))
        gradient = tuple(np.real(sum(1j*np.pi*n[d]*wave[j] for j, n in enumerate(NORMALS))) for d in range(3))
        def second(i, j, slot):
            return np.real(sum(-math.pi**2*n[i]*n[j]*wave[m, ..., slot] for m, n in enumerate(NORMALS)))
        return q, gradient, second
