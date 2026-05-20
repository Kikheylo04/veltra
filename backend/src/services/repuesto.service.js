const prisma = require('../utils/prisma');

async function getAll(req, res) {
  const { search, bajoStock } = req.query;
  const repuestos = await prisma.repuesto.findMany({
    where: {
      ...(search ? {
        OR: [
          { nombre: { contains: search, mode: 'insensitive' } },
          { codigo: { contains: search, mode: 'insensitive' } },
        ],
      } : {}),
      ...(bajoStock === 'true' ? { stock: { lte: prisma.repuesto.fields.stockMinimo } } : {}),
    },
    include: { proveedor: true },
    orderBy: { nombre: 'asc' },
  });
  res.json(repuestos);
}

async function getById(req, res) {
  const repuesto = await prisma.repuesto.findUnique({
    where: { id: Number(req.params.id) },
    include: { proveedor: true },
  });
  if (!repuesto) return res.status(404).json({ error: 'Repuesto no encontrado' });
  res.json(repuesto);
}

async function create(req, res) {
  const { codigo, nombre, descripcion, precioCosto, precioVenta, stock, stockMinimo, proveedorId } = req.body;
  if (!codigo || !nombre) return res.status(400).json({ error: 'código y nombre son requeridos' });

  const repuesto = await prisma.repuesto.create({
    data: {
      codigo, nombre, descripcion,
      precioCosto: Number(precioCosto) || 0,
      precioVenta: Number(precioVenta) || 0,
      stock: Number(stock) || 0,
      stockMinimo: Number(stockMinimo) || 5,
      proveedorId: proveedorId ? Number(proveedorId) : null,
    },
  });
  res.status(201).json(repuesto);
}

async function update(req, res) {
  const { nombre, descripcion, precioCosto, precioVenta, stock, stockMinimo, proveedorId } = req.body;
  const repuesto = await prisma.repuesto.update({
    where: { id: Number(req.params.id) },
    data: {
      nombre, descripcion,
      ...(precioCosto !== undefined ? { precioCosto: Number(precioCosto) } : {}),
      ...(precioVenta !== undefined ? { precioVenta: Number(precioVenta) } : {}),
      ...(stock !== undefined ? { stock: Number(stock) } : {}),
      ...(stockMinimo !== undefined ? { stockMinimo: Number(stockMinimo) } : {}),
      proveedorId: proveedorId ? Number(proveedorId) : undefined,
    },
  });
  res.json(repuesto);
}

async function ajustarStock(req, res) {
  const { cantidad, tipo } = req.body; // tipo: 'entrada' | 'salida'
  const repuesto = await prisma.repuesto.update({
    where: { id: Number(req.params.id) },
    data: {
      stock: tipo === 'entrada'
        ? { increment: Number(cantidad) }
        : { decrement: Number(cantidad) },
    },
  });
  res.json(repuesto);
}

module.exports = { getAll, getById, create, update, ajustarStock };
