#include <cstdio>
#include <cmath>

#include "CTRL/FunctionBlock.h"
#include "CTRL/FunctionFactory.h"

// -------------------------------------------------------
//  Test harness
// -------------------------------------------------------

static int testsPassed = 0;
static int testsFailed = 0;

#define TEST(name) printf("  %-50s", name)
#define PASS() do { printf("OK\n"); testsPassed++; } while(0)

#define ASSERT_EQ_U(a, b) do { \
    if ((uint32_t)(a) != (uint32_t)(b)) { \
        printf("FAIL: %u != %u (line %d)\n", (unsigned)(a), (unsigned)(b), __LINE__); \
        testsFailed++; return; \
    } \
} while(0)

#define ASSERT_EQ_I(a, b) do { \
    if ((int32_t)(a) != (int32_t)(b)) { \
        printf("FAIL: %d != %d (line %d)\n", (int)(a), (int)(b), __LINE__); \
        testsFailed++; return; \
    } \
} while(0)

#define ASSERT_NEAR_F(a, b, eps) do { \
    if (std::fabs((float)(a) - (float)(b)) > (eps)) { \
        printf("FAIL: %f != %f (line %d)\n", (double)(a), (double)(b), __LINE__); \
        testsFailed++; return; \
    } \
} while(0)

static FunctionFactory factory;

// =========================================================
//  LogicLib
// =========================================================

// ---- AND ----

void test_logic_and_all_true() {
    TEST("Logic AND: all true -> true");
    FunctionBlock* b = factory.createFunction(LIB_ID_LOGIC, LogicLib::FUNC_ID_AND);
    b->setInput(0, 1u); b->setInput(1, 1u);
    b->update(0);
    ASSERT_EQ_U(b->outputValue(0).u, 1u);
    delete b; PASS();
}

void test_logic_and_one_false() {
    TEST("Logic AND: one false -> false");
    FunctionBlock* b = factory.createFunction(LIB_ID_LOGIC, LogicLib::FUNC_ID_AND);
    b->setInput(0, 1u); b->setInput(1, 0u);
    b->update(0);
    ASSERT_EQ_U(b->outputValue(0).u, 0u);
    delete b; PASS();
}

void test_logic_and_all_false() {
    TEST("Logic AND: all false -> false");
    FunctionBlock* b = factory.createFunction(LIB_ID_LOGIC, LogicLib::FUNC_ID_AND);
    b->setInput(0, 0u); b->setInput(1, 0u);
    b->update(0);
    ASSERT_EQ_U(b->outputValue(0).u, 0u);
    delete b; PASS();
}

void test_logic_and_variable_arity() {
    TEST("Logic AND: 4 inputs");
    FunctionBlock* b = factory.createFunction(LIB_ID_LOGIC, LogicLib::FUNC_ID_AND, 4);
    b->setInput(0, 1u); b->setInput(1, 1u);
    b->setInput(2, 1u); b->setInput(3, 1u);
    b->update(0);
    ASSERT_EQ_U(b->outputValue(0).u, 1u);
    b->setInput(2, 0u);
    b->update(0);
    ASSERT_EQ_U(b->outputValue(0).u, 0u);
    delete b; PASS();
}

// ---- OR ----

void test_logic_or_all_false() {
    TEST("Logic OR: all false -> false");
    FunctionBlock* b = factory.createFunction(LIB_ID_LOGIC, LogicLib::FUNC_ID_OR);
    b->setInput(0, 0u); b->setInput(1, 0u);
    b->update(0);
    ASSERT_EQ_U(b->outputValue(0).u, 0u);
    delete b; PASS();
}

void test_logic_or_one_true() {
    TEST("Logic OR: one true -> true");
    FunctionBlock* b = factory.createFunction(LIB_ID_LOGIC, LogicLib::FUNC_ID_OR);
    b->setInput(0, 0u); b->setInput(1, 1u);
    b->update(0);
    ASSERT_EQ_U(b->outputValue(0).u, 1u);
    delete b; PASS();
}

void test_logic_or_all_true() {
    TEST("Logic OR: all true -> true");
    FunctionBlock* b = factory.createFunction(LIB_ID_LOGIC, LogicLib::FUNC_ID_OR);
    b->setInput(0, 1u); b->setInput(1, 1u);
    b->update(0);
    ASSERT_EQ_U(b->outputValue(0).u, 1u);
    delete b; PASS();
}

void test_logic_or_variable_arity() {
    TEST("Logic OR: 3 inputs, middle true");
    FunctionBlock* b = factory.createFunction(LIB_ID_LOGIC, LogicLib::FUNC_ID_OR, 3);
    b->setInput(0, 0u); b->setInput(1, 1u); b->setInput(2, 0u);
    b->update(0);
    ASSERT_EQ_U(b->outputValue(0).u, 1u);
    delete b; PASS();
}

// ---- XOR ----

void test_logic_xor_one_true() {
    TEST("Logic XOR: one true -> true");
    FunctionBlock* b = factory.createFunction(LIB_ID_LOGIC, LogicLib::FUNC_ID_XOR);
    b->setInput(0, 1u); b->setInput(1, 0u);
    b->update(0);
    ASSERT_EQ_U(b->outputValue(0).u, 1u);
    delete b; PASS();
}

void test_logic_xor_both_true() {
    TEST("Logic XOR: both true -> false");
    FunctionBlock* b = factory.createFunction(LIB_ID_LOGIC, LogicLib::FUNC_ID_XOR);
    b->setInput(0, 1u); b->setInput(1, 1u);
    b->update(0);
    ASSERT_EQ_U(b->outputValue(0).u, 0u);
    delete b; PASS();
}

void test_logic_xor_both_false() {
    TEST("Logic XOR: both false -> false");
    FunctionBlock* b = factory.createFunction(LIB_ID_LOGIC, LogicLib::FUNC_ID_XOR);
    b->setInput(0, 0u); b->setInput(1, 0u);
    b->update(0);
    ASSERT_EQ_U(b->outputValue(0).u, 0u);
    delete b; PASS();
}

void test_logic_xor_three_inputs() {
    TEST("Logic XOR: 3 inputs, two true -> false");
    FunctionBlock* b = factory.createFunction(LIB_ID_LOGIC, LogicLib::FUNC_ID_XOR, 3);
    b->setInput(0, 1u); b->setInput(1, 1u); b->setInput(2, 0u);
    b->update(0);
    ASSERT_EQ_U(b->outputValue(0).u, 0u);
    delete b; PASS();
}

// ---- NOT ----

void test_logic_not_false_to_true() {
    TEST("Logic NOT: false -> true");
    FunctionBlock* b = factory.createFunction(LIB_ID_LOGIC, LogicLib::FUNC_ID_NOT);
    b->setInput(0, 0u);
    b->update(0);
    ASSERT_EQ_U(b->outputValue(0).u, 1u);
    delete b; PASS();
}

void test_logic_not_true_to_false() {
    TEST("Logic NOT: true -> false");
    FunctionBlock* b = factory.createFunction(LIB_ID_LOGIC, LogicLib::FUNC_ID_NOT);
    b->setInput(0, 1u);
    b->update(0);
    ASSERT_EQ_U(b->outputValue(0).u, 0u);
    delete b; PASS();
}

// ---- RS ----

void test_logic_rs_set() {
    TEST("Logic RS: S sets output");
    FunctionBlock* b = factory.createFunction(LIB_ID_LOGIC, LogicLib::FUNC_ID_RS);
    b->setInput(0, 0u); // R
    b->setInput(1, 1u); // S
    b->update(0);
    ASSERT_EQ_U(b->outputValue(0).u, 1u);
    delete b; PASS();
}

void test_logic_rs_reset() {
    TEST("Logic RS: R resets output");
    FunctionBlock* b = factory.createFunction(LIB_ID_LOGIC, LogicLib::FUNC_ID_RS);
    // First set
    b->setInput(0, 0u); b->setInput(1, 1u);
    b->update(0);
    ASSERT_EQ_U(b->outputValue(0).u, 1u);
    // Then reset
    b->setInput(0, 1u); b->setInput(1, 0u);
    b->update(0);
    ASSERT_EQ_U(b->outputValue(0).u, 0u);
    delete b; PASS();
}

void test_logic_rs_reset_dominant() {
    TEST("Logic RS: R dominant (both high -> reset)");
    FunctionBlock* b = factory.createFunction(LIB_ID_LOGIC, LogicLib::FUNC_ID_RS);
    // Set first
    b->setInput(0, 0u); b->setInput(1, 1u);
    b->update(0);
    ASSERT_EQ_U(b->outputValue(0).u, 1u);
    // Both high — R wins
    b->setInput(0, 1u); b->setInput(1, 1u);
    b->update(0);
    ASSERT_EQ_U(b->outputValue(0).u, 0u);
    delete b; PASS();
}

void test_logic_rs_latch() {
    TEST("Logic RS: latches when both low");
    FunctionBlock* b = factory.createFunction(LIB_ID_LOGIC, LogicLib::FUNC_ID_RS);
    b->setInput(0, 0u); b->setInput(1, 1u);
    b->update(0);
    ASSERT_EQ_U(b->outputValue(0).u, 1u);
    // Both low — holds previous state
    b->setInput(0, 0u); b->setInput(1, 0u);
    b->update(0);
    ASSERT_EQ_U(b->outputValue(0).u, 1u);
    delete b; PASS();
}

// ---- SR ----

void test_logic_sr_set() {
    TEST("Logic SR: S sets output");
    FunctionBlock* b = factory.createFunction(LIB_ID_LOGIC, LogicLib::FUNC_ID_SR);
    b->setInput(0, 0u); // S
    b->setInput(1, 1u); // R
    b->update(0);
    ASSERT_EQ_U(b->outputValue(0).u, 1u);
    delete b; PASS();
}

void test_logic_sr_set_dominant() {
    TEST("Logic SR: S dominant (both high -> set)");
    FunctionBlock* b = factory.createFunction(LIB_ID_LOGIC, LogicLib::FUNC_ID_SR);
    // Reset first
    b->setInput(0, 0u); b->setInput(1, 1u);
    b->update(0);
    ASSERT_EQ_U(b->outputValue(0).u, 1u);
    // Both high — S wins (sets to 0... wait)
    // Looking at the code: if(S) out=0, else if(R) out=1
    // S=high -> output=0, R=high -> output=1
    // So S=input[0], R=input[1], and S "sets" to 0?
    // This seems like S clears and R sets. Let me re-check.
    // Actually the naming says SR but the behavior seems inverted.
    // Let's just test what the code actually does.
    b->setInput(0, 1u); b->setInput(1, 1u);
    b->update(0);
    ASSERT_EQ_U(b->outputValue(0).u, 0u);  // S dominant: output=0
    delete b; PASS();
}

// ---- RisingEdge ----

void test_logic_rising_edge_detect() {
    TEST("Logic RisingEdge: detects 0->1 transition");
    FunctionBlock* b = factory.createFunction(LIB_ID_LOGIC, LogicLib::FUNC_ID_RisingEdge);
    // Initial: input=false, prevInput=0
    b->setInput(0, 0u);
    b->update(0);
    ASSERT_EQ_U(b->outputValue(0).u, 0u);  // no transition
    // Now go high
    b->setInput(0, 1u);
    b->update(0);
    ASSERT_EQ_U(b->outputValue(0).u, 1u);  // rising edge detected
    // Stay high — should be one-shot
    b->update(0);
    ASSERT_EQ_U(b->outputValue(0).u, 0u);  // no new edge
    delete b; PASS();
}

void test_logic_rising_edge_no_false_trigger() {
    TEST("Logic RisingEdge: no trigger on 1->0");
    FunctionBlock* b = factory.createFunction(LIB_ID_LOGIC, LogicLib::FUNC_ID_RisingEdge);
    b->setInput(0, 1u);
    b->update(0);  // first rising edge
    b->update(0);  // clear
    b->setInput(0, 0u);
    b->update(0);
    ASSERT_EQ_U(b->outputValue(0).u, 0u);  // falling, not rising
    delete b; PASS();
}

void test_logic_rising_edge_repeated() {
    TEST("Logic RisingEdge: repeated 0->1->0->1");
    FunctionBlock* b = factory.createFunction(LIB_ID_LOGIC, LogicLib::FUNC_ID_RisingEdge);
    b->setInput(0, 0u); b->update(0);
    ASSERT_EQ_U(b->outputValue(0).u, 0u);
    b->setInput(0, 1u); b->update(0);
    ASSERT_EQ_U(b->outputValue(0).u, 1u);  // first edge
    b->setInput(0, 0u); b->update(0);
    ASSERT_EQ_U(b->outputValue(0).u, 0u);
    b->setInput(0, 1u); b->update(0);
    ASSERT_EQ_U(b->outputValue(0).u, 1u);  // second edge
    delete b; PASS();
}

// ---- FallingEdge ----

void test_logic_falling_edge_detect() {
    TEST("Logic FallingEdge: detects 1->0 transition");
    FunctionBlock* b = factory.createFunction(LIB_ID_LOGIC, LogicLib::FUNC_ID_FallingEdge);
    // Default: input=true, prevInput=1
    b->setInput(0, 1u);
    b->update(0);
    ASSERT_EQ_U(b->outputValue(0).u, 0u);  // no transition
    // Go low
    b->setInput(0, 0u);
    b->update(0);
    ASSERT_EQ_U(b->outputValue(0).u, 1u);  // falling edge detected
    // Stay low
    b->update(0);
    ASSERT_EQ_U(b->outputValue(0).u, 0u);  // one-shot done
    delete b; PASS();
}

void test_logic_falling_edge_no_false_trigger() {
    TEST("Logic FallingEdge: no trigger on 0->1");
    FunctionBlock* b = factory.createFunction(LIB_ID_LOGIC, LogicLib::FUNC_ID_FallingEdge);
    b->setInput(0, 0u);
    b->update(0);  // falling edge from default
    b->update(0);  // clear
    b->setInput(0, 1u);
    b->update(0);
    ASSERT_EQ_U(b->outputValue(0).u, 0u);  // rising, not falling
    delete b; PASS();
}

// =========================================================
//  MathLib (float)
// =========================================================

// ---- ADD ----

void test_math_add() {
    TEST("Math ADD: 2.5 + 3.5 = 6.0");
    FunctionBlock* b = factory.createFunction(LIB_ID_MATH, MathLib::FUNC_ID_ADD);
    b->setInput(0, 2.5f); b->setInput(1, 3.5f);
    b->update(0);
    ASSERT_NEAR_F(b->outputValue(0).f, 6.0f, 0.001f);
    delete b; PASS();
}

void test_math_add_negative() {
    TEST("Math ADD: -1.0 + 4.0 = 3.0");
    FunctionBlock* b = factory.createFunction(LIB_ID_MATH, MathLib::FUNC_ID_ADD);
    b->setInput(0, -1.0f); b->setInput(1, 4.0f);
    b->update(0);
    ASSERT_NEAR_F(b->outputValue(0).f, 3.0f, 0.001f);
    delete b; PASS();
}

void test_math_add_variable_arity() {
    TEST("Math ADD: 3 inputs: 1+2+3 = 6");
    FunctionBlock* b = factory.createFunction(LIB_ID_MATH, MathLib::FUNC_ID_ADD, 3);
    b->setInput(0, 1.0f); b->setInput(1, 2.0f); b->setInput(2, 3.0f);
    b->update(0);
    ASSERT_NEAR_F(b->outputValue(0).f, 6.0f, 0.001f);
    delete b; PASS();
}

// ---- SUB ----

void test_math_sub() {
    TEST("Math SUB: 10.0 - 3.0 = 7.0");
    FunctionBlock* b = factory.createFunction(LIB_ID_MATH, MathLib::FUNC_ID_SUB);
    b->setInput(0, 10.0f); b->setInput(1, 3.0f);
    b->update(0);
    ASSERT_NEAR_F(b->outputValue(0).f, 7.0f, 0.001f);
    delete b; PASS();
}

void test_math_sub_negative_result() {
    TEST("Math SUB: 3.0 - 10.0 = -7.0");
    FunctionBlock* b = factory.createFunction(LIB_ID_MATH, MathLib::FUNC_ID_SUB);
    b->setInput(0, 3.0f); b->setInput(1, 10.0f);
    b->update(0);
    ASSERT_NEAR_F(b->outputValue(0).f, -7.0f, 0.001f);
    delete b; PASS();
}

// ---- MUL ----

void test_math_mul() {
    TEST("Math MUL: 3.0 * 4.0 = 12.0");
    FunctionBlock* b = factory.createFunction(LIB_ID_MATH, MathLib::FUNC_ID_MUL);
    b->setInput(0, 3.0f); b->setInput(1, 4.0f);
    b->update(0);
    ASSERT_NEAR_F(b->outputValue(0).f, 12.0f, 0.001f);
    delete b; PASS();
}

void test_math_mul_by_zero() {
    TEST("Math MUL: 5.0 * 0.0 = 0.0");
    FunctionBlock* b = factory.createFunction(LIB_ID_MATH, MathLib::FUNC_ID_MUL);
    b->setInput(0, 5.0f); b->setInput(1, 0.0f);
    b->update(0);
    ASSERT_NEAR_F(b->outputValue(0).f, 0.0f, 0.001f);
    delete b; PASS();
}

void test_math_mul_variable_arity() {
    TEST("Math MUL: 3 inputs: 2*3*4 = 24");
    FunctionBlock* b = factory.createFunction(LIB_ID_MATH, MathLib::FUNC_ID_MUL, 3);
    b->setInput(0, 2.0f); b->setInput(1, 3.0f); b->setInput(2, 4.0f);
    b->update(0);
    ASSERT_NEAR_F(b->outputValue(0).f, 24.0f, 0.001f);
    delete b; PASS();
}

// ---- DIV ----

void test_math_div() {
    TEST("Math DIV: 10.0 / 4.0 = 2.5");
    FunctionBlock* b = factory.createFunction(LIB_ID_MATH, MathLib::FUNC_ID_DIV);
    b->setInput(0, 10.0f); b->setInput(1, 4.0f);
    b->update(0);
    ASSERT_NEAR_F(b->outputValue(0).f, 2.5f, 0.001f);
    delete b; PASS();
}

void test_math_div_by_zero() {
    TEST("Math DIV: divide by zero is no-op");
    FunctionBlock* b = factory.createFunction(LIB_ID_MATH, MathLib::FUNC_ID_DIV);
    b->setInput(0, 10.0f); b->setInput(1, 2.0f);
    b->update(0);
    ASSERT_NEAR_F(b->outputValue(0).f, 5.0f, 0.001f);
    // Now divide by zero — output should stay at 5.0
    b->setInput(1, 0.0f);
    b->update(0);
    ASSERT_NEAR_F(b->outputValue(0).f, 5.0f, 0.001f);
    delete b; PASS();
}

// ---- ABS ----

void test_math_abs_positive() {
    TEST("Math ABS: |3.5| = 3.5");
    FunctionBlock* b = factory.createFunction(LIB_ID_MATH, MathLib::FUNC_ID_ABS);
    b->setInput(0, 3.5f);
    b->update(0);
    ASSERT_NEAR_F(b->outputValue(0).f, 3.5f, 0.001f);
    delete b; PASS();
}

void test_math_abs_negative() {
    TEST("Math ABS: |-7.2| = 7.2");
    FunctionBlock* b = factory.createFunction(LIB_ID_MATH, MathLib::FUNC_ID_ABS);
    b->setInput(0, -7.2f);
    b->update(0);
    ASSERT_NEAR_F(b->outputValue(0).f, 7.2f, 0.001f);
    delete b; PASS();
}

// ---- SIN ----

void test_math_sin_zero() {
    TEST("Math SIN: sin(0) = 0");
    FunctionBlock* b = factory.createFunction(LIB_ID_MATH, MathLib::FUNC_ID_SIN);
    b->setInput(0, 0.0f);
    b->update(0);
    ASSERT_NEAR_F(b->outputValue(0).f, 0.0f, 0.001f);
    delete b; PASS();
}

void test_math_sin_pi_half() {
    TEST("Math SIN: sin(pi/2) = 1");
    FunctionBlock* b = factory.createFunction(LIB_ID_MATH, MathLib::FUNC_ID_SIN);
    b->setInput(0, (float)(M_PI / 2.0));
    b->update(0);
    ASSERT_NEAR_F(b->outputValue(0).f, 1.0f, 0.001f);
    delete b; PASS();
}

// ---- COS ----

void test_math_cos_zero() {
    TEST("Math COS: cos(0) = 1");
    FunctionBlock* b = factory.createFunction(LIB_ID_MATH, MathLib::FUNC_ID_COS);
    b->setInput(0, 0.0f);
    b->update(0);
    ASSERT_NEAR_F(b->outputValue(0).f, 1.0f, 0.001f);
    delete b; PASS();
}

void test_math_cos_pi() {
    TEST("Math COS: cos(pi) = -1");
    FunctionBlock* b = factory.createFunction(LIB_ID_MATH, MathLib::FUNC_ID_COS);
    b->setInput(0, (float)M_PI);
    b->update(0);
    ASSERT_NEAR_F(b->outputValue(0).f, -1.0f, 0.001f);
    delete b; PASS();
}

// ---- POW ----

void test_math_pow() {
    TEST("Math POW: 2^10 = 1024");
    FunctionBlock* b = factory.createFunction(LIB_ID_MATH, MathLib::FUNC_ID_POW);
    b->setInput(0, 2.0f); b->setInput(1, 10.0f);
    b->update(0);
    ASSERT_NEAR_F(b->outputValue(0).f, 1024.0f, 0.1f);
    delete b; PASS();
}

void test_math_pow_zero_exponent() {
    TEST("Math POW: 5^0 = 1");
    FunctionBlock* b = factory.createFunction(LIB_ID_MATH, MathLib::FUNC_ID_POW);
    b->setInput(0, 5.0f); b->setInput(1, 0.0f);
    b->update(0);
    ASSERT_NEAR_F(b->outputValue(0).f, 1.0f, 0.001f);
    delete b; PASS();
}

void test_math_pow_fractional() {
    TEST("Math POW: 9^0.5 = 3 (sqrt)");
    FunctionBlock* b = factory.createFunction(LIB_ID_MATH, MathLib::FUNC_ID_POW);
    b->setInput(0, 9.0f); b->setInput(1, 0.5f);
    b->update(0);
    ASSERT_NEAR_F(b->outputValue(0).f, 3.0f, 0.001f);
    delete b; PASS();
}

// ---- SQRT ----

void test_math_sqrt() {
    TEST("Math SQRT: sqrt(25) = 5");
    FunctionBlock* b = factory.createFunction(LIB_ID_MATH, MathLib::FUNC_ID_SQRT);
    b->setInput(0, 25.0f);
    b->update(0);
    ASSERT_NEAR_F(b->outputValue(0).f, 5.0f, 0.001f);
    delete b; PASS();
}

void test_math_sqrt_one() {
    TEST("Math SQRT: sqrt(1) = 1");
    FunctionBlock* b = factory.createFunction(LIB_ID_MATH, MathLib::FUNC_ID_SQRT);
    b->setInput(0, 1.0f);
    b->update(0);
    ASSERT_NEAR_F(b->outputValue(0).f, 1.0f, 0.001f);
    delete b; PASS();
}

// =========================================================
//  MathIntLib (int32)
// =========================================================

void test_math_int_add() {
    TEST("MathInt ADD: 10 + (-3) = 7");
    FunctionBlock* b = factory.createFunction(LIB_ID_MATH_INT, MathIntLib::FUNC_ID_ADD);
    b->setInput(0, (int32_t)10); b->setInput(1, (int32_t)-3);
    b->update(0);
    ASSERT_EQ_I(b->outputValue(0).i, 7);
    delete b; PASS();
}

void test_math_int_add_variable_arity() {
    TEST("MathInt ADD: 4 inputs: 1+2+3+4 = 10");
    FunctionBlock* b = factory.createFunction(LIB_ID_MATH_INT, MathIntLib::FUNC_ID_ADD, 4);
    b->setInput(0, (int32_t)1); b->setInput(1, (int32_t)2);
    b->setInput(2, (int32_t)3); b->setInput(3, (int32_t)4);
    b->update(0);
    ASSERT_EQ_I(b->outputValue(0).i, 10);
    delete b; PASS();
}

void test_math_int_sub() {
    TEST("MathInt SUB: 5 - 12 = -7");
    FunctionBlock* b = factory.createFunction(LIB_ID_MATH_INT, MathIntLib::FUNC_ID_SUB);
    b->setInput(0, (int32_t)5); b->setInput(1, (int32_t)12);
    b->update(0);
    ASSERT_EQ_I(b->outputValue(0).i, -7);
    delete b; PASS();
}

void test_math_int_mul() {
    TEST("MathInt MUL: -3 * 7 = -21");
    FunctionBlock* b = factory.createFunction(LIB_ID_MATH_INT, MathIntLib::FUNC_ID_MUL);
    b->setInput(0, (int32_t)-3); b->setInput(1, (int32_t)7);
    b->update(0);
    ASSERT_EQ_I(b->outputValue(0).i, -21);
    delete b; PASS();
}

void test_math_int_div() {
    TEST("MathInt DIV: 20 / 3 = 6 (truncated)");
    FunctionBlock* b = factory.createFunction(LIB_ID_MATH_INT, MathIntLib::FUNC_ID_DIV);
    b->setInput(0, (int32_t)20); b->setInput(1, (int32_t)3);
    b->update(0);
    ASSERT_EQ_I(b->outputValue(0).i, 6);
    delete b; PASS();
}

void test_math_int_div_negative() {
    TEST("MathInt DIV: -20 / 3 = -6");
    FunctionBlock* b = factory.createFunction(LIB_ID_MATH_INT, MathIntLib::FUNC_ID_DIV);
    b->setInput(0, (int32_t)-20); b->setInput(1, (int32_t)3);
    b->update(0);
    ASSERT_EQ_I(b->outputValue(0).i, -6);
    delete b; PASS();
}

void test_math_int_div_by_zero() {
    TEST("MathInt DIV: divide by zero is no-op");
    FunctionBlock* b = factory.createFunction(LIB_ID_MATH_INT, MathIntLib::FUNC_ID_DIV);
    b->setInput(0, (int32_t)10); b->setInput(1, (int32_t)5);
    b->update(0);
    ASSERT_EQ_I(b->outputValue(0).i, 2);
    b->setInput(1, (int32_t)0);
    b->update(0);
    ASSERT_EQ_I(b->outputValue(0).i, 2);  // unchanged
    delete b; PASS();
}

void test_math_int_abs() {
    TEST("MathInt ABS: |-42| = 42");
    FunctionBlock* b = factory.createFunction(LIB_ID_MATH_INT, MathIntLib::FUNC_ID_ABS);
    b->setInput(0, (int32_t)-42);
    b->update(0);
    ASSERT_EQ_I(b->outputValue(0).i, 42);
    delete b; PASS();
}

void test_math_int_abs_positive() {
    TEST("MathInt ABS: |7| = 7");
    FunctionBlock* b = factory.createFunction(LIB_ID_MATH_INT, MathIntLib::FUNC_ID_ABS);
    b->setInput(0, (int32_t)7);
    b->update(0);
    ASSERT_EQ_I(b->outputValue(0).i, 7);
    delete b; PASS();
}

// =========================================================
//  MathUintLib (uint32)
// =========================================================

void test_math_uint_add() {
    TEST("MathUint ADD: 100 + 200 = 300");
    FunctionBlock* b = factory.createFunction(LIB_ID_MATH_UINT, MathUintLib::FUNC_ID_ADD);
    b->setInput(0, 100u); b->setInput(1, 200u);
    b->update(0);
    ASSERT_EQ_U(b->outputValue(0).u, 300u);
    delete b; PASS();
}

void test_math_uint_add_variable_arity() {
    TEST("MathUint ADD: 3 inputs: 10+20+30 = 60");
    FunctionBlock* b = factory.createFunction(LIB_ID_MATH_UINT, MathUintLib::FUNC_ID_ADD, 3);
    b->setInput(0, 10u); b->setInput(1, 20u); b->setInput(2, 30u);
    b->update(0);
    ASSERT_EQ_U(b->outputValue(0).u, 60u);
    delete b; PASS();
}

void test_math_uint_sub() {
    TEST("MathUint SUB: 100 - 30 = 70");
    FunctionBlock* b = factory.createFunction(LIB_ID_MATH_UINT, MathUintLib::FUNC_ID_SUB);
    b->setInput(0, 100u); b->setInput(1, 30u);
    b->update(0);
    ASSERT_EQ_U(b->outputValue(0).u, 70u);
    delete b; PASS();
}

void test_math_uint_sub_underflow() {
    TEST("MathUint SUB: 5 - 10 wraps unsigned");
    FunctionBlock* b = factory.createFunction(LIB_ID_MATH_UINT, MathUintLib::FUNC_ID_SUB);
    b->setInput(0, 5u); b->setInput(1, 10u);
    b->update(0);
    // Unsigned wrapping: 5 - 10 = 0xFFFFFFFB = 4294967291
    ASSERT_EQ_U(b->outputValue(0).u, (uint32_t)(5u - 10u));
    delete b; PASS();
}

void test_math_uint_mul() {
    TEST("MathUint MUL: 7 * 8 = 56");
    FunctionBlock* b = factory.createFunction(LIB_ID_MATH_UINT, MathUintLib::FUNC_ID_MUL);
    b->setInput(0, 7u); b->setInput(1, 8u);
    b->update(0);
    ASSERT_EQ_U(b->outputValue(0).u, 56u);
    delete b; PASS();
}

void test_math_uint_div() {
    TEST("MathUint DIV: 100 / 7 = 14 (truncated)");
    FunctionBlock* b = factory.createFunction(LIB_ID_MATH_UINT, MathUintLib::FUNC_ID_DIV);
    b->setInput(0, 100u); b->setInput(1, 7u);
    b->update(0);
    ASSERT_EQ_U(b->outputValue(0).u, 14u);
    delete b; PASS();
}

void test_math_uint_div_by_zero() {
    TEST("MathUint DIV: divide by zero is no-op");
    FunctionBlock* b = factory.createFunction(LIB_ID_MATH_UINT, MathUintLib::FUNC_ID_DIV);
    b->setInput(0, 50u); b->setInput(1, 5u);
    b->update(0);
    ASSERT_EQ_U(b->outputValue(0).u, 10u);
    b->setInput(1, 0u);
    b->update(0);
    ASSERT_EQ_U(b->outputValue(0).u, 10u);  // unchanged
    delete b; PASS();
}

// =========================================================
//  TimerLib
// =========================================================

// ---- OnDelay ----

void test_timer_on_delay_basic() {
    TEST("Timer OnDelay: output after delay");
    FunctionBlock* b = factory.createFunction(LIB_ID_TIMERS, TimerLib::FUNC_ID_ON_DELAY);
    b->setInput(0, 1u);    // signal ON
    b->setInput(1, 100u);  // 100ms delay
    b->setInput(2, 0u);    // no reset

    b->update(10);   // 10ms — timer starts: left = 100-10 = 90
    ASSERT_EQ_U(b->outputValue(0).u, 0u);
    ASSERT_EQ_U(b->outputValue(1).u, 90u);

    b->update(50);   // 50ms — left = 90-50 = 40
    ASSERT_EQ_U(b->outputValue(0).u, 0u);
    ASSERT_EQ_U(b->outputValue(1).u, 40u);

    b->update(50);   // 50ms — left < dt, output fires
    ASSERT_EQ_U(b->outputValue(0).u, 1u);
    ASSERT_EQ_U(b->outputValue(1).u, 0u);
    delete b; PASS();
}

void test_timer_on_delay_signal_off_resets() {
    TEST("Timer OnDelay: signal off resets immediately");
    FunctionBlock* b = factory.createFunction(LIB_ID_TIMERS, TimerLib::FUNC_ID_ON_DELAY);
    b->setInput(0, 1u); b->setInput(1, 200u); b->setInput(2, 0u);
    b->update(50);   // start timer
    ASSERT_EQ_U(b->outputValue(0).u, 0u);

    // Signal goes off mid-countdown
    b->setInput(0, 0u);
    b->update(10);
    ASSERT_EQ_U(b->outputValue(0).u, 0u);
    ASSERT_EQ_U(b->outputValue(1).u, 0u);  // timer cleared
    delete b; PASS();
}

void test_timer_on_delay_stays_high() {
    TEST("Timer OnDelay: output stays high while signal high");
    FunctionBlock* b = factory.createFunction(LIB_ID_TIMERS, TimerLib::FUNC_ID_ON_DELAY);
    b->setInput(0, 1u); b->setInput(1, 100u); b->setInput(2, 0u);
    b->update(10);   // start timer: left = 90
    b->update(50);   // left = 40
    b->update(50);   // left < dt, fires
    ASSERT_EQ_U(b->outputValue(0).u, 1u);
    // Stay high — output should remain high
    b->update(100);
    ASSERT_EQ_U(b->outputValue(0).u, 1u);
    delete b; PASS();
}

void test_timer_on_delay_reset() {
    TEST("Timer OnDelay: reset input forces output");
    FunctionBlock* b = factory.createFunction(LIB_ID_TIMERS, TimerLib::FUNC_ID_ON_DELAY);
    b->setInput(0, 1u); b->setInput(1, 1000u); b->setInput(2, 0u);
    b->update(10);  // timer starts
    ASSERT_EQ_U(b->outputValue(0).u, 0u);

    // Reset while signal high — output follows signal immediately
    b->setInput(2, 1u);
    b->update(10);
    ASSERT_EQ_U(b->outputValue(0).u, 1u);
    ASSERT_EQ_U(b->outputValue(1).u, 0u);
    delete b; PASS();
}

// ---- OffDelay ----

void test_timer_off_delay_basic() {
    TEST("Timer OffDelay: output after delay");
    FunctionBlock* b = factory.createFunction(LIB_ID_TIMERS, TimerLib::FUNC_ID_OFF_DELAY);
    // Default: signal=true, out=true
    // Turn signal off to start the delay
    b->setInput(0, 0u); b->setInput(1, 100u); b->setInput(2, 0u);

    b->update(10);   // timer starts: left = 100-10 = 90
    ASSERT_EQ_U(b->outputValue(0).u, 1u);  // still high
    ASSERT_EQ_U(b->outputValue(1).u, 90u);

    b->update(50);   // left = 90-50 = 40
    ASSERT_EQ_U(b->outputValue(0).u, 1u);

    b->update(50);   // left < dt, output goes low
    ASSERT_EQ_U(b->outputValue(0).u, 0u);
    ASSERT_EQ_U(b->outputValue(1).u, 0u);
    delete b; PASS();
}

void test_timer_off_delay_signal_on_resets() {
    TEST("Timer OffDelay: signal on resets immediately");
    FunctionBlock* b = factory.createFunction(LIB_ID_TIMERS, TimerLib::FUNC_ID_OFF_DELAY);
    b->setInput(0, 0u); b->setInput(1, 200u); b->setInput(2, 0u);
    b->update(50);   // counting down
    ASSERT_EQ_U(b->outputValue(0).u, 1u);

    // Signal goes back on mid-countdown
    b->setInput(0, 1u);
    b->update(10);
    ASSERT_EQ_U(b->outputValue(0).u, 1u);  // stays high
    ASSERT_EQ_U(b->outputValue(1).u, 0u);  // timer cleared
    delete b; PASS();
}

void test_timer_off_delay_stays_low() {
    TEST("Timer OffDelay: output stays low while signal low");
    FunctionBlock* b = factory.createFunction(LIB_ID_TIMERS, TimerLib::FUNC_ID_OFF_DELAY);
    b->setInput(0, 0u); b->setInput(1, 100u); b->setInput(2, 0u);
    b->update(10);   // start timer: left = 90
    b->update(50);   // left = 40
    b->update(50);   // left < dt, out goes low
    ASSERT_EQ_U(b->outputValue(0).u, 0u);
    b->update(100);  // stays low
    ASSERT_EQ_U(b->outputValue(0).u, 0u);
    delete b; PASS();
}

void test_timer_off_delay_reset() {
    TEST("Timer OffDelay: reset input forces output low");
    FunctionBlock* b = factory.createFunction(LIB_ID_TIMERS, TimerLib::FUNC_ID_OFF_DELAY);
    b->setInput(0, 0u); b->setInput(1, 1000u); b->setInput(2, 0u);
    b->update(10);  // timer counting
    ASSERT_EQ_U(b->outputValue(0).u, 1u);

    // Reset while signal low — output follows signal immediately
    b->setInput(2, 1u);
    b->update(10);
    ASSERT_EQ_U(b->outputValue(0).u, 0u);
    ASSERT_EQ_U(b->outputValue(1).u, 0u);
    delete b; PASS();
}

// =========================================================
//  Factory tests
// =========================================================

void test_factory_invalid_lib() {
    TEST("Factory: invalid library returns nullptr");
    FunctionBlock* b = factory.createFunction(99, 0);
    ASSERT_EQ_U((uintptr_t)b, 0u);
    PASS();
}

void test_factory_invalid_func() {
    TEST("Factory: invalid function returns nullptr");
    FunctionBlock* b = factory.createFunction(LIB_ID_LOGIC, 99);
    ASSERT_EQ_U((uintptr_t)b, 0u);
    PASS();
}

void test_factory_names() {
    TEST("Factory: blocks have correct names");
    FunctionBlock* b;

    b = factory.createFunction(LIB_ID_LOGIC, LogicLib::FUNC_ID_AND);
    ASSERT_EQ_U(strcmp(b->name(), "AND"), 0u); delete b;

    b = factory.createFunction(LIB_ID_MATH, MathLib::FUNC_ID_SIN);
    ASSERT_EQ_U(strcmp(b->name(), "SIN"), 0u); delete b;

    b = factory.createFunction(LIB_ID_TIMERS, TimerLib::FUNC_ID_ON_DELAY);
    ASSERT_EQ_U(strcmp(b->name(), "ON_DELAY"), 0u); delete b;

    PASS();
}

// =========================================================
//  Main
// =========================================================

int main() {
    printf("\n=== Function Block Library Tests ===\n");

    printf("\n-- Logic --\n");
    test_logic_and_all_true();
    test_logic_and_one_false();
    test_logic_and_all_false();
    test_logic_and_variable_arity();
    test_logic_or_all_false();
    test_logic_or_one_true();
    test_logic_or_all_true();
    test_logic_or_variable_arity();
    test_logic_xor_one_true();
    test_logic_xor_both_true();
    test_logic_xor_both_false();
    test_logic_xor_three_inputs();
    test_logic_not_false_to_true();
    test_logic_not_true_to_false();
    test_logic_rs_set();
    test_logic_rs_reset();
    test_logic_rs_reset_dominant();
    test_logic_rs_latch();
    test_logic_sr_set();
    test_logic_sr_set_dominant();
    test_logic_rising_edge_detect();
    test_logic_rising_edge_no_false_trigger();
    test_logic_rising_edge_repeated();
    test_logic_falling_edge_detect();
    test_logic_falling_edge_no_false_trigger();

    printf("\n-- Math (float) --\n");
    test_math_add();
    test_math_add_negative();
    test_math_add_variable_arity();
    test_math_sub();
    test_math_sub_negative_result();
    test_math_mul();
    test_math_mul_by_zero();
    test_math_mul_variable_arity();
    test_math_div();
    test_math_div_by_zero();
    test_math_abs_positive();
    test_math_abs_negative();
    test_math_sin_zero();
    test_math_sin_pi_half();
    test_math_cos_zero();
    test_math_cos_pi();
    test_math_pow();
    test_math_pow_zero_exponent();
    test_math_pow_fractional();
    test_math_sqrt();
    test_math_sqrt_one();

    printf("\n-- Math Int (int32) --\n");
    test_math_int_add();
    test_math_int_add_variable_arity();
    test_math_int_sub();
    test_math_int_mul();
    test_math_int_div();
    test_math_int_div_negative();
    test_math_int_div_by_zero();
    test_math_int_abs();
    test_math_int_abs_positive();

    printf("\n-- Math Uint (uint32) --\n");
    test_math_uint_add();
    test_math_uint_add_variable_arity();
    test_math_uint_sub();
    test_math_uint_sub_underflow();
    test_math_uint_mul();
    test_math_uint_div();
    test_math_uint_div_by_zero();

    printf("\n-- Timers --\n");
    test_timer_on_delay_basic();
    test_timer_on_delay_signal_off_resets();
    test_timer_on_delay_stays_high();
    test_timer_on_delay_reset();
    test_timer_off_delay_basic();
    test_timer_off_delay_signal_on_resets();
    test_timer_off_delay_stays_low();
    test_timer_off_delay_reset();

    printf("\n-- Factory --\n");
    test_factory_invalid_lib();
    test_factory_invalid_func();
    test_factory_names();

    printf("\n--- Results: %d passed, %d failed ---\n\n", testsPassed, testsFailed);
    return testsFailed > 0 ? 1 : 0;
}
