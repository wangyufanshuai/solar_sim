// TEST ONLY: bind directly to unmodified archived/current solver functions.
// This is not a replacement CLI and does not add zero-step support to it.
#ifndef NR_SHADOW_SOURCE
#error "Bind NR_SHADOW_SOURCE to the identity-checked solver source"
#endif
#define main nr_shadow_original_main
#include NR_SHADOW_SOURCE
#undef main

#include <filesystem>

int main(int argc, char **argv) {
  try {
    require_little_endian();
    // Consume exactly one explicit --steps 0 as an inspector-only contract.
    // Other options retain the real parser's validation. Its default steps=1
    // is unused: this entry point NEVER calls advance or the original main.
    std::vector<char *> forwarded{argv[0]};
    bool has_zero = false;
    for (int i = 1; i < argc; ++i) {
      const std::string argument = argv[i];
      if (argument == "--steps") {
        if (has_zero || i+1 >= argc || std::string(argv[i+1]) != "0")
          fail("inspector requires exactly one --steps 0");
        has_zero = true;
        ++i;
      } else {
        if (argument == "--help" || argument == "-h")
          fail("inspector requires explicit output and zero-step options");
        forwarded.push_back(argv[i]);
      }
    }
    if (!has_zero) fail("inspector requires exactly one --steps 0");
    Options options = parse_options(static_cast<int>(forwarded.size()), forwarded.data());
    set_threads(options.threads);
    if (std::filesystem::exists(options.checkpoint_path) || std::filesystem::exists(options.manifest_path) ||
        std::filesystem::absolute(options.checkpoint_path).lexically_normal() ==
            std::filesystem::absolute(options.manifest_path).lexically_normal())
      fail("inspector requires distinct fresh output paths");
    State state;
    if (options.restart_path.empty()) {
      initialize(state, options);
    } else {
      state = read_checkpoint(options.restart_path);
      if (state.points != options.points || state.spatial_order != options.spatial_order ||
          state.dt != options.dt || state.scenario_code != scenario_code_from_name(options.scenario) ||
          state.formulation_code != formulation_code_from_name(options.formulation) ||
          state.solver_mode_code != (options.solver_mode == "fo-rhs-shadow" ? 1ull : 0ull) ||
          state.amplitude != options.amplitude || state.wavelength != options.wavelength ||
          state.gauge_profile_code != options.gauge_profile_code ||
          (state.gauge_profile_code &&
           (state.shift_scale != options.shift_scale || state.ordering_scale != options.ordering_scale)))
        fail("inspector restart metadata mismatch");
    }
    write_checkpoint(state, options.checkpoint_path);
    write_manifest(state, options, state_checksum(state), file_checksum(options.checkpoint_path));
    std::cout << "{\"test_only\":true,\"execution_kind\":\"function-level-zero-step-inspector\","
                 "\"evolution_steps\":0,\"stored_step\":" << state.step << "}\n";
    return 0;
  } catch (const std::exception &error) {
    std::cerr << "nr-fo-inspect: " << error.what() << '\n';
    return 2;
  }
}
