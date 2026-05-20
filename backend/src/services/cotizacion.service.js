const prisma = require('../utils/prisma');

const include = {
  cliente: true,
  vehiculo: true,
  items: true,
};

async function getAll(req, res) {
  const { estado, clienteId } = req.query;
  const cotizaciones = await prisma.cotizacion.findMany({
    where: {
      ...(estado ? { estado } : {}),
      ...(clienteId ? { clienteId: Number(clienteId) } : {}),
    },
    include,
    orderBy: { createdAt: 'desc' },
  });
  res.json(cotizaciones);
}

async function getById(req, res) {
  const c = await prisma.cotizacion.findUnique({ where: { id: Number(req.params.id) }, include });
  if (!c) return res.status(404).json({ error: 'Cotización no encontrada' });
  res.json(c);
}

async function create(req, res) {
  const { clienteId, vehiculoId, descripcion, validaHasta, notas, items } = req.body;
  if (!clienteId || !descripcion) return res.status(400).json({ error: 'clienteId y descripcion requeridos' });

  const cotizacion = await prisma.cotizacion.create({
    data: {
      clienteId: Number(clienteId),
      vehiculoId: vehiculoId ? Number(vehiculoId) : null,
      descripcion, notas,
      validaHasta: validaHasta ? new Date(validaHasta) : null,
      items: items?.length ? {
        create: items.map((i) => ({
          descripcion: i.descripcion,
          cantidad: Number(i.cantidad) || 1,
          precioUnitario: Number(i.precioUnitario) || 0,
        })),
      } : undefined,
    },
    include,
  });
  res.status(201).json(cotizacion);
}

async function cambiarEstado(req, res) {
  const { estado } = req.body;
  const c = await prisma.cotizacion.update({
    where: { id: Number(req.params.id) },
    data: { estado },
    include,
  });
  res.json(c);
}

async function addItem(req, res) {
  const { descripcion, cantidad, precioUnitario } = req.body;
  const item = await prisma.cotizacionItem.create({
    data: { cotizacionId: Number(req.params.id), descripcion, cantidad: Number(cantidad) || 1, precioUnitario: Number(precioUnitario) },
  });
  res.status(201).json(item);
}

async function removeItem(req, res) {
  await prisma.cotizacionItem.delete({ where: { id: Number(req.params.itemId) } });
  res.json({ mensaje: 'Item eliminado' });
}

module.exports = { getAll, getById, create, cambiarEstado, addItem, removeItem };
