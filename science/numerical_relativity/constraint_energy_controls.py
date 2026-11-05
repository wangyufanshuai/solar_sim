"""Unmodified full43/full58 checks, including shift/ODE speed collisions."""

from functools import lru_cache
import numpy as np
from . import constraint_projector_energy as E
from . import longitudinal_constraint_controls as C

L, P, S = C.L, C.P, C.S
METHOD, TOLERANCE, FALSE_FLAGS = E.METHOD, E.TOLERANCE, C.FALSE_FLAGS
CASES = tuple(range(66))
STATE_ODE = np.diag(np.r_[np.ones(11), np.zeros(47)])


def fixture(index):
    P.require(type(index) is int and index in CASES, "registered energy case required")
    if index < 27:
        mode, wave = C.CASES[index]
        return P.fixture(mode).copy(), C.O.normal(mode, wave)
    node, side = divmod(index - 27, 3)
    q, n = P.fixture(2).copy(), C.O.normal(2, 6)
    beta_perp = q[7:10] - (q[7:10] @ n) * n
    q[7:10] = beta_perp + (-E.nodes(q, n)[node] + (side - 1) / 64) * n
    return q, n


@lru_cache(maxsize=100)
def main_principal(cell, direction):
    q, n = np.array(cell), np.array(direction)
    return np.einsum("a,aij->ij", n, np.stack([P.S.principal(q, axis) for axis in range(3)]))


@lru_cache(maxsize=27)
def main_intrinsic(zero_cell, direction):
    q, n = np.array(zero_cell), np.array(direction)
    matrix = main_principal(zero_cell, direction)
    result = np.zeros((13, 58, 58))
    result[:, 11:, 11:] = E.polynomial_projectors(matrix[11:, 11:], np.eye(47), E.nodes(q, n))
    result.setflags(write=False)
    return result


def compare(index):
    q, n = fixture(index)
    intrinsic, ode, roots, projectors, h = E.canonical(q, n)
    zero = q.copy()
    zero[7:10] = 0
    rows = L.coefficients(q, n)["rows"][L.ROW_POWERS.index(0)]
    return dict(cell=q, normal=n, principal=E.principal(q, n), ode=ode.copy(), intrinsic=intrinsic.copy(), roots=roots.copy(), projectors=projectors.copy(), energy=h.copy(), leading=E.real_exact(rows), main=main_principal(tuple(q), tuple(n)).copy(), main_intrinsic=main_principal(tuple(zero), tuple(n)).copy(), full_projectors=main_intrinsic(tuple(zero), tuple(n)).copy(), energy_eigenvalues=np.linalg.eigvalsh(h), speeds=roots + q[7:10] @ n)


SHAPES = dict(cell=(58,), normal=(3,), principal=(43, 43), ode=(43, 43), intrinsic=(43, 43), roots=(13,), projectors=(13, 43, 43), energy=(43, 43), leading=(43, 58), main=(58, 58), main_intrinsic=(58, 58), full_projectors=(13, 58, 58), energy_eigenvalues=(43,), speeds=(13,))


def precision_probe(mode):
    P.require(type(mode) is int and mode in (0, 1, 2), "registered precision case required")
    q, n = fixture(9 * mode + 6)
    q[7:10] = 0
    matrix, ode, roots, first, _ = E.canonical(q, n)
    second = E.polynomial_projectors(matrix, np.eye(43) - ode, roots, precision=70)
    full = main_principal(tuple(q), tuple(n))[11:, 11:]
    first_full = main_intrinsic(tuple(q), tuple(n))[:, 11:, 11:]
    second_full = E.polynomial_projectors(full, np.eye(47), roots, precision=70)
    return dict(mode=mode, constraint_relative=max(S.relative(a, b) for a, b in zip(first, second, strict=True)), full_state_relative=max(S.relative(a, b) for a, b in zip(first_full, second_full, strict=True)))


def projector_metrics(matrix, ode, projections, speeds):
    pde = np.eye(len(matrix)) - ode
    idempotency = cross = action = leak = 0.
    ranks = []
    for i, e in enumerate(projections):
        idempotency = max(idempotency, S.relative(e @ e, e))
        action = max(action, S.relative(matrix @ e, speeds[i] * e))
        leak = max(leak, S.relative(e @ ode, np.zeros_like(e)), S.relative(ode @ e, np.zeros_like(e)))
        for j, f in enumerate(projections):
            if i != j:
                cross = max(cross, S.relative(e @ f, np.zeros_like(e)))
        singular = np.linalg.svd(e, compute_uv=False)
        ranks.append([int(np.count_nonzero(singular > tol * max(1., float(singular[0])))) for tol in P.RANK_TOLERANCES])
    return dict(completeness_relative=S.relative(np.sum(projections, axis=0), pde), reconstruction_relative=S.relative(np.einsum("a,aij->ij", speeds, projections), matrix), ode_block_relative=max(S.relative(matrix @ ode, np.zeros_like(matrix)), S.relative(ode @ matrix, np.zeros_like(matrix))), idempotency_relative=idempotency, cross_relative=cross, action_relative=action, leak_relative=leak, ranks=ranks)


def metrics(a, index):
    P.require(set(a) == set(SHAPES) and all(v.shape == SHAPES[k] and v.dtype == np.float64 and np.isfinite(v).all() for k, v in a.items()), "complete finite float64 energy evidence required")
    q, n = fixture(index)
    P.require(np.array_equal(q, a["cell"]) and np.array_equal(n, a["normal"]) and np.array_equal(E.nodes(q, n), a["roots"]) and np.array_equal(a["roots"] + q[7:10] @ n, a["speeds"]), "fixed coefficient/node identity changed")
    ode, h, matrix, leading = a["ode"], a["energy"], a["principal"], a["leading"]
    first = projector_metrics(matrix, ode, a["projectors"], a["speeds"])
    second = projector_metrics(a["main"], STATE_ODE, a["full_projectors"], a["speeds"])
    cross = max(S.relative(e @ leading, leading @ f) for e, f in zip(a["projectors"], a["full_projectors"], strict=True))
    eigenvalues = np.linalg.eigvalsh(h)
    P.require(np.array_equal(eigenvalues, a["energy_eigenvalues"]), "saved energy eigenvalues changed")
    return dict(
        constraint=first, full_state=second,
        ode_projector_error=float(np.max(abs(ode - E.real_exact(L.projectors(n)[0])))),
        ode_rank=float(np.trace(ode)),
        shift_decomposition_relative=S.relative(matrix, a["intrinsic"] + (q[7:10] @ n) * (np.eye(43) - ode)),
        main_shift_decomposition_relative=S.relative(a["main"], a["main_intrinsic"] + (q[7:10] @ n) * (np.eye(58) - STATE_ODE)),
        ode_state_map_relative=S.relative(ode @ leading, leading @ STATE_ODE),
        projector_state_map_relative=cross,
        energy_definition_relative=S.relative(h, E.energy(ode, a["projectors"])),
        energy_symmetry_relative=S.relative(h, h.T),
        symmetrizer_relative=S.relative(h @ matrix, matrix.T @ h),
        energy_min=float(eigenvalues[0]), energy_max=float(eigenvalues[-1]),
        energy_condition=float(eigenvalues[-1] / eigenvalues[0]) if eigenvalues[0] > 0 else None,
        energy_lower_bound_deficit=float(max(0., 1 / 14 - eigenvalues[0])),
        target_speed=float(a["speeds"][(index - 27) // 3]) if index >= 27 else None,
        crossing_speed_error=abs(float(a["speeds"][(index - 27) // 3]) - ((index - 27) % 3 - 1) / 64) if index >= 27 else 0.,
    )


def require_gates(report):
    for group, dimension in ((report["constraint"], 32), (report["full_state"], 47)):
        for key, value in group.items():
            if key.endswith("_relative"):
                P.require(np.isfinite(value) and value <= TOLERANCE, key + " failed")
        ranks = np.array(group["ranks"])
        P.require(ranks.shape == (13, 3) and np.all(ranks == ranks[:, :1]) and np.all(ranks.sum(axis=0) == dimension), "stable complete projector ranks required")
    for key, value in report.items():
        if key.endswith(("_relative", "_error", "_deficit")):
            P.require(np.isfinite(value) and value <= TOLERANCE, key + " failed")
    P.require(abs(report["ode_rank"] - 11) <= TOLERANCE and report["energy_min"] > 0 and report["energy_condition"] is not None, "positive full43 energy and rank11 ODE required")
