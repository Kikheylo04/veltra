const prisma = require('../utils/prisma');

async function getAll(req, res) {
  const { vehiculoId } = req.query;
  const mantenimientos = await prisma.mantenimiento.findMany({
    where: vehiculoId ? { vehiculoId: Number(vehiculoId) } : {},
    include: { vehiculo: { include: { cliente: true } } },
    orderBy: { fechaRealizado: 'desc' },
  });
  res.json(mantenimientos);
}

async function getProximos(req, res) {
  const proximos = await prisma.mantenimiento.findMany({
    where: {
      fechaProximo: { lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
    },
    include: { vehiculo: { include: { cliente: true } } },
    orderBy: { fechaProximo: 'asc' },
  });
  res.json(proximos);
}

async function create(req, res) {
  const { vehiculoId, tipo, descripcion, kmActual, kmProximo, fechaProximo, costo } = req.body;
  if (!vehiculoId || !tipo) return res.status(400).json({ error: 'vehiculoId y tipo requeridos' });

  const m = await prisma.mantenimiento.create({
    data: {
      vehiculoId: Number(vehiculoId),
      tipo, descripcion,
      kmActual: kmActual ? Number(kmActual) : null,
      kmProximo: kmProximo ? Number(kmProximo) : null,
      fechaProximo: fechaProximo ? new Date(fechaProximo) : null,
      costo: Number(costo) || 0,
    },
    include: { vehiculo: { include: { cliente: true } } },
  });
  res.status(201).json(m);
}

module.exports = { getAll, getProximos, create };
