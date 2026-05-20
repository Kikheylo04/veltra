const router = require('express').Router();
const svc = require('../services/serviciorapido.service');
const { authMiddleware } = require('../middlewares/auth.middleware');

router.use(authMiddleware);
router.get('/', svc.getAll);
router.post('/', svc.create);
router.put('/:id', svc.update);
router.post('/:id/uso', svc.incrementarUso);

module.exports = router;
