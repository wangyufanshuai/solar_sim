"""Fixed-profile comparison layer; complete-state references stay here."""

import math
import numpy as np
from . import constraint_symbol_bridge as B
from . import constraint_jet_controls as J
from .spatial_taylor3 import Jet, INDICES

P = B.P
METHOD, TOLERANCE, FALSE_FLAGS = B.METHOD, B.TOLERANCE, J.FALSE_FLAGS
CASES = tuple((mode, wave) for mode in range(3) for wave in range(7))
PERMUTATION = np.r_[np.arange(35, 43), np.arange(35)]
PROBES = np.array(
    [
        [
            (((j + 1) * (p + 2)) % 11 - 5 + 1j * (((j + 3) * (p + 1)) % 13 - 6)) / 64
            for j in range(43)
        ]
        for p in range(4)
    ],
    dtype=complex,
)


def jet_tangent(cell, wave, amplitude):
    """Exact odd part at degree<=2 flat seeds; both real Fourier phases."""
    B.coefficients(cell, wave)
    amplitude = np.asarray(amplitude)
    P.require(
        amplitude.shape == (43,)
        and amplitude.dtype.kind in "fcu"
        and np.isfinite(amplitude).all(),
        "finite43 Fourier amplitude required",
    )
    P.require(
        max(abs(amplitude[41].real), abs(amplitude[41].imag)) < 1,
        "both signed determinant probes must be admissible",
    )
    background = J.background_from(Jet.constant(np.asarray(cell)))
    raw = np.stack(
        [
            np.prod((1j * np.asarray(wave)) ** np.array(index))
            * amplitude
            / math.prod(math.factorial(i) for i in index)
            for index in INDICES[:10]
        ]
    )
    answers = []
    for coefficients in (raw.real, raw.imag):
        values = []
        for sign in (1, -1):
            constraints = J.F.Constraints(
                Jet(sign * coefficients[:4, :4], 1), Jet(sign * coefficients[:, 4:], 2)
            )
            values.append(J.F.evaluate(background, constraints)["rates"])
        answers.append((values[0] - values[1]) / 2)
    return answers[0] + 1j * answers[1]


def compare(mode, wave_index):
    P.require((mode, wave_index) in CASES, "registered symbol case required")
    cell, wave = P.fixture(mode), np.array(P.WAVES[wave_index])
    cp = B.physical_rows(cell, wave)
    old_rows, operator = P.constraint_rows(cell, wave), P.generator(cell, wave)
    _, old_symbol, _, _ = P.closure(old_rows, operator)
    cf = old_rows[PERMUTATION]
    diagnostic = old_symbol[np.ix_(PERMUTATION, PERMUTATION)]
    transform, inverse = B.transformation(cell, wave)
    symbol = B.linear_symbol(cell, wave)
    actual = np.stack([jet_tangent(cell, wave, amplitude) for amplitude in PROBES])
    predicted = PROBES @ symbol.T
    return dict(
        cell=cell,
        wave=wave,
        physical=cp,
        formal=cf,
        transform=transform,
        inverse=inverse,
        generator=operator,
        symbol=symbol,
        mapped=transform @ symbol @ inverse,
        diagnostic=diagnostic,
        probes=PROBES.copy(),
        rates=np.stack((actual, predicted)),
        singular=np.stack(
            (np.linalg.svd(cp, compute_uv=False), np.linalg.svd(cf, compute_uv=False))
        ),
    )


SHAPES = dict(
    cell=(58,),
    wave=(3,),
    physical=(43, 58),
    formal=(43, 58),
    transform=(43, 43),
    inverse=(43, 43),
    generator=(58, 58),
    symbol=(43, 43),
    mapped=(43, 43),
    diagnostic=(43, 43),
    probes=(4, 43),
    rates=(2, 4, 43),
    singular=(2, 43),
)


def relative(actual, expected):
    return float(
        np.linalg.norm(actual - expected, np.inf)
        / max(1.0, float(np.linalg.norm(expected, np.inf)))
    )


def metrics(arrays):
    P.require(
        set(arrays) == set(SHAPES)
        and all(
            a.shape == SHAPES[name]
            and a.dtype
            == (np.float64 if name in ("cell", "wave", "singular") else np.complex128)
            and np.isfinite(a).all()
            for name, a in arrays.items()
        ),
        "complete finite double precision symbol evidence required",
    )
    a = arrays
    expected = a["physical"] @ a["generator"]
    actual = a["symbol"] @ a["physical"]
    full_difference = float(np.max(abs(a["mapped"] - a["diagnostic"])))
    ranks = [
        [
            int(np.count_nonzero(s > tol * max(1.0, float(s[0]))))
            for tol in P.RANK_TOLERANCES
        ]
        for s in a["singular"]
    ]
    return dict(
        row_error=float(np.max(abs(a["transform"] @ a["physical"] - a["formal"]))),
        inverse_error=float(np.max(abs(a["transform"] @ a["inverse"] - np.eye(43)))),
        intertwining_relative=relative(actual, expected),
        intertwining_absolute=float(np.max(abs(actual - expected))),
        formal_action_relative=relative(
            a["mapped"] @ a["formal"], a["diagnostic"] @ a["formal"]
        ),
        formal_matrix_relative=relative(a["mapped"], a["diagnostic"]),
        formal_matrix_absolute=full_difference,
        jet_error=float(np.max(abs(a["rates"][0] - a["rates"][1]))),
        ranks=ranks,
        zero_frequency=bool(not np.any(a["wave"])),
    )


def require_gates(report):
    for key in (
        "row_error",
        "inverse_error",
        "intertwining_relative",
        "formal_action_relative",
        "jet_error",
    ):
        P.require(report[key] <= TOLERANCE, key + " failed")
    rank = 39 if report["zero_frequency"] else 43
    P.require(report["ranks"] == [[rank] * 3] * 2, "physical/formal rank changed")
    if report["zero_frequency"]:
        P.require(
            report["formal_matrix_absolute"] > 1e-8,
            "zero-frequency off-image distinction absent",
        )
    else:
        P.require(
            report["formal_matrix_relative"] <= TOLERANCE,
            "nonzero formal symbol mismatch",
        )
