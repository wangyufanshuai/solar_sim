/*
 * Massless test particles in Newtonian gravity from N_big massive bodies.
 * Units: SI (m, m/s, kg), G in m^3 kg^-1 s^-2.
 *
 * Leapfrog (velocity at half steps): r_{n+1} = r_n + v_{n+1/2}*dt;
 *   v_{n+3/2} = v_{n+1/2} + a(r_{n+1})*dt
 * Init: v_{1/2} = v_0 + 0.5*a(r_0)*dt  (kernel init_half_step)
 */

#ifdef USE_FP32
typedef float real;
#else
typedef double real;
#endif

__device__ void accel_from_big(
    real rx, real ry, real rz,
    const real* __restrict__ big_r,
    const real* __restrict__ big_m,
    int n_big,
    real G,
    real eps2,
    real* ax, real* ay, real* az)
{
    *ax = 0;
    *ay = 0;
    *az = 0;
    for (int b = 0; b < n_big; ++b) {
        real dx = big_r[b * 3 + 0] - rx;
        real dy = big_r[b * 3 + 1] - ry;
        real dz = big_r[b * 3 + 2] - rz;
        real r2 = dx * dx + dy * dy + dz * dz + eps2;
#ifdef USE_FP32
        real invr = rsqrtf(r2);
#else
        real invr = (real)(1.0 / sqrt((double)r2));
#endif
        real invr3 = invr * invr * invr;
        real s = G * big_m[b] * invr3;
        *ax += s * dx;
        *ay += s * dy;
        *az += s * dz;
    }
}

__global__ void init_half_step_kernel(
    real* __restrict__ r,
    real* __restrict__ v_half,
    int n_particles,
    const real* __restrict__ big_r,
    const real* __restrict__ big_m,
    int n_big,
    real G,
    real eps2,
    real dt)
{
    int p = blockIdx.x * blockDim.x + threadIdx.x;
    if (p >= n_particles)
        return;
    real rx = r[p * 3 + 0];
    real ry = r[p * 3 + 1];
    real rz = r[p * 3 + 2];
    real ax, ay, az;
    accel_from_big(rx, ry, rz, big_r, big_m, n_big, G, eps2, &ax, &ay, &az);
    v_half[p * 3 + 0] = v_half[p * 3 + 0] + (real)0.5 * ax * dt;
    v_half[p * 3 + 1] = v_half[p * 3 + 1] + (real)0.5 * ay * dt;
    v_half[p * 3 + 2] = v_half[p * 3 + 2] + (real)0.5 * az * dt;
}

/*
 * v_half holds v_{n+1/2}; r is r_n. After kernel: r <- r_{n+1}, v_half <- v_{n+3/2}
 */
__global__ void leapfrog_step_kernel(
    real* __restrict__ r,
    real* __restrict__ v_half,
    int n_particles,
    const real* __restrict__ big_r,
    const real* __restrict__ big_m,
    int n_big,
    real G,
    real eps2,
    real dt)
{
    int p = blockIdx.x * blockDim.x + threadIdx.x;
    if (p >= n_particles)
        return;

    real rx = r[p * 3 + 0];
    real ry = r[p * 3 + 1];
    real rz = r[p * 3 + 2];
    real vxh = v_half[p * 3 + 0];
    real vyh = v_half[p * 3 + 1];
    real vzh = v_half[p * 3 + 2];

    real rnx = rx + vxh * dt;
    real rny = ry + vyh * dt;
    real rnz = rz + vzh * dt;

    real ax, ay, az;
    accel_from_big(rnx, rny, rnz, big_r, big_m, n_big, G, eps2, &ax, &ay, &az);

    v_half[p * 3 + 0] = vxh + ax * dt;
    v_half[p * 3 + 1] = vyh + ay * dt;
    v_half[p * 3 + 2] = vzh + az * dt;

    r[p * 3 + 0] = rnx;
    r[p * 3 + 1] = rny;
    r[p * 3 + 2] = rnz;
}

/* Explicit Euler: v += a(r)*dt; r += v*dt (uses v at same time as r, first-order) */
__global__ void euler_step_kernel(
    real* __restrict__ r,
    real* __restrict__ v,
    int n_particles,
    const real* __restrict__ big_r,
    const real* __restrict__ big_m,
    int n_big,
    real G,
    real eps2,
    real dt)
{
    int p = blockIdx.x * blockDim.x + threadIdx.x;
    if (p >= n_particles)
        return;
    real rx = r[p * 3 + 0];
    real ry = r[p * 3 + 1];
    real rz = r[p * 3 + 2];
    real ax, ay, az;
    accel_from_big(rx, ry, rz, big_r, big_m, n_big, G, eps2, &ax, &ay, &az);
    real vx = v[p * 3 + 0] + ax * dt;
    real vy = v[p * 3 + 1] + ay * dt;
    real vz = v[p * 3 + 2] + az * dt;
    v[p * 3 + 0] = vx;
    v[p * 3 + 1] = vy;
    v[p * 3 + 2] = vz;
    r[p * 3 + 0] = rx + vx * dt;
    r[p * 3 + 1] = ry + vy * dt;
    r[p * 3 + 2] = rz + vz * dt;
}
