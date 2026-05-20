import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Wrench, CheckCircle, Eye } from 'lucide-react';
import { useAuthStore } from '../store/auth.store';
import api from '../services/api';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const ESTADO_BADGE: Record<string, string> = {
  RECIBIDO: 'bg-blue-100 text-blue-700',
  DIAGNOSTICO: 'bg-yellow-100 text-yellow-700',
  REPARACION: 'bg-purple-100 text-purple-700',
  LISTO: 'bg-green-100 text-green-700',
  ENTREGADO: 'bg-gray-100 text-gray-600',
  CANCELADO: 'bg-red-100 text-red-700',
};
const ESTADO_LABEL: Record<string, string> = {
  RECIBIDO: 'Recibido', DIAGNOSTICO: 'Diagnóstico', REPARACION: 'Reparación',
  LISTO: 'Listo', ENTREGADO: 'Entregado', CANCELADO: 'Cancelado',
};

export default function DashboardMecanicoPage() {
  const { usuario } = useAuthStore();
  const navigate = useNavigate();

  const { data: ordenesData } = useQuery({
    queryKey: ['mis-ordenes'],
    queryFn: () => api.get('/ordenes/mis-ordenes').then(r => r.data),
    refetchInterval: 30000,
  });

  const ordenes: any[] = ordenesData?.data ?? ordenesData ?? [];
  const abiertas = ordenes.filter(o => !['ENTREGADO', 'CANCELADO'].includes(o.estado));
  const enReparacion = ordenes.filter(o => o.estado === 'REPARACION');
  const listas = ordenes.filter(o => o.estado === 'LISTO');

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Hola, {usuario?.nombre} 👋</h1>
        <p className="text-sm text-gray-500 mt-1">{format(new Date(), "EEEE d 'de' MMMM", { locale: es })}</p>
      </div>

      {/* Métricas rápidas */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="card text-center">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-2">
            <ClipboardList size={20} className="text-blue-600" />
          </div>
          <p className="text-2xl font-bold">{abiertas.length}</p>
          <p className="text-xs text-gray-500">Órdenes activas</p>
        </div>
        <div className="card text-center">
          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-2">
            <Wrench size={20} className="text-purple-600" />
          </div>
          <p className="text-2xl font-bold">{enReparacion.length}</p>
          <p className="text-xs text-gray-500">En reparación</p>
        </div>
        <div className="card text-center">
          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-2">
            <CheckCircle size={20} className="text-green-600" />
          </div>
          <p className="text-2xl font-bold">{listas.length}</p>
          <p className="text-xs text-gray-500">Listas p/ entregar</p>
        </div>
      </div>

      {/* Mis órdenes */}
      <div className="card p-0 overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="font-semibold text-gray-900">Mis órdenes asignadas</h2>
        </div>
        {!ordenes.length ? (
          <div className="py-12 text-center text-gray-400">
            <Wrench size={36} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">No tienes órdenes asignadas</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['#', 'Vehículo', 'Problema', 'Estado', 'Ingreso', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {ordenes.map((o: any) => (
                <tr key={o.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-gray-400 text-xs">#{o.id}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{o.vehiculo?.placa}</p>
                    <p className="text-xs text-gray-400">{o.vehiculo?.marca} {o.vehiculo?.modelo}</p>
                  </td>
                  <td className="px-4 py-3 max-w-xs truncate text-gray-600">{o.descripcionProblema}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${ESTADO_BADGE[o.estado]}`}>{ESTADO_LABEL[o.estado]}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {format(new Date(o.fechaIngreso), 'dd MMM', { locale: es })}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => navigate(`/ordenes/${o.id}`)} className="text-blue-500 hover:text-blue-700 p-1">
                      <Eye size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
