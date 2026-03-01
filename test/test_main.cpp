#include <cstdio>
#include <cassert>
#include <cmath>
#include <thread>
#include <chrono>

#include "CTRL/Controller.h"
#include "CTRL/CyclicTask.h"
#include "CTRL/Circuit.h"
#include "CTRL/FunctionBlock.h"
#include "CTRL/FunctionFactory.h"
#include "CTRL/Platform.h"

// -------------------------------------------------------
//  Helpers
// -------------------------------------------------------

static int testsPassed = 0;
static int testsFailed = 0;

#define TEST(name) printf("  %-40s", name)
#define PASS() do { printf("OK\n"); testsPassed++; } while(0)
#define FAIL(msg) do { printf("FAIL: %s\n", msg); testsFailed++; } while(0)

#define ASSERT_EQ_U(a, b) do { \
    if ((a) != (b)) { printf("FAIL: %u != %u\n", (unsigned)(a), (unsigned)(b)); testsFailed++; return; } \
} while(0)

#define ASSERT_EQ_I(a, b) do { \
    if ((a) != (b)) { printf("FAIL: %d != %d\n", (int)(a), (int)(b)); testsFailed++; return; } \
} while(0)

#define ASSERT_NEAR_F(a, b, eps) do { \
    if (std::fabs((a) - (b)) > (eps)) { printf("FAIL: %f != %f\n", (double)(a), (double)(b)); testsFailed++; return; } \
} while(0)

// -------------------------------------------------------
//  Test: IOValue is exactly 4 bytes
// -------------------------------------------------------

void test_iovalue_size() {
    TEST("IOValue is 4 bytes");
    ASSERT_EQ_U(sizeof(IOValue), 4u);
    PASS();
}

// -------------------------------------------------------
//  Test: FunctionBlock basic I/O
// -------------------------------------------------------

void test_function_block_io() {
    TEST("FunctionBlock init and read");
    FunctionFactory factory;
    FunctionBlock* add = factory.createFunction(LIB_ID_MATH, MathLib::FUNC_ID_ADD);
    assert(add != nullptr);

    add->setInput(0, 3.0f);
    add->setInput(1, 7.0f);
    add->update(100);

    ASSERT_NEAR_F(add->outputValue(0).f, 10.0f, 0.001f);
    delete add;
    PASS();
}

// -------------------------------------------------------
//  Test: Connections between blocks
// -------------------------------------------------------

void test_connections() {
    TEST("Connect input to output");
    FunctionFactory factory;
    FunctionBlock* add = factory.createFunction(LIB_ID_MATH_UINT, MathUintLib::FUNC_ID_ADD);
    FunctionBlock* mul = factory.createFunction(LIB_ID_MATH_UINT, MathUintLib::FUNC_ID_MUL);

    add->setInput(0, 3u);
    add->setInput(1, 4u);
    add->update(0);
    ASSERT_EQ_U(add->outputValue(0).u, 7u);

    // Connect mul input 0 to add output 0
    mul->connectInput(0, add, 0);
    mul->setInput(1, 5u);
    mul->update(0);
    ASSERT_EQ_U(mul->outputValue(0).u, 35u);

    // Change add inputs and re-evaluate
    add->setInput(0, 10u);
    add->update(0);
    mul->update(0);
    ASSERT_EQ_U(mul->outputValue(0).u, 70u);

    delete add;
    delete mul;
    PASS();
}

// -------------------------------------------------------
//  Test: Disconnect preserves last value
// -------------------------------------------------------

void test_disconnect() {
    TEST("Disconnect snapshots value");
    FunctionFactory factory;
    FunctionBlock* a = factory.createFunction(LIB_ID_MATH_UINT, MathUintLib::FUNC_ID_ADD);
    FunctionBlock* b = factory.createFunction(LIB_ID_MATH_UINT, MathUintLib::FUNC_ID_ADD);

    a->setInput(0, 42u);
    a->setInput(1, 0u);
    a->update(0);

    b->connectInput(0, a, 0);
    b->setInput(1, 0u);
    b->update(0);
    ASSERT_EQ_U(b->outputValue(0).u, 42u);

    // Disconnect — should snapshot the current value (42)
    b->disconnectInput(0);
    // Change source — should not affect b anymore
    a->setInput(0, 999u);
    a->update(0);
    b->update(0);
    ASSERT_EQ_U(b->outputValue(0).u, 42u);

    delete a;
    delete b;
    PASS();
}

// -------------------------------------------------------
//  Test: Type conversion on connection
// -------------------------------------------------------

void test_type_conversion() {
    TEST("Float-to-uint type conversion");
    FunctionFactory factory;
    FunctionBlock* fmul = factory.createFunction(LIB_ID_MATH, MathLib::FUNC_ID_MUL);
    FunctionBlock* uadd = factory.createFunction(LIB_ID_MATH_UINT, MathUintLib::FUNC_ID_ADD);

    fmul->setInput(0, 3.7f);
    fmul->setInput(1, 1.0f);
    fmul->update(0);
    ASSERT_NEAR_F(fmul->outputValue(0).f, 3.7f, 0.01f);

    // Connect uint input to float output — should auto-convert
    uadd->connectInput(0, fmul, 0);
    uadd->setInput(1, 0u);
    uadd->update(0);
    ASSERT_EQ_U(uadd->outputValue(0).u, 3u);  // truncated float->uint

    delete fmul;
    delete uadd;
    PASS();
}

// -------------------------------------------------------
//  Test: Logic blocks
// -------------------------------------------------------

void test_logic() {
    TEST("Logic AND / OR / NOT");
    FunctionFactory factory;

    FunctionBlock* andBlock = factory.createFunction(LIB_ID_LOGIC, LogicLib::FUNC_ID_AND);
    andBlock->setInput(0, 1u);
    andBlock->setInput(1, 1u);
    andBlock->update(0);
    ASSERT_EQ_U(andBlock->outputValue(0).u, 1u);
    andBlock->setInput(1, 0u);
    andBlock->update(0);
    ASSERT_EQ_U(andBlock->outputValue(0).u, 0u);

    FunctionBlock* orBlock = factory.createFunction(LIB_ID_LOGIC, LogicLib::FUNC_ID_OR);
    orBlock->setInput(0, 0u);
    orBlock->setInput(1, 1u);
    orBlock->update(0);
    ASSERT_EQ_U(orBlock->outputValue(0).u, 1u);

    FunctionBlock* notBlock = factory.createFunction(LIB_ID_LOGIC, LogicLib::FUNC_ID_NOT);
    notBlock->setInput(0, 0u);
    notBlock->update(0);
    ASSERT_EQ_U(notBlock->outputValue(0).u, 1u);

    delete andBlock;
    delete orBlock;
    delete notBlock;
    PASS();
}

// -------------------------------------------------------
//  Test: Circuit composition
// -------------------------------------------------------

void test_circuit() {
    TEST("Circuit composite execution");
    FunctionFactory factory;

    // Build a circuit: add(a,b) -> mul(result, c) -> circuit output
    Circuit* circ = new Circuit(3, 1);

    FunctionBlock* add = factory.createFunction(LIB_ID_MATH, MathLib::FUNC_ID_ADD);
    FunctionBlock* mul = factory.createFunction(LIB_ID_MATH, MathLib::FUNC_ID_MUL);

    add->setInput(0, 2.0f);
    add->setInput(1, 3.0f);
    mul->connectInput(0, add, 0);
    mul->setInput(1, 4.0f);

    circ->addFunction(add);
    circ->addFunction(mul);
    circ->outputRefs[0] = mul->getOutputRef(0);

    circ->update(0);
    ASSERT_NEAR_F(circ->outputValue(0).f, 20.0f, 0.01f);  // (2+3)*4 = 20

    delete circ;  // also deletes add and mul
    PASS();
}

// -------------------------------------------------------
//  Test: CyclicTask scheduling
// -------------------------------------------------------

void test_cyclic_task() {
    TEST("CyclicTask tick scheduling");
    Controller ctrl;
    CyclicTask task(&ctrl, 100);  // 100ms interval
    ctrl.tasks.push_back(&task);

    FunctionFactory factory;
    FunctionBlock* counter = factory.createFunction(LIB_ID_MATH_UINT, MathUintLib::FUNC_ID_ADD);
    counter->setInput(0, 1u);
    counter->connectInput(1, counter, 0);  // feedback: output -> input
    ctrl.addFunction(counter, &task);

    task.start();

    // Simulate time passing by calling tick repeatedly
    // Sleep a bit to let time pass the 100ms interval
    std::this_thread::sleep_for(std::chrono::milliseconds(150));
    ctrl.tick();

    // Counter should have incremented at least once
    if (counter->outputValue(0).u < 1u) {
        FAIL("counter did not increment");
        ctrl.tasks.clear();
        return;
    }

    // Wait for another interval
    std::this_thread::sleep_for(std::chrono::milliseconds(120));
    ctrl.tick();

    if (counter->outputValue(0).u < 2u) {
        FAIL("counter did not increment twice");
        ctrl.tasks.clear();
        return;
    }

    ctrl.tasks.clear();
    delete counter;
    PASS();
}

// -------------------------------------------------------
//  Test: OnDelay timer
// -------------------------------------------------------

void test_on_delay() {
    TEST("OnDelay timer block");
    FunctionFactory factory;
    FunctionBlock* timer = factory.createFunction(LIB_ID_TIMERS, TimerLib::FUNC_ID_ON_DELAY);

    // Inputs: 0=signal, 1=delay_ms, 2=reset
    timer->setInput(0, 1u);       // signal ON
    timer->setInput(1, 100u);     // 100ms delay
    timer->setInput(2, 0u);       // no reset

    // Output should not be high yet
    timer->update(10);
    ASSERT_EQ_U(timer->outputValue(0).u, 0u);

    // Simulate 50ms more (total 60ms, still under 100ms)
    timer->update(50);
    ASSERT_EQ_U(timer->outputValue(0).u, 0u);

    // Simulate enough time to pass delay
    timer->update(50);
    ASSERT_EQ_U(timer->outputValue(0).u, 1u);

    delete timer;
    PASS();
}

// -------------------------------------------------------
//  Test: Platform time works
// -------------------------------------------------------

void test_platform_time() {
    TEST("Platform::getTime() monotonic");
    Time t1 = Platform::getTime();
    std::this_thread::sleep_for(std::chrono::milliseconds(10));
    Time t2 = Platform::getTime();

    if (t2 <= t1) {
        FAIL("time not monotonic");
        return;
    }
    // Should have advanced at least ~10ms = 10000us
    Time diff = t2 - t1;
    if (diff < 5000) {  // Allow some slack
        printf("FAIL: only %lu us elapsed\n", (unsigned long)diff);
        testsFailed++;
        return;
    }
    PASS();
}

// -------------------------------------------------------
//  Main
// -------------------------------------------------------

int main() {
    printf("\n=== CTRL32 Runtime Tests ===\n\n");

    test_iovalue_size();
    test_function_block_io();
    test_connections();
    test_disconnect();
    test_type_conversion();
    test_logic();
    test_circuit();
    test_cyclic_task();
    test_on_delay();
    test_platform_time();

    printf("\n--- Results: %d passed, %d failed ---\n\n", testsPassed, testsFailed);
    return testsFailed > 0 ? 1 : 0;
}
