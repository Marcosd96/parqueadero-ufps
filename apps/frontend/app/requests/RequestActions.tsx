"use client";

import { useState, useTransition } from "react";
import { updateAccessRequestStatus } from "../actions";

export default function RequestActions({ requestId, currentStatus }: { requestId: number, currentStatus: string }) {
  const [isPending, startTransition] = useTransition();
  const [showTagInput, setShowTagInput] = useState(false);
  const [rfidTag, setRfidTag] = useState("");

  const handleUpdate = (status: string) => {
    // Si estamos asignando un TAG, necesitamos mostrar el input primero
    if (!showTagInput && (status === "APROBADO" || (status === "UPDATE_TAG" && (currentStatus === "APROBADO" || currentStatus === "APPROVED")))) {
      setShowTagInput(true);
      return;
    }

    const finalStatus = status === "UPDATE_TAG" ? currentStatus : status;

    startTransition(async () => {
      const result = await updateAccessRequestStatus(requestId, finalStatus, rfidTag);
      if (result.success) {
        setShowTagInput(false);
        setRfidTag("");
      } else {
        alert(result.error);
      }
    });
  };

  return (
    <div className="flex items-center justify-end gap-2">
      {/* Tag Input Overlay (Unified for Pending and Approved) */}
      {showTagInput && (
        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4">
          <input
            type="text"
            placeholder="UID del TAG"
            value={rfidTag}
            onChange={(e) => setRfidTag(e.target.value)}
            className="bg-[var(--color-surface-container-low)] border border-[var(--color-primary)]/30 rounded-lg px-3 py-1 text-xs text-[var(--color-on-surface)] w-32 focus:ring-1 focus:ring-[var(--color-primary)] outline-none"
            autoFocus
          />
          <button
            onClick={() => setShowTagInput(false)}
            className="text-[var(--color-on-surface-variant)] hover:text-[var(--color-error)]"
          >
            <span className="material-symbols-outlined text-sm">cancel</span>
          </button>
        </div>
      )}

      {/* Pending Status Actions */}
      {currentStatus === "PENDIENTE" && (
        <>
          <button 
            onClick={() => handleUpdate("APROBADO")}
            disabled={isPending}
            className={`w-8 h-8 flex items-center justify-center rounded-lg shadow-sm hover:scale-110 active:scale-95 transition-all disabled:opacity-50 ${
              showTagInput ? "bg-green-600 text-white" : "bg-[var(--color-primary)] text-white"
            }`}
            title={showTagInput ? "Confirmar Aprobación con TAG" : "Aprobar Solicitud"}
          >
            <span className="material-symbols-outlined text-sm">
              {isPending ? "sync" : "check"}
            </span>
          </button>

          {!showTagInput && (
            <button 
              onClick={() => handleUpdate("RECHAZADO")}
              disabled={isPending}
              className="w-8 h-8 flex items-center justify-center bg-[var(--color-error-container)] text-[var(--color-on-error-container)] rounded-lg shadow-sm hover:scale-110 active:scale-95 transition-all disabled:opacity-50"
              title="Rechazar Solicitud"
            >
              <span className="material-symbols-outlined text-sm">
                {isPending ? "sync" : "close"}
              </span>
            </button>
          )}
        </>
      )}

      {/* Approved Status Actions */}
      {(currentStatus === "APROBADO" || currentStatus === "APPROVED") && (
        <>
          <button 
            onClick={() => handleUpdate("UPDATE_TAG")}
            disabled={isPending}
            className={`w-8 h-8 flex items-center justify-center rounded-lg shadow-sm hover:scale-110 active:scale-95 transition-all disabled:opacity-50 ${
              showTagInput ? "bg-green-600 text-white" : "bg-blue-100 text-blue-700"
            }`}
            title={showTagInput ? "Confirmar nuevo TAG" : "Asignar/Cambiar TAG RFID"}
          >
            <span className="material-symbols-outlined text-sm">
              {isPending ? "sync" : "nfc"}
            </span>
          </button>
          {!showTagInput && (
            <button 
              onClick={() => handleUpdate("RECHAZADO")}
              disabled={isPending}
              className="w-8 h-8 flex items-center justify-center bg-red-100 text-red-700 rounded-lg shadow-sm hover:scale-110 active:scale-95 transition-all disabled:opacity-50"
              title="Revocar Acceso"
            >
              <span className="material-symbols-outlined text-sm">block</span>
            </button>
          )}
        </>
      )}

      {/* Rejected Status Actions */}
      {currentStatus === "RECHAZADO" && !showTagInput && (
        <button 
          onClick={() => handleUpdate("PENDIENTE")}
          disabled={isPending}
          className="w-8 h-8 flex items-center justify-center bg-slate-100 text-slate-600 rounded-lg shadow-sm hover:scale-110 active:scale-95 transition-all disabled:opacity-50"
          title="Restaurar a Pendiente"
        >
          <span className="material-symbols-outlined text-sm">undo</span>
        </button>
      )}
    </div>
  );
}
