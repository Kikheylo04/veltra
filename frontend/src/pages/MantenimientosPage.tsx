import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Plus, X, AlertTriangle, Wrench, MessageCircle } from 'lucide-react';
import api, { vehiculoApi } from '../services/api';
import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';

const TIPOS = ['Cambio de aceite', 'Filtro de aire', 'Filtro de combustible', 'Pastillas de freno', 'Alineación', 'Balanceo', 'Revisión general', 'Cambio de correa', 'Frenos', 'Otro'];

export default function MantenimientosPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState(false);
  const [tab, setTab] = useState<'todos' | 'proximos'>('proximos');
  const { register, handleSubmit, reset, formState: { errors } } = useForm<any>();

  const { data: mantenimientos = [] } = useQuery({
    queryKey: ['mantenimientos', tab],
    queryFn: () => api.get(tab === 'proximos' ? '/mantenimientos/proximos' : '/mantenimientos').then(r => r.data),
    refetchInterval: 60000,
  });

  const { data: vehiculos = [] } = useQuery({
    queryKey: ['vehiculos'],
    queryFn: () => vehiculoApi.getAll().then(r => r.data),
  });

  const crear = useMutation({
    mutationFn: (d: any) => api.post('/mantenimientos', d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['mantenimientos'] }); setModal(false); reset(); toast.success('Mantenimiento registrado'); },
    onError: () => toast.error('Error al guardar'),
  });

  const getDiasRestantes = (fecha: string) => differenceInDays(new Date(fecha), new Date());

  const enviarRecordatorio = (m: any) => {
    const telefono = m.vehiculo?.cliente?.telefono?.replace(/\D/g, '');
    if (!telefono) return toast.error('El cliente no tiene teléfono registrado');
    const dias = m.fechaProximo ? getDiasRestantes(m.fechaProximo) : null;
    const cuando = dias === 0 ? 'hoy' : dias === 1 ? 'mañana' : `en ${dias} días`;
    const msg = encodeURIComponent(`Hola ${m.vehiculo?.cliente?.nombre}, tu ${m.vehiculo?.marca} ${m.vehiculo?.modelo} (${m.vehiculo?.placa}) está próximo a necesitar *${m.tipo}* (${cuando}). ¿Agendamos una cita? 🛠️`);
    window.open(`https://wa.me/${telefono}?text=${msg}`, '_blank');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Historial de Mantenimientos</h1>
          <p className="text-sm text-gray-500 mt-1">Control de servicios preventivos por vehículo</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => setModal(true)}>
          <Plus size={18} /> Registrar mantenimiento
        </button>
      </div>

      <div className="flex gap-2 mb-5">
        {[['proximos', 'Próximos vencimientos'], ['todos', 'Todos']].map(([val, label]) => (
          <button key={val} onClick={() => setTab(val as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === val ? 'bg-blue-600 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}>
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(mantenimientos as any[]).map((m: any) => {
          const dias = m.fechaProximo ? getDiasRestantes(m.fechaProximo) : null;
          const urgente = dias !== null && dias <= 7;
          const proximo = dias !== null && dias <= 30;

          return (
            <div key={m.id} className={`card border-l-4 ${urgente ? 'border-red-500' : proximo ? 'border-yellow-500' : 'border-green-500'}`}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold">{m.tipo}</p>
                  <p className="text-sm text-gray-500">{m.vehiculo?.placa} · {m.vehiculo?.marca} {m.vehiculo?.modelo}</p>
                  <p className="text-xs text-gray-400">{m.vehiculo?.cliente?.nombre}</p>
                </div>
                <Wrench size={18} className={urgente ? 'text-red-500' : proximo ? 'text-yellow-500' : 'text-green-500'} />
              </div>

              {m.descripcion && <p className="text-sm text-gray-600 mb-2">{m.descripcion}</p>}

              <div className="space-y-1 text-xs text-gray-500">
                <p>Realizado: {format(new Date(m.fechaRealizado), 'dd/MM/yyyy', { locale: es })}</p>
                {m.kmActual && <p>KM actual: {m.kmActual.toLocaleString()}</p>}
                {m.kmProximo && <p>Próximo KM: {m.kmProximo.toLocaleString()}</p>}
                {m.costo > 0 && <p>Costo: ${Number(m.costo).toFixed(2)}</p>}
              </div>

              {m.fechaProximo && (
                <div className={`mt-3 p-2 rounded-lg text-xs font-medium flex items-center gap-1 ${
                  urgente ? 'bg-red-50 text-red-700' : proximo ? 'bg-yellow-50 text-yellow-700' : 'bg-green-50 text-green-700'
                }`}>
                  {urgente && <AlertTriangle size={12} />}
                  {dias !== null && dias < 0
                    ? `Vencido hace ${Math.abs(dias)} días`
                    : dias === 0 ? 'Vence hoy'
                    : `Próximo: ${format(new Date(m.fechaProximo), 'dd MMM yyyy', { locale: es })} (${dias} días)`
                  }
                </div>
              )}
              <button onClick={() => enviarRecordatorio(m)}
                className="mt-2 w-full flex items-center justify-center gap-1.5 text-xs text-green-700 bg-green-50 hover:bg-green-100 rounded-lg py-1.5 transition-colors">
                <MessageCircle size={13} /> Enviar recordatorio WhatsApp
              </button>
            </div>
          );
        })}
        {!(mantenimientos as any[]).length && (
          <div className="col-span-3 text-center py-12 text-gray-400">
            <Wrench size={40} className="mx-auto mb-2 opacity-30" />
            <p>{tab === 'proximos' ? 'No hay mantenimientos próximos a vencer' : 'Sin mantenimientos registrados'}</p>
          </div>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold">Registrar mantenimiento</h2>
              <button onClick={() => { setModal(false); reset(); }}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit(d => crear.mutate(d))} className="space-y-4">
              <div>
                <label className="label">Vehículo *</label>
                <select className={`input ${errors.vehiculoId ? 'border-red-400' : ''}`} {...register('vehiculoId', { required: 'Campo requerido' })}>
                  <option value="">Seleccionar...</option>
                  {(vehiculos as any[]).map((v: any) => (
                    <option key={v.id} value={v.id}>{v.placa} — {v.marca} {v.modelo} ({v.cliente?.nombre})</option>
                  ))}
                </select>
                {errors.vehiculoId && <p className="text-red-500 text-xs mt-1">{errors.vehiculoId.message}</p>}
              </div>
              <div>
                <label className="label">Tipo *</label>
                <select className={`input ${errors.tipo ? 'border-red-400' : ''}`} {...register('tipo', { required: 'Campo requerido' })}>
                  <option value="">Seleccionar...</option>
                  {TIPOS.map(t => <option key={t}>{t}</option>)}
                </select>
                {errors.tipo && <p className="text-red-500 text-xs mt-1">{errors.tipo.message}</p>}
              </div>
              <div><label className="label">Descripción</label><textarea className="input" rows={2} {...register('descripcion')} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">KM actual</label><input type="number" className="input" {...register('kmActual')} /></div>
                <div><label className="label">KM próximo servicio</label><input type="number" className="input" {...register('kmProximo')} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Fecha próximo</label><input type="date" className="input" {...register('fechaProximo')} /></div>
                <div><label className="label">Costo ($)</label><input type="number" step="0.01" className="input" {...register('costo')} /></div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setModal(false); reset(); }} className="btn-secondary flex-1">Cancelar</button>
                <button type="submit" className="btn-primary flex-1">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
