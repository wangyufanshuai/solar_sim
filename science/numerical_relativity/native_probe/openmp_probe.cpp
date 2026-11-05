// Environment evidence only; this is not a numerical-relativity benchmark.
#include <array>
#include <cstdint>
#include <iostream>
#include <limits>
#include <utility>
#include <omp.h>

static_assert(__cplusplus >= 201703L, "C++17 is required");
static_assert(sizeof(double) == 8 && std::numeric_limits<double>::is_iec559,
              "binary64 is required");

int main() {
  constexpr int requested = 4;
  std::array<int, 256> values{}, owners{};
  int actual = 0;
  omp_set_dynamic(0);
  omp_set_num_threads(requested);
#pragma omp parallel shared(values, owners, actual)
  {
#pragma omp single
    actual = omp_get_num_threads();
#pragma omp for schedule(static)
    for (int i = 0; i < 256; ++i) {
      values[i] = i * i;
      owners[i] = omp_get_thread_num();
    }
  }
  std::int64_t checksum = 0;
  unsigned int worker_mask = 0;
  for (int i = 0; i < 256; ++i) {
    if (values[i] != i * i || owners[i] < 0 || owners[i] >= requested) return 2;
    checksum += values[i];
    worker_mask |= 1U << owners[i];
  }
  const auto [first, last] = std::pair{0, 255};
  const std::int64_t expected = (last - first) * 256LL * 511LL / 6;
  const bool passed = actual == requested && worker_mask == 15U && checksum == expected;
  std::cout << "{\"cpp_standard\":" << __cplusplus
            << ",\"openmp_version\":" << _OPENMP
            << ",\"pointer_bytes\":" << sizeof(void*)
            << ",\"requested_threads\":" << requested
            << ",\"observed_threads\":" << actual
            << ",\"worker_mask\":" << worker_mask
            << ",\"checksum\":" << checksum
            << ",\"expected_checksum\":" << expected
#ifdef _MSC_FULL_VER
            << ",\"msvc_full_version\":" << _MSC_FULL_VER
#endif
            << ",\"passed\":" << (passed ? "true" : "false") << "}\n";
  return passed ? 0 : 2;
}
