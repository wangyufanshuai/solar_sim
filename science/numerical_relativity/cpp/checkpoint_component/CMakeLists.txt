cmake_minimum_required(VERSION 3.20)
project(nr_native_checkpoint_component LANGUAGES CXX)
if(NOT WIN32 OR NOT MSVC OR NOT CMAKE_SIZEOF_VOID_P EQUAL 8)
  message(FATAL_ERROR "This component requires Windows x64 MSVC")
endif()
find_package(OpenMP REQUIRED COMPONENTS CXX)
add_subdirectory("../rk4_component" "rk4_dependency" EXCLUDE_FROM_ALL)
get_filename_component(repo "${CMAKE_CURRENT_SOURCE_DIR}/../../../.." ABSOLUTE)
set(identity "MSVC=${CMAKE_CXX_COMPILER_VERSION};C++17;/fp:strict;OpenMP;test-fault-hooks-v1\n")
set(sources
  science/numerical_relativity/cpp/checkpoint_component/CMakeLists.txt
  science/numerical_relativity/cpp/checkpoint_component/checkpoint.hpp
  science/numerical_relativity/cpp/checkpoint_component/main.cpp
  science/numerical_relativity/native_checkpoint.py
  science/numerical_relativity/EXPERIMENT-20261010-native-checkpoint-component.md
  scripts/tests/test_nr_native_checkpoint_component.py
  science/numerical_relativity/manifest.py
  science/numerical_relativity/cpp/rk4_component/CMakeLists.txt
  science/numerical_relativity/cpp/rk4_component/rk4.hpp
  science/numerical_relativity/cpp/sat_component/CMakeLists.txt
  science/numerical_relativity/cpp/sat_component/sat.hpp
  science/numerical_relativity/cpp/sbp_volume_component/CMakeLists.txt
  science/numerical_relativity/cpp/sbp_volume_component/sbp42.hpp
  science/numerical_relativity/cpp/sbp_volume_component/volume.hpp
  science/numerical_relativity/cpp/fo_principal_component/fo_principal.hpp
  science/numerical_relativity/cpp/fo_principal_component/coefficients.hpp
  science/numerical_relativity/cpp/characteristic_component/characteristic_split.hpp
  science/numerical_relativity/cpp/characteristic_component/ilp64_lapack.hpp
  science/numerical_relativity/cpp/nr_k2_fo_ccz4_shadow.cpp)
foreach(source IN LISTS sources)
  file(SHA256 "${repo}/${source}" digest)
  string(APPEND identity "${source} ${digest}\n")
  set_property(DIRECTORY APPEND PROPERTY CMAKE_CONFIGURE_DEPENDS "${repo}/${source}")
endforeach()
string(SHA256 source_sha "${identity}")
file(GENERATE OUTPUT "${CMAKE_CURRENT_BINARY_DIR}/source-identity.txt" CONTENT "${identity}" NEWLINE_STYLE UNIX)
file(GENERATE OUTPUT "${CMAKE_CURRENT_BINARY_DIR}/identity.hpp" CONTENT
  "#pragma once\nnamespace nr_checkpoint { inline constexpr char source_sha[] = \"${source_sha}\"; inline constexpr wchar_t tmp_root[] = LR\"(${repo}/tmp)\"; }\n"
  NEWLINE_STYLE UNIX)
add_executable(nr-checkpoint-component main.cpp)
target_include_directories(nr-checkpoint-component PRIVATE "${CMAKE_CURRENT_BINARY_DIR}"
  "${CMAKE_CURRENT_BINARY_DIR}/rk4_dependency/sat_dependency/volume_dependency/generated")
target_compile_features(nr-checkpoint-component PRIVATE cxx_std_17)
set_target_properties(nr-checkpoint-component PROPERTIES CXX_EXTENSIONS OFF)
target_compile_options(nr-checkpoint-component PRIVATE /W4 /permissive- /fp:strict)
target_compile_definitions(nr-checkpoint-component PRIVATE NR_K2_HAS_OPENMP=1)
target_link_libraries(nr-checkpoint-component PRIVATE OpenMP::OpenMP_CXX bcrypt)
