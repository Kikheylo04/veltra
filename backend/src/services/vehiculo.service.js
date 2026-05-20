const prisma = require('../utils/prisma');

async function getAll(req, res) {
  const { clienteId, search } = req.query;
  const vehiculos = await prisma.vehiculo.findMany({
    where: {
      ...(clienteId ? { clienteId: Number(clienteId) } : {}),
      ...(search ? {
        OR: [
          { placa: { contains: search, mode: 'insensitive' } },
          { marca: { contains: search, mode: 'insensitive' } },
          { modelo: { contains: search, mode: 'insensitive' } },
        ],
      } : {}),
    },
    include: { cliente: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json(vehiculos);
}

async function getById(req, res) {
  const vehiculo = await prisma.vehiculo.findUnique({
    where: { id: Number(req.params.id) },
    include: { cliente: true, ordenes: { orderBy: { createdAt: 'desc' } } },
  });
  if (!vehiculo) return res.status(404).json({ error: 'Vehículo no encontrado' });
  res.json(vehiculo);
}

async function create(req, res) {
  const { clienteId, placa, marca, modelo, anio, color, vin } = req.body;
  if (!clienteId || !placa || !marca || !modelo || !anio)
    return res.status(400).json({ error: 'clienteId, placa, marca, modelo y anio son requeridos' });

  const vehiculo = await prisma.vehiculo.create({
    data: { clienteId: Number(clienteId), placa, marca, modelo, anio: Number(anio), color, vin },
    include: { cliente: true },
  });
  res.status(201).json(vehiculo);
}

async function update(req, res) {
  const { placa, marca, modelo, anio, color, vin } = req.body;
  const vehiculo = await prisma.vehiculo.update({
    where: { id: Number(req.params.id) },
    data: { placa, marca, modelo, anio: anio ? Number(anio) : undefined, color, vin },
  });
  res.json(vehiculo);
}

async function remove(req, res) {
  await prisma.vehiculo.delete({ where: { id: Number(req.params.id) } });
  res.json({ mensaje: 'Vehículo eliminado' });
}

module.exports = { getAll, getById, create, update, remove };
