import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Plus, Search, Pencil, Trash2, X } from 'lucide-react';
import { clienteApi } from '../services/api';
import { Cliente } from '../types/index';
import Pagination from '../components/ui/Pagination';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import SkeletonTable from '../components/ui/SkeletonTable';
import EmptyState from '../components/ui/EmptyState';

const PAGE_SIZE = 20;

export default function ClientesPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [editando, setEditando] = useState<Cliente | null>(null);
  const [modal, setModal] = useState(false);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<Partial<Cliente>>();

  const { data } = useQuery({
    queryKey: ['clientes', search, page],
    queryFn: () => clienteApi.getAll(search, page, PAGE_SIZE).then((r) => r.data),
  });
  const clientes: Cliente[] = (data as any)?.data ?? [];
  const total: number = (data as any)?.total ?? 0;

  const crear = useMutation({
    mutationFn: (data: Partial<Cliente>) => clienteApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['clientes'] }); cerrar(); toast.success('Cliente creado'); setPage(1); },
    onError: () => toast.error('Error al guardar'),
  });

  const actualizar = useMutation({
    mutationFn: (data: Partial<Cliente>) => clienteApi.update(editando!.id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['clientes'] }); cerrar(); toast.success('Cliente actualizado'); },
    onError: () => toast.error('Error al actualizar'),
  });

  const eliminar = useMutation({
    mutationFn: (id: number) => clienteApi.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['clientes'] }); toast.success('Cliente eliminado'); setConfirmId(null); },
    onError: () => { toast.error('No se puede eliminar (tiene vehículos asociados)'); setConfirmId(null); },
  });

  const abrirEditar = (c: Cliente) => {
    setEditando(c);
    setValue('nombre', c.nombre);
    setValue('telefono', c.telefono);
    setValue('correo', c.correo);
    setValue('direccion', c.direccion);
    setModal(true);
  };

  const cerrar = () => { setModal(false); setEditando(null); reset(); };

  const onSubmit = (data: Partial<Cliente>) => {
    if (editando) actualizar.mutate(data);
    else crear.mutate(data);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Clientes</h1>
        <button className="btn-primary flex items-center gap-2" onClick={() => setModal(true)}>
          <Plus size={18} /> Nuevo cliente
        </button>
      </div>

      <div className="card mb-6">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="input pl-9"
            placeholder="Buscar por nombre, teléfono o correo..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        {!data && <SkeletonTable rows={6} cols={6} />}
        {data && (
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['Nombre', 'Teléfono', 'Correo', 'Dirección', 'Vehículos', ''].map((h) => (
                <th key={h} className="text-left px-4 py-3 font-medium text-gray-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {clientes.map((c) => (
              <tr key={c.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{c.nombre}</td>
                <td className="px-4 py-3 text-gray-500">{c.telefono || '-'}</td>
                <td className="px-4 py-3 text-gray-500">{c.correo || '-'}</td>
                <td className="px-4 py-3 text-gray-500">{c.direccion || '-'}</td>
                <td className="px-4 py-3">{c.vehiculos?.length ?? 0}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => abrirEditar(c)} className="text-gray-500 hover:text-blue-600 p-1">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => setConfirmId(c.id)} className="text-gray-500 hover:text-red-600 p-1">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!clientes.length && (
              <tr><td colSpan={6}><EmptyState icon={Search} titulo="Sin clientes" descripcion="Agrega el primer cliente" /></td></tr>
            )}
          </tbody>
        </table>
        )}
        <Pagination page={page} total={total} pageSize={PAGE_SIZE} onChange={setPage} />
      </div>

      {confirmId !== null && (
        <ConfirmDialog
          mensaje="¿Eliminar este cliente? Solo es posible si no tiene vehículos."
          onConfirm={() => eliminar.mutate(confirmId)}
          onCancel={() => setConfirmId(null)}
          loading={eliminar.isPending}
        />
      )}

      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold">{editando ? 'Editar cliente' : 'Nuevo cliente'}</h2>
              <button onClick={cerrar}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="label">Nombre *</label>
                <input className={`input ${errors.nombre ? 'border-red-400' : ''}`} {...register('nombre', { required: 'El nombre es requerido' })} />
                {errors.nombre && <p className="text-red-500 text-xs mt-1">{errors.nombre.message}</p>}
              </div>
              <div>
                <label className="label">Teléfono</label>
                <input className="input" {...register('telefono')} />
              </div>
              <div>
                <label className="label">Correo</label>
                <input type="email" className="input" {...register('correo')} />
              </div>
              <div>
                <label className="label">Dirección</label>
                <input className="input" {...register('direccion')} />
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
