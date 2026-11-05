// NR-K2 3-D data/checkpoint shadow contract.
//
// This executable carries two explicitly labelled shadow modes.  The default
// analytic mode is the cross-language 3-D state/checkpoint envelope; dynamic
// mode adds a periodic second-order BSSNOK/CCZ4 method-of-lines RHS with RK4.
// Neither mode is a black-hole/AMR/production-boundary solver; promotion is
// held until strong-field physical validation closes the later K3 gates.

#include <array>
#include <algorithm>
#include <cmath>
#include <cstdint>
#include <cstring>
#include <cstdlib>
#include <fstream>
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
constexpr char kCheckpointMagic[8] = {'N', 'R', 'K', '2', '3', 'D', '0', '1'};
constexpr char kDynamicCheckpointMagic[8] = {'N', 'R', 'K', '2', '3', 'D', 'D', '1'};
constexpr std::size_t kVariableCount = 25;
constexpr std::size_t kDimension = 3;
static_assert(sizeof(double) == 8, "NR-K2 3-D checkpoint requires binary64");

enum Variable : std::size_t {
  Chi = 0, H11, H12, H13, H22, H23, H33, K,
  A11, A12, A13, A22, A23, A33, Theta,
  Gamma1, Gamma2, Gamma3, Lapse,
  Shift1, Shift2, Shift3, B1, B2, B3,
};

const std::array<const char *, kVariableCount> kVariableNames = {
    "chi", "h11", "h12", "h13", "h22", "h23", "h33", "K",
    "A11", "A12", "A13", "A22", "A23", "A33", "Theta", "Gamma1",
    "Gamma2", "Gamma3", "lapse", "shift1", "shift2", "shift3", "B1",
    "B2", "B3"};

struct Options {
  std::size_t points = 8;
  std::size_t steps = 1;
  std::size_t threads = 1;
  double dt = 1.0e-5;
  double amplitude = 1.0e-3;
  double wavelength = 1.0;
  std::string formulation = "ccz4";
  std::string scenario = "gauge-wave";
  std::string solver_mode = "analytic";
  std::string manifest_path;
  std::string checkpoint_path;
  std::string restart_path;
};

struct State {
  std::size_t points = 0;
  double dt = 0.0;
  double time = 0.0;
  double amplitude = 0.0;
  double wavelength = 1.0;
  std::uint64_t step = 0;
  std::uint64_t scenario_code = 0;
  std::uint64_t formulation_code = 0;
  std::uint64_t solver_mode_code = 0;
  std::array<std::vector<double>, kVariableCount> q{};

  explicit State(std::size_t n = 0) : points(n) {
    const auto cells = n * n * n;
    for (auto &component : q) component.assign(cells, 0.0);
  }
};

[[noreturn]] void fail(const std::string &message) {
  throw std::runtime_error(message);
}

std::uint64_t scenario_code_from_name(const std::string &scenario) {
  if (scenario == "minkowski") return 0;
  if (scenario == "gauge-wave") return 1;
  fail("unsupported 3-D scenario: " + scenario);
}

std::uint64_t formulation_code_from_name(const std::string &formulation) {
  if (formulation == "ccz4") return 0;
  if (formulation == "bssnok") return 1;
  fail("unsupported 3-D formulation: " + formulation);
}

std::size_t parse_size(const std::string &value, const char *name) {
  std::size_t consumed = 0;
  const auto result = std::stoull(value, &consumed);
  if (consumed != value.size() || result == 0)
    fail(std::string(name) + " must be positive");
  return static_cast<std::size_t>(result);
}

double parse_double(const std::string &value, const char *name) {
  std::size_t consumed = 0;
  const auto result = std::stod(value, &consumed);
  if (consumed != value.size() || !std::isfinite(result))
    fail(std::string(name) + " must be finite");
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
    else if (key == "--dt") options.dt = parse_double(next_value(argc, argv, i, "--dt"), "--dt");
    else if (key == "--amplitude") options.amplitude = parse_double(next_value(argc, argv, i, "--amplitude"), "--amplitude");
    else if (key == "--wavelength") options.wavelength = parse_double(next_value(argc, argv, i, "--wavelength"), "--wavelength");
    else if (key == "--formulation") options.formulation = next_value(argc, argv, i, "--formulation");
    else if (key == "--scenario") options.scenario = next_value(argc, argv, i, "--scenario");
    else if (key == "--solver-mode") options.solver_mode = next_value(argc, argv, i, "--solver-mode");
    else if (key == "--manifest") options.manifest_path = next_value(argc, argv, i, "--manifest");
    else if (key == "--checkpoint") options.checkpoint_path = next_value(argc, argv, i, "--checkpoint");
    else if (key == "--restart") options.restart_path = next_value(argc, argv, i, "--restart");
    else if (key == "--help" || key == "-h") {
      std::cout << "nr-k2-3d-shadow --scenario minkowski|gauge-wave --formulation ccz4|bssnok --solver-mode analytic|dynamic --steps N --manifest FILE --checkpoint FILE\n";
      std::exit(0);
    } else {
      fail("unknown option: " + key);
    }
  }
  if (options.points < 5) fail("--points must be at least five");
  if (!(options.dt > 0.0)) fail("--dt must be positive");
  if (std::abs(options.amplitude) >= 1.0) fail("--amplitude must have magnitude below one");
  if (!(options.wavelength > 0.0)) fail("--wavelength must be positive");
  if (options.manifest_path.empty()) fail("--manifest is required");
  if (options.checkpoint_path.empty()) fail("--checkpoint is required");
  (void)scenario_code_from_name(options.scenario);
  (void)formulation_code_from_name(options.formulation);
  if (options.solver_mode != "analytic" && options.solver_mode != "dynamic")
    fail("unsupported 3-D solver mode: " + options.solver_mode);
  return options;
}

void require_little_endian() {
  const std::uint16_t probe = 0x0102;
  const auto *bytes = reinterpret_cast<const unsigned char *>(&probe);
  if (bytes[0] != 0x02 || bytes[1] != 0x01)
    fail("NR-K2 3-D checkpoint format requires little-endian storage");
}

void set_threads(std::size_t threads) {
#ifdef NR_K2_HAS_OPENMP
  omp_set_dynamic(0);
  omp_set_num_threads(static_cast<int>(threads));
#else
  if (threads != 1) fail("this binary has no OpenMP; use --threads 1");
#endif
}

std::size_t index3(std::size_t i, std::size_t j, std::size_t k, std::size_t n) {
  return (i * n + j) * n + k;
}

void fill_state_at_time(State &state, double time) {
  state.time = time;
  const double two_pi = 2.0 * std::acos(-1.0);
  const double wave_number = two_pi / state.wavelength;
#ifdef NR_K2_HAS_OPENMP
#pragma omp parallel for schedule(static)
#endif
  for (std::int64_t i = 0; i < static_cast<std::int64_t>(state.points); ++i) {
    for (std::int64_t j = 0; j < static_cast<std::int64_t>(state.points); ++j) {
      for (std::int64_t k = 0; k < static_cast<std::int64_t>(state.points); ++k) {
        const auto flat = index3(static_cast<std::size_t>(i), static_cast<std::size_t>(j),
                                 static_cast<std::size_t>(k), state.points);
        for (auto &component : state.q) component[flat] = 0.0;
        state.q[Chi][flat] = 1.0;
        state.q[H11][flat] = 1.0;
        state.q[H22][flat] = 1.0;
        state.q[H33][flat] = 1.0;
        state.q[Lapse][flat] = 1.0;
        if (state.scenario_code == 1) {
          const double x = static_cast<double>(i) / static_cast<double>(state.points);
          const double argument = wave_number * (x - time);
          const double h = 1.0 - state.amplitude * std::sin(argument);
          const double h_time = wave_number * state.amplitude * std::cos(argument);
          state.q[Chi][flat] = std::pow(h, -1.0 / 3.0);
          state.q[H11][flat] = std::pow(h, 2.0 / 3.0);
          state.q[H22][flat] = std::pow(h, -1.0 / 3.0);
          state.q[H33][flat] = state.q[H22][flat];
          state.q[K][flat] = -h_time / (2.0 * std::pow(h, 1.5));
          state.q[A11][flat] = -h_time / (3.0 * std::pow(h, 5.0 / 6.0));
          state.q[A22][flat] = h_time / (6.0 * std::pow(h, 11.0 / 6.0));
          state.q[A33][flat] = state.q[A22][flat];
          state.q[Gamma1][flat] = -(2.0 / 3.0) * wave_number * state.amplitude *
                                  std::cos(argument) * std::pow(h, -5.0 / 3.0);
          state.q[Lapse][flat] = std::sqrt(h);
        }
      }
    }
  }
}

void initialize(State &state, const Options &options) {
  state = State(options.points);
  state.dt = options.dt;
  state.amplitude = options.amplitude;
  state.wavelength = options.wavelength;
  state.scenario_code = scenario_code_from_name(options.scenario);
  state.formulation_code = formulation_code_from_name(options.formulation);
  state.solver_mode_code = options.solver_mode == "dynamic" ? 1 : 0;
  fill_state_at_time(state, 0.0);
}

using Mat3 = std::array<double, 9>;
using Tensor3 = std::array<double, 27>;

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

double &mat_value(Mat3 &matrix, int i, int j) {
  return matrix[static_cast<std::size_t>(3 * i + j)];
}

double mat_value(const Mat3 &matrix, int i, int j) {
  return matrix[static_cast<std::size_t>(3 * i + j)];
}

double &tensor_value(Tensor3 &tensor, int i, int j, int k) {
  return tensor[static_cast<std::size_t>(9 * i + 3 * j + k)];
}

double tensor_value(const Tensor3 &tensor, int i, int j, int k) {
  return tensor[static_cast<std::size_t>(9 * i + 3 * j + k)];
}

std::size_t neighbor(const State &state, std::size_t flat, int axis, int delta) {
  const std::size_t n = state.points;
  std::size_t i = flat / (n * n);
  std::size_t j = (flat / n) % n;
  std::size_t k = flat % n;
  std::size_t *coordinate = axis == 0 ? &i : (axis == 1 ? &j : &k);
  const auto signed_coordinate = static_cast<long long>(*coordinate) + delta;
  const auto wrapped = (signed_coordinate % static_cast<long long>(n) +
                        static_cast<long long>(n)) % static_cast<long long>(n);
  *coordinate = static_cast<std::size_t>(wrapped);
  return index3(i, j, k, n);
}

double d1_field(const std::vector<double> &field, const State &state,
                std::size_t flat, int axis) {
  const double dx = 1.0 / static_cast<double>(state.points);
  return (field[neighbor(state, flat, axis, 1)] - field[neighbor(state, flat, axis, -1)]) /
         (2.0 * dx);
}

double d2_field(const std::vector<double> &field, const State &state,
                std::size_t flat, int axis) {
  const double dx = 1.0 / static_cast<double>(state.points);
  return (field[neighbor(state, flat, axis, 1)] - 2.0 * field[flat] +
          field[neighbor(state, flat, axis, -1)]) / (dx * dx);
}

double d2_mixed_field(const std::vector<double> &field, const State &state,
                      std::size_t flat, int first, int second) {
  if (first == second) return d2_field(field, state, flat, first);
  const double dx = 1.0 / static_cast<double>(state.points);
  return (d1_field(field, state, neighbor(state, flat, second, 1), first) -
          d1_field(field, state, neighbor(state, flat, second, -1), first)) /
         (2.0 * dx);
}

double h_value(const State &state, std::size_t flat, int i, int j) {
  return state.q[h_index(i, j)][flat];
}

double a_value(const State &state, std::size_t flat, int i, int j) {
  return state.q[a_index(i, j)][flat];
}

double metric_value(const State &state, std::size_t flat, int i, int j, bool physical) {
  const double conformal = h_value(state, flat, i, j);
  return physical ? conformal / state.q[Chi][flat] : conformal;
}

double d1_metric_value(const State &state, std::size_t flat, int i, int j, int axis,
                       bool physical) {
  const auto left = neighbor(state, flat, axis, -1);
  const auto right = neighbor(state, flat, axis, 1);
  const double dx = 1.0 / static_cast<double>(state.points);
  return (metric_value(state, right, i, j, physical) -
          metric_value(state, left, i, j, physical)) / (2.0 * dx);
}

Mat3 h_matrix_at(const State &state, std::size_t flat) {
  Mat3 result{};
  for (int i = 0; i < 3; ++i)
    for (int j = 0; j < 3; ++j)
      mat_value(result, i, j) = h_value(state, flat, i, j);
  return result;
}

Mat3 a_matrix_at(const State &state, std::size_t flat) {
  Mat3 result{};
  for (int i = 0; i < 3; ++i)
    for (int j = 0; j < 3; ++j)
      mat_value(result, i, j) = a_value(state, flat, i, j);
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

Mat3 inverse_metric(const Mat3 &matrix) {
  const double determinant = determinant_metric(matrix);
  if (!std::isfinite(determinant) || std::abs(determinant) < 1.0e-14)
    fail("singular or non-finite conformal metric in dynamic 3-D RHS");
  const double a = mat_value(matrix, 0, 0);
  const double b = mat_value(matrix, 0, 1);
  const double c = mat_value(matrix, 0, 2);
  const double d = mat_value(matrix, 1, 0);
  const double e = mat_value(matrix, 1, 1);
  const double f = mat_value(matrix, 1, 2);
  const double g = mat_value(matrix, 2, 0);
  const double h = mat_value(matrix, 2, 1);
  const double k = mat_value(matrix, 2, 2);
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

Tensor3 christoffel_at(const State &state, std::size_t flat, const Mat3 &inverse,
                       bool physical) {
  Tensor3 result{};
  for (int upper = 0; upper < 3; ++upper) {
    for (int first = 0; first < 3; ++first) {
      for (int second = 0; second < 3; ++second) {
        double value = 0.0;
        for (int ell = 0; ell < 3; ++ell) {
          const double d_first = d1_metric_value(state, flat, ell, second, first, physical);
          const double d_second = d1_metric_value(state, flat, ell, first, second, physical);
          const double d_ell = d1_metric_value(state, flat, first, second, ell, physical);
          value += 0.5 * mat_value(inverse, upper, ell) *
                   (d_first + d_second - d_ell);
        }
        tensor_value(result, upper, first, second) = value;
      }
    }
  }
  return result;
}

Mat3 hessian_scalar(const State &state, std::size_t flat, std::size_t variable,
                    const Tensor3 &christoffel) {
  Mat3 result{};
  std::array<double, 3> gradient{};
  for (int axis = 0; axis < 3; ++axis)
    gradient[static_cast<std::size_t>(axis)] = d1_field(state.q[variable], state, flat, axis);
  for (int first = 0; first < 3; ++first) {
    for (int second = 0; second < 3; ++second) {
      double value = d2_mixed_field(state.q[variable], state, flat, first, second);
      for (int upper = 0; upper < 3; ++upper)
        value -= tensor_value(christoffel, upper, first, second) *
                 gradient[static_cast<std::size_t>(upper)];
      mat_value(result, first, second) = value;
    }
  }
  return result;
}

Mat3 conformal_ricci_at(const State &state, std::size_t flat, const Mat3 &h,
                        const Mat3 &inverse, const Tensor3 &christoffel) {
  Tensor3 lower{};
  Tensor3 raised{};
  for (int a = 0; a < 3; ++a)
    for (int b = 0; b < 3; ++b)
      for (int c = 0; c < 3; ++c)
        for (int ell = 0; ell < 3; ++ell)
          tensor_value(lower, a, b, c) +=
              mat_value(h, a, ell) * tensor_value(christoffel, ell, b, c);
  for (int ell = 0; ell < 3; ++ell)
    for (int j = 0; j < 3; ++j)
      for (int k = 0; k < 3; ++k)
        for (int m = 0; m < 3; ++m)
          tensor_value(raised, ell, j, k) +=
              mat_value(inverse, ell, m) * tensor_value(lower, j, k, m);
  Mat3 result{};
  for (int first = 0; first < 3; ++first) {
    for (int second = 0; second < 3; ++second) {
      double value = 0.0;
      for (int k = 0; k < 3; ++k) {
        const double d_gamma_second = d1_field(
            state.q[Gamma1 + k], state, flat, second);
        const double d_gamma_first = d1_field(
            state.q[Gamma1 + k], state, flat, first);
        const double d_metric = d1_field(
            state.q[h_index(first, second)], state, flat, k);
        value += 0.5 * (mat_value(h, k, first) * d_gamma_second +
                        mat_value(h, k, second) * d_gamma_first +
                        state.q[Gamma1 + k][flat] * d_metric);
        for (int ell = 0; ell < 3; ++ell) {
          value -= 0.5 * mat_value(inverse, k, ell) * d2_mixed_field(
              state.q[h_index(first, second)], state, flat, k, ell);
          value += tensor_value(christoffel, k, ell, first) *
                   tensor_value(raised, ell, second, k);
          value += tensor_value(christoffel, k, ell, second) *
                   tensor_value(raised, ell, first, k);
          value += tensor_value(christoffel, k, first, ell) *
                   tensor_value(raised, ell, k, second);
        }
      }
      mat_value(result, first, second) = value;
    }
  }
  return result;
}

struct DynamicRHS {
  std::array<std::vector<double>, kVariableCount> q{};

  explicit DynamicRHS(std::size_t points = 0) {
    const auto cells = points * points * points;
    for (auto &component : q) component.assign(cells, 0.0);
  }
};

double sum_beta_component(const State &state, std::size_t flat,
                          std::size_t variable, int axis) {
  return state.q[Shift1 + static_cast<std::size_t>(axis)][flat] *
         d1_field(state.q[variable], state, flat, axis);
}

double sum_beta(const State &state, std::size_t flat, std::size_t variable) {
  return sum_beta_component(state, flat, variable, 0) +
         sum_beta_component(state, flat, variable, 1) +
         sum_beta_component(state, flat, variable, 2);
}

DynamicRHS dynamic_rhs(const State &state) {
  DynamicRHS result(state.points);
#ifdef NR_K2_HAS_OPENMP
#pragma omp parallel for schedule(static)
#endif
  for (std::int64_t signed_flat = 0;
       signed_flat < static_cast<std::int64_t>(state.points * state.points * state.points);
       ++signed_flat) {
    const auto flat = static_cast<std::size_t>(signed_flat);
    const bool ccz4_mode = state.formulation_code == 0;
    const double chi = state.q[Chi][flat];
    const double lapse = state.q[Lapse][flat];
    const double trace_k = state.q[K][flat];
    const double theta = state.q[Theta][flat];
    const Mat3 h = h_matrix_at(state, flat);
    const Mat3 a = a_matrix_at(state, flat);
    const Mat3 inverse = inverse_metric(h);
    Mat3 physical_inverse{};
    Mat3 physical_metric{};
    for (int i = 0; i < 3; ++i) {
      for (int j = 0; j < 3; ++j) {
        mat_value(physical_inverse, i, j) = chi * mat_value(inverse, i, j);
        mat_value(physical_metric, i, j) = mat_value(h, i, j) / chi;
      }
    }
    const Tensor3 christoffel = christoffel_at(state, flat, inverse, false);
    const Tensor3 physical_christoffel = christoffel_at(
        state, flat, physical_inverse, true);
    const Mat3 conformal_ricci = conformal_ricci_at(
        state, flat, h, inverse, christoffel);
    const Mat3 hessian_chi = hessian_scalar(state, flat, Chi, christoffel);
    const Mat3 hessian_lapse = hessian_scalar(
        state, flat, Lapse, physical_christoffel);
    double box_chi = 0.0;
    double lapse_laplacian = 0.0;
    double gradient_square = 0.0;
    std::array<double, 3> d_chi{};
    std::array<double, 3> d_lapse{};
    std::array<double, 3> d_trace_k{};
    std::array<double, 3> d_theta{};
    for (int axis = 0; axis < 3; ++axis) {
      d_chi[static_cast<std::size_t>(axis)] = d1_field(state.q[Chi], state, flat, axis);
      d_lapse[static_cast<std::size_t>(axis)] = d1_field(state.q[Lapse], state, flat, axis);
      d_trace_k[static_cast<std::size_t>(axis)] = d1_field(state.q[K], state, flat, axis);
      d_theta[static_cast<std::size_t>(axis)] = d1_field(state.q[Theta], state, flat, axis);
    }
    for (int i = 0; i < 3; ++i)
      for (int j = 0; j < 3; ++j) {
        box_chi += mat_value(inverse, i, j) * mat_value(hessian_chi, i, j);
        lapse_laplacian += mat_value(physical_inverse, i, j) * mat_value(hessian_lapse, i, j);
        gradient_square += d_chi[static_cast<std::size_t>(i)] *
                           mat_value(inverse, i, j) * d_chi[static_cast<std::size_t>(j)];
      }
    Mat3 physical_ricci = conformal_ricci;
    for (int i = 0; i < 3; ++i)
      for (int j = 0; j < 3; ++j) {
        const double correction =
            (mat_value(hessian_chi, i, j) + mat_value(h, i, j) * box_chi) / (2.0 * chi) -
            (d_chi[static_cast<std::size_t>(i)] * d_chi[static_cast<std::size_t>(j)] +
             3.0 * mat_value(h, i, j) * gradient_square) / (4.0 * chi * chi);
        mat_value(physical_ricci, i, j) += correction;
      }

    std::array<double, 3> contracted{};
    for (int component = 0; component < 3; ++component)
      for (int i = 0; i < 3; ++i)
        for (int j = 0; j < 3; ++j)
          contracted[static_cast<std::size_t>(component)] +=
              mat_value(inverse, i, j) * tensor_value(christoffel, component, i, j);
    std::array<double, 3> z_over_chi{};
    for (int component = 0; component < 3; ++component)
      z_over_chi[static_cast<std::size_t>(component)] = 0.5 * (
          state.q[Gamma1 + component][flat] - contracted[static_cast<std::size_t>(component)]);

    double ricci_scalar = 0.0;
    Mat3 covd2_lapse{};
    std::array<double, 3> z{};
    Mat3 ccz4_ricci = physical_ricci;
    if (ccz4_mode) {
      Mat3 ricci_chi{};
      Mat3 z_terms{};
      for (int i = 0; i < 3; ++i) {
        for (int j = 0; j < 3; ++j) {
          mat_value(ricci_chi, i, j) = 0.5 * (
              mat_value(hessian_chi, i, j) + mat_value(h, i, j) * box_chi -
              (d_chi[static_cast<std::size_t>(i)] * d_chi[static_cast<std::size_t>(j)] +
               3.0 * mat_value(h, i, j) * gradient_square) / (2.0 * chi));
          for (int component = 0; component < 3; ++component)
            mat_value(z_terms, i, j) += z_over_chi[static_cast<std::size_t>(component)] * (
                mat_value(h, i, component) * d_chi[static_cast<std::size_t>(j)] +
                mat_value(h, j, component) * d_chi[static_cast<std::size_t>(i)] -
                mat_value(h, i, j) * d_chi[static_cast<std::size_t>(component)]);
          mat_value(ccz4_ricci, i, j) = (
              mat_value(ricci_chi, i, j) + chi * mat_value(conformal_ricci, i, j) +
              mat_value(z_terms, i, j)) / chi;
        }
      }
      for (int i = 0; i < 3; ++i)
        for (int j = 0; j < 3; ++j)
          ricci_scalar += chi * mat_value(inverse, i, j) * mat_value(ccz4_ricci, i, j);
      double lapse_dot_chi = 0.0;
      for (int i = 0; i < 3; ++i)
        for (int j = 0; j < 3; ++j)
          lapse_dot_chi += d_lapse[static_cast<std::size_t>(i)] *
                            mat_value(inverse, i, j) * d_chi[static_cast<std::size_t>(j)];
      for (int i = 0; i < 3; ++i)
        for (int j = 0; j < 3; ++j)
          mat_value(covd2_lapse, i, j) = chi * mat_value(
              hessian_scalar(state, flat, Lapse, christoffel), i, j) + 0.5 * (
              d_lapse[static_cast<std::size_t>(i)] * d_chi[static_cast<std::size_t>(j)] +
              d_chi[static_cast<std::size_t>(i)] * d_lapse[static_cast<std::size_t>(j)] -
              mat_value(h, i, j) * lapse_dot_chi);
      for (int component = 0; component < 3; ++component)
        z[static_cast<std::size_t>(component)] = chi * z_over_chi[static_cast<std::size_t>(component)];
    }

    Mat3 a_up_one{};
    Mat3 a_upup{};
    Mat3 a_square_lower{};
    for (int i = 0; i < 3; ++i)
      for (int j = 0; j < 3; ++j)
        for (int ell = 0; ell < 3; ++ell)
          mat_value(a_up_one, i, j) += mat_value(inverse, i, ell) * mat_value(a, ell, j);
    for (int i = 0; i < 3; ++i)
      for (int j = 0; j < 3; ++j)
        for (int ell = 0; ell < 3; ++ell) {
          mat_value(a_square_lower, i, j) += mat_value(a, i, ell) *
                                             mat_value(a_up_one, ell, j);
          mat_value(a_upup, i, j) += mat_value(a_up_one, i, ell) *
                                     mat_value(inverse, ell, j);
        }
    double a_squared = 0.0;
    for (int i = 0; i < 3; ++i)
      for (int j = 0; j < 3; ++j)
        a_squared += mat_value(a, i, j) * mat_value(a_upup, i, j);

    double d_shift[3][3]{};
    double d2_shift[3][3][3]{};
    double d2_lapse[3][3]{};
    for (int direction = 0; direction < 3; ++direction) {
      for (int component = 0; component < 3; ++component) {
        d_shift[direction][component] = d1_field(
            state.q[Shift1 + component], state, flat, direction);
        for (int second = 0; second < 3; ++second) {
          d2_shift[direction][second][component] = d2_mixed_field(
              state.q[Shift1 + component], state, flat, direction, second);
        }
      }
      d2_lapse[direction][direction] = d2_field(state.q[Lapse], state, flat, direction);
      for (int second = 0; second < direction; ++second) {
        d2_lapse[direction][second] = d2_mixed_field(
            state.q[Lapse], state, flat, direction, second);
        d2_lapse[second][direction] = d2_lapse[direction][second];
      }
    }
    double div_shift = 0.0;
    for (int direction = 0; direction < 3; ++direction)
      div_shift += d_shift[direction][direction];

    Mat3 rhs_h{};
    Mat3 rhs_a{};
    Mat3 source_a{};
    double source_trace = 0.0;
    for (int i = 0; i < 3; ++i) {
      for (int j = 0; j < 3; ++j) {
        double lie_h = 0.0;
        double lie_a = 0.0;
        for (int component = 0; component < 3; ++component) {
          lie_h += mat_value(h, component, i) * d_shift[j][component] +
                   mat_value(h, component, j) * d_shift[i][component];
          lie_a += mat_value(a, component, i) * d_shift[j][component] +
                   mat_value(a, component, j) * d_shift[i][component];
        }
        mat_value(rhs_h, i, j) = -2.0 * lapse * mat_value(a, i, j) +
            sum_beta(state, flat, h_index(i, j)) + lie_h -
            (2.0 / 3.0) * mat_value(h, i, j) * div_shift;
        if (ccz4_mode) {
          mat_value(source_a, i, j) = -mat_value(covd2_lapse, i, j) +
              chi * lapse * mat_value(ccz4_ricci, i, j);
        } else {
          mat_value(source_a, i, j) = chi * (-mat_value(hessian_lapse, i, j) +
              lapse * mat_value(physical_ricci, i, j));
        }
        (void)lie_a;
      }
    }
    for (int i = 0; i < 3; ++i)
      for (int j = 0; j < 3; ++j)
        source_trace += mat_value(inverse, i, j) * mat_value(source_a, i, j);
    for (int i = 0; i < 3; ++i) {
      for (int j = 0; j < 3; ++j) {
        double lie_a = 0.0;
        for (int component = 0; component < 3; ++component)
          lie_a += mat_value(a, component, i) * d_shift[j][component] +
                   mat_value(a, component, j) * d_shift[i][component];
        mat_value(rhs_a, i, j) = mat_value(source_a, i, j) -
            mat_value(h, i, j) * source_trace / 3.0 +
            sum_beta(state, flat, a_index(i, j)) + lie_a -
            (2.0 / 3.0) * mat_value(a, i, j) * div_shift;
        if (ccz4_mode) {
          mat_value(rhs_a, i, j) += lapse * (trace_k - 2.0 * theta) * mat_value(a, i, j);
          for (int k = 0; k < 3; ++k)
            for (int ell = 0; ell < 3; ++ell)
              mat_value(rhs_a, i, j) -= 2.0 * lapse * mat_value(inverse, k, ell) *
                  mat_value(a, i, k) * mat_value(a, ell, j);
        } else {
          mat_value(rhs_a, i, j) += lapse * (trace_k * mat_value(a, i, j) -
              2.0 * mat_value(a_square_lower, i, j));
        }
      }
    }

    std::array<double, 3> connection_a{};
    for (int component = 0; component < 3; ++component)
      for (int i = 0; i < 3; ++i)
        for (int j = 0; j < 3; ++j)
          connection_a[static_cast<std::size_t>(component)] +=
              tensor_value(christoffel, component, i, j) * mat_value(a_upup, i, j);
    std::array<double, 3> rhs_gamma{};
    for (int component = 0; component < 3; ++component) {
      if (ccz4_mode) {
        constexpr double kappa1 = 0.1;
        constexpr double kappa3 = 1.0;
        rhs_gamma[static_cast<std::size_t>(component)] = (2.0 / 3.0) * (
            div_shift * (contracted[static_cast<std::size_t>(component)] +
                         2.0 * kappa3 * z_over_chi[static_cast<std::size_t>(component)]) -
            2.0 * lapse * trace_k * z_over_chi[static_cast<std::size_t>(component)]) -
            2.0 * kappa1 * z_over_chi[static_cast<std::size_t>(component)];
        for (int direction = 0; direction < 3; ++direction) {
          rhs_gamma[static_cast<std::size_t>(component)] +=
              2.0 * mat_value(inverse, component, direction) *
                  (lapse * d_theta[static_cast<std::size_t>(direction)] -
                   theta * d_lapse[static_cast<std::size_t>(direction)]) -
              2.0 * mat_value(a_upup, component, direction) *
                  d_lapse[static_cast<std::size_t>(direction)] -
              lapse * ((4.0 / 3.0) * mat_value(inverse, component, direction) *
                           d_trace_k[static_cast<std::size_t>(direction)] +
                       3.0 * mat_value(a_upup, component, direction) *
                           d_chi[static_cast<std::size_t>(direction)] / chi) -
              (contracted[static_cast<std::size_t>(direction)] +
               2.0 * kappa3 * z_over_chi[static_cast<std::size_t>(direction)]) *
                  d_shift[direction][component];
          for (int second = 0; second < 3; ++second) {
            rhs_gamma[static_cast<std::size_t>(component)] +=
                2.0 * lapse * tensor_value(christoffel, component, direction, second) *
                    mat_value(a_upup, direction, second) +
                mat_value(inverse, direction, second) *
                    d2_shift[direction][second][component] +
                (1.0 / 3.0) * mat_value(inverse, component, direction) *
                    d2_shift[direction][second][second];
          }
        }
      } else {
        rhs_gamma[static_cast<std::size_t>(component)] =
            2.0 * lapse * connection_a[static_cast<std::size_t>(component)] +
            (2.0 / 3.0) * state.q[Gamma1 + component][flat] * div_shift;
        for (int direction = 0; direction < 3; ++direction) {
          rhs_gamma[static_cast<std::size_t>(component)] +=
              -2.0 * mat_value(a_upup, component, direction) *
                  d_lapse[static_cast<std::size_t>(direction)] +
              2.0 * lapse * (-(2.0 / 3.0) * mat_value(inverse, component, direction) *
                      d_trace_k[static_cast<std::size_t>(direction)] +
                  6.0 * mat_value(a_upup, component, direction) *
                      (-0.25 * d_chi[static_cast<std::size_t>(direction)] / chi)) -
              state.q[Gamma1 + direction][flat] * d_shift[direction][component];
          for (int second = 0; second < 3; ++second) {
            rhs_gamma[static_cast<std::size_t>(component)] +=
                mat_value(inverse, direction, second) *
                    d2_shift[direction][second][component] +
                (1.0 / 3.0) * mat_value(inverse, component, direction) *
                    d2_shift[direction][second][second];
          }
        }
        for (int direction = 0; direction < 3; ++direction)
          rhs_gamma[static_cast<std::size_t>(component)] +=
              sum_beta_component(state, flat, Gamma1 + component, direction);
      }
      if (ccz4_mode)
        for (int direction = 0; direction < 3; ++direction)
          rhs_gamma[static_cast<std::size_t>(component)] +=
              sum_beta_component(state, flat, Gamma1 + component, direction);
    }

    result.q[Chi][flat] = (2.0 / 3.0) * chi * (lapse * trace_k - div_shift) +
        sum_beta_component(state, flat, Chi, 0) +
        sum_beta_component(state, flat, Chi, 1) +
        sum_beta_component(state, flat, Chi, 2);
    if (ccz4_mode) {
      constexpr double kappa1 = 0.1;
      constexpr double kappa2 = 0.0;
      double trace_covd2_lapse = -1.5 * (
          d_lapse[0] * mat_value(inverse, 0, 0) * d_chi[0] +
          d_lapse[0] * mat_value(inverse, 0, 1) * d_chi[1] +
          d_lapse[0] * mat_value(inverse, 0, 2) * d_chi[2] +
          d_lapse[1] * mat_value(inverse, 1, 0) * d_chi[0] +
          d_lapse[1] * mat_value(inverse, 1, 1) * d_chi[1] +
          d_lapse[1] * mat_value(inverse, 1, 2) * d_chi[2] +
          d_lapse[2] * mat_value(inverse, 2, 0) * d_chi[0] +
          d_lapse[2] * mat_value(inverse, 2, 1) * d_chi[1] +
          d_lapse[2] * mat_value(inverse, 2, 2) * d_chi[2]);
      for (int component = 0; component < 3; ++component)
        trace_covd2_lapse -= chi * contracted[static_cast<std::size_t>(component)] *
                             d_lapse[static_cast<std::size_t>(component)];
      for (int i = 0; i < 3; ++i)
        for (int j = 0; j < 3; ++j)
          trace_covd2_lapse += mat_value(inverse, i, j) * (
              chi * d2_lapse[i][j] + d_lapse[static_cast<std::size_t>(i)] *
              d_chi[static_cast<std::size_t>(j)]);
      result.q[K][flat] = sum_beta_component(state, flat, K, 0) +
          sum_beta_component(state, flat, K, 1) + sum_beta_component(state, flat, K, 2) -
          trace_covd2_lapse + lapse * (ricci_scalar + trace_k * (trace_k - 2.0 * theta)) -
          3.0 * kappa1 * (1.0 + kappa2) * theta;
      result.q[Theta][flat] = sum_beta_component(state, flat, Theta, 0) +
          sum_beta_component(state, flat, Theta, 1) + sum_beta_component(state, flat, Theta, 2) +
          0.5 * lapse * (ricci_scalar - a_squared + (2.0 / 3.0) * trace_k * trace_k -
              2.0 * theta * trace_k) - 0.5 * kappa1 * (4.0 + 2.0 * kappa2) * theta;
      for (int component = 0; component < 3; ++component)
        result.q[Theta][flat] -= z[static_cast<std::size_t>(component)] *
                                 d_lapse[static_cast<std::size_t>(component)];
    } else {
      result.q[K][flat] = -lapse_laplacian + lapse *
          (a_squared + trace_k * trace_k / 3.0) +
          sum_beta_component(state, flat, K, 0) +
          sum_beta_component(state, flat, K, 1) + sum_beta_component(state, flat, K, 2);
      result.q[Theta][flat] = 0.0;
    }
    result.q[Lapse][flat] = -2.0 * lapse * (trace_k - (ccz4_mode ? 2.0 * theta : 0.0)) +
        sum_beta_component(state, flat, Lapse, 0) +
        sum_beta_component(state, flat, Lapse, 1) + sum_beta_component(state, flat, Lapse, 2);
    for (int i = 0; i < 3; ++i) {
      for (int j = i; j < 3; ++j) {
        result.q[h_index(i, j)][flat] = mat_value(rhs_h, i, j);
        result.q[a_index(i, j)][flat] = mat_value(rhs_a, i, j);
      }
      result.q[Gamma1 + i][flat] = rhs_gamma[static_cast<std::size_t>(i)];
      result.q[Shift1 + i][flat] = 0.75 * state.q[B1 + i][flat] +
          sum_beta_component(state, flat, Shift1 + i, 0) +
          sum_beta_component(state, flat, Shift1 + i, 1) +
          sum_beta_component(state, flat, Shift1 + i, 2);
      result.q[B1 + i][flat] = rhs_gamma[static_cast<std::size_t>(i)] -
          state.q[B1 + i][flat] +
          sum_beta_component(state, flat, B1 + i, 0) +
          sum_beta_component(state, flat, B1 + i, 1) +
          sum_beta_component(state, flat, B1 + i, 2) -
          (sum_beta_component(state, flat, Gamma1 + i, 0) +
           sum_beta_component(state, flat, Gamma1 + i, 1) +
           sum_beta_component(state, flat, Gamma1 + i, 2));
    }
  }
  return result;
}

State add_scaled_dynamic(const State &state, const DynamicRHS &derivative, double scale) {
  State result = state;
#ifdef NR_K2_HAS_OPENMP
#pragma omp parallel for schedule(static)
#endif
  for (std::int64_t v = 0; v < static_cast<std::int64_t>(kVariableCount); ++v)
    for (std::size_t flat = 0; flat < state.points * state.points * state.points; ++flat)
      result.q[static_cast<std::size_t>(v)][flat] +=
          scale * derivative.q[static_cast<std::size_t>(v)][flat];
  return result;
}

void advance_dynamic(State &state) {
  const DynamicRHS k1 = dynamic_rhs(state);
  const DynamicRHS k2 = dynamic_rhs(add_scaled_dynamic(state, k1, 0.5 * state.dt));
  const DynamicRHS k3 = dynamic_rhs(add_scaled_dynamic(state, k2, 0.5 * state.dt));
  const DynamicRHS k4 = dynamic_rhs(add_scaled_dynamic(state, k3, state.dt));
#ifdef NR_K2_HAS_OPENMP
#pragma omp parallel for schedule(static)
#endif
  for (std::int64_t v = 0; v < static_cast<std::int64_t>(kVariableCount); ++v)
    for (std::size_t flat = 0; flat < state.points * state.points * state.points; ++flat) {
      const auto index = static_cast<std::size_t>(v);
      state.q[index][flat] += (state.dt / 6.0) * (
          k1.q[index][flat] + 2.0 * k2.q[index][flat] +
          2.0 * k3.q[index][flat] + k4.q[index][flat]);
    }
  state.time += state.dt;
  ++state.step;
}

void advance(State &state) {
  if (state.solver_mode_code == 1) {
    advance_dynamic(state);
  } else {
    fill_state_at_time(state, state.time + state.dt);
    ++state.step;
  }
}

void write_bytes(std::ofstream &stream, const void *data, std::size_t size) {
  stream.write(static_cast<const char *>(data), static_cast<std::streamsize>(size));
  if (!stream) fail("failed while writing 3-D checkpoint");
}

template <typename T> void write_scalar(std::ofstream &stream, const T &value) {
  write_bytes(stream, &value, sizeof(T));
}

template <typename T> T read_scalar(std::ifstream &stream, const char *name) {
  T value{};
  stream.read(reinterpret_cast<char *>(&value), static_cast<std::streamsize>(sizeof(T)));
  if (!stream) fail(std::string("truncated 3-D checkpoint while reading ") + name);
  return value;
}

void write_checkpoint(const State &state, const std::string &path) {
  std::ofstream stream(path, std::ios::binary | std::ios::trunc);
  if (!stream) fail("cannot open 3-D checkpoint for writing: " + path);
  const auto *magic = state.solver_mode_code == 1 ? kDynamicCheckpointMagic : kCheckpointMagic;
  write_bytes(stream, magic, sizeof(kCheckpointMagic));
  write_scalar(stream, kCheckpointVersion);
  write_scalar(stream, static_cast<std::uint64_t>(kDimension));
  write_scalar(stream, static_cast<std::uint64_t>(state.points));
  write_scalar(stream, state.scenario_code);
  write_scalar(stream, state.formulation_code);
  write_scalar(stream, state.dt);
  write_scalar(stream, state.time);
  write_scalar(stream, state.amplitude);
  write_scalar(stream, state.wavelength);
  write_scalar(stream, state.step);
  for (const auto &component : state.q)
    write_bytes(stream, component.data(), component.size() * sizeof(double));
}

State read_checkpoint(const std::string &path) {
  std::ifstream stream(path, std::ios::binary);
  if (!stream) fail("cannot open 3-D checkpoint for restart: " + path);
  std::array<char, sizeof(kCheckpointMagic)> magic{};
  stream.read(magic.data(), static_cast<std::streamsize>(magic.size()));
  if (!stream || (std::memcmp(magic.data(), kCheckpointMagic, magic.size()) != 0 &&
                  std::memcmp(magic.data(), kDynamicCheckpointMagic, magic.size()) != 0))
    fail("3-D checkpoint magic/version mismatch");
  if (read_scalar<std::uint64_t>(stream, "version") != kCheckpointVersion)
    fail("unsupported 3-D checkpoint version");
  if (read_scalar<std::uint64_t>(stream, "dimension") != kDimension)
    fail("3-D checkpoint dimension mismatch");
  const auto points = static_cast<std::size_t>(read_scalar<std::uint64_t>(stream, "points"));
  State state(points);
  state.solver_mode_code =
      std::memcmp(magic.data(), kDynamicCheckpointMagic, magic.size()) == 0 ? 1 : 0;
  state.scenario_code = read_scalar<std::uint64_t>(stream, "scenario");
  state.formulation_code = read_scalar<std::uint64_t>(stream, "formulation");
  state.dt = read_scalar<double>(stream, "dt");
  state.time = read_scalar<double>(stream, "time");
  state.amplitude = read_scalar<double>(stream, "amplitude");
  state.wavelength = read_scalar<double>(stream, "wavelength");
  state.step = read_scalar<std::uint64_t>(stream, "step");
  for (auto &component : state.q) {
    stream.read(reinterpret_cast<char *>(component.data()),
                static_cast<std::streamsize>(component.size() * sizeof(double)));
    if (!stream) fail("truncated 3-D checkpoint while reading state");
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
  hash = fnv1a_update(hash, &state.scenario_code, sizeof(state.scenario_code));
  hash = fnv1a_update(hash, &state.formulation_code, sizeof(state.formulation_code));
  hash = fnv1a_update(hash, &state.solver_mode_code, sizeof(state.solver_mode_code));
  hash = fnv1a_update(hash, &state.dt, sizeof(state.dt));
  hash = fnv1a_update(hash, &state.time, sizeof(state.time));
  hash = fnv1a_update(hash, &state.amplitude, sizeof(state.amplitude));
  hash = fnv1a_update(hash, &state.wavelength, sizeof(state.wavelength));
  hash = fnv1a_update(hash, &state.step, sizeof(state.step));
  for (const auto &component : state.q)
    hash = fnv1a_update(hash, component.data(), component.size() * sizeof(double));
  return hash;
}

std::uint64_t file_checksum(const std::string &path) {
  std::ifstream stream(path, std::ios::binary);
  if (!stream) fail("cannot read 3-D checkpoint for checksum: " + path);
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

void write_manifest(const State &state, const Options &options,
                    std::uint64_t state_hash, std::uint64_t checkpoint_hash) {
  std::ofstream stream(options.manifest_path, std::ios::trunc);
  if (!stream) fail("cannot open 3-D manifest for writing: " + options.manifest_path);
  stream << std::setprecision(17);
  const char *formulation = state.formulation_code == 0 ?
      (state.solver_mode_code == 1 ? "ccz4-3d-dynamic-shadow" : "ccz4-3d-kinematic-contract") :
      (state.solver_mode_code == 1 ? "bssnok-3d-dynamic-shadow" : "bssnok-3d-kinematic-contract");
  const char *scenario = state.scenario_code == 0 ? "minkowski" : "gauge-wave";
  const char *solver_mode = state.solver_mode_code == 1 ?
      "dynamic-method-of-lines-rk4" : "analytic-3d-state-contract";
  stream << "{\n"
         << "  \"schema_version\": \"nr-run-manifest-v1\",\n"
         << "  \"kernel_id\": \"nr-k2-cpp-openmp-3d-shadow\",\n"
         << "  \"kernel_version\": \"0.2.0\",\n"
         << "  \"formulation\": \"" << formulation << "\",\n"
         << "  \"status\": \"shadow\",\n"
         << "  \"promotion\": \"" << (state.solver_mode_code == 1 ?
             "blocked-pending-k3-physical-validation" :
             "blocked-pending-k2-3d-dynamic-rhs") << "\",\n"
         << "  \"units\": \"geometric-G=c=1\",\n"
         << "  \"coordinate_system\": \"cartesian-3d\",\n"
         << "  \"gauge\": \"advective-1+log-gamma-driver\",\n"
         << "  \"boundary\": \"periodic\",\n"
         << "  \"grid\": {\"shape\": [" << state.points << ", " << state.points << ", " << state.points
         << "], \"lower\": [0, 0, 0], \"upper\": [1, 1, 1], \"spacing\": ["
         << 1.0 / static_cast<double>(state.points) << ", "
         << 1.0 / static_cast<double>(state.points) << ", "
         << 1.0 / static_cast<double>(state.points) << "], \"dt\": " << state.dt << "},\n"
         << "  \"diagnostics\": {\n"
         << "    \"scenario\": \"" << scenario << "\",\n"
         << "    \"solver_mode\": \"" << solver_mode << "\",\n"
         << "    \"step\": " << state.step << ",\n"
         << "    \"time\": " << state.time << ",\n"
         << "    \"amplitude\": " << state.amplitude << ",\n"
         << "    \"wavelength\": " << state.wavelength << ",\n"
         << "    \"dynamic_rhs_implemented\": " << (state.solver_mode_code == 1 ? "true" : "false") << ",\n"
         << "    \"dynamic_evolution_validated\": false,\n"
         << "    \"checkpoint_deterministic\": true,\n"
         << "    \"checkpoint_present\": true,\n"
         << "    \"state_checksum_fnv1a64\": \"" << hex64(state_hash) << "\",\n"
         << "    \"checkpoint_checksum_fnv1a64\": \"" << hex64(checkpoint_hash) << "\",\n"
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
      if (state.scenario_code != scenario_code_from_name(options.scenario))
        fail("restart scenario does not match --scenario");
      if (state.formulation_code != formulation_code_from_name(options.formulation))
        fail("restart formulation does not match --formulation");
      if (state.solver_mode_code != (options.solver_mode == "dynamic" ? 1ull : 0ull))
        fail("restart solver mode does not match --solver-mode");
      if (state.amplitude != options.amplitude || state.wavelength != options.wavelength)
        fail("restart wave parameters do not match command line");
    } else {
      initialize(state, options);
    }
    for (std::size_t step = 0; step < options.steps; ++step) advance(state);
    write_checkpoint(state, options.checkpoint_path);
    write_manifest(state, options, state_checksum(state), file_checksum(options.checkpoint_path));
    std::cout << "nr-k2-3d-shadow step=" << state.step << " time=" << std::setprecision(17)
              << state.time << " state_checksum_fnv1a64=" << hex64(state_checksum(state)) << "\n";
    return 0;
  } catch (const std::exception &error) {
    std::cerr << "nr-k2-3d-shadow: " << error.what() << '\n';
    return 2;
  }
}
