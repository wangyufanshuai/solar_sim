"""Independent Hamiltonian diagnostic for strictly x-dependent diagonal data.

This uses a closed spatial-curvature formula and Fourier differentiation,
not the production finite-difference Christoffel/Ricci routine or evolved
Gamma. It is an additional diagnostic, never a replacement of the primary
constraint gate. Periodicity, exact transverse symmetry and diagonality are
required. A small nonzero off-diagonal/transverse feature is NOT projected out.
"""

from __future__ import annotations

from dataclasses import dataclass
import math

import numpy as np

from .nr3d import BSSNState3D


def periodic_spectral_derivatives(values, length):
    """First/second derivatives of a real periodic trigonometric interpolant.

    The first derivative's even-grid Nyquist coefficient is zero; the second
    derivative retains it. D2 is not computed as two applications of D1.
    Under-resolution/aliasing is still possible and must be checked by refinement.
    """
    if np.iscomplexobj(values):
        raise ValueError("oracle requires real values")
    values = np.asarray(values, dtype=float)
    if values.ndim != 1 or values.size < 5 or not np.all(np.isfinite(values)):
        raise ValueError("oracle requires at least five finite one-dimensional values")
    if not math.isfinite(float(length)) or length <= 0.:
        raise ValueError("periodic length must be finite and positive")
    wave = 2.*np.pi*np.fft.fftfreq(len(values), d=length/len(values))
    first_wave = wave.copy()
    if len(values) % 2 == 0:
        first_wave[len(values)//2] = 0.
    # Remove the constant mode before the FFT; it contributes no derivative.
    transformed = np.fft.fft(values-np.mean(values))
    return (np.fft.ifft(1j*first_wave*transformed).real,
            np.fft.ifft(-wave**2*transformed).real)


def diagonal_plane_scalar_curvature(metric, first, second):
    """R for ds^2=A(x)dx^2+B(x)dy^2+C(x)dz^2; supplied analytic or numeric jets."""
    metric, first, second = (np.asarray(value, dtype=float) for value in (metric, first, second))
    if metric.ndim != 2 or metric.shape[1] != 3 or len(metric) == 0 or first.shape != metric.shape or second.shape != metric.shape:
        raise ValueError("metric and derivative jets must have the same (N,3) shape")
    if not all(np.all(np.isfinite(value)) for value in (metric, first, second)) or not np.all(metric > 0.):
        raise ValueError("diagonal metric must be positive and jets finite")
    a, b, c = metric.T
    da, db, dc = first.T
    _, ddb, ddc = second.T
    return (-ddb/(a*b)-ddc/(a*c)
            + db**2/(2.*a*b**2)+dc**2/(2.*a*c**2)
            + da*(db/b+dc/c)/(2.*a**2)-db*dc/(2.*a*b*c))


def exact_plane_line(values):
    """Reject rather than silently average/project non-planar fields."""
    values = np.asarray(values)
    if values.ndim < 3 or not np.all(np.isfinite(values)):
        raise ValueError("plane data must have three spatial axes and be finite")
    line = values[:,0,0,...]
    if not np.array_equal(values, np.broadcast_to(line[:,None,None,...], values.shape)):
        raise ValueError("oracle requires exact transverse symmetry")
    return line.copy()


@dataclass(frozen=True)
class PlaneHamiltonianReport:
    scalar_curvature: np.ndarray
    kinetic_term: np.ndarray
    hamiltonian: np.ndarray
    reconstructed_trace_error_l_inf: float
    method: str = "periodic-diagonal-x-plane-Fourier-geometric-oracle-v1"
    full_3d_oracle: bool = False
    runtime_writeback: bool = False

    @property
    def norms(self):
        return {
            "hamiltonian_l2": float(np.sqrt(np.mean(self.hamiltonian**2))),
            "hamiltonian_l_inf": float(np.max(abs(self.hamiltonian))),
            "curvature_l2": float(np.sqrt(np.mean(self.scalar_curvature**2))),
            "kinetic_l2": float(np.sqrt(np.mean(self.kinetic_term**2))),
            "reconstructed_trace_error_l_inf": self.reconstructed_trace_error_l_inf,
        }


def plane_diagonal_hamiltonian(state: BSSNState3D) -> PlaneHamiltonianReport:
    if state.grid.boundary != "periodic" or not np.all(state.valid_mask):
        raise ValueError("plane oracle requires fully valid periodic data")
    h, chi, a, trace_k = (exact_plane_line(value) for value in (state.h, state.chi, state.a, state.trace_k))
    mask = ~np.eye(3, dtype=bool)
    if np.any(h[:,mask] != 0.) or np.any(a[:,mask] != 0.):
        raise ValueError("plane oracle requires exactly diagonal metric and extrinsic curvature")
    metric = np.diagonal(h, axis1=-2, axis2=-1)/chi[:,None]
    physical_k = (np.diagonal(a, axis1=-2, axis2=-1)+np.diagonal(h, axis1=-2, axis2=-1)*trace_k[:,None]/3.)/chi[:,None]
    jets = [periodic_spectral_derivatives(metric[:,axis], state.grid.upper[0]-state.grid.lower[0]) for axis in range(3)]
    scalar = diagonal_plane_scalar_curvature(metric, np.stack([jet[0] for jet in jets], axis=1),
                                             np.stack([jet[1] for jet in jets], axis=1))
    eigen_k = physical_k/metric
    kinetic = trace_k**2-np.sum(eigen_k**2, axis=1)
    return PlaneHamiltonianReport(scalar, kinetic, scalar+kinetic,
                                  float(np.max(abs(np.sum(eigen_k, axis=1)-trace_k))))
