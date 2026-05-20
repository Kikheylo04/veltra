const router = require('express').Router();
const svc = require('../services/mantenimiento.service');
const { authMiddleware } = require('../middlewares/auth.middleware');

router.use(authMiddleware);
router.get('/', svc.getAll);
router.get('/proximos', svc.getProximos);
router.post('/', svc.create);

module.exports = router;
