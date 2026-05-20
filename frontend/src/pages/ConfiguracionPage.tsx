import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { Settings, Save } from 'lucide-react';
import api from '../services/api';

interface ConfigForm {
  nombreTaller: string;
  slogan: string;
  telefono: string;
  direccion: string;
  email: string;
  ruc: string;
  moneda: string;
  impuestoPct: number;
  stockMinimoDefecto: number;
  diasGarantiaDefault: number;
}

const MONEDAS = [
  { code: 'USD', label: 'USD — Dólar estadounidense ($)' },
  { code: 'COP', label: 'COP — Peso colombiano ($)' },
  { code: 'MXN', label: 'MXN — Peso mexicano ($)' },
  { code: 'PEN', label: 'PEN — Sol peruano (S/)' },
  { code: 'ARS', label: 'ARS — Peso argentino ($)' },
  { code: 'BRL', label: 'BRL — Real brasileño (R$)' },
  { code: 'CLP', label: 'CLP — Peso chileno ($)' },
  { code: 'BOB', label: 'BOB — Boliviano (Bs)' },
  { code: 'GTQ', label: 'GTQ — Quetzal guatemalteco (Q)' },
  { code: 'HNL', label: 'HNL — Lempira hondureño (L)' },
  { code: 'NIO', label: 'NIO — Córdoba nicaragüense (C$)' },
  { code: 'PAB', label: 'PAB — Balboa panameño (B/.)' },
  { code: 'PYG', label: 'PYG — Guaraní paraguayo (₲)' },
  { code: 'DOP', label: 'DOP — Peso dominicano (RD$)' },
  { code: 'VES', label: 'VES — Bolívar venezolano (Bs.S)' },
  { code: 'EUR', label: 'EUR — Euro (€)' },
];

export default function ConfiguracionPage() {
  const qc = useQueryClient();
  const { data: config, isLoading } = useQuery({
    queryKey: ['config'],
    queryFn: () => api.get('/config').then((r) => r.data),
  });

  const { register, handleSubmit, reset } = useForm<ConfigForm>();

  useEffect(() => {
    if (config) reset(config);
  }, [config, reset]);

  const mutation = useMutation({
    mutationFn: (data: ConfigForm) => api.put('/config', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['config'] });
      toast.success('Configuración guardada');
    },
    onError: () => toast.error('Error al guardar'),
  });

  if (isLoading) return <div className="text-gray-400 text-sm">Cargando...</div>;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Settings size={24} className="text-gray-600" />
        <h1 className="text-2xl font-bold text-gray-900">Configuración del Taller</h1>
      </div>

      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-6 max-w-2xl">
        {/* Información general */}
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">Información General</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Nombre del taller</label>
              <input className="input" {...register('nombreTaller')} />
            </div>
            <div>
              <label className="label">Slogan</label>
              <input className="input" {...register('slogan')} />
            </div>
            <div>
              <label className="label">Teléfono</label>
              <input className="input" {...register('telefono')} />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" {...register('email')} />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Dirección</label>
              <input className="input" {...register('direccion')} />
            </div>
            <div>
              <label className="label">RUC / NIT / RFC</label>
              <input className="input" {...register('ruc')} />
            </div>
          </div>
        </div>

        {/* Moneda e impuestos */}
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">Moneda e Impuestos</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="label">Moneda</label>
              <select className="input" {...register('moneda')}>
                {MONEDAS.map((m) => (
                  <option key={m.code} value={m.code}>{m.label}</option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-1">Se usará en facturas, cotizaciones y reportes.</p>
            </div>
            <div>
              <label className="label">Impuesto / IVA (%)</label>
              <input className="input" type="number" step="0.01" min="0" max="100"
                {...register('impuestoPct', { valueAsNumber: true })} />
              <p className="text-xs text-gray-400 mt-1">Ej: 16 para 16%. Usa 0 si no aplica.</p>
            </div>
          </div>
        </div>

        {/* Parámetros operativos */}
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">Parámetros Operativos</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Stock mínimo por defecto</label>
              <input className="input" type="number" min="0"
                {...register('stockMinimoDefecto', { valueAsNumber: true })} />
            </div>
            <div>
              <label className="label">Días de garantía por defecto</label>
              <input className="input" type="number" min="0"
                {...register('diasGarantiaDefault', { valueAsNumber: true })} />
            </div>
          </div>
        </div>

        <button type="submit" disabled={mutation.isPending} className="btn btn-primary flex items-center gap-2">
          <Save size={16} />
          {mutation.isPending ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </form>
    </div>
  );
}
