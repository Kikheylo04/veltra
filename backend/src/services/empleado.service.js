const prisma = require('../utils/prisma');

async function getAll(req, res) {
  const empleados = await prisma.empleado.findMany({
    where: { activo: true },
    include: { usuario: { select: { email: true, rol: true } } },
    orderBy: { nombre: 'asc' },
  });
  res.json(empleados);
}

async function getById(req, res) {
  const empleado = await prisma.empleado.findUnique({
    where: { id: Number(req.params.id) },
    include: { usuario: { select: { email: true, rol: true } }, ordenes: { take: 10, orderBy: { createdAt: 'desc' } } },
  });
  if (!empleado) return res.status(404).json({ error: 'Empleado no encontrado' });
  res.json(empleado);
}

async function create(req, res) {
  const { nombre, especialidad, telefono } = req.body;
  if (!nombre) return res.status(400).json({ error: 'Nombre requerido' });
  const empleado = await prisma.empleado.create({ data: { nombre, especialidad, telefono } });
  res.status(201).json(empleado);
}

async function update(req, res) {
  const { nombre, especialidad, telefono, activo } = req.body;
  const empleado = await prisma.empleado.update({
    where: { id: Number(req.params.id) },
    data: { nombre, especialidad, telefono, activo },
  });
  res.json(empleado);
}

module.exports = { getAll, getById, create, update };
