import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Plus, X, Send, MessageSquare, Phone, Zap } from 'lucide-react';
import api from '../services/api';

const ESTADOS = ['NUEVO','CONTACTADO','CALIFICADO','COTIZACION','NEGOCIACION','GANADO','PERDIDO','SIN_RESPONDER'];
const ESTADO_COLOR: Record<string,string> = {
  NUEVO:'bg-blue-500', CONTACTADO:'bg-cyan-500', CALIFICADO:'bg-purple-500',
  COTIZACION:'bg-yellow-500', NEGOCIACION:'bg-orange-500', GANADO:'bg-green-500',
  PERDIDO:'bg-red-500', SIN_RESPONDER:'bg-gray-500',
};
const ESTADO_LABEL: Record<string,string> = {
  NUEVO:'Nuevo', CONTACTADO:'Contactado', CALIFICADO:'Calificado',
  COTIZACION:'Cotización', NEGOCIACION:'Negociación', GANADO:'Ganado',
  PERDIDO:'Perdido', SIN_RESPONDER:'Sin responder',
};

export default function CRMPage() {
  const qc = useQueryClient();
  const [modalNuevo, setModalNuevo] = useState(false);
  const [leadActivo, setLeadActivo] = useState<any>(null);
  const [mensaje, setMensaje] = useState('');
  const { register, handleSubmit, reset, formState: { errors } } = useForm<any>();

  const { data: pipeline = [] } = useQuery({
    queryKey: ['pipeline'],
    queryFn: () => api.get('/leads/pipeline').then(r => r.data),
    refetchInterval: 30000,
  });

  const { data: leadDetalle } = useQuery({
    queryKey: ['lead', leadActivo?.id],
    queryFn: () => api.get(`/leads/${leadActivo.id}`).then(r => r.data),
    enabled: !!leadActivo,
  });

  const { data: plantillas = [] } = useQuery({
    queryKey: ['plantillas'],
    queryFn: () => api.get('/plantillas').then(r => r.data),
  });

  const { data: serviciosRapidos = [] } = useQuery({
    queryKey: ['servicios-rapidos'],
    queryFn: () => api.get('/servicios-rapidos').then(r => r.data),
  });

  const crearLead = useMutation({
    mutationFn: (d: any) => api.post('/leads', d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pipeline'] }); setModalNuevo(false); reset(); toast.success('Lead creado'); },
  });

  const cambiarEstado = useMutation({
    mutationFn: ({ id, estado }: any) => api.put(`/leads/${id}`, { estado }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pipeline'] }),
    onError: () => toast.error('Error al actualizar'),
  });

  const enviarMensaje = useMutation({
    mutationFn: () => api.post(`/leads/${leadActivo.id}/mensajes`, { contenido: mensaje, entrante: false }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['lead', leadActivo?.id] }); setMensaje(''); },
  });

  const usarPlantilla = async (plantilla: any) => {
    await api.post(`/plantillas/${plantilla.id}/uso`);
    setMensaje(plantilla.contenido
      .replace('{nombre}', leadDetalle?.nombre || '')
      .replace('{taller}', 'Veltra')
      .replace('{asesor}', 'Asesor')
    );
  };

  const usarServicioRapido = async (servicio: any) => {
    await api.post(`/servicios-rapidos/${servicio.id}/uso`);
    setMensaje(`Servicio: ${servicio.nombre} — $${Number(servicio.precio).toFixed(2)}`);
  };

  const abrirWhatsApp = (telefono: string) => {
    const numero = telefono.replace(/\D/g, '');
    const texto = encodeURIComponent(`Hola, te contactamos desde Veltra Taller Mecánico.`);
    window.open(`https://wa.me/${numero}?text=${texto}`, '_blank');
  };

  const totalLeads = pipeline.reduce((s: number, c: any) => s + c.cantidad, 0);
  const totalValor = pipeline.reduce((s: number, c: any) => s + c.valorTotal, 0);
  const sinResponder = pipeline.find((c: any) => c.estado === 'SIN_RESPONDER')?.cantidad || 0;

  return (
    <div className="h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">CRM / Pipeline</h1>
          <p className="text-sm text-gray-500 mt-1">{totalLeads} leads · ${totalValor.toFixed(0)} en pipeline {sinResponder > 0 && <span className="text-red-500 font-semibold">· {sinResponder} sin responder</span>}</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => setModalNuevo(true)}>
          <Plus size={18} /> Nuevo lead
        </button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {pipeline.map((col: any) => (
          <div key={col.estado} className="flex-shrink-0 w-64">
            <div className={`${ESTADO_COLOR[col.estado]} text-white rounded-t-lg px-3 py-2 flex items-center justify-between`}>
              <span className="text-sm font-semibold">{ESTADO_LABEL[col.estado]}</span>
              <span className="bg-white/20 rounded-full px-2 text-xs">{col.cantidad}</span>
            </div>
            <div className="bg-gray-100 rounded-b-lg p-2 space-y-2 min-h-32 max-h-[60vh] overflow-y-auto">
              {col.leads.map((lead: any) => (
                <div
                  key={lead.id}
                  onClick={() => setLeadActivo(lead)}
                  className="bg-white rounded-lg p-3 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                >
                  <p className="font-medium text-sm">{lead.nombre}</p>
                  {lead.telefono && <p className="text-xs text-gray-400">{lead.telefono}</p>}
                  {lead.valorEstimado && <p className="text-xs text-green-600 font-medium mt-1">${Number(lead.valorEstimado).toFixed(0)}</p>}
                  {lead.asesor && <p className="text-xs text-gray-400 mt-1">→ {lead.asesor.nombre}</p>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Panel lead activo */}
      {leadActivo && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl h-[85vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <p className="font-bold text-lg">{leadActivo.nombre}</p>
                <p className="text-sm text-gray-500">{leadActivo.telefono} · {leadActivo.correo}</p>
              </div>
              <div className="flex items-center gap-2">
                {leadActivo.telefono && (
                  <button
                    onClick={() => abrirWhatsApp(leadActivo.telefono)}
                    className="flex items-center gap-1 bg-green-500 hover:bg-green-600 text-white text-xs px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Phone size={14} /> WhatsApp
                  </button>
                )}
                <select
                  className="input text-sm py-1"
                  value={leadDetalle?.estado || leadActivo.estado}
                  onChange={(e) => cambiarEstado.mutate({ id: leadActivo.id, estado: e.target.value })}
                >
                  {ESTADOS.map(e => <option key={e} value={e}>{ESTADO_LABEL[e]}</option>)}
                </select>
                <button onClick={() => setLeadActivo(null)}><X size={20} /></button>
              </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
              {/* Chat */}
              <div className="flex-1 flex flex-col" style={{ background: '#e5ddd5' }}>
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {leadDetalle?.mensajes?.map((m: any) => (
                    <div key={m.id} className={`flex ${m.entrante ? 'justify-start' : 'justify-end'}`}>
                      <div
                        className={`max-w-xs px-3 py-2 rounded-lg text-sm shadow-sm ${
                          m.entrante ? 'bg-white text-gray-800' : 'text-gray-800'
                        }`}
                        style={!m.entrante ? { background: '#dcf8c6' } : {}}
                      >
                        {m.contenido}
                        <p className="text-xs text-gray-400 mt-1 text-right">
                          {new Date(m.createdAt).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}
                  {!leadDetalle?.mensajes?.length && (
                    <div className="text-center text-gray-400 mt-10">
                      <MessageSquare size={40} className="mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Sin mensajes aún</p>
                    </div>
                  )}
                </div>
                <div className="p-3 bg-white border-t flex gap-2">
                  <input
                    className="input flex-1 text-sm"
                    placeholder="Escribe un mensaje..."
                    value={mensaje}
                    onChange={e => setMensaje(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && mensaje && enviarMensaje.mutate()}
                  />
                  <button onClick={() => mensaje && enviarMensaje.mutate()} className="btn-primary px-3">
                    <Send size={16} />
                  </button>
                </div>
              </div>

              {/* Panel derecho: Servicios rápidos + Plantillas */}
              <div className="w-64 border-l flex flex-col overflow-hidden">
                {/* Servicios rápidos */}
                <div className="p-3 border-b">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2 flex items-center gap-1">
                    <Zap size={11} /> Servicios rápidos
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {(serviciosRapidos as any[]).slice(0, 8).map((s: any) => (
                      <button
                        key={s.id}
                        onClick={() => usarServicioRapido(s)}
                        className="text-xs px-2 py-1 bg-orange-50 text-orange-700 border border-orange-200 rounded-full hover:bg-orange-100 transition-colors"
                      >
                        {s.nombre}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Plantillas */}
                <div className="p-3 overflow-y-auto flex-1">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Plantillas</p>
                  <div className="space-y-1">
                    {(plantillas as any[]).slice(0, 10).map((p: any) => (
                      <button
                        key={p.id}
                        onClick={() => usarPlantilla(p)}
                        className="w-full text-left text-xs p-2 rounded-lg hover:bg-blue-50 hover:text-blue-700 border border-transparent hover:border-blue-200 transition-colors"
                      >
                        <p className="font-medium">{p.nombre}</p>
                        <p className="text-gray-400 truncate">{p.contenido.substring(0, 45)}...</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal nuevo lead */}
      {modalNuevo && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold">Nuevo Lead</h2>
              <button onClick={() => { setModalNuevo(false); reset(); }}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit(d => crearLead.mutate(d))} className="space-y-4">
              <div><label className="label">Nombre *</label><input className={`input ${errors.nombre ? 'border-red-400' : ''}`} {...register('nombre', { required: 'Campo requerido' })} />{errors.nombre && <p className="text-red-500 text-xs mt-1">{errors.nombre.message}</p>}</div>
              <div><label className="label">Teléfono</label><input className="input" {...register('telefono')} /></div>
              <div><label className="label">Correo</label><input type="email" className="input" {...register('correo')} /></div>
              <div><label className="label">Origen</label>
                <select className="input" {...register('origen')}>
                  <option value="">Seleccionar...</option>
                  {['WhatsApp','Facebook','Instagram','Referido','Llamada','Visita directa','Google','Otro'].map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div><label className="label">Valor estimado ($)</label><input type="number" step="0.01" className="input" {...register('valorEstimado')} /></div>
              <div><label className="label">Notas</label><textarea className="input" rows={2} {...register('notas')} /></div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setModalNuevo(false); reset(); }} className="btn-secondary flex-1">Cancelar</button>
                <button type="submit" className="btn-primary flex-1">Crear lead</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
