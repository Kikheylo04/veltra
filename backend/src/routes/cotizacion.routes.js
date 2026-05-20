const router = require('express').Router();
const svc = require('../services/cotizacion.service');
const { authMiddleware } = require('../middlewares/auth.middleware');

router.use(authMiddleware);
router.get('/', svc.getAll);
router.get('/:id', svc.getById);
router.post('/', svc.create);
router.patch('/:id/estado', svc.cambiarEstado);
router.post('/:id/items', svc.addItem);
router.delete('/:id/items/:itemId', svc.removeItem);

module.exports = router;
