"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition, useEffect, useState } from "react";

export default function RegistrationFilters({ 
  initialQuery = "", 
  initialStatus = "PENDIENTE",
  totalCount = 0
}: { 
  initialQuery?: string;
  initialStatus?: string;
  totalCount: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState(initialQuery);

  // Status options
  const statuses = [
    { label: "Pendientes", value: "PENDIENTE" },
    { label: "Aprobados", value: "APROBADO" },
    { label: "Rechazados", value: "RECHAZADO" },
    { label: "Todo", value: "TODO" },
  ];

  const updateFilters = (newQuery: string, newStatus: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (newQuery) {
      params.set("query", newQuery);
    } else {
      params.delete("query");
    }

    if (newStatus && newStatus !== "TODO") {
      params.set("status", newStatus);
    } else {
      params.delete("status");
    }

    // Reset to page 1 on filter change
    params.delete("page");

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query !== initialQuery) {
        updateFilters(query, initialStatus);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const handleStatusChange = (status: string) => {
    updateFilters(query, status);
  };

  return (
    <div className="space-y-4">
      {/* Status Filter Buttons */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-1 bg-[var(--color-surface-container-low)] p-1 rounded-lg overflow-x-auto no-scrollbar">
          {statuses.map((s) => (
            <button
              key={s.value}
              onClick={() => handleStatusChange(s.value)}
              className={`px-4 md:px-6 py-2 text-xs md:text-sm font-bold rounded-md font-[var(--font-label)] transition-all whitespace-nowrap ${
                initialStatus === s.value || (s.value === "TODO" && !initialStatus)
                  ? "bg-[var(--color-surface-container-lowest)] text-[var(--color-primary)] shadow-sm"
                  : "text-[var(--color-on-surface-variant)] font-medium hover:bg-[var(--color-surface-container-high)]"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search Bar */}
      <div className="filter-bar">
        <div className="search-input-wrapper">
          <span className="material-symbols-outlined search-icon">
            {isPending ? "sync" : "search"}
          </span>
          <input
            className="search-input"
            placeholder="Buscar por nombre, código o placa..."
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="h-6 w-px bg-[var(--color-outline-variant)]/30 hidden md:block" />
        <p className="text-xs font-bold text-[var(--color-on-surface-variant)] uppercase tracking-widest">
          {totalCount} Solicitudes {initialStatus !== "TODO" ? initialStatus.toLowerCase() : ""}s
        </p>
      </div>
    </div>
  );
}
