#define main nr_shadow_application_main
#include "../nr_k2_fo_ccz4_shadow.cpp"
#undef main

void require_order(bool condition, const char *message) {
  if (!condition) throw std::runtime_error(message);
}

std::size_t reference_far(std::size_t flat, std::size_t n, int axis, int delta) {
  std::array<std::size_t, 3> p = {flat / (n * n), (flat / n) % n, flat % n};
  const auto a = static_cast<std::size_t>(axis);
  const auto value = static_cast<long long>(p[a]) + delta;
  p[a] = static_cast<std::size_t>((value + static_cast<long long>(n)) % static_cast<long long>(n));
  return (p[0] * n + p[1]) * n + p[2];
}

int main() {
  try {
    std::uint64_t far_checks = 0;
    for (std::size_t n : {5u, 6u, 8u, 9u, 13u, 17u, 25u}) {
      State state(n, 4);
      for (std::size_t flat = 0; flat < checked_cells(n); ++flat)
        for (int axis = 0; axis < 3; ++axis)
          for (int side = 0; side < 2; ++side) {
            require_order(state.topology->distant[flat][static_cast<std::size_t>(2 * axis + side)] ==
                          reference_far(flat, n, axis, side ? 2 : -2), "far neighbor mapping mismatch");
            ++far_checks;
          }
    }
    double moment_error = 0.0;
    for (int axis = 0; axis < 3; ++axis) {
      State state(9, 4);
      for (int degree = 0; degree <= 4; ++degree) {
        for (std::size_t flat = 0; flat < checked_cells(9); ++flat) {
          const auto coordinate = (flat / (axis == 0 ? 81 : (axis == 1 ? 9 : 1))) % 9;
          state.q[TraceK][flat] = std::pow(static_cast<double>(coordinate) / 9.0, degree);
        }
        const double expected = degree ? degree * std::pow(4.0 / 9.0, degree - 1) : 0.0;
        moment_error = std::max(moment_error, std::abs(d1(state, TraceK, index3(4, 4, 4, 9), axis) - expected));
      }
    }
    require_order(moment_error <= 2.e-13, "fourth-order polynomial moments fail");
    std::uint64_t constant_checks = 0, transverse_checks = 0;
    for (std::size_t n : {5u, 6u, 8u, 9u, 13u, 17u, 25u}) {
      State state(n, 4);
      for (double value : {0.1, -0.3, 1.23456789, 1.e-20, 1.e20}) {
        std::fill(state.q[TraceK].begin(), state.q[TraceK].end(), value);
        for (std::size_t flat = 0; flat < checked_cells(n); ++flat)
          for (int axis = 0; axis < 3; ++axis) {
            require_order(d1(state, TraceK, flat, axis) == 0.0, "constant derivative not exactly zero");
            ++constant_checks;
          }
      }
      for (int normal = 0; normal < 3; ++normal) {
        const std::size_t stride = normal == 0 ? n*n : (normal == 1 ? n : 1);
        for (std::size_t flat = 0; flat < checked_cells(n); ++flat)
          state.q[TraceK][flat] = std::sin(0.731 * static_cast<double>((flat/stride)%n)) + 1.23456789;
        for (std::size_t flat = 0; flat < checked_cells(n); ++flat)
          for (int axis = 0; axis < 3; ++axis)
            if (axis != normal) {
              require_order(d1(state, TraceK, flat, axis) == 0.0, "transverse plane derivative not zero");
              ++transverse_checks;
            }
      }
    }
    State broken(5, 4);
    broken.spatial_order = 2;
    bool rejected = false;
    try { validate_dynamic_state(broken); }
    catch (const std::runtime_error &) { rejected = true; }
    require_order(rejected, "cache/order mismatch accepted");

    std::cout << std::setprecision(17) << "{\"far_index_checks\":" << far_checks
              << ",\"constant_checks\":" << constant_checks << ",\"transverse_checks\":" << transverse_checks
              << ",\"moment_error\":" << moment_error << ",\"manufactured\":[";
    bool first = true;
    // A genuinely 3-D oblique Fourier mode, with unequal signed wave numbers.
    const std::array<int, 3> modes = {1, 2, -1};
    const double pi = std::acos(-1.0);
    for (std::size_t order : {2u, 4u}) {
      for (std::size_t n : {16u, 24u, 32u}) {
        State state(n, order);
        for (std::size_t flat = 0; flat < checked_cells(n); ++flat) {
          const double phase = 2.0 * pi * (static_cast<double>(flat / (n * n)) +
              2.0 * static_cast<double>((flat / n) % n) - static_cast<double>(flat % n)) / static_cast<double>(n);
          state.q[TraceK][flat] = std::sin(phase);
        }
        for (int axis = 0; axis < 3; ++axis) {
          double square_error = 0.0;
          for (std::size_t flat = 0; flat < checked_cells(n); ++flat) {
            const double phase = 2.0 * pi * (static_cast<double>(flat / (n * n)) +
                2.0 * static_cast<double>((flat / n) % n) - static_cast<double>(flat % n)) / static_cast<double>(n);
            const double exact = 2.0 * pi * modes[static_cast<std::size_t>(axis)] * std::cos(phase);
            const double error = d1(state, TraceK, flat, axis) - exact;
            square_error += error * error;
          }
          if (!first) std::cout << ',';
          first = false;
          std::cout << "{\"order\":" << order << ",\"points\":" << n << ",\"axis\":" << axis
                    << ",\"l2\":" << std::sqrt(square_error / static_cast<double>(checked_cells(n))) << '}';
        }
      }
    }
    std::cout << "],\"passed\":true}\n";
    return 0;
  } catch (const std::exception &error) {
    std::cerr << error.what() << '\n';
    return 2;
  }
}
