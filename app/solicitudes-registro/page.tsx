export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import prisma from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client/index.js";
import ActionButtons from "./ActionButtons";
import RegistrationFilters from "./RegistrationFilters";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Solicitudes de Registro | UFPS PARKING ",
  description: "Gestionar el acceso permanente de estudiantes, administrativos y docentes",
};

export default async function RegistroRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string; status?: string; page?: string }>;
}) {
  const resolvedParams = await searchParams;
  const query = resolvedParams.query || "";
  const status = resolvedParams.status || "PENDIENTE";
  const currentPage = Number(resolvedParams.page) || 1;
  const ITEMS_PER_PAGE = 50;

  const where: Prisma.UserRegistrationWhereInput = {};
  if (status && status !== "TODO") {
    where.status = status;
  }
  if (query) {
    where.OR = [
      { fullName: { contains: query, mode: "insensitive" } },
      { institutionalCode: { contains: query, mode: "insensitive" } },
      { plate: { contains: query, mode: "insensitive" } },
    ];
  }

  const [totalFilteredCount, registrations] = await Promise.all([
    prisma.userRegistration.count({ where }),
    prisma.userRegistration.findMany({
      where,
      orderBy: { createdAt: "desc" },
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

  const getBadgeClass = (status: string) => {
    switch (status) {
      case "APROBADO": return "badge-success";
      case "RECHAZADO": return "badge-error";
      default: return "badge-warning";
    }
  };

  return (
    <div className="page-wrapper space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Solicitudes de Registro de Usuario</h2>
          <p className="page-subtitle">
            Gestionar el acceso permanente para miembros de la comunidad universitaria.
          </p>
        </div>
      </div>

      {/* Modern Search & Filters */}
      <RegistrationFilters 
        initialQuery={query} 
        initialStatus={status} 
        totalCount={totalFilteredCount} 
      />

      {/* Data Table */}
      <div className="table-wrapper">
        <table className="table-base">
          <thead className="table-thead">
            <tr>
              {[
                "Usuario",
                "Código",
                "Tipo",
                "Vehículo",
                "Placa",
                "Documentos",
                "Estado",
                "Acciones",
              ].map((h, i) => (
                <th key={h} className={i === 7 ? "text-right" : ""}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {registrations.length === 0 ? (
              <tr>
                <td colSpan={8} className="table-cell text-center py-12 text-[var(--color-on-surface-variant)] opacity-50 italic">
                  No se encontraron solicitudes con los filtros aplicados.
                </td>
              </tr>
            ) : (
              registrations.map((r) => (
                <tr key={r.id} className="table-row group">
                  <td className="table-cell">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[var(--color-primary-fixed)] flex items-center justify-center text-[var(--color-on-primary-fixed-variant)] font-bold text-xs">
                        {getInitials(r.fullName)}
                      </div>
                      <div>
                        <div className="font-bold text-[var(--color-on-surface)] font-[var(--font-label)] text-sm">
                          {r.fullName}
                        </div>
                        <div className="text-[0.7rem] text-[var(--color-on-surface-variant)] opacity-70">
                          {r.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="table-cell text-sm font-mono text-[var(--color-on-surface-variant)]">
                    {r.institutionalCode}
                  </td>
                  <td className="table-cell">
                    <span className="badge badge-neutral">{r.userType}</span>
                  </td>
                  <td className="table-cell">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-[var(--color-on-surface)]">{r.vehicleBrand || "N/A"}</span>
                      <span className="text-xs text-[var(--color-on-surface-variant)]">{r.vehicleModel || "N/A"}</span>
                    </div>
                  </td>
                  <td className="table-cell">
                    <span className="px-2 py-1 bg-[var(--color-surface-container-high)] text-[var(--color-on-surface)] font-mono text-sm rounded border border-[var(--color-outline-variant)]/20">
                      {r.plate}
                    </span>
                  </td>
                  <td className="table-cell">
                    <div className="flex gap-2">
                      <a
                        href={r.carnetFilePath}
                        target="_blank"
                        className="text-[var(--color-primary)] hover:underline flex items-center gap-1 text-xs font-bold"
                      >
                        <span className="material-symbols-outlined text-sm">badge</span>
                        Carnet
                      </a>
                      <a
                        href={r.ownershipFilePath}
                        target="_blank"
                        className="text-[var(--color-primary)] hover:underline flex items-center gap-1 text-xs font-bold"
                      >
                        <span className="material-symbols-outlined text-sm">description</span>
                        Propiedad
                      </a>
                    </div>
                  </td>
                  <td className="table-cell">
                    <span className={`badge ${getBadgeClass(r.status)}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="table-cell text-right">
                    {r.status === "PENDIENTE" ? (
                      <ActionButtons id={r.id} />
                    ) : (
                      <span className="text-xs text-[var(--color-on-surface-variant)] opacity-50 italic">
                        Procesada
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Footer with Pagination */}
        <div className="table-footer">
          <span className="table-footer-text">
            Página {currentPage} de {totalPages} ({totalFilteredCount} resultados)
          </span>
          <div className="flex gap-2">
            {currentPage > 1 ? (
              <Link
                href={`/solicitudes-registro?page=${currentPage - 1}${query ? `&query=${encodeURIComponent(query)}` : ""}${status ? `&status=${status}` : ""}`}
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
                href={`/solicitudes-registro?page=${currentPage + 1}${query ? `&query=${encodeURIComponent(query)}` : ""}${status ? `&status=${status}` : ""}`}
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
