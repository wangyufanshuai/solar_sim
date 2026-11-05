// Exercise the actual implementation in one translation unit, including its
// anonymous-namespace helpers. No separately rewritten cache is tested here.
#define main nr_shadow_application_main
#include "../nr_k2_fo_ccz4_shadow.cpp"
#undef main

std::size_t reference_neighbor(std::size_t flat, std::size_t n, int axis, int delta) {
  std::array<std::size_t, 3> position = {flat / (n * n), (flat / n) % n, flat % n};
  const auto value = static_cast<long long>(position[static_cast<std::size_t>(axis)]) + delta;
  const auto signed_n = static_cast<long long>(n);
  position[static_cast<std::size_t>(axis)] =
      static_cast<std::size_t>((value % signed_n + signed_n) % signed_n);
  return (position[0] * n + position[1]) * n + position[2];
}

void require_test(bool condition, const char *message) {
  if (!condition) throw std::runtime_error(message);
}

int main() {
  try {
    std::uint64_t index_checks = 0, derivative_checks = 0;
    for (std::size_t n : {5u, 6u, 8u, 9u, 13u, 17u, 25u}) {
      State state(n);
      for (std::size_t variable = 0; variable < kVariableCount; ++variable)
        for (std::size_t flat = 0; flat < checked_cells(n); ++flat)
          state.q[variable][flat] = std::sin(0.131 * static_cast<double>(variable + 1) +
                                           0.0031 * static_cast<double>(flat * (variable + 1)));
      for (std::size_t flat = 0; flat < checked_cells(n); ++flat) {
        for (int axis = 0; axis < 3; ++axis) {
          const auto minus = reference_neighbor(flat, n, axis, -1);
          const auto plus = reference_neighbor(flat, n, axis, 1);
          require_test(state.topology->adjacent[flat][static_cast<std::size_t>(2 * axis)] == minus,
                       "periodic minus mapping mismatch");
          require_test(state.topology->adjacent[flat][static_cast<std::size_t>(2 * axis + 1)] == plus,
                       "periodic plus mapping mismatch");
          index_checks += 2;
          for (std::size_t variable = 0; variable < kVariableCount; ++variable) {
            const double expected = (state.q[variable][minus] - state.q[variable][plus]) /
                                    (-2.0 * (1.0 / static_cast<double>(n)));
            const double actual = d1(state, variable, flat, axis);
            require_test(std::memcmp(&expected, &actual, sizeof(double)) == 0,
                         "derivative bytes changed");
            ++derivative_checks;
          }
        }
      }
      const State copy = state;
      require_test(copy.topology.get() == state.topology.get(), "state copy duplicated topology");
      const DynamicRHS zero(n);
      const auto stage = state_add(state, zero, 0.01);
      require_test(stage.topology.get() == state.topology.get(), "RK stage duplicated topology");
    }
    State malformed(5);
    malformed.points = 6;
    bool rejected = false;
    try { validate_dynamic_state(malformed); }
    catch (const std::runtime_error &) { rejected = true; }
    require_test(rejected, "mismatched topology was not rejected before state access");
    malformed.points = 5;
    malformed.topology.reset();
    rejected = false;
    try { validate_dynamic_state(malformed); }
    catch (const std::runtime_error &) { rejected = true; }
    require_test(rejected, "missing topology was not rejected");

    int observed_threads = 1;
#ifdef NR_K2_HAS_OPENMP
    set_threads(4);
#pragma omp parallel
    {
#pragma omp single
      observed_threads = omp_get_num_threads();
    }
#endif
    std::cout << "{\"passed\":true,\"index_checks\":" << index_checks
              << ",\"derivative_bit_checks\":" << derivative_checks
              << ",\"observed_threads\":" << observed_threads << "}\n";
    return 0;
  } catch (const std::exception &error) {
    std::cerr << error.what() << '\n';
    return 2;
  }
}
