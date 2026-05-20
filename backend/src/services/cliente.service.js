const prisma = require('../utils/prisma');

async function getAll(req, res) {
  const { search, page = 1, limit = 20 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);
  const where = search ? {
    OR: [
      { nombre: { contains: search, mode: 'insensitive' } },
      { telefono: { contains: search } },
      { correo: { contains: search, mode: 'insensitive' } },
    ],
  } : undefined;

  const [clientes, total] = await Promise.all([
    prisma.cliente.findMany({ where, include: { vehiculos: true }, orderBy: { nombre: 'asc' }, skip, take: Number(limit) }),
    prisma.cliente.count({ where }),
  ]);
  res.json({ data: clientes, total, page: Number(page), limit: Number(limit) });
}

async function getById(req, res) {
  const cliente = await prisma.cliente.findUnique({
    where: { id: Number(req.params.id) },
    include: { vehiculos: { include: { ordenes: { orderBy: { createdAt: 'desc' }, take: 5 } } } },
  });
  if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado' });
  res.json(cliente);
}

async function create(req, res) {
  const { nombre, telefono, correo, direccion } = req.body;
  if (!nombre) return res.status(400).json({ error: 'Nombre requerido' });
  const cliente = await prisma.cliente.create({ data: { nombre, telefono, correo, direccion } });
  res.status(201).json(cliente);
}

async function update(req, res) {
  const { nombre, telefono, correo, direccion } = req.body;
  const cliente = await prisma.cliente.update({
    where: { id: Number(req.params.id) },
    data: { nombre, telefono, correo, direccion },
  });
  res.json(cliente);
}

async function remove(req, res) {
  await prisma.cliente.delete({ where: { id: Number(req.params.id) } });
  res.json({ mensaje: 'Cliente eliminado' });
}

module.exports = { getAll, getById, create, update, remove };
