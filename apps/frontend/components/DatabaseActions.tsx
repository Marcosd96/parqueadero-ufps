'use client';

import { useRouter } from "next/navigation";

interface DatabaseActionsProps {
  data: any[];
  tableName: string;
}

export default function DatabaseActions({ data, tableName }: DatabaseActionsProps) {
  const router = useRouter();

  const handleRefresh = () => {
    // router.refresh() trigger a server-side re-fetch of the current page
    router.refresh();
  };

  const handleExport = () => {
    if (!data || data.length === 0) {
      alert("No hay datos para exportar en esta página.");
      return;
    }

    try {
      // 1. Get headers
      const headers = Object.keys(data[0]);
      
      // 2. Format rows
      const csvRows = data.map(row => {
        return headers.map(header => {
          const val = row[header];
          // Escape quotes and wrap in quotes if string
          const escaped = ('' + (val ?? '')).replace(/"/g, '""');
          return `"${escaped}"`;
        }).join(',');
      });

      // 3. Combine headers and rows
      const csvContent = [headers.join(','), ...csvRows].join('\n');
      
      // 4. Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      
      link.setAttribute("href", url);
      link.setAttribute("download", `${tableName}_${timestamp}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Export error:", error);
      alert("Error al exportar los datos.");
    }
  };

  return (
    <div className="flex gap-6">
      <button 
        onClick={handleExport}
        className="text-[0.65rem] font-black text-[var(--color-primary)] uppercase tracking-[0.15em] hover:text-[var(--color-primary-container)] transition-colors flex items-center gap-1.5 group cursor-pointer"
      >
        <span className="material-symbols-outlined text-sm group-hover:rotate-12 transition-transform">download</span>
        Exportar CSV
      </button>
      <button 
        onClick={handleRefresh}
        className="text-[0.65rem] font-black text-[var(--color-primary)] uppercase tracking-[0.15em] hover:text-[var(--color-primary-container)] transition-colors flex items-center gap-1.5 group cursor-pointer"
      >
        <span className="material-symbols-outlined text-sm group-hover:spin-slow transition-transform">refresh</span>
        Actualizar
      </button>
    </div>
  );
}
