"use client";

interface FormattedTimeProps {
  date: Date | string;
  className?: string;
  showDate?: boolean;
}

/**
 * Componente optimizado para mostrar fechas/horas formateadas en el cliente.
 * Utiliza 'suppressHydrationWarning' para evitar renders en cascada y errores de hidratación,
 * asegurando que se use la zona horaria del navegador del usuario sin penalización de rendimiento.
 */
export default function FormattedTime({ date, className, showDate = false }: FormattedTimeProps) {
  const d = new Date(date);
  
  const formatted = showDate 
    ? `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <span className={className} suppressHydrationWarning>
      {formatted}
    </span>
  );
}
