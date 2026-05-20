const prisma = require('../utils/prisma');

const PREGUNTAS = [
  { id: 1, categoria: 'comercial', pregunta: '¿Tienen un proceso definido para dar seguimiento a clientes potenciales?', peso: 10 },
  { id: 2, categoria: 'comercial', pregunta: '¿Registran y analizan las razones por las que pierden clientes?', peso: 8 },
  { id: 3, categoria: 'operacional', pregunta: '¿Tienen tiempos de entrega definidos y los cumplen habitualmente?', peso: 10 },
  { id: 4, categoria: 'operacional', pregunta: '¿Tienen un sistema para gestionar órdenes de trabajo digitalmente?', peso: 9 },
  { id: 5, categoria: 'inventario', pregunta: '¿Controlan el stock de repuestos y reciben alertas de stock mínimo?', peso: 8 },
  { id: 6, categoria: 'inventario', pregunta: '¿Tienen acuerdos con proveedores para precios preferenciales?', peso: 6 },
  { id: 7, categoria: 'financiero', pregunta: '¿Llevan registro diario de ingresos y egresos del taller?', peso: 10 },
  { id: 8, categoria: 'financiero', pregunta: '¿Conocen el margen de ganancia por tipo de servicio?', peso: 9 },
  { id: 9, categoria: 'marketing', pregunta: '¿Tienen presencia en redes sociales activa?', peso: 6 },
  { id: 10, categoria: 'marketing', pregunta: '¿Solicitan y gestionan reseñas de clientes satisfechos?', peso: 7 },
  { id: 11, categoria: 'retencion', pregunta: '¿Hacen seguimiento post-servicio a los clientes?', peso: 8 },
  { id: 12, categoria: 'retencion', pregunta: '¿Tienen algún programa de fidelización o descuentos para clientes frecuentes?', peso: 7 },
  { id: 13, categoria: 'tecnologia', pregunta: '¿Usan algún software para gestionar el taller?', peso: 8 },
  { id: 14, categoria: 'tecnologia', pregunta: '¿Se comunican con clientes por WhatsApp de forma organizada?', peso: 7 },
];

const PUNTAJE_MAX = PREGUNTAS.reduce((s, p) => s + p.peso, 0);

function calcularNivel(pct) {
  if (pct >= 74) return 'Crítico';
  if (pct >= 48) return 'En riesgo';
  if (pct >= 24) return 'Superficie';
  return 'Sin diagnosticar';
}

async function getPreguntas(req, res) {
  res.json({ preguntas: PREGUNTAS, puntajeMax: PUNTAJE_MAX });
}

async function guardar(req, res) {
  const { respuestas, sucursalId, mejoraPct } = req.body;
  if (!respuestas) return res.status(400).json({ error: 'respuestas requeridas' });

  let puntaje = 0;
  PREGUNTAS.forEach(p => {
    if (respuestas[p.id]) puntaje += p.peso;
  });

  const pct = Math.round((puntaje / PUNTAJE_MAX) * 100);
  const nivel = calcularNivel(pct);

  const diag = await prisma.diagnosticoComercial.create({
    data: {
      sucursalId: sucursalId ? Number(sucursalId) : null,
      respuestas,
      puntaje: pct,
      nivel,
      mejoraPct: mejoraPct || 15,
    },
  });

  res.status(201).json({ ...diag, puntajeMax: PUNTAJE_MAX, porcentaje: pct });
}

async function getUltimo(req, res) {
  const diag = await prisma.diagnosticoComercial.findFirst({
    orderBy: { createdAt: 'desc' },
    include: { sucursal: true },
  });
  if (!diag) return res.json(null);
  res.json({ ...diag, puntajeMax: PUNTAJE_MAX });
}

module.exports = { getPreguntas, guardar, getUltimo };
