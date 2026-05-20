const prisma = require('../utils/prisma');

async function getAll(req, res) {
  const { mes, anio } = req.query;
  const hoy = new Date();
  const metas = await prisma.meta.findMany({
    where: {
      mes: mes ? Number(mes) : hoy.getMonth() + 1,
      anio: anio ? Number(anio) : hoy.getFullYear(),
    },
    include: { empleado: true, sucursal: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json(metas);
}

async function upsert(req, res) {
  const { empleadoId, sucursalId, tipo, mes, anio, metaValor, realValor } = req.body;
  if (!tipo || !metaValor) return res.status(400).json({ error: 'tipo y metaValor requeridos' });

  const hoy = new Date();
  const data = {
    tipo,
    mes: mes ? Number(mes) : hoy.getMonth() + 1,
    anio: anio ? Number(anio) : hoy.getFullYear(),
    metaValor: Number(metaValor),
    realValor: realValor ? Number(realValor) : 0,
    empleadoId: empleadoId ? Number(empleadoId) : null,
    sucursalId: sucursalId ? Number(sucursalId) : null,
  };

  const meta = await prisma.meta.create({ data, include: { empleado: true } });
  res.status(201).json(meta);
}

async function actualizarReal(req, res) {
  const meta = await prisma.meta.update({
    where: { id: Number(req.params.id) },
    data: { realValor: Number(req.body.realValor) },
    include: { empleado: true },
  });
  res.json(meta);
}

async function resumen(req, res) {
  const hoy = new Date();
  const mes = Number(req.query.mes) || hoy.getMonth() + 1;
  const anio = Number(req.query.anio) || hoy.getFullYear();

  const metas = await prisma.meta.findMany({
    where: { mes, anio },
    include: { empleado: true, sucursal: true },
  });

  const totalMeta = metas.reduce((s, m) => s + Number(m.metaValor), 0);
  const totalReal = metas.reduce((s, m) => s + Number(m.realValor), 0);
  const avancePct = totalMeta > 0 ? Math.round((totalReal / totalMeta) * 100) : 0;

  res.json({ metas, totalMeta, totalReal, avancePct });
}

module.exports = { getAll, upsert, actualizarReal, resumen };
