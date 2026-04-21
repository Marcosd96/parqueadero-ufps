"use client";

import { useState } from "react";
import { verifyPlate, registerAccess } from "@/app/actions";

export default function PlateVerification() {
  const [plate, setPlate] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    status: string;
    type?: string;
    ownerName?: string;
    reason?: string;
  } | null>(null);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plate.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await verifyPlate(plate.toUpperCase().trim());
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
        "Zona A - Principal"
      );
      setResult(null);
      setPlate("");
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card-padded mb-6">
      <h4 className="text-[0.7rem] font-black text-[var(--color-on-surface-variant)] tracking-widest uppercase mb-4">
        Verificación Manual de Placa
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
          className="bg-[var(--color-primary)] text-[var(--color-on-primary)] px-4 py-2 rounded-lg font-bold text-sm hover:brightness-110 disabled:opacity-50 transition-all"
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
          <div className="flex gap-2 pt-3 border-t border-[var(--color-outline-variant)]/10">
            <button
              onClick={() => handleRegister(true)}
              disabled={loading}
              className={`flex-1 py-2 rounded font-bold text-xs flex items-center justify-center gap-1 transition-all ${
                result.status === "authorized"
                  ? "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary)]/90"
                  : "bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)] hover:bg-[var(--color-primary)] hover:text-white"
              }`}
            >
              <span className="material-symbols-outlined text-sm">login</span>
              Permitir
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
    </div>
  );
}
