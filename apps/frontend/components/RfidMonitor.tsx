"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

interface RfidEvent {
  id: number;
  timestamp: string;
  plate: string;
  rfidTag: string | null;
  granted: boolean;
  ownerName: string | null;
  vehicleModel: string | null;
  vehicleBrand: string | null;
  vehicleColor: string | null;
  department: string | null;
  vehicleStatus: string | null;
  carnetUrl?: string | null;
}

const POLL_INTERVAL_MS = 3000;

function timeAgo(ts: string): string {
  const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (diff < 60) return `hace ${diff}s`;
  if (diff < 3600) return `hace ${Math.floor(diff / 60)}min`;
  return new Date(ts).toLocaleTimeString();
}

export default function RfidMonitor({ zone }: { zone: string }) {
  const router = useRouter();
  const [event, setEvent] = useState<RfidEvent | null>(null);
  const [isLive, setIsLive] = useState(true);
  const [showCarnetModal, setShowCarnetModal] = useState(false);
  const isLiveRef = useRef(isLive);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isNew, setIsNew] = useState(false);
  const lastIdRef = useRef<number | null>(null);

  // Sincroniza el ref con el estado para el closure del setInterval
  useEffect(() => {
    isLiveRef.current = isLive;
  }, [isLive]);

  useEffect(() => {
    const fetchLatest = async () => {
      if (!isLiveRef.current) return;
      try {
        // Cache-buster: agregamos ?t= timestamp para asegurar que el navegador NUNCA use caché
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";
        const normalizedBackendUrl = backendUrl.replace(/\/$/, "");
        const finalUrl = `${normalizedBackendUrl}/api/rfid/latest?zone=${encodeURIComponent(zone)}&t=${Date.now()}`;
        
        console.log(`[RfidMonitor] Polling ${zone}:`, finalUrl);
        
        const res = await fetch(finalUrl, { 
          cache: "no-store",
          headers: { "Accept": "application/json" }
        });
        
        if (!res.ok) {
          console.error(`[RfidMonitor] HTTP Error ${res.status} for ${zone}`);
          return;
        }
        const data = await res.json();

        if (data.event) {
          // Flash animation and full page refresh only when a new event arrives
          if (lastIdRef.current !== null && data.event.id !== lastIdRef.current) {
            setIsNew(true);
            setTimeout(() => setIsNew(false), 1200);
            
            // Refresca silenciosamente el resto de los Server Components de la página (la tabla de logs, etc.)
            router.refresh();
          }
          lastIdRef.current = data.event.id;
          
          setEvent(data.event);
          setLastUpdated(new Date());
        }
      } catch (error) {
        console.error("[RfidMonitor] Error en polling:", error);
      }
    };

    fetchLatest();
    const intervalId = setInterval(fetchLatest, POLL_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [zone]);

  return (
    <div
      className={`card overflow-hidden transition-all duration-500 ${
        isNew ? "ring-2 ring-[var(--color-primary)] shadow-[0_0_20px_var(--color-primary)]/30" : ""
      }`}
    >
      {/* Header */}
      <div className={`bg-gradient-to-r ${zone.includes("Salida") ? "from-amber-600 to-orange-400" : "from-[var(--color-primary)] to-[var(--color-tertiary)]"} px-5 py-3 flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-white text-lg">nfc</span>
          <h3 className="text-white text-xs font-black tracking-widest uppercase">
            Monitor RFID - {zone.includes("Salida") ? "Salida" : "Entrada"}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {isLive && (
            <span className="flex items-center gap-1 text-white/80 text-[0.6rem] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-green-300 animate-pulse" />
              EN VIVO
            </span>
          )}
          <button
            onClick={async () => {
              const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "";
              const normalizedBackendUrl = backendUrl.replace(/\/$/, "");
              await fetch(`${normalizedBackendUrl}/api/rfid?zone=${encodeURIComponent(zone)}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ uid: "TEST-RFID-" + Math.floor(Math.random() * 1000) })
              });
            }}
            className="text-white/70 hover:text-white transition-colors"
            title="Simular lectura en esta zona"
          >
            <span className="material-symbols-outlined text-base">sensors</span>
          </button>
          <button
            onClick={() => setIsLive((p) => !p)}
            className="text-white/70 hover:text-white transition-colors"
            title={isLive ? "Pausar polling" : "Reanudar polling"}
          >
            <span className="material-symbols-outlined text-base">
              {isLive ? "pause_circle" : "play_circle"}
            </span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {event ? (
          <div className={`transition-all duration-500 ${isNew ? "scale-[1.01]" : ""}`}>
            {/* Status Banner */}
            <div
              className={`flex items-center gap-3 p-3 rounded-lg mb-4 ${
                event.granted
                  ? "bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20"
                  : "bg-[var(--color-error)]/10 border border-[var(--color-error)]/20"
              }`}
            >
              <span
                className={`material-symbols-outlined text-2xl ${
                  event.granted ? "text-[var(--color-primary)]" : "text-[var(--color-error)]"
                }`}
              >
                {event.granted ? "verified" : "block"}
              </span>
              <div className="flex-1 min-w-0">
                <p
                  className={`text-xs font-black tracking-wider ${
                    event.granted ? "text-[var(--color-primary)]" : "text-[var(--color-error)]"
                  }`}
                >
                  {event.granted ? "ACCESO CONCEDIDO" : "ACCESO DENEGADO"}
                </p>
                <p className="text-[0.65rem] text-[var(--color-on-surface-variant)] mt-0.5 font-mono truncate">
                  TAG: {event.rfidTag ?? "—"}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-mono text-lg font-black text-[var(--color-on-surface)]">
                  {event.plate === "UNKNOWN" ? "???" : event.plate}
                </p>
                <p className="text-[0.6rem] text-[var(--color-on-surface-variant)]" suppressHydrationWarning>
                  {timeAgo(event.timestamp)}
                </p>
              </div>
            </div>

            {/* Vehicle + Owner Info */}
            {event.plate !== "UNKNOWN" && (
              <div className="space-y-2.5 border-t border-[var(--color-outline-variant)]/15 pt-3">
                <InfoRow
                  icon="person"
                  label="Propietario"
                  value={event.ownerName ?? "Desconocido"}
                />
                {event.vehicleBrand && (
                  <InfoRow
                    icon="directions_car"
                    label="Vehículo"
                    value={`${event.vehicleBrand} ${event.vehicleModel ?? ""}`.trim()}
                  />
                )}
                {event.vehicleColor && (
                  <InfoRow icon="palette" label="Color" value={event.vehicleColor} />
                )}
                {event.department && (
                  <InfoRow icon="domain" label="Departamento" value={event.department} />
                )}

                {/* Carnet Preview section */}
                {event.granted && event.carnetUrl && (
                  <div className="mt-3 p-2.5 bg-[var(--color-surface-container-low)] rounded-xl border border-[var(--color-outline-variant)]/10 flex flex-col gap-2">
                    <div className="flex justify-between items-center px-1">
                      <span className="text-[0.65rem] font-black uppercase tracking-wider text-[var(--color-primary)] flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">badge</span>
                        Constatar Carnet Asociado
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowCarnetModal(true)}
                        className="text-[0.65rem] font-bold text-[var(--color-primary)] hover:underline flex items-center gap-0.5"
                      >
                        <span className="material-symbols-outlined text-xs">zoom_in</span>
                        Ampliar
                      </button>
                    </div>
                    <div 
                      onClick={() => setShowCarnetModal(true)}
                      className="relative cursor-zoom-in group overflow-hidden rounded-lg border border-[var(--color-outline-variant)]/20 bg-black/5 aspect-[4/3] flex items-center justify-center transition-all duration-300 hover:brightness-95"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={event.carnetUrl} 
                        alt="Carnet de conductor" 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                          const fallback = e.currentTarget.parentElement?.querySelector(".fallback-element");
                          if (fallback) fallback.classList.remove("hidden");
                        }}
                      />
                      <div className="fallback-element hidden flex flex-col items-center justify-center gap-2 p-4 text-[var(--color-on-surface-variant)] text-center">
                        <span className="material-symbols-outlined text-3xl opacity-40">picture_as_pdf</span>
                        <span className="text-[0.65rem] font-bold opacity-75">Documento Carnet (PDF / Archivo)</span>
                        <a 
                          href={event.carnetUrl} 
                          target="_blank" 
                          rel="noreferrer" 
                          onClick={(e) => e.stopPropagation()} 
                          className="mt-1 px-3 py-1 bg-[var(--color-primary)] text-white text-[0.6rem] rounded font-bold hover:brightness-110 flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-xs">open_in_new</span>
                          Ver Documento
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {event.plate === "UNKNOWN" && (
              <p className="text-center text-[var(--color-on-surface-variant)] text-xs py-2">
                TAG no registrado en el sistema
              </p>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 gap-3 text-[var(--color-on-surface-variant)]">
            <span className="material-symbols-outlined text-4xl opacity-30">nfc</span>
            <p className="text-xs font-semibold">Esperando lectura RFID...</p>
            <p className="text-[0.65rem] opacity-60">
              El ESP32 notificará aquí cuando detecte un TAG
            </p>
          </div>
        )}

        {/* Footer */}
        {lastUpdated && (
          <p className="text-[0.6rem] text-[var(--color-on-surface-variant)]/60 text-right mt-3 font-mono" suppressHydrationWarning>
            Sync: {lastUpdated.toLocaleTimeString()}
          </p>
        )}
      </div>

      {/* Carnet Fullscreen Modal */}
      {showCarnetModal && event?.carnetUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm animate-fade-in p-4">
          <div className="relative max-w-2xl w-full bg-[var(--color-surface-container-lowest)] rounded-2xl border border-[var(--color-outline-variant)]/20 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center px-6 py-4 border-b border-[var(--color-outline-variant)]/10 bg-[var(--color-surface-container-low)]">
              <div className="flex items-center gap-2 text-[var(--color-on-surface)]">
                <span className="material-symbols-outlined text-lg text-[var(--color-primary)]">badge</span>
                <span className="font-bold text-sm">Constatación de Conductor (RFID)</span>
              </div>
              <button
                type="button"
                onClick={() => setShowCarnetModal(false)}
                className="text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)] w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/5 transition-all"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
            <div className="p-6 flex-1 overflow-y-auto flex items-center justify-center bg-black/5 min-h-[300px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={event.carnetUrl} 
                alt="Carnet Completo" 
                className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-lg border border-[var(--color-outline-variant)]/10"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  const fallback = e.currentTarget.parentElement?.querySelector(".modal-fallback-element");
                  if (fallback) fallback.classList.remove("hidden");
                }}
              />
              <div className="modal-fallback-element hidden flex flex-col items-center justify-center gap-3 p-8 text-center text-[var(--color-on-surface)]">
                <span className="material-symbols-outlined text-5xl text-[var(--color-primary)]">picture_as_pdf</span>
                <h4 className="font-bold text-sm">El carnet está en un formato no visualizable (ej. PDF)</h4>
                <p className="text-xs text-[var(--color-on-surface-variant)] max-w-sm">
                  Haz clic en el siguiente enlace para descargar o visualizar el documento de identidad en una nueva pestaña.
                </p>
                <a 
                  href={event.carnetUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  className="mt-2 px-5 py-2 bg-[var(--color-primary)] text-white text-xs rounded-lg font-bold hover:brightness-110 flex items-center gap-1.5 shadow-md"
                >
                  <span className="material-symbols-outlined text-sm">open_in_new</span>
                  Abrir Documento Carnet
                </a>
              </div>
            </div>
            <div className="px-6 py-4 bg-[var(--color-surface-container-low)] border-t border-[var(--color-outline-variant)]/10 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCarnetModal(false)}
                className="px-4 py-2 bg-[var(--color-surface-container-high)] hover:bg-[var(--color-surface-container-highest)] text-[var(--color-on-surface)] text-xs font-bold rounded-lg transition-all"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="material-symbols-outlined text-sm text-[var(--color-primary)] w-4 shrink-0">
        {icon}
      </span>
      <span className="text-[0.7rem] text-[var(--color-on-surface-variant)] w-20 shrink-0">
        {label}
      </span>
      <span className="text-xs font-bold text-[var(--color-on-surface)] truncate">{value}</span>
    </div>
  );
}
