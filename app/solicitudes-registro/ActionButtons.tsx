"use client";

import { updateRegistrationStatus } from "./actions";
import { useState } from "react";

export default function ActionButtons({ id }: { id: number }) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleAction = async (status: "APROBADO" | "RECHAZADO") => {
    setLoading(status);
    const result = await updateRegistrationStatus(id, status);

    if (result.error) {
      alert(`Error: ${result.error}`);
    } else if (result.emailError) {
      // DB update was successful but email failed — warn the admin
      alert(`⚠️ ${result.emailError}`);
    }

    setLoading(null);
  };

  return (
    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
      <button
        onClick={() => handleAction("APROBADO")}
        disabled={loading !== null}
        className="w-8 h-8 flex items-center justify-center bg-[var(--color-primary)] text-white rounded-lg shadow-sm hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
      >
        <span className="material-symbols-outlined text-sm">
          {loading === "APROBADO" ? "sync" : "check"}
        </span>
      </button>
      <button
        onClick={() => handleAction("RECHAZADO")}
        disabled={loading !== null}
        className="w-8 h-8 flex items-center justify-center bg-[var(--color-error-container)] text-[var(--color-on-error-container)] rounded-lg shadow-sm hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
      >
        <span className="material-symbols-outlined text-sm">
          {loading === "RECHAZADO" ? "sync" : "close"}
        </span>
      </button>
    </div>
  );
}
