const prisma = require('../utils/prisma');

async function registrar({ usuarioId, accion, entidad, entidadId, detalle, ip }) {
  try {
    await prisma.logActividad.create({
      data: { usuarioId, accion, entidad, entidadId: entidadId ? Number(entidadId) : null, detalle, ip },
    });
  } catch (_) {
    // Log no crítico, no interrumpe el flujo
  }
}

async function getAll(req, res) {
  const { page = 1, limit = 50 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);
  const [logs, total] = await Promise.all([
    prisma.logActividad.findMany({
      orderBy: { createdAt: 'desc' },
      skip,
      take: Number(limit),
    }),
    prisma.logActividad.count(),
  ]);
  res.json({ data: logs, total, page: Number(page) });
}

module.exports = { registrar, getAll };
