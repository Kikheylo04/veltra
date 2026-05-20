const prisma = require('../utils/prisma');
const log = require('./log.service');

async function getAll(req, res) {
  const { page = 1, limit = 20 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);
  const [facturas, total] = await Promise.all([
    prisma.factura.findMany({
      include: { orden: { include: { vehiculo: { include: { cliente: true } }, servicios: true, repuestos: { include: { repuesto: true } } } } },
      orderBy: { fecha: 'desc' },
      skip,
      take: Number(limit),
    }),
    prisma.factura.count(),
  ]);
  res.json({ data: facturas, total, page: Number(page), limit: Number(limit) });
}

async function getById(req, res) {
  const factura = await prisma.factura.findUnique({
    where: { id: Number(req.params.id) },
    include: {
      orden: {
        include: {
          vehiculo: { include: { cliente: true } },
          servicios: true,
          repuestos: { include: { repuesto: true } },
          empleado: true,
        },
      },
    },
  });
  if (!factura) return res.status(404).json({ error: 'Factura no encontrada' });
  res.json(factura);
}

async function generarDesdeOrden(req, res) {
  const ordenId = Number(req.params.ordenId);
  const { metodoPago, impuestoPct } = req.body;

  const orden = await prisma.ordenTrabajo.findUnique({
    where: { id: ordenId },
    include: { servicios: true, repuestos: true, factura: true },
  });
  if (!orden) return res.status(404).json({ error: 'Orden no encontrada' });
  if (orden.factura) return res.status(400).json({ error: 'La orden ya tiene factura generada' });

  const totalServicios = orden.servicios.reduce((s, sv) => s + Number(sv.costoManoObra), 0);
  const totalRepuestos = orden.repuestos.reduce((s, r) => s + Number(r.precioUnitario) * r.cantidad, 0);
  const subtotal = totalServicios + totalRepuestos;
  const pct = Number(impuestoPct) || 0;
  const impuesto = subtotal * (pct / 100);
  const total = subtotal + impuesto;

  const factura = await prisma.factura.create({
    data: {
      ordenId,
      subtotal,
      impuesto,
      total,
      metodoPago: metodoPago || 'EFECTIVO',
      pagado: true,
    },
    include: { orden: { include: { vehiculo: { include: { cliente: true } } } } },
  });

  await prisma.ordenTrabajo.update({ where: { id: ordenId }, data: { estado: 'LISTO' } });
  log.registrar({ usuarioId: req.user?.id, accion: 'GENERAR_FACTURA', entidad: 'Factura', entidadId: factura.id, detalle: `Factura #${factura.id} — Total $${total.toFixed(2)}`, ip: req.ip });

  res.status(201).json(factura);
}

async function marcarPagada(req, res) {
  const factura = await prisma.factura.update({
    where: { id: Number(req.params.id) },
    data: { pagado: true, metodoPago: req.body.metodoPago || undefined },
  });
  res.json(factura);
}

module.exports = { getAll, getById, generarDesdeOrden, marcarPagada };
