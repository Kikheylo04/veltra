import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { Plus, Star, Pencil, X, ToggleLeft, ToggleRight, Zap } from 'lucide-react';
import api from '../services/api';

const CATEGORIAS = ['general', 'recepcion', 'citas', 'ordenes', 'cotizaciones', 'seguimiento', 'garantia', 'mantenimiento', 'facturacion', 'marketing', 'inventario'];

const CAT_COLORS: Record<string, string> = {
  recepcion: 'bg-blue-100 text-blue-700', citas: 'bg-purple-100 text-purple-700',
  ordenes: 'bg-orange-100 text-orange-700', cotizaciones: 'bg-yellow-100 text-yellow-700',
  seguimiento: 'bg-teal-100 text-teal-700', garantia: 'bg-green-100 text-green-700',
  mantenimiento: 'bg-cyan-100 text-cyan-700', facturacion: 'bg-red-100 text-red-700',
  marketing: 'bg-pink-100 text-pink-700', inventario: 'bg-indigo-100 text-indigo-700',
  general: 'bg-gray-100 text-gray-600',
};

export default function PlantillasPage() {
  const qc = useQueryClient();
  const [cat, setCat] = useState('');
  const [modal, setModal] = useState<any>(null);
  const [tabActiva, setTabActiva] = useState<'plantillas' | 'servicios'>('plantillas');

  const { data: plantillas = [] } = useQuery<any[]>({
    queryKey: ['plantillas', cat],
    queryFn: () => api.get('/plantillas', { params: cat ? { categoria: cat } : {} }).then(r => r.data),
  });

  const { data: servicios = [] } = useQuery<any[]>({
    queryKey: ['servicios-rapidos'],
    queryFn: () => api.get('/servicios-rapidos').then(r => r.data),
  });

  const { register, handleSubmit, reset, setValue } = useForm<any>();
  const { register: rSvc, handleSubmit: hSvc, reset: resetSvc } = useForm<any>();

  const crearPlantilla = useMutation({
    mutationFn: (d: any) => api.post('/plantillas', d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['plantillas'] }); toast.success('Plantilla creada'); closeModal(); },
  });

  const actualizarPlantilla = useMutation({
    mutationFn: ({ id, ...d }: any) => api.put(`/plantillas/${id}`, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['plantillas'] }); toast.success('Guardado'); closeModal(); },
  });

  const toggleFavorita = useMutation({
    mutationFn: ({ id, favorita }: any) => api.put(`/plantillas/${id}`, { favorita: !favorita }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['plantillas'] }),
  });

  const toggleActiva = useMutation({
    mutationFn: ({ id, activa }: any) => api.put(`/plantillas/${id}`, { activa: !activa }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['plantillas'] }),
  });

  const crearServicio = useMutation({
    mutationFn: (d: any) => api.post('/servicios-rapidos', d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['servicios-rapidos'] }); resetSvc(); toast.success('Servicio creado'); },
  });

  const toggleServicio = useMutation({
    mutationFn: ({ id, activo }: any) => api.put(`/servicios-rapidos/${id}`, { activo: !activo }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['servicios-rapidos'] }),
  });

  const closeModal = () => { setModal(null); reset(); };

  const abrirEditar = (p: any) => {
    setValue('nombre', p.nombre); setValue('categoria', p.categoria); setValue('contenido', p.contenido);
    setModal({ ...p, editando: true });
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Plantillas & Servicios Rápidos</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button onClick={() => setTabActiva('plantillas')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${tabActiva === 'plantillas' ? 'bg-blue-600 text-white' : 'bg-white border text-gray-600'}`}>
          Plantillas CRM
        </button>
        <button onClick={() => setTabActiva('servicios')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${tabActiva === 'servicios' ? 'bg-blue-600 text-white' : 'bg-white border text-gray-600'}`}>
          Servicios Rápidos
        </button>
      </div>

      {tabActiva === 'plantillas' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => setCat('')} className={`px-3 py-1 rounded-lg text-xs font-medium ${!cat ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>Todas</button>
              {CATEGORIAS.map(c => (
                <button key={c} onClick={() => setCat(c)} className={`px-3 py-1 rounded-lg text-xs font-medium capitalize ${cat === c ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>{c}</button>
              ))}
            </div>
            <button onClick={() => { reset({ categoria: 'general' }); setModal({ nuevo: true }); }} className="btn btn-primary flex items-center gap-2 text-sm">
              <Plus size={15} /> Nueva
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(plantillas as any[]).map(p => (
              <div key={p.id} className={`card border ${!p.activa ? 'opacity-50' : ''}`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`badge text-xs ${CAT_COLORS[p.categoria] || CAT_COLORS.general}`}>{p.categoria}</span>
                    {p.favorita && <Star size={14} className="text-yellow-500 fill-yellow-500" />}
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => toggleFavorita.mutate(p)} className="p-1 text-gray-400 hover:text-yellow-500">
                      <Star size={14} className={p.favorita ? 'fill-yellow-400 text-yellow-400' : ''} />
                    </button>
                    <button onClick={() => abrirEditar(p)} className="p-1 text-gray-400 hover:text-blue-600">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => toggleActiva.mutate(p)} className="p-1 text-gray-400 hover:text-gray-700">
                      {p.activa ? <ToggleRight size={16} className="text-green-500" /> : <ToggleLeft size={16} />}
                    </button>
                  </div>
                </div>
                <p className="font-medium text-sm text-gray-900 mb-1">{p.nombre}</p>
                <p className="text-xs text-gray-500 line-clamp-3">{p.contenido}</p>
                <p className="text-xs text-gray-400 mt-2">{p.usos} usos</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {tabActiva === 'servicios' && (
        <div>
          <form onSubmit={hSvc(d => crearServicio.mutate(d))} className="card flex gap-3 items-end mb-6">
            <div className="flex-1">
              <label className="label">Nombre del servicio</label>
              <input className="input" placeholder="Ej: Cambio de aceite" {...rSvc('nombre', { required: true })} />
            </div>
            <div className="w-32">
              <label className="label">Precio</label>
              <input type="number" step="0.01" className="input" placeholder="$0.00" {...rSvc('precio')} />
            </div>
            <button type="submit" className="btn btn-primary flex items-center gap-2">
              <Plus size={15} /> Agregar
            </button>
          </form>

          <div className="card overflow-hidden p-0">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {['Servicio', 'Precio', 'Usos', 'Estado', ''].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(servicios as any[]).map(s => (
                  <tr key={s.id} className={`hover:bg-gray-50 ${!s.activo ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-3 font-medium flex items-center gap-2">
                      <Zap size={14} className="text-yellow-500" /> {s.nombre}
                    </td>
                    <td className="px-4 py-3">${Number(s.precio).toFixed(2)}</td>
                    <td className="px-4 py-3 text-gray-500">{s.usos}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${s.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {s.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleServicio.mutate(s)} className="text-xs text-gray-500 hover:text-blue-600">
                        {s.activo ? 'Desactivar' : 'Activar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal plantilla */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="font-semibold">{modal.editando ? 'Editar plantilla' : 'Nueva plantilla'}</h2>
              <button onClick={closeModal}><X size={18} className="text-gray-400" /></button>
            </div>
            <form onSubmit={handleSubmit(d => modal.editando ? actualizarPlantilla.mutate({ id: modal.id, ...d }) : crearPlantilla.mutate(d))} className="p-5 space-y-4">
              <div>
                <label className="label">Nombre</label>
                <input className="input" {...register('nombre', { required: true })} />
              </div>
              <div>
                <label className="label">Categoría</label>
                <select className="input" {...register('categoria')}>
                  {CATEGORIAS.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Contenido</label>
                <textarea className="input" rows={5} {...register('contenido', { required: true })} />
                <p className="text-xs text-gray-400 mt-1">Variables: {'{nombre}'} {'{vehiculo}'} {'{fecha}'} {'{monto}'} {'{taller}'}</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal} className="btn btn-secondary flex-1">Cancelar</button>
                <button type="submit" className="btn btn-primary flex-1">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
