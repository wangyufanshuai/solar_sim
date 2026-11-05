"""Additive constant-profile shadow adapter; never changes stored input nodes.

Construction uses prescribed high-precision nodes. Acceptance remains the
unchanged full43/full58 contract, evaluated against original float64 inputs.
No runtime/solver integration or scientific admission is provided here.
"""

import numpy as np

from . import constraint_energy_controls as C
from . import constraint_projector_energy_v3 as V

METHOD = "nr-constant-profile-hermite-v3-candidate"
IMMUTABLE_ARRAYS = ("cell", "normal", "principal", "ode", "intrinsic", "roots",
                    "leading", "main", "main_intrinsic", "speeds")


def candidate(arrays, nodes, *, precision=70, pulse=lambda: None):
    if set(arrays) != set(C.SHAPES) or any(a.shape != C.SHAPES[k] or a.dtype != np.float64
            or not np.isfinite(a).all() for k, a in arrays.items()):
        raise ValueError("complete finite original float64 evidence required")
    values = {name: a.copy() for name, a in arrays.items()}
    values["projectors"] = V.hermite_projectors(values["intrinsic"], np.eye(43) - values["ode"],
                                              nodes, precision=precision, pulse=pulse)
    values["full_projectors"] = np.zeros((13, 58, 58))
    values["full_projectors"][:, 11:, 11:] = V.hermite_projectors(
        values["main_intrinsic"][11:, 11:], np.eye(47), nodes, precision=precision, pulse=pulse)
    values["energy"] = C.E.energy(values["ode"], values["projectors"])
    values["energy_eigenvalues"] = np.linalg.eigvalsh(values["energy"])
    if not all(np.array_equal(values[name], arrays[name]) for name in IMMUTABLE_ARRAYS):
        raise ValueError("candidate must not replace input matrices or acceptance nodes")
    return values


def shifted_projectors(matrix, beta_normal, nodes, *, precision=70, pulse=lambda: None):
    """47-PDE block only: subtract shift from each NEW actual input matrix."""
    matrix = np.asarray(matrix)
    if matrix.shape != (47, 47) or matrix.dtype != np.float64 or not np.isfinite(matrix).all():
        raise ValueError("actual finite float64 47-PDE block required")
    if type(beta_normal) is not float or not np.isfinite(beta_normal):
        raise ValueError("finite binary64 shift required")
    intrinsic = matrix - beta_normal * np.eye(47)
    return V.hermite_projectors(intrinsic, np.eye(47), nodes, precision=precision, pulse=pulse)
