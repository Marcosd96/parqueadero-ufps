export const dynamic = "force-dynamic";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Campus ParkGuard - Panel de Analíticas",
  description: "Métricas de flujo y capacidad en tiempo real para el estacionamiento del campus",
};

import prisma from "@/lib/prisma";

export default async function AnalyticsPage() {
  const totalVehicles = await prisma.vehicle.count();
  const pendingRequests = await prisma.accessRequest.count({
    where: { status: "PENDING" },
  });

  const logs = await prisma.accessLog.findMany();
  const userTypeDistribution = logs.reduce((acc: Record<string, number>, log: { userType: string }) => {
    acc[log.userType] = (acc[log.userType] || 0) + 1;
    return acc;
  }, {});

  const totalLogs = logs.length || 1;
  const distribution = (Object.entries(userTypeDistribution) as [string, number][]).map(([label, count]) => ({
    label,
    pct: Math.round((count / totalLogs) * 100),
    color: label === "Student" ? "bg-[var(--color-primary)]" : "bg-[var(--color-primary-container)]",
  }));

  return (
    <>


      {/* Analytics Content */}
      <div className="p-8 space-y-8 max-w-7xl mx-auto w-full">
        {/* Dashboard Header & Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-[var(--font-headline)] font-extrabold tracking-tight text-slate-900">
              Analíticas de Operaciones
            </h1>
            <p className="text-slate-500 font-[var(--font-label)] text-sm mt-1">
              Métricas de capacidad y tráfico en tiempo real
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex bg-[var(--color-surface-container)] rounded-lg p-1">
              <button className="px-4 py-1.5 text-xs font-bold bg-white shadow-sm rounded-md text-[var(--color-primary)]">Hoy</button>
              <button className="px-4 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-700">Semana</button>
              <button className="px-4 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-700">Mes</button>
            </div>
            <select className="bg-[var(--color-surface-container-low)] border-none rounded-lg text-xs font-bold py-2 pr-8 pl-4 focus:ring-[var(--color-primary)]/20">
              <option>Todos los Tipos de Usuario</option>
              <option>Estudiante</option>
              <option>Facultad</option>
              <option>Personal</option>
              <option>Visitante</option>
            </select>
            <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg font-bold text-xs hover:bg-slate-800 transition-all">
              <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
              Generar Reporte PDF
            </button>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: "Capacidad Total", value: "4,850", sub: "Espacios", bar: 100, extraColor: "" },
            { label: "Ocupación Actual", value: `${Math.round((totalVehicles / 4850) * 100)}%`, sub: `${totalVehicles} Vehículos`, bar: Math.round((totalVehicles / 4850) * 100), extraColor: "text-[var(--color-primary)] font-bold" },
            { label: "Ingresos Diarios", value: "$0.00", sub: "Integración Pendiente", bar: null, extraColor: "text-green-600 font-bold" },
            { label: "Solicitudes Pendientes", value: pendingRequests.toString(), sub: null, badge: "Acción Necesaria", bar: null },
          ].map((card) => (
            <div key={card.label} className="p-6 bg-[var(--color-surface-container-lowest)] rounded-xl border border-slate-200/30 flex flex-col gap-1">
              <span className="font-[var(--font-label)] text-xs font-semibold text-slate-500 uppercase tracking-wider">{card.label}</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-[var(--font-headline)] font-black text-slate-900">{card.value}</span>
                {card.sub && <span className={`text-[0.65rem] font-[var(--font-label)] ${card.extraColor || "text-slate-400"}`}>{card.sub}</span>}
                {card.badge && (
                  <span className="px-2 py-0.5 rounded-full bg-[var(--color-tertiary-container)] text-[0.65rem] font-bold text-[var(--color-on-tertiary-container)]">{card.badge}</span>
                )}
              </div>
              {card.bar !== null && (
                <div className="mt-4 w-full bg-[var(--color-surface-container-low)] h-1.5 rounded-full overflow-hidden">
                  <div className="bg-[var(--color-primary)] h-full" style={{ width: `${card.bar}%` }} />
                </div>
              )}
              {card.label === "Ingresos Diarios" && (
                <div className="mt-4 flex items-center gap-1">
                  <span className="material-symbols-outlined text-green-600 text-sm">trending_up</span>
                  <span className="text-xs font-[var(--font-label)] text-slate-500">Precio por hora pico activo</span>
                </div>
              )}
              {card.label === "Solicitudes Pendientes" && (
                <div className="mt-4 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[var(--color-tertiary)] text-sm">history</span>
                  <span className="text-xs font-[var(--font-label)] text-slate-500">Respuesta prom.: 12 min</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Analytical Visuals (Bento) */}
        <div className="bento-grid">
          {/* Usage by User Type */}
          <div className="col-span-12 lg:col-span-5 p-8 bg-[var(--color-surface-container-lowest)] rounded-xl border border-slate-200/30">
            <div className="flex justify-between items-start mb-10">
              <div>
                <h3 className="font-[var(--font-headline)] font-extrabold text-slate-900">Uso por Tipo de Usuario</h3>
                <p className="font-[var(--font-label)] text-xs text-slate-500">Sesiones activas categorizadas</p>
              </div>
              <span className="material-symbols-outlined text-slate-400">more_vert</span>
            </div>
            <div className="space-y-6">
              {distribution.map((item) => (
                <div key={item.label} className="space-y-2">
                  <div className="flex justify-between font-[var(--font-label)] text-xs font-bold text-slate-700">
                    <span>{item.label}</span>
                    <span>{item.pct}%</span>
                  </div>
                  <div className="h-3 bg-[var(--color-surface-container-low)] rounded-sm overflow-hidden">
                    <div className={`${item.color} h-full`} style={{ width: `${item.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-10 pt-6 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-[var(--color-primary)] rounded-full" />
                <span className="font-[var(--font-label)] text-[0.7rem] text-slate-500">Residente Primario</span>
              </div>
              <button className="text-xs font-bold text-[var(--color-primary)] hover:underline">Ver detalles</button>
            </div>
          </div>

          {/* Traffic Trends */}
          <div className="col-span-12 lg:col-span-7 p-8 bg-[var(--color-surface-container-lowest)] rounded-xl border border-slate-200/30">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h3 className="font-[var(--font-headline)] font-extrabold text-slate-900">Tráfico de Estacionamiento</h3>
                <p className="font-[var(--font-label)] text-xs text-slate-500">Entradas vs salidas por hora</p>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-[var(--color-primary)] rounded-full" />
                  <span className="text-[0.65rem] font-bold font-[var(--font-label)] text-slate-600">ENTRADAS</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-slate-300 rounded-full" />
                  <span className="text-[0.65rem] font-bold font-[var(--font-label)] text-slate-600">SALIDAS</span>
                </div>
              </div>
            </div>
            <div className="relative h-64 w-full flex items-end justify-between px-2">
              <div className="absolute inset-0 flex items-end">
                <svg className="w-full h-full opacity-10" preserveAspectRatio="none" viewBox="0 0 100 100">
                  <path className="text-[var(--color-primary)]" d="M0 100 L10 80 L20 85 L30 40 L40 50 L50 20 L60 30 L70 10 L80 40 L90 20 L100 50 L100 100 Z" fill="currentColor" />
                </svg>
              </div>
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                {[0,1,2,3].map(i => <div key={i} className="w-full border-t border-slate-100" />)}
              </div>
              <div className="relative flex-1 flex justify-around items-end h-full z-10">
                {[
                  { time: "08:00", mb: "mb-24" },
                  { time: "10:00", mb: "mb-48" },
                  { time: "12:00", mb: "mb-32" },
                  { time: "14:00", mb: "mb-56" },
                  { time: "16:00", mb: "mb-20" },
                  { time: "18:00", mb: "mb-12" },
                ].map((pt) => (
                  <div key={pt.time} className="group relative flex flex-col items-center">
                    <div className={`w-2 h-2 rounded-full bg-[var(--color-primary)] ${pt.mb} group-hover:scale-150 transition-all`} />
                    <span className="text-[0.65rem] font-[var(--font-label)] text-slate-400 mt-4">{pt.time}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-6 p-4 bg-[var(--color-surface-container-low)] rounded-lg flex items-center gap-4">
              <span className="material-symbols-outlined text-[var(--color-primary)]">info</span>
              <p className="text-xs font-[var(--font-label)] text-[var(--color-on-surface-variant)]">
                Volumen pico detectado a las <span className="font-bold">14:22</span> con 420 vehículos ingresando por hora. Recomendación: Abrir Portón Auxiliar 4.
              </p>
            </div>
          </div>
        </div>

        {/* Lower Detail Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Critical Audit Log */}
          <div className="col-span-1 md:col-span-2 p-6 bg-[var(--color-surface-container-lowest)] rounded-xl border border-slate-200/30">
            <h3 className="font-[var(--font-headline)] font-extrabold text-slate-900 mb-6">Log de Auditoría Crítica</h3>
            <div className="space-y-4">
              {[
                { icon: "login", bg: "bg-[var(--color-primary-container)]/20", iconColor: "text-[var(--color-primary)]", title: "Placa ABC-1234 Ingresó", sub: "Zona B • Permiso de Personal", time: "14:52:10" },
                { icon: "warning", bg: "bg-[var(--color-error-container)]/20", iconColor: "text-[var(--color-error)]", title: "Intento de Entrada no Autorizado", sub: "Portón 2 • Placa OCULTA", time: "14:51:04" },
                { icon: "pending", bg: "bg-[var(--color-tertiary-container)]/20", iconColor: "text-[var(--color-tertiary)]", title: "Acceso de Invitado Solicitado", sub: "Kiosco de Visitantes 1", time: "14:50:55" },
              ].map((log) => (
                <div key={log.title} className="flex items-center justify-between py-3 hover:bg-[var(--color-surface-container-low)] px-3 rounded-lg transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded ${log.bg} flex items-center justify-center`}>
                      <span className={`material-symbols-outlined ${log.iconColor} text-sm`}>{log.icon}</span>
                    </div>
                    <div>
                      <p className="text-xs font-[var(--font-headline)] font-bold">{log.title}</p>
                      <p className="text-[0.65rem] font-[var(--font-label)] text-slate-500">{log.sub}</p>
                    </div>
                  </div>
                  <span className="text-[0.65rem] font-[var(--font-label)] font-bold text-slate-400">{log.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Zone Distribution */}
          <div className="p-6 bg-[var(--color-surface-container-lowest)] rounded-xl border border-slate-200/30 overflow-hidden relative group">
            <img
              className="absolute inset-0 w-full h-full object-cover opacity-20 grayscale"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDlptLvH73sWKcRhNuVqohWf8h1PZeMQI_Db317ARTYS7txZ5KNzE9Oefb0xoXJRp-lovE9uc556ddvsog_xLxTdh_Md4Go-awPgjR70-Ogi9nk1p6pbRIyLxnYakxTVGk-UjILQX0nqhI73HbwRGpp-LpHTVVgZXbj96-WDOKqkYjIi1p2dFunvMlMgsxaW7gCutr3VR4H3Dtiyr3uoK8CcokCZn8K_xeipwV4YMmXhvamtgKyDh5fSgQHyb_zT1zaDDm7j2fYLykF"
              alt="Campus map"
            />
            <div className="relative z-10">
              <h3 className="font-[var(--font-headline)] font-extrabold text-slate-900 mb-1">Distribución por Zonas</h3>
              <p className="font-[var(--font-label)] text-[0.65rem] text-slate-500 mb-6">Mapa de calor en vivo del campus</p>
              <div className="space-y-3">
                {[
                  { label: "Facultad Norte (Lote A)", pct: "95%", color: "bg-blue-100 text-blue-700" },
                  { label: "Estudiantes Central (Lote B)", pct: "78%", color: "bg-blue-100 text-blue-700" },
                  { label: "Comunes Visitantes (Lote C)", pct: "42%", color: "bg-green-100 text-green-700" },
                  { label: "Estadio Sur (Lote D)", pct: "12%", color: "bg-green-100 text-green-700" },
                ].map((zone) => (
                  <div key={zone.label} className="flex justify-between items-center text-[0.65rem] font-[var(--font-label)]">
                    <span className="font-bold text-slate-700">{zone.label}</span>
                    <span className={`px-2 py-0.5 ${zone.color} rounded-full font-bold`}>{zone.pct} Lleno</span>
                  </div>
                ))}
              </div>
              <button className="mt-8 w-full py-2 bg-white/60 backdrop-blur-sm border border-slate-200 rounded-lg text-xs font-bold text-slate-900 hover:bg-white transition-colors">
                Expandir Mapa en Vivo
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
