from __future__ import annotations

import numpy as np
import pytest

from .nr3d import BSSNState3D, Grid3D
from .plane_constraint_oracle import (
    diagonal_plane_scalar_curvature, exact_plane_line, periodic_spectral_derivatives,
    plane_diagonal_hamiltonian,
)


def _flat(points=64):
    return BSSNState3D.minkowski(Grid3D((points,5,5),(0.,)*3,(1.,)*3,boundary="periodic"))


@pytest.mark.parametrize("points", (31,32))
def test_fourier_derivatives_of_resolved_modes(points):
    x = np.arange(points)/points
    first, second = periodic_spectral_derivatives(np.sin(6.*np.pi*x),1.)
    np.testing.assert_allclose(first,6.*np.pi*np.cos(6.*np.pi*x),rtol=0.,atol=2.e-13)
    np.testing.assert_allclose(second,-(6.*np.pi)**2*np.sin(6.*np.pi*x),rtol=0.,atol=2.e-11)


def test_even_nyquist_first_and_second_derivatives_have_different_rules():
    values = (-1.)**np.arange(16)
    first, second = periodic_spectral_derivatives(values,1.)
    np.testing.assert_array_equal(first,np.zeros(16))
    np.testing.assert_allclose(second,-(16.*np.pi)**2*values,rtol=1.e-15)


def test_flat_coordinate_wave_has_zero_spatial_curvature():
    base = _flat()
    x = base.grid.coordinates[0]
    base.h[...,0,0] = 1.+.3*np.sin(2.*np.pi*x)
    result = plane_diagonal_hamiltonian(base)
    np.testing.assert_array_equal(result.hamiltonian,np.zeros(64))
    assert not result.full_3d_oracle and not result.runtime_writeback


def test_conformally_flat_metric_matches_analytic_hamiltonian():
    base = _flat()
    x = base.grid.coordinates[0]
    psi = 1.+.1*np.cos(2.*np.pi*x)
    base.chi[:] = psi**-4
    result = plane_diagonal_hamiltonian(base)
    expected = 8.*.1*(2.*np.pi)**2*np.cos(2.*np.pi*x[:,0,0])/psi[:,0,0]**5
    np.testing.assert_allclose(result.hamiltonian,expected,rtol=0.,atol=1.e-10)


def test_spectral_plane_oracle_agrees_with_exact_gauge_wave_constraints():
    grid = _flat().grid
    base = BSSNState3D.gauge_wave(grid,amplitude=.01,wavelength=1.,time=.137)
    result = plane_diagonal_hamiltonian(base)
    assert result.norms["hamiltonian_l_inf"] < 1.e-12
    assert result.reconstructed_trace_error_l_inf < 1.e-15


def test_anisotropic_analytic_jets_agree_with_symbolic_ricci():
    sp = pytest.importorskip("sympy")
    x = sp.symbols("x", real=True)
    a,b,c = [sp.Function(name)(x) for name in ("a","b","c")]
    g = sp.diag(a,b,c)
    inv = g.inv()
    def derivative(value, axis):
        return sp.diff(value,x) if axis == 0 else sp.Integer(0)
    ch = [[[sum(inv[i,ell]*(derivative(g[ell,k],j)+derivative(g[ell,j],k)-derivative(g[j,k],ell))/2
                  for ell in range(3)) for k in range(3)] for j in range(3)] for i in range(3)]
    scalar = sum(inv[i,j]*sum(derivative(ch[k][i][j],k)-derivative(ch[k][i][k],j)
                             +sum(ch[k][i][j]*ch[ell][k][ell]-ch[k][i][ell]*ch[ell][j][k] for ell in range(3))
                             for k in range(3)) for i in range(3) for j in range(3))
    expected = (-sp.diff(b,x,2)/(a*b)-sp.diff(c,x,2)/(a*c)
                +sp.diff(b,x)**2/(2*a*b**2)+sp.diff(c,x)**2/(2*a*c**2)
                +sp.diff(a,x)*(sp.diff(b,x)/b+sp.diff(c,x)/c)/(2*a**2)
                -sp.diff(b,x)*sp.diff(c,x)/(2*a*b*c))
    assert sp.simplify(scalar-expected) == 0
    values = np.array([[1.2,.8,1.7],[.9,1.4,1.1]])
    d1 = np.array([[.2,-.3,.5],[-.1,.1,.4]])
    d2 = np.array([[-.4,.8,.3],[.1,-.7,.6]])
    substitutions = [a,b,c,*(sp.diff(v,x) for v in (a,b,c)),*(sp.diff(v,x,2) for v in (a,b,c))]
    symbols = sp.symbols("v0:9")
    oracle = sp.lambdify(symbols,scalar.xreplace(dict(zip(substitutions,symbols))),"numpy",cse=True)
    target = oracle(*values.T,*d1.T,*d2.T)
    np.testing.assert_allclose(diagonal_plane_scalar_curvature(values,d1,d2),target,atol=5.e-15,rtol=0.)


def test_oracle_rejects_even_tiny_nonplanarity_or_offdiagonal_geometry():
    base = _flat(9)
    base.chi[0,1,0] += 1.e-12
    with pytest.raises(ValueError,match="transverse"):
        plane_diagonal_hamiltonian(base)
    base = _flat(9)
    base.h[...,0,1] = base.h[...,1,0] = 1.e-30
    with pytest.raises(ValueError,match="diagonal"):
        plane_diagonal_hamiltonian(base)


def test_oracle_rejects_invalid_or_masked_data():
    with pytest.raises(ValueError,match="real"):
        periodic_spectral_derivatives(np.ones(9,dtype=complex),1.)
    with pytest.raises(ValueError,match="length"):
        periodic_spectral_derivatives(np.ones(9),0.)
    with pytest.raises(ValueError,match="finite"):
        exact_plane_line(np.full((5,5,5),np.nan))
    base = _flat(9)
    base.valid_mask[0,0,0] = False
    with pytest.raises(ValueError,match="fully valid periodic"):
        plane_diagonal_hamiltonian(base)
