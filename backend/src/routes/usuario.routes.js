const router = require('express').Router();
const svc = require('../services/usuario.service');
const { authMiddleware, requireRole } = require('../middlewares/auth.middleware');

router.use(authMiddleware);
router.get('/me', svc.miPerfil);
router.get('/', requireRole('ADMIN'), svc.getAll);
router.post('/', requireRole('ADMIN'), svc.create);
router.put('/:id', requireRole('ADMIN'), svc.update);
router.patch('/:id/password', requireRole('ADMIN'), svc.resetPassword);
router.patch('/me/password', svc.cambiarMiPassword);

module.exports = router;
