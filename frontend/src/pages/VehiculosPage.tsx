import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Plus, Search, Pencil, X } from 'lucide-react';
import { vehiculoApi, clienteApi } from '../services/api';
import { Vehiculo, Cliente } from '../types';

export default function VehiculosPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [editando, setEditando] = useState<Vehiculo | null>(null);
  const [modal, setModal] = useState(false);
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<Partial<Vehiculo>>();

  const { data: vehiculos = [] } = useQuery<Vehiculo[]>({
    queryKey: ['vehiculos', search],
    queryFn: () => vehiculoApi.getAll({ search }).then((r) => r.data),
  });

  const { data: clientes = [] } = useQuery<Cliente[]>({
    queryKey: ['clientes'],
    queryFn: () => clienteApi.getAll().then((r) => r.data),
  });

  const crear = useMutation({
    mutationFn: (data: Partial<Vehiculo>) => vehiculoApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vehiculos'] }); cerrar(); toast.success('Vehículo registrado'); },
    onError: () => toast.error('Error al guardar'),
  });

  const actualizar = useMutation({
    mutationFn: (data: Partial<Vehiculo>) => vehiculoApi.update(editando!.id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vehiculos'] }); cerrar(); toast.success('Vehículo actualizado'); },
    onError: () => toast.error('Error al actualizar'),
  });

  const abrirEditar = (v: Vehiculo) => {
    setEditando(v);
    Object.entries(v).forEach(([k, val]) => setValue(k as keyof Vehiculo, val as never));
    setModal(true);
  };

  const cerrar = () => { setModal(false); setEditando(null); reset(); };

  const onSubmit = (data: Partial<Vehiculo>) => {
    if (editando) actualizar.mutate(data);
    else crear.mutate(data);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Vehículos</h1>
        <button className="btn-primary flex items-center gap-2" onClick={() => setModal(true)}>
          <Plus size={18} /> Nuevo vehículo
        </button>
      </div>

      <div className="card mb-6">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-9" placeholder="Buscar por placa, marca o modelo..."
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['Placa', 'Marca / Modelo', 'Año', 'Color', 'Propietario', ''].map((h) => (
                <th key={h} className="text-left px-4 py-3 font-medium text-gray-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {vehiculos.map((v) => (
              <tr key={v.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3 font-mono font-semibold">{v.placa}</td>
                <td className="px-4 py-3">{v.marca} {v.modelo}</td>
                <td className="px-4 py-3">{v.anio}</td>
                <td className="px-4 py-3">{v.color || '-'}</td>
                <td className="px-4 py-3">{v.cliente?.nombre || '-'}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => abrirEditar(v)} className="text-gray-500 hover:text-blue-600 p-1">
                    <Pencil size={15} />
                  </button>
                </td>
              </tr>
            ))}
            {!vehiculos.length && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Sin vehículos registrados</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold">{editando ? 'Editar vehículo' : 'Nuevo vehículo'}</h2>
              <button onClick={cerrar}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="label">Cliente *</label>
                <select className={`input ${errors.clienteId ? 'border-red-400' : ''}`} {...register('clienteId', { required: 'Selecciona un cliente' })}>
                  <option value="">Seleccionar...</option>
                  {clientes.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
                {errors.clienteId && <p className="text-red-500 text-xs mt-1">{errors.clienteId.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Placa *</label>
                  <input className={`input ${errors.placa ? 'border-red-400' : ''}`} {...register('placa', { required: 'Requerido' })} />
                  {errors.placa && <p className="text-red-500 text-xs mt-1">{errors.placa.message}</p>}
                </div>
                <div>
                  <label className="label">Año *</label>
                  <input type="number" className={`input ${errors.anio ? 'border-red-400' : ''}`} {...register('anio', { required: 'Requerido' })} />
                  {errors.anio && <p className="text-red-500 text-xs mt-1">{errors.anio.message}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Marca *</label>
                  <input className={`input ${errors.marca ? 'border-red-400' : ''}`} {...register('marca', { required: 'Requerido' })} />
                  {errors.marca && <p className="text-red-500 text-xs mt-1">{errors.marca.message}</p>}
                </div>
                <div>
                  <label className="label">Modelo *</label>
                  <input className={`input ${errors.modelo ? 'border-red-400' : ''}`} {...register('modelo', { required: 'Requerido' })} />
                  {errors.modelo && <p className="text-red-500 text-xs mt-1">{errors.modelo.message}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Color</label>
                  <input className="input" {...register('color')} />
                </div>
                <div>
                  <label className="label">VIN</label>
                  <input className="input" {...register('vin')} />
                </div>
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
