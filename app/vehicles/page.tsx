export const dynamic = "force-dynamic";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Registro de Vehículos - Campus ParkGuard",
  description: "Gestionar permisos de campus y logs de acceso de vehículos",
};

import prisma from "@/lib/prisma";

export default async function VehiclesPage() {
  const vehicles = await prisma.vehicle.findMany({
    include: {
      owner: true,
    },
    orderBy: {
      registeredAt: "desc",
    },
  });

  const getStatusCls = (status: string) => {
    switch (status) {
      case "Permiso Activo":
        return "badge-success";
      case "Renovación Pendiente":
        return "badge-warning";
      case "Suspendido":
        return "badge-error";
      default:
        return "badge-neutral";
    }
  };

  return (
    <div className="page-wrapper space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-0">
        <div>
          <h2 className="page-title">Registro de Vehículos</h2>
          <p className="page-subtitle">Gestionar permisos del campus y logs de acceso de vehículos</p>
        </div>
        <button className="btn btn-primary self-start md:self-auto">
          <span className="material-symbols-outlined">add</span>
          Registrar Nuevo Vehículo
        </button>
      </div>


      {/* Search & Filter Bar */}
      <div className="card-padded border-b-2 border-[var(--color-primary)]">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="space-y-2">
            <label className="font-[var(--font-label)] text-[0.75rem] font-bold text-[var(--color-on-surface-variant)] uppercase tracking-wider">Placa</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-on-surface-variant)] text-sm opacity-50">search</span>
              <input className="search-input" placeholder="ej. ABC-1234" type="text" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="font-[var(--font-label)] text-[0.75rem] font-bold text-[var(--color-on-surface-variant)] uppercase tracking-wider">Nombre de Usuario</label>
            <input className="w-full bg-[var(--color-surface-container-high)] border-0 rounded-lg py-2.5 px-4 focus:ring-2 focus:ring-[var(--color-primary)]/20 text-sm font-[var(--font-label)] text-[var(--color-on-surface)] outline-none" placeholder="Buscar propietarios registrados..." type="text" />
          </div>
          <div className="space-y-2">
            <label className="font-[var(--font-label)] text-[0.75rem] font-bold text-[var(--color-on-surface-variant)] uppercase tracking-wider">Departamento</label>
            <select className="w-full bg-[var(--color-surface-container-high)] border-0 rounded-lg py-2.5 px-4 focus:ring-2 focus:ring-[var(--color-primary)]/20 text-sm font-[var(--font-label)] text-[var(--color-on-surface)] appearance-none outline-none">
              <option>Todos los Departamentos</option>
              <option>Administración</option>
              <option>Ingeniería</option>
              <option>Ciencias Médicas</option>
              <option>Artes y Humanidades</option>
            </select>
          </div>
          <div className="flex items-end gap-3">
            <button className="btn btn-ghost flex-1">Limpiar Filtros</button>
            <button className="btn btn-outline-primary flex-1">Aplicar Búsqueda</button>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="table-wrapper">
        <table className="table-base">
          <thead className="table-thead">
            <tr>
              <th>Detalles del Vehículo</th>
              <th>ID de Placa</th>
              <th>Propietario / Departamento</th>
              <th>Estado del Permiso</th>
              <th>Fecha de Registro</th>
              <th className="text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.map((v: { id: number; plate: string; model: string; color: string; status: string; registeredAt: Date; icon: string; department: string; owner: { firstname: string, surname: string } | null }) => (
              <tr key={v.plate} className="table-row">
                <td className="table-cell">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 bg-[var(--color-surface-container-low)] rounded-lg flex items-center justify-center">
                      <span className="material-symbols-outlined text-[var(--color-on-surface-variant)]">{v.icon}</span>
                    </div>
                    <div>
                      <p className="font-bold text-sm text-[var(--color-on-surface)]">{v.model}</p>
                      <p className="font-[var(--font-label)] text-[0.75rem] text-[var(--color-on-surface-variant)]">{v.color}</p>
                    </div>
                  </div>
                </td>
                <td className="table-cell">
                  <span className="bg-[var(--color-on-surface)] text-[var(--color-surface)] px-3 py-1 rounded font-mono text-xs font-bold tracking-widest">{v.plate}</span>
                </td>
                <td className="table-cell">
                  <p className="text-sm font-semibold text-[var(--color-on-surface)]">
                    {v.owner ? `${v.owner.firstname} ${v.owner.surname}` : "Propietario Genérico"}
                  </p>
                  <p className="font-[var(--font-label)] text-[0.75rem] text-[var(--color-primary)]">{v.department}</p>
                </td>
                <td className="table-cell">
                  <span className={`badge ${getStatusCls(v.status)}`}>{v.status}</span>
                </td>
                <td className="table-cell">
                  <span className="font-[var(--font-label)] text-sm text-[var(--color-on-surface-variant)]">{new Date(v.registeredAt).toLocaleDateString()}</span>
                </td>
                <td className="table-cell text-right">
                  <div className="flex justify-end gap-1">
                    <button className="p-2 hover:bg-[var(--color-surface-container-low)] rounded-lg transition-colors text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)]">
                      <span className="material-symbols-outlined text-lg">history</span>
                    </button>
                    <button className="p-2 hover:bg-[var(--color-surface-container-low)] rounded-lg transition-colors text-[var(--color-on-surface-variant)]">
                      <span className="material-symbols-outlined text-lg">more_vert</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="table-footer">
          <p className="table-footer-text">
            Mostrando <span className="font-bold text-[var(--color-on-surface)]">1 a {vehicles.length}</span> de{" "}
            <span className="font-bold text-[var(--color-on-surface)]">{vehicles.length}</span> entradas
          </p>
          <div className="flex items-center gap-1">
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

      {/* System Usage Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { icon: "directions_car", bg: "bg-[var(--color-primary)]/10", iconColor: "text-[var(--color-primary)]", value: vehicles.length.toString(), label: "Total Registrados", sub: "Activos en el sistema" },
          { icon: "verified", bg: "bg-[var(--color-primary-container)]/20", iconColor: "text-[var(--color-primary)]", value: vehicles.filter((v: { status: string }) => v.status === "Permiso Activo").length.toString(), label: "Permisos Activos", sub: "Válidos y vigentes" },
          { icon: "pending_actions", bg: "bg-[var(--color-tertiary-container)]/20", iconColor: "text-[var(--color-tertiary)]", value: vehicles.filter((v: { status: string }) => v.status !== "Permiso Activo").length.toString(), label: "Pendientes / Expirados", sub: "Requieren atención" },
        ].map((card) => (
          <div key={card.label} className="card-padded flex items-center gap-6">
            <div className={`w-14 h-14 ${card.bg} rounded-full flex items-center justify-center ${card.iconColor}`}>
              <span className="material-symbols-outlined">{card.icon}</span>
            </div>
            <div>
              <p className="text-2xl font-black text-[var(--color-on-surface)]">{card.value}</p>
              <p className="font-bold text-sm text-[var(--color-on-surface)]">{card.label}</p>
              <p className="font-[var(--font-label)] text-[0.7rem] text-[var(--color-on-surface-variant)] mt-0.5">{card.sub}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
