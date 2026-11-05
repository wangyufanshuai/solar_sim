#define main nr_shadow_application_main
#include "../nr_k2_fo_ccz4_shadow.cpp"
#undef main

void require_exterior(bool value, const char *message) {
  if (!value) throw std::runtime_error(message);
}

int main() {
  try {
    set_threads(1);
    double moment_error = 0.0, halo_error = 0.0;
    for (std::size_t order : {2u, 4u}) {
      Options options;
      options.points = 9;
      options.spatial_order = order;
      options.scenario = "schwarzschild-exterior";
      options.solver_mode = "fo-rhs-shadow";
      options.amplitude = 0.0;
      options.dt = 1.0/256.0;
      options.gauge_profile_code = 1;
      options.tau_inverse = 1.0;
      State state;
      initialize(state, options);
      const auto original = state;
      for (int axis = 0; axis < 3; ++axis) {
        const std::size_t stride = axis == 0 ? 81 : (axis == 1 ? 9 : 1);
        for (int degree = 0; degree <= static_cast<int>(order); ++degree) {
          for (std::size_t flat = 0; flat < checked_cells(9); ++flat) {
            const double x = 1.0 + static_cast<double>((flat/stride)%9)*.25;
            state.q[TraceK][flat] = std::pow(x, degree);
          }
          for (std::size_t flat = 0; flat < checked_cells(9); ++flat) {
            if (in_prescribed_halo(state, flat)) continue;
            const double x = 1.0 + static_cast<double>((flat/stride)%9)*.25;
            const double exact = degree ? degree*std::pow(x, degree-1) : 0.0;
            moment_error = std::max(moment_error, std::abs(d1(state, TraceK, flat, axis)-exact));
          }
        }
      }
      state = original;
      const auto rhs = fo_rhs(state);
      double interior_rhs = 0.0;
      for (std::size_t flat = 0; flat < checked_cells(9); ++flat) {
        if (in_prescribed_halo(state, flat)) {
          for (const auto &q : rhs.q) require_exterior(q[flat] == 0.0, "nonzero prescribed halo RHS");
        } else interior_rhs = std::max(interior_rhs, std::abs(rhs.q[TraceK][flat]));
      }
      require_exterior(interior_rhs > 1.e-10, "interior accidentally frozen");
      advance(state);
      advance(state);
      for (std::size_t flat = 0; flat < checked_cells(9); ++flat)
        if (in_prescribed_halo(state, flat))
          for (std::size_t v = 0; v < kVariableCount; ++v)
            halo_error = std::max(halo_error, std::abs(state.q[v][flat]-original.q[v][flat]));
      state.q[P0][0] += .01;
      bool rejected = false;
      try { validate_dynamic_state(state); } catch (const std::runtime_error &) { rejected = true; }
      require_exterior(rejected, "corrupted boundary accepted");
    }
    require_exterior(moment_error < 2.e-12 && halo_error == 0.0, "stencil/halo invariant failed");
    std::cout << std::setprecision(17) << "{\"passed\":true,\"moment_error\":" << moment_error
              << ",\"halo_error\":" << halo_error << "}\n";
    return 0;
  } catch (const std::exception &error) { std::cerr << error.what() << '\n'; return 2; }
}
