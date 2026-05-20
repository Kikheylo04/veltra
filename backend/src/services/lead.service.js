const prisma = require('../utils/prisma');

const include = {
  asesor: true,
  sucursal: true,
  mensajes: { orderBy: { createdAt: 'asc' }, take: 50 },
  actividades: { orderBy: { createdAt: 'desc' }, take: 20 },
};

async function getAll(req, res) {
  const { estado, asesorId, search } = req.query;
  const leads = await prisma.lead.findMany({
    where: {
      ...(estado ? { estado } : {}),
      ...(asesorId ? { asesorId: Number(asesorId) } : {}),
      ...(search ? {
        OR: [
          { nombre: { contains: search, mode: 'insensitive' } },
          { telefono: { contains: search } },
          { correo: { contains: search, mode: 'insensitive' } },
        ],
      } : {}),
    },
    include: { asesor: true, sucursal: true, _count: { select: { mensajes: true } } },
    orderBy: { updatedAt: 'desc' },
  });
  res.json(leads);
}

async function getById(req, res) {
  const lead = await prisma.lead.findUnique({
    where: { id: Number(req.params.id) },
    include,
  });
  if (!lead) return res.status(404).json({ error: 'Lead no encontrado' });
  res.json(lead);
}

async function create(req, res) {
  const { nombre, telefono, correo, origen, asesorId, sucursalId, notas, valorEstimado } = req.body;
  if (!nombre) return res.status(400).json({ error: 'Nombre requerido' });

  // Round-robin: si no se asigna asesor, asignar el siguiente disponible
  let asignadoId = asesorId ? Number(asesorId) : null;
  if (!asignadoId) {
    const empleados = await prisma.empleado.findMany({ where: { activo: true }, orderBy: { id: 'asc' } });
    if (empleados.length) {
      const counts = await Promise.all(empleados.map(e => prisma.lead.count({ where: { asesorId: e.id, estado: { notIn: ['GANADO', 'PERDIDO'] } } })));
      const minIdx = counts.indexOf(Math.min(...counts));
      asignadoId = empleados[minIdx].id;
    }
  }

  const lead = await prisma.lead.create({
    data: { nombre, telefono, correo, origen, asesorId: asignadoId, sucursalId: sucursalId ? Number(sucursalId) : null, notas, valorEstimado: valorEstimado ? Number(valorEstimado) : null },
    include: { asesor: true },
  });
  res.status(201).json(lead);
}

async function update(req, res) {
  const { nombre, telefono, correo, origen, estado, asesorId, sucursalId, notas, valorEstimado, conversando } = req.body;
  const data = { nombre, telefono, correo, origen, estado, notas };
  if (asesorId !== undefined) data.asesorId = asesorId ? Number(asesorId) : null;
  if (sucursalId !== undefined) data.sucursalId = sucursalId ? Number(sucursalId) : null;
  if (valorEstimado !== undefined) data.valorEstimado = valorEstimado ? Number(valorEstimado) : null;
  if (conversando !== undefined) {
    data.conversando = conversando;
    if (!conversando) data.conversandoStoppedAt = new Date();
  }

  const lead = await prisma.lead.update({ where: { id: Number(req.params.id) }, data, include: { asesor: true } });
  res.json(lead);
}

async function addMensaje(req, res) {
  const { contenido, entrante } = req.body;
  const leadId = Number(req.params.id);

  const [mensaje] = await prisma.$transaction([
    prisma.mensajeCRM.create({ data: { leadId, contenido, entrante: entrante ?? false, tipo: 'text' } }),
    prisma.lead.update({ where: { id: leadId }, data: { updatedAt: new Date() } }),
  ]);

  // Auto-cambio a CONTACTADO en primer mensaje saliente
  if (!entrante) {
    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (lead?.estado === 'NUEVO') {
      await prisma.lead.update({ where: { id: leadId }, data: { estado: 'CONTACTADO', firstResponseAt: new Date() } });
    }
  }

  res.status(201).json(mensaje);
}

async function getPipeline(req, res) {
  const estados = ['NUEVO', 'CONTACTADO', 'CALIFICADO', 'COTIZACION', 'NEGOCIACION', 'GANADO', 'PERDIDO', 'SIN_RESPONDER'];
  const pipeline = await Promise.all(
    estados.map(async (estado) => {
      const leads = await prisma.lead.findMany({
        where: { estado },
        include: { asesor: true },
        orderBy: { updatedAt: 'desc' },
      });
      const valorTotal = leads.reduce((s, l) => s + Number(l.valorEstimado || 0), 0);
      return { estado, leads, cantidad: leads.length, valorTotal };
    })
  );
  res.json(pipeline);
}

module.exports = { getAll, getById, create, update, addMensaje, getPipeline };
