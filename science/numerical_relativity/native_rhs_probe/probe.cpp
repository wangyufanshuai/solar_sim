// TEST ONLY: read-only state -> instantaneous RHS. No advance and no manifest.
#ifndef NR_SHADOW_SOURCE
#error "Bind the probe to an identity-checked solver source"
#endif
#define main nr_shadow_original_main
#include NR_SHADOW_SOURCE
#undef main

#include <filesystem>

int main(int argc, char **argv) {
  try {
    require_little_endian();
    std::string input, output;
    std::size_t threads = 0;
    for (int i = 1; i < argc; ++i) {
      const std::string key = argv[i];
      if (i+1 >= argc) fail("probe options require values");
      const std::string value = argv[++i];
      if (key == "--input" && input.empty()) input = value;
      else if (key == "--output" && output.empty()) output = value;
      else if (key == "--threads" && threads == 0) threads = parse_size(value, "--threads");
      else fail("unknown or duplicate probe option");
    }
    if (input.empty() || output.empty() || (threads != 1 && threads != 4))
      fail("probe requires input, fresh output and threads 1 or 4");
    if (std::filesystem::exists(output)) fail("probe output already exists");
    const State state = read_checkpoint(input);
    if (state.solver_mode_code != 1) fail("probe requires dynamic checkpoint");
    set_threads(threads);
    int observed = 0;
#pragma omp parallel reduction(+:observed)
    { observed += 1; }
    if (observed != static_cast<int>(threads)) fail("probe thread team mismatch");
    const DynamicRHS rhs = fo_rhs(state);
    // Distinct format: derivatives are not states and must not be restarted.
    const char magic[8] = {'N','R','F','O','R','H','S','1'};
    const std::uint64_t version = 1, points = state.points, variables = kVariableCount;
    std::ofstream stream(output, std::ios::binary | std::ios::out);
    if (!stream) fail("cannot open fresh probe output");
    write_bytes(stream, magic, sizeof(magic));
    write_bytes(stream, &version, sizeof(version));
    write_bytes(stream, &points, sizeof(points));
    write_bytes(stream, &variables, sizeof(variables));
    for (const auto &field : rhs.q) write_bytes(stream, field.data(), field.size()*sizeof(double));
    stream.close();
    if (!stream) fail("cannot finalize probe output");
    std::cout << "{\"schema_version\":\"nr-fo-rhs-inspection-v1\",\"test_only\":true,"
                 "\"evolution_steps\":0,\"observed_threads\":" << observed
              << ",\"points\":" << points << ",\"variable_count\":" << variables << "}\n";
    return 0;
  } catch (const std::exception &error) {
    std::cerr << "nr-fo-rhs-probe: " << error.what() << '\n';
    return 2;
  }
}
