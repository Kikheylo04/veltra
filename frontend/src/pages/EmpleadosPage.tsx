import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Plus, Pencil, X } from 'lucide-react';
import { empleadoApi } from '../services/api';
import { Empleado } from '../types';

export default function EmpleadosPage() {
  const qc = useQueryClient();
  const [editando, setEditando] = useState<Empleado | null>(null);
  const [modal, setModal] = useState(false);
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<Partial<Empleado>>();

  const { data: empleados = [] } = useQuery<Empleado[]>({
    queryKey: ['empleados'],
    queryFn: () => empleadoApi.getAll().then((r) => r.data),
  });

  const crear = useMutation({
    mutationFn: (d: Partial<Empleado>) => empleadoApi.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['empleados'] }); cerrar(); toast.success('Empleado registrado'); },
    onError: () => toast.error('Error al guardar'),
  });

  const actualizar = useMutation({
    mutationFn: (d: Partial<Empleado>) => empleadoApi.update(editando!.id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['empleados'] }); cerrar(); toast.success('Empleado actualizado'); },
    onError: () => toast.error('Error al actualizar'),
  });

  const abrirEditar = (e: Empleado) => {
    setEditando(e);
    setValue('nombre', e.nombre); setValue('especialidad', e.especialidad); setValue('telefono', e.telefono);
    setModal(true);
  };

  const cerrar = () => { setModal(false); setEditando(null); reset(); };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Empleados</h1>
        <button className="btn-primary flex items-center gap-2" onClick={() => setModal(true)}>
          <Plus size={18} /> Nuevo empleado
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {empleados.map((e) => (
          <div key={e.id} className="card flex items-start justify-between">
            <div>
              <p className="font-semibold">{e.nombre}</p>
              <p className="text-sm text-gray-500">{e.especialidad || 'Sin especialidad'}</p>
              {e.telefono && <p className="text-sm text-gray-400 mt-1">{e.telefono}</p>}
            </div>
            <button onClick={() => abrirEditar(e)} className="text-gray-400 hover:text-blue-600"><Pencil size={16} /></button>
          </div>
        ))}
        {!empleados.length && <p className="text-gray-400 col-span-3">Sin empleados registrados</p>}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold">{editando ? 'Editar empleado' : 'Nuevo empleado'}</h2>
              <button onClick={cerrar}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit((d) => editando ? actualizar.mutate(d) : crear.mutate(d))} className="space-y-4">
              <div>
                <label className="label">Nombre *</label>
                <input className={`input ${errors.nombre ? 'border-red-400' : ''}`} {...register('nombre', { required: 'El nombre es requerido' })} />
                {errors.nombre && <p className="text-red-500 text-xs mt-1">{errors.nombre.message}</p>}
              </div>
              <div><label className="label">Especialidad</label><input className="input" {...register('especialidad')} /></div>
              <div><label className="label">Teléfono</label><input className="input" {...register('telefono')} /></div>
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
