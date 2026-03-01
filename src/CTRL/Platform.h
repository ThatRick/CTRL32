#pragma once

#include <cstdint>
#include <cstdio>
#include <cstdlib>
#include <algorithm>

// Platform-specific attribute for placing functions in fast memory
#ifdef ARDUINO
    // ESP32: IRAM_ATTR is defined by the ESP-IDF SDK
    #include "esp_attr.h"
#else
    #define IRAM_ATTR
#endif

namespace Platform
{
    // Microsecond timestamp
    uint64_t getTime();

    // System info
    uint32_t freeHeap();
    uint32_t cpuFreq();
    int8_t   rssi();

    // Logging
    void log(const char* fmt, ...);
}
