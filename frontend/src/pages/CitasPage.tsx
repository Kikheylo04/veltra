import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Plus, X, Check, MessageCircle, Calendar } from 'lucide-react';
import api, { clienteApi, vehiculoApi } from '../services/api';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import SkeletonTable from '../components/ui/SkeletonTable';
import EmptyState from '../components/ui/EmptyState';

const ESTADO_BADGE: Record<string, string> = {
  PENDIENTE: 'bg-yellow-100 text-yellow-700',
  CONFIRMADA: 'bg-blue-100 text-blue-700',
  COMPLETADA: 'bg-green-100 text-green-700',
  CANCELADA: 'bg-red-100 text-red-700',
};

export default function CitasPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState(false);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [clienteSelId, setClienteSelId] = useState<number | null>(null);
  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<any>();
  const clienteIdWatch = watch('clienteId');

  const { data: citas = [], isLoading } = useQuery({
    queryKey: ['citas'],
    queryFn: () => api.get('/citas').then(r => r.data),
  });

  const { data: clientesData } = useQuery({
    queryKey: ['clientes', '', 1, 200],
    queryFn: () => clienteApi.getAll('', 1, 200).then(r => r.data),
  });
  const clientes: any[] = (clientesData as any)?.data ?? [];

  const { data: vehiculos = [] } = useQuery({
    queryKey: ['vehiculos'],
    queryFn: () => vehiculoApi.getAll().then(r => r.data),
  });

  const vehiculosDelCliente = clienteIdWatch
    ? (vehiculos as any[]).filter((v: any) => String(v.clienteId) === String(clienteIdWatch))
    : vehiculos as any[];

  const crear = useMutation({
    mutationFn: (d: any) => api.post('/citas', d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['citas'] }); setModal(false); reset(); toast.success('Cita agendada'); },
    onError: () => toast.error('Error al agendar'),
  });

  const cambiarEstado = useMutation({
    mutationFn: ({ id, estado }: any) => api.patch(`/citas/${id}/estado`, { estado }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['citas'] }),
    onError: () => toast.error('Error al actualizar'),
  });

  const eliminar = useMutation({
    mutationFn: (id: number) => api.delete(`/citas/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['citas'] }); toast.success('Cita eliminada'); setConfirmId(null); },
  });

  const enviarWhatsApp = (cita: any) => {
    const telefono = cita.cliente?.telefono?.replace(/\D/g, '');
    if (!telefono) return toast.error('El cliente no tiene teléfono registrado');
    const fecha = format(new Date(cita.fecha), "dd/MM/yyyy 'a las' HH:mm", { locale: es });
    const msg = encodeURIComponent(`Hola ${cita.cliente?.nombre}, te confirmamos tu cita para el ${fecha}. ¡Te esperamos! 🔧`);
    window.open(`https://wa.me/${telefono}?text=${msg}`, '_blank');
  };

  const hoy = (citas as any[]).filter((c: any) => new Date(c.fecha).toDateString() === new Date().toDateString());

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Agenda / Citas</h1>
          <p className="text-sm text-gray-500 mt-1">{hoy.length} cita{hoy.length !== 1 ? 's' : ''} hoy</p>
        </div>
        <button className="btn btn-primary flex items-center gap-2" onClick={() => setModal(true)}>
          <Plus size={18} /> Nueva cita
        </button>
      </div>

      <div className="card overflow-hidden p-0">
        {isLoading ? <SkeletonTable rows={5} cols={6} /> : !(citas as any[]).length ? (
          <EmptyState icon={Calendar} titulo="Sin citas agendadas" descripcion="Agenda la primera cita del día" accion={{ label: 'Nueva cita', onClick: () => setModal(true) }} />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['Fecha y hora', 'Cliente', 'Vehículo', 'Descripción', 'Estado', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(citas as any[]).map((c: any) => (
                <tr key={c.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium">{format(new Date(c.fecha), 'dd MMM yyyy', { locale: es })}</p>
                    <p className="text-xs text-gray-400">{format(new Date(c.fecha), 'HH:mm')}</p>
                  </td>
                  <td className="px-4 py-3">{c.cliente?.nombre}</td>
                  <td className="px-4 py-3 text-gray-500">{c.vehiculo ? `${c.vehiculo.placa} · ${c.vehiculo.marca}` : '-'}</td>
                  <td className="px-4 py-3 max-w-xs truncate">{c.descripcion}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${ESTADO_BADGE[c.estado]}`}>{c.estado}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 items-center">
                      {c.estado === 'PENDIENTE' && (
                        <button onClick={() => cambiarEstado.mutate({ id: c.id, estado: 'CONFIRMADA' })} title="Confirmar"
                          className="p-1 text-blue-500 hover:text-blue-700"><Check size={15} /></button>
                      )}
                      {c.estado === 'CONFIRMADA' && (
                        <button onClick={() => cambiarEstado.mutate({ id: c.id, estado: 'COMPLETADA' })} title="Completar"
                          className="p-1 text-green-500 hover:text-green-700"><Check size={15} /></button>
                      )}
                      <button onClick={() => enviarWhatsApp(c)} title="Enviar confirmación WhatsApp"
                        className="p-1 text-green-600 hover:text-green-800"><MessageCircle size={15} /></button>
                      <button onClick={() => setConfirmId(c.id)} className="p-1 text-gray-400 hover:text-red-500">
                        <X size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold">Nueva cita</h2>
              <button onClick={() => { setModal(false); reset(); }}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit(d => crear.mutate(d))} className="space-y-4">
              <div>
                <label className="label">Cliente *</label>
                <select className={`input ${errors.clienteId ? 'border-red-400' : ''}`} {...register('clienteId', { required: 'Campo requerido' })}>
                  <option value="">Seleccionar...</option>
                  {clientes.map((c: any) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
                {errors.clienteId && <p className="text-red-500 text-xs mt-1">{errors.clienteId.message as string}</p>}
              </div>
              <div>
                <label className="label">Vehículo {clienteIdWatch ? `(${vehiculosDelCliente.length} del cliente)` : ''}</label>
                <select className="input" {...register('vehiculoId')}>
                  <option value="">Sin especificar</option>
                  {vehiculosDelCliente.map((v: any) => <option key={v.id} value={v.id}>{v.placa} — {v.marca} {v.modelo}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Fecha y hora *</label>
                <input type="datetime-local" className={`input ${errors.fecha ? 'border-red-400' : ''}`} {...register('fecha', { required: 'Campo requerido' })} />
                {errors.fecha && <p className="text-red-500 text-xs mt-1">{errors.fecha.message as string}</p>}
              </div>
              <div>
                <label className="label">Descripción *</label>
                <textarea className={`input ${errors.descripcion ? 'border-red-400' : ''}`} rows={3} {...register('descripcion', { required: 'Campo requerido' })} placeholder="Motivo de la cita..." />
                {errors.descripcion && <p className="text-red-500 text-xs mt-1">{errors.descripcion.message as string}</p>}
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setModal(false); reset(); }} className="btn btn-secondary flex-1">Cancelar</button>
                <button type="submit" disabled={crear.isPending} className="btn btn-primary flex-1">Agendar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmId !== null && (
        <ConfirmDialog
          mensaje="¿Eliminar esta cita? Esta acción no se puede deshacer."
          onConfirm={() => eliminar.mutate(confirmId)}
          onCancel={() => setConfirmId(null)}
          loading={eliminar.isPending}
        />
      )}
    </div>
  );
}
