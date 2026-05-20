import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Plus, Search, Pencil, X, AlertTriangle } from 'lucide-react';
import { repuestoApi, proveedorApi } from '../services/api';
import { Repuesto, Proveedor } from '../types';

export default function RepuestosPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [editando, setEditando] = useState<Repuesto | null>(null);
  const [modal, setModal] = useState(false);
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<Partial<Repuesto>>();

  const { data: repuestos = [] } = useQuery<Repuesto[]>({
    queryKey: ['repuestos', search],
    queryFn: () => repuestoApi.getAll({ search }).then((r) => r.data),
  });

  const { data: proveedores = [] } = useQuery<Proveedor[]>({
    queryKey: ['proveedores'],
    queryFn: () => proveedorApi.getAll().then((r) => r.data),
  });

  const crear = useMutation({
    mutationFn: (d: Partial<Repuesto>) => repuestoApi.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['repuestos'] }); cerrar(); toast.success('Repuesto creado'); },
    onError: () => toast.error('Error al guardar'),
  });

  const actualizar = useMutation({
    mutationFn: (d: Partial<Repuesto>) => repuestoApi.update(editando!.id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['repuestos'] }); cerrar(); toast.success('Repuesto actualizado'); },
    onError: () => toast.error('Error al actualizar'),
  });

  const abrirEditar = (r: Repuesto) => {
    setEditando(r);
    (Object.keys(r) as (keyof Repuesto)[]).forEach((k) => setValue(k, r[k] as never));
    setModal(true);
  };

  const cerrar = () => { setModal(false); setEditando(null); reset(); };
  const onSubmit = (d: Partial<Repuesto>) => editando ? actualizar.mutate(d) : crear.mutate(d);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Inventario de Repuestos</h1>
        <button className="btn-primary flex items-center gap-2" onClick={() => setModal(true)}>
          <Plus size={18} /> Nuevo repuesto
        </button>
      </div>

      <div className="card mb-6">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-9" placeholder="Buscar por código o nombre..."
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['Código', 'Nombre', 'Stock', 'P. Costo', 'P. Venta', 'Proveedor', ''].map((h) => (
                <th key={h} className="text-left px-4 py-3 font-medium text-gray-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {repuestos.map((r) => (
              <tr key={r.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs text-gray-500">{r.codigo}</td>
                <td className="px-4 py-3 font-medium">{r.nombre}</td>
                <td className="px-4 py-3">
                  <span className={`badge ${r.stock <= r.stockMinimo ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {r.stock <= r.stockMinimo && <AlertTriangle size={10} className="mr-1" />}
                    {r.stock}
                  </span>
                </td>
                <td className="px-4 py-3">${Number(r.precioCosto).toFixed(2)}</td>
                <td className="px-4 py-3">${Number(r.precioVenta).toFixed(2)}</td>
                <td className="px-4 py-3 text-gray-500">{r.proveedor?.nombre || '-'}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => abrirEditar(r)} className="text-gray-400 hover:text-blue-600 p-1"><Pencil size={15} /></button>
                </td>
              </tr>
            ))}
            {!repuestos.length && <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Sin repuestos</td></tr>}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold">{editando ? 'Editar repuesto' : 'Nuevo repuesto'}</h2>
              <button onClick={cerrar}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Código *</label>
                  <input className={`input ${errors.codigo ? 'border-red-400' : ''}`} {...register('codigo', { required: 'El código es requerido' })} />
                  {errors.codigo && <p className="text-red-500 text-xs mt-1">{errors.codigo.message}</p>}
                </div>
                <div>
                  <label className="label">Nombre *</label>
                  <input className={`input ${errors.nombre ? 'border-red-400' : ''}`} {...register('nombre', { required: 'El nombre es requerido' })} />
                  {errors.nombre && <p className="text-red-500 text-xs mt-1">{errors.nombre.message}</p>}
                </div>
              </div>
              <div>
                <label className="label">Descripción</label>
                <input className="input" {...register('descripcion')} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Precio costo</label>
                  <input type="number" step="0.01" className="input" {...register('precioCosto')} />
                </div>
                <div>
                  <label className="label">Precio venta</label>
                  <input type="number" step="0.01" className="input" {...register('precioVenta')} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Stock inicial</label>
                  <input type="number" className="input" {...register('stock')} />
                </div>
                <div>
                  <label className="label">Stock mínimo</label>
                  <input type="number" className="input" {...register('stockMinimo')} />
                </div>
              </div>
              <div>
                <label className="label">Proveedor</label>
                <select className="input" {...register('proveedorId')}>
                  <option value="">Sin proveedor</option>
                  {proveedores.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={cerrar} className="btn-secondary flex-1">Cancelar</button>
                <button type="submit" className="btn-primary flex-1">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
