const router = require('express').Router();
const svc = require('../services/meta.service');
const { authMiddleware, requireRole } = require('../middlewares/auth.middleware');

router.use(authMiddleware);
router.get('/', svc.getAll);
router.get('/resumen', svc.resumen);
router.post('/', requireRole('ADMIN'), svc.upsert);
router.patch('/:id/real', svc.actualizarReal);

module.exports = router;
