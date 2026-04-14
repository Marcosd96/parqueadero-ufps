export const dynamic = "force-dynamic";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Campus ParkGuard - Monitoreo de Seguridad",
  description: "Monitoreo de seguridad en tiempo real para las zonas de estacionamiento del campus",
};

import prisma from "@/lib/prisma";

export default async function MonitoringPage() {
  const recentActivity = await prisma.accessLog.findMany({
    orderBy: {
      timestamp: "desc",
    },
    take: 3,
  });

  const lastLog = recentActivity[0];

  // Try to find the vehicle and owner for the last detection
  const vehicle = lastLog ? await prisma.vehicle.findUnique({
    where: { plate: lastLog.plate },
    include: { owner: true }
  }) : null;

  return (
    <div className="page-wrapper">
      {/* Page Header */}
      <div className="mb-8">
        <h2 className="page-title">Centro de Monitoreo de Seguridad</h2>
        <div className="flex items-center gap-2 mt-1">
          <div className="w-2 h-2 rounded-full bg-[var(--color-primary)] animate-pulse" />
          <span className="font-[var(--font-label)] text-xs font-medium text-[var(--color-on-surface-variant)]">
            TRANSMISIÓN EN VIVO: PORTÓN DE ENTRADA ALPHA-4
          </span>
        </div>
      </div>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Live Feed Section */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          <div className="relative bg-black rounded-xl overflow-hidden border border-white/5 aspect-video group">
            <img
              alt="Live Camera Feed"
              className="w-full h-full object-cover opacity-80 brightness-75 grayscale-[0.3]"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDUesZ2rQ6g4o214wY72lD4M19XY4VX7lUWdJUMO-C8yAYxY1gXKu9hOTemUBs4EcAkq3ZLUBfAOz0JeeRkf0rCn2LaZJaFEHosJTJFLyqCGPc68ve3RoihIcMYJLzqzf70DDnukwLm1sN3W4TV5mIKlNQHtylA58iOeLgRk9aaG8iQcE33pIEQTbrDLn-NezucFQaM5fUYl_I0n5r6XlQBGqkC_Dc6kLOQpfD13gB8KTunxLeVrp39Sxe2J0hcohn4mRXG22Rgyj7X"
            />
            {/* HUD Elements */}
            <div className="absolute inset-0 p-6 pointer-events-none flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div className="bg-black/40 backdrop-blur-md border border-white/10 p-3 rounded flex gap-4">
                  <div className="flex flex-col">
                    <span className="text-[0.6rem] font-[var(--font-label)] text-slate-400">FRAME_ID</span>
                    <span className="text-xs font-mono text-white">#882-AF-09</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[0.6rem] font-[var(--font-label)] text-slate-400">BITRATE</span>
                    <span className="text-xs font-mono text-white">12.4 Mbps</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="bg-[var(--color-primary)]/90 text-white text-[0.65rem] px-2 py-0.5 rounded font-bold tracking-widest mb-1">
                    OCR ACTIVO
                  </div>
                  <div className="text-white font-mono text-xl">14:22:08:41</div>
                </div>
              </div>
              {/* License Plate Detection Overlay */}
              <div className="relative flex justify-center items-center">
                <div className="w-64 h-24 border-2 border-[var(--color-primary)]/50 relative">
                  <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-[var(--color-primary)]" />
                  <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-[var(--color-primary)]" />
                  <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-[var(--color-primary)]" />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-[var(--color-primary)]" />
                  <div className="absolute inset-x-0 -bottom-8 flex justify-center">
                    <div className="bg-[var(--color-primary)] text-white font-mono text-lg px-4 py-1 rounded-sm tracking-[0.2em] shadow-xl">
                      {lastLog?.plate || "ESCANEANDO..."}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs font-semibold pointer-events-auto transition-all">
                  <span className="material-symbols-outlined text-sm">videocam</span>
                  CH-04 GATE-A
                </button>
                <button className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs font-semibold pointer-events-auto transition-all">
                  <span className="material-symbols-outlined text-sm">fullscreen</span>
                </button>
              </div>
            </div>
          </div>

          {/* Recent Activity Table */}
          <div className="table-wrapper">
            <div className="flex justify-between items-center px-6 py-4 border-b border-[var(--color-outline-variant)]/15">
              <h3 className="font-bold text-[var(--color-on-surface)] text-sm">Log de Actividad Reciente</h3>
              <button className="text-[var(--color-primary)] text-xs font-bold hover:underline">Exportar CSV</button>
            </div>
            <div className="overflow-x-auto">
              <table className="table-base">
                <thead className="table-thead">
                  <tr>
                    <th>Marca de Tiempo</th>
                    <th>Identificación</th>
                    <th>Zona</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {recentActivity.map((row: { id: number; timestamp: Date; plate: string; zone: string; status: boolean }) => (
                    <tr key={row.id} className="table-row">
                      <td className="table-cell font-mono text-sm text-[var(--color-on-surface-variant)]">
                        {new Date(row.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="table-cell font-bold text-[var(--color-on-surface)]">{row.plate}</td>
                      <td className="table-cell text-sm text-[var(--color-on-surface-variant)]">{row.zone}</td>
                      <td className="table-cell">
                        <span className={`badge ${row.status ? "badge-success" : "badge-error"}`}>
                          {row.status ? "PERMITIDO" : "RECHAZADO"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          {/* Last Vehicle Detected */}
          <div className="card">
            <div className="bg-[var(--color-primary)] px-6 py-4">
              <h3 className="text-white text-xs font-black tracking-widest uppercase">Último Vehículo Detectado</h3>
            </div>
            <div className="p-6">
              {lastLog ? (
                <>
                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-20 h-20 rounded-lg bg-[var(--color-surface-container-low)] border border-[var(--color-outline-variant)]/20 flex items-center justify-center">
                      <span className="material-symbols-outlined text-4xl text-[var(--color-on-surface-variant)]">
                        {vehicle?.icon || "directions_car"}
                      </span>
                    </div>
                    <div>
                      <div className="text-[0.65rem] font-[var(--font-label)] font-bold text-[var(--color-primary)] tracking-widest uppercase">NÚMERO DE PLACA</div>
                      <div className="text-2xl font-black text-[var(--color-on-surface)] mb-2">{lastLog.plate}</div>
                      <span className={`badge ${lastLog.status ? "badge-success" : "badge-error"}`}>
                        {lastLog.status ? "ACCESO PERMITIDO" : "ACCESO DENEGADO"}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-4 pt-4 border-t border-[var(--color-outline-variant)]/15">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-[var(--font-label)] text-[var(--color-on-surface-variant)]">Nombre de Usuario</span>
                      <span className="text-sm font-bold text-[var(--color-on-surface)]">
                        {vehicle?.owner ? `${vehicle.owner.firstname} ${vehicle.owner.surname}` : "Desconocido / Visitante"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-[var(--font-label)] text-[var(--color-on-surface-variant)]">Modelo de Vehículo</span>
                      <span className="text-sm font-bold text-[var(--color-on-surface)]">{vehicle?.model || "N/A"}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-[var(--font-label)] text-[var(--color-on-surface-variant)]">Zona</span>
                      <span className="text-sm font-bold text-[var(--color-on-surface)]">{lastLog.zone}</span>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-center text-[var(--color-on-surface-variant)] py-8 text-sm">No se detectó actividad reciente.</p>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 gap-2">
            {[
              { icon: "door_open", label: "Registro Manual", color: "text-[var(--color-primary)]" },
              { icon: "report", label: "Registrar Incidente", color: "text-[var(--color-error)]" },
              { icon: "support_agent", label: "Contactar Administrador", color: "text-[var(--color-tertiary)]" },
            ].map((action) => (
              <button
                key={action.label}
                className="flex items-center justify-center gap-3 w-full py-3.5 bg-[var(--color-surface-container-low)] border border-[var(--color-outline-variant)]/20 hover:bg-[var(--color-surface-container)] transition-all text-[var(--color-on-surface)] font-bold text-sm rounded-lg active:scale-95"
              >
                <span className={`material-symbols-outlined ${action.color}`}>{action.icon}</span>
                {action.label}
              </button>
            ))}
          </div>

          {/* Zone Occupancy */}
          <div className="card-padded">
            <h4 className="text-[0.7rem] font-black text-[var(--color-on-surface-variant)] tracking-widest uppercase mb-4">
              Ocupación de Zonas en Vivo
            </h4>
            <div className="space-y-4">
              {[
                { label: "Zona A - Facultad", pct: 82 },
                { label: "Zona B - Visitante", pct: 45 },
              ].map((zone) => (
                <div key={zone.label}>
                  <div className="flex justify-between text-[0.65rem] font-bold mb-1.5">
                    <span className="text-[var(--color-on-surface)]">{zone.label}</span>
                    <span className="text-[var(--color-primary)]">{zone.pct}%</span>
                  </div>
                  <div className="w-full bg-[var(--color-surface-container-high)] h-1.5 rounded-full overflow-hidden">
                    <div className="bg-[var(--color-primary)] h-full transition-all" style={{ width: `${zone.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
