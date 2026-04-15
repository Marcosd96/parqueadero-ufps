export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import prisma from "@/lib/prisma";
import ActionButtons from "./ActionButtons";

export const metadata: Metadata = {
  title: "Solicitudes de Registro | Campus ParkGuard",
  description: "Gestionar el acceso permanente de estudiantes, administrativos y docentes",
};

export default async function RegistroRequestsPage() {
  const registrations = await prisma.userRegistration.findMany({
    orderBy: {
      createdAt: "desc",
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
        <div className="flex items-center gap-2 bg-[var(--color-surface-container-low)] p-1 rounded-lg">
          <button className="px-6 py-2 bg-[var(--color-surface-container-lowest)] text-[var(--color-primary)] font-bold shadow-sm rounded-md font-[var(--font-label)] text-sm">
            Pendientes
          </button>
          <button className="px-6 py-2 text-[var(--color-on-surface-variant)] font-medium hover:bg-[var(--color-surface-container-high)] rounded-md font-[var(--font-label)] text-sm transition-all">
            Todo
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="filter-bar">
        <div className="search-input-wrapper">
          <span className="material-symbols-outlined search-icon">search</span>
          <input
            className="search-input"
            placeholder="Buscar por nombre, código o placa..."
            type="text"
          />
        </div>
        <div className="h-6 w-px bg-[var(--color-outline-variant)]/30 hidden md:block" />
        <p className="text-xs font-bold text-[var(--color-on-surface-variant)] uppercase tracking-widest">
          {registrations.length} Solicitudes Totales
        </p>
      </div>

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
                <th key={h} className={i === 6 ? "text-right" : ""}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {registrations.map((r) => (
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
            ))}
          </tbody>
        </table>

        {/* Footer */}
        <div className="table-footer">
          <span className="table-footer-text">
            Mostrando {registrations.length} solicitudes de registro
          </span>
        </div>
      </div>
    </div>
  );
}
