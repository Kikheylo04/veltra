import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity } from 'lucide-react';
import api from '../services/api';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Pagination from '../components/ui/Pagination';
import SkeletonTable from '../components/ui/SkeletonTable';

const ACCION_BADGE: Record<string, string> = {
  CREAR_OT: 'bg-blue-100 text-blue-700',
  CAMBIAR_ESTADO: 'bg-purple-100 text-purple-700',
  GENERAR_FACTURA: 'bg-green-100 text-green-700',
  CREAR: 'bg-teal-100 text-teal-700',
  ACTUALIZAR: 'bg-yellow-100 text-yellow-700',
  ELIMINAR: 'bg-red-100 text-red-700',
};

const PAGE_SIZE = 50;

export default function LogActividadPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['logs', page],
    queryFn: () => api.get('/logs', { params: { page, limit: PAGE_SIZE } }).then(r => r.data),
    refetchInterval: 30000,
  });

  const logs: any[] = (data as any)?.data ?? [];
  const total: number = (data as any)?.total ?? 0;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Activity size={24} className="text-gray-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Log de Actividad</h1>
          <p className="text-sm text-gray-500">Registro de todas las acciones del sistema</p>
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        {isLoading ? <SkeletonTable rows={8} cols={5} /> : (
          <>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {['Fecha', 'Acción', 'Entidad', 'Detalle', 'Usuario'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map((l: any) => (
                  <tr key={l.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {format(new Date(l.createdAt), 'dd MMM yyyy HH:mm', { locale: es })}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge text-xs ${ACCION_BADGE[l.accion] || 'bg-gray-100 text-gray-600'}`}>
                        {l.accion.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {l.entidad}{l.entidadId ? ` #${l.entidadId}` : ''}
                    </td>
                    <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{l.detalle || '—'}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {l.usuarioId ? `ID ${l.usuarioId}` : 'Sistema'}
                    </td>
                  </tr>
                ))}
                {!logs.length && (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-gray-400">
                      Sin actividad registrada
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <Pagination page={page} total={total} pageSize={PAGE_SIZE} onChange={setPage} />
          </>
        )}
      </div>
    </div>
  );
}
