export const dynamic = "force-dynamic";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reportes de Entrada y Salida - Campus ParkGuard",
  description: "Log operacional detallado para el ciclo de 24 horas",
};

import prisma from "@/lib/prisma";

export default async function ReportsPage() {
  const activityLogs = await prisma.accessLog.findMany({
    orderBy: {
      timestamp: "desc",
    },
    take: 50,
  });

  const getUserTypeCls = (type: string) => {
    switch (type) {
      case "Facultad":
        return "badge-primary";
      case "Estudiante":
        return "badge-secondary";
      case "Visitante":
        return "badge-warning";
      case "Administrador":
        return "badge-neutral";
      default:
        return "badge-neutral";
    }
  };

  const peakBars = [30, 45, 65, 100, 80, 50, 40];
  const complianceStats = [
    { label: "Acceso Autorizado", value: "98.2%", pct: 98.2, barColor: "bg-[var(--color-primary)]" },
    { label: "Precisión de Reconocimiento de Placa", value: "99.5%", pct: 99.5, barColor: "bg-[var(--color-tertiary-container)]" },
  ];

  return (
    <div className="page-wrapper space-y-8">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Reportes de Entrada/Salida de Vehículos</h2>
          <p className="page-subtitle">Log operacional detallado para el ciclo de 24 horas.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 mt-4 lg:mt-0">
          <div className="flex bg-[var(--color-surface-container-low)] rounded-lg p-1 w-full sm:w-auto">
            <button className="flex-1 px-4 py-1.5 text-xs font-semibold font-[var(--font-label)] text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)] rounded transition-all">
              Últimas 24h
            </button>
            <button className="flex-1 px-4 py-1.5 text-xs font-semibold font-[var(--font-label)] text-[var(--color-on-surface)] bg-[var(--color-surface-container-lowest)] shadow-sm rounded transition-all">
              Seleccionar Fecha
            </button>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button className="btn btn-ghost flex-1 sm:flex-none justify-center">
              <span className="material-symbols-outlined text-sm">download</span>
              EXPORTAR CSV
            </button>
            <button className="btn btn-primary flex-1 sm:flex-none justify-center">
              <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
              EXPORTAR PDF
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { icon: "login", border: "border-[var(--color-primary)]", label: "Entradas Totales", value: "1,284", trend: "12%", trendIcon: "trending_up", trendColor: "text-[var(--color-primary)]" },
          { icon: "logout", border: "border-[var(--color-outline-variant)]", label: "Salidas Totales", value: "942", trend: "4%", trendIcon: "trending_down", trendColor: "text-[var(--color-on-surface-variant)]" },
          { icon: "swap_horiz", border: "border-[var(--color-tertiary)]", label: "Tráfico Neto", value: "+342", badge: "PICO ACTUAL" },
        ].map((card) => (
          <div key={card.label} className={`card-padded border-b-2 ${card.border} relative overflow-hidden group`}>
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="material-symbols-outlined text-6xl text-[var(--color-on-surface)]">{card.icon}</span>
            </div>
            <p className="text-[10px] font-black text-[var(--color-on-surface-variant)] uppercase tracking-widest font-[var(--font-label)]">{card.label}</p>
            <h3 className="text-4xl font-black text-[var(--color-on-surface)] mt-2 tracking-tighter">{card.value}</h3>
            <div className="flex items-center gap-2 mt-4">
              {card.trend && (
                <>
                  <span className={`text-xs font-bold ${card.trendColor} flex items-center`}>
                    <span className="material-symbols-outlined text-xs">{card.trendIcon}</span>
                    {card.trend}
                  </span>
                  <span className="text-[10px] text-[var(--color-on-surface-variant)] font-medium font-[var(--font-label)]">vs ayer</span>
                </>
              )}
              {card.badge && (
                <span className="badge badge-warning">{card.badge}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Data Table */}
      <div className="table-wrapper">
        <div className="px-6 py-4 border-b border-[var(--color-outline-variant)]/15 flex items-center justify-between">
          <h4 className="font-bold text-[var(--color-on-surface)] text-sm">Log de Actividad en Tiempo Real</h4>
          <div className="flex items-center gap-4">
            <button className="text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)] transition-colors">
              <span className="material-symbols-outlined">filter_list</span>
            </button>
            <button className="text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)] transition-colors">
              <span className="material-symbols-outlined">more_vert</span>
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead className="table-thead">
              <tr>
                {["Marca de Tiempo", "Placa", "Tipo de Usuario", "Zona", "Estado", "Acción"].map((h, i) => (
                  <th key={h} className={i === 5 ? "text-right" : ""}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activityLogs.map((row: { id: number; plate: string; timestamp: Date; zone: string; status: boolean; userType: string }) => (
                <tr key={row.id} className="table-row group">
                  <td className="table-cell">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-[var(--color-on-surface)]">{new Date(row.timestamp).toLocaleTimeString()}</span>
                      <span className="text-[10px] text-[var(--color-on-surface-variant)] font-[var(--font-label)]">{new Date(row.timestamp).toLocaleDateString()}</span>
                    </div>
                  </td>
                  <td className="table-cell">
                    <span className="text-sm font-mono font-bold px-2 py-1 rounded bg-[var(--color-surface-container-high)] text-[var(--color-on-surface)]">{row.plate}</span>
                  </td>
                  <td className="table-cell">
                    <span className={`badge ${getUserTypeCls(row.userType)}`}>{row.userType}</span>
                  </td>
                  <td className="table-cell">
                    <span className="text-xs text-[var(--color-on-surface-variant)] font-medium font-[var(--font-label)]">{row.zone}</span>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${row.status ? "bg-[var(--color-primary)]" : "bg-[var(--color-error)]"}`} />
                      <span className={`text-xs font-bold ${row.status ? "text-[var(--color-primary)]" : "text-[var(--color-error)]"}`}>
                        {row.status ? "Permitido" : "Rechazado"}
                      </span>
                    </div>
                  </td>
                  <td className="table-cell text-right">
                    <button className="text-[var(--color-outline-variant)] group-hover:text-[var(--color-primary)] transition-colors">
                      <span className="material-symbols-outlined text-sm">
                        {row.status ? "visibility" : "warning"}
                      </span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="table-footer">
          <p className="table-footer-text">Mostrando 1 a {activityLogs.length} de {activityLogs.length} entradas</p>
          <div className="flex items-center gap-1">
            <button className="pagination-btn" disabled>
              <span className="material-symbols-outlined text-sm">chevron_left</span>
            </button>
            <button className="pagination-btn active">1</button>
            {[2, 3].map((n) => (
              <button key={n} className="pagination-btn">{n}</button>
            ))}
            <button className="pagination-btn">
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Peak Traffic Window */}
        <div className="card-padded !p-8 relative">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-[var(--color-primary)]/10 rounded-lg">
              <span className="material-symbols-outlined text-[var(--color-primary)]">insights</span>
            </div>
            <h5 className="text-sm font-bold text-[var(--color-on-surface)]">Ventana de Tráfico Pico</h5>
          </div>
          <div className="flex items-end gap-2 h-24 mb-6">
            {peakBars.map((h, i) => (
              <div
                key={i}
                className={`flex-1 rounded-t-sm ${i === 3 ? "bg-[var(--color-primary)] relative" : i === 4 ? "bg-[var(--color-primary)]/60" : i === 2 ? "bg-[var(--color-primary)]/40" : i === 5 ? "bg-[var(--color-primary)]/30" : "bg-[var(--color-primary)]/20"}`}
                style={{ height: `${h}%` }}
              >
                {i === 3 && (
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-[var(--color-on-surface)] text-[var(--color-surface)] text-[8px] px-1.5 py-0.5 rounded font-bold">
                    08:30
                  </div>
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-[var(--color-on-surface-variant)] font-[var(--font-label)] leading-relaxed">
            La densidad de tráfico es actualmente un{" "}
            <span className="font-bold text-[var(--color-on-surface)]">14% mayor</span> que el promedio móvil de 7 días para este intervalo de tiempo. Se sugiere monitorear la Zona B-4 para un posible desbordamiento.
          </p>
        </div>

        {/* Compliance Summary */}
        <div className="card-padded !p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-[var(--color-tertiary)]/10 rounded-lg">
              <span className="material-symbols-outlined text-[var(--color-tertiary)]">gavel</span>
            </div>
            <h5 className="text-sm font-bold text-[var(--color-on-surface)]">Resumen de Cumplimiento</h5>
          </div>
          <div className="space-y-4">
            {complianceStats.map((stat) => (
              <div key={stat.label}>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-[var(--color-on-surface-variant)] font-[var(--font-label)]">{stat.label}</span>
                  <span className="text-xs font-bold text-[var(--color-on-surface)]">{stat.value}</span>
                </div>
                <div className="w-full bg-[var(--color-surface-container-high)] h-1.5 rounded-full overflow-hidden mt-1">
                  <div className={`${stat.barColor} h-full`} style={{ width: `${stat.pct}%` }} />
                </div>
              </div>
            ))}
            <p className="text-[10px] text-[var(--color-on-surface-variant)] mt-4 font-[var(--font-label)] italic">
              Todos los sistemas operando dentro de los márgenes de seguridad definidos.
            </p>
          </div>
        </div>
      </div>

      {/* Floating Action Button */}
      <button className="fixed bottom-8 right-8 w-14 h-14 bg-[var(--color-primary)] text-[var(--color-on-primary)] rounded-full shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-50">
        <span className="material-symbols-outlined">add</span>
      </button>
    </div>
  );
}
