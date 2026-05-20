const router = require('express').Router();
const ctrl = require('../services/factura.service');
const { authMiddleware } = require('../middlewares/auth.middleware');

router.use(authMiddleware);
router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.post('/orden/:ordenId', ctrl.generarDesdeOrden);
router.patch('/:id/pagar', ctrl.marcarPagada);

module.exports = router;
