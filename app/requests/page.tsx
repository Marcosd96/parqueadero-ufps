export const dynamic = "force-dynamic";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Solicitudes de TAG de Visitante | Campus ParkGuard",
  description: "Revisar y gestionar el acceso temporal al estacionamiento para invitados del campus",
};

import { AccessRequest } from "@/generated/prisma/client/index.js";
import prisma from "@/lib/prisma";

export default async function RequestsPage() {
  const requests = await prisma.accessRequest.findMany({
    orderBy: {
      visitDate: "desc",
    },
  });

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <div className="page-wrapper space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Solicitudes de TAG de Visitante</h2>
          <p className="page-subtitle">
            Revisar y gestionar el acceso temporal al estacionamiento para invitados del campus.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-[var(--color-surface-container-low)] p-1 rounded-lg overflow-x-auto no-scrollbar max-w-full">
          <button className="flex-1 min-w-[100px] px-4 md:px-6 py-2 bg-[var(--color-surface-container-lowest)] text-[var(--color-primary)] font-bold shadow-sm rounded-md font-[var(--font-label)] text-xs md:text-sm">
            Pendientes
          </button>
          <button className="flex-1 min-w-[100px] px-4 md:px-6 py-2 text-[var(--color-on-surface-variant)] font-medium hover:bg-[var(--color-surface-container-high)] rounded-md font-[var(--font-label)] text-xs md:text-sm transition-all">
            Aprobados
          </button>
          <button className="flex-1 min-w-[100px] px-4 md:px-6 py-2 text-[var(--color-on-surface-variant)] font-medium hover:bg-[var(--color-surface-container-high)] rounded-md font-[var(--font-label)] text-xs md:text-sm transition-all">
            Expirados
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="filter-bar">
        <div className="search-input-wrapper">
          <span className="material-symbols-outlined search-icon">search</span>
          <input
            className="search-input"
            placeholder="Buscar por nombre, placa o motivo..."
            type="text"
          />
        </div>
        <button className="btn btn-ghost">
          <span className="material-symbols-outlined text-lg">filter_list</span>
          Filtrar
        </button>
        <div className="h-6 w-px bg-[var(--color-outline-variant)]/30 hidden md:block" />
        <p className="text-xs font-bold text-[var(--color-on-surface-variant)] uppercase tracking-widest">
          {requests.length} Solicitudes Totales
        </p>
      </div>

      {/* Data Table */}
      <div className="table-wrapper">
        <table className="table-base">
          <thead className="table-thead">
            <tr>
              {["Visitante", "Placa", "Anfitrión", "Contacto", "Motivo/Descripción", "Estado", "Acciones"].map((h, i) => (
                <th
                  key={h}
                  className={i === 6 ? "text-right" : ""}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {requests.map((r: AccessRequest) => (
              <tr key={r.id} className="table-row group">
                <td className="table-cell">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[var(--color-primary-fixed)] flex items-center justify-center text-[var(--color-on-primary-fixed-variant)] font-bold text-xs">
                      {getInitials(r.requesterName)}
                    </div>
                    <div>
                      <div className="font-bold text-[var(--color-on-surface)] font-[var(--font-label)] text-sm">{r.requesterName}</div>
                      <div className="text-[10px] text-[var(--color-on-surface-variant)] uppercase font-bold tracking-tighter opacity-60">
                        {new Date(r.visitDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="table-cell">
                  <span className="px-2 py-1 bg-[var(--color-surface-container-high)] text-[var(--color-on-surface)] font-mono text-sm rounded border border-[var(--color-outline-variant)]/20">
                    {r.plateNumber}
                  </span>
                </td>
                <td className="table-cell text-sm">
                  {r.hostCode ? (
                    <div className="flex flex-col">
                      <span className="font-bold text-[var(--color-primary)]">{r.hostCode}</span>
                      {r.hostCarnetPath && (
                        <a 
                          href={r.hostCarnetPath} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-[10px] text-[var(--color-primary)] hover:underline flex items-center gap-0.5"
                        >
                          <span className="material-symbols-outlined text-[12px]">visibility</span>
                          Ver Carnet
                        </a>
                      )}
                    </div>
                  ) : (
                    <span className="opacity-40 text-xs">—</span>
                  )}
                </td>
                <td className="table-cell text-sm text-[var(--color-on-surface-variant)] font-[var(--font-label)]">
                  {r.phone || <span className="opacity-40">—</span>}
                </td>
                <td className="table-cell text-sm text-[var(--color-on-surface-variant)] font-[var(--font-label)] max-w-[200px] truncate" title={r.reason}>
                  {r.reason}
                </td>
                <td className="table-cell">
                  <span className={`badge ${r.status === 'APROBADO' ? 'badge-success' : r.status === 'PENDIENTE' ? 'badge-warning' : 'badge-error'}`}>
                    {r.status}
                  </span>
                </td>
                <td className="table-cell text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="w-8 h-8 flex items-center justify-center bg-[var(--color-primary)] text-white rounded-lg shadow-sm hover:scale-105 active:scale-95 transition-all">
                      <span className="material-symbols-outlined text-sm">check</span>
                    </button>
                    <button className="w-8 h-8 flex items-center justify-center bg-[var(--color-error-container)] text-[var(--color-on-error-container)] rounded-lg shadow-sm hover:scale-105 active:scale-95 transition-all">
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination bar */}
        <div className="table-footer">
          <span className="table-footer-text">Mostrando 1 a {requests.length} de {requests.length} solicitudes</span>
          <div className="flex gap-1">
            <button className="pagination-btn" disabled>
              <span className="material-symbols-outlined text-sm">chevron_left</span>
            </button>
            <button className="pagination-btn active">1</button>
            <button className="pagination-btn" disabled>
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
