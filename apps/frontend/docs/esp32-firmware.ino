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
 *
 * MODO LECTOR ÚNICO:
 *   Al arrancar, el ESP32 consulta el servidor para saber en
 *   qué zona está configurado (Entrada o Salida). Desde el
 *   dashboard puedes cambiar la zona sin reflashear el firmware.
 * ============================================================
 */

#include <SPI.h>
#include <MFRC522.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// ─── CONFIGURACIÓN ────────────────────────────────────────────
const char* WIFI_SSID     = "TIC's";          // <-- Cambiar
const char* WIFI_PASSWORD = "123456789";         // <-- Cambiar

// IP local del PC donde corre el servidor Express (backend)
// Para producción: usar dominio o IP pública
const char* SERVER_BASE   = "http://192.168.137.244:4000"; // <-- Cambiar IP

// Pines
#define SS_PIN    5
#define RST_PIN   22
#define RELAY_PIN 26   // GPIO del relay (opcional)

// Tiempo mínimo entre lecturas del mismo TAG (ms)
#define READ_COOLDOWN_MS 3000

// Intervalo para re-consultar la zona activa desde el servidor (ms)
#define ZONE_REFRESH_MS 10000

// ─── VARIABLES GLOBALES ───────────────────────────────────────
MFRC522 mfrc522(SS_PIN, RST_PIN);
String lastUid        = "";
unsigned long lastReadTime = 0;
unsigned long lastZoneCheck = 0;

// Zona activa del lector: "Entrada Principal" o "Salida Principal"
// Se obtiene del servidor y se refresca periódicamente.
String activeZone = "Entrada Principal";

// ─── PROTOTIPOS ───────────────────────────────────────────────
void fetchActiveZone();
void sendToServer(const String& uid);
void openBarrier();
void denyAccess();

// ─── SETUP ────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
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

  // FIX: Consultar la zona activa desde el servidor al arrancar
  fetchActiveZone();

  Serial.println("[RFID] Listo. Acerca un TAG...");
}

// ─── LOOP ─────────────────────────────────────────────────────
void loop() {
  // FIX: Refrescar la zona activa periódicamente (sin bloquear)
  unsigned long now = millis();
  if (now - lastZoneCheck >= ZONE_REFRESH_MS) {
    fetchActiveZone();
    lastZoneCheck = now;
  }

  // Esperar a que haya un TAG presente
  if (!mfrc522.PICC_IsNewCardPresent() || !mfrc522.PICC_ReadCardSerial()) {
    return;
  }

  // Formatear UID como "AA:BB:CC:DD" en MAYÚSCULAS
  String uid = "";
  for (byte i = 0; i < mfrc522.uid.size; i++) {
    if (i > 0) uid += ":";
    if (mfrc522.uid.uidByte[i] < 0x10) uid += "0";
    uid += String(mfrc522.uid.uidByte[i], HEX);
  }
  // FIX: toUpperCase() modifica in-place pero el resultado se perdía.
  // Ahora se reasigna explícitamente.
  uid.toUpperCase();
  // Nota: en el SDK de Arduino para ESP32, toUpperCase() sí modifica in-place,
  // pero para mayor seguridad se fuerza la reasignación con un helper:
  String uidUpper = uid;
  uidUpper.toUpperCase();
  uid = uidUpper;

  mfrc522.PICC_HaltA();
  mfrc522.PCD_StopCrypto1();

  // Anti-rebote: ignorar si es el mismo TAG y no ha pasado el cooldown
  now = millis();
  if (uid == lastUid && (now - lastReadTime) < READ_COOLDOWN_MS) {
    return;
  }

  lastUid = uid;
  lastReadTime = now;

  Serial.println("\n[TAG] UID leído: " + uid);
  Serial.println("[TAG] Zona activa: " + activeZone);
  sendToServer(uid);
}

// ─── FUNCIÓN: Consultar zona activa desde el servidor ─────────
/**
 * FIX CRÍTICO: El firmware nunca preguntaba al servidor en qué
 * zona estaba configurado. Ahora consulta GET /api/rfid/config
 * para obtener globalActiveZone y sincronizarse con el dashboard.
 */
void fetchActiveZone() {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  String configUrl = String(SERVER_BASE) + "/api/rfid/config";
  http.begin(configUrl);

  int httpCode = http.GET();
  if (httpCode == 200) {
    String response = http.getString();
    StaticJsonDocument<128> doc;
    DeserializationError err = deserializeJson(doc, response);
    if (!err && doc.containsKey("globalActiveZone")) {
      activeZone = doc["globalActiveZone"].as<String>();
      Serial.println("[Config] Zona activa recibida: " + activeZone);
    }
  } else {
    Serial.println("[Config] No se pudo obtener zona, usando: " + activeZone);
  }
  http.end();
}

// ─── FUNCIÓN: Enviar UID al servidor ──────────────────────────
/**
 * FIX: Ahora envía el campo "zone" en el body JSON para que el
 * backend registre correctamente si es Entrada o Salida,
 * independientemente del estado global del servidor.
 */
void sendToServer(const String& uid) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[Error] Sin conexión Wi-Fi. Reconectando...");
    WiFi.reconnect();
    delay(2000);
    return;
  }

  HTTPClient http;
  // Usar endpoint genérico con la zona en el body
  String postUrl = String(SERVER_BASE) + "/api/rfid";
  http.begin(postUrl);
  http.addHeader("Content-Type", "application/json");

  // FIX: Incluir "zone" en el JSON para que el backend lo priorice
  // sobre el estado global y registre la zona correctamente.
  StaticJsonDocument<200> doc;
  doc["uid"]  = uid;
  doc["zone"] = activeZone;
  String body;
  serializeJson(doc, body);

  Serial.println("[HTTP] POST " + postUrl);
  Serial.println("[HTTP] Body: " + body);

  int httpCode = http.POST(body);

  if (httpCode == HTTP_CODE_OK || httpCode == 200) {
    String response = http.getString();
    Serial.println("[HTTP] Respuesta: " + response);

    // FIX: Aumentar buffer a 512 bytes para evitar truncamiento
    // con respuestas que incluyan ownerName, vehicleModel, debug, etc.
    StaticJsonDocument<512> res;
    DeserializationError err = deserializeJson(res, response);

    if (!err) {
      bool granted = res["granted"];
      const char* plate     = res["plate"]     | "???";
      const char* ownerName = res["ownerName"] | "Desconocido";

      if (granted) {
        Serial.println("✅ ACCESO CONCEDIDO");
        Serial.println("   Placa: "       + String(plate));
        Serial.println("   Propietario: " + String(ownerName));
        Serial.println("   Zona: "        + activeZone);
        openBarrier();
      } else {
        const char* reason = res["reason"] | "Denegado";
        Serial.println("❌ ACCESO DENEGADO: " + String(reason));
        denyAccess();
      }
    } else {
      Serial.println("[HTTP] Error al parsear JSON: " + String(err.c_str()));
    }
  } else {
    Serial.println("[HTTP] Error HTTP: " + String(httpCode));
  }

  http.end();
}

// ─── CONTROL DE BARRERA ───────────────────────────────────────

/**
 * openBarrier: Activa el relay durante 5 segundos para abrir la barrera,
 * luego la cierra automáticamente.
 */
void openBarrier() {
  Serial.println("[Barrera] ABRIENDO...");
  digitalWrite(RELAY_PIN, HIGH);
  delay(5000);
  digitalWrite(RELAY_PIN, LOW);
  Serial.println("[Barrera] CERRADA");
}

/**
 * denyAccess: Puedes agregar un buzzer o LED rojo aquí.
 */
void denyAccess() {
  Serial.println("[Barrera] Acceso denegado - sin acción física.");
  // Ejemplo con buzzer en GPIO 25:
  // tone(25, 1000, 500); // 1kHz por 500ms
}
