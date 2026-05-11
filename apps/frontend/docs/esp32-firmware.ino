/**
 * ============================================================
 * FIRMWARE ESP32 + RC522 - Sistema de Parqueadero UFPS
 * ============================================================
 * Hardware requerido:
 *   - Placa: ESP32 (cualquier variante con Wi-Fi)
 *   - Lector RFID: MFRC522 (RC522)
 *   - (Opcional) Relay o buzzer para control de barrera
 *
 * Conexiones RC522 → ESP32 (SPI):
 *   RC522 SDA  → GPIO 5  (SS/CS)
 *   RC522 SCK  → GPIO 18 (SCLK)
 *   RC522 MOSI → GPIO 23
 *   RC522 MISO → GPIO 19
 *   RC522 IRQ  → No conectar
 *   RC522 GND  → GND
 *   RC522 RST  → GPIO 22
 *   RC522 3.3V → 3.3V
 *
 * (Opcional) Relay/Buzzer:
 *   Relay IN   → GPIO 26
 *
 * Librerías necesarias (instalar en Arduino IDE / PlatformIO):
 *   - MFRC522 by GithubCommunity
 *   - ArduinoJson by Benoit Blanchon
 *   - WiFi (incluida en ESP32 board package)
 *   - HTTPClient (incluida en ESP32 board package)
 * ============================================================
 */

#include <SPI.h>
#include <MFRC522.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// ─── CONFIGURACIÓN ────────────────────────────────────────────
const char* WIFI_SSID     = "Oriana";          // <-- Cambiar
const char* WIFI_PASSWORD = "11113333";         // <-- Cambiar

// IP local del PC donde corre el servidor Next.js (dev)
// Para producción: usar dominio o IP pública
const char* SERVER_URL = "http://192.168.137.244:4000/api/rfid"; // <-- Cambiar IP

// Pines
#define SS_PIN   5
#define RST_PIN  22
#define RELAY_PIN 26   // GPIO del relay (opcional)

// Tiempo mínimo entre lecturas del mismo TAG (ms)
#define READ_COOLDOWN_MS 3000

// ─── VARIABLES GLOBALES ───────────────────────────────────────
MFRC522 mfrc522(SS_PIN, RST_PIN);
String lastUid = "";
unsigned long lastReadTime = 0;

// ─── SETUP ────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  // Pequeña pausa para que el monitor serial alcance a abrirse
  delay(1000);
  Serial.println("\n\n--- INICIANDO SISTEMA ---");

  Serial.println("[Init] Iniciando SPI...");
  SPI.begin();

  Serial.println("[Init] Iniciando Lector RFID...");
  mfrc522.PCD_Init();
  
  Serial.println("[Init] Configurando Relay...");
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, LOW); // Barrera cerrada por defecto

  Serial.println("[RFID] Lector MFRC522 Inicializado.");
  mfrc522.PCD_DumpVersionToSerial();

  // Conectar a Wi-Fi
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("[Wi-Fi] Conectando");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\n[Wi-Fi] Conectado! IP: " + WiFi.localIP().toString());
  Serial.println("[RFID] Listo. Acerca un TAG...");
}

// ─── LOOP ─────────────────────────────────────────────────────
void loop() {
  // Esperar a que haya un TAG presente
  if (!mfrc522.PICC_IsNewCardPresent() || !mfrc522.PICC_ReadCardSerial()) {
    return;
  }

  // Formatear UID como "AA:BB:CC:DD"
  String uid = "";
  for (byte i = 0; i < mfrc522.uid.size; i++) {
    if (i > 0) uid += ":";
    if (mfrc522.uid.uidByte[i] < 0x10) uid += "0";
    uid += String(mfrc522.uid.uidByte[i], HEX);
  }
  uid.toUpperCase();

  mfrc522.PICC_HaltA();
  mfrc522.PCD_StopCrypto1();

  // Anti-rebote: ignorar si es el mismo TAG y no ha pasado el cooldown
  unsigned long now = millis();
  if (uid == lastUid && (now - lastReadTime) < READ_COOLDOWN_MS) {
    return;
  }

  lastUid = uid;
  lastReadTime = now;

  Serial.println("\n[TAG] UID leído: " + uid);
  sendToServer(uid);
}

// ─── FUNCIÓN: Enviar UID al servidor ──────────────────────────
void sendToServer(const String& uid) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[Error] Sin conexión Wi-Fi. Reconectando...");
    WiFi.reconnect();
    delay(2000);
    return;
  }

  HTTPClient http;
  http.begin(SERVER_URL);
  http.addHeader("Content-Type", "application/json");

  // Construir JSON: { "uid": "AA:BB:CC:DD" }
  StaticJsonDocument<128> doc;
  doc["uid"] = uid;
  String body;
  serializeJson(doc, body);

  Serial.println("[HTTP] POST " + String(SERVER_URL));
  Serial.println("[HTTP] Body: " + body);

  int httpCode = http.POST(body);

  if (httpCode == HTTP_CODE_OK || httpCode == 200) {
    String response = http.getString();
    Serial.println("[HTTP] Respuesta: " + response);

    // Parsear respuesta JSON
    StaticJsonDocument<256> res;
    DeserializationError err = deserializeJson(res, response);

    if (!err) {
      bool granted = res["granted"];
      const char* plate = res["plate"] | "???";
      const char* ownerName = res["ownerName"] | "Desconocido";

      if (granted) {
        Serial.println("✅ ACCESO CONCEDIDO");
        Serial.println("   Placa: " + String(plate));
        Serial.println("   Propietario: " + String(ownerName));
        openBarrier(); // Abrir barrera
      } else {
        const char* reason = res["reason"] | "Denegado";
        Serial.println("❌ ACCESO DENEGADO: " + String(reason));
        denyAccess();  // Señal de denegación
      }
    }
  } else {
    Serial.println("[HTTP] Error: " + String(httpCode));
  }

  http.end();
}

// ─── CONTROL DE BARRERA ───────────────────────────────────────

/**
 * openBarrier: Activa el relay durante 5 segundos para abrir la barrera,
 * luego la cierra automáticamente.
 * Ajusta el tiempo según tu hardware.
 */
void openBarrier() {
  Serial.println("[Barrera] ABRIENDO...");
  digitalWrite(RELAY_PIN, HIGH);
  delay(5000);           // Barrera abierta por 5 segundos
  digitalWrite(RELAY_PIN, LOW);
  Serial.println("[Barrera] CERRADA");
}

/**
 * denyAccess: Puedes agregar un buzzer o LED rojo aquí.
 * Por ahora solo imprime en serial.
 */
void denyAccess() {
  Serial.println("[Barrera] Acceso denegado - sin acción física.");
  // Ejemplo con buzzer en GPIO 25:
  // tone(25, 1000, 500); // 1kHz por 500ms
}
