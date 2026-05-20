require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const authRoutes = require('./routes/auth.routes');
const clienteRoutes = require('./routes/cliente.routes');
const vehiculoRoutes = require('./routes/vehiculo.routes');
const empleadoRoutes = require('./routes/empleado.routes');
const ordenRoutes = require('./routes/orden.routes');
const repuestoRoutes = require('./routes/repuesto.routes');
const proveedorRoutes = require('./routes/proveedor.routes');
const facturaRoutes = require('./routes/factura.routes');
const reporteRoutes = require('./routes/reporte.routes');
const leadRoutes = require('./routes/lead.routes');
const plantillaRoutes = require('./routes/plantilla.routes');
const cajaRoutes = require('./routes/caja.routes');
const diagnosticoRoutes = require('./routes/diagnostico.routes');
const cotizacionRoutes = require('./routes/cotizacion.routes');
const citaRoutes = require('./routes/cita.routes');
const garantiaRoutes = require('./routes/garantia.routes');
const mantenimientoRoutes = require('./routes/mantenimiento.routes');
const metaRoutes = require('./routes/meta.routes');
const sucursalRoutes = require('./routes/sucursal.routes');
const servicioRapidoRoutes = require('./routes/serviciorapido.routes');
const configRoutes = require('./routes/config.routes');
const usuarioRoutes = require('./routes/usuario.routes');
const logRoutes = require('./routes/log.routes');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/clientes', clienteRoutes);
app.use('/api/vehiculos', vehiculoRoutes);
app.use('/api/empleados', empleadoRoutes);
app.use('/api/ordenes', ordenRoutes);
app.use('/api/repuestos', repuestoRoutes);
app.use('/api/proveedores', proveedorRoutes);
app.use('/api/facturas', facturaRoutes);
app.use('/api/reportes', reporteRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/plantillas', plantillaRoutes);
app.use('/api/caja', cajaRoutes);
app.use('/api/diagnostico', diagnosticoRoutes);
app.use('/api/cotizaciones', cotizacionRoutes);
app.use('/api/citas', citaRoutes);
app.use('/api/garantias', garantiaRoutes);
app.use('/api/mantenimientos', mantenimientoRoutes);
app.use('/api/metas', metaRoutes);
app.use('/api/sucursales', sucursalRoutes);
app.use('/api/servicios-rapidos', servicioRapidoRoutes);
app.use('/api/config', configRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/logs', logRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'OK', timestamp: new Date() }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Error interno del servidor' });
});

app.listen(PORT, () => console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`));
