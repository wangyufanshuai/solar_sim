"""GPU test-particle module: skip without CUDA; compare to NumPy reference."""

from __future__ import annotations

import numpy as np
import pytest

from solar_sim.gpu_test_particles import (
    cuda_available,
    GpuParticleSimulator,
    numpy_init_half,
    numpy_leapfrog_step,
)
from solar_sim.pn_integrator import default_gravity_and_light_speed


pytestmark = pytest.mark.skipif(
    not cuda_available(),
    reason="No CUDA device or PyCUDA unavailable",
)


@pytest.fixture(scope="module")
def G():
    G, _ = default_gravity_and_light_speed()
    return G


def test_leapfrog_matches_numpy_fp64(G: float):
    rng = np.random.default_rng(42)
    n_p = 512
    n_b = 4
    r = rng.normal(scale=1e9, size=(n_p, 3))
    v0 = rng.normal(scale=500.0, size=(n_p, 3))
    big_r = rng.normal(scale=1e11, size=(n_b, 3))
    big_m = np.abs(rng.normal(scale=1e26, size=n_b)) + 1e24
    dt = 60.0
    eps2 = (1e6) ** 2

    sim = GpuParticleSimulator(
        n_p, big_m, dtype=np.float64, integrator="leapfrog", block_size=128
    )
    sim.set_big_positions_host(big_r)
    sim.set_particles_host(r, v0.copy())
    sim.init_leapfrog(G, dt, eps2)

    v_half_ref = numpy_init_half(r, v0, big_r, big_m, G, eps2, dt)
    r1_ref, vh1_ref = numpy_leapfrog_step(r, v_half_ref, big_r, big_m, G, eps2, dt)

    sim.step(G, dt, eps2)
    r1_gpu, vh1_gpu = sim.get_particles_host()

    np.testing.assert_allclose(r1_gpu, r1_ref, rtol=1e-10, atol=1e-6)
    np.testing.assert_allclose(vh1_gpu, vh1_ref, rtol=1e-10, atol=1e-6)


def test_leapfrog_matches_numpy_fp32(G: float):
    rng = np.random.default_rng(1)
    n_p = 256
    n_b = 3
    r = rng.normal(scale=1e9, size=(n_p, 3)).astype(np.float32)
    v0 = rng.normal(scale=500.0, size=(n_p, 3)).astype(np.float32)
    big_r = rng.normal(scale=1e11, size=(n_b, 3)).astype(np.float32)
    big_m = (np.abs(rng.normal(scale=1e26, size=n_b)) + 1e24).astype(np.float32)
    dt = np.float32(120.0)
    eps2 = np.float32((1e6) ** 2)

    sim = GpuParticleSimulator(n_p, big_m, dtype=np.float32, integrator="leapfrog")
    sim.set_big_positions_host(big_r)
    sim.set_particles_host(r, v0.copy())
    sim.init_leapfrog(float(G), float(dt), float(eps2))
    sim.step(float(G), float(dt), float(eps2))

    r64 = r.astype(np.float64)
    v64 = v0.astype(np.float64)
    br64 = big_r.astype(np.float64)
    bm64 = big_m.astype(np.float64)
    v_half_ref = numpy_init_half(r64, v64, br64, bm64, G, float(eps2), float(dt))
    r1_ref, vh1_ref = numpy_leapfrog_step(
        r64, v_half_ref, br64, bm64, G, float(eps2), float(dt)
    )

    r1_gpu, vh1_gpu = sim.get_particles_host()
    np.testing.assert_allclose(r1_gpu, r1_ref.astype(np.float32), rtol=1e-5, atol=1e-2)
    np.testing.assert_allclose(vh1_gpu, vh1_ref.astype(np.float32), rtol=1e-5, atol=1e-2)


def test_large_particle_count_alloc(G: float):
    """Smoke: allocate ~1e5 particles (lightweight on modern GPUs)."""
    n_p = 100_000
    n_b = 10
    big_m = (np.ones(n_b, dtype=np.float64) * 1e24).astype(np.float64)
    sim = GpuParticleSimulator(n_p, big_m, dtype=np.float32, integrator="euler")
    r = np.zeros((n_p, 3), dtype=np.float32)
    v = np.zeros((n_p, 3), dtype=np.float32)
    big_r = np.array(
        [[i * 1e11, 0.0, 0.0] for i in range(1, n_b + 1)], dtype=np.float32
    )
    sim.set_particles_host(r, v)
    sim.set_big_positions_host(big_r)
    sim.step(float(G), 1.0, (1e9) ** 2)
    out_r, out_v = sim.get_particles_host()
    assert out_r.shape == (n_p, 3)
    assert np.all(np.isfinite(out_r))
