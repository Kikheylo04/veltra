const prisma = require('../utils/prisma');

async function dashboard(req, res) {
  const hoy = new Date();
  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  const en30Dias = new Date(hoy.getTime() + 30 * 24 * 60 * 60 * 1000);

  const [
    totalOTAbiertas,
    totalOTMes,
    ingresosMes,
    clientesTotal,
    repuestosBajoStock,
    citasHoy,
    leadssinResponder,
    mantenimientosProximos,
    cotizacionesPendientes,
  ] = await Promise.all([
    prisma.ordenTrabajo.count({ where: { estado: { notIn: ['ENTREGADO', 'CANCELADO'] } } }),
    prisma.ordenTrabajo.count({ where: { createdAt: { gte: inicioMes } } }),
    prisma.factura.aggregate({ _sum: { total: true }, where: { fecha: { gte: inicioMes }, pagado: true } }),
    prisma.cliente.count(),
    prisma.repuesto.findMany({
      where: { stock: { lte: 5 } },
      select: { id: true, nombre: true, stock: true, stockMinimo: true },
    }),
    prisma.cita.count({
      where: {
        fecha: { gte: new Date(hoy.setHours(0,0,0,0)), lte: new Date(hoy.setHours(23,59,59,999)) },
        estado: { in: ['PENDIENTE', 'CONFIRMADA'] },
      },
    }),
    prisma.lead.count({ where: { estado: 'SIN_RESPONDER' } }),
    prisma.mantenimiento.findMany({
      where: { fechaProximo: { lte: en30Dias, gte: new Date() } },
      include: { vehiculo: { include: { cliente: true } } },
      orderBy: { fechaProximo: 'asc' },
      take: 5,
    }),
    prisma.cotizacion.count({ where: { estado: { in: ['BORRADOR', 'ENVIADA'] } } }),
  ]);

  res.json({
    totalOTAbiertas,
    totalOTMes,
    ingresosMes: Number(ingresosMes._sum.total) || 0,
    clientesTotal,
    repuestosBajoStock,
    citasHoy,
    leadssinResponder,
    mantenimientosProximos,
    cotizacionesPendientes,
  });
}

async function ingresosPorPeriodo(req, res) {
  const { desde, hasta } = req.query;
  const facturas = await prisma.factura.findMany({
    where: {
      pagado: true,
      fecha: {
        gte: desde ? new Date(desde) : undefined,
        lte: hasta ? new Date(hasta) : undefined,
      },
    },
    include: { orden: { include: { vehiculo: { include: { cliente: true } } } } },
    orderBy: { fecha: 'desc' },
  });

  const total = facturas.reduce((s, f) => s + Number(f.total), 0);
  res.json({ facturas, total });
}

async function otPorEstado(req, res) {
  const estados = ['RECIBIDO', 'DIAGNOSTICO', 'REPARACION', 'LISTO', 'ENTREGADO', 'CANCELADO'];
  const conteos = await Promise.all(
    estados.map(async (estado) => ({
      estado,
      cantidad: await prisma.ordenTrabajo.count({ where: { estado } }),
    }))
  );
  res.json(conteos);
}

async function mecanicosProductivos(req, res) {
  const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const empleados = await prisma.empleado.findMany({
    where: { activo: true },
    include: {
      ordenes: {
        where: { createdAt: { gte: inicioMes } },
        select: { id: true, estado: true },
      },
    },
  });
  const resultado = empleados.map(e => ({
    id: e.id,
    nombre: e.nombre,
    especialidad: e.especialidad,
    totalOrdenes: e.ordenes.length,
    entregadas: e.ordenes.filter(o => o.estado === 'ENTREGADO').length,
    activas: e.ordenes.filter(o => !['ENTREGADO', 'CANCELADO'].includes(o.estado)).length,
  })).sort((a, b) => b.totalOrdenes - a.totalOrdenes);
  res.json(resultado);
}

async function topClientes(req, res) {
  const clientes = await prisma.cliente.findMany({
    include: {
      vehiculos: {
        include: {
          ordenes: {
            include: { factura: true },
          },
        },
      },
    },
  });
  const resultado = clientes.map(c => {
    const ordenes = c.vehiculos.flatMap(v => v.ordenes);
    const facturas = ordenes.flatMap(o => o.factura ? [o.factura] : []);
    const totalGastado = facturas.reduce((s, f) => s + Number(f.total), 0);
    return {
      id: c.id,
      nombre: c.nombre,
      telefono: c.telefono,
      totalOrdenes: ordenes.length,
      totalGastado,
      vehiculos: c.vehiculos.length,
    };
  }).filter(c => c.totalOrdenes > 0).sort((a, b) => b.totalGastado - a.totalGastado).slice(0, 10);
  res.json(resultado);
}

async function exportarCSV(req, res) {
  const { tipo = 'facturas', desde, hasta } = req.query;

  if (tipo === 'facturas') {
    const facturas = await prisma.factura.findMany({
      where: {
        pagado: true,
        ...(desde || hasta ? { fecha: { gte: desde ? new Date(desde) : undefined, lte: hasta ? new Date(hasta) : undefined } } : {}),
      },
      include: { orden: { include: { vehiculo: { include: { cliente: true } } } } },
      orderBy: { fecha: 'desc' },
    });

    const rows = [
      ['ID', 'Fecha', 'Cliente', 'Vehículo', 'Subtotal', 'Total', 'Método', 'OT#'],
      ...facturas.map(f => [
        f.id, new Date(f.fecha).toLocaleDateString('es'),
        f.orden?.vehiculo?.cliente?.nombre || '',
        f.orden?.vehiculo?.placa || '',
        Number(f.subtotal).toFixed(2),
        Number(f.total).toFixed(2),
        f.metodoPago,
        f.ordenId,
      ]),
    ];

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="facturas.csv"');
    return res.send('﻿' + rows.map(r => r.join(',')).join('\n'));
  }

  if (tipo === 'clientes') {
    const clientes = await prisma.cliente.findMany({
      include: { _count: { select: { vehiculos: true } } },
      orderBy: { nombre: 'asc' },
    });
    const rows = [
      ['ID', 'Nombre', 'Teléfono', 'Correo', 'Dirección', 'Vehículos'],
      ...clientes.map(c => [c.id, c.nombre, c.telefono || '', c.correo || '', c.direccion || '', c._count.vehiculos]),
    ];
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="clientes.csv"');
    return res.send('﻿' + rows.map(r => r.join(',')).join('\n'));
  }

  if (tipo === 'stock') {
    const repuestos = await prisma.repuesto.findMany({ orderBy: { nombre: 'asc' } });
    const rows = [
      ['ID', 'Código', 'Nombre', 'Stock', 'Stock Mínimo', 'Precio Costo', 'Precio Venta'],
      ...repuestos.map(r => [r.id, r.codigo || '', r.nombre, r.stock, r.stockMinimo, Number(r.precioCosto).toFixed(2), Number(r.precioVenta).toFixed(2)]),
    ];
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="inventario.csv"');
    return res.send('﻿' + rows.map(r => r.join(',')).join('\n'));
  }

  res.status(400).json({ error: 'tipo inválido. Usa: facturas, clientes, stock' });
}

async function busquedaGlobal(req, res) {
  const { q } = req.query;
  if (!q || q.length < 2) return res.json({ clientes: [], vehiculos: [], ordenes: [] });

  const [clientes, vehiculos, ordenes] = await Promise.all([
    prisma.cliente.findMany({
      where: { OR: [{ nombre: { contains: q, mode: 'insensitive' } }, { telefono: { contains: q } }] },
      take: 5,
    }),
    prisma.vehiculo.findMany({
      where: { OR: [{ placa: { contains: q, mode: 'insensitive' } }, { marca: { contains: q, mode: 'insensitive' } }, { modelo: { contains: q, mode: 'insensitive' } }] },
      include: { cliente: true },
      take: 5,
    }),
    prisma.ordenTrabajo.findMany({
      where: { OR: [{ descripcionProblema: { contains: q, mode: 'insensitive' } }, { id: isNaN(Number(q)) ? undefined : Number(q) }] },
      include: { vehiculo: { include: { cliente: true } } },
      take: 5,
    }),
  ]);

  res.json({ clientes, vehiculos, ordenes });
}

module.exports = { dashboard, ingresosPorPeriodo, otPorEstado, busquedaGlobal, exportarCSV, mecanicosProductivos, topClientes };
