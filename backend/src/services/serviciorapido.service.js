const prisma = require('../utils/prisma');

async function getAll(req, res) {
  const servicios = await prisma.servicioRapido.findMany({
    where: { activo: true },
    orderBy: { usos: 'desc' },
    take: 15,
  });
  res.json(servicios);
}

async function create(req, res) {
  const { nombre, precio } = req.body;
  if (!nombre) return res.status(400).json({ error: 'Nombre requerido' });
  const s = await prisma.servicioRapido.create({ data: { nombre, precio: Number(precio) || 0 } });
  res.status(201).json(s);
}

async function update(req, res) {
  const { nombre, precio, activo } = req.body;
  const s = await prisma.servicioRapido.update({
    where: { id: Number(req.params.id) },
    data: { nombre, precio: precio !== undefined ? Number(precio) : undefined, activo },
  });
  res.json(s);
}

async function incrementarUso(req, res) {
  const s = await prisma.servicioRapido.update({
    where: { id: Number(req.params.id) },
    data: { usos: { increment: 1 } },
  });
  res.json(s);
}

module.exports = { getAll, create, update, incrementarUso };
