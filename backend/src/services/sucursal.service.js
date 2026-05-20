const prisma = require('../utils/prisma');

async function getAll(req, res) {
  const sucursales = await prisma.sucursal.findMany({
    where: { activa: true },
    orderBy: { nombre: 'asc' },
  });
  res.json(sucursales);
}

async function create(req, res) {
  const { nombre, direccion, telefono } = req.body;
  if (!nombre) return res.status(400).json({ error: 'Nombre requerido' });
  const s = await prisma.sucursal.create({ data: { nombre, direccion, telefono } });
  res.status(201).json(s);
}

async function update(req, res) {
  const { nombre, direccion, telefono, activa } = req.body;
  const s = await prisma.sucursal.update({
    where: { id: Number(req.params.id) },
    data: { nombre, direccion, telefono, activa },
  });
  res.json(s);
}

module.exports = { getAll, create, update };
