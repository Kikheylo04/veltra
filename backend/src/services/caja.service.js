const prisma = require('../utils/prisma');

async function getAll(req, res) {
  const { desde, hasta, tipo, sucursalId } = req.query;
  const movimientos = await prisma.cajaDiaria.findMany({
    where: {
      ...(tipo ? { tipo } : {}),
      ...(sucursalId ? { sucursalId: Number(sucursalId) } : {}),
      ...(desde || hasta ? {
        fecha: {
          gte: desde ? new Date(desde) : undefined,
          lte: hasta ? new Date(hasta) : undefined,
        },
      } : {}),
    },
    include: { sucursal: true },
    orderBy: { fecha: 'desc' },
  });

  const totalIngresos = movimientos.filter(m => m.tipo === 'INGRESO').reduce((s, m) => s + Number(m.monto), 0);
  const totalEgresos = movimientos.filter(m => m.tipo === 'EGRESO').reduce((s, m) => s + Number(m.monto), 0);
  const saldo = totalIngresos - totalEgresos;

  res.json({ movimientos, totalIngresos, totalEgresos, saldo });
}

async function create(req, res) {
  const { tipo, concepto, monto, metodoPago, referencia, sucursalId, fecha } = req.body;
  if (!tipo || !concepto || !monto) return res.status(400).json({ error: 'tipo, concepto y monto requeridos' });

  const mov = await prisma.cajaDiaria.create({
    data: {
      tipo, concepto,
      monto: Number(monto),
      metodoPago: metodoPago || 'EFECTIVO',
      referencia,
      sucursalId: sucursalId ? Number(sucursalId) : null,
      fecha: fecha ? new Date(fecha) : new Date(),
    },
    include: { sucursal: true },
  });
  res.status(201).json(mov);
}

async function remove(req, res) {
  await prisma.cajaDiaria.delete({ where: { id: Number(req.params.id) } });
  res.json({ mensaje: 'Movimiento eliminado' });
}

async function resumenMensual(req, res) {
  const anio = Number(req.query.anio) || new Date().getFullYear();
  const meses = Array.from({ length: 12 }, (_, i) => i);

  const data = await Promise.all(meses.map(async (mes) => {
    const inicio = new Date(anio, mes, 1);
    const fin = new Date(anio, mes + 1, 0, 23, 59, 59);
    const [ing, egr] = await Promise.all([
      prisma.cajaDiaria.aggregate({ _sum: { monto: true }, where: { tipo: 'INGRESO', fecha: { gte: inicio, lte: fin } } }),
      prisma.cajaDiaria.aggregate({ _sum: { monto: true }, where: { tipo: 'EGRESO', fecha: { gte: inicio, lte: fin } } }),
    ]);
    return {
      mes: inicio.toLocaleString('es', { month: 'short' }),
      ingresos: Number(ing._sum.monto) || 0,
      egresos: Number(egr._sum.monto) || 0,
      saldo: (Number(ing._sum.monto) || 0) - (Number(egr._sum.monto) || 0),
    };
  }));

  res.json(data);
}

module.exports = { getAll, create, remove, resumenMensual };
