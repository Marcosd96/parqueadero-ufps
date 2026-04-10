import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vehicle Registry - Campus ParkGuard",
  description: "Manage campus permits and vehicle access logs",
};

const vehicles = [
  { model: "Tesla Model 3", color: "Midnight Silver", icon: "directions_car", plate: "PRK-8821", owner: "Dr. Sarah Jenkins", dept: "Biomedical Engineering", status: "Active Permit", statusCls: "bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)]", date: "Oct 12, 2023" },
  { model: "Ford F-150", color: "Oxford White", icon: "fire_truck", plate: "FLX-0092", owner: "Facilities Services", dept: "Campus Operations", status: "Renewal Due", statusCls: "bg-[var(--color-tertiary-container)] text-[var(--color-on-tertiary-container)]", date: "Jan 05, 2024" },
  { model: "Honda Accord", color: "Champagne Gold", icon: "directions_car", plate: "STU-1120", owner: "Michael Ross", dept: "School of Law", status: "Suspended", statusCls: "bg-[var(--color-error-container)] text-[var(--color-on-error-container)]", date: "Nov 18, 2023" },
  { model: "Yamaha MT-07", color: "Racing Blue", icon: "motorcycle", plate: "MTC-4401", owner: "Elena Rodriguez", dept: "Physical Education", status: "Active Permit", statusCls: "bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)]", date: "Feb 21, 2024" },
];

export default function VehiclesPage() {
  return (
    <>


      <main className="p-8 min-h-screen">
        {/* Header */}
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="font-[var(--font-headline)] text-[2rem] font-extrabold tracking-tight text-slate-900">Vehicle Registry</h2>
            <p className="font-[var(--font-label)] text-slate-500 mt-1">Manage campus permits and vehicle access logs</p>
          </div>
          <button className="bg-[var(--color-primary)] text-white px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 hover:opacity-90 shadow-lg shadow-[var(--color-primary)]/10 transition-all active:scale-95">
            <span className="material-symbols-outlined">add</span>
            Register New Vehicle
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-[var(--color-surface-container-lowest)] p-6 rounded-xl border-b-2 border-[var(--color-primary)] mb-8 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <label className="font-[var(--font-label)] text-[0.75rem] font-bold text-slate-500 uppercase tracking-wider">License Plate</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
                <input className="w-full bg-[var(--color-surface-container-low)] border-0 rounded py-2.5 pl-10 focus:ring-2 focus:ring-[var(--color-primary)]/20 text-sm font-[var(--font-label)]" placeholder="e.g. ABC-1234" type="text" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="font-[var(--font-label)] text-[0.75rem] font-bold text-slate-500 uppercase tracking-wider">User Name</label>
              <input className="w-full bg-[var(--color-surface-container-low)] border-0 rounded py-2.5 px-4 focus:ring-2 focus:ring-[var(--color-primary)]/20 text-sm font-[var(--font-label)]" placeholder="Search registered owners..." type="text" />
            </div>
            <div className="space-y-2">
              <label className="font-[var(--font-label)] text-[0.75rem] font-bold text-slate-500 uppercase tracking-wider">Department</label>
              <select className="w-full bg-[var(--color-surface-container-low)] border-0 rounded py-2.5 px-4 focus:ring-2 focus:ring-[var(--color-primary)]/20 text-sm font-[var(--font-label)] appearance-none">
                <option>All Departments</option>
                <option>Administration</option>
                <option>Engineering</option>
                <option>Medical Sciences</option>
                <option>Arts &amp; Humanities</option>
              </select>
            </div>
            <div className="flex items-end gap-3">
              <button className="bg-slate-100 text-slate-600 px-4 py-2.5 rounded-lg font-bold text-sm flex-1 hover:bg-slate-200 transition-colors">Clear Filters</button>
              <button className="bg-[var(--color-primary)]/10 text-[var(--color-primary)] px-4 py-2.5 rounded-lg font-bold text-sm flex-1 hover:bg-[var(--color-primary)]/20 transition-colors">Apply Search</button>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-[var(--color-surface-container-lowest)] rounded-xl overflow-hidden shadow-sm border border-slate-200/30">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[var(--color-surface-container-low)] text-slate-500 font-[var(--font-label)] text-[0.75rem] font-bold uppercase tracking-widest border-b border-slate-200/50">
                <th className="px-6 py-4">Vehicle Details</th>
                <th className="px-6 py-4">Plate ID</th>
                <th className="px-6 py-4">Owner / Department</th>
                <th className="px-6 py-4">Permit Status</th>
                <th className="px-6 py-4">Registered Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {vehicles.map((v) => (
                <tr key={v.plate} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                        <span className="material-symbols-outlined text-slate-400">{v.icon}</span>
                      </div>
                      <div>
                        <p className="font-bold text-sm text-slate-900">{v.model}</p>
                        <p className="font-[var(--font-label)] text-[0.75rem] text-slate-400">{v.color}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="bg-slate-900 text-white px-3 py-1 rounded font-mono text-xs font-bold tracking-widest">{v.plate}</span>
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-sm font-semibold text-slate-900">{v.owner}</p>
                    <p className="font-[var(--font-label)] text-[0.75rem] text-[var(--color-primary)]">{v.dept}</p>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`px-3 py-1 rounded-full text-[0.65rem] font-bold uppercase tracking-tighter ${v.statusCls}`}>{v.status}</span>
                  </td>
                  <td className="px-6 py-5">
                    <span className="font-[var(--font-label)] text-sm text-slate-500">{v.date}</span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex justify-end gap-2">
                      <button className="p-2 hover:bg-slate-200 rounded transition-colors text-slate-400 hover:text-[var(--color-primary)]">
                        <span className="material-symbols-outlined text-lg">history</span>
                      </button>
                      <button className="p-2 hover:bg-slate-200 rounded transition-colors text-slate-400">
                        <span className="material-symbols-outlined text-lg">more_vert</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="bg-[var(--color-surface-container-low)] px-6 py-4 flex items-center justify-between">
            <p className="font-[var(--font-label)] text-[0.75rem] text-slate-500 font-medium">
              Showing <span className="font-bold text-slate-900">1 to 4</span> of <span className="font-bold text-slate-900">128</span> entries
            </p>
            <div className="flex items-center gap-1">
              <button className="p-2 rounded hover:bg-slate-200 text-slate-400 disabled:opacity-30" disabled>
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <button className="w-8 h-8 rounded bg-[var(--color-primary)] text-white font-bold text-xs flex items-center justify-center">1</button>
              {[2, 3].map(n => (
                <button key={n} className="w-8 h-8 rounded hover:bg-slate-200 text-slate-600 font-bold text-xs flex items-center justify-center">{n}</button>
              ))}
              <span className="px-2 text-slate-400">...</span>
              <button className="w-8 h-8 rounded hover:bg-slate-200 text-slate-600 font-bold text-xs flex items-center justify-center">32</button>
              <button className="p-2 rounded hover:bg-slate-200 text-slate-600">
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          </div>
        </div>

        {/* System Usage Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          {[
            { icon: "directions_car", bg: "bg-[var(--color-primary)]/10", iconColor: "text-[var(--color-primary)]", value: "128", label: "Total Registered", sub: "Active in system" },
            { icon: "verified", bg: "bg-green-50", iconColor: "text-green-600", value: "94", label: "Active Permits", sub: "Valid and current" },
            { icon: "pending_actions", bg: "bg-[var(--color-tertiary-container)]/20", iconColor: "text-[var(--color-tertiary)]", value: "34", label: "Pending / Expired", sub: "Require attention" },
          ].map((card) => (
            <div key={card.label} className="bg-[var(--color-surface-container-highest)] p-6 rounded-lg flex items-center gap-6">
              <div className={`w-14 h-14 ${card.bg} rounded-full flex items-center justify-center ${card.iconColor}`}>
                <span className="material-symbols-outlined">{card.icon}</span>
              </div>
              <div>
                <p className="text-2xl font-black text-slate-900">{card.value}</p>
                <p className="font-bold text-sm text-slate-700">{card.label}</p>
                <p className="font-[var(--font-label)] text-[0.7rem] text-slate-400 mt-0.5">{card.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
