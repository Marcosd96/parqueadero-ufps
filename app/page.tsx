export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Campus ParkGuard - Monitoreo de Seguridad",
  description: "Monitoreo de seguridad en tiempo real para las zonas de estacionamiento del campus",
};

import prisma from "@/lib/prisma";
import PlateVerification from "@/components/PlateVerification";
import { getSession } from "@/lib/auth";

export default async function MonitoringPage() {
  const session = await getSession();
  const isAdmin = session?.role === "ADMIN";

  const recentActivity = await prisma.accessLog.findMany({
    orderBy: {
      timestamp: "desc",
    },
    take: 10,
  });

  const lastLog = recentActivity[0];

  // Try to find the vehicle and owner for the last detection
  const vehicle = lastLog ? await prisma.vehicle.findUnique({
    where: { plate: lastLog.plate },
    include: { owner: true }
  }) : null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [totalAccesosHoy, accesosDenegadosHoy, totalVehiculos] = await Promise.all([
    prisma.accessLog.count({ where: { timestamp: { gte: today } } }),
    prisma.accessLog.count({ where: { timestamp: { gte: today }, status: false } }),
    prisma.vehicle.count()
  ]);

  return (
    <div className="page-wrapper space-y-6">
      {/* Page Header */}
      <div className="mb-4">
        <h2 className="page-title">Centro de Monitoreo de Seguridad</h2>
        <p className="text-sm text-[var(--color-on-surface-variant)] mt-1">
          Panel principal de supervisión y control de accesos del campus.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6 flex items-center gap-4 border-l-4 border-[var(--color-primary)]">
          <div className="w-12 h-12 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)]">
            <span className="material-symbols-outlined text-2xl">login</span>
          </div>
          <div>
            <p className="text-xs font-bold text-[var(--color-on-surface-variant)] uppercase tracking-wider">Accesos Hoy</p>
            <p className="text-2xl font-black text-[var(--color-on-surface)]">{totalAccesosHoy}</p>
          </div>
        </div>

        <div className="card p-6 flex items-center gap-4 border-l-4 border-[var(--color-error)]">
          <div className="w-12 h-12 rounded-full bg-[var(--color-error)]/10 flex items-center justify-center text-[var(--color-error)]">
            <span className="material-symbols-outlined text-2xl">block</span>
          </div>
          <div>
            <p className="text-xs font-bold text-[var(--color-on-surface-variant)] uppercase tracking-wider">Accesos Denegados (Hoy)</p>
            <p className="text-2xl font-black text-[var(--color-on-surface)]">{accesosDenegadosHoy}</p>
          </div>
        </div>

        <div className="card p-6 flex items-center gap-4 border-l-4 border-blue-500">
          <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
            <span className="material-symbols-outlined text-2xl">directions_car</span>
          </div>
          <div>
            <p className="text-xs font-bold text-[var(--color-on-surface-variant)] uppercase tracking-wider">Vehículos Registrados</p>
            <p className="text-2xl font-black text-[var(--color-on-surface)]">{totalVehiculos}</p>
          </div>
        </div>
      </div>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Main Content Area */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          
          {/* Quick Actions Links */}
          {isAdmin && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Link href="/requests" className="card p-4 hover:bg-[var(--color-surface-container)] transition-colors flex flex-col items-center justify-center text-center gap-2 group">
                <span className="material-symbols-outlined text-3xl text-[var(--color-primary)] group-hover:scale-110 transition-transform">pending_actions</span>
                <span className="text-sm font-bold text-[var(--color-on-surface)]">Solicitudes Visita</span>
              </Link>
              <Link href="/vehicles" className="card p-4 hover:bg-[var(--color-surface-container)] transition-colors flex flex-col items-center justify-center text-center gap-2 group">
                <span className="material-symbols-outlined text-3xl text-[var(--color-tertiary)] group-hover:scale-110 transition-transform">directions_car</span>
                <span className="text-sm font-bold text-[var(--color-on-surface)]">Registro Vehículos</span>
              </Link>
              <Link href="/students" className="card p-4 hover:bg-[var(--color-surface-container)] transition-colors flex flex-col items-center justify-center text-center gap-2 group">
                <span className="material-symbols-outlined text-3xl text-emerald-500 group-hover:scale-110 transition-transform">school</span>
                <span className="text-sm font-bold text-[var(--color-on-surface)]">Directorio Estudiantil</span>
              </Link>
            </div>
          )}

          {/* Recent Activity Table */}
          <div className="table-wrapper">
            <div className="flex justify-between items-center px-6 py-4 border-b border-[var(--color-outline-variant)]/15">
              <h3 className="font-bold text-[var(--color-on-surface)] text-sm">Log de Actividad Reciente</h3>
              {isAdmin && (
                <Link href="/reports" className="text-[var(--color-primary)] text-xs font-bold hover:underline">Ver Reportes</Link>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="table-base">
                <thead className="table-thead">
                  <tr>
                    <th>Hora</th>
                    <th>Placa</th>
                    <th>Tipo</th>
                    <th>Zona</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {recentActivity.map((row) => (
                    <tr key={row.id} className="table-row">
                      <td className="table-cell font-mono text-sm text-[var(--color-on-surface-variant)]">
                        {new Date(row.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="table-cell font-bold text-[var(--color-on-surface)]">{row.plate}</td>
                      <td className="table-cell text-xs font-medium text-[var(--color-on-surface-variant)]">{row.userType}</td>
                      <td className="table-cell text-sm text-[var(--color-on-surface-variant)]">{row.zone}</td>
                      <td className="table-cell">
                        <span className={`badge ${row.status ? "badge-success" : "badge-error"}`}>
                          {row.status ? "PERMITIDO" : "RECHAZADO"}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {recentActivity.length === 0 && (
                    <tr>
                      <td colSpan={5} className="table-cell text-center py-8 text-[var(--color-on-surface-variant)]">
                        No hay registros de actividad recientes.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          {/* Plate Verification Tool for Security */}
          <PlateVerification />
          
          {/* Last Vehicle Detected */}
          <div className="card overflow-hidden">
            <div className="bg-[var(--color-primary)] px-6 py-4">
              <h3 className="text-white text-xs font-black tracking-widest uppercase">Último Vehículo Detectado</h3>
            </div>
            <div className="p-6 bg-[var(--color-surface-container-lowest)]">
              {lastLog ? (
                <>
                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-16 h-16 rounded-xl bg-[var(--color-surface-container-low)] border border-[var(--color-outline-variant)]/20 flex items-center justify-center shadow-inner">
                      <span className="material-symbols-outlined text-3xl text-[var(--color-primary)]">
                        {vehicle?.icon || "directions_car"}
                      </span>
                    </div>
                    <div>
                      <div className="text-[0.65rem] font-[var(--font-label)] font-bold text-[var(--color-on-surface-variant)] tracking-widest uppercase mb-1">NÚMERO DE PLACA</div>
                      <div className="text-2xl font-black text-[var(--color-on-surface)] mb-2 tracking-wider">{lastLog.plate}</div>
                      <span className={`badge ${lastLog.status ? "badge-success" : "badge-error"} text-xs px-2 py-1`}>
                        {lastLog.status ? "PERMITIDO" : "DENEGADO"}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-3 pt-4 border-t border-[var(--color-outline-variant)]/15">
                    <div className="flex justify-between items-center bg-[var(--color-surface-container-low)] p-2 rounded-lg">
                      <span className="text-xs font-[var(--font-label)] text-[var(--color-on-surface-variant)] flex items-center gap-2">
                        <span className="material-symbols-outlined text-[1rem]">person</span> Propietario
                      </span>
                      <span className="text-xs font-bold text-[var(--color-on-surface)] text-right">
                        {vehicle?.owner ? `${vehicle.owner.firstname} ${vehicle.owner.surname}` : "Desconocido / Visitante"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center bg-[var(--color-surface-container-low)] p-2 rounded-lg">
                      <span className="text-xs font-[var(--font-label)] text-[var(--color-on-surface-variant)] flex items-center gap-2">
                        <span className="material-symbols-outlined text-[1rem]">commute</span> Modelo
                      </span>
                      <span className="text-xs font-bold text-[var(--color-on-surface)]">{vehicle?.model || "N/A"}</span>
                    </div>
                    <div className="flex justify-between items-center bg-[var(--color-surface-container-low)] p-2 rounded-lg">
                      <span className="text-xs font-[var(--font-label)] text-[var(--color-on-surface-variant)] flex items-center gap-2">
                        <span className="material-symbols-outlined text-[1rem]">location_on</span> Zona
                      </span>
                      <span className="text-xs font-bold text-[var(--color-on-surface)]">{lastLog.zone}</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-[var(--color-on-surface-variant)]">
                  <span className="material-symbols-outlined text-4xl mb-2 opacity-50">search_off</span>
                  <p className="text-sm font-medium">No se detectó actividad reciente.</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
