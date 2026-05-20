const router = require('express').Router();
const ctrl = require('../services/reporte.service');
const { authMiddleware, requireRole } = require('../middlewares/auth.middleware');

router.use(authMiddleware);
router.get('/dashboard', ctrl.dashboard);
router.get('/ingresos', requireRole('ADMIN'), ctrl.ingresosPorPeriodo);
router.get('/ot-estados', ctrl.otPorEstado);
router.get('/busqueda', ctrl.busquedaGlobal);
router.get('/exportar', requireRole('ADMIN'), ctrl.exportarCSV);
router.get('/mecanicos', ctrl.mecanicosProductivos);
router.get('/top-clientes', ctrl.topClientes);

module.exports = router;

