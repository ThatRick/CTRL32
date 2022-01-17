
#define CONFIG_ASYNC_TCP_RUNNING_CORE   0
#define CONTROLLER_RUNNING_CORE         1

#include <Arduino.h>
#include <U8g2lib.h>
#include <WiFi.h>
#include <SPIFFS.h>
#include <ESPAsyncWebServer.h>

#include "CTRL/Common.h"

#include "CTRL/Controller.h"
#include "CTRL/Link.h"
#include "CTRL/FunctionBlock.h"
#include "CTRL/Circuit.h"
#include "CTRL/ControllerTask.h"
#include "CTRL/FunctionLib.h"
#include "CTRL/FunctionFactory.h"

#define OLED_CLOCK  15
#define OLED_DATA    4
#define OLED_RESET  16

#define CONTROLLER_PRIORITY 2

#define MIN_CONTROLLER_INTERVAL 1U
#define MAX_CONTROLLER_INTERVAL 100U

Controller* controller;
Link* commLink;
FunctionFactory* funcFactory;

TaskHandle_t taskController = NULL;

void printFunctionBlockIOValues(FunctionBlock *func)
{
    Serial.printf("Function block opcode %u [%p]:\n", func->opcode, func);
    size_t thisSize = sizeof(*func);
    size_t dataAllocatedSize = func->dataSize();
    Serial.printf("  Mem size: %d bytes (inst: %d bytes  data: %d bytes)\n", thisSize + dataAllocatedSize, thisSize, dataAllocatedSize);
    for (uint i = 0; i < func->numInputs; i++)
    {
        IO_TYPE ioType = func->readInputType(i);
        const char *ioTypeString = func->getIOTypeString(ioType);
        if (ioType == IO_TYPE_FLOAT)
        {
            Serial.printf("  Input %u: %f (%s)\n", i, func->inputValue(i).f, ioTypeString);
        }
        else if (ioType == IO_TYPE_INT)
        {
            Serial.printf("  Input %u: %i (%s)\n", i, func->inputValue(i).i, ioTypeString);
        }
        else
        {
            Serial.printf("  Input %u: %u (%s)\n", i, func->inputValue(i).u, ioTypeString);
        }
    }
    for (uint i = 0; i < func->numOutputs; i++)
    {
        IO_TYPE ioType = func->readOutputType(i);
        const char *ioTypeString = func->getIOTypeString(ioType);
        if (ioType == IO_TYPE_FLOAT)
        {
            Serial.printf("  Output %u: %f (%s)\n", i, func->outputValue(i).f, ioTypeString);
        }
        else if (ioType == IO_TYPE_INT)
        {
            Serial.printf("  Output %u: %i (%s)\n", i, func->outputValue(i).i, ioTypeString);
        }
        else
        {
            Serial.printf("  Output %u: %u (%s)\n", i, func->outputValue(i).u, ioTypeString);
        }
    }
}

// ***********************************************
//    OLED Screen
// ***********************************************

U8G2_SSD1306_128X64_NONAME_F_SW_I2C g_OLED(U8G2_R2, OLED_CLOCK, OLED_DATA, OLED_RESET);

int g_lineHeight = 0;


// ***********************************************
//    Web server
// ***********************************************

const char *ssid = "Linksys";
const char *pw = "langaton";

AsyncWebServer webServer(80);

// ***********************************************
//    Websocket server
// ***********************************************

AsyncWebSocket ws("/ws");

void IRAM_ATTR onWSSendData(const void* data, size_t len)
{
    ws.binaryAll((const char*)data, len);
}

void IRAM_ATTR onWSSendText(const char* text)
{
    ws.textAll(text);
}

void IRAM_ATTR onWSEvent(AsyncWebSocket *server, AsyncWebSocketClient *client, AwsEventType type, void *arg, uint8_t *data, size_t len)
{
    if (type == WS_EVT_CONNECT)
    {
        // client connected
        Serial.printf("ws[%s][%u] connect\n", server->url(), client->id());
        commLink->connected();
    }
    else if (type == WS_EVT_DISCONNECT)
    {
        // client disconnected
        Serial.printf("ws[%s][%u] disconnected\n", server->url(), client->id());
        commLink->disconnected();
    }
    else if (type == WS_EVT_ERROR)
    {
        // error was received from the other end
        Serial.printf("ws[%s][%u] error(%u): %s\n", server->url(), client->id(), *((uint16_t *)arg), (char *)data);
    }
    else if (type == WS_EVT_DATA)
    {
        // data packet
        AwsFrameInfo *info = (AwsFrameInfo *)arg;
        if (info->opcode == WS_TEXT)
        {
            data[len] = 0;
            Serial.printf("%s\n", (char *)data);
        }
        else
        {
            commLink->receiveData(data, len);
        }
    }
}


// ***********************************************
//    CTRL32 setup
// ***********************************************

void IRAM_ATTR ControllerLoop(void *) {
    for (;;) {
        commLink->processData();
        uint32_t remainingToNextUpdate = controller->tick();
        uint32_t delayTime = min(max(remainingToNextUpdate, MIN_CONTROLLER_INTERVAL), MAX_CONTROLLER_INTERVAL);
        delay(delayTime);
    }
}

void ControllerSetup()
{
    controller = new Controller();
    commLink = new Link(controller, &onWSSendData, &onWSSendText);
    funcFactory = new FunctionFactory();

    Circuit *loop = new Circuit(4, 2);
    
    FunctionBlock *funcADD = funcFactory->createFunction(LIB_ID_MATH_UINT, MathUintLib::FUNC_ID_ADD, 2);
    FunctionBlock *funcDIV = funcFactory->createFunction(LIB_ID_MATH, MathLib::FUNC_ID_DIV);
    FunctionBlock *funcSIN = funcFactory->createFunction(LIB_ID_MATH, MathLib::FUNC_ID_SIN);
    FunctionBlock *funcMUL = funcFactory->createFunction(LIB_ID_MATH, MathLib::FUNC_ID_MUL);
    
    funcADD->setInput(0, 1);
    funcADD->connectInput(1, funcADD, 0);

    funcDIV->connectInput(0, funcADD, 0);
    funcDIV->setInput(1, 10.f);

    funcSIN->connectInput(0, funcDIV, 0);

    funcMUL->connectInput(0, funcSIN, 0);
    funcMUL->setInput(1, 100.f);

    loop->addFunction(funcADD);
    loop->addFunction(funcDIV);
    loop->addFunction(funcSIN);
    loop->addFunction(funcMUL);

    Serial.println("Creating a CTRL32 task");
    ControllerTask* task1 = new ControllerTask(controller, 1000, 0);
    task1->circuits.push_back(loop);
    controller->tasks.push_back(task1);

    task1->start();

    Serial.println("Creating a FreeRTOS task");
    xTaskCreatePinnedToCore(ControllerLoop, "CTRL32", 4*1024, NULL, CONTROLLER_PRIORITY, &taskController, CONTROLLER_RUNNING_CORE);

    Serial.println("Controller tasks running.");
}


// ***********************************************
//    Setup
// ***********************************************

void setup()
{
    Serial.begin(115200);

    g_OLED.begin();
    g_OLED.setFont(u8g2_font_profont15_tf);
    g_lineHeight = g_OLED.getFontAscent() - g_OLED.getFontDescent();
    g_OLED.clearBuffer();
    g_OLED.setCursor(0, g_lineHeight * 1);

    pinMode(LED_BUILTIN, OUTPUT);

    if (!SPIFFS.begin())
    {
        Serial.println("Error mounting SPIFFS");
        g_OLED.printf("Error mounting SPIFFS");
        g_OLED.sendBuffer();
        delay(2000);
        g_OLED.clearBuffer();
    }

    WiFi.mode(WIFI_STA);
    WiFi.begin(ssid, pw);
    Serial.print("Connecting to WiFi ..");

    g_OLED.printf("Connecting to WiFi...");
    g_OLED.sendBuffer();
    while (WiFi.status() != WL_CONNECTED)
    {
        Serial.print(".");
        delay(1000);
    }
    Serial.print("Connected with IP ");
    Serial.println(WiFi.localIP());
    g_OLED.setCursor(0, g_lineHeight * 2);
    g_OLED.printf("IP %s", WiFi.localIP().toString().c_str());
    g_OLED.sendBuffer();
    delay(2000);

    // Web server
    webServer.serveStatic("/", SPIFFS, "/");
    webServer.on("/", HTTP_ANY, [](AsyncWebServerRequest *request) {
        request->send(SPIFFS, "/index.html");
    });

    // Websocket
    ws.onEvent(onWSEvent);
    webServer.addHandler(&ws);

    webServer.begin();

    ControllerSetup();
}

void loop()
{
    delay(100);
    ws.cleanupClients();
}
