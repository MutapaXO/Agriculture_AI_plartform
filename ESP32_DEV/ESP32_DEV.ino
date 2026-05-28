#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// =========================
// WIFI SETTINGS
// =========================
const char* ssid = "Room-301";
const char* password = "Aditya@A9";

// =========================
// FLASK SERVER
// =========================
const char* serverName =
"http://192.168.1.107:5000/update-sensors";

// =========================
// SENSOR VARIABLES
// =========================
float temperature = 27;
float humidity = 45;
int tds = 520;
int waterLevel = 78;
int lightLevel = 650;
float ph = 6.2;

// =========================
// SETUP
// =========================
void setup() {

  Serial.begin(115200);

  WiFi.begin(ssid, password);

  Serial.print("Connecting to WiFi");

  while (WiFi.status() != WL_CONNECTED) {

    delay(500);
    Serial.print(".");

  }

  Serial.println("");
  Serial.println("WiFi connected");

}

// =========================
// LOOP
// =========================
void loop() {

  if (WiFi.status() == WL_CONNECTED) {

    HTTPClient http;

    http.begin(serverName);

    http.addHeader("Content-Type", "application/json");

    // =========================
    // CREATE JSON
    // =========================
    StaticJsonDocument<300> doc;

    doc["temperature"] = temperature;
    doc["humidity"] = humidity;
    doc["tds"] = tds;
    doc["water_level"] = waterLevel;
    doc["light_level"] = lightLevel;
    doc["ph"] = ph;

    doc["plant"] = "Lettuce";
    doc["week"] = 2;

    String jsonData;

    serializeJson(doc, jsonData);

    // =========================
    // SEND TO FLASK
    // =========================
    int httpResponseCode =
      http.POST(jsonData);

    Serial.print("HTTP Response: ");

    Serial.println(httpResponseCode);

    http.end();

  }

  // =========================
  // SIMULATE SENSOR CHANGES
  // =========================
  temperature += 0.1;

  if (temperature > 30)
    temperature = 25;

  humidity += 1;

  if (humidity > 70)
    humidity = 40;

  tds += 5;

  if (tds > 700)
    tds = 450;

  delay(5000);

}