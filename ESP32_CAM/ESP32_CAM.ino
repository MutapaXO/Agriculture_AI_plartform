
#include "esp_camera.h"
#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>

// =========================
// WIFI SETTINGS
// =========================
const char* ssid = "Room-301";
const char* password = "Aditya@A9";

// =========================
// FLASK SERVER
// =========================
const char* serverName =
"https://agriculture-ai-backend.onrender.com/upload-image";

// =========================
// CAMERA PINS
// AI THINKER ESP32-CAM
// =========================
#define PWDN_GPIO_NUM     32
#define RESET_GPIO_NUM    -1
#define XCLK_GPIO_NUM      0

#define SIOD_GPIO_NUM     26
#define SIOC_GPIO_NUM     27

#define Y9_GPIO_NUM       35
#define Y8_GPIO_NUM       34
#define Y7_GPIO_NUM       39
#define Y6_GPIO_NUM       36
#define Y5_GPIO_NUM       21
#define Y4_GPIO_NUM       19
#define Y3_GPIO_NUM       18
#define Y2_GPIO_NUM        5

#define VSYNC_GPIO_NUM    25
#define HREF_GPIO_NUM     23
#define PCLK_GPIO_NUM     22

// =========================
// CAMERA SETUP
// =========================
void startCamera() {

  camera_config_t config;

  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer = LEDC_TIMER_0;

  config.pin_d0 = Y2_GPIO_NUM;
  config.pin_d1 = Y3_GPIO_NUM;
  config.pin_d2 = Y4_GPIO_NUM;
  config.pin_d3 = Y5_GPIO_NUM;
  config.pin_d4 = Y6_GPIO_NUM;
  config.pin_d5 = Y7_GPIO_NUM;
  config.pin_d6 = Y8_GPIO_NUM;
  config.pin_d7 = Y9_GPIO_NUM;

  config.pin_xclk = XCLK_GPIO_NUM;
  config.pin_pclk = PCLK_GPIO_NUM;
  config.pin_vsync = VSYNC_GPIO_NUM;
  config.pin_href = HREF_GPIO_NUM;

  config.pin_sscb_sda = SIOD_GPIO_NUM;
  config.pin_sscb_scl = SIOC_GPIO_NUM;

  config.pin_pwdn = PWDN_GPIO_NUM;
  config.pin_reset = RESET_GPIO_NUM;

  config.xclk_freq_hz = 10000000;

  config.pixel_format = PIXFORMAT_JPEG;

  // =========================
  // STABLE SETTINGS
  // =========================
config.frame_size = FRAMESIZE_SXGA;
config.jpeg_quality = 8;
config.fb_count = 1;

  // =========================
  // INIT CAMERA
  // =========================
  esp_err_t err = esp_camera_init(&config);

  if (err != ESP_OK) {

    Serial.printf(
      "Camera init failed: 0x%x\n",
      err
    );

    return;

  }

  sensor_t * s = esp_camera_sensor_get();

  s->set_framesize(
    s,
    FRAMESIZE_QVGA
  );

}

// =========================
// SETUP
// =========================
void setup() {

  Serial.begin(115200);

  startCamera();

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

    camera_fb_t* fb = esp_camera_fb_get();

    if (!fb) {

      Serial.println("Camera capture failed");

      delay(2000);

      return;

    }

    WiFiClientSecure client; client.setInsecure();
    HTTPClient http;

    http.begin(client, serverName);

    http.addHeader(
      "Content-Type",
      "image/jpeg"
    );

    int httpResponseCode =
      http.POST(
        fb->buf,
        fb->len
      );

    esp_camera_fb_return(fb);

    Serial.print("HTTP Response: ");
    Serial.println(httpResponseCode);

    http.end();

  }

// =========================
// UPLOAD EVERY 60 SECONDS
// =========================
delay(60000);
}

