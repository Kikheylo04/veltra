const prisma = require('../utils/prisma');

async function getAll(req, res) {
  const proveedores = await prisma.proveedor.findMany({ orderBy: { nombre: 'asc' } });
  res.json(proveedores);
}

async function create(req, res) {
  const { nombre, telefono, correo, direccion } = req.body;
  if (!nombre) return res.status(400).json({ error: 'Nombre requerido' });
  const proveedor = await prisma.proveedor.create({ data: { nombre, telefono, correo, direccion } });
  res.status(201).json(proveedor);
}

async function update(req, res) {
  const { nombre, telefono, correo, direccion } = req.body;
  const proveedor = await prisma.proveedor.update({
    where: { id: Number(req.params.id) },
    data: { nombre, telefono, correo, direccion },
  });
  res.json(proveedor);
}

async function remove(req, res) {
  await prisma.proveedor.delete({ where: { id: Number(req.params.id) } });
  res.json({ mensaje: 'Proveedor eliminado' });
}

module.exports = { getAll, create, update, remove };
