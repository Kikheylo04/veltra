const prisma = require('../utils/prisma');

async function getAll(req, res) {
  const garantias = await prisma.garantia.findMany({
    include: { orden: { include: { vehiculo: { include: { cliente: true } } } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(garantias);
}

async function create(req, res) {
  const { ordenId, descripcion, diasGarantia, kmGarantia } = req.body;
  if (!ordenId || !descripcion) return res.status(400).json({ error: 'ordenId y descripcion requeridos' });

  const fechaFin = new Date();
  fechaFin.setDate(fechaFin.getDate() + (Number(diasGarantia) || 30));

  const garantia = await prisma.garantia.create({
    data: {
      ordenId: Number(ordenId),
      descripcion,
      diasGarantia: Number(diasGarantia) || 30,
      kmGarantia: kmGarantia ? Number(kmGarantia) : null,
      fechaFin,
    },
    include: { orden: { include: { vehiculo: { include: { cliente: true } } } } },
  });
  res.status(201).json(garantia);
}

async function getByOrden(req, res) {
  const garantia = await prisma.garantia.findUnique({
    where: { ordenId: Number(req.params.ordenId) },
    include: { orden: true },
  });
  res.json(garantia);
}

module.exports = { getAll, create, getByOrden };
