"use client";

import { useTransition } from "react";
import { updateAccessRequestStatus } from "../actions";

export default function RequestActions({ requestId }: { requestId: number }) {
  const [isPending, startTransition] = useTransition();

  const handleUpdate = (status: string) => {
    startTransition(async () => {
      const result = await updateAccessRequestStatus(requestId, status);
      if (!result.success) {
        alert(result.error);
      }
    });
  };

  return (
    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
      <button 
        onClick={() => handleUpdate("APROBADO")}
        disabled={isPending}
        className="w-8 h-8 flex items-center justify-center bg-[var(--color-primary)] text-white rounded-lg shadow-sm hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
        title="Aprobar Solicitud"
      >
        <span className="material-symbols-outlined text-sm">
          {isPending ? "sync" : "check"}
        </span>
      </button>
      <button 
        onClick={() => handleUpdate("RECHAZADO")}
        disabled={isPending}
        className="w-8 h-8 flex items-center justify-center bg-[var(--color-error-container)] text-[var(--color-on-error-container)] rounded-lg shadow-sm hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
        title="Rechazar Solicitud"
      >
        <span className="material-symbols-outlined text-sm">
          {isPending ? "sync" : "close"}
        </span>
      </button>
    </div>
  );
}
