import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Registro de Usuarios — Campus ParkGuard UFPS",
  description:
    "Formulario de registro para estudiantes, docentes y administrativos que deseen solicitar acceso al parqueadero universitario de la UFPS.",
};

export default function RegistroLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Full-screen overlay that covers the admin sidebar/topbar.
    // position:fixed + z-index ensures it sits on top of the root layout chrome.
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        overflowY: "auto",
        background: "var(--color-background)",
      }}
    >
      {children}
    </div>
  );
}
