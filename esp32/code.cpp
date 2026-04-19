#include <Wire.h>
#include <Adafruit_LSM6DSOX.h>
#include <Adafruit_Sensor.h>

Adafruit_LSM6DSOX sox;

void setup() {
  Serial.begin(115200);
  delay(1000);

  Wire.begin(21, 20);  // SDA = 21, SCL = 20

  if (!sox.begin_I2C(0x6A, &Wire)) {
    Serial.println("Failed to find LSM6DSOX");
    while (1) {
      delay(10);
    }
  }

  Serial.println("LSM6DSOX connected!");

  sox.setAccelRange(LSM6DS_ACCEL_RANGE_4_G);
  sox.setGyroRange(LSM6DS_GYRO_RANGE_500_DPS);
  sox.setAccelDataRate(LSM6DS_RATE_104_HZ);
  sox.setGyroDataRate(LSM6DS_RATE_104_HZ);
}

void loop() {
  sensors_event_t accel, gyro, temp;
  sox.getEvent(&accel, &gyro, &temp);

  Serial.print(accel.acceleration.x);
  Serial.print(",");
  Serial.print(accel.acceleration.y);
  Serial.print(",");
  Serial.print(accel.acceleration.z);
  Serial.print(",");

  Serial.print(gyro.gyro.x);
  Serial.print(",");
  Serial.print(gyro.gyro.y);
  Serial.print(",");
  Serial.print(gyro.gyro.z);
  Serial.print(",");

  Serial.println(temp.temperature);

  delay(100);
}

#include <Wire.h>

void setup() {
  Serial.begin(115200);
  delay(1000);

  Wire.begin(21, 20);

  Serial.println("Reading possible WHO_AM_I registers from 0x6A...");

  byte regs[] = {0x00, 0x0F, 0x75};
  for (int i = 0; i < 3; i++) {
    byte reg = regs[i];

    Wire.beginTransmission(0x6A);
    Wire.write(reg);
    byte err = Wire.endTransmission(false);

    Wire.requestFrom(0x6A, 1);

    if (err != 0) {
      Serial.print("Could not access reg 0x");
      Serial.println(reg, HEX);
      continue;
    }
    if (Wire.available()) {
      byte val = Wire.read();
      Serial.print("Reg 0x");
      Serial.print(reg, HEX);
      Serial.print(" = 0x");
      Serial.println(val, HEX);
    } else {
      Serial.print("No data from reg 0x");
      Serial.println(reg, HEX);
    }
  }
}

void loop() {
}






#include <Wire.h>
#include <Adafruit_LSM6DSOX.h>
#include <Adafruit_Sensor.h>

Adafruit_LSM6DSOX sox;

int reps = 0;

// Push up state
bool wentDown = false;
bool wentUp = true;

// Thresholds to tune
float downThreshold = 7.5;
float upThreshold = 9.0;

// Small cooldown so one motion does not count twice
unsigned long lastRepTime = 0;
unsigned long repCooldown = 500;

void setup() {
  Serial.begin(115200);
  delay(1000);

  Wire.begin(21, 20);

  if (!sox.begin_I2C(0x6A, &Wire)) {
    Serial.println("Failed to find LSM6DSOX");
    while (1) {
      delay(10);
    }
  }

  Serial.println("LSM6DSOX connected");
  Serial.println("Starting rep counter...");

  sox.setAccelRange(LSM6DS_ACCEL_RANGE_4_G);
  sox.setGyroRange(LSM6DS_GYRO_RANGE_500_DPS);
  sox.setAccelDataRate(LSM6DS_RATE_104_HZ);
  sox.setGyroDataRate(LSM6DS_RATE_104_HZ);
}

void loop() {
  sensors_event_t accel, gyro, temp;
  sox.getEvent(&accel, &gyro, &temp);

  float ax = accel.acceleration.x;
  float ay = accel.acceleration.y;
  float az = accel.acceleration.z;

  unsigned long now = millis();

  // Print raw values plus reps
  Serial.print("ax: ");
  Serial.print(ax);
  Serial.print("   ay: ");
  Serial.print(ay);
  Serial.print("   az: ");
  Serial.print(az);
  Serial.print("   reps: ");
  Serial.println(reps);

  // Detect downward motion
  if (az < downThreshold) {
    wentDown = true;
    wentUp = false;
  }

  // Detect coming back up after going down
  if (wentDown && az > upThreshold && (now - lastRepTime > repCooldown)) {
    reps++;
    lastRepTime = now;
    wentDown = false;
    wentUp = true;

    Serial.print("REP COUNT = ");
    Serial.println(reps);
  }

  delay(50);
}



const int trigPin = 18;
const int echoPin = 19;

void setup() {
  Serial.begin(115200);

  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);
}

void loop() {
  // Send pulse
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);

  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);

  // Read echo time
  long duration = pulseIn(echoPin, HIGH);

  // Convert to distance (cm)
  float distance = duration * 0.0343 / 2;

  // Print result
  Serial.print("Distance: ");
  Serial.print(distance);
  Serial.println(" cm");

  delay(200);
}





























const int trigPin = 17;
const int echoPin = 18;

int reps = 0;
bool wentDown = false;

// Tune these based on your setup
const float downThresholdCm = 8.0;   // chest close to ground
const float upThresholdCm   = 16.0;  // chest back up

unsigned long lastRepTime = 0;
const unsigned long repCooldown = 600; // ms (prevents double counts)

// Get distance in cm
float getDistanceCm() {
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);

  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);

  long duration = pulseIn(echoPin, HIGH, 30000); // timeout 30ms
  if (duration == 0) return -1.0; // no reading

  return duration * 0.0343 / 2.0;
}

void setup() {
  Serial.begin(115200);
  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);

  Serial.println("Push-up counter ready");
}

void loop() {
  float distance = getDistanceCm();
  if (distance < 0) return; // skip bad reads

  unsigned long now = millis();

  // Detect bottom of push-up
  if (distance <= downThresholdCm) {
    wentDown = true;
  }

  // Detect coming back up → count rep
  if (wentDown && distance >= upThresholdCm && (now - lastRepTime > repCooldown)) {
    reps++;
    lastRepTime = now;
    wentDown = false;

    //Only print when a rep is completed
    Serial.print("Reps: ");
    Serial.println(reps);
  }

  delay(50);
}




#include <WiFi.h>
#include <AsyncTCP.h>
#include <ESPAsyncWebServer.h>

const char* ssid = "YOUR_WIFI";
const char* password = "YOUR_PASSWORD";

AsyncWebServer server(80);
AsyncWebSocket ws("/ws");

int reps = 0;

void notifyClients() {
  String msg = "{\"reps\":" + String(reps) + "}";
  ws.textAll(msg);
}

void setup() {
  Serial.begin(115200);

  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
  }

  Serial.println(WiFi.localIP());

  ws.onEvent([](AsyncWebSocket *server, AsyncWebSocketClient *client,
                AwsEventType type, void *arg, uint8_t *data, size_t len) {
    if (type == WS_EVT_CONNECT) {
      client->text("{\"reps\":0}");
    }
  });

  server.addHandler(&ws);
  server.begin();
}

void loop() {
  // Example: simulate rep
  delay(3000);
  reps++;
  notifyClients();

  ws.cleanupClients();
}














#include <WiFi.h>
#include <AsyncTCP.h>
#include <ESPAsyncWebServer.h>


const char* ssid = "StarkHacks-2";
const char* password = "StarkHacks2026";


AsyncWebServer server(80);
AsyncWebSocket ws("/ws");


const int trigPin = 17;
const int echoPin = 18;


int reps = 0;
bool wentDown = false;


// Tune these based on your setup
const float downThresholdCm = 8.0;   // chest close to ground
const float upThresholdCm   = 16.0;  // chest back up


unsigned long lastRepTime = 0;
const unsigned long repCooldown = 600; // ms (prevents double counts)


// Get distance in cm
float getDistanceCm() {
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);


  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);


  long duration = pulseIn(echoPin, HIGH, 30000); // timeout 30ms
  if (duration == 0) return -1.0; // no reading


  return duration * 0.0343 / 2.0;
}


void notifyClients() {
  String msg = "{\"reps\":" + String(reps) + "}";
  ws.textAll(msg);
}


void setup() {
  Serial.begin(115200);


  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);


  Serial.println("Push-up counter ready");


  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
  }


  Serial.println(WiFi.localIP());


  ws.onEvent([](AsyncWebSocket *server, AsyncWebSocketClient *client,
                AwsEventType type, void *arg, uint8_t *data, size_t len) {
    if (type == WS_EVT_CONNECT) {
      client->text("{\"reps\":0}");
    }
  });


  server.addHandler(&ws);
  server.begin();
}


void loop() {
 
float distance = getDistanceCm();
  if (distance < 0) return; // skip bad reads


  unsigned long now = millis();


  // Detect bottom of push-up
  if (distance <= downThresholdCm) {
    wentDown = true;
  }


  // Detect coming back up → count rep
  if (wentDown && distance >= upThresholdCm && (now - lastRepTime > repCooldown)) {
    reps++;
    lastRepTime = now;
    wentDown = false;


    //Only print when a rep is completed
    Serial.print("Reps: ");
    Serial.println(reps);
  }


  delay(50);
 
  notifyClients();


  ws.cleanupClients();
}




void onWsEvent(AsyncWebSocket *server, AsyncWebSocketClient *client,
               AwsEventType type, void *arg, uint8_t *data, size_t len) {

  if (type == WS_EVT_CONNECT) {
    client->text("{\"reps\":0}");
  }

  else if (type == WS_EVT_DATA) {
    AwsFrameInfo *info = (AwsFrameInfo*)arg;

    // Only handle full text messages
    if (info->final && info->index == 0 && info->len == len && info->opcode == WS_TEXT) {

      String msg = "";
      for (size_t i = 0; i < len; i++) {
        msg += (char)data[i];
      }
      msg.trim();

      //RESET command
      if (msg == "RESET") {
        reps = 0;
        wentDown = false;
        lastRepTime = 0;

        Serial.println("RESET received");

        // Send updated state back
        client->text("{\"reps\":0}");
      }
    }
  }
}


#include <WiFi.h>
#include <AsyncTCP.h>
#include <ESPAsyncWebServer.h>


const char* ssid = "StarkHacks-2";
const char* password = "StarkHacks2026";


AsyncWebServer server(80);
AsyncWebSocket ws("/ws");


const int trigPin = 17;
const int echoPin = 18;


int reps = 0;
bool wentDown = false;


// Tune these based on your setup
const float downThresholdCm = 8.0;   // chest close to ground
const float upThresholdCm   = 16.0;  // chest back up


unsigned long lastRepTime = 0;
const unsigned long repCooldown = 600; // ms (prevents double counts)


// Get distance in cm
float getDistanceCm() {
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);


  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);


  long duration = pulseIn(echoPin, HIGH, 30000); // timeout 30ms
  if (duration == 0) return -1.0; // no reading


  return duration * 0.0343 / 2.0;
}


void notifyClients() {
  String msg = "{\"reps\":" + String(reps) + "}";
  ws.textAll(msg);
}


void setup() {
  Serial.begin(115200);


  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);


  Serial.println("Push-up counter ready");


  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
  }


  Serial.println(WiFi.localIP());


  void onWsEvent(AsyncWebSocket *server, AsyncWebSocketClient *client,
               AwsEventType type, void *arg, uint8_t *data, size_t len) {


  if (type == WS_EVT_CONNECT) {
    client->text("{\"reps\":0}");
  }


  else if (type == WS_EVT_DATA) {
    AwsFrameInfo *info = (AwsFrameInfo*)arg;


    // Only handle full text messages
    if (info->final && info->index == 0 && info->len == len && info->opcode == WS_TEXT) {


      String msg = "";
      for (size_t i = 0; i < len; i++) {
        msg += (char)data[i];
      }
      msg.trim();


      //RESET command
      if (msg == "RESET") {
        reps = 0;
        wentDown = false;
        lastRepTime = 0;


        Serial.println("RESET received");


        // Send updated state back
        client->text("{\"reps\":0}");
      }
    }
  }
}


   
  );
  ws.onEvent(onWsEvent);
  server.addHandler(&ws);
  server.begin();
}


void loop() {
 
float distance = getDistanceCm();
  if (distance < 0) return; // skip bad reads


  unsigned long now = millis();


  // Detect bottom of push-up
  if (distance <= downThresholdCm) {
    wentDown = true;
  }


  // Detect coming back up → count rep
  if (wentDown && distance >= upThresholdCm && (now - lastRepTime > repCooldown)) {
    reps++;
    lastRepTime = now;
    wentDown = false;


    //Only print when a rep is completed
    Serial.print("Reps: ");
    Serial.println(reps);


   
  notifyClients();


  }


  ws.cleanupClients();
}




#include <WiFi.h>
#include <AsyncTCP.h>
#include <ESPAsyncWebServer.h>

const char* ssid = "StarkHacks-2";
const char* password = "StarkHacks2026";

AsyncWebServer server(80);
AsyncWebSocket ws("/ws");

const int trigPin = 17;
const int echoPin = 18;

int reps = 0;
bool wentDown = false;

// Tune these based on your setup
const float downThresholdCm = 8.0;
const float upThresholdCm = 16.0;

unsigned long lastRepTime = 0;
const unsigned long repCooldown = 600;

// Get distance in cm
float getDistanceCm() {
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);

  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);

  long duration = pulseIn(echoPin, HIGH, 30000);
  if (duration == 0) return -1.0;

  return duration * 0.0343 / 2.0;
}

void notifyClients() {
  String msg = "{\"reps\":" + String(reps) + "}";
  ws.textAll(msg);
}

void onWsEvent(AsyncWebSocket *server, AsyncWebSocketClient *client,
               AwsEventType type, void *arg, uint8_t *data, size_t len) {
  if (type == WS_EVT_CONNECT) {
    client->text("{\"reps\":0}");
  }
  else if (type == WS_EVT_DATA) {
    AwsFrameInfo *info = (AwsFrameInfo*)arg;

    if (info->final && info->index == 0 && info->len == len && info->opcode == WS_TEXT) {
      String msg = "";
      for (size_t i = 0; i < len; i++) {
        msg += (char)data[i];
      }
      msg.trim();

      if (msg == "RESET") {
        reps = 0;
        wentDown = false;
        lastRepTime = 0;

        Serial.println("RESET received");
        client->text("{\"reps\":0}");
      }
    }
  }
}

void setup() {
  Serial.begin(115200);

  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);

  Serial.println("Push-up counter ready");

  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
  }

  Serial.println(WiFi.localIP());

  ws.onEvent(onWsEvent);
  server.addHandler(&ws);
  server.begin();
}

void loop() {
  float distance = getDistanceCm();
  if (distance < 0) {
    ws.cleanupClients();
    delay(50);
    return;
  }

  unsigned long now = millis();

  if (distance <= downThresholdCm) {
    wentDown = true;
  }

  if (wentDown && distance >= upThresholdCm && (now - lastRepTime > repCooldown)) {
    reps++;
    lastRepTime = now;
    wentDown = false;

    Serial.print("Reps: ");
    Serial.println(reps);

    notifyClients();
  }

  ws.cleanupClients();
  delay(50);
}

#include <WiFi.h>
#include <AsyncTCP.h>
#include <ESPAsyncWebServer.h>


const char* ssid = "StarkHacks-2";
const char* password = "StarkHacks2026";


AsyncWebServer server(80);
AsyncWebSocket ws("/ws");


const int trigPin = 17;
const int echoPin = 18;


int reps = 0;
bool wentDown = false;


// Tune these based on your setup
const float downThresholdCm = 8.0;
const float upThresholdCm = 16.0;


unsigned long lastRepTime = 0;
const unsigned long repCooldown = 600;


const int buzzer = 47; //buzzer to arduino pin


// Get distance in cm
float getDistanceCm() {
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);


  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);


  long duration = pulseIn(echoPin, HIGH, 30000);
  if (duration == 0) return -1.0;


  return duration * 0.0343 / 2.0;
}


void notifyClients() {
  String msg = "{\"reps\":" + String(reps) + "}";
  ws.textAll(msg);
}


void onWsEvent(AsyncWebSocket *server, AsyncWebSocketClient *client,
               AwsEventType type, void *arg, uint8_t *data, size_t len) {
  if (type == WS_EVT_CONNECT) {
    client->text("{\"reps\":0}");
  }
  else if (type == WS_EVT_DATA) {
    AwsFrameInfo *info = (AwsFrameInfo*)arg;


    if (info->final && info->index == 0 && info->len == len && info->opcode == WS_TEXT) {
      String msg = "";
      for (size_t i = 0; i < len; i++) {
        msg += (char)data[i];
      }
      msg.trim();


      if (msg == "RESET") {
        reps = 0;
        wentDown = false;
        lastRepTime = 0;


        Serial.println("RESET received");
        client->text("{\"reps\":0}");
      }
    }
  }
}


void setup() {
  Serial.begin(115200);


  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);


  pinMode(buzzer, OUTPUT); // Set buzzer - pin 47 as an output


  Serial.println("Push-up counter ready");


  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
  }


  Serial.println(WiFi.localIP());


  tone(buzzer, 1000); // Send 1KHz sound signal...
  delay(1000);
  noTone(buzzer);
 
  ws.onEvent(onWsEvent);
  server.addHandler(&ws);
  server.begin();
}


void loop() {
  float distance = getDistanceCm();
  if (distance < 0) {
    ws.cleanupClients();
    delay(50);
    return;
  }


  unsigned long now = millis();


  if (distance <= downThresholdCm) {
    wentDown = true;
  }


  if (wentDown && distance >= upThresholdCm && (now - lastRepTime > repCooldown)) {
    reps++;
    lastRepTime = now;
    wentDown = false;


    Serial.print("Reps: ");
    Serial.println(reps);


    notifyClients();
  }


  ws.cleanupClients();
  delay(50);
}