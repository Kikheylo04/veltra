const router = require('express').Router();
const ctrl = require('../services/orden.service');
const { authMiddleware } = require('../middlewares/auth.middleware');

router.use(authMiddleware);
router.get('/mis-ordenes', ctrl.misOrdenes);
router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.post('/', ctrl.create);
router.put('/:id', ctrl.update);
router.patch('/:id/estado', ctrl.cambiarEstado);
router.post('/:id/servicios', ctrl.addServicio);
router.delete('/:id/servicios/:servicioId', ctrl.removeServicio);
router.post('/:id/repuestos', ctrl.addRepuesto);
router.delete('/:id/repuestos/:repuestoId', ctrl.removeRepuesto);

module.exports = router;
