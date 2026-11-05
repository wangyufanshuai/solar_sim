// TEST ONLY: factorial fixed-layer intervention. Not a physical boundary solver.
#ifndef NR_SHADOW_SOURCE
#error "Bind the intervention to an identity-checked solver source"
#endif
#define main nr_shadow_original_main
#include NR_SHADOW_SOURCE
#undef main

#include <cstring>
#include <filesystem>

bool clamp_cell(std::size_t flat, std::uint64_t mode) {
  for (int axis = 0; axis < 3; ++axis) {
    const auto coordinate = flat % 25;
    if (((mode & 1) && coordinate <= 5) || ((mode & 2) && coordinate >= 19)) return true;
    flat /= 25;
  }
  return false;
}

DynamicRHS intervention_rhs(const State &state, std::uint64_t mode) {
  auto rhs = fo_rhs(state); // unchanged actual 58-field RHS and outer halo
  for (std::size_t flat = 0; flat < state.q[0].size(); ++flat)
    if (clamp_cell(flat, mode))
      for (auto &field : rhs.q) field[flat] = 0.0;
  return rhs;
}

void intervention_step(State &state, std::uint64_t mode) {
  validate_dynamic_state(state);
  const auto k1 = intervention_rhs(state, mode);
  auto stage = state_add(state, k1, 0.5*state.dt);
  validate_dynamic_state(stage);
  const auto k2 = intervention_rhs(stage, mode);
  stage = state_add(state, k2, 0.5*state.dt);
  validate_dynamic_state(stage);
  const auto k3 = intervention_rhs(stage, mode);
  stage = state_add(state, k3, state.dt);
  validate_dynamic_state(stage);
  const auto k4 = intervention_rhs(stage, mode);
  const double scale = state.dt/6.0;
  for (std::size_t variable = 0; variable < kVariableCount; ++variable)
    for (std::size_t flat = 0; flat < state.q[variable].size(); ++flat)
      state.q[variable][flat] += scale*(k1.q[variable][flat]+2.0*k2.q[variable][flat]+
                                      2.0*k3.q[variable][flat]+k4.q[variable][flat]);
  state.time += state.dt;
  validate_dynamic_state(state);
}

int main(int argc, char **argv) {
  try {
    require_little_endian();
    std::string input, output, mode_name;
    std::size_t threads = 0, steps = 0;
    for (int i = 1; i < argc; ++i) {
      const std::string key = argv[i];
      if (i+1 >= argc) fail("intervention options require values");
      const std::string value = argv[++i];
      if (key == "--input" && input.empty()) input = value;
      else if (key == "--output" && output.empty()) output = value;
      else if (key == "--clamp" && mode_name.empty()) mode_name = value;
      else if (key == "--threads" && threads == 0) threads = parse_size(value, "--threads");
      else if (key == "--steps" && steps == 0) steps = parse_size(value, "--steps");
      else fail("unknown or duplicate intervention option");
    }
    if (input.empty() || output.empty() || (threads != 1 && threads != 4) || (steps != 1 && steps != 256))
      fail("intervention requires fresh output, threads 1 or 4 and steps 1 or 256");
    const std::vector<std::string> names = {"none", "low", "high", "both"};
    const auto found = std::find(names.begin(), names.end(), mode_name);
    if (found == names.end()) fail("unknown clamp mode");
    const std::uint64_t mode = static_cast<std::uint64_t>(found-names.begin());
    if (std::filesystem::exists(output)) fail("intervention output already exists");
    const State original = read_checkpoint(input);
    if (original.points != 25 || original.solver_mode_code != 1 || original.scenario_code != 2 ||
        original.spatial_order != 4 || original.time != 0.0 || original.step != 0 ||
        original.dt != 1.0/256.0 || original.gauge_profile_code != 1 || original.tau_inverse != 1.0 ||
        original.domain_lower != 0.5 || original.domain_upper != 3.5 || original.mass != 1.0)
      fail("intervention requires frozen T0 n25 [.5,3.5] FD4 Schwarzschild input");
    set_threads(threads);
    int observed = 0;
#pragma omp parallel reduction(+:observed)
    { observed += 1; }
    if (observed != static_cast<int>(threads)) fail("intervention thread team mismatch");
    validate_dynamic_state(original);
    std::ofstream stream(output, std::ios::binary | std::ios::out);
    if (!stream) fail("cannot open fresh intervention output");
    const char magic[8] = {'N','R','H','A','L','O','0','1'};
    const std::uint64_t version = 1, points = 25, variables = 58, records = steps == 1 ? 1 : 5;
    write_bytes(stream, magic, sizeof(magic));
    for (const auto value : {version, points, variables, mode, records}) write_scalar(stream, value);
    State state = original;
    bool ordinary_control = false;
    for (std::size_t step = 1; step <= steps; ++step) {
      intervention_step(state, mode);
      if (step == 1 && mode == 0) {
        State ordinary = original;
        advance_fo(ordinary);
        for (std::size_t v = 0; v < kVariableCount; ++v)
          if (std::memcmp(state.q[v].data(), ordinary.q[v].data(), state.q[v].size()*sizeof(double)) != 0)
            fail("unclamped step differs from ordinary solver");
        ordinary_control = state.time == ordinary.time;
        if (!ordinary_control) fail("unclamped time differs from ordinary solver");
      }
      for (std::size_t flat = 0; flat < state.q[0].size(); ++flat)
        if (clamp_cell(flat, mode) || in_prescribed_halo(state, flat))
          for (std::size_t v = 0; v < kVariableCount; ++v)
            if (std::memcmp(&state.q[v][flat], &original.q[v][flat], sizeof(double)) != 0)
              fail("clamped or outer halo bytes changed");
      if (step == 1 || step == 32 || step == 64 || step == 128 || step == 256) {
        write_scalar(stream, static_cast<std::uint64_t>(step));
        write_scalar(stream, state.time);
        for (const auto &field : state.q) write_bytes(stream, field.data(), field.size()*sizeof(double));
      }
      if (step % 32 == 0) std::cerr << "step " << step << '/' << steps << '\n';
    }
    stream.close();
    if (!stream) fail("cannot finalize intervention output");
    std::cout << "{\"schema\":\"nr-halo-intervention-native-v1\",\"test_only\":true,"
                 "\"points\":25,\"variables\":58,\"clamp\":\"" << mode_name
              << "\",\"steps\":" << steps << ",\"records\":" << records
              << ",\"observed_threads\":" << observed << ",\"fixed_bytes_equal\":true,"
                 "\"ordinary_first_step_bytes_equal\":" << (ordinary_control ? "true" : "false") << "}\n";
    return 0;
  } catch (const std::exception &error) {
    std::cerr << "nr-halo-intervention: " << error.what() << '\n';
    return 2;
  }
}
