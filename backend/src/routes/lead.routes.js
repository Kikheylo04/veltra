const router = require('express').Router();
const svc = require('../services/lead.service');
const { authMiddleware } = require('../middlewares/auth.middleware');

router.use(authMiddleware);
router.get('/pipeline', svc.getPipeline);
router.get('/', svc.getAll);
router.get('/:id', svc.getById);
router.post('/', svc.create);
router.put('/:id', svc.update);
router.post('/:id/mensajes', svc.addMensaje);

module.exports = router;
