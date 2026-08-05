#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>
#include <DHT.h>
#include "time.h"

// =========================
// 1. CONFIGURATION & PINS
// =========================
const char* ssid = "Room-301";
const char* password = "Aditya@A9";
const char* sensorURL = "https://agriculture-ai-backend.onrender.com/update-sensors";
const char* commandURL = "https://agriculture-ai-backend.onrender.com/api/commands";

// Relay Pins
#define RELAY_NFT       18  // Relay 1: NFT Circulation
#define RELAY_NUTRI_A   19  // Relay 2: Nutrient Pump A
#define RELAY_NUTRI_B   23  // Relay 3: Nutrient Pump B
#define RELAY_LIGHT     5   // Relay 4: Grow Light
#define RELAY_REFILL    15  // Relay 5: Secondary Tank Pump

// Sensor Pins
#define DHTPIN          4
#define DHTTYPE         DHT11
#define TRIG_PIN        26
#define ECHO_PIN        27
#define TDS_PIN         34
#define LDR_PIN         35
#define PH_PIN          33

// Automation Constants
const int TANK_HEIGHT_CM = 30;       // Distance from sensor to empty tank bottom
const int TDS_TARGET     = 1000;
const int WATER_LOW      = 50;       // Start refill at 50%
const int WATER_HIGH     = 90;       // Stop refill at 90%
const int NFT_ON_TIME    = 5000;     // 5 seconds
const int NFT_OFF_TIME   = 15000;    // 15 seconds
const int DOSE_TIME      = 3000;     // 3 seconds dose
const int MIX_TIME       = 60000;    // 60 seconds mixing delay
const int LIGHT_ON_HOUR  = 6;        // 06:00
const int LIGHT_OFF_HOUR = 22;       // 22:00

// =========================
// 2. GLOBAL VARIABLES
// =========================
DHT dht(DHTPIN, DHTTYPE);
bool autoMode = false;
bool remote_p1, remote_p2, remote_p3, remote_p4, remote_light;

// Sensor Readings
float temperature, humidity, phValue = 6.2;
int tdsValue, waterLevelPct, lightLevel;

// Non-blocking Timers
unsigned long lastCommandMillis = 0;
unsigned long lastUploadMillis = 0;
unsigned long nftCycleMillis = 0;
bool nftIsOn = false;

// TDS Dosing State Machine
enum DosingState { IDLE, DOSE_A, WAIT_A, DOSE_B, WAIT_B };
DosingState currentDoseState = IDLE;
unsigned long dosingTimer = 0;

// =========================
// 3. CORE FUNCTIONS
// =========================

void readSensors() {
  // DHT11
  float t = dht.readTemperature();
  float h = dht.readHumidity();
  if (!isnan(t)) temperature = t;
  if (!isnan(h)) humidity = h;

  // HC-SR04 Ultrasonic
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  long duration = pulseIn(ECHO_PIN, HIGH);
  float distance = duration * 0.0343 / 2;
  waterLevelPct = constrain(((TANK_HEIGHT_CM - distance) / TANK_HEIGHT_CM) * 100, 0, 100);

  // Analog TDS & LDR
  tdsValue = analogRead(TDS_PIN); // Note: Calibration for TDS_PIN -> PPM recommended
  lightLevel = analogRead(LDR_PIN);
}

void handleAutomation() {
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) {
    Serial.println("NTP Time Error");
  }

  // A. NFT Pump Cycle (5s ON / 15s OFF)
  unsigned long now = millis();
  if (nftIsOn && (now - nftCycleMillis >= NFT_ON_TIME)) {
    nftIsOn = false;
    nftCycleMillis = now;
  } else if (!nftIsOn && (now - nftCycleMillis >= NFT_OFF_TIME)) {
    nftIsOn = true;
    nftCycleMillis = now;
  }
  digitalWrite(RELAY_NFT, nftIsOn ? LOW : HIGH);

  // B. Grow Light Schedule (06:00 - 22:00)
  if (timeinfo.tm_hour >= LIGHT_ON_HOUR && timeinfo.tm_hour < LIGHT_OFF_HOUR) {
    digitalWrite(RELAY_LIGHT, LOW);
  } else {
    digitalWrite(RELAY_LIGHT, HIGH);
  }

  // C. Water Refill Logic (Hysteresis 50% to 90%)
  if (waterLevelPct < WATER_LOW) {
    digitalWrite(RELAY_REFILL, LOW);
  } else if (waterLevelPct >= WATER_HIGH) {
    digitalWrite(RELAY_REFILL, HIGH);
  }

  // D. TDS Dosing State Machine (3s Dose, 60s Mix)
  switch (currentDoseState) {
    case IDLE:
      if (tdsValue < TDS_TARGET) {
        currentDoseState = DOSE_A;
        dosingTimer = now;
      }
      break;
    case DOSE_A:
      digitalWrite(RELAY_NUTRI_A, LOW);
      if (now - dosingTimer >= DOSE_TIME) {
        digitalWrite(RELAY_NUTRI_A, HIGH);
        currentDoseState = WAIT_A;
        dosingTimer = now;
      }
      break;
    case WAIT_A:
      if (now - dosingTimer >= MIX_TIME) {
        if (tdsValue < TDS_TARGET) currentDoseState = DOSE_B;
        else currentDoseState = IDLE;
        dosingTimer = now;
      }
      break;
    case DOSE_B:
      digitalWrite(RELAY_NUTRI_B, LOW);
      if (now - dosingTimer >= DOSE_TIME) {
        digitalWrite(RELAY_NUTRI_B, HIGH);
        currentDoseState = WAIT_B;
        dosingTimer = now;
      }
      break;
    case WAIT_B:
      if (now - dosingTimer >= MIX_TIME) {
        currentDoseState = IDLE;
      }
      break;
  }
}

// =========================
// 4. CLOUD COMMUNICATION
// =========================

void checkCommands() {
  if (WiFi.status() != WL_CONNECTED) return;
  HTTPClient http;
  http.begin(commandURL);
  int httpCode = http.GET();

  if (httpCode == 200) {
    String payload = http.getString();
    StaticJsonDocument<512> doc;
    deserializeJson(doc, payload);

    autoMode = doc["auto_mode"];
    remote_p1 = doc["pump1"];
    remote_p2 = doc["pump2"];
    remote_p3 = doc["pump3"];
    remote_p4 = doc["pump4"]; // Secondary Water Pump
    remote_light = doc["light"];

    // If Manual Mode: Override Relays
    if (!autoMode) {
      digitalWrite(RELAY_NFT,     remote_p1 ? LOW : HIGH);
      digitalWrite(RELAY_NUTRI_A, remote_p2 ? LOW : HIGH);
      digitalWrite(RELAY_NUTRI_B, remote_p3 ? LOW : HIGH);
      digitalWrite(RELAY_LIGHT,   remote_light ? LOW : HIGH);
      digitalWrite(RELAY_REFILL,  remote_p4 ? LOW : HIGH);
    }
  }
  http.end();
}

void uploadSensors() {
  if (WiFi.status() != WL_CONNECTED) return;
  WiFiClientSecure client;
  client.setInsecure();
  HTTPClient http;
  http.begin(client, sensorURL);
  http.addHeader("Content-Type", "application/json");

  StaticJsonDocument<512> doc;
  doc["temperature"] = temperature;
  doc["humidity"]    = humidity;
  doc["tds"]         = tdsValue;
  doc["water_level"] = waterLevelPct;
  doc["light_level"] = lightLevel;
  doc["ph"]          = phValue;
  doc["plant"]       = "Lettuce";
  doc["week"]        = 3;

  String jsonData;
  serializeJson(doc, jsonData);
  http.POST(jsonData);
  http.end();
}

// =========================
// 5. SETUP & LOOP
// =========================

void setup() {
  Serial.begin(115200);

  // Relay Initialization (Safety: Start HIGH/OFF)
  int relayPins[] = {RELAY_NFT, RELAY_NUTRI_A, RELAY_NUTRI_B, RELAY_LIGHT, RELAY_REFILL};
  for (int pin : relayPins) {
    pinMode(pin, OUTPUT);
    digitalWrite(pin, HIGH);
  }

  // Sensor Initialization
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  dht.begin();

  // WiFi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500); Serial.print(".");
  }
  Serial.println("\nWiFi Connected.");

  // NTP Time Config (GMT +5:30 = 19800 seconds)
  configTime(19800, 0, "pool.ntp.org");
}

void loop() {
  // 1. Always Read Sensors
  readSensors();

  // 2. Handle Automation Logic (Only if Auto Mode is Active)
  if (autoMode) {
    handleAutomation();
  }

  // 3. Check Commands (Every 500ms for responsiveness)
  if (millis() - lastCommandMillis >= 500) {
    lastCommandMillis = millis();
    checkCommands();
  }

  // 4. Upload Sensors (Every 10 seconds)
  if (millis() - lastUploadMillis >= 10000) {
    lastUploadMillis = millis();
    uploadSensors();
  }
}