// NR-K2b deterministic C++17/OpenMP shadow runner.
//
// This executable implements the shared 25-slot state layout, an audited
// vacuum BSSNOK 1-D Cartesian reduction with spatial derivatives, deterministic
// OpenMP RK4 stepping, and a versioned checkpoint/restart envelope.  It is not
// yet the full 3-D CCZ4 RHS, AMR, horizon finder, or waveform extractor.  The
// promotion field remains blocked until those later gates are independently
// verified.

#include <array>
#include <algorithm>
#include <cmath>
#include <cstdint>
#include <cstring>
#include <fstream>
#include <cstdlib>
#include <iomanip>
#include <iostream>
#include <limits>
#include <sstream>
#include <stdexcept>
#include <string>
#include <vector>

#ifdef NR_K2_HAS_OPENMP
#include <omp.h>
#endif

namespace {

constexpr std::uint64_t kCheckpointVersion = 1;
constexpr char kCheckpointMagic[8] = {'N', 'R', 'K', '2', 'C', 'P', '0', '1'};
constexpr std::size_t kVariableCount = 25;
static_assert(sizeof(double) == 8, "NR-K2 checkpoint requires IEEE-754 binary64");

enum Variable : std::size_t {
  Chi = 0,
  H11,
  H12,
  H13,
  H22,
  H23,
  H33,
  K,
  A11,
  A12,
  A13,
  A22,
  A23,
  A33,
  Theta,
  Gamma1,
  Gamma2,
  Gamma3,
  Lapse,
  Shift1,
  Shift2,
  Shift3,
  B1,
  B2,
  B3,
};

const std::array<const char *, kVariableCount> kVariableNames = {
    "chi",   "h11",  "h12",  "h13",  "h22",  "h23",  "h33",  "K",
    "A11",   "A12",  "A13",  "A22",  "A23",  "A33",  "Theta", "Gamma1",
    "Gamma2", "Gamma3", "lapse", "shift1", "shift2", "shift3", "B1",
    "B2",    "B3"};

struct Options {
  std::size_t points = 32;
  std::size_t steps = 1;
  std::size_t threads = 1;
  double x_min = 0.0;
  double x_max = 1.0;
  double dt = 1.0e-3;
  double initial_trace_k = 0.0;
  std::string scenario = "minkowski";
  std::string boundary = "periodic";
  std::string manifest_path;
  std::string checkpoint_path;
  std::string restart_path;
};

struct State {
  std::size_t points = 0;
  double x_min = 0.0;
  double x_max = 1.0;
  double dt = 0.0;
  double time = 0.0;
  std::uint64_t step = 0;
  std::uint64_t scenario_code = 0;
  std::array<std::vector<double>, kVariableCount> q{};

  explicit State(std::size_t n = 0) : points(n) {
    for (auto &component : q) component.assign(points, 0.0);
  }
};

struct Diagnostics {
  double hamiltonian_l_inf = 0.0;
  double hamiltonian_l2 = 0.0;
  double momentum_l_inf = 0.0;
  double momentum_l2 = 0.0;
  double det_h_l_inf = 0.0;
  double trace_a_l_inf = 0.0;
  double conformal_gamma_l_inf = 0.0;
  double theta_l_inf = 0.0;
};

struct RHS {
  std::array<std::vector<double>, kVariableCount> q{};

  explicit RHS(std::size_t n = 0) {
    for (auto &component : q) component.assign(n, 0.0);
  }
};

[[noreturn]] void fail(const std::string &message) {
  throw std::runtime_error(message);
}

std::uint64_t scenario_code_from_name(const std::string &scenario) {
  if (scenario == "minkowski") return 0;
  if (scenario == "homogeneous-trace-k") return 1;
  if (scenario == "bssn-wave") return 2;
  if (scenario == "ccz4-wave") return 3;
  fail("unsupported scenario: " + scenario);
}

std::size_t parse_size(const std::string &value, const char *name) {
  std::size_t consumed = 0;
  const auto result = std::stoull(value, &consumed);
  if (consumed != value.size() || result == 0) fail(std::string(name) + " must be positive");
  return static_cast<std::size_t>(result);
}

double parse_double(const std::string &value, const char *name) {
  std::size_t consumed = 0;
  const auto result = std::stod(value, &consumed);
  if (consumed != value.size() || !std::isfinite(result)) fail(std::string(name) + " must be finite");
  return result;
}

std::string next_value(int argc, char **argv, int &index, const char *name) {
  if (index + 1 >= argc) fail(std::string("missing value for ") + name);
  return argv[++index];
}

Options parse_options(int argc, char **argv) {
  Options options;
  for (int i = 1; i < argc; ++i) {
    const std::string key = argv[i];
    if (key == "--points") options.points = parse_size(next_value(argc, argv, i, "--points"), "--points");
    else if (key == "--steps") options.steps = parse_size(next_value(argc, argv, i, "--steps"), "--steps");
    else if (key == "--threads") options.threads = parse_size(next_value(argc, argv, i, "--threads"), "--threads");
    else if (key == "--x-min") options.x_min = parse_double(next_value(argc, argv, i, "--x-min"), "--x-min");
    else if (key == "--x-max") options.x_max = parse_double(next_value(argc, argv, i, "--x-max"), "--x-max");
    else if (key == "--dt") options.dt = parse_double(next_value(argc, argv, i, "--dt"), "--dt");
    else if (key == "--initial-trace-k") options.initial_trace_k = parse_double(next_value(argc, argv, i, "--initial-trace-k"), "--initial-trace-k");
    else if (key == "--scenario") options.scenario = next_value(argc, argv, i, "--scenario");
    else if (key == "--boundary") options.boundary = next_value(argc, argv, i, "--boundary");
    else if (key == "--manifest") options.manifest_path = next_value(argc, argv, i, "--manifest");
    else if (key == "--checkpoint") options.checkpoint_path = next_value(argc, argv, i, "--checkpoint");
    else if (key == "--restart") options.restart_path = next_value(argc, argv, i, "--restart");
    else if (key == "--help" || key == "-h") {
      std::cout << "nr-k2-shadow --scenario minkowski|homogeneous-trace-k|bssn-wave|ccz4-wave --steps N --manifest FILE\n";
      std::exit(0);
    } else {
      fail("unknown option: " + key);
    }
  }
  if (options.points < 5) fail("--points must be at least 5");
  if (!(options.x_max > options.x_min)) fail("--x-max must be greater than --x-min");
  if (!(options.dt > 0.0)) fail("--dt must be positive");
  if (options.boundary != "periodic") fail("NR-K2b currently supports only periodic boundaries");
  if (options.scenario != "minkowski" && options.scenario != "homogeneous-trace-k" &&
      options.scenario != "bssn-wave" && options.scenario != "ccz4-wave")
    fail("unsupported scenario: " + options.scenario);
  if (options.manifest_path.empty()) fail("--manifest is required");
  return options;
}

void set_threads(std::size_t threads) {
#ifdef NR_K2_HAS_OPENMP
  omp_set_dynamic(0);
  omp_set_num_threads(static_cast<int>(threads));
#else
  if (threads != 1) fail("this binary has no OpenMP; use --threads 1");
#endif
}

void require_little_endian() {
  const std::uint16_t probe = 0x0102;
  const auto *bytes = reinterpret_cast<const unsigned char *>(&probe);
  if (bytes[0] != 0x02 || bytes[1] != 0x01)
    fail("NR-K2 checkpoint format currently requires little-endian storage");
}

void initialize(State &state, const Options &options) {
  state = State(options.points);
  state.x_min = options.x_min;
  state.x_max = options.x_max;
  state.dt = options.dt;
  state.scenario_code = scenario_code_from_name(options.scenario);
  const double length = state.x_max - state.x_min;
  for (std::size_t i = 0; i < state.points; ++i) {
    const double x = state.x_min + length * static_cast<double>(i) /
                     static_cast<double>(state.points);
    state.q[Chi][i] = 1.0;
    state.q[H11][i] = 1.0;
    state.q[H22][i] = 1.0;
    state.q[H33][i] = 1.0;
    state.q[Lapse][i] = 1.0;
    if (state.scenario_code == 1) state.q[K][i] = options.initial_trace_k;
    if (state.scenario_code == 2 || state.scenario_code == 3) {
      const double phase = 2.0 * std::acos(-1.0) * (x - state.x_min) / length;
      const double sine = std::sin(phase);
      const double cosine = std::cos(phase);
      // A small smooth, symmetric perturbation.  The same expressions are
      // used by compare-nr-k1-k2-bssn-wave.py to make the cross-language gate
      // independent of a serialized initial-condition file.
      state.q[Chi][i] = 1.0 + 1.0e-3 * sine;
      state.q[H11][i] = 1.0 + 1.0e-3 * cosine;
      state.q[H22][i] = 1.0 - 5.0e-4 * cosine;
      state.q[H33][i] = 1.0 - 5.0e-4 * cosine;
      state.q[H12][i] = 2.0e-4 * sine;
      state.q[H13][i] = 0.0;
      state.q[H23][i] = 0.0;
      state.q[K][i] = 2.0e-4 * sine;
      state.q[A11][i] = 2.0e-4 * sine;
      state.q[A22][i] = -1.0e-4 * sine;
      state.q[A33][i] = -1.0e-4 * sine;
      state.q[A12][i] = 1.0e-4 * cosine;
      state.q[Lapse][i] = 1.0 + 5.0e-4 * cosine;
      state.q[Shift1][i] = 1.0e-4 * sine;
      state.q[Shift2][i] = 5.0e-5 * cosine;
      state.q[B1][i] = 2.0e-5 * cosine;
      if (state.scenario_code == 3) {
        state.q[Theta][i] = 1.0e-5 * cosine;
        state.q[Gamma1][i] = 2.0e-5 * sine;
        state.q[Gamma2][i] = -1.0e-5 * cosine;
        state.q[Gamma3][i] = 0.5e-5 * sine;
      }
    }
  }
}

using Mat3 = std::array<double, 9>;
using Christoffel = std::array<double, 27>;

std::size_t h_index(int i, int j) {
  if (i > j) std::swap(i, j);
  if (i == 0 && j == 0) return H11;
  if (i == 0 && j == 1) return H12;
  if (i == 0 && j == 2) return H13;
  if (i == 1 && j == 1) return H22;
  if (i == 1 && j == 2) return H23;
  return H33;
}

std::size_t a_index(int i, int j) {
  if (i > j) std::swap(i, j);
  if (i == 0 && j == 0) return A11;
  if (i == 0 && j == 1) return A12;
  if (i == 0 && j == 2) return A13;
  if (i == 1 && j == 1) return A22;
  if (i == 1 && j == 2) return A23;
  return A33;
}

double d1_component(const State &state, std::size_t variable, std::size_t index) {
  const std::size_t left = index == 0 ? state.points - 1 : index - 1;
  const std::size_t right = index + 1 == state.points ? 0 : index + 1;
  const double dx = (state.x_max - state.x_min) / static_cast<double>(state.points);
  return (state.q[variable][right] - state.q[variable][left]) / (2.0 * dx);
}

double d2_component(const State &state, std::size_t variable, std::size_t index) {
  const std::size_t left = index == 0 ? state.points - 1 : index - 1;
  const std::size_t right = index + 1 == state.points ? 0 : index + 1;
  const double dx = (state.x_max - state.x_min) / static_cast<double>(state.points);
  return (state.q[variable][right] - 2.0 * state.q[variable][index] +
          state.q[variable][left]) / (dx * dx);
}

double h_value(const State &state, std::size_t index, int i, int j) {
  return state.q[h_index(i, j)][index];
}

double a_value(const State &state, std::size_t index, int i, int j) {
  return state.q[a_index(i, j)][index];
}

double metric_value(const State &state, std::size_t index, int i, int j, bool physical) {
  const double conformal = h_value(state, index, i, j);
  return physical ? conformal / state.q[Chi][index] : conformal;
}

double d1_metric_value(const State &state, std::size_t index, int i, int j, bool physical) {
  const std::size_t left = index == 0 ? state.points - 1 : index - 1;
  const std::size_t right = index + 1 == state.points ? 0 : index + 1;
  const double dx = (state.x_max - state.x_min) / static_cast<double>(state.points);
  return (metric_value(state, right, i, j, physical) -
          metric_value(state, left, i, j, physical)) / (2.0 * dx);
}

double &mat_value(Mat3 &matrix, int i, int j) { return matrix[static_cast<std::size_t>(3 * i + j)]; }
double mat_value(const Mat3 &matrix, int i, int j) { return matrix[static_cast<std::size_t>(3 * i + j)]; }

Mat3 h_matrix_at(const State &state, std::size_t index) {
  Mat3 result{};
  for (int row = 0; row < 3; ++row)
    for (int col = 0; col < 3; ++col)
      mat_value(result, row, col) = h_value(state, index, row, col);
  return result;
}

Mat3 a_matrix_at(const State &state, std::size_t index) {
  Mat3 result{};
  for (int row = 0; row < 3; ++row)
    for (int col = 0; col < 3; ++col)
      mat_value(result, row, col) = a_value(state, index, row, col);
  return result;
}

double determinant_metric(const Mat3 &matrix) {
  const double a = mat_value(matrix, 0, 0);
  const double b = mat_value(matrix, 0, 1);
  const double c = mat_value(matrix, 0, 2);
  const double d = mat_value(matrix, 1, 0);
  const double e = mat_value(matrix, 1, 1);
  const double f = mat_value(matrix, 1, 2);
  const double g = mat_value(matrix, 2, 0);
  const double h = mat_value(matrix, 2, 1);
  const double k = mat_value(matrix, 2, 2);
  return a * (e * k - f * h) - b * (d * k - f * g) + c * (d * h - e * g);
}

double &christoffel_value(Christoffel &tensor, int k, int i, int j) {
  return tensor[static_cast<std::size_t>(9 * k + 3 * i + j)];
}
double christoffel_value(const Christoffel &tensor, int k, int i, int j) {
  return tensor[static_cast<std::size_t>(9 * k + 3 * i + j)];
}

Mat3 inverse_metric(const Mat3 &matrix) {
  const double a = mat_value(matrix, 0, 0);
  const double b = mat_value(matrix, 0, 1);
  const double c = mat_value(matrix, 0, 2);
  const double d = mat_value(matrix, 1, 0);
  const double e = mat_value(matrix, 1, 1);
  const double f = mat_value(matrix, 1, 2);
  const double g = mat_value(matrix, 2, 0);
  const double h = mat_value(matrix, 2, 1);
  const double k = mat_value(matrix, 2, 2);
  const double determinant = determinant_metric(matrix);
  if (!std::isfinite(determinant) || std::abs(determinant) < 1.0e-14)
    fail("singular or non-finite metric in NR-K2 RHS");
  Mat3 result{};
  mat_value(result, 0, 0) = (e * k - f * h) / determinant;
  mat_value(result, 0, 1) = (c * h - b * k) / determinant;
  mat_value(result, 0, 2) = (b * f - c * e) / determinant;
  mat_value(result, 1, 0) = (f * g - d * k) / determinant;
  mat_value(result, 1, 1) = (a * k - c * g) / determinant;
  mat_value(result, 1, 2) = (c * d - a * f) / determinant;
  mat_value(result, 2, 0) = (d * h - e * g) / determinant;
  mat_value(result, 2, 1) = (b * g - a * h) / determinant;
  mat_value(result, 2, 2) = (a * e - b * d) / determinant;
  return result;
}

Christoffel christoffel_at(const State &state, std::size_t index,
                           const Mat3 &inverse, bool physical) {
  Christoffel result{};
  for (int k = 0; k < 3; ++k) {
    for (int i = 0; i < 3; ++i) {
      for (int j = 0; j < 3; ++j) {
        double value = 0.0;
        for (int ell = 0; ell < 3; ++ell) {
          const double di = i == 0 ? d1_metric_value(state, index, ell, j, physical) : 0.0;
          const double dj = j == 0 ? d1_metric_value(state, index, ell, i, physical) : 0.0;
          const double dell = ell == 0 ? d1_metric_value(state, index, i, j, physical) : 0.0;
          value += 0.5 * mat_value(inverse, k, ell) * (di + dj - dell);
        }
        christoffel_value(result, k, i, j) = value;
      }
    }
  }
  return result;
}

RHS rhs(const State &state) {
  RHS result(state.points);
#pragma omp parallel for schedule(static)
  for (std::int64_t i = 0; i < static_cast<std::int64_t>(state.points); ++i) {
    const std::size_t p = static_cast<std::size_t>(i);
    const bool ccz4_mode = state.scenario_code == 3;
    const double chi = state.q[Chi][p];
    const double lapse = state.q[Lapse][p];
    const double trace_k = state.q[K][p];
    const double theta = state.q[Theta][p];
    const double beta_x = state.q[Shift1][p];
    const double d_chi = d1_component(state, Chi, p);
    const double d_lapse = d1_component(state, Lapse, p);
    const double d_trace_k = d1_component(state, K, p);
    const double d_theta = d1_component(state, Theta, p);
    const double d2_chi = d2_component(state, Chi, p);
    const double d2_lapse = d2_component(state, Lapse, p);
    const double div_shift = d1_component(state, Shift1, p);
    const double d_phi = -0.25 * d_chi / chi;

    Mat3 h{};
    Mat3 a{};
    for (int row = 0; row < 3; ++row) {
      for (int col = 0; col < 3; ++col) {
        mat_value(h, row, col) = h_value(state, p, row, col);
        mat_value(a, row, col) = a_value(state, p, row, col);
      }
    }
    const Mat3 h_inverse = inverse_metric(h);
    Mat3 physical_inverse{};
    for (int row = 0; row < 3; ++row) {
      for (int col = 0; col < 3; ++col) {
        mat_value(physical_inverse, row, col) = chi * mat_value(h_inverse, row, col);
      }
    }
    const Christoffel chris = christoffel_at(state, p, h_inverse, false);
    const Christoffel physical_chris = christoffel_at(state, p, physical_inverse, true);

    // Keep the exact index arrangement used by the Python reference:
    // chris_lower[a,b,c] = h[a,l] Gamma^l_bc and
    // chris_llu[l,j,k] = h^lm chris_lower[j,k,m].
    std::array<double, 27> lower{};
    std::array<double, 27> raised{};
    auto lower_at = [&](int aa, int bb, int cc) -> double & {
      return lower[static_cast<std::size_t>(9 * aa + 3 * bb + cc)];
    };
    auto raised_at = [&](int ll, int jj, int kk) -> double & {
      return raised[static_cast<std::size_t>(9 * ll + 3 * jj + kk)];
    };
    for (int aa = 0; aa < 3; ++aa) {
      for (int bb = 0; bb < 3; ++bb) {
        for (int cc = 0; cc < 3; ++cc) {
          for (int ell = 0; ell < 3; ++ell)
            lower_at(aa, bb, cc) += mat_value(h, aa, ell) * christoffel_value(chris, ell, bb, cc);
        }
      }
    }
    for (int ll = 0; ll < 3; ++ll) {
      for (int jj = 0; jj < 3; ++jj) {
        for (int kk = 0; kk < 3; ++kk) {
          for (int mm = 0; mm < 3; ++mm)
            raised_at(ll, jj, kk) += mat_value(h_inverse, ll, mm) * lower_at(jj, kk, mm);
        }
      }
    }
    Mat3 conformal_ricci{};
    for (int row = 0; row < 3; ++row) {
      for (int col = 0; col < 3; ++col) {
        double value = 0.0;
        for (int k = 0; k < 3; ++k) {
          const double derivative_gamma_col = col == 0 ? d1_component(state, Gamma1 + k, p) : 0.0;
          const double derivative_gamma_row = row == 0 ? d1_component(state, Gamma1 + k, p) : 0.0;
          const double derivative_h = k == 0 ? d1_component(state, h_index(row, col), p) : 0.0;
          value += 0.5 * (mat_value(h, k, row) * derivative_gamma_col +
                           mat_value(h, k, col) * derivative_gamma_row +
                           state.q[Gamma1 + k][p] * derivative_h);
          for (int ell = 0; ell < 3; ++ell) {
            const double second_h = (k == 0 && ell == 0) ?
                d2_component(state, h_index(row, col), p) : 0.0;
            value += -0.5 * mat_value(h_inverse, k, ell) * second_h;
            value += christoffel_value(chris, k, ell, row) * raised_at(ell, col, k);
            value += christoffel_value(chris, k, ell, col) * raised_at(ell, row, k);
            value += christoffel_value(chris, k, row, ell) * raised_at(ell, k, col);
          }
        }
        mat_value(conformal_ricci, row, col) = value;
      }
    }

    Mat3 hessian_chi{};
    Mat3 hessian_lapse{};
    for (int row = 0; row < 3; ++row) {
      for (int col = 0; col < 3; ++col) {
        mat_value(hessian_chi, row, col) = (row == 0 && col == 0 ? d2_chi : 0.0) -
            christoffel_value(chris, 0, row, col) * d_chi;
        mat_value(hessian_lapse, row, col) = (row == 0 && col == 0 ? d2_lapse : 0.0) -
            christoffel_value(physical_chris, 0, row, col) * d_lapse;
      }
    }
    double box_chi = 0.0;
    double lapse_laplacian = 0.0;
    double grad_sq = mat_value(h_inverse, 0, 0) * d_chi * d_chi;
    for (int row = 0; row < 3; ++row) {
      for (int col = 0; col < 3; ++col) {
        box_chi += mat_value(h_inverse, row, col) * mat_value(hessian_chi, row, col);
        lapse_laplacian += mat_value(physical_inverse, row, col) * mat_value(hessian_lapse, row, col);
      }
    }
    Mat3 physical_ricci = conformal_ricci;
    for (int row = 0; row < 3; ++row) {
      for (int col = 0; col < 3; ++col) {
        const double grad_row = row == 0 ? d_chi : 0.0;
        const double grad_col = col == 0 ? d_chi : 0.0;
        const double correction = (mat_value(hessian_chi, row, col) +
            mat_value(h, row, col) * box_chi) / (2.0 * chi) -
            (grad_row * grad_col + 3.0 * mat_value(h, row, col) * grad_sq) /
            (4.0 * chi * chi);
        mat_value(physical_ricci, row, col) += correction;
      }
    }

    std::array<double, 3> contracted_chris{};
    for (int component = 0; component < 3; ++component)
      for (int row = 0; row < 3; ++row)
        for (int col = 0; col < 3; ++col)
          contracted_chris[component] += mat_value(h_inverse, row, col) *
                                         christoffel_value(chris, component, row, col);
    std::array<double, 3> z_over_chi{};
    std::array<double, 3> z{};
    for (int component = 0; component < 3; ++component) {
      z_over_chi[component] = 0.5 * (state.q[Gamma1 + component][p] - contracted_chris[component]);
      z[component] = chi * z_over_chi[component];
    }
    double ricci_scalar = 0.0;
    Mat3 ccz4_lapse_hessian{};
    if (ccz4_mode) {
      Mat3 ricci_chi{};
      Mat3 z_terms{};
      for (int row = 0; row < 3; ++row) {
        for (int col = 0; col < 3; ++col) {
          const double grad_row = row == 0 ? d_chi : 0.0;
          const double grad_col = col == 0 ? d_chi : 0.0;
          double value = 0.5 * (mat_value(hessian_chi, row, col) +
              mat_value(h, row, col) * box_chi -
              (grad_row * grad_col + 3.0 * mat_value(h, row, col) * grad_sq) /
              (2.0 * chi));
          for (int component = 0; component < 3; ++component) {
            value += z_over_chi[component] * (
                mat_value(h, row, component) * (col == 0 ? d_chi : 0.0) +
                mat_value(h, col, component) * (row == 0 ? d_chi : 0.0) -
                mat_value(h, row, col) * (component == 0 ? d_chi : 0.0));
          }
          mat_value(ricci_chi, row, col) = 0.5 * (mat_value(hessian_chi, row, col) +
              mat_value(h, row, col) * box_chi -
              (grad_row * grad_col + 3.0 * mat_value(h, row, col) * grad_sq) /
              (2.0 * chi));
          mat_value(z_terms, row, col) = value - mat_value(ricci_chi, row, col);
          mat_value(physical_ricci, row, col) = (
              mat_value(ricci_chi, row, col) + chi * mat_value(conformal_ricci, row, col) +
              mat_value(z_terms, row, col)) / chi;
        }
      }
      for (int row = 0; row < 3; ++row)
        for (int col = 0; col < 3; ++col)
          ricci_scalar += chi * mat_value(h_inverse, row, col) *
                          mat_value(physical_ricci, row, col);

      // Match Python's _physical_lapse_hessian construction rather than
      // silently substituting a different discrete conformal transform.
      const double grad_dot = mat_value(h_inverse, 0, 0) * d_lapse * d_chi;
      for (int row = 0; row < 3; ++row) {
        for (int col = 0; col < 3; ++col) {
          const double conformal_hessian = (row == 0 && col == 0 ? d2_lapse : 0.0) -
              christoffel_value(chris, 0, row, col) * d_lapse;
          const double grad_lapse_row = row == 0 ? d_lapse : 0.0;
          const double grad_lapse_col = col == 0 ? d_lapse : 0.0;
          const double grad_chi_row = row == 0 ? d_chi : 0.0;
          const double grad_chi_col = col == 0 ? d_chi : 0.0;
          mat_value(ccz4_lapse_hessian, row, col) = chi * conformal_hessian + 0.5 * (
              grad_lapse_row * grad_chi_col + grad_chi_row * grad_lapse_col -
              mat_value(h, row, col) * grad_dot);
        }
      }
    }

    Mat3 a_up_one{};
    Mat3 a_upup{};
    Mat3 a_square_lower{};
    for (int row = 0; row < 3; ++row) {
      for (int col = 0; col < 3; ++col) {
        for (int ell = 0; ell < 3; ++ell) {
          mat_value(a_up_one, row, col) += mat_value(h_inverse, row, ell) * mat_value(a, ell, col);
        }
      }
    }
    // Finish H^-1 A before using any of its entries in the next contractions.
    // Interleaving these loops read not-yet-computed entries for off-diagonal A.
    for (int row = 0; row < 3; ++row) {
      for (int col = 0; col < 3; ++col) {
        for (int ell = 0; ell < 3; ++ell) {
          mat_value(a_square_lower, row, col) += mat_value(a, row, ell) * mat_value(a_up_one, ell, col);
          mat_value(a_upup, row, col) += mat_value(a_up_one, row, ell) * mat_value(h_inverse, ell, col);
        }
      }
    }
    double a_squared = 0.0;
    for (int row = 0; row < 3; ++row)
      for (int col = 0; col < 3; ++col)
        a_squared += mat_value(a, row, col) * mat_value(a_upup, row, col);

    Mat3 rhs_h{};
    Mat3 rhs_a{};
    Mat3 source_a{};
    Mat3 lie_a_tensor{};
    double source_trace = 0.0;
    for (int row = 0; row < 3; ++row) {
      for (int col = 0; col < 3; ++col) {
        const double d_h = d1_component(state, h_index(row, col), p);
        double lie_h = 0.0;
        double lie_a = 0.0;
        for (int k = 0; k < 3; ++k) {
          const double d_beta_col = col == 0 ? d1_component(state, Shift1 + k, p) : 0.0;
          const double d_beta_row = row == 0 ? d1_component(state, Shift1 + k, p) : 0.0;
          lie_h += mat_value(h, k, row) * d_beta_col + mat_value(h, k, col) * d_beta_row;
          lie_a += mat_value(a, k, row) * d_beta_col + mat_value(a, k, col) * d_beta_row;
        }
        mat_value(lie_a_tensor, row, col) = lie_a;
        mat_value(rhs_h, row, col) = -2.0 * lapse * mat_value(a, row, col) +
            beta_x * d_h + lie_h - (2.0 / 3.0) * mat_value(h, row, col) * div_shift;
        if (ccz4_mode) {
          mat_value(source_a, row, col) = -mat_value(ccz4_lapse_hessian, row, col) +
              chi * lapse * mat_value(physical_ricci, row, col);
        } else {
          mat_value(source_a, row, col) = chi * (-mat_value(hessian_lapse, row, col) +
              lapse * mat_value(physical_ricci, row, col));
        }
      }
    }
    for (int row = 0; row < 3; ++row)
      for (int col = 0; col < 3; ++col)
        source_trace += mat_value(h_inverse, row, col) * mat_value(source_a, row, col);
    for (int row = 0; row < 3; ++row) {
      for (int col = 0; col < 3; ++col) {
        const double d_a = d1_component(state, a_index(row, col), p);
        mat_value(rhs_a, row, col) = mat_value(source_a, row, col) -
            mat_value(h, row, col) * source_trace / 3.0 + beta_x * d_a +
            mat_value(lie_a_tensor, row, col) -
            (2.0 / 3.0) * mat_value(a, row, col) * div_shift;
        if (ccz4_mode) {
          mat_value(rhs_a, row, col) += lapse * (trace_k - 2.0 * theta) *
              mat_value(a, row, col);
          for (int k = 0; k < 3; ++k)
            for (int ell = 0; ell < 3; ++ell)
              mat_value(rhs_a, row, col) -= 2.0 * lapse * mat_value(h_inverse, k, ell) *
                  mat_value(a, row, k) * mat_value(a, ell, col);
        } else {
          mat_value(rhs_a, row, col) += lapse * (trace_k * mat_value(a, row, col) -
              2.0 * mat_value(a_square_lower, row, col));
        }
      }
    }

    std::array<double, 3> connection_a{};
    for (int component = 0; component < 3; ++component)
      for (int row = 0; row < 3; ++row)
        for (int col = 0; col < 3; ++col)
          connection_a[component] += christoffel_value(chris, component, row, col) *
                                     mat_value(a_upup, row, col);
    std::array<double, 3> rhs_gamma{};
    std::array<double, 3> d_gamma{};
    std::array<double, 3> d2_shift{};
    std::array<double, 3> d_shift{};
    std::array<double, 3> d_b{};
    for (int component = 0; component < 3; ++component) {
      d_gamma[component] = d1_component(state, Gamma1 + component, p);
      d_shift[component] = d1_component(state, Shift1 + component, p);
      d2_shift[component] = d2_component(state, Shift1 + component, p);
      d_b[component] = d1_component(state, B1 + component, p);
      if (!ccz4_mode) {
        rhs_gamma[component] = -2.0 * mat_value(a_upup, component, 0) * d_lapse +
            2.0 * lapse * (connection_a[component] -
                           (2.0 / 3.0) * mat_value(h_inverse, component, 0) * d_trace_k +
                           6.0 * mat_value(a_upup, component, 0) * d_phi) +
            beta_x * d_gamma[component] - state.q[Gamma1][p] * d_shift[component] +
            (2.0 / 3.0) * state.q[Gamma1 + component][p] * div_shift +
            mat_value(h_inverse, 0, 0) * d2_shift[component] +
            (1.0 / 3.0) * mat_value(h_inverse, component, 0) * d2_shift[0];
      } else {
        constexpr double kappa1 = 0.1;
        constexpr double kappa2 = 0.0;
        constexpr double kappa3 = 1.0;
        const double kappa1_lapse = kappa1; // covariant_z4=True in Python reference
        rhs_gamma[component] = (2.0 / 3.0) * (
            div_shift * (contracted_chris[component] + 2.0 * kappa3 * z_over_chi[component]) -
            2.0 * lapse * trace_k * z_over_chi[component]) -
            2.0 * kappa1_lapse * z_over_chi[component];
        for (int j = 0; j < 3; ++j) {
          const double d_theta_j = j == 0 ? d_theta : 0.0;
          const double d_k_j = j == 0 ? d_trace_k : 0.0;
          const double d_lapse_j = j == 0 ? d_lapse : 0.0;
          const double d_chi_j = j == 0 ? d_chi : 0.0;
          rhs_gamma[component] +=
              2.0 * mat_value(h_inverse, component, j) * (lapse * d_theta_j - theta * d_lapse_j) -
              2.0 * mat_value(a_upup, component, j) * d_lapse_j -
              lapse * ((4.0 / 3.0) * mat_value(h_inverse, component, j) * d_k_j +
                       3.0 * mat_value(a_upup, component, j) * d_chi_j / chi) -
              (contracted_chris[j] + 2.0 * kappa3 * z_over_chi[j]) *
              (j == 0 ? d_shift[component] : 0.0);
          for (int k = 0; k < 3; ++k) {
            rhs_gamma[component] += 2.0 * lapse * christoffel_value(chris, component, j, k) *
                                    mat_value(a_upup, j, k);
            if (j == 0 && k == 0) {
              rhs_gamma[component] += mat_value(h_inverse, j, k) * d2_shift[component] +
                  (1.0 / 3.0) * mat_value(h_inverse, component, j) * d2_shift[k];
            }
          }
        }
        rhs_gamma[component] += beta_x * d_gamma[component];
        (void)kappa2;
      }
    }

    result.q[Chi][p] = (2.0 / 3.0) * chi * (lapse * trace_k - div_shift) + beta_x * d_chi;
    if (!ccz4_mode) {
      result.q[K][p] = -lapse_laplacian + lapse * (a_squared + trace_k * trace_k / 3.0) +
                       beta_x * d_trace_k;
      result.q[Theta][p] = 0.0;
    } else {
      constexpr double kappa1 = 0.1;
      constexpr double kappa2 = 0.0;
      double trace_covd2_lapse = -1.5 * mat_value(h_inverse, 0, 0) * d_lapse * d_chi -
          chi * contracted_chris[0] * d_lapse;
      for (int row = 0; row < 3; ++row) {
        for (int col = 0; col < 3; ++col) {
          const double transformed = chi * (row == 0 && col == 0 ? d2_lapse : 0.0) +
              (row == 0 ? d_lapse : 0.0) * (col == 0 ? d_chi : 0.0);
          trace_covd2_lapse += mat_value(h_inverse, row, col) * transformed;
        }
      }
      const double kappa1_lapse = kappa1; // covariant_z4=True in Python reference
      result.q[K][p] = beta_x * d_trace_k - trace_covd2_lapse +
          lapse * (ricci_scalar + trace_k * (trace_k - 2.0 * theta)) -
          3.0 * kappa1_lapse * (1.0 + kappa2) * theta;
      result.q[Theta][p] = beta_x * d_theta + 0.5 * lapse * (
          ricci_scalar - a_squared + (2.0 / 3.0) * trace_k * trace_k -
          2.0 * theta * trace_k) -
          0.5 * theta * kappa1_lapse * (4.0 + 2.0 * kappa2) - z[0] * d_lapse;
    }
    result.q[Lapse][p] = -2.0 * lapse * (trace_k - 2.0 * theta) + beta_x * d_lapse;
    for (int row = 0; row < 3; ++row) {
      for (int col = row; col < 3; ++col) {
        result.q[h_index(row, col)][p] = mat_value(rhs_h, row, col);
        result.q[a_index(row, col)][p] = mat_value(rhs_a, row, col);
      }
    }
    for (int component = 0; component < 3; ++component) {
      result.q[Gamma1 + component][p] = rhs_gamma[component];
      result.q[Shift1 + component][p] = 0.75 * state.q[B1 + component][p] + beta_x * d_shift[component];
      result.q[B1 + component][p] = rhs_gamma[component] - state.q[B1 + component][p] +
                                     beta_x * (d_b[component] - d_gamma[component]);
    }
  }
  return result;
}

State add_scaled(const State &state, const RHS &derivative, double scale) {
  State result = state;
#pragma omp parallel for schedule(static)
  for (std::int64_t v = 0; v < static_cast<std::int64_t>(kVariableCount); ++v) {
    for (std::size_t i = 0; i < state.points; ++i)
      result.q[static_cast<std::size_t>(v)][i] += scale * derivative.q[static_cast<std::size_t>(v)][i];
  }
  return result;
}

void rk4_step(State &state) {
  const RHS k1 = rhs(state);
  const RHS k2 = rhs(add_scaled(state, k1, 0.5 * state.dt));
  const RHS k3 = rhs(add_scaled(state, k2, 0.5 * state.dt));
  const RHS k4 = rhs(add_scaled(state, k3, state.dt));
#pragma omp parallel for schedule(static)
  for (std::int64_t v = 0; v < static_cast<std::int64_t>(kVariableCount); ++v) {
    for (std::size_t i = 0; i < state.points; ++i) {
      const auto index = static_cast<std::size_t>(v);
      state.q[index][i] += (state.dt / 6.0) *
          (k1.q[index][i] + 2.0 * k2.q[index][i] + 2.0 * k3.q[index][i] + k4.q[index][i]);
    }
  }
  state.time += state.dt;
  ++state.step;
}

Diagnostics diagnostics(const State &state) {
  Diagnostics result;
  const std::size_t n = state.points;
  const double dx = (state.x_max - state.x_min) / static_cast<double>(n);
  std::vector<Mat3> h_all(n), h_inverse_all(n), physical_inverse_all(n);
  std::vector<Mat3> physical_k_all(n), mixed_k_all(n);
  std::vector<Christoffel> physical_chris_all(n);
  for (std::size_t index = 0; index < n; ++index) {
    h_all[index] = h_matrix_at(state, index);
    h_inverse_all[index] = inverse_metric(h_all[index]);
    for (int row = 0; row < 3; ++row) {
      for (int col = 0; col < 3; ++col) {
        mat_value(physical_inverse_all[index], row, col) =
            state.q[Chi][index] * mat_value(h_inverse_all[index], row, col);
      }
    }
    const Mat3 a = a_matrix_at(state, index);
    for (int row = 0; row < 3; ++row) {
      for (int col = 0; col < 3; ++col) {
        mat_value(physical_k_all[index], row, col) =
            (mat_value(a, row, col) + mat_value(h_all[index], row, col) *
             state.q[K][index] / 3.0) / state.q[Chi][index];
      }
    }
    for (int row = 0; row < 3; ++row) {
      for (int col = 0; col < 3; ++col) {
        for (int ell = 0; ell < 3; ++ell) {
          mat_value(mixed_k_all[index], row, col) +=
              mat_value(physical_inverse_all[index], row, ell) *
              mat_value(physical_k_all[index], ell, col);
        }
      }
    }
    physical_chris_all[index] = christoffel_at(
        state, index, physical_inverse_all[index], true);
  }

  double h_sum = 0.0;
  double momentum_sum = 0.0;
  // All norms are accumulated in this fixed serial order.  The update itself
  // is parallel, but a floating-point reduction would make manifests depend
  // on the requested thread count.
  for (std::size_t index = 0; index < n; ++index) {
    const std::size_t left = index == 0 ? n - 1 : index - 1;
    const std::size_t right = index + 1 == n ? 0 : index + 1;
    double scalar_curvature = 0.0;
    double k_squared = 0.0;
    for (int row = 0; row < 3; ++row) {
      for (int col = 0; col < 3; ++col) {
        double ricci = (
            christoffel_value(physical_chris_all[right], 0, row, col) -
            christoffel_value(physical_chris_all[left], 0, row, col)) / (2.0 * dx);
        double trace_left = 0.0;
        double trace_right = 0.0;
        for (int diagonal = 0; diagonal < 3; ++diagonal) {
          trace_left += christoffel_value(physical_chris_all[left], diagonal, row, diagonal);
          trace_right += christoffel_value(physical_chris_all[right], diagonal, row, diagonal);
        }
        if (col == 0) ricci -= (trace_right - trace_left) / (2.0 * dx);
        double product_one = 0.0;
        double product_two = 0.0;
        for (int k = 0; k < 3; ++k) {
          for (int ell = 0; ell < 3; ++ell) {
            product_one += christoffel_value(physical_chris_all[index], k, row, col) *
                           christoffel_value(physical_chris_all[index], ell, k, ell);
            product_two += christoffel_value(physical_chris_all[index], ell, row, k) *
                           christoffel_value(physical_chris_all[index], k, col, ell);
          }
        }
        ricci += product_one - product_two;
        scalar_curvature += mat_value(physical_inverse_all[index], row, col) * ricci;
        for (int k = 0; k < 3; ++k) {
          for (int ell = 0; ell < 3; ++ell) {
            k_squared += mat_value(physical_k_all[index], row, col) *
                         mat_value(physical_k_all[index], k, ell) *
                         mat_value(physical_inverse_all[index], row, k) *
                         mat_value(physical_inverse_all[index], col, ell);
          }
        }
      }
    }
    const double trace_k = state.q[K][index];
    const double hamiltonian = scalar_curvature + trace_k * trace_k - k_squared;
    h_sum += hamiltonian * hamiltonian;
    result.hamiltonian_l_inf = std::max(result.hamiltonian_l_inf, std::abs(hamiltonian));
    result.det_h_l_inf = std::max(
        result.det_h_l_inf, std::abs(determinant_metric(h_all[index]) - 1.0));

    double trace_a = 0.0;
    for (int row = 0; row < 3; ++row)
      for (int col = 0; col < 3; ++col)
        trace_a += mat_value(h_inverse_all[index], row, col) *
                   a_value(state, index, row, col);
    result.trace_a_l_inf = std::max(result.trace_a_l_inf, std::abs(trace_a));
    result.theta_l_inf = std::max(result.theta_l_inf, std::abs(state.q[Theta][index]));

    for (int component = 0; component < 3; ++component) {
      const double d_mixed = (
          mat_value(mixed_k_all[right], 0, component) -
          mat_value(mixed_k_all[left], 0, component)) / (2.0 * dx);
      double divergence = d_mixed;
      for (int j = 0; j < 3; ++j) {
        for (int ell = 0; ell < 3; ++ell) {
          divergence += christoffel_value(physical_chris_all[index], j, j, ell) *
                        mat_value(mixed_k_all[index], ell, component) -
                        christoffel_value(physical_chris_all[index], ell, j, component) *
                        mat_value(mixed_k_all[index], j, ell);
        }
      }
      if (component == 0) divergence -= (
          state.q[K][right] - state.q[K][left]) / (2.0 * dx);
      result.momentum_l_inf = std::max(result.momentum_l_inf, std::abs(divergence));
      momentum_sum += divergence * divergence;

      const double d_h_inverse = (
          mat_value(h_inverse_all[right], component, 0) -
          mat_value(h_inverse_all[left], component, 0)) / (2.0 * dx);
      const double gamma_constraint = state.q[Gamma1 + component][index] + d_h_inverse;
      result.conformal_gamma_l_inf = std::max(
          result.conformal_gamma_l_inf, std::abs(gamma_constraint));
    }
  }
  result.hamiltonian_l2 = std::sqrt(h_sum / static_cast<double>(n));
  result.momentum_l2 = std::sqrt(momentum_sum / static_cast<double>(3 * n));
  return result;
}

void write_bytes(std::ofstream &stream, const void *data, std::size_t size) {
  stream.write(static_cast<const char *>(data), static_cast<std::streamsize>(size));
  if (!stream) fail("failed while writing checkpoint");
}

template <typename T> void write_scalar(std::ofstream &stream, const T &value) {
  write_bytes(stream, &value, sizeof(T));
}

template <typename T> T read_scalar(std::ifstream &stream, const char *name) {
  T value{};
  stream.read(reinterpret_cast<char *>(&value), static_cast<std::streamsize>(sizeof(T)));
  if (!stream) fail(std::string("truncated checkpoint while reading ") + name);
  return value;
}

void ensure_parent(const std::string &path) {
  // The runner deliberately does not create or delete arbitrary directories.
  // The caller owns the output directory; this no-op keeps the binary
  // portable to the available MinGW 8.1 C++17 toolchain.
  (void)path;
}

void write_checkpoint(const State &state, const std::string &path) {
  ensure_parent(path);
  std::ofstream stream(path, std::ios::binary | std::ios::trunc);
  if (!stream) fail("cannot open checkpoint for writing: " + path);
  write_bytes(stream, kCheckpointMagic, sizeof(kCheckpointMagic));
  write_scalar(stream, kCheckpointVersion);
  write_scalar(stream, static_cast<std::uint64_t>(state.points));
  write_scalar(stream, state.scenario_code);
  write_scalar(stream, state.x_min);
  write_scalar(stream, state.x_max);
  write_scalar(stream, state.dt);
  write_scalar(stream, state.time);
  write_scalar(stream, state.step);
  for (const auto &component : state.q)
    write_bytes(stream, component.data(), component.size() * sizeof(double));
}

State read_checkpoint(const std::string &path) {
  std::ifstream stream(path, std::ios::binary);
  if (!stream) fail("cannot open checkpoint for restart: " + path);
  std::array<char, sizeof(kCheckpointMagic)> magic{};
  stream.read(magic.data(), static_cast<std::streamsize>(magic.size()));
  if (!stream || std::memcmp(magic.data(), kCheckpointMagic, magic.size()) != 0)
    fail("checkpoint magic/version mismatch");
  if (read_scalar<std::uint64_t>(stream, "version") != kCheckpointVersion)
    fail("unsupported checkpoint version");
  const auto points = static_cast<std::size_t>(read_scalar<std::uint64_t>(stream, "points"));
  State state(points);
  state.scenario_code = read_scalar<std::uint64_t>(stream, "scenario");
  state.x_min = read_scalar<double>(stream, "x_min");
  state.x_max = read_scalar<double>(stream, "x_max");
  state.dt = read_scalar<double>(stream, "dt");
  state.time = read_scalar<double>(stream, "time");
  state.step = read_scalar<std::uint64_t>(stream, "step");
  for (auto &component : state.q) {
    stream.read(reinterpret_cast<char *>(component.data()), static_cast<std::streamsize>(component.size() * sizeof(double)));
    if (!stream) fail("truncated checkpoint while reading state");
  }
  return state;
}

std::uint64_t fnv1a_update(std::uint64_t hash, const void *data, std::size_t size) {
  constexpr std::uint64_t prime = 1099511628211ull;
  const auto *bytes = static_cast<const unsigned char *>(data);
  for (std::size_t i = 0; i < size; ++i) {
    hash ^= static_cast<std::uint64_t>(bytes[i]);
    hash *= prime;
  }
  return hash;
}

std::uint64_t state_checksum(const State &state) {
  std::uint64_t hash = 1469598103934665603ull;
  const auto points = static_cast<std::uint64_t>(state.points);
  hash = fnv1a_update(hash, &points, sizeof(points));
  hash = fnv1a_update(hash, &state.x_min, sizeof(state.x_min));
  hash = fnv1a_update(hash, &state.x_max, sizeof(state.x_max));
  hash = fnv1a_update(hash, &state.dt, sizeof(state.dt));
  hash = fnv1a_update(hash, &state.time, sizeof(state.time));
  hash = fnv1a_update(hash, &state.step, sizeof(state.step));
  for (const auto &component : state.q)
    hash = fnv1a_update(hash, component.data(), component.size() * sizeof(double));
  return hash;
}

std::uint64_t file_checksum(const std::string &path) {
  std::ifstream stream(path, std::ios::binary);
  if (!stream) fail("cannot read checkpoint for checksum: " + path);
  std::array<char, 8192> buffer{};
  std::uint64_t hash = 1469598103934665603ull;
  while (stream) {
    stream.read(buffer.data(), static_cast<std::streamsize>(buffer.size()));
    const auto count = stream.gcount();
    if (count > 0) hash = fnv1a_update(hash, buffer.data(), static_cast<std::size_t>(count));
  }
  return hash;
}

std::string hex64(std::uint64_t value) {
  std::ostringstream stream;
  stream << std::hex << std::setfill('0') << std::setw(16) << value;
  return stream.str();
}

void write_manifest(const State &state, const Options &options, const Diagnostics &diag,
                    std::uint64_t state_hash, std::uint64_t checkpoint_hash) {
  ensure_parent(options.manifest_path);
  std::ofstream stream(options.manifest_path, std::ios::trunc);
  if (!stream) fail("cannot open manifest for writing: " + options.manifest_path);
  stream << std::setprecision(17);
  const char *formulation = state.scenario_code == 3 ? "ccz4-1d-reference-contract" :
                            "bssnok-1d-reference";
  const char *promotion = "blocked-pending-k2-compatibility-and-k3-3d";
  stream << "{\n"
         << "  \"schema_version\": \"nr-run-manifest-v1\",\n"
         << "  \"kernel_id\": \"nr-k2-cpp-openmp-shadow\",\n"
         << "  \"kernel_version\": \"0.2.0\",\n"
         << "  \"formulation\": \"" << formulation << "\",\n"
         << "  \"status\": \"shadow\",\n"
         << "  \"promotion\": \"" << promotion << "\",\n"
         << "  \"units\": \"geometric-G=c=1\",\n"
         << "  \"coordinate_system\": \"cartesian-1d-reduction\",\n"
         << "  \"gauge\": \"advective-1+log-gamma-driver\",\n"
         << "  \"boundary\": \"periodic\",\n"
         << "  \"grid\": {\"points\": " << state.points
         << ", \"x_min\": " << state.x_min << ", \"x_max\": " << state.x_max
         << ", \"dt\": " << state.dt << "},\n"
         << "  \"diagnostics\": {\n"
         << "    \"scenario\": \"" << (state.scenario_code == 0 ? "minkowski" :
             (state.scenario_code == 1 ? "homogeneous-trace-k" :
              (state.scenario_code == 2 ? "bssn-wave" : "ccz4-wave"))) << "\",\n"
         << "    \"step\": " << state.step << ",\n"
         << "    \"time\": " << state.time << ",\n"
         << "    \"hamiltonian_l_inf\": " << diag.hamiltonian_l_inf << ",\n"
         << "    \"hamiltonian_l2\": " << diag.hamiltonian_l2 << ",\n"
         << "    \"momentum_l_inf\": " << diag.momentum_l_inf << ",\n"
         << "    \"momentum_l2\": " << diag.momentum_l2 << ",\n"
         << "    \"det_h_l_inf\": " << diag.det_h_l_inf << ",\n"
         << "    \"trace_a_l_inf\": " << diag.trace_a_l_inf << ",\n"
         << "    \"conformal_gamma_l_inf\": " << diag.conformal_gamma_l_inf << ",\n"
         << "    \"theta_l_inf\": " << diag.theta_l_inf << ",\n"
         << "    \"constraint_status\": \"physical-1d-vacuum-evaluator\",\n"
         << "    \"state_checksum_fnv1a64\": \"" << hex64(state_hash) << "\",\n"
         << "    \"checkpoint_checksum_fnv1a64\": \"" << hex64(checkpoint_hash) << "\",\n"
         << "    \"checkpoint_deterministic\": true,\n"
         << "    \"checkpoint_present\": true,\n"
         << "    \"variable_count\": " << kVariableCount << ",\n"
         << "    \"variables\": [";
  for (std::size_t i = 0; i < kVariableCount; ++i) {
    if (i != 0) stream << ", ";
    stream << "\"" << kVariableNames[i] << "\"";
  }
  stream << "]\n  }\n}\n";
}

} // namespace

int main(int argc, char **argv) {
  try {
    require_little_endian();
    const Options options = parse_options(argc, argv);
    set_threads(options.threads);
    State state;
    if (!options.restart_path.empty()) {
      state = read_checkpoint(options.restart_path);
      if (state.points != options.points) fail("restart points do not match --points");
      if (state.dt != options.dt) fail("restart dt does not match --dt");
      if (state.x_min != options.x_min || state.x_max != options.x_max)
        fail("restart domain does not match --x-min/--x-max");
      if (state.scenario_code != scenario_code_from_name(options.scenario))
        fail("restart scenario does not match --scenario");
    } else {
      initialize(state, options);
    }
    for (std::size_t step = 0; step < options.steps; ++step) rk4_step(state);
    if (options.checkpoint_path.empty()) fail("--checkpoint is required for deterministic K2 evidence");
    write_checkpoint(state, options.checkpoint_path);
    const Diagnostics diag = diagnostics(state);
    write_manifest(state, options, diag, state_checksum(state), file_checksum(options.checkpoint_path));
    std::cout << "nr-k2-shadow step=" << state.step << " time=" << std::setprecision(17)
              << state.time << " state_checksum_fnv1a64=" << hex64(state_checksum(state)) << "\n";
    return 0;
  } catch (const std::exception &error) {
    std::cerr << "nr-k2-shadow: " << error.what() << '\n';
    return 2;
  }
}
