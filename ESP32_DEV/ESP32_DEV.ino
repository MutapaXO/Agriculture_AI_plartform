
#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>

// =========================
// WIFI SETTINGS
// =========================
const char* ssid = "Room-301";
const char* password = "Aditya@A9";

// =========================
// CLOUD URLS
// =========================
const char* sensorURL =
  "https://agriculture-ai-backend.onrender.com/update-sensors";

const char* commandURL =
  "https://agriculture-ai-backend.onrender.com/api/commands";

// =========================
// RELAY PINS
// =========================
#define RELAY1 18   // Water Pump
#define RELAY2 19   // Nutrient Pump A
#define RELAY3 23   // Nutrient Pump B
#define RELAY4 5    // Grow Light

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
// READ CLOUD COMMANDS
// =========================

void checkCommands() {

  if (WiFi.status() != WL_CONNECTED)
    return;

  HTTPClient http;

  http.begin(commandURL);

  int httpCode = http.GET();

  Serial.print("Command HTTP Code: ");
  Serial.println(httpCode);

  if (httpCode == 200) {

    String payload = http.getString();

    Serial.println(payload);

    StaticJsonDocument<300> doc;

    DeserializationError error =
      deserializeJson(doc, payload);

    if (!error) {

      bool pump1 = doc["pump1"];
      bool pump2 = doc["pump2"];
      bool pump3 = doc["pump3"];
      bool light = doc["light"];

      digitalWrite(RELAY1, pump1 ? LOW : HIGH);
      digitalWrite(RELAY2, pump2 ? LOW : HIGH);
      digitalWrite(RELAY3, pump3 ? LOW : HIGH);
      digitalWrite(RELAY4, light ? LOW : HIGH);

      Serial.println("Commands Updated");

      Serial.print("Pump1: ");
      Serial.println(pump1);

      Serial.print("Pump2: ");
      Serial.println(pump2);

      Serial.print("Pump3: ");
      Serial.println(pump3);

      Serial.print("Light: ");
      Serial.println(light);
    }
  }

  http.end();
}



// =========================
// SETUP
// =========================
void setup() {

  Serial.begin(115200);

  pinMode(RELAY1, OUTPUT);
  pinMode(RELAY2, OUTPUT);
  pinMode(RELAY3, OUTPUT);
  pinMode(RELAY4, OUTPUT);

  // Relay OFF initially
  digitalWrite(RELAY1, HIGH);
  digitalWrite(RELAY2, HIGH);
  digitalWrite(RELAY3, HIGH);
  digitalWrite(RELAY4, HIGH);

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

  static unsigned long lastSensorUpload = 0;
  static unsigned long lastCommandCheck = 0;

  // =========================
  // CHECK RELAY COMMANDS
  // EVERY 200ms
  // =========================
  if (millis() - lastCommandCheck >= 200) {

    lastCommandCheck = millis();

    if (WiFi.status() == WL_CONNECTED) {

      checkCommands();

    }
  }

  // =========================
  // UPLOAD SENSOR DATA
  // EVERY 5 SECONDS
  // =========================
  if (millis() - lastSensorUpload >= 5000) {

    lastSensorUpload = millis();

    if (WiFi.status() == WL_CONNECTED) {

      WiFiClientSecure client;
      client.setInsecure();

      HTTPClient http;

      http.begin(client, sensorURL);

      http.addHeader(
        "Content-Type",
        "application/json"
      );

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

      int httpResponseCode =
        http.POST(jsonData);

      Serial.print("Sensor Upload: ");
      Serial.println(httpResponseCode);

      http.end();

      // =========================
      // SIMULATED SENSOR DATA
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
    }
  }
}

