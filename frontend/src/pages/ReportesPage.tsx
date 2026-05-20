import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import api from '../services/api';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Download } from 'lucide-react';
import { useConfig, formatMonto } from '../hooks/useConfig';

export default function ReportesPage() {
  const config = useConfig();
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');

  const exportarCSV = (tipo: string) => {
    const params = new URLSearchParams({ tipo, ...(desde ? { desde } : {}), ...(hasta ? { hasta } : {}) });
    const token = localStorage.getItem('taller-auth') ? JSON.parse(localStorage.getItem('taller-auth')!).state?.token : '';
    fetch(`/api/reportes/exportar?${params}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.blob())
      .then(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `${tipo}.csv`; a.click();
        URL.revokeObjectURL(url);
      });
  };

  const { data: ingresos } = useQuery({
    queryKey: ['reporte-ingresos', desde, hasta],
    queryFn: () => api.get('/reportes/ingresos', { params: { desde, hasta } }).then(r => r.data),
  });

  const { data: otEstados = [] } = useQuery({
    queryKey: ['ot-estados'],
    queryFn: () => api.get('/reportes/ot-estados').then(r => r.data),
  });

  const { data: cajaResumen = [] } = useQuery({
    queryKey: ['caja-resumen'],
    queryFn: () => api.get('/caja/resumen-mensual').then(r => r.data),
  });

  const { data: mecanicos = [] } = useQuery({
    queryKey: ['reporte-mecanicos'],
    queryFn: () => api.get('/reportes/mecanicos').then(r => r.data),
  });

  const { data: topClientes = [] } = useQuery({
    queryKey: ['reporte-top-clientes'],
    queryFn: () => api.get('/reportes/top-clientes').then(r => r.data),
  });

  const ESTADO_LABEL: Record<string, string> = {
    RECIBIDO: 'Recibido', DIAGNOSTICO: 'Diagnóstico', REPARACION: 'Reparación',
    LISTO: 'Listo', ENTREGADO: 'Entregado', CANCELADO: 'Cancelado',
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Reportes</h1>

      {/* Filtros */}
      <div className="card mb-6 flex gap-4 items-end">
        <div>
          <label className="label">Desde</label>
          <input type="date" className="input" value={desde} onChange={e => setDesde(e.target.value)} />
        </div>
        <div>
          <label className="label">Hasta</label>
          <input type="date" className="input" value={hasta} onChange={e => setHasta(e.target.value)} />
        </div>
        <div className="flex-1" />
        {ingresos && (
          <div className="text-right">
            <p className="text-sm text-gray-500">Total en período</p>
            <p className="text-2xl font-bold text-green-600">{formatMonto(ingresos.total, config)}</p>
          </div>
        )}
        <div className="flex gap-2">
          <button onClick={() => exportarCSV('facturas')} className="btn btn-secondary flex items-center gap-2 text-sm">
            <Download size={15} /> Facturas CSV
          </button>
          <button onClick={() => exportarCSV('clientes')} className="btn btn-secondary flex items-center gap-2 text-sm">
            <Download size={15} /> Clientes CSV
          </button>
          <button onClick={() => exportarCSV('stock')} className="btn btn-secondary flex items-center gap-2 text-sm">
            <Download size={15} /> Inventario CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Flujo mensual */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Ingresos vs Egresos mensual</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={cajaResumen}>
              <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => formatMonto(Number(v), config)} />
              <Legend />
              <Bar dataKey="ingresos" name="Ingresos" fill="#10b981" radius={[4,4,0,0]} />
              <Bar dataKey="egresos" name="Egresos" fill="#ef4444" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Saldo mensual */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Saldo neto mensual</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={cajaResumen}>
              <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => formatMonto(Number(v), config)} />
              <Line type="monotone" dataKey="saldo" name="Saldo" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* OT por estado */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Órdenes de trabajo por estado</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={otEstados.map((d: any) => ({ ...d, name: ESTADO_LABEL[d.estado] }))}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="cantidad" fill="#8b5cf6" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Facturas recientes */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Facturas del período</h2>
          {!ingresos?.facturas?.length ? (
            <p className="text-gray-400 text-sm">Selecciona un período para ver las facturas.</p>
          ) : (
            <div className="overflow-y-auto max-h-56">
              <table className="w-full text-sm">
                <thead><tr className="text-gray-500">{['Cliente','Fecha','Total'].map(h=><th key={h} className="text-left pb-2">{h}</th>)}</tr></thead>
                <tbody>
                  {ingresos.facturas.map((f: any) => (
                    <tr key={f.id} className="border-t">
                      <td className="py-2">{f.orden?.vehiculo?.cliente?.nombre}</td>
                      <td className="py-2 text-gray-500">{format(new Date(f.fecha), 'dd/MM/yy', { locale: es })}</td>
                      <td className="py-2 font-semibold text-green-600">{formatMonto(f.total, config)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mecánicos productivos */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Mecánicos — Este mes</h2>
          {!(mecanicos as any[]).length ? (
            <p className="text-sm text-gray-400">Sin datos este mes</p>
          ) : (
            <div className="space-y-3">
              {(mecanicos as any[]).map((m: any, i: number) => (
                <div key={m.id} className="flex items-center gap-3">
                  <span className="w-6 text-xs font-bold text-gray-400">#{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">{m.nombre}</span>
                      <span className="text-xs text-gray-500">{m.totalOrdenes} órdenes</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${Math.min(100, (m.totalOrdenes / Math.max(...(mecanicos as any[]).map((x: any) => x.totalOrdenes), 1)) * 100)}%` }} />
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{m.entregadas} entregadas · {m.activas} activas</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top clientes */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Top 10 Clientes</h2>
          {!(topClientes as any[]).length ? (
            <p className="text-sm text-gray-400">Sin datos disponibles</p>
          ) : (
            <div className="space-y-2">
              {(topClientes as any[]).map((c: any, i: number) => (
                <div key={c.id} className="flex items-center gap-3 py-1.5 border-b last:border-0">
                  <span className="w-6 text-xs font-bold text-gray-400">#{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{c.nombre}</p>
                    <p className="text-xs text-gray-400">{c.totalOrdenes} visitas · {c.vehiculos} vehículo{c.vehiculos !== 1 ? 's' : ''}</p>
                  </div>
                  <span className="text-sm font-semibold text-green-600 flex-shrink-0">{formatMonto(c.totalGastado, config)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
