"use client";

import { useState } from "react";
import { verifyPlate, registerAccess } from "@/app/actions";

export default function PlateVerification({ zone }: { zone: string }) {
  const [plate, setPlate] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCarnetModal, setShowCarnetModal] = useState(false);
  const [result, setResult] = useState<{
    status: string;
    type?: string;
    ownerName?: string;
    reason?: string;
    carnetUrl?: string | null;
  } | null>(null);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plate.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await verifyPlate(plate.toUpperCase().trim(), zone);
      setResult(res);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (granted: boolean) => {
    setLoading(true);
    try {
      await registerAccess(
        plate.toUpperCase().trim(),
        granted,
        result?.type || "Desconocido",
        zone
      );
      setResult(null);
      setPlate("");
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Error al registrar acceso");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card-padded mb-6">
      <h4 className="text-[0.7rem] font-black text-[var(--color-on-surface-variant)] tracking-widest uppercase mb-4">
        Verificación Manual - {zone.includes("Salida") ? "Salida" : "Entrada"}
      </h4>
      <form onSubmit={handleVerify} className="flex gap-2 mb-4">
        <input
          type="text"
          value={plate}
          onChange={(e) => setPlate(e.target.value)}
          placeholder="Ej: ABC-123"
          className="flex-1 bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)]/30 rounded-lg px-3 py-2 text-sm font-mono uppercase text-[var(--color-on-surface)] focus:outline-none focus:border-[var(--color-primary)]"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !plate.trim()}
          className={`px-4 py-2 rounded-lg font-bold text-sm hover:brightness-110 disabled:opacity-50 transition-all ${
            zone.includes("Salida") ? "bg-amber-600 text-white" : "bg-[var(--color-primary)] text-[var(--color-on-primary)]"
          }`}
        >
          {loading && !result ? "Verificando..." : "Verificar"}
        </button>
      </form>

      {result && (
        <div className="p-4 rounded-lg bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)]/20 animate-fade-in">
          <div className="flex items-center gap-3 mb-3">
            <span
              className={`material-symbols-outlined text-2xl ${
                result.status === "authorized"
                  ? "text-[var(--color-primary)]"
                  : "text-[var(--color-error)]"
              }`}
            >
              {result.status === "authorized" ? "check_circle" : "cancel"}
            </span>
            <div>
              <h5 className="font-bold text-[var(--color-on-surface)] text-sm">
                {result.status === "authorized" ? "Vehículo Autorizado" : "Vehículo No Autorizado"}
              </h5>
              <p className="text-xs text-[var(--color-on-surface-variant)]">
                {result.status === "authorized"
                  ? `${result.ownerName} (${result.type})`
                  : result.reason}
              </p>
            </div>
          </div>

          {/* Carnet Preview section */}
          {result.status === "authorized" && result.carnetUrl && (
            <div className="mt-3 mb-4 p-2.5 bg-[var(--color-surface-container-low)] rounded-xl border border-[var(--color-outline-variant)]/10 flex flex-col gap-2">
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
                  src={result.carnetUrl} 
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
                    href={result.carnetUrl} 
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

          <div className="flex gap-2 pt-3 border-t border-[var(--color-outline-variant)]/10">
            <button
              onClick={() => handleRegister(true)}
              disabled={loading}
              className={`flex-1 py-2 rounded font-bold text-xs flex items-center justify-center gap-1 transition-all ${
                result.status === "authorized"
                  ? (zone.includes("Salida") ? "bg-amber-600 text-white hover:bg-amber-700" : "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary)]/90")
                  : "bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)] hover:bg-[var(--color-primary)] hover:text-white"
              }`}
            >
              <span className="material-symbols-outlined text-sm">{zone.includes("Salida") ? "logout" : "login"}</span>
              {zone.includes("Salida") ? "Permitir Salida" : "Permitir Entrada"}
            </button>
            <button
              onClick={() => handleRegister(false)}
              disabled={loading}
              className={`flex-1 py-2 rounded font-bold text-xs flex items-center justify-center gap-1 transition-all ${
                result.status === "unauthorized"
                  ? "bg-[var(--color-error)] text-white hover:bg-[var(--color-error)]/90"
                  : "bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)] hover:bg-[var(--color-error)] hover:text-white"
              }`}
            >
              <span className="material-symbols-outlined text-sm">block</span>
              Denegar
            </button>
          </div>
        </div>
      )}

      {/* Carnet Fullscreen Modal */}
      {showCarnetModal && result?.carnetUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm animate-fade-in p-4">
          <div className="relative max-w-2xl w-full bg-[var(--color-surface-container-lowest)] rounded-2xl border border-[var(--color-outline-variant)]/20 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center px-6 py-4 border-b border-[var(--color-outline-variant)]/10 bg-[var(--color-surface-container-low)]">
              <div className="flex items-center gap-2 text-[var(--color-on-surface)]">
                <span className="material-symbols-outlined text-lg text-[var(--color-primary)]">badge</span>
                <span className="font-bold text-sm">Constatación de Conductor</span>
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
                src={result.carnetUrl} 
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
                  href={result.carnetUrl} 
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
