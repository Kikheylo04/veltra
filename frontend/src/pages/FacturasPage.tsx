import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Eye, Download, CreditCard, X } from 'lucide-react';
import { facturaApi } from '../services/api';
import { generarFacturaPDF } from '../components/ui/FacturaPDF';
import { Factura } from '../types/index';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useConfig, formatMonto } from '../hooks/useConfig';
import Pagination from '../components/ui/Pagination';
import SkeletonTable from '../components/ui/SkeletonTable';
import toast from 'react-hot-toast';

const METODO_LABEL: Record<string, string> = { EFECTIVO: 'Efectivo', TRANSFERENCIA: 'Transferencia', TARJETA: 'Tarjeta' };
const PAGE_SIZE = 20;

export default function FacturasPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const config = useConfig();
  const [page, setPage] = useState(1);
  const [pagarModal, setPagarModal] = useState<Factura | null>(null);
  const [metodoPago, setMetodoPago] = useState('EFECTIVO');

  const { data, isLoading } = useQuery({
    queryKey: ['facturas', page],
    queryFn: () => facturaApi.getAll(page, PAGE_SIZE).then((r) => r.data),
  });
  const facturas: Factura[] = (data as any)?.data ?? [];
  const total: number = (data as any)?.total ?? 0;

  const marcarPagada = useMutation({
    mutationFn: ({ id, metodoPago }: { id: number; metodoPago: string }) =>
      facturaApi.marcarPagada(id, { metodoPago }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['facturas'] });
      toast.success('Factura marcada como pagada');
      setPagarModal(null);
    },
    onError: () => toast.error('Error al actualizar'),
  });

  const pendientes = facturas.filter(f => !f.pagado).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Facturas</h1>
          {pendientes > 0 && (
            <p className="text-sm text-yellow-600 mt-1">{pendientes} factura{pendientes > 1 ? 's' : ''} pendiente{pendientes > 1 ? 's' : ''} de pago</p>
          )}
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        {isLoading ? <SkeletonTable rows={6} cols={8} /> : (
          <>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {['#', 'Cliente / Vehículo', 'Fecha', 'Subtotal', 'Total', 'Método', 'Estado', ''].map((h) => (
                    <th key={h} className="text-left px-4 py-3 font-medium text-gray-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {facturas.map((f) => (
                  <tr key={f.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-gray-400">#{f.id}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{(f as any).orden?.vehiculo?.cliente?.nombre}</p>
                      <p className="text-xs text-gray-400">{(f as any).orden?.vehiculo?.placa} · OT#{f.ordenId}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{format(new Date(f.fecha), 'dd MMM yyyy', { locale: es })}</td>
                    <td className="px-4 py-3">{formatMonto(f.subtotal, config)}</td>
                    <td className="px-4 py-3 font-semibold">{formatMonto(f.total, config)}</td>
                    <td className="px-4 py-3">{METODO_LABEL[f.metodoPago] ?? f.metodoPago}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${f.pagado ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {f.pagado ? 'Pagada' : 'Pendiente'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 items-center">
                        {!f.pagado && (
                          <button onClick={() => { setPagarModal(f); setMetodoPago('EFECTIVO'); }}
                            className="p-1 text-yellow-600 hover:text-yellow-800" title="Registrar pago">
                            <CreditCard size={15} />
                          </button>
                        )}
                        <button onClick={() => navigate(`/ordenes/${f.ordenId}`)} className="p-1 text-gray-400 hover:text-blue-600" title="Ver OT">
                          <Eye size={15} />
                        </button>
                        <button onClick={() => generarFacturaPDF(f)} className="p-1 text-gray-400 hover:text-green-600" title="Descargar PDF">
                          <Download size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!facturas.length && (
                  <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-400">Sin facturas registradas</td></tr>
                )}
              </tbody>
            </table>
            <Pagination page={page} total={total} pageSize={PAGE_SIZE} onChange={setPage} />
          </>
        )}
      </div>

      {/* Modal pagar */}
      {pagarModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Registrar pago — Factura #{pagarModal.id}</h2>
              <button onClick={() => setPagarModal(null)}><X size={18} className="text-gray-400" /></button>
            </div>
            <p className="text-sm text-gray-500 mb-4">Total a cobrar: <span className="font-bold text-gray-900 text-lg">{formatMonto(pagarModal.total, config)}</span></p>
            <div className="mb-5">
              <label className="label">Método de pago</label>
              <select className="input" value={metodoPago} onChange={e => setMetodoPago(e.target.value)}>
                <option value="EFECTIVO">Efectivo</option>
                <option value="TRANSFERENCIA">Transferencia</option>
                <option value="TARJETA">Tarjeta</option>
              </select>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setPagarModal(null)} className="btn btn-secondary flex-1">Cancelar</button>
              <button
                onClick={() => marcarPagada.mutate({ id: pagarModal.id, metodoPago })}
                disabled={marcarPagada.isPending}
                className="btn btn-primary flex-1"
              >
                {marcarPagada.isPending ? 'Guardando...' : 'Confirmar pago'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
