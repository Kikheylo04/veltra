const router = require('express').Router();
const svc = require('../services/caja.service');
const { authMiddleware, requireRole } = require('../middlewares/auth.middleware');

router.use(authMiddleware);
router.get('/', svc.getAll);
router.get('/resumen-mensual', svc.resumenMensual);
router.post('/', svc.create);
router.delete('/:id', requireRole('ADMIN'), svc.remove);

module.exports = router;
