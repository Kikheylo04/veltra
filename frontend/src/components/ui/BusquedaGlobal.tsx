import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users, Car, ClipboardList } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { busquedaApi } from '../../services/api';

export default function BusquedaGlobal() {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const { data } = useQuery({
    queryKey: ['busqueda', q],
    queryFn: () => busquedaApi.buscar(q).then(r => r.data),
    enabled: q.length >= 2,
  });

  const clientes: any[] = data?.clientes ?? [];
  const vehiculos: any[] = data?.vehiculos ?? [];
  const ordenes: any[] = data?.ordenes ?? [];
  const hayResultados = clientes.length + vehiculos.length + ordenes.length > 0;

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const ir = (path: string) => { navigate(path); setQ(''); setOpen(false); };

  return (
    <div ref={ref} className="relative w-72">
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className="w-full bg-gray-100 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Buscar clientes, placas, órdenes..."
          value={q}
          onChange={e => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
        />
      </div>

      {open && q.length >= 2 && (
        <div className="absolute top-full mt-1 w-full bg-white border rounded-xl shadow-lg z-50 overflow-hidden">
          {!hayResultados ? (
            <p className="px-4 py-3 text-sm text-gray-400">Sin resultados para "{q}"</p>
          ) : (
            <div className="py-1 max-h-80 overflow-y-auto">
              {clientes.length > 0 && (
                <>
                  <p className="px-3 py-1 text-xs font-semibold text-gray-400 uppercase">Clientes</p>
                  {clientes.map((c: any) => (
                    <button key={c.id} onClick={() => ir('/clientes')}
                      className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 text-left">
                      <Users size={14} className="text-blue-500 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium">{c.nombre}</p>
                        <p className="text-xs text-gray-400">{c.telefono}</p>
                      </div>
                    </button>
                  ))}
                </>
              )}
              {vehiculos.length > 0 && (
                <>
                  <p className="px-3 py-1 text-xs font-semibold text-gray-400 uppercase">Vehículos</p>
                  {vehiculos.map((v: any) => (
                    <button key={v.id} onClick={() => ir('/vehiculos')}
                      className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 text-left">
                      <Car size={14} className="text-purple-500 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium">{v.placa} — {v.marca} {v.modelo}</p>
                        <p className="text-xs text-gray-400">{v.cliente?.nombre}</p>
                      </div>
                    </button>
                  ))}
                </>
              )}
              {ordenes.length > 0 && (
                <>
                  <p className="px-3 py-1 text-xs font-semibold text-gray-400 uppercase">Órdenes</p>
                  {ordenes.map((o: any) => (
                    <button key={o.id} onClick={() => ir(`/ordenes/${o.id}`)}
                      className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 text-left">
                      <ClipboardList size={14} className="text-orange-500 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium">OT #{o.id} — {o.vehiculo?.placa}</p>
                        <p className="text-xs text-gray-400 truncate max-w-xs">{o.descripcionProblema}</p>
                      </div>
                    </button>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
