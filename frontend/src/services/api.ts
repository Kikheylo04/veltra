import axios from 'axios';
import { useAuthStore } from '../store/auth.store';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' });

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

// Auth
export const authApi = {
  login: (data: { email: string; password: string }) => api.post('/auth/login', data),
};

// Clientes
export const clienteApi = {
  getAll: (search?: string, page = 1, limit = 20) => api.get('/clientes', { params: { search, page, limit } }),
  getById: (id: number) => api.get(`/clientes/${id}`),
  create: (data: object) => api.post('/clientes', data),
  update: (id: number, data: object) => api.put(`/clientes/${id}`, data),
  remove: (id: number) => api.delete(`/clientes/${id}`),
};

// Vehículos
export const vehiculoApi = {
  getAll: (params?: object) => api.get('/vehiculos', { params }),
  getById: (id: number) => api.get(`/vehiculos/${id}`),
  create: (data: object) => api.post('/vehiculos', data),
  update: (id: number, data: object) => api.put(`/vehiculos/${id}`, data),
  remove: (id: number) => api.delete(`/vehiculos/${id}`),
};

// Empleados
export const empleadoApi = {
  getAll: () => api.get('/empleados'),
  create: (data: object) => api.post('/empleados', data),
  update: (id: number, data: object) => api.put(`/empleados/${id}`, data),
};

// Órdenes de trabajo
export const ordenApi = {
  getAll: (params?: object) => api.get('/ordenes', { params }),
  getById: (id: number) => api.get(`/ordenes/${id}`),
  create: (data: object) => api.post('/ordenes', data),
  update: (id: number, data: object) => api.put(`/ordenes/${id}`, data),
  cambiarEstado: (id: number, estado: string) => api.patch(`/ordenes/${id}/estado`, { estado }),
  addServicio: (id: number, data: object) => api.post(`/ordenes/${id}/servicios`, data),
  removeServicio: (id: number, servicioId: number) => api.delete(`/ordenes/${id}/servicios/${servicioId}`),
  addRepuesto: (id: number, data: object) => api.post(`/ordenes/${id}/repuestos`, data),
  removeRepuesto: (id: number, repuestoId: number) => api.delete(`/ordenes/${id}/repuestos/${repuestoId}`),
};

// Repuestos
export const repuestoApi = {
  getAll: (params?: object) => api.get('/repuestos', { params }),
  getById: (id: number) => api.get(`/repuestos/${id}`),
  create: (data: object) => api.post('/repuestos', data),
  update: (id: number, data: object) => api.put(`/repuestos/${id}`, data),
  ajustarStock: (id: number, data: object) => api.patch(`/repuestos/${id}/stock`, data),
};

// Proveedores
export const proveedorApi = {
  getAll: () => api.get('/proveedores'),
  create: (data: object) => api.post('/proveedores', data),
  update: (id: number, data: object) => api.put(`/proveedores/${id}`, data),
  remove: (id: number) => api.delete(`/proveedores/${id}`),
};

// Facturas
export const facturaApi = {
  getAll: (page = 1, limit = 20) => api.get('/facturas', { params: { page, limit } }),
  getById: (id: number) => api.get(`/facturas/${id}`),
  generar: (ordenId: number, data: object) => api.post(`/facturas/orden/${ordenId}`, data),
  marcarPagada: (id: number, data: object) => api.patch(`/facturas/${id}/pagar`, data),
};

// Reportes
export const reporteApi = {
  dashboard: () => api.get('/reportes/dashboard'),
  ingresos: (params?: object) => api.get('/reportes/ingresos', { params }),
  otEstados: () => api.get('/reportes/ot-estados'),
};

// Garantías
export const garantiaApi = {
  getByOrden: (ordenId: number) => api.get(`/garantias/orden/${ordenId}`),
  create: (data: object) => api.post('/garantias', data),
};

// Búsqueda global
export const busquedaApi = {
  buscar: (q: string) => api.get('/reportes/busqueda', { params: { q } }),
};

// Config
export const configApi = {
  get: () => api.get('/config'),
  update: (data: object) => api.put('/config', data),
};

// Usuarios
export const usuarioApi = {
  getAll: () => api.get('/usuarios'),
  create: (data: object) => api.post('/usuarios', data),
  resetPassword: (id: number, password: string) => api.patch(`/usuarios/${id}/password`, { password }),
};
