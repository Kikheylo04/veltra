import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  LayoutDashboard, Users, Car, ClipboardList, Package,
  FileText, UserCog, Truck, LogOut, MessageSquare,
  Calendar, DollarSign, BarChart3, Stethoscope, Receipt,
  Building2, Target, Settings, Bell, Layers, Activity, Menu, X,
} from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';
import { useSucursalStore } from '../../store/sucursal.store';
import api from '../../services/api';
import BusquedaGlobal from './BusquedaGlobal';

const nav = [
  { label: 'PRINCIPAL', section: true },
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/ordenes', icon: ClipboardList, label: 'Órdenes de Trabajo' },
  { to: '/citas', icon: Calendar, label: 'Agenda / Citas' },
  { label: 'CLIENTES', section: true },
  { to: '/clientes', icon: Users, label: 'Clientes' },
  { to: '/vehiculos', icon: Car, label: 'Vehículos' },
  { to: '/cotizaciones', icon: Receipt, label: 'Cotizaciones' },
  { to: '/crm', icon: MessageSquare, label: 'CRM / Pipeline' },
  { label: 'FINANZAS', section: true },
  { to: '/facturas', icon: FileText, label: 'Facturas' },
  { to: '/caja', icon: DollarSign, label: 'Flujo de Caja' },
  { label: 'INVENTARIO', section: true },
  { to: '/repuestos', icon: Package, label: 'Repuestos' },
  { to: '/proveedores', icon: Truck, label: 'Proveedores' },
  { label: 'MANTENIMIENTO', section: true },
  { to: '/mantenimientos', icon: Settings, label: 'Mantenimientos' },
  { label: 'ADMINISTRACIÓN', section: true },
  { to: '/empleados', icon: UserCog, label: 'Empleados' },
  { to: '/metas', icon: Target, label: 'Metas' },
  { to: '/diagnostico', icon: Stethoscope, label: 'Diagnóstico' },
  { to: '/reportes', icon: BarChart3, label: 'Reportes' },
  { to: '/usuarios', icon: UserCog, label: 'Usuarios' },
  { to: '/plantillas', icon: Layers, label: 'Plantillas & Servicios' },
  { to: '/logs', icon: Activity, label: 'Log de Actividad' },
  { to: '/configuracion', icon: Settings, label: 'Configuración' },
] as const;

export default function Layout() {
  const { usuario, logout } = useAuthStore();
  const { sucursalId, setSucursal } = useSucursalStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Cierra sidebar al navegar en mobile
  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  const { data: sucursales = [] } = useQuery({
    queryKey: ['sucursales'],
    queryFn: () => api.get('/sucursales').then(r => r.data),
  });

  const { data: dash } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/reportes/dashboard').then(r => r.data),
    refetchInterval: 60000,
  });
  const alertCount = ((dash as any)?.leadssinResponder ?? 0) + ((dash as any)?.citasHoy ?? 0);

  const handleLogout = () => { logout(); navigate('/login'); };

  const SidebarContent = () => (
    <>
      <div className="p-5 flex items-center gap-3 border-b border-gray-700">
        <img src="/icons/veltra.jpeg" alt="VELTRA" className="w-9 h-9 object-contain rounded" />
        <div>
          <p className="font-bold text-lg leading-tight tracking-wide">VELTRA</p>
          <p className="text-xs text-gray-400">Taller Mecánico</p>
        </div>
        {/* Botón cerrar en mobile */}
        <button onClick={() => setSidebarOpen(false)} className="ml-auto lg:hidden text-gray-400 hover:text-white">
          <X size={20} />
        </button>
      </div>

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {nav.map((item) => {
          if ('section' in item) {
            return (
              <p key={item.label} className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 pt-4 pb-1">
                {item.label}
              </p>
            );
          }
          const { to, icon: Icon, label } = item as any;
          const esOrdenes = to === '/ordenes';
          return (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`
              }
            >
              <Icon size={16} />
              <span className="flex-1">{label}</span>
              {esOrdenes && (dash as any)?.totalOTAbiertas > 0 && (
                <span className="bg-blue-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                  {(dash as any).totalOTAbiertas}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
            {usuario?.nombre[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{usuario?.nombre}</p>
            <p className="text-xs text-gray-400">{usuario?.rol}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-gray-400 hover:text-white text-sm w-full px-2 py-1.5 rounded transition-colors hover:bg-gray-800"
        >
          <LogOut size={16} /> Cerrar sesión
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar desktop — siempre visible */}
      <aside className="hidden lg:flex w-64 bg-gray-900 text-white flex-col flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Sidebar mobile — drawer */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-72 bg-gray-900 text-white flex flex-col transform transition-transform duration-300 lg:hidden ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <SidebarContent />
      </aside>

      {/* Contenido principal */}
      <main className="flex-1 overflow-y-auto flex flex-col min-w-0">
        {/* Header */}
        <div className="bg-white border-b px-4 lg:px-6 py-2.5 flex items-center gap-3">
          {/* Hamburger mobile */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 flex-shrink-0"
          >
            <Menu size={20} />
          </button>

          <div className="flex items-center gap-2 text-sm text-gray-500 flex-shrink-0">
            <Building2 size={16} className="hidden sm:block" />
            <select
              className="border-0 bg-transparent text-sm font-medium text-gray-700 focus:outline-none cursor-pointer max-w-[140px] sm:max-w-none"
              value={sucursalId ?? ''}
              onChange={(e) => {
                const id = e.target.value ? Number(e.target.value) : null;
                const nombre = id ? (sucursales as any[]).find((s: any) => s.id === id)?.nombre || '' : 'Todas las sedes';
                setSucursal(id, nombre);
              }}
            >
              <option value="">Todas las sedes</option>
              {(sucursales as any[]).map((s: any) => (
                <option key={s.id} value={s.id}>{s.nombre}</option>
              ))}
            </select>
          </div>

          <div className="flex-1 hidden md:block">
            <BusquedaGlobal />
          </div>

          <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
            <button onClick={() => navigate('/dashboard')} className="relative p-1.5 rounded-lg hover:bg-gray-100">
              <Bell size={18} className="text-gray-500" />
              {alertCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {alertCount > 9 ? '9+' : alertCount}
                </span>
              )}
            </button>
            <button onClick={() => navigate('/perfil')} className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold hover:bg-blue-700">
              {usuario?.nombre[0]}
            </button>
          </div>
        </div>

        {/* Búsqueda mobile */}
        <div className="md:hidden px-4 py-2 bg-white border-b">
          <BusquedaGlobal />
        </div>

        <div className="p-4 lg:p-8 flex-1">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
