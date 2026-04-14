export const dynamic = "force-dynamic";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Entry & Exit Reports - Campus ParkGuard",
  description: "Detailed operational log for the 24-hour cycle",
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
      case "Faculty":
        return "bg-[var(--color-primary-fixed)] text-[var(--color-on-primary-fixed-variant)]";
      case "Student":
        return "bg-[var(--color-secondary-fixed)] text-[var(--color-on-secondary-fixed-variant)]";
      case "Visitor":
        return "bg-[var(--color-tertiary-fixed)] text-[var(--color-on-tertiary-fixed-variant)]";
      case "Admin":
        return "bg-[var(--color-inverse-surface)] text-[var(--color-inverse-on-surface)]";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  const peakBars = [30, 45, 65, 100, 80, 50, 40];
  const complianceStats = [
    { label: "Authorized Access", value: "98.2%", pct: 98.2, barColor: "bg-[var(--color-primary)]" },
    { label: "Plate Recognition Accuracy", value: "99.5%", pct: 99.5, barColor: "bg-[var(--color-tertiary-container)]" },
  ];

  return (
    <>
      <main className="min-h-screen">
        <div className="p-8 max-w-[1600px] mx-auto">
          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-[var(--color-on-surface)]">Vehicle Entry/Exit Reports</h2>
              <p className="text-slate-500 font-[var(--font-label)] text-sm mt-1">Detailed operational log for the 24-hour cycle.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex bg-[var(--color-surface-container-low)] rounded-lg p-1">
                <button className="px-4 py-1.5 text-xs font-semibold font-[var(--font-label)] text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-highest)] rounded transition-all">
                  Last 24h
                </button>
                <button className="px-4 py-1.5 text-xs font-semibold font-[var(--font-label)] text-[var(--color-on-surface)] bg-white shadow-sm rounded transition-all">
                  Select Date
                </button>
              </div>
              <div className="flex gap-2">
                <button className="flex items-center gap-2 bg-white text-[var(--color-on-surface)] px-4 py-2 text-xs font-bold rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                  <span className="material-symbols-outlined text-sm">download</span>
                  EXPORT CSV
                </button>
                <button className="flex items-center gap-2 bg-[var(--color-primary-container)] text-white px-4 py-2 text-xs font-bold rounded-lg hover:bg-[var(--color-primary)] transition-colors">
                  <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
                  EXPORT PDF
                </button>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {[
              { icon: "login", border: "border-[var(--color-primary)]", label: "Total Entries", value: "1,284", trend: "12%", trendIcon: "trending_up", trendColor: "text-[var(--color-primary)]" },
              { icon: "logout", border: "border-slate-300", label: "Total Exits", value: "942", trend: "4%", trendIcon: "trending_down", trendColor: "text-slate-600" },
              { icon: "swap_horiz", border: "border-[var(--color-tertiary)]", label: "Net Traffic", value: "+342", badge: "CURRENT PEAK" },
            ].map((card) => (
              <div key={card.label} className={`bg-[var(--color-surface-container-lowest)] p-6 rounded-xl border-b-2 ${card.border} relative overflow-hidden group`}>
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <span className="material-symbols-outlined text-6xl">{card.icon}</span>
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-[var(--font-label)]">{card.label}</p>
                <h3 className="text-4xl font-black text-[var(--color-on-surface)] mt-2 tracking-tighter">{card.value}</h3>
                <div className="flex items-center gap-2 mt-4">
                  {card.trend && (
                    <>
                      <span className={`text-xs font-bold ${card.trendColor} flex items-center`}>
                        <span className="material-symbols-outlined text-xs">{card.trendIcon}</span>
                        {card.trend}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium font-[var(--font-label)]">vs yesterday</span>
                    </>
                  )}
                  {card.badge && (
                    <span className="bg-[var(--color-tertiary-fixed)] text-[var(--color-on-tertiary-fixed-variant)] px-2 py-0.5 rounded-full text-[10px] font-bold">
                      {card.badge}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Data Table */}
          <div className="bg-[var(--color-surface-container-lowest)] rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
              <h4 className="font-bold text-[var(--color-on-surface)] text-sm">Real-time Activity Log</h4>
              <div className="flex items-center gap-4">
                <button className="text-slate-400 hover:text-[var(--color-on-surface)] transition-colors">
                  <span className="material-symbols-outlined">filter_list</span>
                </button>
                <button className="text-slate-400 hover:text-[var(--color-on-surface)] transition-colors">
                  <span className="material-symbols-outlined">more_vert</span>
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/50">
                  <tr>
                    {["Timestamp", "Plate", "User Type", "Zone", "Status", "Action"].map((h, i) => (
                      <th
                        key={h}
                        className={`px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest font-[var(--font-label)] ${i === 5 ? "text-right" : ""}`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {activityLogs.map((row: { id: number; plate: string; timestamp: Date; zone: string; status: boolean; userType: string }) => (
                    <tr key={row.id} className="hover:bg-[var(--color-surface-container-low)] transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-[var(--color-on-surface)]">{new Date(row.timestamp).toLocaleTimeString()}</span>
                          <span className="text-[10px] text-slate-400 font-[var(--font-label)]">{new Date(row.timestamp).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-sm font-mono font-bold px-2 py-1 rounded bg-slate-100 text-slate-700`}>{row.plate}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight ${getUserTypeCls(row.userType)}`}>
                          {row.userType}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-[var(--color-on-surface)] font-medium font-[var(--font-label)]">{row.zone}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <div className={`w-1.5 h-1.5 rounded-full ${row.status ? "bg-[var(--color-primary)]" : "bg-[var(--color-error)]"}`} />
                          <span className={`text-xs font-bold ${row.status ? "text-[var(--color-primary)]" : "text-[var(--color-error)]"}`}>
                            {row.status ? "Granted" : "Rejected"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-slate-300 group-hover:text-[var(--color-primary)] transition-colors">
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
            <div className="px-6 py-4 bg-slate-50/50 flex items-center justify-between border-t border-slate-100">
              <p className="text-xs font-medium text-slate-500 font-[var(--font-label)]">Showing 1 to {activityLogs.length} of {activityLogs.length} entries</p>
              <div className="flex items-center gap-2">
                <button className="w-8 h-8 flex items-center justify-center rounded bg-white border border-slate-200 text-slate-400 hover:text-[var(--color-on-surface)] disabled:opacity-50" disabled>
                  <span className="material-symbols-outlined text-sm">chevron_left</span>
                </button>
                <button className="w-8 h-8 flex items-center justify-center rounded bg-[var(--color-primary)] text-white text-xs font-bold">1</button>
                {[2, 3].map((n) => (
                  <button key={n} className="w-8 h-8 flex items-center justify-center rounded bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold">{n}</button>
                ))}
                <button className="w-8 h-8 flex items-center justify-center rounded bg-white border border-slate-200 text-slate-400 hover:text-[var(--color-on-surface)]">
                  <span className="material-symbols-outlined text-sm">chevron_right</span>
                </button>
              </div>
            </div>
          </div>

          {/* Analytical Insight Section */}
          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Peak Traffic Window */}
            <div className="bg-[var(--color-surface-container-low)] p-8 rounded-xl relative">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-[var(--color-primary)]/10 rounded-lg">
                  <span className="material-symbols-outlined text-[var(--color-primary)]">insights</span>
                </div>
                <h5 className="text-sm font-bold text-[var(--color-on-surface)]">Peak Traffic Window</h5>
              </div>
              <div className="flex items-end gap-2 h-24 mb-6">
                {peakBars.map((h, i) => (
                  <div
                    key={i}
                    className={`flex-1 rounded-t-sm ${i === 3 ? "bg-[var(--color-primary)] relative" : i === 4 ? "bg-[var(--color-primary)]/60" : i === 2 ? "bg-[var(--color-primary)]/40" : i === 5 ? "bg-[var(--color-primary)]/30" : "bg-[var(--color-primary)]/20"}`}
                    style={{ height: `${h}%` }}
                  >
                    {i === 3 && (
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-[var(--color-on-surface)] text-white text-[8px] px-1.5 py-0.5 rounded font-bold">
                        08:30
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-600 font-[var(--font-label)] leading-relaxed">
                Traffic density is currently{" "}
                <span className="font-bold text-[var(--color-on-surface)]">14% higher</span> than the rolling 7-day average for this time slot. Suggest monitoring Zone B-4 for overflow potential.
              </p>
            </div>

            {/* Compliance Summary */}
            <div className="bg-[var(--color-surface-container-low)] p-8 rounded-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-[var(--color-tertiary)]/10 rounded-lg">
                  <span className="material-symbols-outlined text-[var(--color-tertiary)]">gavel</span>
                </div>
                <h5 className="text-sm font-bold text-[var(--color-on-surface)]">Compliance Summary</h5>
              </div>
              <div className="space-y-4">
                {complianceStats.map((stat) => (
                  <div key={stat.label}>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-slate-600 font-[var(--font-label)]">{stat.label}</span>
                      <span className="text-xs font-bold text-[var(--color-on-surface)]">{stat.value}</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1">
                      <div className={`${stat.barColor} h-full`} style={{ width: `${stat.pct}%` }} />
                    </div>
                  </div>
                ))}
                <p className="text-[10px] text-slate-400 mt-4 font-[var(--font-label)] italic">
                  All systems operating within defined safety margins.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Floating Action Button */}
      <button className="fixed bottom-8 right-8 w-14 h-14 bg-[var(--color-primary)] text-white rounded-full shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-50">
        <span className="material-symbols-outlined">add</span>
      </button>
    </>
  );
}
