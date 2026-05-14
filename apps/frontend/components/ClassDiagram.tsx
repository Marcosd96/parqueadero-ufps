'use client';

import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";

interface ClassDiagramProps {
  definition: string;
}

mermaid.initialize({
  startOnLoad: false,
  theme: "base",
  themeVariables: {
    primaryColor: "#f0f5ff",
    primaryBorderColor: "#005bbf",
    primaryTextColor: "#191c1d",
    lineColor: "#005bbf",
    fontSize: "13px",
    classText: "#191c1d",
    background: "#ffffff",
    nodeBorder: "#c1c6d6",
    edgeLabelBackground: "#f8fafb",
    attributeBackgroundColorEven: "#ffffff",
    attributeBackgroundColorOdd: "#f8fafb",
  },
  classDiagram: {
    useMaxWidth: true,
  },
  securityLevel: "loose",
});

export default function ClassDiagram({ definition }: ClassDiagramProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    const render = async () => {
      if (!ref.current) return;
      try {
        setError(null);
        const id = `mermaid-${Date.now()}`;
        const { svg } = await mermaid.render(id, definition);
        if (ref.current) {
          ref.current.innerHTML = svg;
          // Make the SVG responsive
          const svgEl = ref.current.querySelector("svg");
          if (svgEl) {
            svgEl.style.width = "100%";
            svgEl.style.height = "auto";
            svgEl.style.maxWidth = "none";
          }
        }
      } catch (err) {
        console.error("Mermaid render error:", err);
        setError("Error al renderizar el diagrama.");
      }
    };
    render();
  }, [definition]);

  return (
    <div className="relative animate-in slide-in-from-bottom-4 duration-700">
      {/* Zoom controls */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-white/80 backdrop-blur-md border border-[var(--color-outline-variant)]/20 rounded-xl px-3 py-2 shadow-md">
        <button
          onClick={() => setZoom(z => Math.max(0.3, z - 0.15))}
          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[var(--color-surface-container-high)] transition-colors text-[var(--color-on-surface-variant)] font-black text-lg"
          title="Alejar"
        >
          −
        </button>
        <span className="text-[0.65rem] font-black text-[var(--color-on-surface-variant)] uppercase w-10 text-center">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => setZoom(z => Math.min(2.5, z + 0.15))}
          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[var(--color-surface-container-high)] transition-colors text-[var(--color-on-surface-variant)] font-black text-lg"
          title="Acercar"
        >
          +
        </button>
        <div className="w-px h-4 bg-[var(--color-outline-variant)]/30 mx-1" />
        <button
          onClick={() => setZoom(1)}
          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[var(--color-surface-container-high)] transition-colors"
          title="Restablecer zoom"
        >
          <span className="material-symbols-outlined text-base text-[var(--color-on-surface-variant)]">fit_screen</span>
        </button>
      </div>

      {/* Legend */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-1.5 bg-white/80 backdrop-blur-md border border-[var(--color-outline-variant)]/20 rounded-xl px-3 py-3 shadow-md">
        <p className="text-[0.55rem] font-black text-[var(--color-on-surface-variant)] uppercase tracking-widest mb-1">Leyenda</p>
        {[
          { color: "bg-amber-400", label: "PK — Clave Primaria" },
          { color: "bg-blue-400", label: "FK — Clave Foránea" },
          { color: "bg-slate-300", label: "Campo regular" },
          { color: "bg-emerald-400", label: "Único" },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${color}`} />
            <span className="text-[0.6rem] font-bold text-[var(--color-on-surface-variant)]">{label}</span>
          </div>
        ))}
      </div>

      {error ? (
        <div className="p-12 text-center">
          <span className="material-symbols-outlined text-4xl text-[var(--color-error)]">error</span>
          <p className="mt-3 text-[var(--color-on-surface-variant)] font-bold">{error}</p>
        </div>
      ) : (
        <div
          className="overflow-auto rounded-[2.5rem] bg-white border border-[var(--color-outline-variant)]/20 shadow-[0_20px_50px_rgba(0,0,0,0.06)] p-8"
          style={{ minHeight: "500px" }}
        >
          <div
            ref={ref}
            style={{ transform: `scale(${zoom})`, transformOrigin: "top center", transition: "transform 0.2s ease" }}
          />
        </div>
      )}
    </div>
  );
}
