import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { ArrowLeft, Plus, Trash2, FileText, ChevronRight, ShieldCheck, History, Pencil, Check, X as XIcon } from 'lucide-react';
import { ordenApi, repuestoApi, facturaApi, garantiaApi, empleadoApi } from '../services/api';
import { OrdenTrabajo, Repuesto, EstadoOT, Empleado } from '../types/index';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useConfig, formatMonto } from '../hooks/useConfig';

const ESTADOS: EstadoOT[] = ['RECIBIDO', 'DIAGNOSTICO', 'REPARACION', 'LISTO', 'ENTREGADO', 'CANCELADO'];
const ESTADO_LABEL: Record<EstadoOT, string> = {
  RECIBIDO: 'Recibido', DIAGNOSTICO: 'Diagnóstico', REPARACION: 'Reparación',
  LISTO: 'Listo', ENTREGADO: 'Entregado', CANCELADO: 'Cancelado',
};

export default function OrdenDetallePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const config = useConfig();
  const [tabServicio, setTabServicio] = useState(true);
  const [editandoInfo, setEditandoInfo] = useState(false);
  const { register: rSvc, handleSubmit: hSvc, reset: resetSvc } = useForm<any>();
  const { register: rRep, handleSubmit: hRep, reset: resetRep } = useForm<any>();
  const { register: rGar, handleSubmit: hGar, reset: resetGar } = useForm<any>();
  const { register: rInfo, handleSubmit: hInfo, reset: resetInfo } = useForm<any>();

  const { data: orden, isLoading } = useQuery<OrdenTrabajo>({
    queryKey: ['orden', id],
    queryFn: () => ordenApi.getById(Number(id)).then((r) => r.data),
  });

  const { data: repuestos = [] } = useQuery<Repuesto[]>({
    queryKey: ['repuestos'],
    queryFn: () => repuestoApi.getAll().then((r) => r.data),
  });

  const { data: empleados = [] } = useQuery<Empleado[]>({
    queryKey: ['empleados'],
    queryFn: () => empleadoApi.getAll().then((r) => r.data),
  });

  const actualizarInfo = useMutation({
    mutationFn: (d: any) => ordenApi.update(Number(id), d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['orden', id] }); setEditandoInfo(false); toast.success('Orden actualizada'); },
    onError: () => toast.error('Error al actualizar'),
  });

  const { data: garantia } = useQuery({
    queryKey: ['garantia', id],
    queryFn: () => garantiaApi.getByOrden(Number(id)).then((r) => r.data),
  });

  const crearGarantia = useMutation({
    mutationFn: (d: any) => garantiaApi.create({ ...d, ordenId: Number(id) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['garantia', id] }); resetGar(); toast.success('Garantía registrada'); },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Error'),
  });

  const cambiarEstado = useMutation({
    mutationFn: (estado: EstadoOT) => ordenApi.cambiarEstado(Number(id), estado),
    onSuccess: (_, estado) => {
      qc.invalidateQueries({ queryKey: ['orden', id] });
      toast.success(`Orden pasó a ${ESTADO_LABEL[estado]}`);
    },
  });

  const addSvc = useMutation({
    mutationFn: (d: any) => ordenApi.addServicio(Number(id), d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['orden', id] }); resetSvc(); toast.success('Servicio agregado'); },
  });

  const delSvc = useMutation({
    mutationFn: (svcId: number) => ordenApi.removeServicio(Number(id), svcId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['orden', id] }); toast.success('Eliminado'); },
  });

  const addRep = useMutation({
    mutationFn: (d: any) => ordenApi.addRepuesto(Number(id), d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['orden', id] }); resetRep(); toast.success('Repuesto agregado'); },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Error'),
  });

  const delRep = useMutation({
    mutationFn: (repId: number) => ordenApi.removeRepuesto(Number(id), repId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['orden', id] }); },
  });

  const generarFactura = useMutation({
    mutationFn: () => facturaApi.generar(Number(id), { metodoPago: 'EFECTIVO', impuestoPct: 0 }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['orden', id] }); toast.success('Factura generada'); },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Error'),
  });

  const exportarPDF = () => {
    if (!orden) return;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Orden de Trabajo #${orden.id}`, 14, 20);
    doc.setFontSize(11);
    doc.text(`Vehículo: ${orden.vehiculo?.placa} — ${orden.vehiculo?.marca} ${orden.vehiculo?.modelo}`, 14, 30);
    doc.text(`Cliente: ${orden.vehiculo?.cliente?.nombre}`, 14, 37);
    doc.text(`Estado: ${ESTADO_LABEL[orden.estado]}`, 14, 44);
    doc.text(`Ingreso: ${format(new Date(orden.fechaIngreso), 'dd/MM/yyyy', { locale: es })}`, 14, 51);

    if (orden.servicios?.length) {
      autoTable(doc, {
        startY: 60,
        head: [['Servicio / Mano de obra', 'Costo']],
        body: orden.servicios.map((s) => [s.descripcion, formatMonto(s.costoManoObra, config)]),
      });
    }
    if (orden.repuestos?.length) {
      autoTable(doc, {
        head: [['Repuesto', 'Cant.', 'Precio unit.', 'Subtotal']],
        body: orden.repuestos.map((r) => [
          r.repuesto?.nombre, r.cantidad,
          formatMonto(r.precioUnitario, config),
          formatMonto(r.cantidad * Number(r.precioUnitario), config),
        ]),
      });
    }
    doc.save(`OT-${orden.id}.pdf`);
  };

  if (isLoading) return <div className="text-center py-20 text-gray-400">Cargando...</div>;
  if (!orden) return <div className="text-center py-20 text-gray-400">Orden no encontrada</div>;

  const totalServicios = orden.servicios?.reduce((s, sv) => s + Number(sv.costoManoObra), 0) ?? 0;
  const totalRepuestos = orden.repuestos?.reduce((s, r) => s + r.cantidad * Number(r.precioUnitario), 0) ?? 0;
  const total = totalServicios + totalRepuestos;

  const idxEstado = ESTADOS.indexOf(orden.estado);

  return (
    <div>
      <button onClick={() => navigate('/ordenes')} className="flex items-center gap-1 text-gray-500 hover:text-gray-800 mb-5 text-sm">
        <ArrowLeft size={16} /> Volver a órdenes
      </button>

      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Orden #{orden.id}</h1>
          <p className="text-gray-500 mt-1">{orden.vehiculo?.placa} — {orden.vehiculo?.marca} {orden.vehiculo?.modelo} · {orden.vehiculo?.cliente?.nombre}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportarPDF} className="btn-secondary flex items-center gap-2 text-sm">
            <FileText size={16} /> Exportar PDF
          </button>
          {!orden.factura && orden.estado !== 'CANCELADO' && (
            <button onClick={() => generarFactura.mutate()} className="btn-primary flex items-center gap-2 text-sm">
              <FileText size={16} /> Generar factura
            </button>
          )}
        </div>
      </div>

      {/* Flujo de estados */}
      <div className="card mb-6">
        <p className="text-sm font-medium text-gray-500 mb-3">Estado de la orden</p>
        <div className="flex items-center gap-1 flex-wrap">
          {ESTADOS.filter(e => e !== 'CANCELADO').map((e, i) => (
            <div key={e} className="flex items-center gap-1">
              <button
                onClick={() => i > idxEstado && cambiarEstado.mutate(e)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  orden.estado === e
                    ? 'bg-blue-600 text-white'
                    : i < idxEstado
                    ? 'bg-gray-100 text-gray-400'
                    : 'bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-600 cursor-pointer'
                }`}
              >
                {ESTADO_LABEL[e]}
              </button>
              {i < 4 && <ChevronRight size={14} className="text-gray-300" />}
            </div>
          ))}
          {orden.estado !== 'CANCELADO' && orden.estado !== 'ENTREGADO' && (
            <button onClick={() => cambiarEstado.mutate('CANCELADO')} className="ml-2 text-sm text-red-500 hover:text-red-700">
              Cancelar
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Servicios y repuestos */}
        <div className="lg:col-span-2 space-y-5">
          {/* Tabs */}
          <div className="flex gap-2">
            <button onClick={() => setTabServicio(true)} className={`px-4 py-2 rounded-lg text-sm font-medium ${tabServicio ? 'bg-blue-600 text-white' : 'bg-white border text-gray-600'}`}>
              Servicios / Mano de obra
            </button>
            <button onClick={() => setTabServicio(false)} className={`px-4 py-2 rounded-lg text-sm font-medium ${!tabServicio ? 'bg-blue-600 text-white' : 'bg-white border text-gray-600'}`}>
              Repuestos
            </button>
          </div>

          {tabServicio ? (
            <div className="card">
              <form onSubmit={hSvc((d) => addSvc.mutate(d))} className="flex gap-2 mb-4">
                <input className="input flex-1" placeholder="Descripción del servicio" {...rSvc('descripcion', { required: true })} />
                <input type="number" step="0.01" className="input w-28" placeholder="$0.00" {...rSvc('costoManoObra')} />
                <button type="submit" className="btn-primary px-3"><Plus size={18} /></button>
              </form>
              <div className="space-y-2">
                {orden.servicios?.map((s) => (
                  <div key={s.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <span className="text-sm">{s.descripcion}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">{formatMonto(s.costoManoObra, config)}</span>
                      <button onClick={() => delSvc.mutate(s.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
                {!orden.servicios?.length && <p className="text-sm text-gray-400">Sin servicios registrados</p>}
              </div>
            </div>
          ) : (
            <div className="card">
              <form onSubmit={hRep((d) => addRep.mutate(d))} className="flex gap-2 mb-4">
                <select className="input flex-1" {...rRep('repuestoId', { required: true })}>
                  <option value="">Seleccionar repuesto...</option>
                  {repuestos.map((r) => <option key={r.id} value={r.id}>{r.nombre} (stock: {r.stock})</option>)}
                </select>
                <input type="number" min={1} className="input w-20" placeholder="Cant." {...rRep('cantidad', { required: true })} />
                <button type="submit" className="btn-primary px-3"><Plus size={18} /></button>
              </form>
              <div className="space-y-2">
                {orden.repuestos?.map((r) => (
                  <div key={r.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="text-sm font-medium">{r.repuesto?.nombre}</p>
                      <p className="text-xs text-gray-400">x{r.cantidad} × {formatMonto(r.precioUnitario, config)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">{formatMonto(r.cantidad * Number(r.precioUnitario), config)}</span>
                      <button onClick={() => delRep.mutate(r.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
                {!orden.repuestos?.length && <p className="text-sm text-gray-400">Sin repuestos registrados</p>}
              </div>
            </div>
          )}
        </div>

        {/* Panel lateral */}
        <div className="space-y-5">
          <div className="card">
            <h3 className="font-semibold mb-3">Resumen</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Mano de obra</span><span>{formatMonto(totalServicios, config)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Repuestos</span><span>{formatMonto(totalRepuestos, config)}</span></div>
              <div className="border-t pt-2 flex justify-between font-bold"><span>Total</span><span>{formatMonto(total, config)}</span></div>
            </div>
            {orden.factura && (
              <div className="mt-3 p-2 bg-green-50 rounded-lg text-xs text-green-700 font-medium">
                Factura #{orden.factura.id} generada — {orden.factura.pagado ? 'Pagada' : 'Pendiente'}
              </div>
            )}
          </div>

          {/* Garantía */}
          <div className="card">
            <h3 className="font-semibold mb-3 flex items-center gap-2 text-green-700"><ShieldCheck size={16} /> Garantía</h3>
            {garantia ? (
              <div className="text-sm space-y-1">
                <p className="font-medium">{garantia.descripcion}</p>
                <p className="text-gray-500">Válida hasta: <span className="font-medium text-gray-800">{format(new Date(garantia.fechaFin), 'dd/MM/yyyy', { locale: es })}</span></p>
                {garantia.kmGarantia && <p className="text-gray-500">Km garantía: {garantia.kmGarantia.toLocaleString()} km</p>}
              </div>
            ) : (
              <form onSubmit={hGar((d) => crearGarantia.mutate(d))} className="space-y-3">
                <input className="input w-full" placeholder="Descripción de la garantía" {...rGar('descripcion', { required: true })} />
                <div className="flex gap-2">
                  <input type="number" className="input flex-1" placeholder="Días (default 30)" {...rGar('diasGarantia')} />
                  <input type="number" className="input flex-1" placeholder="Km (opcional)" {...rGar('kmGarantia')} />
                </div>
                <button type="submit" disabled={crearGarantia.isPending} className="btn btn-primary w-full text-sm">
                  {crearGarantia.isPending ? 'Registrando...' : 'Registrar garantía'}
                </button>
              </form>
            )}
          </div>

          <div className="card text-sm space-y-2">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Información</h3>
              {!editandoInfo ? (
                <button onClick={() => { setEditandoInfo(true); resetInfo({ empleadoId: orden.empleadoId ?? '', fechaEntregaEst: orden.fechaEntregaEst ? orden.fechaEntregaEst.slice(0,10) : '', observaciones: orden.observaciones ?? '' }); }}
                  className="text-gray-400 hover:text-blue-600"><Pencil size={14} /></button>
              ) : (
                <button onClick={() => setEditandoInfo(false)} className="text-gray-400 hover:text-red-500"><XIcon size={14} /></button>
              )}
            </div>
            {editandoInfo ? (
              <form onSubmit={hInfo(d => actualizarInfo.mutate(d))} className="space-y-3">
                <div>
                  <label className="label">Mecánico</label>
                  <select className="input" {...rInfo('empleadoId')}>
                    <option value="">Sin asignar</option>
                    {(empleados as Empleado[]).map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Entrega estimada</label>
                  <input type="date" className="input" {...rInfo('fechaEntregaEst')} />
                </div>
                <div>
                  <label className="label">Observaciones</label>
                  <textarea className="input" rows={2} {...rInfo('observaciones')} />
                </div>
                <button type="submit" disabled={actualizarInfo.isPending} className="btn btn-primary w-full flex items-center justify-center gap-1 text-sm">
                  <Check size={14} /> {actualizarInfo.isPending ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </form>
            ) : (
              <>
                <div><span className="text-gray-500">Problema:</span><p className="mt-1">{orden.descripcionProblema}</p></div>
                {orden.observaciones && <div><span className="text-gray-500">Observaciones:</span><p className="mt-1">{orden.observaciones}</p></div>}
                <div><span className="text-gray-500">Mecánico:</span> {orden.empleado?.nombre || 'Sin asignar'}</div>
                <div><span className="text-gray-500">Ingreso:</span> {format(new Date(orden.fechaIngreso), 'dd/MM/yyyy', { locale: es })}</div>
                {orden.fechaEntregaEst && <div><span className="text-gray-500">Entrega est.:</span> {format(new Date(orden.fechaEntregaEst), 'dd/MM/yyyy', { locale: es })}</div>}
              </>
            )}
          </div>

          {/* Historial de estados */}
          {Array.isArray((orden as any).historialEstados) && (orden as any).historialEstados.length > 0 && (
            <div className="card text-sm">
              <h3 className="font-semibold mb-3 flex items-center gap-2 text-gray-700"><History size={15} /> Historial</h3>
              <div className="space-y-2">
                <div className="flex gap-3 text-xs text-gray-500">
                  <span className="w-2 h-2 rounded-full bg-blue-400 mt-1 flex-shrink-0" />
                  <div>
                    <span className="font-medium">Recibido</span>
                    <span className="ml-2">{format(new Date(orden.fechaIngreso), 'dd/MM/yyyy HH:mm', { locale: es })}</span>
                  </div>
                </div>
                {(orden as any).historialEstados.map((h: any, i: number) => (
                  <div key={i} className="flex gap-3 text-xs text-gray-500">
                    <span className="w-2 h-2 rounded-full bg-blue-400 mt-1 flex-shrink-0" />
                    <div>
                      <span className="font-medium">{ESTADO_LABEL[h.estado as EstadoOT] || h.estado}</span>
                      <span className="ml-2">{format(new Date(h.fecha), 'dd/MM/yyyy HH:mm', { locale: es })}</span>
                      {h.usuario && <span className="ml-2 text-gray-400">· {h.usuario}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
