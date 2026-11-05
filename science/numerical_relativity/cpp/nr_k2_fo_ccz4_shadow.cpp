// NR-K2 FO-CCZ4 58-slot checkpoint/manifest shadow contract.
//
// This executable carries the cross-language state envelope and a separate
// C++ FO-CCZ4 RHS shadow.  The analytic-contract mode reconstructs the same
// periodic gauge-wave slice and A/B/D/P auxiliaries as Python; the
// fo-rhs-shadow mode evolves all 58 slots with deterministic classical RK4.
// Both modes support checkpoint/restart across OpenMP thread counts and emit
// the shared nr-run-manifest-v1 identity.  This is not a production
// characteristic solver, CPBC implementation, or live-runtime backend.

#include <algorithm>
#include <array>
#include <cmath>
#include <cstdint>
#include <cstring>
#include <cstdlib>
#include <fstream>
#include <iomanip>
#include <iostream>
#include <limits>
#include <memory>
#include <sstream>
#include <stdexcept>
#include <string>
#include <vector>

#ifdef NR_K2_HAS_OPENMP
#include <omp.h>
#endif

namespace {

constexpr std::uint64_t kCheckpointVersion = 1;
constexpr std::uint64_t kProfileCheckpointVersion = 2;
constexpr std::uint64_t kSpatialCheckpointVersion = 3;
constexpr std::uint64_t kControlCheckpointVersion = 4;
constexpr std::uint64_t kDomainCheckpointVersion = 5;
constexpr char kCheckpointMagic[8] = {'N', 'R', 'K', '2', 'F', 'O', '0', '1'};
constexpr std::size_t kVariableCount = 58;
constexpr std::size_t kDimension = 3;
static_assert(sizeof(double) == 8, "FO-CCZ4 checkpoint requires binary64");

[[noreturn]] void fail(const std::string &message);

std::size_t checked_cells(std::size_t points) {
  if (points == 0) return 0;
  const auto limit = static_cast<std::size_t>(std::numeric_limits<std::streamsize>::max()) /
                     (58 * sizeof(double));
  if (points > limit / points || points * points > limit / points)
    fail("FO-CCZ4 grid size overflows checkpoint storage");
  return points * points * points;
}

enum Variable : std::size_t {
  H00 = 0, H01, H02, H11, H12, H22,
  LnAlpha, Beta0, Beta1, Beta2, LnPhi,
  A00, A01, A02, A11, A12, A22, TraceK, Theta,
  GammaHat0, GammaHat1, GammaHat2, B0, B1, B2,
  AuxA0, AuxA1, AuxA2,
  AuxB00, AuxB01, AuxB02, AuxB10, AuxB11, AuxB12, AuxB20, AuxB21, AuxB22,
  D000, D001, D002, D011, D012, D022,
  D100, D101, D102, D111, D112, D122,
  D200, D201, D202, D211, D212, D222,
  P0, P1, P2,
};

const std::array<const char *, kVariableCount> kVariableNames = {
    "h00", "h01", "h02", "h11", "h12", "h22", "ln_alpha",
    "beta0", "beta1", "beta2", "ln_phi", "A00", "A01", "A02", "A11",
    "A12", "A22", "K", "Theta", "GammaHat0", "GammaHat1", "GammaHat2",
    "b0", "b1", "b2", "A0", "A1", "A2", "B00", "B01", "B02", "B10",
    "B11", "B12", "B20", "B21", "B22", "D000", "D001", "D002", "D011",
    "D012", "D022", "D100", "D101", "D102", "D111", "D112", "D122",
    "D200", "D201", "D202", "D211", "D212", "D222", "P0", "P1", "P2"};

struct Options {
  double tau_inverse = 0.0;
  bool tau_explicit = false;
  std::size_t points = 8;
  std::size_t spatial_order = 2;
  std::size_t steps = 1;
  std::size_t threads = 1;
  double dt = 1.0e-5;
  double amplitude = 1.0e-3;
  double wavelength = 1.0;
  std::string formulation = "ccz4";
  std::string scenario = "gauge-wave";
  std::string solver_mode = "analytic-contract";
  std::string manifest_path;
  std::string checkpoint_path;
  std::string restart_path;
  std::uint64_t gauge_profile_code = 0;
  double shift_scale = 3.0;
  double ordering_scale = 0.2;
  bool profile_parameters_explicit = false;
  double domain_lower = 1.0, domain_upper = 3.0, mass = 1.0;
  bool domain_explicit = false;
};

// Geometry only: no evolved fields or serialized state.  RK stages share one
// immutable table, removing repeated division/modulo from every derivative.
struct PeriodicTopology {
  const std::size_t points;
  const std::size_t spatial_order;
  std::vector<std::array<std::size_t, 6>> adjacent;
  std::vector<std::array<std::size_t, 6>> distant;

  explicit PeriodicTopology(std::size_t n, std::size_t order = 2)
      : points(n), spatial_order(order), adjacent(checked_cells(n)) {
    if (order != 2 && order != 4) fail("spatial order must be 2 or 4");
    const std::array<std::size_t, 3> stride = {n * n, n, 1};
    for (std::size_t flat = 0; flat < adjacent.size(); ++flat) {
      for (std::size_t axis = 0; axis < 3; ++axis) {
        const auto coordinate = (flat / stride[axis]) % n;
        adjacent[flat][2 * axis] = coordinate == 0
            ? flat + (n - 1) * stride[axis] : flat - stride[axis];
        adjacent[flat][2 * axis + 1] = coordinate + 1 == n
            ? flat - (n - 1) * stride[axis] : flat + stride[axis];
      }
    }
    if (order == 4) {
      distant.resize(adjacent.size());
      for (std::size_t flat = 0; flat < adjacent.size(); ++flat)
        for (std::size_t side = 0; side < 6; ++side)
          distant[flat][side] = adjacent[adjacent[flat][side]][side];
    }
  }
};

struct State {
  double tau_inverse = 0.0;
  std::size_t points = 0;
  std::size_t spatial_order = 2;
  double dt = 0.0;
  double time = 0.0;
  double amplitude = 0.0;
  double wavelength = 1.0;
  std::uint64_t step = 0;
  std::uint64_t scenario_code = 0;
  std::uint64_t formulation_code = 0;
  std::uint64_t solver_mode_code = 0;
  std::uint64_t gauge_profile_code = 0;
  double shift_scale = 3.0;
  double ordering_scale = 0.2;
  // Only scenario 2 uses a closed positive-octant cube with two fixed layers.
  double domain_lower = 1.0, domain_upper = 3.0, mass = 1.0;
  std::array<std::vector<double>, kVariableCount> q{};
  std::shared_ptr<const PeriodicTopology> topology;

  explicit State(std::size_t n = 0, std::size_t order = 2) : points(n), spatial_order(order) {
    if (order != 2 && order != 4) fail("spatial order must be 2 or 4");
    const auto cells = checked_cells(n);
    for (auto &component : q) component.assign(cells, 0.0);
    if (n) topology = std::make_shared<const PeriodicTopology>(n, order);
  }
};

[[noreturn]] void fail(const std::string &message) {
  throw std::runtime_error(message);
}

void validate_profile(std::uint64_t code, double shift_scale, double ordering_scale) {
  if (code > 1) fail("unsupported gauge profile id");
  if (code == 1 && (!std::isfinite(shift_scale) || shift_scale <= 2.0 ||
                   !std::isfinite(ordering_scale) || ordering_scale <= 0.0 || ordering_scale >= 2.0))
    fail("gauge profile requires finite shift_scale > 2 and 0 < ordering_scale < 2");
}

std::uint64_t scenario_code_from_name(const std::string &scenario) {
  if (scenario == "minkowski") return 0;
  if (scenario == "gauge-wave") return 1;
  if (scenario == "schwarzschild-exterior") return 2;
  fail("unsupported FO-CCZ4 scenario: " + scenario);
}

std::uint64_t formulation_code_from_name(const std::string &formulation) {
  if (formulation == "ccz4") return 0;
  fail("FO-CCZ4 shadow requires --formulation ccz4");
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

void validate_domain(double lower, double upper, double mass) {
  if (!std::isfinite(lower) || !std::isfinite(upper) || !std::isfinite(mass) ||
      lower <= 0.0 || upper <= lower || mass <= 0.0 || std::sqrt(3.0) * lower <= mass / 2.0)
    fail("Schwarzschild cube must be finite, positive, and outside r=M/2");
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
    else if (key == "--spatial-order") options.spatial_order = parse_size(next_value(argc, argv, i, "--spatial-order"), "--spatial-order");
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
    else if (key == "--domain-lower" || key == "--domain-upper" || key == "--mass") {
      const auto value = parse_double(next_value(argc, argv, i, key.c_str()), key.c_str());
      if (key == "--domain-lower") options.domain_lower = value;
      else if (key == "--domain-upper") options.domain_upper = value;
      else options.mass = value;
      options.domain_explicit = true;
    }
    else if (key == "--tau-inverse") {
      if (options.tau_explicit) fail("duplicate --tau-inverse");
      options.tau_inverse = parse_double(next_value(argc, argv, i, "--tau-inverse"), "--tau-inverse");
      options.tau_explicit = true;
    }
    else if (key == "--gauge-profile") {
      const auto name = next_value(argc, argv, i, "--gauge-profile");
      if (name != "legacy" && name != "state-dependent-v1") fail("unsupported gauge profile name");
      options.gauge_profile_code = name == "legacy" ? 0 : 1;
    }
    else if (key == "--shift-scale") {
      options.shift_scale = parse_double(next_value(argc, argv, i, "--shift-scale"), "--shift-scale");
      options.profile_parameters_explicit = true;
    }
    else if (key == "--ordering-scale") {
      options.ordering_scale = parse_double(next_value(argc, argv, i, "--ordering-scale"), "--ordering-scale");
      options.profile_parameters_explicit = true;
    }
    else if (key == "--help" || key == "-h") {
      std::cout << "nr-k2-fo-ccz4-shadow --scenario minkowski|gauge-wave|schwarzschild-exterior --steps N "
                   "--manifest FILE --checkpoint FILE [--restart FILE] "
                   "[--spatial-order 2|4] "
                   "[--tau-inverse NONNEGATIVE_RATE] "
                   "[--domain-lower X --domain-upper X --mass M] "
                   "[--gauge-profile legacy|state-dependent-v1 --shift-scale A --ordering-scale K]\n";
      std::exit(0);
    } else {
      fail("unknown option: " + key);
    }
  }
  if (options.points < 5) fail("--points must be at least five");
  if (options.spatial_order != 2 && options.spatial_order != 4) fail("--spatial-order must be 2 or 4");
  if (!(options.dt > 0.0)) fail("--dt must be positive");
  if (std::abs(options.amplitude) >= 1.0) fail("--amplitude must have magnitude below one");
  if (!(options.wavelength > 0.0)) fail("--wavelength must be positive");
  if (options.manifest_path.empty()) fail("--manifest is required");
  if (options.checkpoint_path.empty()) fail("--checkpoint is required");
  (void)scenario_code_from_name(options.scenario);
  (void)formulation_code_from_name(options.formulation);
  if (options.solver_mode != "analytic-contract" && options.solver_mode != "fo-rhs-shadow")
    fail("FO-CCZ4 shadow supports --solver-mode analytic-contract|fo-rhs-shadow");
  validate_profile(options.gauge_profile_code, options.shift_scale, options.ordering_scale);
  if (!options.gauge_profile_code && options.profile_parameters_explicit)
    fail("gauge profile parameters require explicit state-dependent-v1 mode");
  if (options.gauge_profile_code && options.solver_mode != "fo-rhs-shadow")
    fail("state-dependent gauge profile requires fo-rhs-shadow evolution");
  if (options.tau_inverse < 0.0) fail("--tau-inverse must be non-negative");
  if (options.tau_inverse > 0.0 && options.solver_mode != "fo-rhs-shadow")
    fail("algebraic relaxation requires fo-rhs-shadow evolution");
  if (options.scenario == "schwarzschild-exterior") {
    validate_domain(options.domain_lower, options.domain_upper, options.mass);
    if (options.points < 9 || options.solver_mode != "fo-rhs-shadow" ||
        options.amplitude != 0.0 || options.wavelength != 1.0)
      fail("Schwarzschild requires points >= 9, dynamic mode, amplitude 0, wavelength 1");
  } else if (options.domain_explicit) {
    fail("domain parameters require explicit Schwarzschild scenario");
  }
  return options;
}

void require_little_endian() {
  const std::uint16_t probe = 0x0102;
  const auto *bytes = reinterpret_cast<const unsigned char *>(&probe);
  if (bytes[0] != 0x02 || bytes[1] != 0x01)
    fail("FO-CCZ4 checkpoint requires little-endian storage");
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

double d1(const State &state, std::size_t variable, std::size_t flat, int axis) {
  if (state.scenario_code == 2) {
    const std::array<std::size_t, 3> strides = {state.points * state.points, state.points, 1};
    const auto stride = strides[static_cast<std::size_t>(axis)];
    const auto coordinate = (flat / stride) % state.points;
    const double spacing = (state.domain_upper - state.domain_lower) / (state.points - 1);
    const auto &q = state.q[variable];
    if (state.spatial_order == 4) {
      if (coordinate < 2 || coordinate + 2 >= state.points) return 0.0;
      return (8.0 * (q[flat + stride] - q[flat - stride]) -
              (q[flat + 2 * stride] - q[flat - 2 * stride])) / (12.0 * spacing);
    }
    if (coordinate == 0 || coordinate + 1 == state.points) return 0.0;
    return (q[flat + stride] - q[flat - stride]) / (2.0 * spacing);
  }
  const double spacing = 1.0 / static_cast<double>(state.points);
  const auto &adjacent = state.topology->adjacent[flat];
  if (state.spatial_order == 4) {
    const auto &distant = state.topology->distant[flat];
    const auto minus = static_cast<std::size_t>(2 * axis), plus = minus + 1;
    // Pair subtractions before weighting so constants have exactly zero d1.
    return (8.0 * (state.q[variable][adjacent[plus]] - state.q[variable][adjacent[minus]]) -
            (state.q[variable][distant[plus]] - state.q[variable][distant[minus]])) / (12.0 * spacing);
  }
  // Keep the original floating-point subtraction/division order exactly.
  return (state.q[variable][adjacent[static_cast<std::size_t>(2 * axis)]] -
          state.q[variable][adjacent[static_cast<std::size_t>(2 * axis + 1)]]) / (-2.0 * spacing);
}

using Vec3 = std::array<double, 3>;
using Mat3 = std::array<double, 9>;
using Tensor3 = std::array<double, 27>;
using DChrist = std::array<double, 81>;

double &mat(Mat3 &value, int i, int j) {
  return value[static_cast<std::size_t>(3 * i + j)];
}

double mat(const Mat3 &value, int i, int j) {
  return value[static_cast<std::size_t>(3 * i + j)];
}

double &tensor(Tensor3 &value, int a, int b, int c) {
  return value[static_cast<std::size_t>(9 * a + 3 * b + c)];
}

double tensor(const Tensor3 &value, int a, int b, int c) {
  return value[static_cast<std::size_t>(9 * a + 3 * b + c)];
}

double &dchrist(DChrist &value, int derivative, int upper, int first, int second) {
  return value[static_cast<std::size_t>(27 * derivative + 9 * upper + 3 * first + second)];
}

double dchrist(const DChrist &value, int derivative, int upper, int first, int second) {
  return value[static_cast<std::size_t>(27 * derivative + 9 * upper + 3 * first + second)];
}

std::size_t h_slot(int i, int j) {
  if (i > j) std::swap(i, j);
  if (i == 0 && j == 0) return H00;
  if (i == 0 && j == 1) return H01;
  if (i == 0 && j == 2) return H02;
  if (i == 1 && j == 1) return H11;
  if (i == 1 && j == 2) return H12;
  return H22;
}

std::size_t a_slot(int i, int j) {
  if (i > j) std::swap(i, j);
  if (i == 0 && j == 0) return A00;
  if (i == 0 && j == 1) return A01;
  if (i == 0 && j == 2) return A02;
  if (i == 1 && j == 1) return A11;
  if (i == 1 && j == 2) return A12;
  return A22;
}

std::size_t metric_gradient_slot(int derivative, int i, int j) {
  if (i > j) std::swap(i, j);
  const std::size_t offset = static_cast<std::size_t>(derivative) * 6;
  if (i == 0 && j == 0) return D000 + offset;
  if (i == 0 && j == 1) return D001 + offset;
  if (i == 0 && j == 2) return D002 + offset;
  if (i == 1 && j == 1) return D011 + offset;
  if (i == 1 && j == 2) return D012 + offset;
  return D022 + offset;
}

double h_at(const State &state, std::size_t flat, int i, int j) {
  return state.q[h_slot(i, j)][flat];
}

double a_at(const State &state, std::size_t flat, int i, int j) {
  return state.q[a_slot(i, j)][flat];
}

double d_at(const State &state, std::size_t flat, int derivative, int i, int j) {
  return state.q[metric_gradient_slot(derivative, i, j)][flat];
}

double bgrad_at(const State &state, std::size_t flat, int derivative, int component) {
  return state.q[AuxB00 + static_cast<std::size_t>(3 * derivative + component)][flat];
}

double agrad_at(const State &state, std::size_t flat, int component) {
  return state.q[AuxA0 + static_cast<std::size_t>(component)][flat];
}

double p_at(const State &state, std::size_t flat, int component) {
  return state.q[P0 + static_cast<std::size_t>(component)][flat];
}

double determinant(const Mat3 &value) {
  const double a = mat(value, 0, 0);
  const double b = mat(value, 0, 1);
  const double c = mat(value, 0, 2);
  const double d = mat(value, 1, 0);
  const double e = mat(value, 1, 1);
  const double f = mat(value, 1, 2);
  const double g = mat(value, 2, 0);
  const double h = mat(value, 2, 1);
  const double k = mat(value, 2, 2);
  return a * (e * k - f * h) - b * (d * k - f * g) + c * (d * h - e * g);
}

Mat3 inverse(const Mat3 &value) {
  const double det = determinant(value);
  if (!std::isfinite(det) || std::abs(det) < 1.0e-14)
    fail("singular or non-finite conformal metric in FO-CCZ4 RHS");
  const double a = mat(value, 0, 0);
  const double b = mat(value, 0, 1);
  const double c = mat(value, 0, 2);
  const double d = mat(value, 1, 0);
  const double e = mat(value, 1, 1);
  const double f = mat(value, 1, 2);
  const double g = mat(value, 2, 0);
  const double h = mat(value, 2, 1);
  const double k = mat(value, 2, 2);
  Mat3 result{};
  mat(result, 0, 0) = (e * k - f * h) / det;
  mat(result, 0, 1) = (c * h - b * k) / det;
  mat(result, 0, 2) = (b * f - c * e) / det;
  mat(result, 1, 0) = (f * g - d * k) / det;
  mat(result, 1, 1) = (a * k - c * g) / det;
  mat(result, 1, 2) = (c * d - a * f) / det;
  mat(result, 2, 0) = (d * h - e * g) / det;
  mat(result, 2, 1) = (b * g - a * h) / det;
  mat(result, 2, 2) = (a * e - b * d) / det;
  return result;
}

double beta_derivative_sum(const State &state, std::size_t flat, std::size_t variable,
                           const Vec3 &beta) {
  double result = 0.0;
  for (int axis = 0; axis < 3; ++axis)
    result += beta[static_cast<std::size_t>(axis)] * d1(state, variable, flat, axis);
  return result;
}

double sym_metric_gradient(const State &state, std::size_t flat, int first, int second,
                           int i, int j) {
  return 0.5 * (d1(state, metric_gradient_slot(second, i, j), flat, first) +
                d1(state, metric_gradient_slot(first, i, j), flat, second));
}

double sym_p_gradient(const State &state, std::size_t flat, int first, int second) {
  return 0.5 * (d1(state, P0 + static_cast<std::size_t>(second), flat, first) +
                d1(state, P0 + static_cast<std::size_t>(first), flat, second));
}

double sym_a_gradient(const State &state, std::size_t flat, int first, int second) {
  return 0.5 * (d1(state, AuxA0 + static_cast<std::size_t>(second), flat, first) +
                d1(state, AuxA0 + static_cast<std::size_t>(first), flat, second));
}

double sym_b_gradient(const State &state, std::size_t flat, int component,
                      int first, int second) {
  return 0.5 * (d1(state, AuxB00 + static_cast<std::size_t>(3 * second + component), flat, first) +
                d1(state, AuxB00 + static_cast<std::size_t>(3 * first + component), flat, second));
}

struct FOGeometry {
  Mat3 inverse{};
  Tensor3 d_upup{};
  Tensor3 conformal_christoffel{};
  Tensor3 physical_christoffel{};
  DChrist d_physical_christoffel{};
  Mat3 ricci{};
  Mat3 ricci_z{};
  double scalar = 0.0;
  Vec3 tilde_gamma{};
  Mat3 d_tilde_gamma{};
  Vec3 z_lower{};
  Vec3 z_upper{};
};

FOGeometry geometry_at(const State &state, std::size_t flat) {
  FOGeometry geometry{};
  Mat3 h{};
  for (int i = 0; i < 3; ++i)
    for (int j = 0; j < 3; ++j)
      mat(h, i, j) = h_at(state, flat, i, j);
  geometry.inverse = inverse(h);
  for (int derivative = 0; derivative < 3; ++derivative) {
    for (int i = 0; i < 3; ++i)
      for (int j = 0; j < 3; ++j) {
        double value = 0.0;
        for (int a = 0; a < 3; ++a)
          for (int b = 0; b < 3; ++b)
            value += mat(geometry.inverse, i, a) * mat(geometry.inverse, j, b) *
                     d_at(state, flat, derivative, a, b);
        tensor(geometry.d_upup, derivative, i, j) = value;
      }
  }
  for (int upper = 0; upper < 3; ++upper)
    for (int first = 0; first < 3; ++first)
      for (int second = 0; second < 3; ++second) {
        double value = 0.0;
        for (int ell = 0; ell < 3; ++ell)
          value += mat(geometry.inverse, upper, ell) * (
              d_at(state, flat, first, second, ell) +
              d_at(state, flat, second, first, ell) -
              d_at(state, flat, ell, first, second));
        tensor(geometry.conformal_christoffel, upper, first, second) = value;
        value = 0.0;
        for (int ell = 0; ell < 3; ++ell)
          value += mat(geometry.inverse, upper, ell) * (
              h_at(state, flat, second, ell) * p_at(state, flat, first) +
              h_at(state, flat, first, ell) * p_at(state, flat, second) -
              h_at(state, flat, first, second) * p_at(state, flat, ell));
        tensor(geometry.physical_christoffel, upper, first, second) =
            tensor(geometry.conformal_christoffel, upper, first, second) - value;
      }
  DChrist d_conformal{};
  for (int derivative = 0; derivative < 3; ++derivative)
    for (int upper = 0; upper < 3; ++upper)
      for (int first = 0; first < 3; ++first)
        for (int second = 0; second < 3; ++second) {
          double algebraic = 0.0;
          double differential = 0.0;
          for (int ell = 0; ell < 3; ++ell) {
            algebraic += tensor(geometry.d_upup, derivative, upper, ell) *
                (d_at(state, flat, first, second, ell) +
                 d_at(state, flat, second, first, ell) -
                 d_at(state, flat, ell, first, second));
            differential += mat(geometry.inverse, upper, ell) * (
                sym_metric_gradient(state, flat, derivative, first, ell, second) +
                sym_metric_gradient(state, flat, derivative, second, ell, first) -
                sym_metric_gradient(state, flat, derivative, ell, first, second));
          }
          dchrist(d_conformal, derivative, upper, first, second) =
              -2.0 * algebraic + differential;
        }
  for (int derivative = 0; derivative < 3; ++derivative)
    for (int upper = 0; upper < 3; ++upper)
      for (int first = 0; first < 3; ++first)
        for (int second = 0; second < 3; ++second) {
          double first_term = 0.0;
          double term = 0.0;
          for (int ell = 0; ell < 3; ++ell) {
            first_term -= 2.0 * tensor(geometry.d_upup, derivative, upper, ell) *
                (d_at(state, flat, first, second, ell) +
                 d_at(state, flat, second, first, ell) -
                 d_at(state, flat, ell, first, second));
            term += 2.0 * tensor(geometry.d_upup, derivative, upper, ell) * (
                h_at(state, flat, second, ell) * p_at(state, flat, first) +
                h_at(state, flat, first, ell) * p_at(state, flat, second) -
                h_at(state, flat, first, second) * p_at(state, flat, ell));
            term -= 2.0 * mat(geometry.inverse, upper, ell) * (
                d_at(state, flat, derivative, second, ell) * p_at(state, flat, first) +
                d_at(state, flat, derivative, first, ell) * p_at(state, flat, second) -
                d_at(state, flat, derivative, first, second) * p_at(state, flat, ell));
            term += mat(geometry.inverse, upper, ell) * (
                sym_metric_gradient(state, flat, derivative, first, ell, second) +
                sym_metric_gradient(state, flat, derivative, second, ell, first) -
                sym_metric_gradient(state, flat, derivative, ell, first, second));
            term -= mat(geometry.inverse, upper, ell) * (
                h_at(state, flat, second, ell) * sym_p_gradient(state, flat, derivative, first) +
                h_at(state, flat, first, ell) * sym_p_gradient(state, flat, derivative, second) -
                h_at(state, flat, first, second) * sym_p_gradient(state, flat, derivative, ell));
          }
          dchrist(geometry.d_physical_christoffel, derivative, upper, first, second) =
              first_term + term;
        }
  for (int first = 0; first < 3; ++first)
    for (int second = 0; second < 3; ++second) {
      double value = 0.0;
      const DChrist &d_physical = geometry.d_physical_christoffel;
      for (int upper = 0; upper < 3; ++upper) {
        value += dchrist(d_physical, upper, upper, first, second) -
                 dchrist(d_physical, second, upper, first, upper);
        for (int ell = 0; ell < 3; ++ell)
          value += tensor(geometry.physical_christoffel, ell, first, second) *
                       tensor(geometry.physical_christoffel, upper, ell, upper) -
                   tensor(geometry.physical_christoffel, ell, first, upper) *
                       tensor(geometry.physical_christoffel, upper, ell, second);
      }
      mat(geometry.ricci, first, second) = value;
    }
  for (int upper = 0; upper < 3; ++upper) {
    double value = 0.0;
    for (int j = 0; j < 3; ++j)
      for (int ell = 0; ell < 3; ++ell)
        value += mat(geometry.inverse, j, ell) * tensor(geometry.conformal_christoffel, upper, j, ell);
    geometry.tilde_gamma[static_cast<std::size_t>(upper)] = value;
  }
  for (int derivative = 0; derivative < 3; ++derivative)
    for (int upper = 0; upper < 3; ++upper) {
      double value = 0.0;
      for (int first = 0; first < 3; ++first)
        for (int second = 0; second < 3; ++second)
          value += -2.0 * tensor(geometry.d_upup, derivative, first, second) *
                       tensor(geometry.conformal_christoffel, upper, first, second) +
                   mat(geometry.inverse, first, second) *
                       dchrist(d_conformal, derivative, upper, first, second);
      mat(geometry.d_tilde_gamma, derivative, upper) = value;
    }
  Vec3 gamma_difference{};
  for (int component = 0; component < 3; ++component)
    gamma_difference[static_cast<std::size_t>(component)] =
        state.q[GammaHat0 + static_cast<std::size_t>(component)][flat] -
        geometry.tilde_gamma[static_cast<std::size_t>(component)];
  for (int component = 0; component < 3; ++component) {
    double lower = 0.0;
    for (int ell = 0; ell < 3; ++ell)
      lower += h_at(state, flat, component, ell) * gamma_difference[static_cast<std::size_t>(ell)];
    geometry.z_lower[static_cast<std::size_t>(component)] = 0.5 * lower;
    geometry.z_upper[static_cast<std::size_t>(component)] =
        0.5 * std::exp(2.0 * state.q[LnPhi][flat]) * gamma_difference[static_cast<std::size_t>(component)];
  }
  Mat3 covd_z{};
  for (int first = 0; first < 3; ++first)
    for (int second = 0; second < 3; ++second) {
      double value = 0.0;
      for (int ell = 0; ell < 3; ++ell) {
        value += d_at(state, flat, first, second, ell) * gamma_difference[static_cast<std::size_t>(ell)];
        const double d_gamma = d1(state, GammaHat0 + static_cast<std::size_t>(ell), flat, first);
        value += 0.5 * h_at(state, flat, second, ell) *
                 (d_gamma - mat(geometry.d_tilde_gamma, first, ell));
        value -= tensor(geometry.physical_christoffel, ell, first, second) *
                 geometry.z_lower[static_cast<std::size_t>(ell)];
      }
      mat(covd_z, first, second) = value;
    }
  for (int first = 0; first < 3; ++first)
    for (int second = 0; second < 3; ++second)
      mat(geometry.ricci_z, first, second) = mat(geometry.ricci, first, second) +
          mat(covd_z, first, second) + mat(covd_z, second, first);
  const double chi = std::exp(2.0 * state.q[LnPhi][flat]);
  for (int i = 0; i < 3; ++i)
    for (int j = 0; j < 3; ++j)
      geometry.scalar += chi * mat(geometry.inverse, i, j) * mat(geometry.ricci_z, i, j);
  return geometry;
}

// The C++ shadow uses the same fixed-parameter FO-CCZ4 ordering as the
// Python reference.  These constants are deliberately local to the shadow
// driver: they are not a live-runtime configuration and are not a claim of
// production stability or physical validation.
constexpr double kFoKappa1 = 0.1;
constexpr double kFoKappa2 = 0.0;
constexpr double kFoKappa3 = 1.0;
constexpr double kFoCleaningSpeed = 1.0;
constexpr double kFoOrderingMu = 1.0;
constexpr double kFoShiftStrength = 1.0;
constexpr double kFoTauInverse = 0.0;
constexpr double kFoK0 = 0.0;
constexpr double kFoC = 1.0;
constexpr double kFoLapseCoefficient = 2.0;
constexpr double kFoShiftCoefficient = 1.0;
constexpr double kFoShiftDamping = 0.0;

struct DynamicRHS {
  std::array<std::vector<double>, kVariableCount> q{};

  explicit DynamicRHS(std::size_t points) {
    const auto cells = points * points * points;
    for (auto &component : q) component.assign(cells, 0.0);
  }
};

bool in_prescribed_halo(const State &state, std::size_t flat) {
  if (state.scenario_code != 2) return false;
  for (int axis = 0; axis < 3; ++axis) {
    const auto coordinate = flat % state.points;
    if (coordinate < 2 || coordinate + 2 >= state.points) return true;
    flat /= state.points;
  }
  return false;
}

std::array<double, kVariableCount> schwarzschild_values(const State &state, std::size_t flat) {
  const double dx = (state.domain_upper - state.domain_lower) / (state.points - 1);
  std::array<double, 3> xyz{};
  for (int axis = 2; axis >= 0; --axis) {
    xyz[static_cast<std::size_t>(axis)] = state.domain_lower + (flat % state.points) * dx;
    flat /= state.points;
  }
  const double r = std::sqrt(xyz[0]*xyz[0] + xyz[1]*xyz[1] + xyz[2]*xyz[2]);
  const double u = state.mass / (2.0 * r), psi = 1.0 + u;
  std::array<double, kVariableCount> q{};
  q[H00] = q[H11] = q[H22] = 1.0;
  q[LnAlpha] = std::log((1.0-u)/psi);
  q[LnPhi] = -2.0 * std::log(psi);
  for (std::size_t axis = 0; axis < 3; ++axis) {
    q[AuxA0+axis] = state.mass * xyz[axis] / (r*r*r*(1.0-u*u));
    q[P0+axis] = state.mass * xyz[axis] / (r*r*r*psi);
  }
  return q;
}

void validate_dynamic_state(const State &state) {
  if (state.scenario_code == 2) {
    validate_domain(state.domain_lower, state.domain_upper, state.mass);
    if (state.points < 9 || state.solver_mode_code != 1) fail("invalid Schwarzschild domain mode");
  }
  if (!std::isfinite(state.tau_inverse) || state.tau_inverse < 0.0)
    fail("FO-CCZ4 constraint relaxation rate must be finite and non-negative");
  if (!state.topology || state.topology->points != state.points ||
      state.topology->spatial_order != state.spatial_order ||
      state.topology->adjacent.size() != checked_cells(state.points) ||
      (state.spatial_order == 4 && state.topology->distant.size() != checked_cells(state.points)))
    fail("FO-CCZ4 state requires matching periodic topology");
  validate_profile(state.gauge_profile_code, state.shift_scale, state.ordering_scale);
  for (std::size_t flat = 0; flat < state.points * state.points * state.points; ++flat) {
    if (in_prescribed_halo(state, flat)) {
      const auto expected = schwarzschild_values(state, flat);
      for (std::size_t v = 0; v < kVariableCount; ++v)
        if (!std::isfinite(state.q[v][flat]) || std::abs(state.q[v][flat] - expected[v]) > 2.e-14)
          fail("Schwarzschild analytic halo corrupted; refusing arbitrary frozen data");
    }
    Mat3 h{};
    for (int i = 0; i < 3; ++i)
      for (int j = 0; j < 3; ++j) {
        const double value = h_at(state, flat, i, j);
        if (!std::isfinite(value)) fail("FO-CCZ4 RHS produced a non-finite conformal metric");
        mat(h, i, j) = value;
      }
    const double det = determinant(h);
    if (!std::isfinite(det) || det <= 1.0e-12)
      fail("FO-CCZ4 RHS produced a non-positive conformal metric determinant");
    if (mat(h, 0, 0) <= 0.0 || mat(h, 0, 0) * mat(h, 1, 1) - mat(h, 0, 1) * mat(h, 0, 1) <= 0.0)
      fail("FO-CCZ4 RHS requires a positive definite conformal metric");
    for (const auto &component : state.q)
      if (!std::isfinite(component[flat])) fail("FO-CCZ4 RHS produced a non-finite state slot");
    const double alpha = std::exp(state.q[LnAlpha][flat]);
    const double chi = std::exp(2.0 * state.q[LnPhi][flat]);
    if (!std::isfinite(alpha) || !std::isfinite(chi) || alpha <= 0.0 || chi <= 0.0)
      fail("FO-CCZ4 RHS requires finite positive lapse and chi");
    if (state.gauge_profile_code) {
      if (alpha >= 2.0) fail("gauge profile requires 0 < lapse < 2; no clipping");
      const double f = state.shift_scale * alpha * chi;
      const double mu = state.ordering_scale * chi;
      if (!std::isfinite(f) || !std::isfinite(mu) || f <= 0.0 || mu <= 0.0)
        fail("gauge profile coefficients must remain finite and positive");
    }
  }
}

DynamicRHS fo_rhs(const State &state) {
  DynamicRHS rhs(state.points);
#ifdef NR_K2_HAS_OPENMP
#pragma omp parallel for schedule(static)
#endif
  for (std::int64_t flat_index = 0;
       flat_index < static_cast<std::int64_t>(state.points * state.points * state.points);
       ++flat_index) {
    const auto flat = static_cast<std::size_t>(flat_index);
    // Analytic Dirichlet data: zero all halo RHS at EVERY RK stage.
    // No replacement of the evolved interior or its auxiliary variables.
    if (in_prescribed_halo(state, flat)) continue;
    std::array<double, kVariableCount> local{};
    Mat3 h{};
    Mat3 a{};
    Mat3 d_shift{};
    Mat3 a_upup{};
    Vec3 beta{};
    Vec3 b{};
    Vec3 gamma_hat{};
    Vec3 lapse_gradient{};
    Vec3 p{};
    for (int i = 0; i < 3; ++i) {
      beta[static_cast<std::size_t>(i)] = state.q[Beta0 + static_cast<std::size_t>(i)][flat];
      b[static_cast<std::size_t>(i)] = state.q[B0 + static_cast<std::size_t>(i)][flat];
      gamma_hat[static_cast<std::size_t>(i)] =
          state.q[GammaHat0 + static_cast<std::size_t>(i)][flat];
      lapse_gradient[static_cast<std::size_t>(i)] = agrad_at(state, flat, i);
      p[static_cast<std::size_t>(i)] = p_at(state, flat, i);
      for (int j = 0; j < 3; ++j) {
        mat(h, i, j) = h_at(state, flat, i, j);
        mat(a, i, j) = a_at(state, flat, i, j);
        mat(d_shift, i, j) = bgrad_at(state, flat, i, j);
        mat(a_upup, i, j) = 0.0;
      }
    }
    const double alpha = std::exp(state.q[LnAlpha][flat]);
    const double chi = std::exp(2.0 * state.q[LnPhi][flat]);
    const double shift_f = state.gauge_profile_code ? state.shift_scale * alpha * chi : kFoShiftCoefficient;
    const double ordering_mu = state.gauge_profile_code ? state.ordering_scale * chi : kFoOrderingMu;
    const double trace_k = state.q[TraceK][flat];
    const double theta = state.q[Theta][flat];
    const auto geometry = geometry_at(state, flat);
    const auto &h_inverse = geometry.inverse;
    double trace_a_recomputed = 0.0;
    for (int i = 0; i < 3; ++i)
      for (int j = 0; j < 3; ++j) trace_a_recomputed += mat(h_inverse, i, j) * mat(a, i, j);
    const double trace_a_value = trace_a_recomputed;
    for (int i = 0; i < 3; ++i)
      for (int j = 0; j < 3; ++j) {
        double value = 0.0;
        for (int first = 0; first < 3; ++first)
          for (int second = 0; second < 3; ++second)
            value += mat(h_inverse, i, first) * mat(h_inverse, j, second) * mat(a, first, second);
        mat(a_upup, i, j) = value;
      }
    std::array<Mat3, 3> d_a{};
    std::array<Vec3, 3> d_gamma{};
    std::array<Vec3, 3> d_b{};
    std::array<double, 3> d_k{};
    std::array<double, 3> d_theta{};
    std::array<double, 3> d_metric_trace_a{};
    std::array<double, 3> d_a_contract{};
    for (int derivative = 0; derivative < 3; ++derivative) {
      d_k[static_cast<std::size_t>(derivative)] =
          d1(state, TraceK, flat, derivative);
      d_theta[static_cast<std::size_t>(derivative)] =
          d1(state, Theta, flat, derivative);
      double trace_derivative = 0.0;
      double contract_derivative = 0.0;
      for (int component = 0; component < 3; ++component) {
        d_gamma[static_cast<std::size_t>(derivative)][static_cast<std::size_t>(component)] =
            d1(state, GammaHat0 + static_cast<std::size_t>(component), flat, derivative);
        d_b[static_cast<std::size_t>(derivative)][static_cast<std::size_t>(component)] =
            d1(state, B0 + static_cast<std::size_t>(component), flat, derivative);
      }
      for (int i = 0; i < 3; ++i)
        for (int j = 0; j < 3; ++j) {
          mat(d_a[static_cast<std::size_t>(derivative)], i, j) =
              d1(state, a_slot(i, j), flat, derivative);
          trace_derivative += mat(h_inverse, i, j) *
                              mat(d_a[static_cast<std::size_t>(derivative)], i, j);
          contract_derivative += tensor(geometry.d_upup, derivative, i, j) * mat(a, i, j);
        }
      d_metric_trace_a[static_cast<std::size_t>(derivative)] = trace_derivative;
      d_a_contract[static_cast<std::size_t>(derivative)] = contract_derivative;
    }
    const double div_beta = mat(d_shift, 0, 0) + mat(d_shift, 1, 1) + mat(d_shift, 2, 2);
    Mat3 d_sym_a{};
    std::array<Mat3, 3> d_beta_sym{};
    for (int first = 0; first < 3; ++first)
      for (int second = 0; second < 3; ++second) {
        mat(d_sym_a, first, second) = sym_a_gradient(state, flat, first, second);
        for (int component = 0; component < 3; ++component)
          mat(d_beta_sym[static_cast<std::size_t>(component)], first, second) =
              sym_b_gradient(state, flat, component, first, second);
      }
    Mat3 hess_lapse{};
    for (int first = 0; first < 3; ++first)
      for (int second = 0; second < 3; ++second) {
        double connection = 0.0;
        for (int component = 0; component < 3; ++component)
          connection += tensor(geometry.physical_christoffel, component, first, second) *
                        lapse_gradient[static_cast<std::size_t>(component)];
        mat(hess_lapse, first, second) = alpha * (
            lapse_gradient[static_cast<std::size_t>(first)] *
                lapse_gradient[static_cast<std::size_t>(second)] -
            connection + mat(d_sym_a, first, second));
      }
    double lap_hess = 0.0;
    for (int i = 0; i < 3; ++i)
      for (int j = 0; j < 3; ++j) lap_hess += chi * mat(h_inverse, i, j) * mat(hess_lapse, i, j);

    for (int first = 0; first < 3; ++first)
      for (int second = first; second < 3; ++second) {
        double value = 0.0;
        for (int axis = 0; axis < 3; ++axis)
          value += 2.0 * beta[static_cast<std::size_t>(axis)] *
                   d_at(state, flat, axis, first, second);
        for (int component = 0; component < 3; ++component)
          value += mat(h, component, first) * mat(d_shift, second, component) +
                   mat(h, component, second) * mat(d_shift, first, component);
        value -= (2.0 / 3.0) * mat(h, first, second) * div_beta;
        value -= 2.0 * alpha * (mat(a, first, second) -
                                (1.0 / 3.0) * mat(h, first, second) * trace_a_value);
        if (state.tau_inverse > 0.0)
          value -= state.tau_inverse * (determinant(h) - 1.0) * mat(h, first, second);
        else
          value -= kFoTauInverse * (determinant(h) - 1.0) * mat(h, first, second);
        local[h_slot(first, second)] = value;
      }
    // Eq. (12b,d): these are ODE rows in the first-order reduction.
    // Re-differentiating ln(alpha/phi) silently discards auxiliary violations.
    local[LnAlpha] = -kFoLapseCoefficient * (trace_k - kFoK0 - 2.0 * kFoC * theta);
    for (int axis = 0; axis < 3; ++axis)
      local[LnAlpha] += beta[static_cast<std::size_t>(axis)] * lapse_gradient[static_cast<std::size_t>(axis)];
    for (int component = 0; component < 3; ++component) {
      double value = shift_f * b[static_cast<std::size_t>(component)];
      for (int axis = 0; axis < 3; ++axis)
        value += beta[static_cast<std::size_t>(axis)] * mat(d_shift, axis, component);
      local[Beta0 + static_cast<std::size_t>(component)] = kFoShiftStrength * value;
    }
    local[LnPhi] = (alpha * trace_k - div_beta) / 3.0;
    for (int axis = 0; axis < 3; ++axis)
      local[LnPhi] += beta[static_cast<std::size_t>(axis)] * p[static_cast<std::size_t>(axis)];
    for (int first = 0; first < 3; ++first)
      for (int second = first; second < 3; ++second) {
        double source = chi * (-mat(hess_lapse, first, second) +
                               alpha * mat(geometry.ricci_z, first, second));
        const double trace_source = -lap_hess + alpha * geometry.scalar;
        double value = source - (mat(h, first, second) / 3.0) * trace_source;
        for (int component = 0; component < 3; ++component)
          value += mat(a, component, first) * mat(d_shift, second, component) +
                   mat(a, component, second) * mat(d_shift, first, component);
        value -= (2.0 / 3.0) * mat(a, first, second) * div_beta;
        value += alpha * mat(a, first, second) * (trace_k - 2.0 * kFoC * theta);
        double quadratic = 0.0;
        for (int ell = 0; ell < 3; ++ell) {
          double raised = 0.0;
          for (int m = 0; m < 3; ++m) raised += mat(h_inverse, ell, m) * mat(a, m, second);
          quadratic += mat(a, first, ell) * raised;
        }
        value -= 2.0 * alpha * quadratic;
        if (state.tau_inverse > 0.0)
          value -= state.tau_inverse * mat(h, first, second) * trace_a_value;
        else
          value -= kFoTauInverse * mat(h, first, second) * trace_a_value;
        for (int axis = 0; axis < 3; ++axis)
          value += beta[static_cast<std::size_t>(axis)] *
                   mat(d_a[static_cast<std::size_t>(axis)], first, second);
        local[a_slot(first, second)] = value;
      }
    double k_rhs = -lap_hess + alpha * geometry.scalar +
                   alpha * trace_k * (trace_k - 2.0 * kFoC * theta) -
                   3.0 * alpha * kFoKappa1 * (1.0 + kFoKappa2) * theta;
    for (int axis = 0; axis < 3; ++axis) k_rhs += beta[static_cast<std::size_t>(axis)] * d_k[static_cast<std::size_t>(axis)];
    local[TraceK] = k_rhs;
    double a_contract = 0.0;
    for (int i = 0; i < 3; ++i)
      for (int j = 0; j < 3; ++j) a_contract += mat(a, i, j) * mat(a_upup, i, j);
    double z_grad = 0.0;
    for (int component = 0; component < 3; ++component)
      z_grad += geometry.z_upper[static_cast<std::size_t>(component)] *
                lapse_gradient[static_cast<std::size_t>(component)];
    double theta_rhs = 0.5 * alpha * kFoCleaningSpeed * kFoCleaningSpeed * geometry.scalar +
                       0.5 * alpha * kFoCleaningSpeed * kFoCleaningSpeed *
                           (-a_contract + (2.0 / 3.0) * trace_k * trace_k) -
                       alpha * kFoC * theta * trace_k - alpha * z_grad -
                       alpha * kFoKappa1 * (2.0 + kFoKappa2) * theta;
    for (int axis = 0; axis < 3; ++axis) theta_rhs += beta[static_cast<std::size_t>(axis)] * d_theta[static_cast<std::size_t>(axis)];
    local[Theta] = theta_rhs;

    Vec3 gamma_rhs{};
    Vec3 gamma_nonadvective{};
    for (int component = 0; component < 3; ++component) {
      double value = 0.0;
      for (int axis = 0; axis < 3; ++axis)
        value += beta[static_cast<std::size_t>(axis)] *
                 d_gamma[static_cast<std::size_t>(axis)][static_cast<std::size_t>(component)];
      for (int axis = 0; axis < 3; ++axis) {
        value -= (4.0 / 3.0) * alpha * mat(h_inverse, component, axis) * d_k[static_cast<std::size_t>(axis)];
        value += 2.0 * alpha * mat(h_inverse, component, axis) * d_theta[static_cast<std::size_t>(axis)];
        value += kFoShiftStrength * 2.0 * alpha * mat(h_inverse, component, axis) *
                 d_metric_trace_a[static_cast<std::size_t>(axis)];
      }
      for (int first = 0; first < 3; ++first)
        for (int second = 0; second < 3; ++second) {
          value += kFoShiftStrength * mat(h_inverse, first, second) *
                   mat(d_beta_sym[static_cast<std::size_t>(component)], first, second);
          value += kFoShiftStrength * (1.0 / 3.0) * mat(h_inverse, component, first) *
                   mat(d_beta_sym[static_cast<std::size_t>(second)], first, second);
        }
      // These conformal-connection advection terms are part of the
      // Gamma-hat equation itself, not the shift-driver source.  Keeping
      // them explicit preserves parity with the Python reference on
      // non-uniform shift data.
      value += (2.0 / 3.0) * geometry.tilde_gamma[static_cast<std::size_t>(component)] * div_beta;
      for (int axis = 0; axis < 3; ++axis)
        value -= geometry.tilde_gamma[static_cast<std::size_t>(axis)] *
                 mat(d_shift, axis, component);
      double conformal_p = 0.0;
      double theta_z = 0.0;
      double a_up_p = 0.0;
      double inverse_z = 0.0;
      for (int axis = 0; axis < 3; ++axis) {
        conformal_p += mat(a_upup, component, axis) * p[static_cast<std::size_t>(axis)];
        theta_z += mat(h_inverse, axis, component) *
                   (theta * lapse_gradient[static_cast<std::size_t>(axis)] +
                    (2.0 / 3.0) * trace_k * geometry.z_lower[static_cast<std::size_t>(axis)]);
        a_up_p += mat(a_upup, component, axis) * alpha *
                  lapse_gradient[static_cast<std::size_t>(axis)];
        inverse_z += mat(h_inverse, component, axis) * geometry.z_lower[static_cast<std::size_t>(axis)];
      }
      // Keep the exact Python ordering: Gamma-hat A^{ij} - 3 A^{ij} P_j.
      double christoffel_a = 0.0;
      for (int first = 0; first < 3; ++first)
        for (int second = 0; second < 3; ++second)
          christoffel_a += tensor(geometry.conformal_christoffel, component, first, second) *
                           mat(a_upup, first, second);
      value += 2.0 * alpha * (christoffel_a - 3.0 * conformal_p);
      value -= 2.0 * alpha * theta_z;
      value -= 2.0 * a_up_p;
      value -= 4.0 * kFoShiftStrength * alpha *
               [&]() {
                 double result = 0.0;
                 for (int axis = 0; axis < 3; ++axis)
                   result += mat(h_inverse, component, axis) * d_a_contract[static_cast<std::size_t>(axis)];
                 return result;
               }();
      double z_div = (2.0 / 3.0) * inverse_z * div_beta;
      double z_shift = 0.0;
      for (int j = 0; j < 3; ++j)
        for (int k = 0; k < 3; ++k)
          z_shift += mat(h_inverse, j, k) * geometry.z_lower[static_cast<std::size_t>(j)] *
                     mat(d_shift, k, component);
      value += 2.0 * kFoKappa3 * (z_div - z_shift);
      value -= 2.0 * alpha * kFoKappa1 * inverse_z;
      gamma_rhs[static_cast<std::size_t>(component)] = value;
      gamma_nonadvective[static_cast<std::size_t>(component)] = value -
          beta_derivative_sum(state, flat,
                              GammaHat0 + static_cast<std::size_t>(component), beta);
      local[GammaHat0 + static_cast<std::size_t>(component)] = value;
    }

    for (int derivative = 0; derivative < 3; ++derivative) {
      double aux_a_value = 0.0;
      for (int axis = 0; axis < 3; ++axis)
        aux_a_value += beta[static_cast<std::size_t>(axis)] *
                       d1(state, AuxA0 + static_cast<std::size_t>(derivative), flat, axis);
      aux_a_value -= kFoLapseCoefficient * (d_k[static_cast<std::size_t>(derivative)] -
                                            2.0 * kFoC * d_theta[static_cast<std::size_t>(derivative)]);
      aux_a_value -= kFoShiftStrength * kFoLapseCoefficient *
                     d_metric_trace_a[static_cast<std::size_t>(derivative)];
      aux_a_value += 2.0 * kFoShiftStrength * kFoLapseCoefficient *
                     d_a_contract[static_cast<std::size_t>(derivative)];
      for (int axis = 0; axis < 3; ++axis)
        aux_a_value += mat(d_shift, derivative, axis) * lapse_gradient[static_cast<std::size_t>(axis)];
      local[AuxA0 + static_cast<std::size_t>(derivative)] = aux_a_value;
    }

    for (int derivative = 0; derivative < 3; ++derivative)
      for (int component = 0; component < 3; ++component) {
        double value = 0.0;
        for (int axis = 0; axis < 3; ++axis)
          value += kFoShiftStrength * beta[static_cast<std::size_t>(axis)] *
                   d1(state, AuxB00 + static_cast<std::size_t>(3 * derivative + component), flat, axis);
        value += kFoShiftStrength * shift_f * d_b[static_cast<std::size_t>(derivative)][static_cast<std::size_t>(component)];
        if (state.gauge_profile_code)
          value += kFoShiftStrength * shift_f * (lapse_gradient[static_cast<std::size_t>(derivative)] +
                   2.0 * p[static_cast<std::size_t>(derivative)]) * b[static_cast<std::size_t>(component)];
        double curl_p = 0.0;
        double curl_d = 0.0;
        for (int metric_index = 0; metric_index < 3; ++metric_index) {
          curl_p += mat(h_inverse, component, metric_index) *
                    (d1(state, P0 + static_cast<std::size_t>(metric_index), flat, derivative) -
                     d1(state, P0 + static_cast<std::size_t>(derivative), flat, metric_index));
          double d_term = 0.0;
          for (int upper = 0; upper < 3; ++upper)
            for (int derivative_index = 0; derivative_index < 3; ++derivative_index)
              d_term += mat(h_inverse, upper, derivative_index) *
                        (d1(state, metric_gradient_slot(derivative_index, metric_index, upper), flat, derivative) -
                         d1(state, metric_gradient_slot(derivative, metric_index, upper), flat, derivative_index));
          curl_d += mat(h_inverse, component, metric_index) * d_term;
        }
        // Eq. (12k) puts -s*(... + alpha^2*mu*curl_p -
        // alpha^2*mu*curl_d) on the LHS; moving it to the RHS gives
        // alpha^2*mu*(curl_p - curl_d).
        value += kFoShiftStrength * alpha * alpha * ordering_mu * (curl_p - curl_d);
        for (int axis = 0; axis < 3; ++axis)
          value += kFoShiftStrength * mat(d_shift, derivative, axis) * mat(d_shift, axis, component);
        local[AuxB00 + static_cast<std::size_t>(3 * derivative + component)] = value;
      }

    for (int derivative = 0; derivative < 3; ++derivative)
      for (int first = 0; first < 3; ++first)
        for (int second = first; second < 3; ++second) {
          double value = 0.0;
          for (int axis = 0; axis < 3; ++axis)
            value += beta[static_cast<std::size_t>(axis)] *
                     d1(state, metric_gradient_slot(derivative, first, second), flat, axis);
          for (int component = 0; component < 3; ++component)
            value += kFoShiftStrength * 0.5 *
                     (mat(h, component, first) * mat(d_beta_sym[static_cast<std::size_t>(component)], derivative, second) +
                      mat(h, component, second) * mat(d_beta_sym[static_cast<std::size_t>(component)], derivative, first));
          double beta_trace = 0.0;
          for (int axis = 0; axis < 3; ++axis)
            beta_trace += mat(d_beta_sym[static_cast<std::size_t>(axis)], derivative, axis);
          value -= kFoShiftStrength * (1.0 / 3.0) * mat(h, first, second) * beta_trace;
          value -= alpha * mat(d_a[static_cast<std::size_t>(derivative)], first, second);
          value += (alpha / 3.0) * mat(h, first, second) *
                   d_metric_trace_a[static_cast<std::size_t>(derivative)];
          for (int axis = 0; axis < 3; ++axis) {
            value += mat(d_shift, derivative, axis) * d_at(state, flat, axis, first, second);
            value += mat(d_shift, second, axis) * d_at(state, flat, derivative, axis, first);
            value += mat(d_shift, first, axis) * d_at(state, flat, derivative, axis, second);
          }
          value -= (2.0 / 3.0) * div_beta * d_at(state, flat, derivative, first, second);
          value -= (2.0 / 3.0) * alpha * mat(h, first, second) *
                   d_a_contract[static_cast<std::size_t>(derivative)];
          value -= alpha * lapse_gradient[static_cast<std::size_t>(derivative)] *
                   (mat(a, first, second) - (1.0 / 3.0) * mat(h, first, second) * trace_a_value);
          local[metric_gradient_slot(derivative, first, second)] = value;
        }
    for (int derivative = 0; derivative < 3; ++derivative) {
      double value = 0.0;
      for (int axis = 0; axis < 3; ++axis)
        value += beta[static_cast<std::size_t>(axis)] *
                 d1(state, P0 + static_cast<std::size_t>(derivative), flat, axis);
      value += (alpha / 3.0) * d_k[static_cast<std::size_t>(derivative)];
      double beta_trace = 0.0;
      for (int axis = 0; axis < 3; ++axis)
        beta_trace += mat(d_beta_sym[static_cast<std::size_t>(axis)], derivative, axis);
      value -= (kFoShiftStrength / 3.0) * beta_trace;
      value += (kFoShiftStrength * alpha / 3.0) *
               d_metric_trace_a[static_cast<std::size_t>(derivative)];
      value += (alpha / 3.0) * lapse_gradient[static_cast<std::size_t>(derivative)] * trace_k;
      for (int axis = 0; axis < 3; ++axis)
        value += mat(d_shift, derivative, axis) * p[static_cast<std::size_t>(axis)];
      value -= kFoShiftStrength * (2.0 * alpha / 3.0) *
               d_a_contract[static_cast<std::size_t>(derivative)];
      local[P0 + static_cast<std::size_t>(derivative)] = value;
    }
    for (int component = 0; component < 3; ++component) {
      double value = gamma_nonadvective[static_cast<std::size_t>(component)] -
                     kFoShiftDamping * b[static_cast<std::size_t>(component)];
      for (int axis = 0; axis < 3; ++axis)
        value += beta[static_cast<std::size_t>(axis)] * d_b[static_cast<std::size_t>(axis)][static_cast<std::size_t>(component)];
      local[B0 + static_cast<std::size_t>(component)] = kFoShiftStrength * value;
    }
    for (std::size_t variable = 0; variable < kVariableCount; ++variable)
      rhs.q[variable][flat] = local[variable];
  }
  return rhs;
}

State state_add(const State &state, const DynamicRHS &rhs, double scale) {
  State result = state;
  for (std::size_t variable = 0; variable < kVariableCount; ++variable)
    for (std::size_t flat = 0; flat < result.q[variable].size(); ++flat)
      result.q[variable][flat] += scale * rhs.q[variable][flat];
  return result;
}

void advance_fo(State &state) {
  validate_dynamic_state(state);
  const auto k1 = fo_rhs(state);
  auto stage = state_add(state, k1, 0.5 * state.dt);
  validate_dynamic_state(stage);
  const auto k2 = fo_rhs(stage);
  stage = state_add(state, k2, 0.5 * state.dt);
  validate_dynamic_state(stage);
  const auto k3 = fo_rhs(stage);
  stage = state_add(state, k3, state.dt);
  validate_dynamic_state(stage);
  const auto k4 = fo_rhs(stage);
  const double scale = state.dt / 6.0;
  for (std::size_t variable = 0; variable < kVariableCount; ++variable)
    for (std::size_t flat = 0; flat < state.q[variable].size(); ++flat)
      state.q[variable][flat] += scale *
          (k1.q[variable][flat] + 2.0 * k2.q[variable][flat] +
           2.0 * k3.q[variable][flat] + k4.q[variable][flat]);
  state.time += state.dt;
  validate_dynamic_state(state);
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
        state.q[H00][flat] = 1.0;
        state.q[H11][flat] = 1.0;
        state.q[H22][flat] = 1.0;
        state.q[LnAlpha][flat] = 0.0;
        state.q[LnPhi][flat] = 0.0;
        if (state.scenario_code == 1) {
          const double x = static_cast<double>(i) / static_cast<double>(state.points);
          const double argument = wave_number * (x - time);
          const double h_wave = 1.0 - state.amplitude * std::sin(argument);
          const double h_time = wave_number * state.amplitude * std::cos(argument);
          state.q[H00][flat] = std::pow(h_wave, 2.0 / 3.0);
          state.q[H11][flat] = std::pow(h_wave, -1.0 / 3.0);
          state.q[H22][flat] = state.q[H11][flat];
          state.q[LnAlpha][flat] = 0.5 * std::log(h_wave);
          state.q[LnPhi][flat] = -1.0 / 6.0 * std::log(h_wave);
          state.q[TraceK][flat] = -h_time / (2.0 * std::pow(h_wave, 1.5));
          state.q[A00][flat] = -h_time / (3.0 * std::pow(h_wave, 5.0 / 6.0));
          state.q[A11][flat] = h_time / (6.0 * std::pow(h_wave, 11.0 / 6.0));
          state.q[A22][flat] = state.q[A11][flat];
          state.q[GammaHat0][flat] = -(2.0 / 3.0) * wave_number * state.amplitude *
                                     std::cos(argument) * std::pow(h_wave, -5.0 / 3.0);
        }
      }
    }
  }
  // The auxiliaries use the same centered periodic derivative as Python's
  // build_fo_ccz4_auxiliary_3d, so the checkpoint compares canonical slots,
  // not an implementation-specific analytic derivative.
#ifdef NR_K2_HAS_OPENMP
#pragma omp parallel for schedule(static)
#endif
  for (std::int64_t flat_index = 0;
       flat_index < static_cast<std::int64_t>(state.points * state.points * state.points);
       ++flat_index) {
    const auto flat = static_cast<std::size_t>(flat_index);
    state.q[AuxA0][flat] = d1(state, LnAlpha, flat, 0);
    state.q[AuxA1][flat] = d1(state, LnAlpha, flat, 1);
    state.q[AuxA2][flat] = d1(state, LnAlpha, flat, 2);
    state.q[P0][flat] = d1(state, LnPhi, flat, 0);
    state.q[P1][flat] = d1(state, LnPhi, flat, 1);
    state.q[P2][flat] = d1(state, LnPhi, flat, 2);
    const std::array<std::size_t, 6> metric = {H00, H01, H02, H11, H12, H22};
    const std::array<std::size_t, 6> d0 = {D000, D001, D002, D011, D012, D022};
    const std::array<std::size_t, 6> d1_slots = {D100, D101, D102, D111, D112, D122};
    const std::array<std::size_t, 6> d2 = {D200, D201, D202, D211, D212, D222};
    for (std::size_t local = 0; local < metric.size(); ++local) {
      state.q[d0[local]][flat] = 0.5 * d1(state, metric[local], flat, 0);
      state.q[d1_slots[local]][flat] = 0.5 * d1(state, metric[local], flat, 1);
      state.q[d2[local]][flat] = 0.5 * d1(state, metric[local], flat, 2);
    }
    for (std::size_t derivative = 0; derivative < 3; ++derivative) {
      for (std::size_t component = 0; component < 3; ++component) {
        const auto beta = static_cast<std::size_t>(Beta0 + component);
        state.q[AuxB00 + derivative * 3 + component][flat] = d1(state, beta, flat, static_cast<int>(derivative));
      }
    }
  }
}

void initialize(State &state, const Options &options) {
  state = State(options.points, options.spatial_order);
  state.dt = options.dt;
  state.amplitude = options.amplitude;
  state.wavelength = options.wavelength;
  state.scenario_code = scenario_code_from_name(options.scenario);
  state.formulation_code = formulation_code_from_name(options.formulation);
  state.solver_mode_code = options.solver_mode == "fo-rhs-shadow" ? 1 : 0;
  state.gauge_profile_code = options.gauge_profile_code;
  state.shift_scale = options.shift_scale;
  state.ordering_scale = options.ordering_scale;
  state.tau_inverse = options.tau_inverse;
  state.domain_lower = options.domain_lower;
  state.domain_upper = options.domain_upper;
  state.mass = options.mass;
  if (state.scenario_code == 2) {
    for (std::size_t flat = 0; flat < checked_cells(state.points); ++flat) {
      const auto q = schwarzschild_values(state, flat);
      for (std::size_t v = 0; v < kVariableCount; ++v) state.q[v][flat] = q[v];
    }
    return;
  }
  fill_state_at_time(state, 0.0);
}

void advance(State &state) {
  if (state.solver_mode_code == 1)
    advance_fo(state);
  else
    fill_state_at_time(state, state.time + state.dt);
  ++state.step;
}

void write_bytes(std::ofstream &stream, const void *data, std::size_t size) {
  stream.write(static_cast<const char *>(data), static_cast<std::streamsize>(size));
  if (!stream) fail("failed while writing FO-CCZ4 checkpoint");
}

template <typename T> void write_scalar(std::ofstream &stream, const T &value) {
  write_bytes(stream, &value, sizeof(T));
}

template <typename T> T read_scalar(std::ifstream &stream, const char *name) {
  T value{};
  stream.read(reinterpret_cast<char *>(&value), static_cast<std::streamsize>(sizeof(T)));
  if (!stream) fail(std::string("truncated FO-CCZ4 checkpoint while reading ") + name);
  return value;
}

std::uint64_t checkpoint_version(const State &state) {
  if (state.scenario_code == 2) return kDomainCheckpointVersion;
  return state.tau_inverse > 0.0 ? kControlCheckpointVersion :
         (state.spatial_order == 4 ? kSpatialCheckpointVersion :
          (state.gauge_profile_code ? kProfileCheckpointVersion : kCheckpointVersion));
}

void write_checkpoint(const State &state, const std::string &path) {
  std::ofstream stream(path, std::ios::binary | std::ios::trunc);
  if (!stream) fail("cannot open FO-CCZ4 checkpoint for writing: " + path);
  write_bytes(stream, kCheckpointMagic, sizeof(kCheckpointMagic));
  write_scalar(stream, checkpoint_version(state));
  write_scalar(stream, static_cast<std::uint64_t>(kDimension));
  write_scalar(stream, static_cast<std::uint64_t>(state.points));
  write_scalar(stream, state.scenario_code);
  write_scalar(stream, state.formulation_code);
  write_scalar(stream, state.solver_mode_code);
  write_scalar(stream, static_cast<std::uint64_t>(kVariableCount));
  write_scalar(stream, state.dt);
  write_scalar(stream, state.time);
  write_scalar(stream, state.amplitude);
  write_scalar(stream, state.wavelength);
  write_scalar(stream, state.step);
  if (state.spatial_order == 4 || state.tau_inverse > 0.0 || state.scenario_code == 2) {
    write_scalar(stream, static_cast<std::uint64_t>(state.spatial_order));
    write_scalar(stream, state.gauge_profile_code);
    write_scalar(stream, state.gauge_profile_code ? state.shift_scale : 0.0);
    write_scalar(stream, state.gauge_profile_code ? state.ordering_scale : 0.0);
  } else if (state.gauge_profile_code) {
    write_scalar(stream, state.gauge_profile_code);
    write_scalar(stream, state.shift_scale);
    write_scalar(stream, state.ordering_scale);
  }
  if (state.tau_inverse > 0.0 || state.scenario_code == 2) {
    write_scalar(stream, static_cast<std::uint64_t>(state.tau_inverse > 0.0));
    write_scalar(stream, state.tau_inverse);
  }
  if (state.scenario_code == 2) {
    write_scalar(stream, std::uint64_t{1});
    write_scalar(stream, std::uint64_t{2});
    write_scalar(stream, state.domain_lower);
    write_scalar(stream, state.domain_upper);
    write_scalar(stream, state.mass);
  }
  for (const auto &component : state.q)
    write_bytes(stream, component.data(), component.size() * sizeof(double));
}

State read_checkpoint(const std::string &path) {
  std::ifstream stream(path, std::ios::binary);
  if (!stream) fail("cannot open FO-CCZ4 checkpoint for restart: " + path);
  std::array<char, sizeof(kCheckpointMagic)> magic{};
  stream.read(magic.data(), static_cast<std::streamsize>(magic.size()));
  if (!stream || std::memcmp(magic.data(), kCheckpointMagic, magic.size()) != 0)
    fail("FO-CCZ4 checkpoint magic/version mismatch");
  const auto version = read_scalar<std::uint64_t>(stream, "version");
  if (version != kCheckpointVersion && version != kProfileCheckpointVersion &&
      version != kSpatialCheckpointVersion && version != kControlCheckpointVersion && version != kDomainCheckpointVersion)
    fail("unsupported FO-CCZ4 checkpoint version");
  if (read_scalar<std::uint64_t>(stream, "dimension") != kDimension)
    fail("FO-CCZ4 checkpoint dimension mismatch");
  const auto points = static_cast<std::size_t>(read_scalar<std::uint64_t>(stream, "points"));
  if (points < 5) fail("FO-CCZ4 checkpoint requires at least five grid points");
  const auto scenario = read_scalar<std::uint64_t>(stream, "scenario");
  if (scenario > 2 || ((scenario == 2) != (version == kDomainCheckpointVersion)))
    fail("unsupported FO-CCZ4 checkpoint scenario/version");
  const auto formulation = read_scalar<std::uint64_t>(stream, "formulation");
  if (formulation != 0) fail("FO-CCZ4 checkpoint formulation mismatch");
  const auto solver_mode = read_scalar<std::uint64_t>(stream, "solver mode");
  if (solver_mode > 1) fail("unsupported FO-CCZ4 checkpoint solver mode");
  if (read_scalar<std::uint64_t>(stream, "variable count") != kVariableCount)
    fail("FO-CCZ4 checkpoint variable count mismatch");
  // Read and validate all metadata and exact payload length before allocating.
  State state;
  state.points = points;
  state.scenario_code = scenario;
  state.formulation_code = formulation;
  state.solver_mode_code = solver_mode;
  state.dt = read_scalar<double>(stream, "dt");
  state.time = read_scalar<double>(stream, "time");
  state.amplitude = read_scalar<double>(stream, "amplitude");
  state.wavelength = read_scalar<double>(stream, "wavelength");
  state.step = read_scalar<std::uint64_t>(stream, "step");
  if (version == kProfileCheckpointVersion) {
    state.gauge_profile_code = read_scalar<std::uint64_t>(stream, "gauge profile id");
    state.shift_scale = read_scalar<double>(stream, "shift scale");
    state.ordering_scale = read_scalar<double>(stream, "ordering scale");
    if (state.gauge_profile_code != 1 || state.solver_mode_code != 1)
      fail("checkpoint v2 requires state-dependent gauge profile and dynamic solver");
    validate_profile(state.gauge_profile_code, state.shift_scale, state.ordering_scale);
  }
  if (version == kSpatialCheckpointVersion || version == kControlCheckpointVersion || version == kDomainCheckpointVersion) {
    state.spatial_order = static_cast<std::size_t>(read_scalar<std::uint64_t>(stream, "spatial order"));
    state.gauge_profile_code = read_scalar<std::uint64_t>(stream, "gauge profile id");
    const auto shift_scale = read_scalar<double>(stream, "shift scale");
    const auto ordering_scale = read_scalar<double>(stream, "ordering scale");
    if ((state.spatial_order != 2 && state.spatial_order != 4) ||
        (version == kSpatialCheckpointVersion && state.spatial_order != 4) || state.gauge_profile_code > 1)
      fail("checkpoint v3/v4 spatial order or profile id invalid");
    if (state.gauge_profile_code) {
      if (state.solver_mode_code != 1) fail("checkpoint profile requires dynamic solver");
      state.shift_scale = shift_scale;
      state.ordering_scale = ordering_scale;
      validate_profile(state.gauge_profile_code, shift_scale, ordering_scale);
    } else if (shift_scale != 0.0 || ordering_scale != 0.0) {
      fail("checkpoint legacy profile requires zero reserved coefficients");
    }
  }
  if (version == kControlCheckpointVersion || version == kDomainCheckpointVersion) {
    const auto policy = read_scalar<std::uint64_t>(stream, "constraint control id");
    state.tau_inverse = read_scalar<double>(stream, "tau inverse");
    if (!std::isfinite(state.tau_inverse) || state.tau_inverse < 0.0 ||
        policy != static_cast<std::uint64_t>(state.tau_inverse > 0.0) ||
        (version == kControlCheckpointVersion && state.tau_inverse == 0.0) || state.solver_mode_code != 1)
      fail("checkpoint v4 requires positive relaxation and dynamic solver");
  }
  if (version == kDomainCheckpointVersion) {
    const auto boundary = read_scalar<std::uint64_t>(stream, "boundary id");
    const auto layers = read_scalar<std::uint64_t>(stream, "prescribed halo layers");
    state.domain_lower = read_scalar<double>(stream, "domain lower");
    state.domain_upper = read_scalar<double>(stream, "domain upper");
    state.mass = read_scalar<double>(stream, "mass");
    validate_domain(state.domain_lower, state.domain_upper, state.mass);
    if (boundary != 1 || layers != 2 || points < 9 || state.amplitude != 0.0 || state.wavelength != 1.0)
      fail("invalid Schwarzschild boundary/halo/reserved metadata");
  }
  if (!std::isfinite(state.dt) || state.dt <= 0.0 || !std::isfinite(state.time) || state.time < 0.0 ||
      !std::isfinite(state.amplitude) || std::abs(state.amplitude) >= 1.0 ||
      !std::isfinite(state.wavelength) || state.wavelength <= 0.0)
    fail("invalid FO-CCZ4 checkpoint time/wave metadata");
  const auto payload_start = stream.tellg();
  stream.seekg(0, std::ios::end);
  const auto payload_bytes = static_cast<std::streamoff>(checked_cells(points) * kVariableCount * sizeof(double));
  if (stream.tellg() - payload_start != payload_bytes)
    fail("FO-CCZ4 checkpoint payload length mismatch (truncated or trailing bytes)");
  stream.seekg(payload_start);
  for (auto &component : state.q) component.resize(checked_cells(points));
  for (auto &component : state.q) {
    stream.read(reinterpret_cast<char *>(component.data()),
                static_cast<std::streamsize>(component.size() * sizeof(double)));
    if (!stream) fail("truncated FO-CCZ4 checkpoint while reading state");
  }
  // Derived geometry is rebuilt only after metadata and payload validation;
  // neither its addresses nor its contents belong in checkpoint identities.
  state.topology = std::make_shared<const PeriodicTopology>(points, state.spatial_order);
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
  if (state.spatial_order == 4 || state.tau_inverse > 0.0 || state.scenario_code == 2) {
    const auto order = static_cast<std::uint64_t>(state.spatial_order);
    const double shift_scale = state.gauge_profile_code ? state.shift_scale : 0.0;
    const double ordering_scale = state.gauge_profile_code ? state.ordering_scale : 0.0;
    hash = fnv1a_update(hash, &order, sizeof(order));
    hash = fnv1a_update(hash, &state.gauge_profile_code, sizeof(state.gauge_profile_code));
    hash = fnv1a_update(hash, &shift_scale, sizeof(shift_scale));
    hash = fnv1a_update(hash, &ordering_scale, sizeof(ordering_scale));
  } else if (state.gauge_profile_code) {
    hash = fnv1a_update(hash, &state.gauge_profile_code, sizeof(state.gauge_profile_code));
    hash = fnv1a_update(hash, &state.shift_scale, sizeof(state.shift_scale));
    hash = fnv1a_update(hash, &state.ordering_scale, sizeof(state.ordering_scale));
  }
  if (state.tau_inverse > 0.0 || state.scenario_code == 2) {
    const std::uint64_t policy = static_cast<std::uint64_t>(state.tau_inverse > 0.0);
    hash = fnv1a_update(hash, &policy, sizeof(policy));
    hash = fnv1a_update(hash, &state.tau_inverse, sizeof(state.tau_inverse));
  }
  if (state.scenario_code == 2) {
    const std::uint64_t boundary = 1, layers = 2;
    hash = fnv1a_update(hash, &boundary, sizeof(boundary));
    hash = fnv1a_update(hash, &layers, sizeof(layers));
    hash = fnv1a_update(hash, &state.domain_lower, sizeof(state.domain_lower));
    hash = fnv1a_update(hash, &state.domain_upper, sizeof(state.domain_upper));
    hash = fnv1a_update(hash, &state.mass, sizeof(state.mass));
  }
  for (const auto &component : state.q)
    hash = fnv1a_update(hash, component.data(), component.size() * sizeof(double));
  return hash;
}

std::uint64_t file_checksum(const std::string &path) {
  std::ifstream stream(path, std::ios::binary);
  if (!stream) fail("cannot read FO-CCZ4 checkpoint for checksum: " + path);
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
  const bool exterior = state.scenario_code == 2;
  const double lower = exterior ? state.domain_lower : 0.0;
  const double upper = exterior ? state.domain_upper : 1.0;
  const double dx = (upper - lower) / static_cast<double>(exterior ? state.points - 1 : state.points);
  std::ofstream stream(options.manifest_path, std::ios::trunc);
  if (!stream) fail("cannot open FO-CCZ4 manifest for writing: " + options.manifest_path);
  stream << std::setprecision(17);
  stream << "{\n"
         << "  \"schema_version\": \"nr-run-manifest-v1\",\n"
         << "  \"kernel_id\": \"nr-k2-cpp-openmp-fo-ccz4-shadow\",\n"
         << "  \"kernel_version\": \"0.5.0\",\n"
         << "  \"formulation\": \"fo-ccz4-58-variable-shadow-contract\",\n"
         << "  \"status\": \"shadow\",\n"
         << "  \"promotion\": \""
         << (state.solver_mode_code == 1 ?
             "blocked-pending-fo-ccz4-cpp-cross-backend-and-cpbc" :
             "blocked-pending-fo-ccz4-cpp-rhs-and-cpbc") << "\",\n"
         << "  \"units\": \"geometric-G=c=1\",\n"
         << "  \"coordinate_system\": \"cartesian-3d\",\n"
         << "  \"gauge\": \"advective-1+log-gamma-driver\",\n"
         << "  \"boundary\": \"" << (exterior ? "schwarzschild-dirichlet" : "periodic") << "\",\n"
         << "  \"grid\": {\"shape\": [" << state.points << ", " << state.points << ", "
         << state.points << "], \"lower\": [" << lower << ", " << lower << ", " << lower
         << "], \"upper\": [" << upper << ", " << upper << ", " << upper << "], \"spacing\": ["
         << dx << ", " << dx << ", " << dx << "], \"dt\": " << state.dt
         << ", \"spatial_order\": " << state.spatial_order << "},\n"
         << "  \"diagnostics\": {\n"
         << "    \"scenario\": \"" << (exterior ? "schwarzschild-exterior" :
                                         (state.scenario_code == 0 ? "minkowski" : "gauge-wave")) << "\",\n"
         << "    \"solver_mode\": \""
         << (state.solver_mode_code == 1 ? "fo-ccz4-rhs-shadow-rk4" :
             "analytic-3d-fo-ccz4-contract") << "\",\n"
         << "    \"step\": " << state.step << ",\n"
         << "    \"time\": " << state.time << ",\n"
         << "    \"amplitude\": " << state.amplitude << ",\n"
         << "    \"wavelength\": " << state.wavelength << ",\n"
         << "    \"checkpoint_version\": " << checkpoint_version(state) << ",\n"
         << "    \"spatial_order_bound_to_checkpoint\": true,\n"
         << "    \"spatial_operator\": \"" << (exterior ? "centered-interior-two-fixed-layers" : "centered-periodic") << "\",\n"
         << "    \"numerical_dissipation\": \"none\",\n"
         << "    \"dynamic_rhs_implemented\": "
         << (state.solver_mode_code == 1 ? "true" : "false") << ",\n"
         << "    \"dynamic_evolution_validated\": false,\n"
         << "    \"finite_state_after_step\": true,\n"
         << "    \"positive_conformal_metric_after_step\": true,\n"
         << "    \"fo_ccz4_parameters\": {\"kappa1\": " << kFoKappa1
         << ", \"kappa2\": " << kFoKappa2
         << ", \"kappa3\": " << kFoKappa3
         << ", \"cleaning_speed\": " << kFoCleaningSpeed
         << ", \"ordering_mu\": " << (state.gauge_profile_code ? "null" : "1")
         << ", \"shift_strength\": " << kFoShiftStrength
         << ", \"tau_inverse\": " << state.tau_inverse
         << ", \"k0\": " << kFoK0
         << ", \"c\": " << kFoC
         << ", \"lapse_coefficient\": " << kFoLapseCoefficient
         << ", \"shift_coefficient\": " << (state.gauge_profile_code ? "null" : "1")
         << ", \"shift_damping\": " << kFoShiftDamping << "},\n";
  if (exterior)
    stream << "    \"domain_bound_to_checkpoint\": true,\n"
           << "    \"schwarzschild_domain\": {\"schema_version\": \"nr-schwarzschild-exterior-domain-v1\", "
           << "\"boundary\": \"schwarzschild-dirichlet\", \"lower\": " << lower
           << ", \"upper\": " << upper << ", \"mass\": " << state.mass
           << ", \"frozen_layers\": 2, \"application\": \"zero-rhs-all-58-slots-every-rk-stage\", "
           << "\"physical_boundary_validated\": false, \"horizon_in_domain\": false},\n";
  if (state.gauge_profile_code)
    stream << "    \"gauge_profile_bound_to_checkpoint\": true,\n"
           << "    \"runtime_writeback\": false,\n"
           << "    \"gauge_profile\": {\"schema_version\": \"fo-ccz4-state-dependent-gauge-shadow-v1\", "
           << "\"shift_law\": \"f=shift_scale*alpha*chi\", \"ordering_law\": \"mu=ordering_scale*chi\", "
           << "\"parameters\": {\"shift_scale\": " << state.shift_scale
           << ", \"ordering_scale\": " << state.ordering_scale << "}, \"runtime_writeback\": false},\n";
  stream << "    \"constraint_control_bound_to_checkpoint\": true,\n"
         << "    \"constraint_control\": {\"schema_version\": \"nr-fo-algebraic-relaxation-v1\", "
         << "\"mode\": \"" << (state.tau_inverse > 0.0 ? "finite-rate-relaxation" : "none")
         << "\", \"tau_inverse\": " << state.tau_inverse
         << ", \"application\": \"" << (state.tau_inverse > 0.0 ? "rhs-every-rk-stage" : "none")
         << "\", \"algebraic_projection\": false, \"auxiliary_reconstruction\": false, "
         << "\"physical_validation\": false, \"runtime_writeback\": false},\n";
  // Describe algorithm policy, not this invocation's history. A restart and
  // a direct run at the same state must still have identical manifests.
  stream << "    \"auxiliary_evolution\": {\n"
         << "      \"schema_version\": \"nr-fo-auxiliary-evolution-v1\",\n"
         << "      \"scope\": \"algorithm-policy-not-execution-history\",\n"
         << "      \"fresh_initialization\": \"" << (exterior ? "analytic-schwarzschild-fields-and-auxiliaries" :
                                                       "analytic-fields-with-centered-derivative-auxiliaries") << "\",\n"
         << "      \"checkpoint_restore\": \"all-58-stored-slots-without-reconstruction\",\n"
         << "      \"step_policy\": \""
         << (state.solver_mode_code == 1 ? "independent-58-slot-rk4" :
             "analytic-fields-with-centered-derivative-auxiliaries") << "\",\n"
         << "      \"reconstruct_auxiliaries_during_step\": "
         << (state.solver_mode_code == 1 ? "false" : "true") << ",\n"
         << "      \"algebraic_projection_during_step\": false\n"
         << "    },\n"
         << "    \"checkpoint_deterministic\": true,\n"
         << "    \"checkpoint_present\": true,\n"
         << "    \"state_checksum_fnv1a64\": \"" << hex64(state_hash) << "\",\n"
         << "    \"checkpoint_checksum_fnv1a64\": \"" << hex64(checkpoint_hash) << "\",\n"
         << "    \"variable_count\": " << kVariableCount << ",\n"
         << "    \"ode_variable_count\": 11,\n"
         << "    \"pde_variable_count\": 47,\n"
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
      // read_checkpoint validates the fixed header before returning the
      // state; command-line parity is checked immediately below.
      state = read_checkpoint(options.restart_path);
      if (state.points != options.points) fail("restart points do not match --points");
      if (state.spatial_order != options.spatial_order) fail("restart spatial order does not match --spatial-order");
      if (state.dt != options.dt) fail("restart dt does not match --dt");
      if (state.scenario_code != scenario_code_from_name(options.scenario))
        fail("restart scenario does not match --scenario");
      if (state.formulation_code != formulation_code_from_name(options.formulation))
        fail("restart formulation does not match --formulation");
      if (state.solver_mode_code != (options.solver_mode == "fo-rhs-shadow" ? 1ull : 0ull))
        fail("restart solver mode does not match --solver-mode");
      if (state.amplitude != options.amplitude || state.wavelength != options.wavelength)
        fail("restart wave parameters do not match command line");
      if (state.gauge_profile_code != options.gauge_profile_code ||
          (state.gauge_profile_code && (state.shift_scale != options.shift_scale || state.ordering_scale != options.ordering_scale)))
        fail("restart gauge profile does not match explicit command-line profile");
      if (state.tau_inverse != options.tau_inverse)
        fail("restart constraint control does not match explicit --tau-inverse");
      if (state.scenario_code == 2 && (state.domain_lower != options.domain_lower ||
          state.domain_upper != options.domain_upper || state.mass != options.mass))
        fail("restart Schwarzschild domain/mass does not match command line");
    } else {
      initialize(state, options);
    }
    for (std::size_t step = 0; step < options.steps; ++step) advance(state);
    write_checkpoint(state, options.checkpoint_path);
    write_manifest(state, options, state_checksum(state), file_checksum(options.checkpoint_path));
    std::cout << "nr-k2-fo-ccz4-shadow step=" << state.step << " time=" << std::setprecision(17)
              << state.time << " state_checksum_fnv1a64=" << hex64(state_checksum(state)) << "\n";
    return 0;
  } catch (const std::exception &error) {
    std::cerr << "nr-k2-fo-ccz4-shadow: " << error.what() << '\n';
    return 2;
  }
}
