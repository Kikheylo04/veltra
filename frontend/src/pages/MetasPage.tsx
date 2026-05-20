import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Plus, X, Target } from 'lucide-react';
import api from '../services/api';

export default function MetasPage() {
  const qc = useQueryClient();
  const hoy = new Date();
  const [mes, setMes] = useState(hoy.getMonth() + 1);
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [modal, setModal] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<any>();

  const { data: resumen = { metas: [], totalMeta: 0, totalReal: 0, avancePct: 0 } } = useQuery({
    queryKey: ['metas-resumen', mes, anio],
    queryFn: () => api.get('/metas/resumen', { params: { mes, anio } }).then(r => r.data),
  });

  const { data: empleados = [] } = useQuery({
    queryKey: ['empleados'],
    queryFn: () => api.get('/empleados').then(r => r.data),
  });

  const crear = useMutation({
    mutationFn: (d: any) => api.post('/metas', { ...d, mes, anio }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['metas-resumen'] }); setModal(false); reset(); toast.success('Meta creada'); },
  });

  const actualizarReal = useMutation({
    mutationFn: ({ id, realValor }: any) => api.patch(`/metas/${id}/real`, { realValor }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['metas-resumen'] }),
    onError: () => toast.error('Error al actualizar'),
  });

  const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Metas</h1>
        <button className="btn-primary flex items-center gap-2" onClick={() => setModal(true)}>
          <Plus size={18} /> Nueva meta
        </button>
      </div>

      {/* Selector mes/año */}
      <div className="card mb-6 flex items-center gap-4">
        <div className="flex gap-1">
          {MESES.map((m, i) => (
            <button key={m} onClick={() => setMes(i + 1)}
              className={`px-2 py-1 rounded text-sm font-medium transition-colors ${mes === i + 1 ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
              {m}
            </button>
          ))}
        </div>
        <input type="number" value={anio} onChange={e => setAnio(Number(e.target.value))} className="input w-24 text-center" />
      </div>

      {/* Resumen global */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card text-center">
          <p className="text-sm text-gray-500">Meta total</p>
          <p className="text-2xl font-bold">${Number(resumen.totalMeta).toFixed(0)}</p>
        </div>
        <div className="card text-center">
          <p className="text-sm text-gray-500">Real</p>
          <p className="text-2xl font-bold text-green-600">${Number(resumen.totalReal).toFixed(0)}</p>
        </div>
        <div className="card text-center">
          <p className="text-sm text-gray-500">Avance</p>
          <p className={`text-2xl font-bold ${resumen.avancePct >= 100 ? 'text-green-600' : resumen.avancePct >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>
            {resumen.avancePct}%
          </p>
        </div>
      </div>

      {/* Barra de progreso global */}
      <div className="card mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span>Progreso del mes — {MESES[mes-1]} {anio}</span>
          <span className="font-semibold">{resumen.avancePct}%</span>
        </div>
        <div className="bg-gray-100 rounded-full h-4 overflow-hidden">
          <div
            className={`h-4 rounded-full transition-all ${resumen.avancePct >= 100 ? 'bg-green-500' : resumen.avancePct >= 70 ? 'bg-yellow-500' : 'bg-red-500'}`}
            style={{ width: `${Math.min(resumen.avancePct, 100)}%` }}
          />
        </div>
      </div>

      {/* Metas individuales */}
      <div className="space-y-3">
        {resumen.metas.map((m: any) => {
          const pct = m.metaValor > 0 ? Math.round((Number(m.realValor) / Number(m.metaValor)) * 100) : 0;
          return (
            <div key={m.id} className="card">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-semibold">{m.tipo}</p>
                  <p className="text-sm text-gray-500">{m.empleado?.nombre || 'General'}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Meta: <span className="font-semibold">${Number(m.metaValor).toFixed(0)}</span></p>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Real: </span>
                    <input
                      type="number"
                      step="0.01"
                      defaultValue={Number(m.realValor)}
                      onBlur={(e) => actualizarReal.mutate({ id: m.id, realValor: e.target.value })}
                      className="border rounded px-2 py-0.5 text-sm w-24 text-right"
                    />
                  </div>
                </div>
              </div>
              <div className="bg-gray-100 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${pct >= 100 ? 'bg-green-500' : pct >= 70 ? 'bg-yellow-500' : 'bg-red-500'}`}
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>
              <p className="text-xs text-right text-gray-400 mt-1">{pct}%</p>
            </div>
          );
        })}
        {!resumen.metas.length && (
          <div className="text-center py-12 text-gray-400">
            <Target size={40} className="mx-auto mb-2 opacity-30" />
            <p>Sin metas para este período</p>
          </div>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold">Nueva meta — {MESES[mes-1]} {anio}</h2>
              <button onClick={() => { setModal(false); reset(); }}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit(d => crear.mutate(d))} className="space-y-4">
              <div>
                <label className="label">Tipo de meta *</label>
                <select className={`input ${errors.tipo ? 'border-red-400' : ''}`} {...register('tipo', { required: 'Campo requerido' })}>
                  <option value="">Seleccionar...</option>
                  {['Ingresos totales','Órdenes completadas','Cotizaciones aprobadas','Clientes nuevos','Repuestos vendidos'].map(t => <option key={t}>{t}</option>)}
                </select>
                {errors.tipo && <p className="text-red-500 text-xs mt-1">{errors.tipo.message as string}</p>}
              </div>
              <div>
                <label className="label">Empleado (opcional)</label>
                <select className="input" {...register('empleadoId')}>
                  <option value="">General (todo el taller)</option>
                  {(empleados as any[]).map((e: any) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                </select>
              </div>
              <div><label className="label">Valor de la meta *</label><input type="number" step="0.01" className={`input ${errors.metaValor ? 'border-red-400' : ''}`} {...register('metaValor', { required: 'Campo requerido' })} />{errors.metaValor && <p className="text-red-500 text-xs mt-1">{errors.metaValor.message as string}</p>}</div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setModal(false); reset(); }} className="btn-secondary flex-1">Cancelar</button>
                <button type="submit" className="btn-primary flex-1">Crear meta</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
