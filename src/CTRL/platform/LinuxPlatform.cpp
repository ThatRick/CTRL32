#ifndef ARDUINO

#include "../Platform.h"
#include <chrono>
#include <cstdarg>
#include <cstdio>

namespace Platform
{

static auto startTime = std::chrono::steady_clock::now();

uint64_t getTime() {
    auto now = std::chrono::steady_clock::now();
    return std::chrono::duration_cast<std::chrono::microseconds>(now - startTime).count();
}

uint32_t freeHeap() {
    return 0;  // not meaningful on Linux
}

uint32_t cpuFreq() {
    return 0;  // not meaningful on Linux
}

int8_t rssi() {
    return 0;  // no WiFi on Linux
}

void log(const char* fmt, ...) {
    va_list args;
    va_start(args, fmt);
    vprintf(fmt, args);
    va_end(args);
}

}

#endif
