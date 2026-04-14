"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Monitoring", icon: "monitor_heart" },
  { href: "/analytics", label: "Analytics", icon: "analytics" },
  { href: "/vehicles", label: "Vehicle Registry", icon: "directions_car" },
  { href: "/requests", label: "Requests", icon: "pending_actions" },
  { href: "/students", label: "Students Directory", icon: "school" },
  { href: "/reports", label: "Reports", icon: "assessment" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-full flex flex-col bg-slate-50 dark:bg-slate-900 w-64 z-50">
      {/* Logo */}
      <div className="px-6 py-8">
        <h1 className="text-lg font-black tracking-tighter text-blue-800 dark:text-blue-200 uppercase">
          Parking Admin
        </h1>
        <p className="font-[var(--font-label)] text-[0.75rem] text-[var(--color-on-surface-variant)] mt-1">
          Security Operations
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 space-y-2 mt-4">
        {navItems.map(({ href, label, icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={
                isActive
                  ? "flex items-center gap-3 px-4 py-3 text-blue-700 dark:text-blue-400 font-bold border-r-4 border-blue-700 dark:border-blue-400 bg-slate-200/50 dark:bg-slate-800/50 transition-all duration-150 rounded"
                  : "flex items-center gap-3 px-4 py-3 text-slate-600 dark:text-slate-400 font-medium hover:text-blue-600 dark:hover:text-blue-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all duration-150 rounded"
              }
            >
              <span className="material-symbols-outlined">{icon}</span>
              <span className="font-[var(--font-label)]">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="mt-auto px-4 pb-8 space-y-2">
        <button className="w-full bg-[var(--color-primary)] text-white py-3 rounded-lg font-bold text-sm tracking-tight active:scale-95 transition-transform mb-6">
          Emergency Lockout
        </button>
        <Link
          href="#"
          className="flex items-center gap-3 px-4 py-3 text-slate-600 dark:text-slate-400 font-medium hover:text-blue-600 transition-colors"
        >
          <span className="material-symbols-outlined">settings</span>
          <span className="font-[var(--font-label)]">Settings</span>
        </Link>
        <Link
          href="#"
          className="flex items-center gap-3 px-4 py-3 text-slate-600 dark:text-slate-400 font-medium hover:text-blue-600 transition-colors"
        >
          <span className="material-symbols-outlined">help</span>
          <span className="font-[var(--font-label)]">Support</span>
        </Link>
      </div>
    </aside>
  );
}
