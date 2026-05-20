const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');

async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email y contraseña requeridos' });

  const usuario = await prisma.usuario.findUnique({ where: { email } });
  if (!usuario || !usuario.activo) return res.status(401).json({ error: 'Credenciales inválidas' });

  const valido = await bcrypt.compare(password, usuario.password);
  if (!valido) return res.status(401).json({ error: 'Credenciales inválidas' });

  const token = jwt.sign(
    { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );

  res.json({ token, usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol } });
}

async function cambiarPassword(req, res) {
  const { passwordActual, passwordNueva } = req.body;
  const usuario = await prisma.usuario.findUnique({ where: { id: req.user.id } });

  const valido = await bcrypt.compare(passwordActual, usuario.password);
  if (!valido) return res.status(400).json({ error: 'Contraseña actual incorrecta' });

  const hash = await bcrypt.hash(passwordNueva, 10);
  await prisma.usuario.update({ where: { id: req.user.id }, data: { password: hash } });
  res.json({ mensaje: 'Contraseña actualizada' });
}

module.exports = { login, cambiarPassword };
