import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import { proveedorApi } from '../services/api';
import { Proveedor } from '../types';

export default function ProveedoresPage() {
  const qc = useQueryClient();
  const [editando, setEditando] = useState<Proveedor | null>(null);
  const [modal, setModal] = useState(false);
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<Partial<Proveedor>>();

  const { data: proveedores = [] } = useQuery<Proveedor[]>({
    queryKey: ['proveedores'],
    queryFn: () => proveedorApi.getAll().then((r) => r.data),
  });

  const crear = useMutation({
    mutationFn: (d: Partial<Proveedor>) => proveedorApi.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['proveedores'] }); cerrar(); toast.success('Proveedor creado'); },
    onError: () => toast.error('Error al guardar'),
  });

  const actualizar = useMutation({
    mutationFn: (d: Partial<Proveedor>) => proveedorApi.update(editando!.id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['proveedores'] }); cerrar(); toast.success('Proveedor actualizado'); },
    onError: () => toast.error('Error al actualizar'),
  });

  const eliminar = useMutation({
    mutationFn: (id: number) => proveedorApi.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['proveedores'] }); toast.success('Eliminado'); },
    onError: () => toast.error('No se puede eliminar'),
  });

  const abrirEditar = (p: Proveedor) => {
    setEditando(p);
    setValue('nombre', p.nombre); setValue('telefono', p.telefono); setValue('correo', p.correo); setValue('direccion', p.direccion);
    setModal(true);
  };

  const cerrar = () => { setModal(false); setEditando(null); reset(); };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Proveedores</h1>
        <button className="btn-primary flex items-center gap-2" onClick={() => setModal(true)}>
          <Plus size={18} /> Nuevo proveedor
        </button>
      </div>

      <div className="card overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['Nombre', 'Teléfono', 'Correo', 'Dirección', ''].map((h) => (
                <th key={h} className="text-left px-4 py-3 font-medium text-gray-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {proveedores.map((p) => (
              <tr key={p.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{p.nombre}</td>
                <td className="px-4 py-3 text-gray-500">{p.telefono || '-'}</td>
                <td className="px-4 py-3 text-gray-500">{p.correo || '-'}</td>
                <td className="px-4 py-3 text-gray-500">{p.direccion || '-'}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => abrirEditar(p)} className="text-gray-400 hover:text-blue-600 p-1"><Pencil size={15} /></button>
                    <button onClick={() => eliminar.mutate(p.id)} className="text-gray-400 hover:text-red-600 p-1"><Trash2 size={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {!proveedores.length && <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Sin proveedores</td></tr>}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold">{editando ? 'Editar proveedor' : 'Nuevo proveedor'}</h2>
              <button onClick={cerrar}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit((d) => editando ? actualizar.mutate(d) : crear.mutate(d))} className="space-y-4">
              <div>
                <label className="label">Nombre *</label>
                <input className={`input ${errors.nombre ? 'border-red-400' : ''}`} {...register('nombre', { required: 'El nombre es requerido' })} />
                {errors.nombre && <p className="text-red-500 text-xs mt-1">{errors.nombre.message}</p>}
              </div>
              <div><label className="label">Teléfono</label><input className="input" {...register('telefono')} /></div>
              <div><label className="label">Correo</label><input type="email" className="input" {...register('correo')} /></div>
              <div><label className="label">Dirección</label><input className="input" {...register('direccion')} /></div>
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
