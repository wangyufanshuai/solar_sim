"""Fixed reduction controls; counterexamples never open physical gates."""

import numpy as np
from . import constraint_order_reduction as R
from . import constraint_symbol_controls as S

METHOD, TOLERANCE = R.METHOD, R.TOLERANCE
FALSE_FLAGS = tuple(
    dict.fromkeys((*S.FALSE_FLAGS, "uniform_strong_hyperbolicity_validated"))
)
CASES = tuple(
    (mode, wave, scheme)
    for mode in range(3)
    for wave in range(9)
    for scheme in R.SCHEMES
)


def normal(mode, index):
    cell = S.P.fixture(mode)
    S.P.require(type(index) is int and 0 <= index < 9, "registered direction required")
    if index < 6:
        value = np.array(S.P.WAVES[index + 1])
    else:
        beta = cell[7:10]
        tangent = np.array([beta[1], -beta[0], 0.0]) if mode else np.array([1.0, 0, 0])
        tangent /= np.linalg.norm(tangent)
        along = beta / np.linalg.norm(beta) if mode else np.array([0.0, 1, 0])
        value = tangent + (0, 1 / 64, -1 / 64)[index - 6] * along
    return value / np.linalg.norm(value)


def compare(mode, wave, scheme):
    S.P.require((mode, wave, scheme) in CASES, "registered reduction case required")
    cell, n = S.P.fixture(mode), normal(mode, wave)
    raw = R.polynomial(cell, n)
    graded = R.grade(raw, scheme)
    principal = graded[R.POWERS.index(1)]
    direct = np.stack([R.normalized(cell, n, rho, scheme) for rho in R.SCALES])
    reconstructed = np.stack([R.evaluate(graded, rho) for rho in R.SCALES])
    lower = np.stack(
        [
            graded[R.POWERS.index(0)] + graded[R.POWERS.index(-1)] / (1j * rho)
            for rho in R.SCALES
        ]
    )
    return dict(
        cell=cell,
        wave=n,
        orders=R.orders(scheme),
        raw=raw,
        graded=graded,
        scales=np.array(R.SCALES),
        weights=np.stack([R.weights(rho, scheme) for rho in R.SCALES]),
        direct=direct,
        reconstructed=reconstructed,
        principal=principal,
        lower=lower,
        eigenvalues=np.linalg.eigvals(principal),
        left_rows=R.jordan_rows(cell, n, scheme),
    )


SHAPES = dict(
    cell=(58,),
    wave=(3,),
    orders=(43,),
    raw=(3, 43, 43),
    graded=(7, 43, 43),
    scales=(5,),
    weights=(5, 43),
    direct=(5, 43, 43),
    reconstructed=(5, 43, 43),
    principal=(43, 43),
    lower=(5, 43, 43),
    eigenvalues=(43,),
    left_rows=(2, 43),
)


def metrics(a, mode, wave, scheme):
    S.P.require((mode, wave, scheme) in CASES, "registered report identity required")
    S.P.require(
        set(a) == set(SHAPES)
        and all(
            v.shape == SHAPES[k]
            and np.isfinite(v).all()
            and v.dtype
            == (
                np.int64
                if k == "orders"
                else np.float64
                if k in ("cell", "wave", "scales")
                else np.complex128
            )
            for k, v in a.items()
        ),
        "complete finite reduction arrays required",
    )
    S.P.require(
        np.array_equal(a["cell"], S.P.fixture(mode))
        and np.array_equal(a["wave"], normal(mode, wave))
        and np.array_equal(a["orders"], R.orders(scheme))
        and np.array_equal(a["scales"], np.array(R.SCALES)),
        "fixture identity changed",
    )
    raw_error, normalized_error, lower_error = 0.0, 0.0, 0.0
    for j, rho in enumerate(R.SCALES):
        raw_expected = sum(
            (1j * rho) ** degree * a["raw"][degree] for degree in range(3)
        )
        raw_direct = (
            a["direct"][j] / a["weights"][j, :, None] * a["weights"][j, None, :]
        )
        raw_error = max(raw_error, S.relative(raw_expected, raw_direct))
        normalized_error = max(
            normalized_error, S.relative(a["reconstructed"][j], a["direct"][j])
        )
        lower_error = max(
            lower_error,
            S.relative(1j * rho * a["principal"] + a["lower"][j], a["direct"][j]),
        )
    forbidden = [j for j, power in enumerate(R.POWERS) if power not in (-1, 0, 1)]
    applicable = (mode == 0 and scheme == "hm-only") or (mode != 0 and wave == 6)
    left, successor = a["left_rows"]
    return dict(
        raw_reconstruction_relative=raw_error,
        normalized_reconstruction_relative=normalized_error,
        lower_reconstruction_relative=lower_error,
        forbidden_power_max=float(np.max(abs(a["graded"][forbidden]))),
        principal_imaginary_max=float(np.max(abs(a["principal"].imag))),
        spectrum_imaginary_max=float(np.max(abs(a["eigenvalues"].imag))),
        shift_projection=float(a["cell"][7:10] @ a["wave"]),
        jordan_witness_applicable=applicable,
        jordan_first_residual=float(np.max(abs(left @ a["principal"] - successor))),
        jordan_second_residual=float(np.max(abs(successor @ a["principal"]))),
        jordan_successor_norm=float(np.linalg.norm(successor)),
        normalization_candidate_rejected=applicable,
    )


def require_gates(report):
    for key in (
        "raw_reconstruction_relative",
        "normalized_reconstruction_relative",
        "lower_reconstruction_relative",
        "forbidden_power_max",
        "principal_imaginary_max",
    ):
        S.P.require(report[key] <= TOLERANCE, key + " failed")
    if report["jordan_witness_applicable"]:
        S.P.require(
            report["jordan_first_residual"] <= TOLERANCE
            and report["jordan_second_residual"] <= TOLERANCE
            and report["jordan_successor_norm"] > 1e-6,
            "registered nontrivial Jordan witness absent",
        )
