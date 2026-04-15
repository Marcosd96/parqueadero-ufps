"use client";

import { useState } from "react";
import { deleteVehicle, updateVehicle } from "./actions";

interface Vehicle {
  id: number;
  plate: string;
  brand: string | null;
  model: string;
  color: string;
  status: string;
  department: string;
}

export default function VehicleRowActions({ vehicle }: { vehicle: Vehicle }) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    plate: vehicle.plate,
    brand: vehicle.brand || "",
    model: vehicle.model,
    color: vehicle.color,
    status: vehicle.status,
    department: vehicle.department,
  });

  const handleDelete = async () => {
    setIsDeleting(true);
    const result = await deleteVehicle(vehicle.id);
    if (result.success) {
      setIsDeleteConfirmOpen(false);
    } else {
      alert(result.error);
      setIsDeleting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const result = await updateVehicle(vehicle.id, formData);
    if (result.success) {
      setIsEditOpen(false);
    } else {
      alert(result.error);
    }
    setLoading(false);
  };

  return (
    <>
      <div className="flex justify-end gap-1">
        <button 
          onClick={() => setIsEditOpen(true)}
          className="p-2 hover:bg-[var(--color-primary-fixed)] rounded-lg transition-colors text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)]"
          title="Editar vehículo"
        >
          <span className="material-symbols-outlined text-lg">edit</span>
        </button>
        <button 
          onClick={() => setIsDeleteConfirmOpen(true)}
          disabled={isDeleting}
          className="p-2 hover:bg-[var(--color-error-container)] rounded-lg transition-colors text-[var(--color-on-surface-variant)] hover:text-[var(--color-error)]"
          title="Eliminar vehículo"
        >
          <span className="material-symbols-outlined text-lg">
            {isDeleting ? "sync" : "delete"}
          </span>
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => !isDeleting && setIsDeleteConfirmOpen(false)}
          />
          <div className="relative bg-[var(--color-surface-container-lowest)] w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 border border-[var(--color-error-container)]">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-[var(--color-error-container)] text-[var(--color-on-error-container)] rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-3xl">warning</span>
              </div>
              <h3 className="text-xl font-bold text-[var(--color-on-surface)] mb-2">¿Eliminar vehículo?</h3>
              <p className="text-sm text-[var(--color-on-surface-variant)] leading-relaxed">
                Estás a punto de eliminar permanentemente el vehículo con placa <strong className="font-mono text-[var(--color-error)]">{vehicle.plate}</strong>. 
                Esta acción no se puede deshacer.
              </p>
            </div>
            <div className="p-4 bg-[var(--color-surface-container-low)] flex gap-3">
              <button 
                onClick={() => setIsDeleteConfirmOpen(false)}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] font-bold text-sm hover:bg-[var(--color-surface-container-high)] transition-all disabled:opacity-50"
              >
                Cancelar
              </button>
              <button 
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 bg-[var(--color-error)] text-white font-bold text-sm py-2.5 rounded-xl shadow-lg shadow-[var(--color-error)]/20 hover:bg-red-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDeleting && <span className="material-symbols-outlined text-sm animate-spin">sync</span>}
                {isDeleting ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => setIsEditOpen(false)}
          />
          
          {/* Modal Content */}
          <div className="relative bg-[var(--color-surface-container-lowest)] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 border border-[var(--color-outline-variant)]">
            <div className="p-6 border-b border-[var(--color-outline-variant)] flex items-center justify-between bg-[var(--color-surface-container-low)]">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[var(--color-primary)]">drive_file_rename_outline</span>
                <h3 className="text-lg font-bold text-[var(--color-on-surface)]">Editar Vehículo</h3>
              </div>
              <button 
                onClick={() => setIsEditOpen(false)}
                className="p-1 hover:bg-[var(--color-surface-variant)] rounded-full transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 text-left">
                  <label className="text-[0.7rem] font-bold uppercase tracking-wider text-[var(--color-on-surface-variant)] ml-1">Placa</label>
                  <input 
                    type="text"
                    value={formData.plate}
                    onChange={e => setFormData({...formData, plate: e.target.value.toUpperCase()})}
                    className="w-full bg-[var(--color-surface-container-high)] border border-[var(--color-outline-variant)] rounded-xl py-2 px-3 text-sm focus:ring-2 focus:ring-[var(--color-primary)] outline-none transition-all uppercase font-mono tracking-widest"
                    required
                  />
                </div>
                <div className="space-y-1.5 text-left">
                  <label className="text-[0.7rem] font-bold uppercase tracking-wider text-[var(--color-on-surface-variant)] ml-1">Estado</label>
                  <select 
                    value={formData.status}
                    onChange={e => setFormData({...formData, status: e.target.value})}
                    className="w-full bg-[var(--color-surface-container-high)] border border-[var(--color-outline-variant)] rounded-xl py-2 px-3 text-sm focus:ring-2 focus:ring-[var(--color-primary)] outline-none transition-all cursor-pointer"
                  >
                    <option value="ACTIVO">Activo</option>
                    <option value="SUSPENDIDO">Suspendido</option>
                    <option value="EN_REVISION">En Revisión</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 text-left">
                  <label className="text-[0.7rem] font-bold uppercase tracking-wider text-[var(--color-on-surface-variant)] ml-1">Marca</label>
                  <input 
                    type="text"
                    value={formData.brand}
                    onChange={e => setFormData({...formData, brand: e.target.value})}
                    className="w-full bg-[var(--color-surface-container-high)] border border-[var(--color-outline-variant)] rounded-xl py-2 px-3 text-sm focus:ring-2 focus:ring-[var(--color-primary)] outline-none transition-all"
                    placeholder="Mazda"
                  />
                </div>
                <div className="space-y-1.5 text-left">
                  <label className="text-[0.7rem] font-bold uppercase tracking-wider text-[var(--color-on-surface-variant)] ml-1">Modelo</label>
                  <input 
                    type="text"
                    value={formData.model}
                    onChange={e => setFormData({...formData, model: e.target.value})}
                    className="w-full bg-[var(--color-surface-container-high)] border border-[var(--color-outline-variant)] rounded-xl py-2 px-3 text-sm focus:ring-2 focus:ring-[var(--color-primary)] outline-none transition-all"
                    placeholder="3 Grand Touring"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-[0.7rem] font-bold uppercase tracking-wider text-[var(--color-on-surface-variant)] ml-1">Departamento</label>
                <select 
                  value={formData.department}
                  onChange={e => setFormData({...formData, department: e.target.value})}
                  className="w-full bg-[var(--color-surface-container-high)] border border-[var(--color-outline-variant)] rounded-xl py-2 px-3 text-sm focus:ring-2 focus:ring-[var(--color-primary)] outline-none transition-all cursor-pointer"
                >
                  <option value="ESTUDIANTE">Estudiante</option>
                  <option value="ADMINISTRATIVO">Administrativo</option>
                  <option value="DOCENTE">Docente</option>
                  <option value="OTRO">Otro</option>
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] font-bold text-sm hover:bg-[var(--color-surface-container-low)] transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-[var(--color-primary)] text-white font-bold text-sm py-2.5 rounded-xl shadow-lg shadow-[var(--color-primary)]/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading && <span className="material-symbols-outlined text-sm animate-spin">sync</span>}
                  {loading ? "Guardando..." : "Guardar Cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
