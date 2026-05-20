const prisma = require('../utils/prisma');

async function getAll(req, res) {
  const { desde, hasta, estado } = req.query;
  const citas = await prisma.cita.findMany({
    where: {
      ...(estado ? { estado } : {}),
      ...(desde || hasta ? { fecha: { gte: desde ? new Date(desde) : undefined, lte: hasta ? new Date(hasta) : undefined } } : {}),
    },
    include: { cliente: true, vehiculo: true, sucursal: true },
    orderBy: { fecha: 'asc' },
  });
  res.json(citas);
}

async function create(req, res) {
  const { clienteId, vehiculoId, sucursalId, fecha, descripcion } = req.body;
  if (!clienteId || !fecha || !descripcion) return res.status(400).json({ error: 'clienteId, fecha y descripcion requeridos' });

  const cita = await prisma.cita.create({
    data: {
      clienteId: Number(clienteId),
      vehiculoId: vehiculoId ? Number(vehiculoId) : null,
      sucursalId: sucursalId ? Number(sucursalId) : null,
      fecha: new Date(fecha),
      descripcion,
    },
    include: { cliente: true, vehiculo: true },
  });
  res.status(201).json(cita);
}

async function cambiarEstado(req, res) {
  const cita = await prisma.cita.update({
    where: { id: Number(req.params.id) },
    data: { estado: req.body.estado },
    include: { cliente: true, vehiculo: true },
  });
  res.json(cita);
}

async function remove(req, res) {
  await prisma.cita.delete({ where: { id: Number(req.params.id) } });
  res.json({ mensaje: 'Cita eliminada' });
}

module.exports = { getAll, create, cambiarEstado, remove };
