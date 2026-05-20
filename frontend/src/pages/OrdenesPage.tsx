import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, Eye, X } from 'lucide-react';
import { ordenApi, vehiculoApi, empleadoApi } from '../services/api';
import { OrdenTrabajo, Vehiculo, Empleado, EstadoOT } from '../types';
import Pagination from '../components/ui/Pagination';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const ESTADO_BADGE: Record<EstadoOT, string> = {
  RECIBIDO: 'bg-blue-100 text-blue-700',
  DIAGNOSTICO: 'bg-yellow-100 text-yellow-700',
  REPARACION: 'bg-purple-100 text-purple-700',
  LISTO: 'bg-green-100 text-green-700',
  ENTREGADO: 'bg-gray-100 text-gray-600',
  CANCELADO: 'bg-red-100 text-red-700',
};

const ESTADO_LABEL: Record<EstadoOT, string> = {
  RECIBIDO: 'Recibido', DIAGNOSTICO: 'Diagnóstico', REPARACION: 'Reparación',
  LISTO: 'Listo', ENTREGADO: 'Entregado', CANCELADO: 'Cancelado',
};

export default function OrdenesPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [modal, setModal] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;
  const { register, handleSubmit, reset, formState: { errors } } = useForm<any>();

  const { data: ordenesData } = useQuery({
    queryKey: ['ordenes', filtroEstado, page],
    queryFn: () => ordenApi.getAll(filtroEstado ? { estado: filtroEstado, page, limit: PAGE_SIZE } : { page, limit: PAGE_SIZE }).then((r) => r.data),
  });
  const ordenes: OrdenTrabajo[] = (ordenesData as any)?.data ?? [];
  const totalOrdenes: number = (ordenesData as any)?.total ?? 0;

  const { data: vehiculos = [] } = useQuery<Vehiculo[]>({
    queryKey: ['vehiculos'],
    queryFn: () => vehiculoApi.getAll().then((r) => r.data),
  });

  const { data: empleados = [] } = useQuery<Empleado[]>({
    queryKey: ['empleados'],
    queryFn: () => empleadoApi.getAll().then((r) => r.data),
  });

  const crear = useMutation({
    mutationFn: (data: any) => ordenApi.create(data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['ordenes'] });
      reset(); setModal(false);
      toast.success('Orden creada');
      navigate(`/ordenes/${res.data.id}`);
    },
    onError: () => toast.error('Error al crear la orden'),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Órdenes de Trabajo</h1>
        <button className="btn-primary flex items-center gap-2" onClick={() => setModal(true)}>
          <Plus size={18} /> Nueva orden
        </button>
      </div>

      <div className="card mb-6 flex gap-2 flex-wrap">
        {['', ...Object.keys(ESTADO_LABEL)].map((e) => (
          <button
            key={e}
            onClick={() => { setFiltroEstado(e); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filtroEstado === e ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {e ? ESTADO_LABEL[e as EstadoOT] : 'Todas'}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['#', 'Vehículo', 'Cliente', 'Problema', 'Estado', 'Ingreso', 'Mecánico', ''].map((h) => (
                <th key={h} className="text-left px-4 py-3 font-medium text-gray-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ordenes.map((o) => (
              <tr key={o.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-gray-400">#{o.id}</td>
                <td className="px-4 py-3 font-medium">{o.vehiculo?.placa} <span className="text-gray-400 font-normal">{o.vehiculo?.marca} {o.vehiculo?.modelo}</span></td>
                <td className="px-4 py-3">{o.vehiculo?.cliente?.nombre}</td>
                <td className="px-4 py-3 max-w-xs truncate text-gray-600">{o.descripcionProblema}</td>
                <td className="px-4 py-3">
                  <span className={`badge ${ESTADO_BADGE[o.estado]}`}>{ESTADO_LABEL[o.estado]}</span>
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {format(new Date(o.fechaIngreso), 'dd MMM', { locale: es })}
                </td>
                <td className="px-4 py-3 text-gray-500">{o.empleado?.nombre || '-'}</td>
                <td className="px-4 py-3">
                  <button onClick={() => navigate(`/ordenes/${o.id}`)} className="text-gray-400 hover:text-blue-600 p-1">
                    <Eye size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {!ordenes.length && (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">Sin órdenes</td></tr>
            )}
          </tbody>
        </table>
        <Pagination page={page} total={totalOrdenes} pageSize={PAGE_SIZE} onChange={setPage} />
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold">Nueva Orden de Trabajo</h2>
              <button onClick={() => { setModal(false); reset(); }}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit((d) => crear.mutate(d))} className="space-y-4">
              <div>
                <label className="label">Vehículo *</label>
                <select className={`input ${errors.vehiculoId ? 'border-red-400' : ''}`} {...register('vehiculoId', { required: 'Selecciona un vehículo' })}>
                  <option value="">Seleccionar vehículo...</option>
                  {vehiculos.map((v) => (
                    <option key={v.id} value={v.id}>{v.placa} — {v.marca} {v.modelo} ({v.cliente?.nombre})</option>
                  ))}
                </select>
                {errors.vehiculoId && <p className="text-red-500 text-xs mt-1">{errors.vehiculoId.message}</p>}
              </div>
              <div>
                <label className="label">Mecánico asignado</label>
                <select className="input" {...register('empleadoId')}>
                  <option value="">Sin asignar</option>
                  {empleados.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Problema reportado *</label>
                <textarea className={`input ${errors.descripcionProblema ? 'border-red-400' : ''}`} rows={3} {...register('descripcionProblema', { required: 'Describe el problema' })} />
                {errors.descripcionProblema && <p className="text-red-500 text-xs mt-1">{errors.descripcionProblema.message}</p>}
              </div>
              <div>
                <label className="label">Fecha entrega estimada</label>
                <input type="date" className="input" {...register('fechaEntregaEst')} />
              </div>
              <div>
                <label className="label">Observaciones</label>
                <textarea className="input" rows={2} {...register('observaciones')} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setModal(false); reset(); }} className="btn-secondary flex-1">Cancelar</button>
                <button type="submit" className="btn-primary flex-1">Crear orden</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
