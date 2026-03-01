#ifdef ARDUINO

#include "../Platform.h"
#include <Arduino.h>
#include <WiFi.h>
#include <esp_timer.h>
#include <cstdarg>

namespace Platform
{

uint64_t getTime() {
    return esp_timer_get_time();
}

uint32_t freeHeap() {
    return ESP.getFreeHeap();
}

uint32_t cpuFreq() {
    return ESP.getCpuFreqMHz();
}

int8_t rssi() {
    return WiFi.RSSI();
}

void log(const char* fmt, ...) {
    va_list args;
    va_start(args, fmt);
    char buf[256];
    vsnprintf(buf, sizeof(buf), fmt, args);
    va_end(args);
    Serial.print(buf);
}

}

#endif
