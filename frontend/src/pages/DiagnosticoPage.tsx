import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { CheckCircle, Circle, BarChart3 } from 'lucide-react';
import api from '../services/api';

const NIVEL_COLOR: Record<string, string> = {
  'Crítico': 'text-red-600 bg-red-50 border-red-200',
  'En riesgo': 'text-orange-600 bg-orange-50 border-orange-200',
  'Superficie': 'text-yellow-600 bg-yellow-50 border-yellow-200',
  'Sin diagnosticar': 'text-gray-600 bg-gray-50 border-gray-200',
};

const CATEGORIA_LABEL: Record<string, string> = {
  comercial: 'Comercial', operacional: 'Operacional', inventario: 'Inventario',
  financiero: 'Financiero', marketing: 'Marketing', retencion: 'Retención', tecnologia: 'Tecnología',
};

export default function DiagnosticoPage() {
  const [respuestas, setRespuestas] = useState<Record<number, boolean>>({});
  const [mejoraPct, setMejoraPct] = useState(15);
  const [resultado, setResultado] = useState<any>(null);

  const { data: info } = useQuery({
    queryKey: ['diagnostico-preguntas'],
    queryFn: () => api.get('/diagnostico/preguntas').then(r => r.data),
  });

  const { data: ultimo } = useQuery({
    queryKey: ['diagnostico-ultimo'],
    queryFn: () => api.get('/diagnostico/ultimo').then(r => r.data),
  });

  const guardar = useMutation({
    mutationFn: () => api.post('/diagnostico', { respuestas, mejoraPct }),
    onSuccess: (res) => { setResultado(res.data); toast.success('Diagnóstico guardado'); },
    onError: () => toast.error('Error al guardar'),
  });

  const toggleRespuesta = (id: number) => {
    setRespuestas(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const preguntas = info?.preguntas || [];
  const categorias = [...new Set(preguntas.map((p: any) => p.categoria))];
  const respondidas = Object.values(respuestas).filter(Boolean).length;
  const puntajeActual = resultado || ultimo;

  const ingresosActuales = 10000;
  const mejora = ingresosActuales * (mejoraPct / 100);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Diagnóstico Comercial</h1>
      <p className="text-gray-500 mb-6">Evalúa el estado actual de tu taller en 14 áreas clave.</p>

      {puntajeActual && (
        <div className={`card mb-6 border-2 ${NIVEL_COLOR[puntajeActual.nivel]}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-wide">Último diagnóstico</p>
              <p className="text-3xl font-bold mt-1">{puntajeActual.porcentaje || puntajeActual.puntaje}%</p>
              <p className="text-lg font-semibold mt-1">{puntajeActual.nivel}</p>
            </div>
            <BarChart3 size={48} className="opacity-30" />
          </div>
          <div className="mt-3 bg-white/60 rounded-lg overflow-hidden h-3">
            <div
              className="h-full bg-current transition-all"
              style={{ width: `${puntajeActual.porcentaje || puntajeActual.puntaje}%` }}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          {categorias.map((cat: any) => (
            <div key={cat} className="card">
              <h3 className="font-semibold text-gray-700 mb-3">{CATEGORIA_LABEL[cat] || cat}</h3>
              <div className="space-y-3">
                {preguntas.filter((p: any) => p.categoria === cat).map((p: any) => (
                  <div
                    key={p.id}
                    onClick={() => toggleRespuesta(p.id)}
                    className="flex items-start gap-3 p-3 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    {respuestas[p.id]
                      ? <CheckCircle size={20} className="text-green-500 flex-shrink-0 mt-0.5" />
                      : <Circle size={20} className="text-gray-300 flex-shrink-0 mt-0.5" />
                    }
                    <div>
                      <p className="text-sm">{p.pregunta}</p>
                      <p className="text-xs text-gray-400 mt-0.5">Peso: {p.peso} pts</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <div className="card">
            <h3 className="font-semibold mb-3">Progreso</h3>
            <p className="text-3xl font-bold text-blue-600">{respondidas}/{preguntas.length}</p>
            <p className="text-sm text-gray-500">preguntas respondidas positivamente</p>
            <div className="mt-3 bg-gray-100 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${(respondidas / Math.max(preguntas.length, 1)) * 100}%` }} />
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold mb-3">Slider de mejora</h3>
            <p className="text-sm text-gray-500 mb-2">¿Cuánto quieres mejorar?</p>
            <input type="range" min={15} max={30} value={mejoraPct} onChange={e => setMejoraPct(Number(e.target.value))} className="w-full" />
            <p className="text-center text-2xl font-bold text-green-600 mt-2">{mejoraPct}%</p>
            <div className="mt-3 p-3 bg-green-50 rounded-lg text-sm">
              <p className="text-green-700 font-medium">Con {mejoraPct}% de mejora:</p>
              <p className="text-green-600 text-lg font-bold">+${mejora.toFixed(0)}/mes</p>
              <p className="text-gray-400 text-xs">basado en $10,000 de ingresos actuales</p>
            </div>
          </div>

          <button
            onClick={() => guardar.mutate()}
            disabled={respondidas === 0}
            className="btn-primary w-full py-3"
          >
            Guardar diagnóstico
          </button>
        </div>
      </div>
    </div>
  );
}
