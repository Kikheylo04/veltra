const prisma = require('../utils/prisma');
const log = require('./log.service');

const include = {
  vehiculo: { include: { cliente: true } },
  empleado: true,
  servicios: true,
  repuestos: { include: { repuesto: true } },
  factura: true,
};

async function getAll(req, res) {
  const { estado, empleadoId, page = 1, limit = 20 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);
  const where = {
    ...(estado ? { estado } : {}),
    ...(empleadoId ? { empleadoId: Number(empleadoId) } : {}),
  };
  const [ordenes, total] = await Promise.all([
    prisma.ordenTrabajo.findMany({ where, include, orderBy: { createdAt: 'desc' }, skip, take: Number(limit) }),
    prisma.ordenTrabajo.count({ where }),
  ]);
  res.json({ data: ordenes, total, page: Number(page), limit: Number(limit) });
}

async function getById(req, res) {
  const orden = await prisma.ordenTrabajo.findUnique({
    where: { id: Number(req.params.id) },
    include,
  });
  if (!orden) return res.status(404).json({ error: 'Orden no encontrada' });
  res.json(orden);
}

async function create(req, res) {
  const { vehiculoId, empleadoId, descripcionProblema, fechaEntregaEst, observaciones } = req.body;
  if (!vehiculoId || !descripcionProblema)
    return res.status(400).json({ error: 'vehiculoId y descripcionProblema son requeridos' });

  const orden = await prisma.ordenTrabajo.create({
    data: {
      vehiculoId: Number(vehiculoId),
      empleadoId: empleadoId ? Number(empleadoId) : null,
      descripcionProblema,
      fechaEntregaEst: fechaEntregaEst ? new Date(fechaEntregaEst) : null,
      observaciones,
    },
    include,
  });
  log.registrar({ usuarioId: req.user?.id, accion: 'CREAR_OT', entidad: 'OrdenTrabajo', entidadId: orden.id, detalle: `OT #${orden.id} creada`, ip: req.ip });
  res.status(201).json(orden);
}

async function update(req, res) {
  const { empleadoId, fechaEntregaEst, observaciones, descripcionProblema } = req.body;
  const orden = await prisma.ordenTrabajo.update({
    where: { id: Number(req.params.id) },
    data: {
      ...(empleadoId !== undefined ? { empleadoId: empleadoId ? Number(empleadoId) : null } : {}),
      ...(fechaEntregaEst !== undefined ? { fechaEntregaEst: fechaEntregaEst ? new Date(fechaEntregaEst) : null } : {}),
      ...(observaciones !== undefined ? { observaciones } : {}),
      ...(descripcionProblema ? { descripcionProblema } : {}),
    },
    include,
  });
  res.json(orden);
}

async function cambiarEstado(req, res) {
  const { estado } = req.body;
  const estados = ['RECIBIDO', 'DIAGNOSTICO', 'REPARACION', 'LISTO', 'ENTREGADO', 'CANCELADO'];
  if (!estados.includes(estado)) return res.status(400).json({ error: 'Estado inválido' });

  const actual = await prisma.ordenTrabajo.findUnique({ where: { id: Number(req.params.id) } });
  const historial = Array.isArray(actual.historialEstados) ? actual.historialEstados : [];
  historial.push({ estado, fecha: new Date().toISOString(), usuario: req.user?.nombre || 'Sistema' });

  const data = { estado, historialEstados: historial };
  if (estado === 'ENTREGADO') data.fechaEntregaReal = new Date();

  const orden = await prisma.ordenTrabajo.update({
    where: { id: Number(req.params.id) },
    data,
    include,
  });
  log.registrar({ usuarioId: req.user?.id, accion: 'CAMBIAR_ESTADO', entidad: 'OrdenTrabajo', entidadId: orden.id, detalle: `Estado → ${estado}`, ip: req.ip });
  res.json(orden);
}

async function addServicio(req, res) {
  const { descripcion, costoManoObra } = req.body;
  const servicio = await prisma.oTServicio.create({
    data: { ordenId: Number(req.params.id), descripcion, costoManoObra: Number(costoManoObra) || 0 },
  });
  res.status(201).json(servicio);
}

async function removeServicio(req, res) {
  await prisma.oTServicio.delete({ where: { id: Number(req.params.servicioId) } });
  res.json({ mensaje: 'Servicio eliminado' });
}

async function addRepuesto(req, res) {
  const { repuestoId, cantidad } = req.body;
  const repuesto = await prisma.repuesto.findUnique({ where: { id: Number(repuestoId) } });
  if (!repuesto) return res.status(404).json({ error: 'Repuesto no encontrado' });
  if (repuesto.stock < cantidad) return res.status(400).json({ error: 'Stock insuficiente' });

  const [otRepuesto] = await prisma.$transaction([
    prisma.oTRepuesto.create({
      data: {
        ordenId: Number(req.params.id),
        repuestoId: Number(repuestoId),
        cantidad: Number(cantidad),
        precioUnitario: repuesto.precioVenta,
      },
      include: { repuesto: true },
    }),
    prisma.repuesto.update({
      where: { id: Number(repuestoId) },
      data: { stock: { decrement: Number(cantidad) } },
    }),
  ]);
  res.status(201).json(otRepuesto);
}

async function removeRepuesto(req, res) {
  const otRepuesto = await prisma.oTRepuesto.findUnique({ where: { id: Number(req.params.repuestoId) } });
  if (!otRepuesto) return res.status(404).json({ error: 'Repuesto en OT no encontrado' });

  await prisma.$transaction([
    prisma.oTRepuesto.delete({ where: { id: otRepuesto.id } }),
    prisma.repuesto.update({
      where: { id: otRepuesto.repuestoId },
      data: { stock: { increment: otRepuesto.cantidad } },
    }),
  ]);
  res.json({ mensaje: 'Repuesto quitado de la orden' });
}

async function misOrdenes(req, res) {
  // Encuentra el empleado vinculado al usuario autenticado
  const empleado = await prisma.empleado.findFirst({ where: { usuarioId: req.user.id } });
  if (!empleado) return res.json({ data: [], total: 0 });

  const ordenes = await prisma.ordenTrabajo.findMany({
    where: { empleadoId: empleado.id, estado: { notIn: ['ENTREGADO', 'CANCELADO'] } },
    include,
    orderBy: { createdAt: 'desc' },
  });
  res.json({ data: ordenes, total: ordenes.length });
}

module.exports = { getAll, getById, create, update, cambiarEstado, addServicio, removeServicio, addRepuesto, removeRepuesto, misOrdenes };
