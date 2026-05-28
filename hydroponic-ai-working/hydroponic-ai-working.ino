#include <WiFi.h>
#include <HTTPClient.h>

const char* ssid = "Room-301";
const char* password = "Aditya@A9";

// REPLACE WITH YOUR LAPTOP IP
const char* serverName = "http://192.168.1.107:5000/analyze";

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

  Serial.print("ESP32 IP Address: ");
  Serial.println(WiFi.localIP());
}

void loop() {

  if (WiFi.status() == WL_CONNECTED) {

    WiFiClient client;
    HTTPClient http;

    Serial.println("Connecting to server...");

    // IMPORTANT FIX
    http.begin(client, serverName);

    http.addHeader("Content-Type", "application/json");

    String jsonData = R"rawliteral(
    {
      "plant":"Lettuce",
      "week":2,
      "ph":6.8,
      "tds":450,
      "temp":30,
      "humidity":40
    }
    )rawliteral";

    Serial.println("Sending POST request...");

    int httpResponseCode = http.POST(jsonData);

    Serial.print("HTTP Response code: ");
    Serial.println(httpResponseCode);

    if (httpResponseCode > 0) {

      String response = http.getString();

      Serial.println("Server Response:");
      Serial.println(response);

    } else {

      Serial.print("HTTP Error: ");
      Serial.println(http.errorToString(httpResponseCode));

    }

    http.end();

  } else {

    Serial.println("WiFi disconnected");

  }

  delay(15000);
}