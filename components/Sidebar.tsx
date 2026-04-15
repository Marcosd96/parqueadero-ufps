"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Monitoreo", icon: "monitor_heart" },
  { href: "/analytics", label: "Analíticas", icon: "analytics" },
  { href: "/vehicles", label: "Registro de Vehículos", icon: "directions_car" },
  { href: "/requests", label: "Solicitudes", icon: "pending_actions" },
  { href: "/solicitudes-registro", label: "Solicitudes de Registro", icon: "person_add" },
  { href: "/students", label: "Directorio de Estudiantes", icon: "school" },
  { href: "/reports", label: "Reportes", icon: "assessment" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-full flex flex-col bg-[var(--color-surface-container-lowest)] border-r border-[var(--color-outline-variant)]/20 w-64 z-50">
      {/* Logo */}
      <div className="px-6 py-8 border-b border-[var(--color-outline-variant)]/15">
        <h1 className="text-base font-black tracking-tight text-[var(--color-primary)] uppercase leading-tight">
          Adm. Estacionamiento
        </h1>
        <p className="font-[var(--font-label)] text-[0.725rem] text-[var(--color-on-surface-variant)] mt-1">
          Operaciones de Seguridad
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 pt-4 space-y-0.5">
        {navItems.map(({ href, label, icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={
                isActive
                  ? "flex items-center gap-3 px-3 py-2.5 text-[var(--color-primary)] font-bold bg-[var(--color-primary-fixed)]/60 rounded-lg transition-all duration-150"
                  : "flex items-center gap-3 px-3 py-2.5 text-[var(--color-on-surface-variant)] font-medium hover:text-[var(--color-on-surface)] hover:bg-[var(--color-surface-container-low)] rounded-lg transition-all duration-150"
              }
            >
              <span className={`material-symbols-outlined text-[1.2rem] ${isActive ? "text-[var(--color-primary)]" : "text-[var(--color-on-surface-variant)]"}`}>
                {icon}
              </span>
              <span className="font-[var(--font-label)] text-sm">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="mt-auto px-3 pb-6 pt-4 space-y-0.5 border-t border-[var(--color-outline-variant)]/15">
        <button className="w-full bg-[var(--color-primary)] text-[var(--color-on-primary)] py-2.5 rounded-lg font-bold text-sm tracking-tight active:scale-95 transition-transform mb-3 flex items-center justify-center gap-2">
          <span className="material-symbols-outlined text-sm">lock</span>
          Bloqueo de Emergencia
        </button>
        <Link
          href="#"
          className="flex items-center gap-3 px-3 py-2.5 text-[var(--color-on-surface-variant)] font-medium hover:text-[var(--color-on-surface)] hover:bg-[var(--color-surface-container-low)] rounded-lg transition-colors"
        >
          <span className="material-symbols-outlined text-[1.2rem]">settings</span>
          <span className="font-[var(--font-label)] text-sm">Configuración</span>
        </Link>
        <Link
          href="#"
          className="flex items-center gap-3 px-3 py-2.5 text-[var(--color-on-surface-variant)] font-medium hover:text-[var(--color-on-surface)] hover:bg-[var(--color-surface-container-low)] rounded-lg transition-colors"
        >
          <span className="material-symbols-outlined text-[1.2rem]">help</span>
          <span className="font-[var(--font-label)] text-sm">Soporte</span>
        </Link>
      </div>
    </aside>
  );
}
