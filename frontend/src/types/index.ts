export type Rol = 'ADMIN' | 'RECEPCIONISTA' | 'MECANICO';
export type EstadoOT = 'RECIBIDO' | 'DIAGNOSTICO' | 'REPARACION' | 'LISTO' | 'ENTREGADO' | 'CANCELADO';
export type MetodoPago = 'EFECTIVO' | 'TRANSFERENCIA' | 'TARJETA';

export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: Rol;
}

export interface Cliente {
  id: number;
  nombre: string;
  telefono?: string;
  correo?: string;
  direccion?: string;
  vehiculos?: Vehiculo[];
  createdAt: string;
}

export interface Vehiculo {
  id: number;
  clienteId: number;
  placa: string;
  marca: string;
  modelo: string;
  anio: number;
  color?: string;
  vin?: string;
  cliente?: Cliente;
  ordenes?: OrdenTrabajo[];
}

export interface Empleado {
  id: number;
  nombre: string;
  especialidad?: string;
  telefono?: string;
  activo: boolean;
}

export interface OTServicio {
  id: number;
  ordenId: number;
  descripcion: string;
  costoManoObra: number;
}

export interface OTRepuesto {
  id: number;
  ordenId: number;
  repuestoId: number;
  cantidad: number;
  precioUnitario: number;
  repuesto?: Repuesto;
}

export interface OrdenTrabajo {
  id: number;
  vehiculoId: number;
  empleadoId?: number;
  descripcionProblema: string;
  estado: EstadoOT;
  fechaIngreso: string;
  fechaEntregaEst?: string;
  fechaEntregaReal?: string;
  observaciones?: string;
  vehiculo?: Vehiculo;
  empleado?: Empleado;
  servicios?: OTServicio[];
  repuestos?: OTRepuesto[];
  factura?: Factura;
  createdAt: string;
}

export interface Repuesto {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  precioCosto: number;
  precioVenta: number;
  stock: number;
  stockMinimo: number;
  proveedorId?: number;
  proveedor?: Proveedor;
}

export interface Proveedor {
  id: number;
  nombre: string;
  telefono?: string;
  correo?: string;
  direccion?: string;
}

export interface Factura {
  id: number;
  ordenId: number;
  subtotal: number;
  impuesto: number;
  total: number;
  metodoPago: MetodoPago;
  pagado: boolean;
  fecha: string;
  orden?: OrdenTrabajo;
}

export interface DashboardData {
  totalOTAbiertas: number;
  totalOTMes: number;
  ingresosMes: number;
  clientesTotal: number;
  repuestosBajoStock: Repuesto[];
}
