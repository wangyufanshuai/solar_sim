"""Full-state and analytic controls for a nonlocal full43 reduction."""

from functools import lru_cache
import numpy as np
from . import longitudinal_constraint_reduction as L
from . import constraint_order_controls as O

P, S = O.S.P, O.S
METHOD, TOLERANCE, FALSE_FLAGS = L.METHOD, L.TOLERANCE, O.FALSE_FLAGS
CASES = tuple((mode, wave) for mode in range(3) for wave in range(9))


@lru_cache(maxsize=3)
def full_reference(mode):
    q = P.fixture(mode)
    return P.source_matrix(q), np.stack([P.S.principal(q, axis) for axis in range(3)])


def compare(mode, wave):
    P.require((mode, wave) in CASES, "registered full43 case required")
    q, n = P.fixture(mode), O.normal(mode, wave)
    a = dict(cell=q, normal=n, longitudinal=L.projectors(n)[0], **L.coefficients(q, n))
    source, axes = full_reference(mode)
    a["generator"] = np.stack((source, np.einsum("a,aij->ij", n, axes))).astype(complex)
    rows = L.unpack(a["rows"], L.ROW_POWERS, (43, 58))
    a["singular"] = np.stack(
        [
            np.linalg.svd(rows[0], compute_uv=False),
            *[
                np.linalg.svd(L.evaluate(rows, rho), compute_uv=False)
                for rho in O.R.SCALES
            ],
        ]
    )
    return a


SHAPES = dict(
    cell=(58,),
    normal=(3,),
    longitudinal=(43, 43),
    forward=(3, 43, 43),
    inverse=(4, 43, 43),
    symbol=(8, 43, 43),
    rows=(5, 43, 58),
    generator=(2, 58, 58),
    singular=(6, 43),
)


def metrics(a, mode, wave):
    P.require((mode, wave) in CASES, "registered metric identity required")
    P.require(
        set(a) == set(SHAPES)
        and all(
            v.shape == SHAPES[k]
            and v.dtype
            == (np.float64 if k in ("cell", "normal", "singular") else np.complex128)
            and np.isfinite(v).all()
            for k, v in a.items()
        ),
        "complete finite double precision longitudinal evidence required",
    )
    P.require(
        np.array_equal(a["cell"], P.fixture(mode))
        and np.array_equal(a["normal"], O.normal(mode, wave)),
        "fixed input identity changed",
    )
    q, n, pp = a["cell"], a["normal"], a["longitudinal"]
    u = L.unpack(a["forward"], L.FORWARD_POWERS, (43, 43))
    v = L.unpack(a["inverse"], L.INVERSE_POWERS, (43, 43))
    b = L.unpack(a["symbol"], L.SYMBOL_POWERS, (43, 43))
    d = L.unpack(a["rows"], L.ROW_POWERS, (43, 58))
    errors = dict(
        inverse_error=0.0,
        transform_error=0.0,
        generator_reconstruction_relative=0.0,
        row_reconstruction_relative=0.0,
        full_intertwining_relative=0.0,
        curl_error=0.0,
        determinant_auxiliary_error=0.0,
    )
    curl = L.curl_operator(n)
    trace_expected = np.zeros(58, dtype=complex)
    trace_expected[37:55] = L.trace_row(q, n)[20:38]
    for rho in O.R.SCALES:
        forward, inverse = L.evaluate(u, rho), L.evaluate(v, rho)
        direct_u, direct_v = L.direct(q, n, rho)
        c = L.B.physical_rows(q, rho * n)
        direct_rows = direct_u @ c
        symbol, rows = L.evaluate(b, rho), L.evaluate(d, rho)
        errors["inverse_error"] = max(
            errors["inverse_error"],
            float(np.max(abs(forward @ inverse - np.eye(43)))),
            float(np.max(abs(inverse @ forward - np.eye(43)))),
        )
        errors["transform_error"] = max(
            errors["transform_error"],
            float(np.max(abs(forward - direct_u))),
            float(np.max(abs(inverse - direct_v))),
        )
        errors["generator_reconstruction_relative"] = max(
            errors["generator_reconstruction_relative"],
            S.relative(symbol, direct_u @ L.B.linear_symbol(q, rho * n) @ direct_v),
        )
        errors["row_reconstruction_relative"] = max(
            errors["row_reconstruction_relative"], S.relative(rows, direct_rows)
        )
        errors["full_intertwining_relative"] = max(
            errors["full_intertwining_relative"],
            S.relative(
                symbol @ rows, rows @ (a["generator"][0] + 1j * rho * a["generator"][1])
            ),
        )
        errors["curl_error"] = max(
            errors["curl_error"], float(np.max(abs(curl @ rows - curl @ c)))
        )
        errors["determinant_auxiliary_error"] = max(
            errors["determinant_auxiliary_error"],
            float(np.max(abs(rows[41] - trace_expected))),
        )
    principal, leading = b[1], d[0]
    perp = np.eye(3) - np.outer(n, n)
    expected_principal = np.zeros((3, 43), dtype=complex)
    expected_principal[:, 8:11] = (q[7:10] @ n) * perp
    expected_lower = np.zeros((3, 43), dtype=complex)
    expected_lower[:, 8:11] = -np.outer(n, q[7:10]) @ perp
    expected_lower[:, 42] = -2 * n
    ranks = [
        [
            int(np.count_nonzero(row > tol * max(1.0, float(row[0]))))
            for tol in P.RANK_TOLERANCES
        ]
        for row in a["singular"]
    ]
    return dict(
        **errors,
        projector_error=float(
            max(
                np.max(abs(pp @ pp - pp)),
                np.max(abs(pp - pp.T)),
                np.max(abs(pp - L.projectors(n)[0])),
            )
        ),
        forbidden_generator_power_max=float(
            max(np.max(abs(b[power])) for power in L.SYMBOL_POWERS if power > 1)
        ),
        forbidden_row_power_max=float(
            max(np.max(abs(d[power])) for power in L.ROW_POWERS if power > 0)
        ),
        principal_imaginary_max=float(np.max(abs(principal.imag))),
        leading_intertwining_relative=S.relative(
            principal @ leading, leading @ a["generator"][1]
        ),
        rA_principal_error=float(np.max(abs(principal[8:11] - expected_principal))),
        rA_lower_error=float(np.max(abs(b[0][8:11] - expected_lower))),
        ranks=ranks,
        leading_smallest_singular=float(a["singular"][0, -1]),
        finite_smallest_singular=float(np.min(a["singular"][1:, -1])),
        shift_projection=float(q[7:10] @ n),
    )


def require_gates(report):
    for key, value in report.items():
        if key.endswith(("_error", "_relative", "_max")):
            P.require(np.isfinite(value) and value <= TOLERANCE, key + " failed")
    P.require(
        report["ranks"] == [[43] * 3] * 6,
        "leading/finite rank43 required without completion",
    )
