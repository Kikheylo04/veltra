import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Plus, Eye, X, Trash2, ArrowRight } from 'lucide-react';
import api, { clienteApi, vehiculoApi } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useConfig, formatMonto } from '../hooks/useConfig';

const ESTADO_BADGE: Record<string, string> = {
  BORRADOR: 'bg-gray-100 text-gray-600',
  ENVIADA: 'bg-blue-100 text-blue-700',
  APROBADA: 'bg-green-100 text-green-700',
  RECHAZADA: 'bg-red-100 text-red-700',
};

export default function CotizacionesPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const config = useConfig();
  const [modal, setModal] = useState(false);
  const [detalle, setDetalle] = useState<any>(null);
  const [items, setItems] = useState([{ descripcion: '', cantidad: 1, precioUnitario: 0 }]);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<any>();

  const { data: cotizaciones = [] } = useQuery({
    queryKey: ['cotizaciones'],
    queryFn: () => api.get('/cotizaciones').then(r => r.data),
  });

  const { data: clientes = [] } = useQuery({ queryKey: ['clientes-all'], queryFn: () => clienteApi.getAll('', 1, 999).then(r => r.data?.data ?? r.data) });
  const { data: vehiculos = [] } = useQuery({ queryKey: ['vehiculos-all'], queryFn: () => vehiculoApi.getAll().then(r => r.data) });

  const crear = useMutation({
    mutationFn: (d: any) => api.post('/cotizaciones', { ...d, items }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cotizaciones'] }); setModal(false); reset(); setItems([{ descripcion: '', cantidad: 1, precioUnitario: 0 }]); toast.success('Cotización creada'); },
    onError: () => toast.error('Error al crear'),
  });

  const cambiarEstado = useMutation({
    mutationFn: ({ id, estado }: any) => api.patch(`/cotizaciones/${id}/estado`, { estado }),
    onSuccess: (_, vars) => { qc.invalidateQueries({ queryKey: ['cotizaciones'] }); if (detalle) setDetalle((d: any) => ({ ...d, estado: vars.estado })); toast.success('Estado actualizado'); },
    onError: () => toast.error('Error al actualizar'),
  });

  const convertirAOT = useMutation({
    mutationFn: (cotId: number) => api.post(`/cotizaciones/${cotId}/convertir-ot`, {}),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['cotizaciones'] });
      setDetalle(null);
      toast.success('Orden de trabajo creada');
      navigate(`/ordenes/${res.data.id}`);
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Error al convertir'),
  });

  const addItem = () => setItems(prev => [...prev, { descripcion: '', cantidad: 1, precioUnitario: 0 }]);
  const removeItem = (i: number) => setItems(prev => prev.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: string, value: any) => {
    setItems(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: value } : item));
  };

  const totalCotizacion = (cot: any) =>
    (cot.items || []).reduce((s: number, i: any) => s + Number(i.precioUnitario) * Number(i.cantidad), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Cotizaciones</h1>
        <button className="btn-primary flex items-center gap-2" onClick={() => setModal(true)}>
          <Plus size={18} /> Nueva cotización
        </button>
      </div>

      <div className="card overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['#', 'Cliente', 'Vehículo', 'Descripción', 'Total', 'Estado', 'Fecha', ''].map(h => (
                <th key={h} className="text-left px-4 py-3 font-medium text-gray-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cotizaciones.map((c: any) => (
              <tr key={c.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-gray-400">#{c.id}</td>
                <td className="px-4 py-3 font-medium">{c.cliente?.nombre}</td>
                <td className="px-4 py-3 text-gray-500">{c.vehiculo?.placa || '-'}</td>
                <td className="px-4 py-3 max-w-xs truncate">{c.descripcion}</td>
                <td className="px-4 py-3 font-semibold">{formatMonto(totalCotizacion(c), config)}</td>
                <td className="px-4 py-3"><span className={`badge ${ESTADO_BADGE[c.estado]}`}>{c.estado}</span></td>
                <td className="px-4 py-3 text-gray-500">{format(new Date(c.createdAt), 'dd/MM/yy', { locale: es })}</td>
                <td className="px-4 py-3">
                  <button onClick={() => setDetalle(c)} className="text-gray-400 hover:text-blue-600 p-1"><Eye size={15} /></button>
                </td>
              </tr>
            ))}
            {!cotizaciones.length && <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">Sin cotizaciones</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Detalle */}
      {detalle && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Cotización #{detalle.id}</h2>
              <button onClick={() => setDetalle(null)}><X size={20} /></button>
            </div>
            <div className="space-y-2 text-sm mb-4">
              <p><span className="text-gray-500">Cliente:</span> {detalle.cliente?.nombre}</p>
              <p><span className="text-gray-500">Vehículo:</span> {detalle.vehiculo?.placa || '-'}</p>
              <p><span className="text-gray-500">Descripción:</span> {detalle.descripcion}</p>
            </div>
            <table className="w-full text-sm border rounded-lg overflow-hidden mb-4">
              <thead className="bg-gray-50"><tr>{['Descripción','Cant.','P.Unit.','Subtotal'].map(h=><th key={h} className="text-left px-3 py-2 text-gray-600">{h}</th>)}</tr></thead>
              <tbody>
                {detalle.items?.map((i: any) => (
                  <tr key={i.id} className="border-t">
                    <td className="px-3 py-2">{i.descripcion}</td>
                    <td className="px-3 py-2">{i.cantidad}</td>
                    <td className="px-3 py-2">{formatMonto(i.precioUnitario, config)}</td>
                    <td className="px-3 py-2 font-medium">{formatMonto(i.cantidad * Number(i.precioUnitario), config)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 border-t">
                <tr><td colSpan={3} className="px-3 py-2 font-bold text-right">Total</td>
                  <td className="px-3 py-2 font-bold">{formatMonto(totalCotizacion(detalle), config)}</td></tr>
              </tfoot>
            </table>
            <div className="flex gap-2 mb-3">
              {['ENVIADA','APROBADA','RECHAZADA'].map(e => (
                <button key={e} onClick={() => cambiarEstado.mutate({ id: detalle.id, estado: e })}
                  className={`btn-secondary text-sm flex-1 ${detalle.estado === e ? 'ring-2 ring-blue-500' : ''}`}>
                  {e}
                </button>
              ))}
            </div>
            {detalle.vehiculoId && detalle.estado !== 'RECHAZADA' && (
              <button
                onClick={() => convertirAOT.mutate(detalle.id)}
                disabled={convertirAOT.isPending}
                className="btn-primary w-full flex items-center justify-center gap-2 text-sm"
              >
                <ArrowRight size={16} />
                {convertirAOT.isPending ? 'Creando orden...' : 'Convertir a Orden de Trabajo'}
              </button>
            )}
            {!detalle.vehiculoId && (
              <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2 text-center">
                Asigna un vehículo a esta cotización para poder convertirla en OT.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Modal crear */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold">Nueva cotización</h2>
              <button onClick={() => { setModal(false); reset(); }}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit(d => crear.mutate(d))} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Cliente *</label>
                  <select className={`input ${errors.clienteId ? 'border-red-400' : ''}`} {...register('clienteId', { required: 'Campo requerido' })}>
                    <option value="">Seleccionar...</option>
                    {(clientes as any[]).map((c: any) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                  {errors.clienteId && <p className="text-red-500 text-xs mt-1">{errors.clienteId.message as string}</p>}
                </div>
                <div>
                  <label className="label">Vehículo</label>
                  <select className="input" {...register('vehiculoId')}>
                    <option value="">Sin especificar</option>
                    {(vehiculos as any[]).map((v: any) => <option key={v.id} value={v.id}>{v.placa} — {v.marca}</option>)}
                  </select>
                </div>
              </div>
              <div><label className="label">Descripción *</label><input className={`input ${errors.descripcion ? 'border-red-400' : ''}`} {...register('descripcion', { required: 'Campo requerido' })} />{errors.descripcion && <p className="text-red-500 text-xs mt-1">{errors.descripcion.message as string}</p>}</div>
              <div><label className="label">Válida hasta</label><input type="date" className="input" {...register('validaHasta')} /></div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="label mb-0">Items</label>
                  <button type="button" onClick={addItem} className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"><Plus size={14} /> Agregar</button>
                </div>
                <div className="space-y-2">
                  {items.map((item, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <input className="input flex-1" placeholder="Descripción" value={item.descripcion} onChange={e => updateItem(i, 'descripcion', e.target.value)} />
                      <input type="number" className="input w-16" placeholder="Cant" value={item.cantidad} onChange={e => updateItem(i, 'cantidad', Number(e.target.value))} />
                      <input type="number" step="0.01" className="input w-24" placeholder="Precio" value={item.precioUnitario} onChange={e => updateItem(i, 'precioUnitario', Number(e.target.value))} />
                      {items.length > 1 && <button type="button" onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button>}
                    </div>
                  ))}
                </div>
                <p className="text-right text-sm font-semibold mt-2">
                  Total: {formatMonto(items.reduce((s, i) => s + i.cantidad * i.precioUnitario, 0), config)}
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setModal(false); reset(); }} className="btn-secondary flex-1">Cancelar</button>
                <button type="submit" className="btn-primary flex-1">Crear cotización</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
