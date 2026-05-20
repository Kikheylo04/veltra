import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/auth.store';
import Layout from './components/ui/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ClientesPage from './pages/ClientesPage';
import VehiculosPage from './pages/VehiculosPage';
import OrdenesPage from './pages/OrdenesPage';
import OrdenDetallePage from './pages/OrdenDetallePage';
import RepuestosPage from './pages/RepuestosPage';
import FacturasPage from './pages/FacturasPage';
import EmpleadosPage from './pages/EmpleadosPage';
import ProveedoresPage from './pages/ProveedoresPage';
import CRMPage from './pages/CRMPage';
import CajaPage from './pages/CajaPage';
import DiagnosticoPage from './pages/DiagnosticoPage';
import CitasPage from './pages/CitasPage';
import CotizacionesPage from './pages/CotizacionesPage';
import ReportesPage from './pages/ReportesPage';
import MantenimientosPage from './pages/MantenimientosPage';
import MetasPage from './pages/MetasPage';
import ConfiguracionPage from './pages/ConfiguracionPage';
import UsuariosPage from './pages/UsuariosPage';
import PlantillasPage from './pages/PlantillasPage';
import PerfilPage from './pages/PerfilPage';
import DashboardMecanicoPage from './pages/DashboardMecanicoPage';
import LogActividadPage from './pages/LogActividadPage';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  return token ? <>{children}</> : <Navigate to="/login" replace />;
}

function DashboardRouter() {
  const usuario = useAuthStore((s) => s.usuario);
  if ((usuario as any)?.rol === 'MECANICO') return <DashboardMecanicoPage />;
  return <DashboardPage />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardRouter />} />
          <Route path="ordenes" element={<OrdenesPage />} />
          <Route path="ordenes/:id" element={<OrdenDetallePage />} />
          <Route path="citas" element={<CitasPage />} />
          <Route path="clientes" element={<ClientesPage />} />
          <Route path="vehiculos" element={<VehiculosPage />} />
          <Route path="cotizaciones" element={<CotizacionesPage />} />
          <Route path="crm" element={<CRMPage />} />
          <Route path="facturas" element={<FacturasPage />} />
          <Route path="caja" element={<CajaPage />} />
          <Route path="repuestos" element={<RepuestosPage />} />
          <Route path="proveedores" element={<ProveedoresPage />} />
          <Route path="empleados" element={<EmpleadosPage />} />
          <Route path="metas" element={<MetasPage />} />
          <Route path="mantenimientos" element={<MantenimientosPage />} />
          <Route path="diagnostico" element={<DiagnosticoPage />} />
          <Route path="reportes" element={<ReportesPage />} />
          <Route path="configuracion" element={<ConfiguracionPage />} />
          <Route path="usuarios" element={<UsuariosPage />} />
          <Route path="plantillas" element={<PlantillasPage />} />
          <Route path="perfil" element={<PerfilPage />} />
          <Route path="logs" element={<LogActividadPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
