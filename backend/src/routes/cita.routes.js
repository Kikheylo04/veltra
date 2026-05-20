const router = require('express').Router();
const svc = require('../services/cita.service');
const { authMiddleware } = require('../middlewares/auth.middleware');

router.use(authMiddleware);
router.get('/', svc.getAll);
router.post('/', svc.create);
router.patch('/:id/estado', svc.cambiarEstado);
router.delete('/:id', svc.remove);

module.exports = router;
