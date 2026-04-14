export const dynamic = "force-dynamic";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Students Directory - Campus ParkGuard",
  description: "Manage registered students for campus parking",
};

import prisma from "@/lib/prisma";
import Link from "next/link";

export default async function StudentsPage({ searchParams }: { searchParams: Promise<{ query?: string, page?: string }> }) {
  const resolvedParams = await searchParams;
  const currentPage = Number(resolvedParams.page) || 1;
  const query = resolvedParams.query || "";
  const ITEMS_PER_PAGE = 50;

  const filters = query ? {
    OR: [
      { cardnumber: { contains: query } },
      { firstname: { contains: query, mode: "insensitive" as const } },
      { surname: { contains: query, mode: "insensitive" as const } }
    ]
  } : {};

  const totalFilteredStudents = await prisma.student.count({ where: filters });
  
  const students = await prisma.student.findMany({
    where: filters,
    take: ITEMS_PER_PAGE,
    skip: (currentPage - 1) * ITEMS_PER_PAGE,
    orderBy: {
      id: "desc"
    },
    include: {
      vehicles: true
    }
  });

  return (
    <main className="p-8 min-h-screen">
      <div className="max-w-[1400px] mx-auto">
        <div className="mb-8 flex justify-between items-end">
          <div>
            <h2 className="font-black text-2xl tracking-tight text-[var(--color-on-surface)]">
              Students Directory
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="font-[var(--font-label)] text-xs font-medium text-[var(--color-on-secondary-container)]">
                {query ? `Found ${totalFilteredStudents.toLocaleString()} matches for "${query}"` : `${totalFilteredStudents.toLocaleString()} total registered students securely synced`}
              </span>
            </div>
          </div>
          <button className="bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90 text-white px-4 py-2 rounded font-bold text-sm transition-colors flex items-center gap-2 shadow-md">
            <span className="material-symbols-outlined text-sm">person_add</span>
            Register Student
          </button>
        </div>

        {/* Action Bar */}
        <div className="flex gap-4 mb-6">
          <form method="GET" action="/students" className="flex-1 max-w-md relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-on-surface-variant)]/50">search</span>
            <input 
              type="text"
              name="query"
              defaultValue={query}
              placeholder="Search by ID, Firstname or Surname..." 
              className="w-full bg-[var(--color-surface-container-highest)] border-none rounded-lg py-3 pl-10 pr-4 text-sm font-medium text-[var(--color-on-surface)] focus:ring-2 focus:ring-[var(--color-primary)]/50 outline-none placeholder:text-[var(--color-on-surface-variant)]/50"
            />
          </form>
          <button className="bg-[var(--color-surface-container-highest)] px-4 rounded-lg font-bold text-sm flex items-center gap-2 text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)] transition-colors">
            <span className="material-symbols-outlined text-sm">filter_list</span>
            Filters
          </button>
        </div>

        {/* Data Table */}
        <div className="bg-[var(--color-surface-container-lowest)] rounded-lg shadow-sm border border-[var(--color-outline-variant)]/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-[var(--font-label)] text-[0.8rem]">
              <thead className="bg-[var(--color-surface-container-low)] text-[var(--color-on-secondary-container)] uppercase tracking-wider font-semibold border-b border-[var(--color-outline-variant)]/15">
                <tr>
                  <th className="py-4 px-6">ID (Card Number)</th>
                  <th className="py-4 px-6">First Name</th>
                  <th className="py-4 px-6">Surname</th>
                  <th className="py-4 px-6">Vehicles Linked</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-outline-variant)]/10">
                {students.map((student: { id: number; cardnumber: string; firstname: string; surname: string; vehicles: Record<string, unknown>[] }) => (
                  <tr key={student.id} className="hover:bg-[var(--color-surface-container-lowest)]/50 transition-colors group">
                    <td className="py-4 px-6 font-mono font-bold text-[var(--color-primary)]">
                      {student.cardnumber}
                    </td>
                    <td className="py-4 px-6 text-[var(--color-on-surface)] font-bold">
                      {student.firstname}
                    </td>
                    <td className="py-4 px-6 text-[var(--color-on-surface)]">
                      {student.surname}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-3 py-1 rounded-full text-[0.65rem] font-bold ${student.vehicles.length > 0 ? "bg-[var(--color-tertiary-container)] text-[var(--color-on-tertiary-container)]" : "bg-slate-100 text-slate-500"}`}>
                        {student.vehicles.length > 0 ? `${student.vehicles.length} Vehicle(s)` : "None"}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button className="text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] transition-colors opacity-0 group-hover:opacity-100">
                        <span className="material-symbols-outlined text-lg">edit</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-[var(--color-outline-variant)]/15 flex justify-between items-center text-xs text-[var(--color-on-surface-variant)] font-bold">
            <span>Showing pages {currentPage} of {Math.ceil(totalFilteredStudents / ITEMS_PER_PAGE) || 1}</span>
            <div className="flex gap-2">
              {currentPage > 1 ? (
                <Link href={`/students?page=${currentPage - 1}${query ? `&query=${encodeURIComponent(query)}` : ""}`} className="px-3 py-1 rounded border border-[var(--color-outline-variant)]/30 hover:bg-[var(--color-surface-container-low)] transition-colors">Prev</Link>
              ) : (
                <button disabled className="px-3 py-1 rounded border border-[var(--color-outline-variant)]/10 text-slate-300 opacity-50 cursor-not-allowed">Prev</button>
              )}
              {currentPage * ITEMS_PER_PAGE < totalFilteredStudents ? (
                <Link href={`/students?page=${currentPage + 1}${query ? `&query=${encodeURIComponent(query)}` : ""}`} className="px-3 py-1 rounded border border-[var(--color-outline-variant)]/30 hover:bg-[var(--color-surface-container-low)] transition-colors">Next</Link>
              ) : (
                <button disabled className="px-3 py-1 rounded border border-[var(--color-outline-variant)]/10 text-slate-300 opacity-50 cursor-not-allowed">Next</button>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
