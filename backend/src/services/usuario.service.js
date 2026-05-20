const prisma = require('../utils/prisma');
const bcrypt = require('bcryptjs');

async function getAll(req, res) {
  const usuarios = await prisma.usuario.findMany({
    select: { id: true, nombre: true, email: true, rol: true, activo: true, createdAt: true },
    orderBy: { nombre: 'asc' },
  });
  res.json(usuarios);
}

async function create(req, res) {
  const { nombre, email, password, rol } = req.body;
  if (!nombre || !email || !password) return res.status(400).json({ error: 'nombre, email y password requeridos' });

  const existe = await prisma.usuario.findUnique({ where: { email } });
  if (existe) return res.status(400).json({ error: 'El correo ya está registrado' });

  const hash = await bcrypt.hash(password, 10);
  const usuario = await prisma.usuario.create({
    data: { nombre, email, password: hash, rol: rol || 'RECEPCIONISTA' },
    select: { id: true, nombre: true, email: true, rol: true, activo: true },
  });
  res.status(201).json(usuario);
}

async function update(req, res) {
  const { nombre, email, rol, activo } = req.body;
  const usuario = await prisma.usuario.update({
    where: { id: Number(req.params.id) },
    data: { nombre, email, rol, activo },
    select: { id: true, nombre: true, email: true, rol: true, activo: true },
  });
  res.json(usuario);
}

async function resetPassword(req, res) {
  const { password } = req.body;
  if (!password || password.length < 6) return res.status(400).json({ error: 'Mínimo 6 caracteres' });
  const hash = await bcrypt.hash(password, 10);
  await prisma.usuario.update({ where: { id: Number(req.params.id) }, data: { password: hash } });
  res.json({ mensaje: 'Contraseña actualizada' });
}

async function cambiarMiPassword(req, res) {
  const { passwordActual, passwordNueva } = req.body;
  if (!passwordNueva || passwordNueva.length < 6) return res.status(400).json({ error: 'Mínimo 6 caracteres' });
  const usuario = await prisma.usuario.findUnique({ where: { id: req.user.id } });
  const valido = await bcrypt.compare(passwordActual, usuario.password);
  if (!valido) return res.status(400).json({ error: 'Contraseña actual incorrecta' });
  const hash = await bcrypt.hash(passwordNueva, 10);
  await prisma.usuario.update({ where: { id: req.user.id }, data: { password: hash } });
  res.json({ mensaje: 'Contraseña actualizada' });
}

async function miPerfil(req, res) {
  const usuario = await prisma.usuario.findUnique({
    where: { id: req.user.id },
    select: { id: true, nombre: true, email: true, rol: true },
  });
  res.json(usuario);
}

module.exports = { getAll, create, update, resetPassword, miPerfil, cambiarMiPassword };
