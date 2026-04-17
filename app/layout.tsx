import type { Metadata } from "next";
import "./globals.css";
import { getSession } from "@/lib/auth";
import DashboardLayout from "@/components/DashboardLayout";

export const metadata: Metadata = {
  title: "Campus ParkGuard - Administración de Estacionamiento",
  description: "Sistema de gestión de estacionamiento y monitoreo de seguridad del campus universitario",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  const isLoggedIn = !!session;

  return (
    <html lang="es" className="light">
      <head>
        {/* Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Public+Sans:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[var(--color-background)] min-h-screen">
        {isLoggedIn ? (
          <DashboardLayout user={session}>
            {children}
          </DashboardLayout>
        ) : (
          <main className="min-h-screen">
            {children}
          </main>
        )}
      </body>
    </html>
  );
}
