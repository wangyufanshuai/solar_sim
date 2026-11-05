"""Complete-state extraction is confined to controls, never the candidate RHS."""

import numpy as np
from . import constraint_jet_rhs as F
from . import offsurface_z4_feedback as Q
from .spatial_taylor3 import Jet, LOOKUP, einsum as e, stack

METHOD, TOLERANCE, FALSE_FLAGS = F.METHOD, F.TOLERANCE, F.FALSE_FLAGS
CASES = Q.CASES


def background_from(q):
    if not isinstance(q, Jet) or q.order != 3 or q.shape != (58,):
        raise ValueError("canonical third-order58 coefficients required")
    return F.Background(Jet(np.concatenate((q.c[:, :18], q.c[:, 22:25]), axis=1)))


def extract(q):
    s, h, a, _ = Q.P.fields(q)
    H, M, *_ = Q.C.constraints(s.gamma, s.extrinsic)
    grad = q.gradient()
    definitions = Jet(
        q.c[:10, 25:]
        - np.stack([Q.R.gradient_aux(grad.c[n, :, :11]) for n in range(10)]),
        2,
    )
    hm = stack((H.trim(1), *[M[i].trim(1) for i in range(3)]))
    extra = stack(
        (
            q[18].trim(2),
            *[s.z[i].trim(2) for i in range(3)],
            *[definitions[i] for i in range(33)],
            (Q.P.determinant(h) - 1).trim(2),
            e("ij,ij->", h.inverse(), a).trim(2),
        )
    )
    return background_from(q), F.Constraints(hm, extra)


def zero_constraints():
    return F.Constraints(Jet.constant(np.zeros(4), 1), Jet.constant(np.zeros(39), 2))


def analytic_input(kind, axis):
    if kind not in range(7) or axis not in range(3):
        raise ValueError("registered analytic jet required")
    q = np.zeros((20, 21))
    q[0, [0, 3, 5]] = 1.0
    hm, extra, expected = np.zeros((4, 4)), np.zeros((10, 39)), np.zeros(43)
    first = LOOKUP[tuple(int(i == axis) for i in range(3))]
    second = LOOKUP[tuple(2 * int(i == axis) for i in range(3))]
    transverse = LOOKUP[tuple(2 * int(i == (axis + 1) % 3) for i in range(3))]
    if kind == 0:
        extra[transverse, 7 + 4 * axis] = 0.5
        expected[0] = -2
    elif kind == 1:
        extra[second, 38] = 0.5
        expected[0] = -4 / 3
    elif kind == 2:
        extra[second, 37] = 0.5
        expected[0] = 2
    elif kind == 3:
        hm[first, 0] = 1
        expected[1 + axis] = -0.5
    elif kind == 4:
        hm[first, 1 + axis] = 1
        expected[0] = -2
    elif kind == 5:
        extra[first, 0] = 1
        expected[1 + axis], expected[5 + axis] = 0.2, 1
    else:
        extra[transverse, 1 + axis] = 0.5
        expected[1 + axis] = 1
    return F.Background(Jet(q)), F.Constraints(Jet(hm, 1), Jet(extra, 2)), expected


def compare(q):
    background, constraints = extract(q)
    predicted = F.evaluate(background, constraints)
    reference = Q.compare(q)
    s, h, _, _ = Q.P.fields(q)
    vf, wf = Q.P.physical_fo_rates(q)
    vb, wb, *_ = Q.C.physical_rates(s)
    formal_rz, formal_z = Q.formal_curvature_z(q, s, h)
    _, cg, ricci = Q.C.geometry(s.gamma)
    covz = s.z.gradient() - e("kij,k->ij", cg, s.z)
    expected_rz = formal_rz - ricci - covz - e("ji->ij", covz)
    fo = Q.G.evaluate(Q.R.CanonicalJet(q.value, q.derivative(1)))
    actual_hessian = s.alpha.gradient().gradient() - e(
        "kij,k->ij", cg, s.alpha.gradient()
    )
    return dict(
        inputs=q.c,
        background=background.fields.c,
        hm=constraints.hm.c,
        extra=constraints.other.c,
        rates=np.stack((predicted["rates"], reference["rates43"][0])),
        metric=np.stack((predicted["metric"].c, (vf - vb).trim(2).c)),
        extrinsic=np.stack((predicted["extrinsic"].c, (wf - wb).trim(1).c)),
        ricci_z=np.stack((predicted["ricci_z"].c, expected_rz.trim(1).c)),
        z_formal=np.stack((predicted["z_formal"].c, (formal_z - s.z).trim(2).c)),
        hessian=np.stack(
            (predicted["hessian"].value, fo.lapse_hessian - actual_hessian.value)
        ),
    )


SHAPES = dict(
    inputs=(20, 58),
    background=(20, 21),
    hm=(4, 4),
    extra=(10, 39),
    rates=(2, 43),
    metric=(2, 10, 3, 3),
    extrinsic=(2, 4, 3, 3),
    ricci_z=(2, 4, 3, 3),
    z_formal=(2, 10, 3),
    hessian=(2, 3, 3),
)


def metrics(arrays):
    if set(arrays) != set(SHAPES) or any(
        a.shape != SHAPES[k] or a.dtype != np.float64 or not np.isfinite(a).all()
        for k, a in arrays.items()
    ):
        raise ValueError("complete finite FP64 constraint-jet evidence required")
    return dict(
        rate_error=float(np.max(abs(arrays["rates"][0] - arrays["rates"][1]))),
        feedback_error=float(
            max(
                np.max(abs(arrays[k][0] - arrays[k][1]))
                for k in ("metric", "extrinsic")
            )
        ),
        geometry_error=float(
            max(
                np.max(abs(arrays[k][0] - arrays[k][1]))
                for k in ("ricci_z", "z_formal", "hessian")
            )
        ),
    )
