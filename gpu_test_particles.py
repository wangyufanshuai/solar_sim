"""
GPU-accelerated massless test particles in Newtonian gravity from ``N_big`` bodies.

Parallelism: one CUDA thread per particle; inner loop over massive bodies (typically
10). Complexity O(N_particles * N_big) per step. Units: SI (m, m/s, kg); ``G`` from
``astropy.constants``.

**Integrators**
  - ``leapfrog`` (default): symplectic leapfrog with half-step velocities stored in
    the ``v`` buffer after :meth:`init_leapfrog` and each :meth:`step`.
  - ``euler``: explicit Euler–Cromer (first-order).

**Requirements**: PyCUDA + NVIDIA driver/CUDA. Install from ``requirements-gpu.txt``.

**Note**: The simulator class is named ``GpuParticleSimulator`` (not ``Test*``) so
pytest does not treat it as a test class.

No inter-particle gravity; no 1PN (see ``pn_eih_accel`` for massive-body
relativistic corrections on CPU).
"""

from __future__ import annotations

from pathlib import Path
from typing import Literal

import numpy as np

IntegratorKind = Literal["leapfrog", "euler"]


def _cuda_source(fp32: bool) -> str:
    path = Path(__file__).resolve().parent / "cuda" / "test_particle_kernels.cu"
    src = path.read_text(encoding="utf-8")
    if fp32:
        return "#define USE_FP32\n" + src
    return src


def cuda_available() -> bool:
    try:
        import pycuda.driver as cuda

        cuda.init()
        return cuda.Device.count() >= 1
    except Exception:  # noqa: BLE001
        return False


def _require_pycuda() -> None:
    try:
        import pycuda.driver as cuda  # noqa: F401
    except ImportError as e:
        raise ImportError(
            "PyCUDA is required for gpu_test_particles. "
            "Install CUDA toolkit + driver, then: pip install -r solar_sim/requirements-gpu.txt"
        ) from e


class GpuParticleSimulator:
    """
    Keep particle ``r``, ``v`` on device; upload massive-body positions each step.

    Parameters
    ----------
    n_particles : int
    big_masses_kg : (N_big,) array
    dtype : np.float32 or np.float64
    integrator : 'leapfrog' | 'euler'
    block_size : int
        CUDA threads per block (default 256).
    """

    def __init__(
        self,
        n_particles: int,
        big_masses_kg: np.ndarray,
        *,
        dtype: type[np.floating] = np.float64,
        integrator: IntegratorKind = "leapfrog",
        block_size: int = 256,
        arch: str | None = None,
    ) -> None:
        _require_pycuda()
        import pycuda.autoinit  # noqa: F401 — creates default context
        from pycuda.compiler import SourceModule
        import pycuda.gpuarray as gpuarray

        self._gpuarray = gpuarray
        self.n_particles = int(n_particles)
        self.n_big = int(len(big_masses_kg))
        self.dtype = np.dtype(dtype)
        self.integrator: IntegratorKind = integrator
        self.block_size = int(block_size)
        if self.dtype == np.float32:
            fp32 = True
        elif self.dtype == np.float64:
            fp32 = False
        else:
            raise TypeError("dtype must be np.float32 or np.float64")

        opts: list[str] = []
        if arch is not None:
            opts.append(f"-arch={arch}")

        self._mod = SourceModule(
            _cuda_source(fp32),
            options=opts,
            include_dirs=[],
        )
        self._init_half = self._mod.get_function("init_half_step_kernel")
        self._leapfrog = self._mod.get_function("leapfrog_step_kernel")
        self._euler = self._mod.get_function("euler_step_kernel")

        self.d_r = gpuarray.zeros((self.n_particles, 3), dtype=self.dtype)
        self.d_v = gpuarray.zeros((self.n_particles, 3), dtype=self.dtype)
        self.d_big_r = gpuarray.zeros((self.n_big, 3), dtype=self.dtype)
        self.d_big_m = gpuarray.to_gpu(
            np.asarray(big_masses_kg, dtype=self.dtype).reshape(-1)
        )

        self._fp32 = fp32
        self._prepare_calls()

    def _prepare_calls(self) -> None:
        bs = self.block_size
        n = self.n_particles
        grid = (n + bs - 1) // bs
        self._block = (bs, 1, 1)
        # P P i P P i + (G, eps2, dt) as f or d
        fmt = "PPiPPi" + ("fff" if self._fp32 else "ddd")
        self._init_half.prepare(fmt, block=self._block)
        self._leapfrog.prepare(fmt, block=self._block)
        self._euler.prepare(fmt, block=self._block)
        self._call_grid = (grid, 1)

    def set_particles_host(self, r: np.ndarray, v: np.ndarray) -> None:
        """H2D copy of particle positions and velocities (host SI arrays)."""
        self.d_r.set(np.asarray(r, dtype=self.dtype).reshape(self.n_particles, 3))
        self.d_v.set(np.asarray(v, dtype=self.dtype).reshape(self.n_particles, 3))

    def set_big_positions_host(self, big_r: np.ndarray) -> None:
        """H2D copy of massive-body positions, shape (N_big, 3)."""
        self.d_big_r.set(np.asarray(big_r, dtype=self.dtype).reshape(self.n_big, 3))

    def init_leapfrog(self, G: float, dt: float, eps2: float = 0.0) -> None:
        """Set half-step velocities: v_half = v0 + 0.5*a(r0)*dt (call after set_particles_host)."""
        if self.integrator != "leapfrog":
            raise RuntimeError("init_leapfrog only for integrator='leapfrog'")
        n = np.int32(self.n_particles)
        nb = np.int32(self.n_big)
        self._init_half.prepared_call(
            self._call_grid,
            self.d_r,
            self.d_v,
            n,
            self.d_big_r,
            self.d_big_m,
            nb,
            self.dtype.type(G),
            self.dtype.type(eps2),
            self.dtype.type(dt),
        )

    def step(self, G: float, dt: float, eps2: float = 0.0) -> None:
        """Advance one step (leapfrog or euler). For leapfrog, call :meth:`init_leapfrog` once first."""
        n = np.int32(self.n_particles)
        nb = np.int32(self.n_big)
        if self.integrator == "leapfrog":
            fn = self._leapfrog
        else:
            fn = self._euler
        fn.prepared_call(
            self._call_grid,
            self.d_r,
            self.d_v,
            n,
            self.d_big_r,
            self.d_big_m,
            nb,
            self.dtype.type(G),
            self.dtype.type(eps2),
            self.dtype.type(dt),
        )

    def get_particles_host(self) -> tuple[np.ndarray, np.ndarray]:
        """D2H copy of (r, v). For leapfrog, v is half-step velocity."""
        return self.d_r.get(), self.d_v.get()


def numpy_accel(
    r: np.ndarray,
    big_r: np.ndarray,
    big_m: np.ndarray,
    G: float,
    eps2: float,
) -> np.ndarray:
    """Reference acceleration (N, 3), double precision on CPU."""
    n = r.shape[0]
    nb = big_r.shape[0]
    acc = np.zeros((n, 3), dtype=np.float64)
    for p in range(n):
        for b in range(nb):
            d = big_r[b] - r[p]
            r2 = np.dot(d, d) + eps2
            inv = 1.0 / np.sqrt(r2)
            inv3 = inv * inv * inv
            s = G * float(big_m[b]) * inv3
            acc[p] += s * d
    return acc


def numpy_leapfrog_step(
    r: np.ndarray,
    v_half: np.ndarray,
    big_r: np.ndarray,
    big_m: np.ndarray,
    G: float,
    eps2: float,
    dt: float,
) -> tuple[np.ndarray, np.ndarray]:
    """One leapfrog step (CPU reference)."""
    r = np.asarray(r, dtype=np.float64).copy()
    v_half = np.asarray(v_half, dtype=np.float64).copy()
    r_new = r + v_half * dt
    a = numpy_accel(r_new, big_r, big_m, G, eps2)
    v_new = v_half + a * dt
    return r_new, v_new


def numpy_init_half(
    r: np.ndarray,
    v0: np.ndarray,
    big_r: np.ndarray,
    big_m: np.ndarray,
    G: float,
    eps2: float,
    dt: float,
) -> np.ndarray:
    a0 = numpy_accel(r, big_r, big_m, G, eps2)
    return v0 + 0.5 * dt * a0
