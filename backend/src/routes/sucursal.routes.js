const router = require('express').Router();
const svc = require('../services/sucursal.service');
const { authMiddleware, requireRole } = require('../middlewares/auth.middleware');

router.use(authMiddleware);
router.get('/', svc.getAll);
router.post('/', requireRole('ADMIN'), svc.create);
router.put('/:id', requireRole('ADMIN'), svc.update);

module.exports = router;
