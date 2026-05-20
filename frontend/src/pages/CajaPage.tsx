import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Plus, X, TrendingUp, TrendingDown, DollarSign, Trash2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import api from '../services/api';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useConfig, formatMonto } from '../hooks/useConfig';

export default function CajaPage() {
  const qc = useQueryClient();
  const config = useConfig();
  const [modal, setModal] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState('');
  const { register, handleSubmit, reset, formState: { errors } } = useForm<any>();

  const { data = { movimientos: [], totalIngresos: 0, totalEgresos: 0, saldo: 0 } } = useQuery({
    queryKey: ['caja', filtroTipo],
    queryFn: () => api.get('/caja', { params: filtroTipo ? { tipo: filtroTipo } : {} }).then(r => r.data),
  });

  const { data: resumen = [] } = useQuery({
    queryKey: ['caja-resumen'],
    queryFn: () => api.get('/caja/resumen-mensual').then(r => r.data),
  });

  const crear = useMutation({
    mutationFn: (d: any) => api.post('/caja', d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['caja'] }); qc.invalidateQueries({ queryKey: ['caja-resumen'] }); setModal(false); reset(); toast.success('Movimiento registrado'); },
    onError: () => toast.error('Error al guardar'),
  });

  const eliminar = useMutation({
    mutationFn: (id: number) => api.delete(`/caja/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['caja'] }); toast.success('Eliminado'); },
    onError: () => toast.error('Error al eliminar'),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Flujo de Caja</h1>
        <button className="btn-primary flex items-center gap-2" onClick={() => setModal(true)}>
          <Plus size={18} /> Registrar movimiento
        </button>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card flex items-center gap-4">
          <div className="bg-green-500 text-white rounded-xl p-3"><TrendingUp size={22} /></div>
          <div>
            <p className="text-sm text-gray-500">Total ingresos</p>
            <p className="text-xl font-bold text-green-600">{formatMonto(data.totalIngresos, config)}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="bg-red-500 text-white rounded-xl p-3"><TrendingDown size={22} /></div>
          <div>
            <p className="text-sm text-gray-500">Total egresos</p>
            <p className="text-xl font-bold text-red-600">{formatMonto(data.totalEgresos, config)}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className={`${Number(data.saldo) >= 0 ? 'bg-blue-500' : 'bg-orange-500'} text-white rounded-xl p-3`}>
            <DollarSign size={22} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Saldo</p>
            <p className={`text-xl font-bold ${Number(data.saldo) >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
              {formatMonto(data.saldo, config)}
            </p>
          </div>
        </div>
      </div>

      {/* Gráfico mensual */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold mb-4">Flujo mensual ({new Date().getFullYear()})</h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={resumen}>
            <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip formatter={(v) => formatMonto(Number(v), config)} />
            <Legend />
            <Bar dataKey="ingresos" name="Ingresos" fill="#10b981" radius={[4,4,0,0]} />
            <Bar dataKey="egresos" name="Egresos" fill="#ef4444" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Filtros y tabla */}
      <div className="card mb-4 flex gap-2">
        {[['', 'Todos'], ['INGRESO', 'Ingresos'], ['EGRESO', 'Egresos']].map(([val, label]) => (
          <button key={val} onClick={() => setFiltroTipo(val)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filtroTipo === val ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {label}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['Fecha', 'Tipo', 'Concepto', 'Método', 'Monto', ''].map(h => (
                <th key={h} className="text-left px-4 py-3 font-medium text-gray-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.movimientos.map((m: any) => (
              <tr key={m.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-500">{format(new Date(m.fecha), 'dd/MM/yyyy', { locale: es })}</td>
                <td className="px-4 py-3">
                  <span className={`badge ${m.tipo === 'INGRESO' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {m.tipo}
                  </span>
                </td>
                <td className="px-4 py-3">{m.concepto}</td>
                <td className="px-4 py-3 text-gray-500">{m.metodoPago}</td>
                <td className={`px-4 py-3 font-semibold ${m.tipo === 'INGRESO' ? 'text-green-600' : 'text-red-600'}`}>
                  {m.tipo === 'INGRESO' ? '+' : '-'}{formatMonto(m.monto, config)}
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => eliminar.mutate(m.id)} className="text-gray-400 hover:text-red-500 p-1">
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
            {!data.movimientos.length && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Sin movimientos registrados</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold">Nuevo movimiento</h2>
              <button onClick={() => { setModal(false); reset(); }}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit(d => crear.mutate(d))} className="space-y-4">
              <div>
                <label className="label">Tipo *</label>
                <select className={`input ${errors.tipo ? 'border-red-400' : ''}`} {...register('tipo', { required: 'Campo requerido' })}>
                  <option value="INGRESO">Ingreso</option>
                  <option value="EGRESO">Egreso</option>
                </select>
                {errors.tipo && <p className="text-red-500 text-xs mt-1">{errors.tipo.message as string}</p>}
              </div>
              <div><label className="label">Concepto *</label><input className={`input ${errors.concepto ? 'border-red-400' : ''}`} {...register('concepto', { required: 'Campo requerido' })} />{errors.concepto && <p className="text-red-500 text-xs mt-1">{errors.concepto.message as string}</p>}</div>
              <div><label className="label">Monto *</label><input type="number" step="0.01" className={`input ${errors.monto ? 'border-red-400' : ''}`} {...register('monto', { required: 'Campo requerido' })} />{errors.monto && <p className="text-red-500 text-xs mt-1">{errors.monto.message as string}</p>}</div>
              <div>
                <label className="label">Método de pago</label>
                <select className="input" {...register('metodoPago')}>
                  <option value="EFECTIVO">Efectivo</option>
                  <option value="TRANSFERENCIA">Transferencia</option>
                  <option value="TARJETA">Tarjeta</option>
                </select>
              </div>
              <div><label className="label">Referencia</label><input className="input" {...register('referencia')} /></div>
              <div><label className="label">Fecha</label><input type="date" className="input" {...register('fecha')} /></div>
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
