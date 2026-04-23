export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import { AccessRequest, Prisma } from "@/generated/prisma/client/index.js";
import prisma from "@/lib/prisma";
import RequestFilters from "./RequestFilters";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Solicitudes de TAG de Visitante | UFPS PARKING",
  description: "Revisar y gestionar el acceso temporal al estacionamiento para invitados del campus",
};

export default async function RequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string; status?: string; page?: string }>;
}) {
  const resolvedParams = await searchParams;
  const query = resolvedParams.query || "";
  const status = resolvedParams.status || "PENDIENTE";
  const currentPage = Number(resolvedParams.page) || 1;
  const ITEMS_PER_PAGE = 50;

  const where: Prisma.AccessRequestWhereInput = {};
  if (status && status !== "TODO") {
    where.status = status;
  }
  if (query) {
    where.OR = [
      { requesterName: { contains: query, mode: "insensitive" } },
      { plateNumber: { contains: query, mode: "insensitive" } },
      { reason: { contains: query, mode: "insensitive" } },
    ];
  }

  const [totalFilteredCount, requests] = await Promise.all([
    prisma.accessRequest.count({ where }),
    prisma.accessRequest.findMany({
      where,
      orderBy: { visitDate: "desc" },
      take: ITEMS_PER_PAGE,
      skip: (currentPage - 1) * ITEMS_PER_PAGE,
    }),
  ]);

  const totalPages = Math.ceil(totalFilteredCount / ITEMS_PER_PAGE) || 1;

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
      </div>

      {/* Modern Search & Filters */}
      <RequestFilters 
        initialQuery={query} 
        initialStatus={status} 
        totalCount={totalFilteredCount} 
      />

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
            {requests.length === 0 ? (
              <tr>
                <td colSpan={7} className="table-cell text-center py-12 text-[var(--color-on-surface-variant)] opacity-50 italic">
                  No se encontraron solicitudes de visita con los filtros aplicados.
                </td>
              </tr>
            ) : (
              requests.map((r: AccessRequest) => (
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
              ))
            )}
          </tbody>
        </table>

        {/* Improved Pagination bar */}
        <div className="table-footer">
          <span className="table-footer-text">
            Página {currentPage} de {totalPages} ({totalFilteredCount} resultados)
          </span>
          <div className="flex gap-2">
            {currentPage > 1 ? (
              <Link
                href={`/requests?page=${currentPage - 1}${query ? `&query=${encodeURIComponent(query)}` : ""}${status ? `&status=${status}` : ""}`}
                className="pagination-btn"
              >
                <span className="material-symbols-outlined text-sm">chevron_left</span>
              </Link>
            ) : (
              <button disabled className="pagination-btn">
                <span className="material-symbols-outlined text-sm">chevron_left</span>
              </button>
            )}
            
            <button className="pagination-btn active">{currentPage}</button>

            {currentPage < totalPages ? (
              <Link
                href={`/requests?page=${currentPage + 1}${query ? `&query=${encodeURIComponent(query)}` : ""}${status ? `&status=${status}` : ""}`}
                className="pagination-btn"
              >
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </Link>
            ) : (
              <button disabled className="pagination-btn">
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
