cmake_minimum_required(VERSION 3.10)
project(CTRL32 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 14)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Core CTRL runtime library
add_library(ctrl
    src/CTRL/FunctionBlock.cpp
    src/CTRL/Controller.cpp
    src/CTRL/CyclicTask.cpp
    src/CTRL/Circuit.cpp
    src/CTRL/Link.cpp
    src/CTRL/platform/LinuxPlatform.cpp
)

target_include_directories(ctrl PUBLIC src)

# Test executables
add_executable(ctrl_test test/test_main.cpp)
target_link_libraries(ctrl_test ctrl)

add_executable(ctrl_test_funclibs test/test_funclibs.cpp)
target_link_libraries(ctrl_test_funclibs ctrl)
