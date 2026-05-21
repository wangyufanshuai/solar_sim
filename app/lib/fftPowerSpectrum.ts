/**
 * Radix-2 Cooley–Tukey FFT (in-place), complex input.
 * `real`/`imag` length must be power of 2.
 */
export function fftComplexInPlace(real: Float64Array, imag: Float64Array): void {
  const n = real.length;
  if (imag.length !== n || (n & (n - 1)) !== 0) {
    throw new Error("fft: length must be power of 2");
  }

  let j = 0;
  for (let i = 0; i < n - 1; i++) {
    if (i < j) {
      let t = real[i]!;
      real[i] = real[j]!;
      real[j] = t;
      t = imag[i]!;
      imag[i] = imag[j]!;
      imag[j] = t;
    }
    let k = n >> 1;
    while (k <= j) {
      j -= k;
      k >>= 1;
    }
    j += k;
  }

  for (let size = 2; size <= n; size <<= 1) {
    const half = size >> 1;
    const ang = (-2 * Math.PI) / size;
    for (let i = 0; i < n; i += size) {
      for (let k2 = 0; k2 < half; k2++) {
        const theta = ang * k2;
        const wr = Math.cos(theta);
        const wi = Math.sin(theta);
        const i0 = i + k2;
        const i1 = i0 + half;
        const tr = wr * real[i1]! - wi * imag[i1]!;
        const ti = wr * imag[i1]! + wi * real[i1]!;
        real[i1] = real[i0]! - tr;
        imag[i1] = imag[i0]! - ti;
        real[i0] = real[i0]! + tr;
        imag[i0] = imag[i0]! + ti;
      }
    }
  }
}

function nextPow2(n: number): number {
  let p = 1;
  while (p < n) p <<= 1;
  return p;
}

function hannWindow(n: number, i: number): number {
  return 0.5 * (1 - Math.cos((2 * Math.PI * i) / Math.max(n - 1, 1)));
}

export type PowerSpectrumCyclesPerDay = {
  /** cycles/day */
  freqCpd: Float64Array;
  /** Normalized power (arbitrary scale) */
  power: Float64Array;
  /** Mean sample spacing (sim days) used */
  deltaSimDays: number;
  nPadded: number;
};

/**
 * One-sided power spectrum for a real time series sampled at ~uniform `deltaSimDays`.
 */
export function powerSpectrumCyclesPerDay(
  samples: number[],
  deltaSimDays: number
): PowerSpectrumCyclesPerDay | null {
  const n0 = samples.length;
  if (n0 < 8 || deltaSimDays <= 0) return null;

  const n = nextPow2(n0);
  const re = new Float64Array(n);
  const im = new Float64Array(n);
  for (let i = 0; i < n0; i++) {
    re[i] = samples[i]! * hannWindow(n0, i);
  }

  fftComplexInPlace(re, im);

  const half = n >> 1;
  const freq = new Float64Array(half + 1);
  const power = new Float64Array(half + 1);
  const scale = 1 / (n * n);
  for (let k = 0; k <= half; k++) {
    freq[k] = k / (n * deltaSimDays);
    const a = re[k]!;
    const b = im[k]!;
    power[k] = (a * a + b * b) * scale;
  }
  return { freqCpd: freq, power, deltaSimDays, nPadded: n };
}
