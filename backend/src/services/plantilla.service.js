const prisma = require('../utils/prisma');

const PLANTILLAS_DEFAULT = [
  { nombre: 'Bienvenida', categoria: 'recepcion', contenido: 'Hola {nombre}, bienvenido a Veltra Taller Mecánico. Somos {taller}, ¿en qué podemos ayudarte hoy?' },
  { nombre: 'Confirmación de cita', categoria: 'citas', contenido: 'Hola {nombre}, confirmamos tu cita para el {fecha} a las {hora}. Te esperamos en {taller}. 🔧' },
  { nombre: 'Recordatorio de cita', categoria: 'citas', contenido: 'Hola {nombre}, te recordamos que mañana tienes una cita con nosotros a las {hora}. ¡Te esperamos!' },
  { nombre: 'Diagnóstico listo', categoria: 'ordenes', contenido: 'Hola {nombre}, ya tenemos el diagnóstico de tu {vehiculo}. ¿Puedes venir o te enviamos el presupuesto por aquí?' },
  { nombre: 'Cotización enviada', categoria: 'cotizaciones', contenido: 'Hola {nombre}, te enviamos la cotización para tu {vehiculo} por un total de {monto}. ¿Tienes alguna pregunta?' },
  { nombre: 'Trabajo iniciado', categoria: 'ordenes', contenido: 'Hola {nombre}, ya iniciamos el trabajo en tu {vehiculo}. Te avisamos cuando esté listo. 🔩' },
  { nombre: 'Vehículo listo', categoria: 'ordenes', contenido: '¡Buenas noticias! Tu {vehiculo} ya está listo para recoger en {taller}. El total a pagar es {monto}. 🎉' },
  { nombre: 'Seguimiento post-servicio', categoria: 'seguimiento', contenido: 'Hola {nombre}, han pasado unos días desde que recogiste tu {vehiculo}. ¿Está todo bien? Cualquier duda, aquí estamos.' },
  { nombre: 'Garantía recordatorio', categoria: 'garantia', contenido: 'Hola {nombre}, recuerda que el trabajo realizado en tu {vehiculo} tiene garantía hasta {fecha}. Cualquier inconveniente, contáctanos.' },
  { nombre: 'Mantenimiento próximo', categoria: 'mantenimiento', contenido: 'Hola {nombre}, tu {vehiculo} está próximo a necesitar mantenimiento. ¿Agendamos una cita? 🛠️' },
  { nombre: 'Pago pendiente', categoria: 'facturacion', contenido: 'Hola {nombre}, te recordamos que tienes un pago pendiente de {monto} por el servicio de tu {vehiculo}. ¿Cómo prefieres pagar?' },
  { nombre: 'Solicitar referidos', categoria: 'marketing', contenido: 'Hola {nombre}, espero que estés satisfecho con el servicio. Si conoces alguien que necesite taller, ¡nos ayudarías mucho recomendándonos! 🙏' },
  { nombre: 'Promoción del mes', categoria: 'marketing', contenido: 'Hola {nombre}, este mes tenemos una promoción especial en {servicio}. ¿Te interesa? Agenda tu cita ahora en {taller}.' },
  { nombre: 'Repuesto llegó', categoria: 'inventario', contenido: 'Hola {nombre}, el repuesto que esperábamos para tu {vehiculo} ya llegó. ¿Cuándo puedes traer el carro?' },
  { nombre: 'Retraso en entrega', categoria: 'ordenes', contenido: 'Hola {nombre}, lamentamos informarte que tu {vehiculo} necesita un poco más de tiempo. La nueva fecha estimada es {fecha}. Disculpa el inconveniente.' },
  { nombre: 'Encuesta satisfacción', categoria: 'seguimiento', contenido: 'Hola {nombre}, ¿cómo calificarías el servicio que recibiste en Veltra del 1 al 10? Tu opinión nos ayuda a mejorar. 🌟' },
];

async function getAll(req, res) {
  const { categoria, search } = req.query;
  let plantillas = await prisma.plantillaCRM.findMany({
    where: {
      activa: true,
      ...(categoria ? { categoria } : {}),
      ...(search ? { OR: [{ nombre: { contains: search, mode: 'insensitive' } }, { contenido: { contains: search, mode: 'insensitive' } }] } : {}),
    },
    orderBy: [{ favorita: 'desc' }, { usos: 'desc' }],
  });

  // Si no hay plantillas, crear las default
  if (!plantillas.length && !categoria && !search) {
    await prisma.plantillaCRM.createMany({ data: PLANTILLAS_DEFAULT, skipDuplicates: true });
    plantillas = await prisma.plantillaCRM.findMany({ orderBy: [{ favorita: 'desc' }, { usos: 'desc' }] });
  }

  res.json(plantillas);
}

async function create(req, res) {
  const { nombre, categoria, contenido, variables } = req.body;
  if (!nombre || !contenido) return res.status(400).json({ error: 'nombre y contenido requeridos' });
  const p = await prisma.plantillaCRM.create({ data: { nombre, categoria: categoria || 'general', contenido, variables } });
  res.status(201).json(p);
}

async function update(req, res) {
  const { nombre, categoria, contenido, favorita, activa } = req.body;
  const p = await prisma.plantillaCRM.update({
    where: { id: Number(req.params.id) },
    data: { nombre, categoria, contenido, favorita, activa },
  });
  res.json(p);
}

async function incrementarUso(req, res) {
  const p = await prisma.plantillaCRM.update({
    where: { id: Number(req.params.id) },
    data: { usos: { increment: 1 } },
  });
  res.json(p);
}

module.exports = { getAll, create, update, incrementarUso };
