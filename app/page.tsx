import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Campus ParkGuard - Security Monitoring",
  description: "Real-time security monitoring for campus parking zones",
};

export default function MonitoringPage() {
  return (
    <>
      <main className="p-8 min-h-screen">
        <div className="max-w-[1400px] mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <h2 className="font-black text-2xl tracking-tight text-[var(--color-on-surface)]">
              Security Monitoring Center
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-2 h-2 rounded-full bg-[var(--color-primary)] animate-pulse" />
              <span className="font-[var(--font-label)] text-xs font-medium text-[var(--color-on-secondary-container)]">
                LIVE FEED: ENTRANCE GATE ALPHA-4
              </span>
            </div>
          </div>

          {/* Dashboard Grid */}
          <div className="grid grid-cols-12 gap-6">
            {/* Live Feed Section */}
            <div className="col-span-12 lg:col-span-8 space-y-6">
              <div className="relative bg-black rounded-lg overflow-hidden border border-white/5 aspect-video group">
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
                        OCR ACTIVE
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
                          CAL-7782-X
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white px-3 py-1.5 rounded flex items-center gap-2 text-xs font-semibold pointer-events-auto transition-all">
                      <span className="material-symbols-outlined text-sm">videocam</span>
                      CH-04 GATE-A
                    </button>
                    <button className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white px-3 py-1.5 rounded flex items-center gap-2 text-xs font-semibold pointer-events-auto transition-all">
                      <span className="material-symbols-outlined text-sm">fullscreen</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Recent Activity Table */}
              <div className="bg-[var(--color-surface-container-lowest)] rounded-lg p-6 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-[var(--color-on-surface)]">Recent Activity Log</h3>
                  <button className="text-[var(--color-primary)] text-xs font-bold hover:underline">Export CSV</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-[var(--font-label)] text-[0.8rem]">
                    <thead className="text-[var(--color-on-secondary-container)] uppercase tracking-wider font-semibold border-b border-[var(--color-outline-variant)]/15">
                      <tr>
                        <th className="pb-3 px-2">Timestamp</th>
                        <th className="pb-3 px-2">Identification</th>
                        <th className="pb-3 px-2">Method</th>
                        <th className="pb-3 px-2">Zone</th>
                        <th className="pb-3 px-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-outline-variant)]/10">
                      {[
                        { time: "14:21:44", id: "ABC-1234", method: "OCR", zone: "Faculty North", status: "GRANTED", granted: true },
                        { time: "14:19:02", id: "UID: 992811", method: "TAG", zone: "Main Deck", status: "GRANTED", granted: true },
                        { time: "14:15:30", id: "GUEST-X-11", method: "OCR", zone: "Gate B Entrance", status: "REJECTED", granted: false },
                      ].map((row, i) => (
                        <tr key={i} className="hover:bg-[var(--color-surface-container-low)] transition-colors">
                          <td className="py-4 px-2 font-mono text-[var(--color-on-surface-variant)]">{row.time}</td>
                          <td className="py-4 px-2 font-bold text-[var(--color-on-surface)]">{row.id}</td>
                          <td className="py-4 px-2">
                            <span className="bg-slate-100 px-2 py-0.5 rounded text-[0.65rem] font-bold">{row.method}</span>
                          </td>
                          <td className="py-4 px-2">{row.zone}</td>
                          <td className="py-4 px-2">
                            <span className={`px-3 py-1 rounded-full text-[0.65rem] font-bold ${row.granted ? "bg-[var(--color-primary-container)]/20 text-[var(--color-on-primary-fixed-variant)]" : "bg-[var(--color-error-container)]/40 text-[var(--color-on-error-container)]"}`}>
                              {row.status}
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
              <div className="bg-[var(--color-surface-container-lowest)] rounded-lg shadow-sm overflow-hidden border border-[var(--color-primary)]/10">
                <div className="bg-[var(--color-primary)] px-6 py-4">
                  <h3 className="text-white text-xs font-black tracking-widest uppercase">Last Vehicle Detected</h3>
                </div>
                <div className="p-6">
                  <div className="flex items-start gap-4 mb-6">
                    <img
                      alt="Detected Vehicle"
                      className="w-24 h-24 rounded-lg object-cover bg-slate-100 border border-slate-200"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuC8wMXzmUAzYlAZTWMmzzlhMc-uT-aTWYpc8EzXtmJhhu2mKDjiCfTUFp4IE3Y3xlTJz5wRalPdbFp18pqYlQKT8DPXZkkb4do02acXey4fkG5YehjiXzhB9xMcwmbz5lKKdPI-67k-l18tef2a9zwaAJmcdlQSSyb-bZMwDCwWrYosH47wjGQb0AxdTGNxv088v8EX9vUZ_fveZXprlpxP7H_dPkc5m_LhRUQQHP3IuHoRA9nUEH1I-qMMTn7vId--s_70nmfaib_7"
                    />
                    <div>
                      <div className="text-[0.65rem] font-[var(--font-label)] font-bold text-[var(--color-primary)] tracking-widest uppercase">PLATE NUMBER</div>
                      <div className="text-2xl font-black text-[var(--color-on-surface)] mb-2">CAL-7782-X</div>
                      <div className="inline-block bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] px-3 py-1 rounded-full text-[0.7rem] font-black tracking-wider">
                        ACCESS GRANTED
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4 pt-4 border-t border-[var(--color-outline-variant)]/15">
                    {[
                      { label: "User Name", value: "Dr. Marcus Vance" },
                      { label: "Department", value: "Bio-Tech Faculty" },
                      { label: "Role", value: "Full-Time Staff" },
                      { label: "Vehicle Model", value: "Tesla Model 3" },
                    ].map((item) => (
                      <div key={item.label} className="flex justify-between items-center">
                        <span className="text-xs font-[var(--font-label)] text-[var(--color-on-secondary-container)]">{item.label}</span>
                        <span className="text-sm font-bold text-[var(--color-on-surface)]">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 gap-3">
                {[
                  { icon: "door_open", label: "Manually Register", color: "text-[var(--color-primary)]" },
                  { icon: "report", label: "Register Incident", color: "text-[var(--color-error)]" },
                  { icon: "support_agent", label: "Communicate with Admin", color: "text-[var(--color-tertiary)]" },
                ].map((action) => (
                  <button
                    key={action.label}
                    className="flex items-center justify-center gap-3 w-full py-4 bg-[var(--color-surface-container-highest)] border border-[var(--color-outline-variant)]/30 hover:bg-[var(--color-surface-container-high)] transition-all text-[var(--color-on-surface)] font-bold text-sm rounded active:scale-95"
                  >
                    <span className={`material-symbols-outlined ${action.color}`}>{action.icon}</span>
                    {action.label}
                  </button>
                ))}
              </div>

              {/* Zone Occupancy */}
              <div className="bg-[var(--color-surface-container-low)] p-6 rounded-lg">
                <h4 className="text-[0.7rem] font-black text-[var(--color-on-secondary-container)] tracking-widest uppercase mb-4">
                  Live Zone Occupancy
                </h4>
                <div className="space-y-4">
                  {[
                    { label: "Zone A - Faculty", pct: 82 },
                    { label: "Zone B - Visitor", pct: 45 },
                  ].map((zone) => (
                    <div key={zone.label}>
                      <div className="flex justify-between text-[0.65rem] font-bold mb-1">
                        <span className="text-[var(--color-on-surface)]">{zone.label}</span>
                        <span className="text-[var(--color-primary)]">{zone.pct}%</span>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-[var(--color-primary)] h-full" style={{ width: `${zone.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
