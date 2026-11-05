"""One owned full58 factored energy certificate with independent exact replay."""

from __future__ import annotations

import argparse
import ast
from collections import Counter
from fractions import Fraction as F
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import sys
import time
import xml.etree.ElementTree as ET

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[1]
for folder in (ROOT, ROOT / "scripts"):
    if str(folder) not in sys.path:
        sys.path.insert(0, str(folder))
import nr_owned_control as G  # noqa: E402
import nr_single_scan_control as C  # noqa: E402
import nr_polynomial_certificate_replay as V  # noqa: E402

METHOD = "nr-case12-full58-factorized-energy-controls-v1"
HELPER = "scripts/run-nr-k3-case12-full58-spectral.py"
HELPER_SHA = "f9f8470c2d9c28ddb034f70912cbf381caed49f0fbf70da8e3bce224d36a8483"
PARENT = G.EVIDENCE / "nr-k3-case12-full58-spectral-controls-v1-20261014"
PARENT_GATE = "b1f20875989575329e37267a8ff8eb45e57d761e34063b53df077bb007ee209f"
PARENT_WORKER = "57059edd39496954067c33edb8ff62e9b1432a8f0ce1de2659888105200888a2"
PARENT_INPUTS = {
    "K0.json": "7e110dbd9df16f71644d976e2ac56f13b6fc52be1b9b6cc85ca910a20a395775",
    "Pi.json": "88d309ccca7331c0d5a76e4f1516d1766fe0d2d29cdfbc660225fac7baf4bfbb",
    "Z6.json": "9a598c35e34e26409a33ad5b88ef34008370e55a7faba9ed439c0e626615b9d9",
    "shift_residual.json": "9a598c35e34e26409a33ad5b88ef34008370e55a7faba9ed439c0e626615b9d9",
    "embedding_residual.json": "9a598c35e34e26409a33ad5b88ef34008370e55a7faba9ed439c0e626615b9d9",
    "scalars.json": "2e85ea16f3b88c00a4faa81e0c26931ef049c0b7408621501593245879765b63",
    "stats.json": "31c42a45a694f806c783bd0d3d078a4c3914c20b8ecbc3176248df2b036a4691",
    "independent-replay.json": "6d5b41b3beedd01b961cecf069a31082e1b64934c7aec7a600cc5568981b1433",
    "source_bridge.json": "0022319c8cb323b6b36176970a56fdf124511195443fb829b12c3eb4fb807b92",
    "parent_provenance.json": "ce2410b16d79f47788b243269745141469b6834cacee909e110590de1ce15d08",
    "parent-inputs/K.json": "e2e7a2976240b8fc0aea54c4621e9e56a29247f9b9c4185da38acac3089e0283",
    "parent-inputs/parent-inputs/domain.json": "a516ebf08161d8e333b336d2530610bd2a316f88b79e7fb437989867a0f88149",
    "parent-inputs/parent-inputs/denominators.json": "2c0e61d17a87d2757f92375efe24ad978fb5899da27d3072645934b27529a31a",
}
EXTRA = (
    "scripts/nr_case12_full58_factorized_energy.py",
    "scripts/tests/test_nr_case12_full58_factorized_energy.py",
    "scripts/run-nr-k3-case12-full58-factorized-energy.py",
    "science/numerical_relativity/DERIVATION-20261014-case12-full58-factorized-energy.md",
    "science/numerical_relativity/EXPERIMENT-20261014-case12-full58-factorized-energy.md",
    "science/numerical_relativity/RESULTS-20261014-case12-full58-spectral.md",
    "science/numerical_relativity/NOTE-20261014-case12-full58-factorized-energy-next.md",
)
TEST_FILES = (EXTRA[1],)
TEST_REGISTRATION = ((28, 100),)
CONSTANTS = tuple(
    F(n, d)
    for n, d in (
        (2601, 100000),
        (2601, 50000),
        (2601, 5000),
        (153, 125),
        (459, 250),
        (306, 125),
    )
)
METADATA = (
    "univariate",
    "formal",
    "bounds",
    "negatives",
    "domain_metadata",
    "acceptance",
    "source_bridge",
    "parent_provenance",
)
PRINCIPAL_SCOPE = (
    "fixed-case12 full58 principal rational direction extension; geometric=False"
)
ENERGY_FORM = (
    "factorized Gram with exact polynomial action and quadratic-form certificates"
)
FALSE_FLAGS = (
    "physical_gate",
    "live_admission",
    "scientificPayloadWriteback",
    "expanded_full58_energy_validated",
    "full58_expanded_matrix_residuals_validated",
    "nonlinear_stability_validated",
    "physical_boundary_validated",
    "constraint_convergence_validated",
    "constraint_damping_proved",
    "zero_frequency_full43_inverse_exists",
    "full_python_semantics_proved",
    "independent_external_review",
    "full_scientific_matrix_executed",
    "new_scientific_evolution",
    "gpu_executed",
    "historical_results_regraded",
    "eight_ray_rerun",
)


def read(path):
    return json.loads(Path(path).read_bytes())


def helper():
    G.require(G.sha(ROOT / HELPER) == HELPER_SHA, "frozen full58 spectral runner")
    spec = importlib.util.spec_from_file_location(
        "nr_factored_energy_parent", ROOT / HELPER
    )
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def foundation():
    return helper().helper().foundation()


def parent_gate():
    gate = helper().qualified(PARENT, PARENT_GATE, PARENT_WORKER)
    G.require(
        gate["full58_principal_spectral_validated"]
        is gate["pointwise_real_semisimplicity_validated"]
        is True
        and all(
            gate["artifact_hashes"][name] == digest
            for name, digest in PARENT_INPUTS.items()
        ),
        "qualified complete full58 spectrum",
    )
    return gate


def sources(budget):
    parent_gate()
    table = helper().sources(budget)
    G.require(
        len(table) == 630
        and table == G.inventory(PARENT / "source-snapshot", "", budget),
        "all 630 spectral sources unchanged",
    )
    G.require(
        not set(table).intersection(EXTRA), "additive seven factored energy sources"
    )
    table.update({name: G.sha(G.contained(ROOT, name)) for name in EXTRA})
    G.require(len(table) == 637, "637-source closure")
    return table


def history(budget):
    gate = parent_gate()
    table = helper().history(budget)
    expected = dict(gate["artifact_hashes"], **{"qualification-gate.json": PARENT_GATE})
    observed = G.inventory(PARENT, "", budget)
    G.require(
        observed == expected and len(observed) == 702, "complete spectral evidence"
    )
    table[PARENT.name] = observed
    G.require(
        len(table) == 21 and sum(map(len, table.values())) == 14846,
        "twenty-one unchanged historical trees",
    )
    return table


def rational(value):
    G.require(type(value) is str, "canonical rational string required")
    answer = F(value)
    G.require(str(answer) == value, "reduced canonical rational required")
    return answer


def canonical_equal(actual, expected):
    """JSON tree identity without Python bool/int or float/int coercion."""
    if type(actual) is not type(expected):
        return False
    if type(expected) is dict:
        return (
            all(type(k) is str for k in actual)
            and set(actual) == set(expected)
            and all(canonical_equal(actual[k], expected[k]) for k in expected)
        )
    if type(expected) is list:
        return len(actual) == len(expected) and all(
            canonical_equal(a, b) for a, b in zip(actual, expected, strict=True)
        )
    return type(expected) in (str, int, bool, type(None)) and actual == expected


def trim(values):
    answer = list(values)
    G.require(all(type(x) is F for x in answer), "exact Fraction polynomial required")
    while answer and answer[-1] == 0:
        answer.pop()
    return answer


def decode_univariate(record, degree_cap=26):
    G.require(
        type(degree_cap) is int and degree_cap >= 0 and type(record) is list,
        "registered polynomial record",
    )
    answer, previous = [], -1
    for term in record:
        G.require(
            type(term) is list
            and len(term) == 3
            and type(term[0]) is int
            and previous < term[0] <= degree_cap,
            "strict increasing nonnegative powers",
        )
        power, numerator, denominator = term
        G.require(
            type(numerator) is type(denominator) is str,
            "exact integer coefficient strings",
        )
        n, d = int(numerator), int(denominator)
        G.require(
            str(n) == numerator and str(d) == denominator and n != 0 and d > 0,
            "canonical nonzero rational term",
        )
        value = F(n, d)
        G.require(
            str(value.numerator) == numerator and str(value.denominator) == denominator,
            "reduced univariate rational term",
        )
        answer.extend([F(0)] * (power + 1 - len(answer)))
        answer[power] = value
        previous = power
    return answer


def encode_univariate(values):
    return [
        [i, str(value.numerator), str(value.denominator)]
        for i, value in enumerate(trim(values))
        if value
    ]


def add(a, b, factor=F(1)):
    answer = [F(0)] * max(len(a), len(b))
    for i, value in enumerate(a):
        answer[i] += value
    for i, value in enumerate(b):
        answer[i] += factor * value
    return trim(answer)


def mul(a, b):
    if not a or not b:
        return []
    answer = [F(0)] * (len(a) + len(b) - 1)
    for i, x in enumerate(a):
        for j, y in enumerate(b):
            answer[i + j] += x * y
    return trim(answer)


def divide(numerator, denominator):
    divisor, remainder = trim(denominator), trim(numerator)
    G.require(bool(divisor), "nonzero exact divisor")
    quotient = [F(0)] * max(0, len(remainder) - len(divisor) + 1)
    while len(remainder) >= len(divisor):
        shift = len(remainder) - len(divisor)
        value = remainder[-1] / divisor[-1]
        quotient[shift] = value
        for i, coefficient in enumerate(divisor):
            remainder[i + shift] -= value * coefficient
        remainder = trim(remainder)
    return trim(quotient), remainder


def verify_division(row, modulus_record):
    G.require(
        type(row) is dict
        and set(row) == {"name", "polynomial", "quotient", "remainder", "multiplyback"}
        and type(row["name"]) is str
        and bool(row["name"]),
        "complete relation record",
    )
    value = decode_univariate(row["polynomial"])
    modulus = decode_univariate(modulus_record, 13)
    quotient, remainder = divide(value, modulus)
    back = add(add(value, mul(modulus, quotient), F(-1)), remainder, F(-1))
    G.require(
        canonical_equal(encode_univariate(quotient), row["quotient"])
        and canonical_equal(encode_univariate(remainder), row["remainder"])
        and canonical_equal(encode_univariate(back), row["multiplyback"]),
        "independent division or multiplyback differs",
    )
    return not remainder and not back


def univariate_certificate(constants=CONSTANTS, guard=lambda: None):
    G.require(
        type(constants) is tuple
        and constants == CONSTANTS
        and all(type(c) is F for c in constants),
        "registered exact six constants",
    )
    nodes = (F(0), *constants)
    modulus = [F(0), F(1)]
    for c in constants:
        modulus = mul(modulus, [-c, F(0), F(1)])
    projectors, us, actions, aa = [], [], [], []
    for j, node in enumerate(nodes):
        guard()
        e = [F(1)]
        for other in nodes:
            if node != other:
                e = [value / (node - other) for value in mul(e, [-other, F(1)])]
        u = [F(0)] * (2 * len(e) - 1)
        for i, value in enumerate(e):
            u[2 * i] = value
        us.append(trim(u))
        projectors.append(
            dict(
                name="zero" if j == 0 else f"branch-{j}",
                node=str(node),
                e=encode_univariate(e),
                u=encode_univariate(u),
            )
        )
    for j in range(1, 7):
        a = divide(mul([F(0), F(1)], us[j]), modulus)[1]
        aa.append(a)
        actions.append(dict(branch_index=j, a=encode_univariate(a)))
    inputs = []
    for i in range(7):
        for j in range(7):
            inputs.append(
                (
                    f"projector-{i}-{j}",
                    add(mul(us[i], us[j]), us[i] if i == j else [], F(-1)),
                )
            )
    total = [F(-1)]
    for u in us:
        total = add(total, u)
    inputs.append(("completeness", total))
    for j in range(1, 7):
        inputs.append((f"action-{j}", add(mul([F(0), F(1)], us[j]), aa[j - 1], F(-1))))
    for j, c in enumerate(constants, 1):
        inputs.append((f"speed-{j}", mul([-c, F(0), F(1)], us[j])))
    for j, c in enumerate(constants, 1):
        inputs.append((f"transfer-{j}", add(mul([F(0), F(1)], aa[j - 1]), us[j], -c)))
    inputs.append(("zero-action", mul([F(0), F(1)], us[0])))
    relations = []
    for name, value in inputs:
        guard()
        quotient, remainder = divide(value, modulus)
        back = add(add(value, mul(modulus, quotient), F(-1)), remainder, F(-1))
        relations.append(
            dict(
                name=name,
                polynomial=encode_univariate(value),
                quotient=encode_univariate(quotient),
                remainder=encode_univariate(remainder),
                multiplyback=encode_univariate(back),
            )
        )
    return dict(
        schema="nr-case12-full58-factorized-univariate-v1",
        variable="t",
        lagrange_variable="y",
        constants=[str(c) for c in constants],
        modulus=encode_univariate(modulus),
        projectors=projectors,
        actions=actions,
        relations=relations,
        accepted=all(
            not row["remainder"] and not row["multiplyback"] for row in relations
        ),
    )


def check_univariate_record(record, guard=lambda: None):
    G.require(
        canonical_equal(record, univariate_certificate(guard=guard)),
        "independent full univariate identity set differs",
    )
    return True


def table(values):
    rows, columns = len(values), len(values[0])
    G.require(all(len(row) == columns for row in values), "rectangular exact table")
    return dict(
        shape=[rows, columns],
        entries=[
            [i, j, str(rational(str(value)))]
            for i, row in enumerate(values)
            for j, value in enumerate(row)
        ],
    )


def formal_certificate(constants=CONSTANTS):
    G.require(
        type(constants) is tuple
        and constants == CONSTANTS
        and all(type(c) is F for c in constants),
        "registered exact branches",
    )
    weights = (F(1), F(1), *([F(1, 2)] * 6))
    aw = tuple(1 / (2 * c) for c in constants)
    ident = [F(1)] * 8 + [F(0)] * 6

    def zero(rows=14, cols=14):
        return [[F(0) for _ in range(cols)] for _ in range(rows)]

    h, right, pi, gram, ident_gram = (zero() for _ in range(5))
    for i, w in enumerate((*weights, *aw)):
        h[i][i] = w
    for j, c in enumerate(constants):
        right[j + 2][j + 8] = F(1)
        right[j + 8][j + 2] = c
    for i in range(1, 14):
        pi[i][i] = F(1)
    shifted = zero(8, 14)
    for k, w in enumerate(weights):
        for i in range(14):
            shifted[k][i] = F(k == i) - ident[i] / (14 * w)
    for i in range(14):
        for j in range(14):
            gram[i][j] = sum(
                (w * shifted[k][i] * shifted[k][j] for k, w in enumerate(weights)), F(0)
            )
            if i == j and i >= 8:
                gram[i][j] += aw[i - 8]
            ident_gram[i][j] = ident[i] * ident[j]
    hsym, ht, hp, coercive = (zero() for _ in range(4))
    for i in range(14):
        for j in range(14):
            hsym[i][j] = h[i][j] - h[j][i]
            ht[i][j] = sum(
                (h[i][k] * right[k][j] - right[k][i] * h[k][j] for k in range(14)), F(0)
            )
            hp[i][j] = sum(
                (h[i][k] * pi[k][j] - pi[k][i] * h[k][j] for k in range(14)), F(0)
            )
            coercive[i][j] = h[i][j] - ident_gram[i][j] / 14 - gram[i][j]
    tables = dict(
        H=h,
        Cgram=gram,
        right_action=right,
        pi_action=pi,
        identity_gram=ident_gram,
        Hsym=hsym,
        HT=ht,
        HPi=hp,
        Gram=coercive,
    )
    return dict(
        schema="nr-case12-full58-factorized-quadratic-v1",
        basis=[
            "O",
            "E0",
            *[f"E{j}" for j in range(1, 7)],
            *[f"a{j}" for j in range(1, 7)],
        ],
        component_weights=[str(w) for w in weights],
        action_weights=[str(w) for w in aw],
        identity_vector=[str(x) for x in ident],
        tables={name: table(value) for name, value in tables.items()},
        shifted_components=table(shifted),
        accepted=not any(x for m in (hsym, ht, hp, coercive) for row in m for x in row),
    )


def check_formal_record(record):
    expected = formal_certificate()
    G.require(
        canonical_equal(record, expected),
        "independent formal Gram/action coefficient mismatch",
    )
    decisions = formal_decisions(expected)
    G.require(
        expected["accepted"] == all(decisions.values()),
        "formal acceptance differs from actual residuals",
    )
    return expected["accepted"]


def formal_decisions(record):
    decisions = {}
    for name, key in (
        ("Hsym", "formal_symmetry"),
        ("HT", "formal_intrinsic"),
        ("HPi", "formal_pde"),
        ("Gram", "formal_coercivity"),
    ):
        current = record["tables"][name]
        G.require(
            type(current) is dict
            and set(current) == {"shape", "entries"}
            and current["shape"] == [14, 14]
            and type(current["entries"]) is list
            and len(current["entries"]) == 196,
            "complete formal residual table",
        )
        nonzero = False
        for position, row in enumerate(current["entries"]):
            i, j = divmod(position, 14)
            G.require(
                type(row) is list
                and len(row) == 3
                and type(row[0]) is type(row[1]) is int
                and row[:2] == [i, j],
                "complete canonical formal coordinates",
            )
            nonzero = bool(rational(row[2])) or nonzero
        decisions[key] = not nonzero
    return decisions


def coefficient_bound(k_record, projectors, m=F(5, 6), guard=lambda: None):
    G.require(type(m) is F and m == F(5, 6), "registered exact metric lower bound")
    k = V.decode_matrix(k_record, shape=(58, 58), max_degree=1)
    entries, total = [], F(0)
    for i, row in enumerate(k):
        guard()
        for j, poly in enumerate(row):
            G.require(
                all(sum(power) == 1 for power in poly), "homogeneous linear parent"
            )
            G.require(not poly or (i >= 11 and j >= 11), "both ODE block sides zero")
            value = sum((abs(x) for x in poly.values()), F(0))
            entries.append([i, j, str(value)])
            total += value
    G.require(type(projectors) is list and len(projectors) == 7, "all seven projectors")
    ratio = total * total / m
    q, rows = [], []
    for projector in projectors:
        guard()
        values = decode_univariate(projector["e"], 6)
        terms = [
            [i, str(abs(value)), str(abs(value) * ratio**i)]
            for i, value in enumerate(values)
            if value
        ]
        value = sum((rational(term[2]) for term in terms), F(0))
        q.append(value)
        rows.append(dict(name=projector["name"], terms=terms, value=str(value)))
    pairs = [x * x / 2 for x in q[1:]]
    actions = [
        total * total * x * x / (2 * m * c)
        for x, c in zip(q[1:], CONSTANTS, strict=True)
    ]
    upper = F(1) + q[0] ** 2 + sum(pairs, F(0)) + sum(actions, F(0))
    return dict(
        schema="nr-case12-full58-factorized-bound-v1",
        shape=[58, 58],
        entries=entries,
        B=str(total),
        m=str(m),
        ratio=str(ratio),
        q=[str(x) for x in q],
        q_rows=rows,
        upper_terms=dict(
            ode="1",
            zero=str(q[0] ** 2),
            pairs=[str(x) for x in pairs],
            actions=[str(x) for x in actions],
        ),
        upper=str(upper),
        lower="1/14",
        shift_norm_upper="3/25",
        main_norm_upper=str(total + F(3, 25)),
        sphere="r=1",
        accepted=upper >= F(1, 14),
    )


def check_bound_record(record, k_record, projectors, guard=lambda: None):
    G.require(
        canonical_equal(projectors, univariate_certificate(guard=guard)["projectors"]),
        "complete registered projectors for upper bound",
    )
    G.require(
        canonical_equal(record, coefficient_bound(k_record, projectors, guard=guard)),
        "independent actual coefficient and quantitative bound differs",
    )
    return True


def negative_controls(univariate):
    n = [[F(0), F(1)], [F(0), F(0)]]
    eye = [[F(1), F(0)], [F(0), F(1)]]

    def mm(a, b):
        return [
            [sum((a[i][k] * b[k][j] for k in range(2)), F(0)) for j in range(2)]
            for i in range(2)
        ]

    def evaluate(poly, matrix):
        answer = [[F(0), F(0)], [F(0), F(0)]]
        power = eye
        for c in poly:
            for i in range(2):
                for j in range(2):
                    answer[i][j] += c * power[i][j]
            power = mm(power, matrix)
        return answer

    modulus = decode_univariate(univariate["modulus"], 13)
    u0 = decode_univariate(univariate["projectors"][0]["u"], 12)
    nq = mm(n, n)
    odd = evaluate(modulus, n)
    even_polynomial = [F(0), F(1)]
    for c in CONSTANTS:
        even_polynomial = mul(even_polynomial, [-c, F(1)])
    even = evaluate(even_polynomial, nq)
    action = mm(n, evaluate(u0, n))

    def count(a):
        return sum(bool(x) for row in a for x in row)

    jordan = dict(
        N=table(n),
        N_squared=table(nq),
        odd_result=table(odd),
        even_result=table(even),
        zero_action_result=table(action),
        odd_nonzero_slots=count(odd),
        zero_action_nonzero_slots=count(action),
        detected=not count(nq)
        and not count(even)
        and count(odd) > 0
        and count(action) > 0,
    )
    original = next(
        row for row in univariate["relations"] if row["name"] == "zero-action"
    )
    value = add(decode_univariate(original["polynomial"]), [F(1)])
    quotient, remainder = divide(value, modulus)
    back = add(add(value, mul(modulus, quotient), F(-1)), remainder, F(-1))
    mutation = dict(
        name="add-one-to-zero-action",
        original_relation="zero-action",
        polynomial=encode_univariate(value),
        quotient=encode_univariate(quotient),
        remainder=encode_univariate(remainder),
        multiplyback=encode_univariate(back),
        rejected=bool(remainder) and not back,
    )
    return dict(
        schema="nr-case12-full58-factorized-negatives-v1",
        jordan=jordan,
        relation_mutation=mutation,
        accepted=jordan["detected"] and mutation["rejected"],
    )


def domain_metadata():
    return dict(
        schema="nr-case12-full58-factorized-domain-v1",
        real_domain="v!=0",
        unit_sphere="r=1",
        g_lower="5/6",
        gram_metric="I58",
        normalization="T=K0/sqrt(g); a_j=A_j/sqrt(g)",
        denominators=["g"],
        smooth_on_real_domain=True,
        full58_scope="fixed-case12 geometric=False principal rational direction extension",
        expanded_H_computed=False,
    )


def replay_inputs():
    return {"parent-inputs/" + name for name in PARENT_INPUTS} | {
        name + ".json" for name in METADATA
    }


def replay(directory, budget, stage):
    hashes = {}

    def load(name):
        budget.guard()
        raw = G.contained(directory, name).read_bytes()
        hashes[name] = G.hashlib.sha256(raw).hexdigest()
        return json.loads(raw)

    parent = {name: load("parent-inputs/" + name) for name in PARENT_INPUTS}
    G.require(
        all(
            hashes["parent-inputs/" + name] == digest
            for name, digest in PARENT_INPUTS.items()
        ),
        "independent parent byte identities",
    )
    domain = foundation().verify_domain(
        parent["parent-inputs/parent-inputs/domain.json"],
        parent["parent-inputs/parent-inputs/denominators.json"],
    )
    domain.pop("delta")
    den = parent["parent-inputs/parent-inputs/denominators.json"]
    r = V.decode_polynomial(den["r"], max_degree=2)
    g = V.decode_polynomial(den["g"], max_degree=2)
    b = {(1, 0, 0): F(3, 100), (0, 1, 0): F(-1, 25), (0, 0, 1): F(1, 20)}
    G.require(
        canonical_equal(
            parent["scalars.json"],
            dict(
                r=V.encode_polynomial(r),
                g=V.encode_polynomial(g),
                b=V.encode_polynomial(b),
                squared_speeds=[
                    V.encode_polynomial({p: c * v for p, v in g.items()})
                    for c in CONSTANTS
                ],
            ),
        ),
        "original normalization and six source speeds",
    )
    k = V.decode_matrix(parent["parent-inputs/K.json"], shape=(58, 58), max_degree=1)
    k0 = V.decode_matrix(parent["K0.json"], shape=(58, 58), max_degree=1)
    pi = V.decode_matrix(parent["Pi.json"], shape=(58, 58), max_degree=0)
    for i in range(58):
        budget.guard()
        for j in range(58):
            G.require(
                pi[i][j] == ({(0, 0, 0): F(1)} if i == j and i >= 11 else {}),
                "actual complete orthogonal PDE projector",
            )
            G.require(
                all(sum(power) == 1 for poly in (k[i][j], k0[i][j]) for power in poly),
                "actual homogeneous full58 principal entries",
            )
            if i < 11 or j < 11:
                G.require(not k[i][j] and not k0[i][j], "zero ODE rows and columns")
            actual = dict(k0[i][j])
            if i == j and i >= 11:
                for power, coefficient in b.items():
                    actual[power] = actual.get(power, F(0)) + coefficient
                    if not actual[power]:
                        del actual[power]
            G.require(actual == k[i][j], "independent complete shift reconstruction")
    H = helper().helper()
    for name, cap in (
        ("K0", 1),
        ("Pi", 0),
        ("Z6", 13),
        ("shift_residual", 1),
        ("embedding_residual", 1),
    ):
        matrix = V.decode_matrix(parent[name + ".json"], shape=(58, 58), max_degree=cap)
        G.require(
            H.matrix_stats(matrix, cap) == parent["stats.json"][name],
            "parent complete statistics",
        )
        if name in ("Z6", "shift_residual", "embedding_residual"):
            G.require(V.zero_check(matrix, (58, 58)) == 3364, "parent exact residual")
    inherited = parent["independent-replay.json"]
    G.require(
        inherited["passed"] is True
        and inherited["independent_dimension"] == 58
        and inherited["annihilator_slots"] == 3364
        and inherited["acceptance"]["annihilator_zero"] is True
        and inherited["input_hashes"]["K0.json"] == PARENT_INPUTS["K0.json"],
        "accepted full13 polynomial inherited with exact matrix bytes",
    )
    import nr_case12_full58_spectral as S

    G.require(
        parent["source_bridge.json"] == S.source_bridge_manifest()
        and parent["parent_provenance.json"] == S.parent_provenance_manifest(),
        "inherited source formula and closure chain",
    )
    import nr_case12_full58_factorized_energy as P

    G.require(
        load("source_bridge.json") == P.source_bridge_manifest()
        and load("parent_provenance.json") == P.parent_provenance_manifest(PARENT),
        "new paired-energy source and parent provenance",
    )
    stage("replay-parent-and-domain-complete", actual_slots=3364)
    univariate = univariate_certificate(guard=budget.guard)
    G.require(
        canonical_equal(univariate, load("univariate.json")),
        "independent dense polynomial construction",
    )
    G.require(
        len(univariate["relations"]) == 69
        and all(
            verify_division(row, univariate["modulus"])
            for row in univariate["relations"]
        ),
        "all 69 odd-polynomial identities and multiplybacks",
    )
    stage("replay-univariate-complete", relations=69)
    formal = load("formal.json")
    formal_valid = check_formal_record(formal)
    formal_flags = formal_decisions(formal)
    G.require(
        formal_valid == all(formal_flags.values()), "actual formal zero decisions"
    )
    stage("replay-formal-complete", slots=1876, zero_residual_slots=784)
    bounds = coefficient_bound(
        parent["K0.json"], univariate["projectors"], guard=budget.guard
    )
    G.require(
        canonical_equal(bounds, load("bounds.json")),
        "all actual coefficient bounds and quantitative C",
    )
    negative = negative_controls(univariate)
    G.require(
        canonical_equal(negative, load("negatives.json")),
        "independent Jordan and relation mutation",
    )
    G.require(
        canonical_equal(load("domain_metadata.json"), domain_metadata()),
        "factorized energy domain",
    )
    acceptance = dict(
        parent_structure=True,
        univariate_relations=univariate["accepted"],
        **formal_flags,
        uniform_bounds=bounds["accepted"],
        negative_controls=negative["accepted"],
    )
    acceptance["accepted"] = all(acceptance.values())
    G.require(
        canonical_equal(acceptance, load("acceptance.json"))
        and set(hashes) == replay_inputs(),
        "independent complete decisions and bytes",
    )
    return dict(
        schema="nr-case12-independent-full58-factorized-energy-v1",
        passed=acceptance["accepted"],
        acceptance=acceptance,
        relations=69,
        formal_slots=1876,
        formal_zero_slots=784,
        actual_bound_slots=3364,
        uniform_lower=bounds["lower"],
        uniform_upper=bounds["upper"],
        actual_K0_bound=bounds["B"],
        jordan_detected=negative["jordan"]["detected"],
        mutation_rejected=negative["relation_mutation"]["rejected"],
        fixed_domain=domain,
        domain_metadata=domain_metadata(),
        parent_gate_sha256=PARENT_GATE,
        input_hashes=hashes,
        energy_certificate_form=ENERGY_FORM,
        library="stdlib dense Fraction polynomial division and independent formal Gram coefficients",
        arithmetic_source=dict(path=EXTRA[2], sha256=G.sha(ROOT / EXTRA[2])),
    )


def registered_tests():
    tests = {}
    for filename, (functions, instances) in zip(
        TEST_FILES, TEST_REGISTRATION, strict=True
    ):
        tree = ast.parse((ROOT / filename).read_text(encoding="utf-8"))
        current = {}
        for node in tree.body:
            if not isinstance(node, ast.FunctionDef) or not node.name.startswith(
                "test_"
            ):
                continue
            count = 1
            for item in node.decorator_list:
                G.require(
                    isinstance(item, ast.Call)
                    and ast.unparse(item.func) == "pytest.mark.parametrize"
                    and len(item.args) == 2
                    and isinstance(item.args[1], (ast.List, ast.Tuple))
                    and not item.keywords,
                    "explicit test parameter registration",
                )
                count *= len(item.args[1].elts)
            G.require(
                node.name not in current and node.name not in tests and count > 0,
                "unique test names",
            )
            current[node.name] = count
        G.require(
            len(current) == functions and sum(current.values()) == instances,
            "registered full58 control count",
        )
        tests.update(current)
    return tests


def test_evidence(path):
    root = ET.parse(path).getroot()
    cases = list(root.iter("testcase"))
    names = [[row.get("classname"), row.get("name")] for row in cases]
    expected = registered_tests()
    G.require(
        len(names) == len({tuple(row) for row in names})
        and dict(Counter(row.get("name", "").split("[", 1)[0] for row in cases))
        == expected
        and not any(list(root.iter(tag)) for tag in ("error", "failure", "skipped")),
        "all registered controls without errors or skips",
    )
    return dict(
        tests=len(cases),
        identities=names,
        registered=expected,
        failures=0,
        errors=0,
        skipped=0,
    )


def controls(budget):
    command = [
        sys.executable,
        "-B",
        "-m",
        "pytest",
        "-q",
        "-s",
        "--noconftest",
        "-c",
        str(ROOT / "science/numerical_relativity/pytest-single-scan-controls.ini"),
        "--rootdir",
        str(ROOT),
        "--junitxml",
        str(budget.directory / "unit-controls.xml"),
        *[str(ROOT / name) for name in TEST_FILES],
    ]
    budget.record("unit-command.json", command)
    with (budget.directory / "unit-controls.log").open("xb") as stream:
        child = subprocess.Popen(
            command,
            cwd=ROOT,
            stdout=stream,
            stderr=subprocess.STDOUT,
            creationflags=subprocess.CREATE_NO_WINDOW,
            env=dict(
                os.environ,
                PYTEST_ADDOPTS="",
                PYTEST_PLUGINS="",
                PYTEST_DISABLE_PLUGIN_AUTOLOAD="1",
            ),
        )
        while child.poll() is None:
            budget.guard()
            time.sleep(0.05)
        budget.guard()
        G.require(child.returncode == 0, "full58 controls failed; no automatic retry")
    result = test_evidence(budget.directory / "unit-controls.xml")
    budget.record("unit-controls.json", result)
    return result


def worker(directory):
    prepared = G.read_terminal(directory / "qualification-gate.json.prepared.json")
    G.require(
        directory.parent == G.EVIDENCE
        and prepared["passed"] is False
        and prepared["run_id"] == os.environ.get("NR_OWNED_CONTROL_RUN_ID"),
        "owned worker required",
    )
    G.require(
        all(
            os.environ.get(name) == "1"
            for name in ("OPENBLAS_NUM_THREADS", "OMP_NUM_THREADS", "MKL_NUM_THREADS")
        ),
        "single numerical thread",
    )
    budget, started = C.SingleScanBudget(directory), time.monotonic()
    result = dict(
        schema=METHOD,
        passed=False,
        completed=False,
        errors=[],
        stages=[],
        phase="intake",
        case_indices=[12],
        principal_scope=PRINCIPAL_SCOPE,
        energy_certificate_form=ENERGY_FORM,
        full58_principal_factorized_energy_validated=False,
        full58_principal_energy_validated=False,
        direction_uniform_energy_validated=False,
        uniform_strong_hyperbolicity_validated=False,
        parent_gate_sha256=PARENT_GATE,
        integration_steps=0,
        native_calls=0,
        retries=0,
        original_threshold=2e-12,
        coefficient_acceptance="exact-zero-only",
        **{name: False for name in FALSE_FLAGS},
    )
    budget.record("attempt.json", result)

    def stage(name, **fields):
        row = dict(stage=name, seconds=time.monotonic() - started, **fields)
        budget.record(f"stage-{len(result['stages']):02d}-{name}.json", row)
        result["phase"] = name
        result["stages"].append(row)
        print(json.dumps(row), flush=True)

    try:
        table, before = sources(budget), history(budget)
        result["source_before"] = table
        budget.record("history-before.json", before)
        result["snapshot_bytes"] = foundation().snapshot(budget, table)
        parent_gate()
        for name, digest in PARENT_INPUTS.items():
            raw = (PARENT / name).read_bytes()
            G.require(
                G.hashlib.sha256(raw).hexdigest() == digest, "parent input identity"
            )
            budget.save("parent-inputs/" + name, raw)
        stage(
            "intake-complete",
            sources=len(table),
            historical_files=sum(map(len, before.values())),
        )
        result["unit_controls"] = controls(budget)
        stage("unit-controls-complete", tests=result["unit_controls"]["tests"])
        import nr_case12_full58_factorized_energy as P

        saved = []

        def sink(name, record):
            G.require(
                name in METADATA and name not in saved,
                "unique complete certificate part",
            )
            budget.record(name + ".json", record)
            saved.append(name)
            stage("certificate-" + name + "-saved")

        certificate = P.build_certificate(PARENT, guard=budget.guard, sink=sink)
        for name in METADATA:
            if name not in saved:
                sink(name, certificate[name])
            else:
                G.require(
                    read(directory / (name + ".json")) == certificate[name],
                    "saved certificate stage changed",
                )
        G.require(set(saved) == set(METADATA), "all certificate parts saved")
        stage("complete-candidate-evidence-saved", acceptance=certificate["acceptance"])
        result["replay"] = replay(directory, budget, stage)
        budget.record("independent-replay.json", result["replay"])
        stage("independent-replay-complete", passed=result["replay"]["passed"])
        budget.record("dependencies.json", foundation().dependencies(budget))
        G.require(
            sources(budget)
            == table
            == G.inventory(directory / "source-snapshot", "", budget),
            "source snapshot drift",
        )
        after = history(budget)
        G.require(before == after, "historical evidence drift")
        budget.record("history-after.json", after)
        result.update(
            source_after=table, old_artifacts_unchanged=True, computation_completed=True
        )
        G.require(
            result["replay"]["passed"] is True,
            "factored energy candidate failed; complete available evidence preserved",
        )
        result.update(
            passed=True,
            completed=True,
            full58_principal_factorized_energy_validated=True,
            full58_principal_energy_validated=True,
            direction_uniform_energy_validated=True,
            uniform_strong_hyperbolicity_validated=True,
        )
        stage("complete", passed=True)
    except BaseException as error:
        result["errors"].append(f"{type(error).__name__}: {error}")
        result.update(
            passed=False,
            completed=False,
            full58_principal_factorized_energy_validated=False,
            full58_principal_energy_validated=False,
            direction_uniform_energy_validated=False,
            uniform_strong_hyperbolicity_validated=False,
        )
    result["seconds"] = time.monotonic() - started
    budget.record("worker-result.json", result)
    print(
        json.dumps(
            {name: result[name] for name in ("passed", "phase", "seconds", "errors")}
        ),
        flush=True,
    )
    return 0 if result["passed"] else 1


def finalizer(directory, budget):
    """Saved records, source AST and hashes only; no mathematical replay."""
    result = read(directory / "worker-result.json")
    G.require(
        result["schema"] == METHOD
        and result["passed"]
        is result["completed"]
        is result["full58_principal_factorized_energy_validated"]
        is result["full58_principal_energy_validated"]
        is result["direction_uniform_energy_validated"]
        is result["uniform_strong_hyperbolicity_validated"]
        is True
        and not result["errors"],
        "complete factored energy candidate",
    )
    G.require(
        all(result[name] is False for name in FALSE_FLAGS)
        and result["case_indices"] == [12]
        and result["principal_scope"] == PRINCIPAL_SCOPE
        and result["energy_certificate_form"] == ENERGY_FORM
        and result["integration_steps"]
        == result["native_calls"]
        == result["retries"]
        == 0
        and result["original_threshold"] == 2e-12
        and result["coefficient_acceptance"] == "exact-zero-only"
        and result["parent_gate_sha256"] == PARENT_GATE,
        "fixed scope and budgets",
    )
    G.require(
        test_evidence(directory / "unit-controls.xml")
        == result["unit_controls"]
        == read(directory / "unit-controls.json"),
        "saved controls",
    )
    report, bounds = (
        read(directory / "independent-replay.json"),
        read(directory / "bounds.json"),
    )
    G.require(
        report == result["replay"]
        and report["passed"] is True
        and report["schema"] == "nr-case12-independent-full58-factorized-energy-v1"
        and report["relations"] == 69
        and report["formal_slots"] == 1876
        and report["formal_zero_slots"] == 784
        and report["actual_bound_slots"] == 3364
        and report["parent_gate_sha256"] == PARENT_GATE
        and report["uniform_lower"] == bounds["lower"] == "1/14"
        and report["uniform_upper"] == bounds["upper"]
        and report["actual_K0_bound"] == bounds["B"]
        and report["domain_metadata"] == domain_metadata()
        and report["energy_certificate_form"] == ENERGY_FORM
        and report["jordan_detected"] is report["mutation_rejected"] is True
        and set(report["acceptance"])
        == {
            "parent_structure",
            "univariate_relations",
            "formal_symmetry",
            "formal_intrinsic",
            "formal_pde",
            "formal_coercivity",
            "uniform_bounds",
            "negative_controls",
            "accepted",
        }
        and all(value is True for value in report["acceptance"].values())
        and report["acceptance"] == read(directory / "acceptance.json")
        and report["arithmetic_source"]
        == dict(path=EXTRA[2], sha256=G.sha(ROOT / EXTRA[2]))
        and report["library"]
        == "stdlib dense Fraction polynomial division and independent formal Gram coefficients"
        and set(report["input_hashes"]) == replay_inputs(),
        "complete owned independent proof",
    )
    for name, digest in report["input_hashes"].items():
        budget.guard()
        G.require(
            G.sha(G.contained(directory, name)) == digest, "replayed bytes changed"
        )
    import nr_case12_full58_factorized_energy as P

    G.require(
        P.source_bridge_manifest() == read(directory / "source_bridge.json")
        and P.parent_provenance_manifest(PARENT)
        == read(directory / "parent_provenance.json"),
        "final source AST and parent bytes",
    )
    dependency = read(directory / "dependencies.json")
    G.require(
        dependency["versions"]["sympy"] == "1.13.3"
        and dependency["versions"]["numpy"] == "2.2.6",
        "registered runtime",
    )
    for index, (name, digest) in enumerate(
        dependency["loaded_runtime_file_hashes"].items()
    ):
        if index % 32 == 0:
            budget.guard()
        G.require(G.sha(name) == digest, "runtime source changed")
    table = sources(budget)
    G.require(
        table
        == result["source_before"]
        == result["source_after"]
        == G.inventory(directory / "source-snapshot", "", budget),
        "final source closure",
    )
    G.require(
        history(budget)
        == read(directory / "history-before.json")
        == read(directory / "history-after.json"),
        "final history closure",
    )
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output-directory", type=Path, required=True)
    parser.add_argument("--guard-worker", action="store_true", help=argparse.SUPPRESS)
    args = parser.parse_args()
    directory = Path(os.path.abspath(args.output_directory))
    if args.guard_worker:
        return worker(directory)
    G.require(
        G.sha(ROOT / "scripts/nr_owned_control.py")
        == "58d535413f7aca0c088c085994bb7eaf507dd41a1dd6b1df1f2a471d41e5bba1",
        "unchanged supervisor",
    )
    result = G.supervise(
        [
            sys.executable,
            "-B",
            str(Path(__file__).resolve()),
            "--guard-worker",
            "--output-directory",
            str(directory),
        ],
        directory,
        finalizer=finalizer,
        budget_factory=C.SingleScanBudget,
    )
    print(
        json.dumps({name: result[name] for name in ("passed", "completed", "errors")}),
        flush=True,
    )
    return 0 if result["passed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
