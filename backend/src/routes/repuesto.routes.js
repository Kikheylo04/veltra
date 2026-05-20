const router = require('express').Router();
const ctrl = require('../services/repuesto.service');
const { authMiddleware, requireRole } = require('../middlewares/auth.middleware');

router.use(authMiddleware);
router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.post('/', requireRole('ADMIN', 'RECEPCIONISTA'), ctrl.create);
router.put('/:id', requireRole('ADMIN', 'RECEPCIONISTA'), ctrl.update);
router.patch('/:id/stock', requireRole('ADMIN', 'RECEPCIONISTA'), ctrl.ajustarStock);

module.exports = router;
