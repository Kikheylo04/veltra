import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import {
  ClipboardList, Users, DollarSign, AlertTriangle,
  Calendar, MessageSquare, Wrench, FileText, ChevronRight,
} from 'lucide-react';
import { reporteApi } from '../services/api';
import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { useConfig, formatMonto } from '../hooks/useConfig';

const ESTADO_COLORS: Record<string, string> = {
  RECIBIDO: '#3b82f6', DIAGNOSTICO: '#f59e0b', REPARACION: '#8b5cf6',
  LISTO: '#10b981', ENTREGADO: '#6b7280', CANCELADO: '#ef4444',
};
const ESTADO_LABEL: Record<string, string> = {
  RECIBIDO: 'Recibido', DIAGNOSTICO: 'Diagnóstico', REPARACION: 'Reparación',
  LISTO: 'Listo', ENTREGADO: 'Entregado', CANCELADO: 'Cancelado',
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const config = useConfig();

  const { data: dash } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => reporteApi.dashboard().then((r) => r.data),
    refetchInterval: 60000,
  });

  const { data: otEstados = [] } = useQuery<{ estado: string; cantidad: number }[]>({
    queryKey: ['ot-estados'],
    queryFn: () => reporteApi.otEstados().then((r) => r.data),
  });

  const metrics = [
    { label: 'OT Abiertas', value: dash?.totalOTAbiertas ?? '-', icon: ClipboardList, color: 'bg-blue-500', to: '/ordenes' },
    { label: 'OT este mes', value: dash?.totalOTMes ?? '-', icon: ClipboardList, color: 'bg-purple-500', to: '/ordenes' },
    { label: 'Ingresos del mes', value: dash ? formatMonto(dash.ingresosMes, config) : '-', icon: DollarSign, color: 'bg-green-500', to: '/caja' },
    { label: 'Total clientes', value: dash?.clientesTotal ?? '-', icon: Users, color: 'bg-orange-500', to: '/clientes' },
  ];

  const alertas = [
    dash?.leadssinResponder > 0 && {
      icon: MessageSquare, color: 'text-red-600 bg-red-50 border-red-200',
      texto: `${dash.leadssinResponder} lead${dash.leadssinResponder > 1 ? 's' : ''} sin responder`,
      to: '/crm',
    },
    dash?.citasHoy > 0 && {
      icon: Calendar, color: 'text-blue-600 bg-blue-50 border-blue-200',
      texto: `${dash.citasHoy} cita${dash.citasHoy > 1 ? 's' : ''} programada${dash.citasHoy > 1 ? 's' : ''} hoy`,
      to: '/citas',
    },
    dash?.cotizacionesPendientes > 0 && {
      icon: FileText, color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
      texto: `${dash.cotizacionesPendientes} cotización${dash.cotizacionesPendientes > 1 ? 'es' : ''} pendiente${dash.cotizacionesPendientes > 1 ? 's' : ''}`,
      to: '/cotizaciones',
    },
  ].filter(Boolean) as any[];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-400">{format(new Date(), "EEEE d 'de' MMMM yyyy", { locale: es })}</p>
      </div>

      {/* Alertas */}
      {alertas.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          {alertas.map(({ icon: Icon, color, texto, to }) => (
            <button key={texto} onClick={() => navigate(to)}
              className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-opacity hover:opacity-80 ${color}`}>
              <Icon size={18} className="flex-shrink-0" />
              <span className="text-sm font-medium">{texto}</span>
              <ChevronRight size={16} className="ml-auto flex-shrink-0" />
            </button>
          ))}
        </div>
      )}

      {/* Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {metrics.map(({ label, value, icon: Icon, color, to }) => (
          <button key={label} onClick={() => navigate(to)} className="card flex items-center gap-4 text-left hover:shadow-md transition-shadow w-full">
            <div className={`${color} text-white rounded-xl p-3`}>
              <Icon size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">{label}</p>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico OT */}
        <div className="card lg:col-span-2">
          <h2 className="text-lg font-semibold mb-4">Órdenes por Estado</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={otEstados.map((d) => ({ ...d, name: ESTADO_LABEL[d.estado] }))}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="cantidad" radius={[6, 6, 0, 0]}>
                {otEstados.map((d) => (
                  <Cell key={d.estado} fill={ESTADO_COLORS[d.estado]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Panel derecho */}
        <div className="space-y-4">
          {/* Repuestos bajo stock */}
          <div className="card">
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-2 text-amber-600">
              <AlertTriangle size={16} /> Stock bajo
            </h2>
            {!dash?.repuestosBajoStock?.length ? (
              <p className="text-gray-400 text-xs">Inventario en buen nivel.</p>
            ) : (
              <div className="space-y-2">
                {dash.repuestosBajoStock.slice(0, 4).map((r: any) => (
                  <div key={r.id} className="flex items-center justify-between text-sm">
                    <span className="truncate text-gray-700">{r.nombre}</span>
                    <span className="badge bg-red-100 text-red-700 ml-2 flex-shrink-0">{r.stock}</span>
                  </div>
                ))}
                {dash.repuestosBajoStock.length > 4 && (
                  <button onClick={() => navigate('/repuestos')} className="text-xs text-blue-600 hover:underline">
                    +{dash.repuestosBajoStock.length - 4} más
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Mantenimientos próximos */}
          <div className="card">
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-2 text-blue-600">
              <Wrench size={16} /> Mantenimientos próximos
            </h2>
            {!dash?.mantenimientosProximos?.length ? (
              <p className="text-gray-400 text-xs">Sin mantenimientos en los próximos 30 días.</p>
            ) : (
              <div className="space-y-2">
                {dash.mantenimientosProximos.map((m: any) => {
                  const dias = differenceInDays(new Date(m.fechaProximo), new Date());
                  return (
                    <div key={m.id} className="text-sm">
                      <p className="font-medium truncate">{m.vehiculo?.placa} · {m.tipo}</p>
                      <p className="text-xs text-gray-400">{m.vehiculo?.cliente?.nombre}</p>
                      <span className={`text-xs font-medium ${dias <= 7 ? 'text-red-600' : 'text-yellow-600'}`}>
                        {dias === 0 ? 'Hoy' : `En ${dias} días`}
                      </span>
                    </div>
                  );
                })}
                <button onClick={() => navigate('/mantenimientos')} className="text-xs text-blue-600 hover:underline">
                  Ver todos
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
