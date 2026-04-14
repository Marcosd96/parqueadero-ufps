import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Visitor TAG Requests | Campus ParkGuard",
  description: "Review and manage temporary parking access for campus guests",
};

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
    <>


      {/* Content Canvas */}
      <main className="p-8 flex-1">
        <div className="max-w-6xl mx-auto">
          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Visitor TAG Requests</h2>
              <p className="text-slate-500 font-[var(--font-label)] mt-1">
                Review and manage temporary parking access for campus guests.
              </p>
            </div>
            <div className="flex items-center gap-2 bg-[var(--color-surface-container-low)] p-1 rounded-lg">
              <button className="px-6 py-2 bg-[var(--color-surface-container-lowest)] text-[var(--color-primary)] font-bold shadow-sm rounded-md font-[var(--font-label)] text-sm">
                Pending
              </button>
              <button className="px-6 py-2 text-slate-500 font-medium hover:bg-[var(--color-surface-container-high)] rounded-md font-[var(--font-label)] text-sm transition-all">
                Approved
              </button>
              <button className="px-6 py-2 text-slate-500 font-medium hover:bg-[var(--color-surface-container-high)] rounded-md font-[var(--font-label)] text-sm transition-all">
                Expired
              </button>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="bg-[var(--color-surface-container-lowest)] p-4 rounded-xl shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
              <input
                className="w-full pl-10 pr-4 py-2.5 bg-[var(--color-surface-container-low)] border-none focus:ring-2 focus:ring-[var(--color-primary)]/20 rounded-lg text-sm font-[var(--font-label)]"
                placeholder="Search by name, plate, or reason..."
                type="text"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2.5 text-slate-600 hover:bg-[var(--color-surface-container-low)] rounded-lg transition-all font-[var(--font-label)] text-sm font-medium">
              <span className="material-symbols-outlined text-lg">filter_list</span>
              Filter
            </button>
            <div className="h-6 w-px bg-slate-200 hidden md:block" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2">{requests.length} Total Requests</p>
          </div>

          {/* Data Table */}
          <div className="bg-[var(--color-surface-container-lowest)] rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[var(--color-surface-container-low)] border-b border-slate-200/30">
                <tr>
                  {["Requester Name", "Plate Number", "Visit Date", "Reason", "Status", "Actions"].map((h, i) => (
                    <th
                      key={h}
                      className={`px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest font-[var(--font-label)] ${i === 5 ? "text-right" : ""}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {requests.map((r: { id: number; requesterName: string; visitDate: Date; reason: string; plateNumber: string; status: string }) => (
                  <tr key={r.id} className="group hover:bg-[var(--color-surface-container-low)] transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full bg-[var(--color-primary-fixed)] flex items-center justify-center text-[var(--color-primary)] font-bold text-xs`}>
                          {getInitials(r.requesterName)}
                        </div>
                        <span className="font-bold text-slate-800 font-[var(--font-label)]">{r.requesterName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="px-2 py-1 bg-slate-100 text-slate-700 font-mono text-sm rounded border border-slate-200">
                        {r.plateNumber}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-sm text-slate-600 font-[var(--font-label)]">
                      {new Date(r.visitDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-5 text-sm text-slate-600 font-[var(--font-label)]">{r.reason}</td>
                    <td className="px-6 py-5">
                      <span className="px-3 py-1 bg-[var(--color-tertiary-container)] text-[var(--color-on-tertiary-fixed-variant)] text-[0.7rem] font-bold uppercase tracking-tight rounded-full">
                        {r.status}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="w-8 h-8 flex items-center justify-center bg-[var(--color-primary-container)] text-white rounded shadow-sm hover:scale-105 active:scale-95 transition-all">
                          <span className="material-symbols-outlined text-sm">check</span>
                        </button>
                        <button className="w-8 h-8 flex items-center justify-center bg-[var(--color-error-container)] text-[var(--color-on-error-container)] rounded shadow-sm hover:scale-105 active:scale-95 transition-all">
                          <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination bar */}
            <div className="px-6 py-4 bg-[var(--color-surface-container-low)] border-t border-slate-200/20 flex justify-between items-center">
              <span className="text-xs text-slate-400 font-[var(--font-label)]">Showing 1 to 4 of 12 requests</span>
              <div className="flex gap-1">
                <button className="p-1 hover:bg-slate-200 rounded transition-all">
                  <span className="material-symbols-outlined text-sm">chevron_left</span>
                </button>
                <button className="p-1 hover:bg-slate-200 rounded transition-all">
                  <span className="material-symbols-outlined text-sm">chevron_right</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
