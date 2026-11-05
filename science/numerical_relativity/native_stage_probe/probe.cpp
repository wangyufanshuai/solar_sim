// TEST ONLY: one ordinary RK4 step with separately identified stage arrays.
#ifndef NR_SHADOW_SOURCE
#error "Bind the probe to an identity-checked solver source"
#endif
#define main nr_shadow_original_main
#include NR_SHADOW_SOURCE
#undef main

#include <cstring>
#include <filesystem>

template <typename Fields>
void write_stage_fields(std::ofstream &stream, const Fields &q) {
  for (const auto &field : q) write_bytes(stream, field.data(), field.size()*sizeof(double));
}

int main(int argc, char **argv) {
  try {
    require_little_endian();
    std::string input, output;
    std::size_t threads = 0;
    for (int i = 1; i < argc; ++i) {
      const std::string key = argv[i];
      if (i+1 >= argc) fail("stage probe options require values");
      const std::string value = argv[++i];
      if (key == "--input" && input.empty()) input = value;
      else if (key == "--output" && output.empty()) output = value;
      else if (key == "--threads" && threads == 0) threads = parse_size(value, "--threads");
      else fail("unknown or duplicate stage probe option");
    }
    if (input.empty() || output.empty() || (threads != 1 && threads != 4))
      fail("stage probe requires input, fresh output and threads 1 or 4");
    if (std::filesystem::exists(output)) fail("stage probe output already exists");
    const State original = read_checkpoint(input);
    if (original.solver_mode_code != 1 || original.scenario_code != 2 ||
        original.spatial_order != 4 || original.time != 0.0 || original.step != 0 ||
        original.dt != 1.0/256.0 || original.gauge_profile_code != 1 || original.tau_inverse != 1.0)
      fail("stage probe requires the frozen T0 FD4 Schwarzschild contract");
    set_threads(threads);
    int observed = 0;
#pragma omp parallel reduction(+:observed)
    { observed += 1; }
    if (observed != static_cast<int>(threads)) fail("stage probe thread team mismatch");
    validate_dynamic_state(original);
    std::ofstream stream(output, std::ios::binary | std::ios::out);
    if (!stream) fail("cannot open fresh stage output");
    const char magic[8] = {'N','R','R','K','S','T','G','1'};
    const std::uint64_t version = 1, points = original.points, variables = kVariableCount;
    write_bytes(stream, magic, sizeof(magic));
    write_bytes(stream, &version, sizeof(version));
    write_bytes(stream, &points, sizeof(points));
    write_bytes(stream, &variables, sizeof(variables));
    // No new RHS or state-add implementation. Stage labels are file-format
    // positions, not independently evolved solutions at intermediate times.
    const auto k1 = fo_rhs(original);
    write_stage_fields(stream, k1.q);
    auto stage = state_add(original, k1, 0.5*original.dt);
    validate_dynamic_state(stage);
    write_stage_fields(stream, stage.q);
    const auto k2 = fo_rhs(stage);
    write_stage_fields(stream, k2.q);
    stage = state_add(original, k2, 0.5*original.dt);
    validate_dynamic_state(stage);
    write_stage_fields(stream, stage.q);
    const auto k3 = fo_rhs(stage);
    write_stage_fields(stream, k3.q);
    stage = state_add(original, k3, original.dt);
    validate_dynamic_state(stage);
    write_stage_fields(stream, stage.q);
    const auto k4 = fo_rhs(stage);
    write_stage_fields(stream, k4.q);
    State traced = original;
    const double scale = original.dt/6.0;
    for (std::size_t variable = 0; variable < kVariableCount; ++variable)
      for (std::size_t flat = 0; flat < traced.q[variable].size(); ++flat)
        traced.q[variable][flat] += scale*(k1.q[variable][flat]+2.0*k2.q[variable][flat]+
                                         2.0*k3.q[variable][flat]+k4.q[variable][flat]);
    traced.time += traced.dt;
    validate_dynamic_state(traced);
    State ordinary = original;
    advance_fo(ordinary);
    for (std::size_t variable = 0; variable < kVariableCount; ++variable)
      if (std::memcmp(traced.q[variable].data(), ordinary.q[variable].data(),
                      traced.q[variable].size()*sizeof(double)) != 0)
        fail("traced final state differs from ordinary advance_fo");
    if (traced.time != ordinary.time) fail("traced final time differs");
    write_stage_fields(stream, traced.q);
    stream.close();
    if (!stream) fail("cannot finalize stage output");
    std::cout << "{\"schema_version\":\"nr-rk4-stage-inspection-v1\",\"test_only\":true,"
                 "\"evolution_steps\":1,\"observed_threads\":" << observed
              << ",\"points\":" << points << ",\"variable_count\":58,\"blocks\":8,"
                 "\"ordinary_step_bytes_equal\":true}\n";
    return 0;
  } catch (const std::exception &error) {
    std::cerr << "nr-rk4-stage-probe: " << error.what() << '\n';
    return 2;
  }
}
