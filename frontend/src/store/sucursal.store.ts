import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SucursalState {
  sucursalId: number | null;
  sucursalNombre: string;
  setSucursal: (id: number | null, nombre: string) => void;
}

export const useSucursalStore = create<SucursalState>()(
  persist(
    (set) => ({
      sucursalId: null,
      sucursalNombre: 'Todas las sedes',
      setSucursal: (id, nombre) => set({ sucursalId: id, sucursalNombre: nombre }),
    }),
    { name: 'veltra-sucursal' }
  )
);
